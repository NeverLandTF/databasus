package usecases_kingbase

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"

	"databasus-backend/internal/config"
	backups_core_enums "databasus-backend/internal/features/backups/backups/core/enums"
	backups_core_logical "databasus-backend/internal/features/backups/backups/core/logical"
	"databasus-backend/internal/features/backups/backups/encryption"
	backups_config_logical "databasus-backend/internal/features/backups/config/logical"
	"databasus-backend/internal/features/databases"
	kingbasetypes "databasus-backend/internal/features/databases/databases/kingbase/logical"
	postgresql_shared "databasus-backend/internal/features/databases/databases/postgresql/shared"
	encryption_secrets "databasus-backend/internal/features/encryption/secrets"
	restores_core "databasus-backend/internal/features/restores/core"
	"databasus-backend/internal/features/storages"
	util_encryption "databasus-backend/internal/util/encryption"
	"databasus-backend/internal/util/tools"
)

type RestoreKingbaseBackupUsecase struct {
	logger           *slog.Logger
	secretKeyService *encryption_secrets.SecretKeyService
}

func (uc *RestoreKingbaseBackupUsecase) Execute(
	parentCtx context.Context,
	originalDB *databases.Database,
	restoringToDB *databases.Database,
	backupConfig *backups_config_logical.LogicalBackupConfig,
	restore restores_core.Restore,
	backup *backups_core_logical.LogicalBackup,
	storage *storages.Storage,
	options restores_core.RestoreOptions,
) error {
	if originalDB.Type != databases.DatabaseTypeKingbaseLogical {
		return errors.New("database type not supported")
	}

	uc.logger.Info(
		"Restoring Kingbase backup via sys_restore",
		"restoreId",
		restore.ID,
		"backupId",
		backup.ID,
	)

	kingbase := restoringToDB.KingbaseLogical
	if kingbase == nil {
		return fmt.Errorf("kingbase configuration is required for restore")
	}

	if kingbase.Database == nil || *kingbase.Database == "" {
		return fmt.Errorf("target database name is required for sys_restore")
	}

	sysBin := tools.GetPostgresqlExecutable(kingbase.Version, "sys_restore")

	// All Kingbase backups are custom format (-Fc)
	return uc.restoreCustomType(
		parentCtx,
		originalDB,
		sysBin,
		backup,
		storage,
		kingbase,
		options,
	)
}

// restoreCustomType restores a backup in custom type (-Fc)
func (uc *RestoreKingbaseBackupUsecase) restoreCustomType(
	parentCtx context.Context,
	originalDB *databases.Database,
	sysBin string,
	backup *backups_core_logical.LogicalBackup,
	storage *storages.Storage,
	kingbase *kingbasetypes.KingbaseLogicalDatabase,
	options restores_core.RestoreOptions,
) error {
	uc.logger.Info(
		"Restoring backup in custom type (-Fc)",
		"backupId",
		backup.ID,
		"cpuCount",
		kingbase.CpuCount,
	)

	// File-based restore for parallel jobs (multiple CPUs) or any TOC filtering (extension exclusion
	// or skipping user mappings needs a TOC file); otherwise stream directly via stdin.
	runRestore := func() error {
		if options.IsExcludeExtensions || options.IsSkipUserMappings || kingbase.CpuCount > 1 {
			return uc.restoreViaFile(parentCtx, originalDB, sysBin, backup, storage, kingbase, options)
		}

		return uc.restoreViaStdin(parentCtx, originalDB, sysBin, backup, storage, kingbase)
	}

	return runRestore()
}

// restoreViaStdin streams backup via stdin for single CPU restore
func (uc *RestoreKingbaseBackupUsecase) restoreViaStdin(
	parentCtx context.Context,
	originalDB *databases.Database,
	sysBin string,
	backup *backups_core_logical.LogicalBackup,
	storage *storages.Storage,
	kingbase *kingbasetypes.KingbaseLogicalDatabase,
) error {
	uc.logger.Info("Restoring via stdin streaming (CPU=1)", "backupId", backup.ID)

	args := []string{
		"-Fc", // expect custom type
		"--no-password",
		"-h", kingbase.Host,
		"-p", strconv.Itoa(kingbase.Port),
		"-U", kingbase.Username,
		"-d", *kingbase.Database,
		"--verbose",
	}
	// --clean would DROP EXTENSION timescaledb, taking the catalog tables that pre_restore needs
	// with it; TimescaleDB restores into a clean target without it. Non-timescaledb keeps --clean.
	args = append(args, "--clean", "--if-exists")
	if !kingbase.IsRestoreOwnership {
		args = append(args, "--no-owner")
	}
	if !kingbase.IsRestorePrivileges {
		args = append(args, "--no-acl")
	}

	ctx, cancel := context.WithTimeout(parentCtx, 23*time.Hour)
	defer cancel()

	// Monitor for shutdown and parent cancellation
	go func() {
		ticker := time.NewTicker(1 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-parentCtx.Done():
				cancel()
				return
			case <-ticker.C:
				if config.IsShouldShutdown() {
					cancel()
					return
				}
			}
		}
	}()

	// Materialize connection credentials (.pgpass + optional client certificates)
	fieldEncryptor := util_encryption.GetFieldEncryptor()
	decryptedPassword, err := fieldEncryptor.Decrypt(kingbase.Password)
	if err != nil {
		return fmt.Errorf("failed to decrypt password: %w", err)
	}

	credentials, err := postgresql_shared.WriteCredentialFilesToTempDir(
		kingbase.CredentialSpec(), decryptedPassword, fieldEncryptor)
	if err != nil {
		return fmt.Errorf("failed to create credential files: %w", err)
	}
	defer credentials.Remove()

	// Get backup stream from storage
	rawReader, err := storage.GetFile(fieldEncryptor, backup.FileName)
	if err != nil {
		return fmt.Errorf("failed to get backup file from storage: %w", err)
	}
	defer func() {
		if err := rawReader.Close(); err != nil {
			uc.logger.Error("Failed to close backup reader", "error", err)
		}
	}()

	var backupReader io.Reader = rawReader
	if backup.Encryption == backups_core_enums.BackupEncryptionEncrypted {
		// Validate encryption metadata
		if backup.EncryptionSalt == nil || backup.EncryptionIV == nil {
			return fmt.Errorf("backup is encrypted but missing encryption metadata")
		}

		// Get master key
		masterKey, err := uc.secretKeyService.GetSecretKey()
		if err != nil {
			return fmt.Errorf("failed to get master key for decryption: %w", err)
		}

		// Decode salt and IV from base64
		salt, err := base64.StdEncoding.DecodeString(*backup.EncryptionSalt)
		if err != nil {
			return fmt.Errorf("failed to decode encryption salt: %w", err)
		}

		iv, err := base64.StdEncoding.DecodeString(*backup.EncryptionIV)
		if err != nil {
			return fmt.Errorf("failed to decode encryption IV: %w", err)
		}

		// Create decryption reader
		backupReader, err = encryption.CreateDecryptionReader(rawReader, masterKey, salt, iv)
		if err != nil {
			return fmt.Errorf("failed to create decryption reader: %w", err)
		}
	}

	cmd := exec.CommandContext(ctx, sysBin, args...)
	uc.logger.Info("Executing Kingbase restore command", "command", cmd.String())

	// Setup environment variables
	uc.setupSysRestoreEnvironment(cmd, credentials, kingbase)

	// Verify executable exists and is accessible
	if _, err := exec.LookPath(sysBin); err != nil {
		return fmt.Errorf(
			"Kingbase executable not found or not accessible: %s - %w",
			sysBin,
			err,
		)
	}

	// Pipe backup data to stdin
	sysStdin, err := cmd.StdinPipe()
	if err != nil {
		return fmt.Errorf("stdin pipe: %w", err)
	}

	// Capture stderr to capture any error output
	sysStderr, err := cmd.StderrPipe()
	if err != nil {
		return fmt.Errorf("stderr pipe: %w", err)
	}

	// Capture stderr in a separate goroutine
	stderrCh := make(chan []byte, 1)
	go func() {
		stderrOutput, _ := io.ReadAll(sysStderr)
		stderrCh <- stderrOutput
	}()

	// Start sys_restore
	if err = cmd.Start(); err != nil {
		return fmt.Errorf("start %s: %w", filepath.Base(sysBin), err)
	}

	// Stream backup data to stdin
	copyErr := uc.copyToStdin(ctx, sysStdin, backupReader)

	// Close stdin pipe to signal EOF to sys_restore - critical for proper termination
	if closeErr := sysStdin.Close(); closeErr != nil && copyErr == nil {
		copyErr = fmt.Errorf("failed to close stdin: %w", closeErr)
	}

	// Wait for the restore to finish
	waitErr := cmd.Wait()
	stderrOutput := <-stderrCh

	// Check for cancellation
	select {
	case <-ctx.Done():
		if errors.Is(ctx.Err(), context.Canceled) {
			return fmt.Errorf("restore cancelled")
		}
	default:
	}

	// Check for shutdown before finalizing
	if config.IsShouldShutdown() {
		return fmt.Errorf("restore cancelled due to shutdown")
	}

	if waitErr != nil || copyErr != nil {
		// Check for cancellation again
		select {
		case <-ctx.Done():
			if errors.Is(ctx.Err(), context.Canceled) {
				return fmt.Errorf("restore cancelled")
			}
		default:
		}

		if config.IsShouldShutdown() {
			return fmt.Errorf("restore cancelled due to shutdown")
		}

		if copyErr != nil {
			return fmt.Errorf("failed to stream backup data to sys_restore: %w", copyErr)
		}

		return uc.handleSysRestoreError(originalDB, waitErr, stderrOutput, sysBin, args, kingbase)
	}

	return nil
}

// restoreViaFile restores backup using a temporary file for parallel jobs
func (uc *RestoreKingbaseBackupUsecase) restoreViaFile(
	parentCtx context.Context,
	originalDB *databases.Database,
	sysBin string,
	backup *backups_core_logical.LogicalBackup,
	storage *storages.Storage,
	kingbase *kingbasetypes.KingbaseLogicalDatabase,
	options restores_core.RestoreOptions,
) error {
	uc.logger.Info(
		"Restoring via file with parallel jobs",
		"backupId",
		backup.ID,
		"cpuCount",
		kingbase.CpuCount,
	)

	// Cap between 1 and 8.
	parallelJobs := max(1, min(kingbase.CpuCount, 8))

	args := []string{
		"-Fc",                            // expect custom type
		"-j", strconv.Itoa(parallelJobs), // parallel jobs based on CPU count
		"--no-password",
		"-h", kingbase.Host,
		"-p", strconv.Itoa(kingbase.Port),
		"-U", kingbase.Username,
		"-d", *kingbase.Database,
		"--verbose",
	}
	args = append(args, "--clean", "--if-exists")
	if !kingbase.IsRestoreOwnership {
		args = append(args, "--no-owner")
	}
	if !kingbase.IsRestorePrivileges {
		args = append(args, "--no-acl")
	}

	return uc.restoreFromStorage(
		parentCtx,
		originalDB,
		sysBin,
		args,
		kingbase.Password,
		backup,
		storage,
		kingbase,
		options,
	)
}

// restoreFromStorage restores backup data from storage using sys_restore
func (uc *RestoreKingbaseBackupUsecase) restoreFromStorage(
	parentCtx context.Context,
	database *databases.Database,
	sysBin string,
	args []string,
	password string,
	backup *backups_core_logical.LogicalBackup,
	storage *storages.Storage,
	kingbaseConfig *kingbasetypes.KingbaseLogicalDatabase,
	options restores_core.RestoreOptions,
) error {
	uc.logger.Info(
		"Restoring Kingbase backup from storage via temporary file",
		"sysBin",
		sysBin,
		"args",
		args,
		"isExcludeExtensions",
		options.IsExcludeExtensions,
		"isSkipUserMappings",
		options.IsSkipUserMappings,
	)

	ctx, cancel := context.WithTimeout(parentCtx, 23*time.Hour)
	defer cancel()

	// Monitor for shutdown and parent cancellation
	go func() {
		ticker := time.NewTicker(1 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-parentCtx.Done():
				cancel()
				return
			case <-ticker.C:
				if config.IsShouldShutdown() {
					cancel()
					return
				}
			}
		}
	}()

	// Materialize connection credentials (.pgpass + optional client certificates)
	credentials, err := postgresql_shared.WriteCredentialFilesToTempDir(
		kingbaseConfig.CredentialSpec(),
		password,
		util_encryption.GetFieldEncryptor(),
	)
	if err != nil {
		return fmt.Errorf("failed to create credential files: %w", err)
	}
	defer credentials.Remove()

	// Download backup to temporary file
	tempBackupFile, cleanupFunc, err := uc.downloadBackupToTempFile(ctx, backup, storage)
	if err != nil {
		return fmt.Errorf("failed to download backup to temporary file: %w", err)
	}
	defer cleanupFunc()

	// Add the temporary backup file as the last argument to sys_restore
	args = append(args, tempBackupFile)

	// Generate filtered TOC list if needed
	if options.IsExcludeExtensions || options.IsSkipUserMappings {
		tocFile, err := uc.generateFilteredTocList(
			ctx,
			sysBin,
			tempBackupFile,
			credentials,
			kingbaseConfig,
			options,
		)
		if err != nil {
			return fmt.Errorf("failed to generate filtered TOC list: %w", err)
		}
		defer os.Remove(tocFile)

		args = append(args, "-L", tocFile)
		uc.logger.Info("Using filtered TOC list", "tocFile", tocFile)
	}

	return uc.executeSysRestore(ctx, database, sysBin, args, credentials, kingbaseConfig)
}

// downloadBackupToTempFile downloads backup from storage to a temporary file
func (uc *RestoreKingbaseBackupUsecase) downloadBackupToTempFile(
	ctx context.Context,
	backup *backups_core_logical.LogicalBackup,
	storage *storages.Storage,
) (string, func(), error) {
	fieldEncryptor := util_encryption.GetFieldEncryptor()

	tempFile, err := os.CreateTemp(config.GetEnv().TempFolder, "kingbase_restore_*.backup")
	if err != nil {
		return "", nil, fmt.Errorf("failed to create temporary file: %w", err)
	}
	tempFilePath := tempFile.Name()

	rawReader, err := storage.GetFile(fieldEncryptor, backup.FileName)
	if err != nil {
		_ = tempFile.Close()
		_ = os.Remove(tempFilePath)
		return "", nil, fmt.Errorf("failed to get backup file from storage: %w", err)
	}
	defer func() {
		if err := rawReader.Close(); err != nil {
			uc.logger.Error("Failed to close backup reader", "error", err)
		}
	}()

	var backupReader io.Reader = rawReader
	if backup.Encryption == backups_core_enums.BackupEncryptionEncrypted {
		// Validate encryption metadata
		if backup.EncryptionSalt == nil || backup.EncryptionIV == nil {
			_ = tempFile.Close()
			_ = os.Remove(tempFilePath)
			return "", nil, fmt.Errorf("backup is encrypted but missing encryption metadata")
		}

		// Get master key
		masterKey, err := uc.secretKeyService.GetSecretKey()
		if err != nil {
			_ = tempFile.Close()
			_ = os.Remove(tempFilePath)
			return "", nil, fmt.Errorf("failed to get master key for decryption: %w", err)
		}

		// Decode salt and IV from base64
		salt, err := base64.StdEncoding.DecodeString(*backup.EncryptionSalt)
		if err != nil {
			_ = tempFile.Close()
			_ = os.Remove(tempFilePath)
			return "", nil, fmt.Errorf("failed to decode encryption salt: %w", err)
		}

		iv, err := base64.StdEncoding.DecodeString(*backup.EncryptionIV)
		if err != nil {
			_ = tempFile.Close()
			_ = os.Remove(tempFilePath)
			return "", nil, fmt.Errorf("failed to decode encryption IV: %w", err)
		}

		// Create decryption reader
		backupReader, err = encryption.CreateDecryptionReader(rawReader, masterKey, salt, iv)
		if err != nil {
			_ = tempFile.Close()
			_ = os.Remove(tempFilePath)
			return "", nil, fmt.Errorf("failed to create decryption reader: %w", err)
		}
	}

	_, err = io.Copy(tempFile, backupReader)
	if err != nil {
		_ = tempFile.Close()
		_ = os.Remove(tempFilePath)
		return "", nil, fmt.Errorf("failed to write backup to temporary file: %w", err)
	}

	if err := tempFile.Close(); err != nil {
		_ = os.Remove(tempFilePath)
		return "", nil, fmt.Errorf("failed to close temporary file: %w", err)
	}

	cleanupFunc := func() {
		if err := os.Remove(tempFilePath); err != nil {
			uc.logger.Error("Failed to remove temporary backup file", "error", err)
		}
	}

	uc.logger.Info("Downloaded backup to temporary file", "tempFile", tempFilePath)
	return tempFilePath, cleanupFunc, nil
}

// executeSysRestore executes the sys_restore command with proper environment setup
func (uc *RestoreKingbaseBackupUsecase) executeSysRestore(
	ctx context.Context,
	database *databases.Database,
	sysBin string,
	args []string,
	credentials *postgresql_shared.CredentialTempFiles,
	kingbaseConfig *kingbasetypes.KingbaseLogicalDatabase,
) error {
	cmd := exec.CommandContext(ctx, sysBin, args...)
	uc.logger.Info("Executing Kingbase restore command", "command", cmd.String())

	// Setup environment variables
	uc.setupSysRestoreEnvironment(cmd, credentials, kingbaseConfig)

	// Verify executable exists and is accessible
	if _, err := exec.LookPath(sysBin); err != nil {
		return fmt.Errorf(
			"Kingbase executable not found or not accessible: %s - %w",
			sysBin,
			err,
		)
	}

	// Get stderr to capture any error output
	sysStderr, err := cmd.StderrPipe()
	if err != nil {
		return fmt.Errorf("stderr pipe: %w", err)
	}

	// Capture stderr in a separate goroutine
	stderrCh := make(chan []byte, 1)
	go func() {
		stderrOutput, _ := io.ReadAll(sysStderr)
		stderrCh <- stderrOutput
	}()

	// Start sys_restore
	if err = cmd.Start(); err != nil {
		return fmt.Errorf("start %s: %w", filepath.Base(sysBin), err)
	}

	// Wait for the restore to finish
	waitErr := cmd.Wait()
	stderrOutput := <-stderrCh

	// Check for cancellation
	select {
	case <-ctx.Done():
		if errors.Is(ctx.Err(), context.Canceled) {
			return fmt.Errorf("restore cancelled")
		}
	default:
	}

	// Check for shutdown before finalizing
	if config.IsShouldShutdown() {
		return fmt.Errorf("restore cancelled due to shutdown")
	}

	if waitErr != nil {
		// Check for cancellation again
		select {
		case <-ctx.Done():
			if errors.Is(ctx.Err(), context.Canceled) {
				return fmt.Errorf("restore cancelled")
			}
		default:
		}

		if config.IsShouldShutdown() {
			return fmt.Errorf("restore cancelled due to shutdown")
		}

		return uc.handleSysRestoreError(database, waitErr, stderrOutput, sysBin, args, kingbaseConfig)
	}

	return nil
}

// setupSysRestoreEnvironment configures environment variables for sys_restore
func (uc *RestoreKingbaseBackupUsecase) setupSysRestoreEnvironment(
	cmd *exec.Cmd,
	credentials *postgresql_shared.CredentialTempFiles,
	kingbaseConfig *kingbasetypes.KingbaseLogicalDatabase,
) {
	cmd.Env = os.Environ()

	cmd.Env = append(cmd.Env, "PGPASSFILE="+credentials.PgpassPath)
	uc.logger.Info(
		"Using temporary .pgpass file for authentication",
		"pgpassFile", credentials.PgpassPath,
	)

	cmd.Env = append(cmd.Env,
		"PGCLIENTENCODING=UTF8",
		"PGCONNECT_TIMEOUT=30",
		"LC_ALL=C.UTF-8",
		"LANG=C.UTF-8",
	)

	sslMode := kingbaseConfig.SslMode
	if sslMode == "" {
		sslMode = postgresql_shared.PostgresSslModeDisable
	}

	cmd.Env = append(cmd.Env,
		"PGSSLMODE="+string(sslMode),
		"PGSSLCERT="+credentials.ClientCertPath,
		"PGSSLKEY="+credentials.ClientKeyPath,
		"PGSSLROOTCERT="+credentials.RootCertPath,
		"PGSSLCRL=",
	)
	uc.logger.Info("Using SSL mode", "sslMode", sslMode)
}

// handleSysRestoreError processes and formats sys_restore errors
func (uc *RestoreKingbaseBackupUsecase) handleSysRestoreError(
	database *databases.Database,
	waitErr error,
	stderrOutput []byte,
	sysBin string,
	args []string,
	kingbaseConfig *kingbasetypes.KingbaseLogicalDatabase,
) error {
	exitErr := &exec.ExitError{}
	if !errors.As(waitErr, &exitErr) {
		return fmt.Errorf("sys_restore failed: %w", waitErr)
	}

	exitCode := exitErr.ExitCode()
	stderrStr := strings.TrimSpace(string(stderrOutput))

	uc.logger.Error("sys_restore failed",
		"exitCode", exitCode,
		"stderr", stderrStr,
		"command", sysBin,
		"args", strings.Join(args, " "),
	)

	// Mask password from error output if present
	maskedStderr := stderrStr
	if kingbaseConfig.Password != "" {
		// Decrypt password for masking
		fieldEncryptor := util_encryption.GetFieldEncryptor()
		if decryptedPassword, err := fieldEncryptor.Decrypt(kingbaseConfig.Password); err == nil {
			maskedStderr = strings.ReplaceAll(maskedStderr, decryptedPassword, "****")
		}
	}

	baseMsg := fmt.Sprintf("sys_restore failed with exit code %d", exitCode)

	if maskedStderr != "" {
		return fmt.Errorf("%s: %s", baseMsg, maskedStderr)
	}

	return fmt.Errorf("%s: check database server logs for more information", baseMsg)
}

// copyToStdin copies data from reader to stdin with context cancellation support
func (uc *RestoreKingbaseBackupUsecase) copyToStdin(
	ctx context.Context,
	stdin io.WriteCloser,
	reader io.Reader,
) error {
	buf := make([]byte, 8*1024*1024)
	for {
		select {
		case <-ctx.Done():
			return fmt.Errorf("copy cancelled: %w", ctx.Err())
		default:
		}

		bytesRead, readErr := reader.Read(buf)
		if bytesRead > 0 {
			_, writeErr := stdin.Write(buf[0:bytesRead])
			if writeErr != nil {
				return fmt.Errorf("write to stdin: %w", writeErr)
			}
		}

		if readErr != nil {
			if readErr != io.EOF {
				return fmt.Errorf("read from backup: %w", readErr)
			}
			break
		}
	}

	return nil
}

// containsIgnoreCase checks if a string contains a substring, ignoring case
func containsIgnoreCase(str, substr string) bool {
	return strings.Contains(strings.ToLower(str), strings.ToLower(substr))
}

// generateFilteredTocList writes a sys_restore TOC list (for -L) with the object classes selected
// by options dropped, so sys_restore skips them.
func (uc *RestoreKingbaseBackupUsecase) generateFilteredTocList(
	ctx context.Context,
	sysBin string,
	backupFile string,
	credentials *postgresql_shared.CredentialTempFiles,
	kingbaseConfig *kingbasetypes.KingbaseLogicalDatabase,
	options restores_core.RestoreOptions,
) (string, error) {
	uc.logger.Info("Generating filtered TOC list", "backupFile", backupFile)

	// Run sys_restore -l to get the TOC list
	listCmd := exec.CommandContext(ctx, sysBin, "-l", backupFile)
	uc.setupSysRestoreEnvironment(listCmd, credentials, kingbaseConfig)

	tocOutput, err := listCmd.Output()
	if err != nil {
		return "", fmt.Errorf("failed to generate TOC list: %w", err)
	}

	// " EXTENSION " catches both CREATE EXTENSION and COMMENT ON EXTENSION entries
	isExtensionEntry := func(upperLine string) bool {
		return strings.Contains(upperLine, " EXTENSION ")
	}
	// " USER MAPPING " catches CREATE USER MAPPING entries
	isUserMappingEntry := func(upperLine string) bool {
		return strings.Contains(upperLine, " USER MAPPING ")
	}

	var filteredLines []string
	for line := range strings.SplitSeq(string(tocOutput), "\n") {
		trimmedLine := strings.TrimSpace(line)
		if trimmedLine == "" {
			continue
		}

		upperLine := strings.ToUpper(trimmedLine)

		if options.IsExcludeExtensions && isExtensionEntry(upperLine) {
			uc.logger.Info("Excluding extension-related entry from restore", "tocLine", trimmedLine)
			continue
		}

		if options.IsSkipUserMappings && isUserMappingEntry(upperLine) {
			uc.logger.Info("Excluding user mapping entry from restore", "tocLine", trimmedLine)
			continue
		}

		filteredLines = append(filteredLines, line)
	}

	// Write filtered TOC to temporary file
	tocFile, err := os.CreateTemp(config.GetEnv().TempFolder, "sys_restore_toc_*.list")
	if err != nil {
		return "", fmt.Errorf("failed to create TOC list file: %w", err)
	}
	tocFilePath := tocFile.Name()

	filteredContent := strings.Join(filteredLines, "\n")
	if _, err := tocFile.WriteString(filteredContent); err != nil {
		_ = tocFile.Close()
		_ = os.Remove(tocFilePath)
		return "", fmt.Errorf("failed to write TOC list file: %w", err)
	}

	if err := tocFile.Close(); err != nil {
		_ = os.Remove(tocFilePath)
		return "", fmt.Errorf("failed to close TOC list file: %w", err)
	}

	uc.logger.Info("Generated filtered TOC list file",
		"tocFile", tocFilePath,
		"originalLines", len(strings.Split(string(tocOutput), "\n")),
		"filteredLines", len(filteredLines),
	)

	return tocFilePath, nil
}
