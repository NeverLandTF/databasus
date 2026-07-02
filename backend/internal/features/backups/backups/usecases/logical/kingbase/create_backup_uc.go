package usecases_logical_kingbase

import (
	"context"
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
	backup_encryption "databasus-backend/internal/features/backups/backups/encryption"
	backups_config_logical "databasus-backend/internal/features/backups/config/logical"
	"databasus-backend/internal/features/databases"
	kingbasetypes "databasus-backend/internal/features/databases/databases/kingbase/logical"
	postgresql_shared "databasus-backend/internal/features/databases/databases/postgresql/shared"
	encryption_secrets "databasus-backend/internal/features/encryption/secrets"
	"databasus-backend/internal/features/storages"
	"databasus-backend/internal/util/encryption"
	io_utils "databasus-backend/internal/util/io"
	"databasus-backend/internal/util/tools"
)

const (
	backupTimeout            = 23 * time.Hour
	shutdownCheckInterval    = 1 * time.Second
	copyBufferSize           = 8 * 1024 * 1024
	progressReportIntervalMB = 1.0
	sysConnectTimeout        = 30
	compressionLevel         = 5
	exitCodeAccessViolation  = -1073741819
	exitCodeGenericError     = 1
	exitCodeConnectionError  = 2
)

var (
	errBackupShutdown = errors.New("backup cancelled due to shutdown")
	errBackupTimeout  = errors.New("backup cancelled due to timeout")
)

type CreateKingbaseBackupUsecase struct {
	logger           *slog.Logger
	secretKeyService *encryption_secrets.SecretKeyService
	fieldEncryptor   encryption.FieldEncryptor
}

type writeResult struct {
	bytesWritten int
	writeErr     error
}

func (uc *CreateKingbaseBackupUsecase) Execute(
	ctx context.Context,
	backup *backups_core_logical.LogicalBackup,
	backupConfig *backups_config_logical.LogicalBackupConfig,
	db *databases.Database,
	storage *storages.Storage,
	backupProgressListener func(
		completedMBs float64,
	),
) (*backups_core_logical.BackupMetadata, error) {
	uc.logger.Info(
		"Creating Kingbase backup via sys_dump custom format",
		"databaseId",
		db.ID,
		"storageId",
		storage.ID,
	)

	kingbase := db.KingbaseLogical

	if kingbase == nil {
		return nil, fmt.Errorf("kingbase database configuration is required for sys_dump backups")
	}

	if kingbase.Database == nil || *kingbase.Database == "" {
		return nil, fmt.Errorf("database name is required for sys_dump backups")
	}

	args := uc.buildSysDumpArgs(kingbase)

	decryptedPassword, err := uc.fieldEncryptor.Decrypt(kingbase.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt database password: %w", err)
	}

	rawSizeMB, err := kingbase.GetRawDbSizeMb(ctx, uc.logger, uc.fieldEncryptor)
	if err != nil {
		uc.logger.Warn("failed to fetch raw db size before backup",
			"database_id", db.ID,
			"error", err)
	} else {
		backup.BackupRawDbSizeMb = rawSizeMB
	}

	return uc.streamToStorage(
		ctx,
		backup,
		backupConfig,
		tools.GetPostgresqlExecutable(kingbase.Version, "sys_dump"),
		args,
		decryptedPassword,
		storage,
		db,
		backupProgressListener,
	)
}

// streamToStorage streams sys_dump output directly to storage
func (uc *CreateKingbaseBackupUsecase) streamToStorage(
	parentCtx context.Context,
	backup *backups_core_logical.LogicalBackup,
	backupConfig *backups_config_logical.LogicalBackupConfig,
	sysBin string,
	args []string,
	password string,
	storage *storages.Storage,
	db *databases.Database,
	backupProgressListener func(completedMBs float64),
) (*backups_core_logical.BackupMetadata, error) {
	uc.logger.Info("Streaming Kingbase backup to storage", "sysBin", sysBin, "args", args)

	ctx, cancel := uc.createBackupContext(parentCtx)
	defer cancel(nil)

	credentials, err := postgresql_shared.WriteCredentialFilesToTempDir(
		db.KingbaseLogical.CredentialSpec(), password, uc.fieldEncryptor)
	if err != nil {
		return nil, fmt.Errorf("failed to create credential files: %w", err)
	}
	defer credentials.Remove()

	cmd := exec.CommandContext(ctx, sysBin, args...)
	uc.logger.Info("Executing Kingbase backup command", "command", cmd.String())

	if err := uc.setupSysEnvironment(
		cmd,
		credentials,
		db.KingbaseLogical.SslMode,
		password,
		db.KingbaseLogical.CpuCount,
		sysBin,
	); err != nil {
		return nil, err
	}

	sysStdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, fmt.Errorf("stdout pipe: %w", err)
	}

	sysStderr, err := cmd.StderrPipe()
	if err != nil {
		return nil, fmt.Errorf("stderr pipe: %w", err)
	}

	// Capture stderr in a separate goroutine to ensure we don't miss any error output
	stderrCh := make(chan []byte, 1)
	go func() {
		stderrOutput, _ := io.ReadAll(sysStderr)
		stderrCh <- stderrOutput
	}()

	storageReader, storageWriter := io.Pipe()

	finalWriter, encryptionWriter, backupMetadata, err := uc.setupBackupEncryption(
		backup.ID,
		backupConfig,
		storageWriter,
	)
	if err != nil {
		return nil, err
	}

	countingWriter := io_utils.NewCountingWriter(finalWriter)

	// The backup ID becomes the object key / filename in storage

	// Start streaming into storage in its own goroutine
	saveErrCh := make(chan error, 1)
	go func() {
		saveErr := storage.SaveFile(
			ctx,
			uc.fieldEncryptor,
			uc.logger,
			backup.FileName,
			storageReader,
		)
		if saveErr != nil {
			_ = storageReader.CloseWithError(saveErr)
			cancel(saveErr)
		}
		saveErrCh <- saveErr
	}()

	// Start sys_dump
	if err = cmd.Start(); err != nil {
		return nil, fmt.Errorf("start %s: %w", filepath.Base(sysBin), err)
	}

	// Copy sys output directly to storage with shutdown checks
	copyResultCh := make(chan error, 1)
	bytesWrittenCh := make(chan int64, 1)
	go func() {
		bytesWritten, err := uc.copyWithShutdownCheck(
			ctx,
			countingWriter,
			sysStdout,
			backupProgressListener,
		)
		bytesWrittenCh <- bytesWritten
		copyResultCh <- err
	}()

	copyErr := <-copyResultCh
	bytesWritten := <-bytesWrittenCh
	waitErr := cmd.Wait()

	select {
	case earlySaveErr := <-saveErrCh:
		if earlySaveErr != nil {
			_ = uc.closeWriters(encryptionWriter, storageWriter)
			return nil, fmt.Errorf("save to storage: %w", earlySaveErr)
		}
		saveErrCh <- nil
	default:
	}

	select {
	case <-ctx.Done():
		uc.cleanupOnCancellation(encryptionWriter, storageWriter, saveErrCh)
		return nil, uc.classifyCancellation(ctx)
	default:
	}

	if err := uc.closeWriters(encryptionWriter, storageWriter); err != nil {
		<-saveErrCh
		return nil, err
	}

	saveErr := <-saveErrCh
	stderrOutput := <-stderrCh

	// Send final sizing after backup is completed
	if waitErr == nil && copyErr == nil && saveErr == nil && backupProgressListener != nil {
		sizeMB := float64(bytesWritten) / (1024 * 1024)
		backupProgressListener(sizeMB)
	}

	switch {
	case waitErr != nil:
		if err := uc.checkCancellation(ctx); err != nil {
			return nil, err
		}
		return nil, uc.buildSysDumpErrorMessage(waitErr, stderrOutput, sysBin, args, password)
	case copyErr != nil:
		if err := uc.checkCancellation(ctx); err != nil {
			return nil, err
		}
		return nil, fmt.Errorf("copy to storage: %w", copyErr)
	case saveErr != nil:
		if err := uc.checkCancellation(ctx); err != nil {
			return nil, err
		}
		return nil, fmt.Errorf("save to storage: %w", saveErr)
	}

	return &backupMetadata, nil
}

func (uc *CreateKingbaseBackupUsecase) copyWithShutdownCheck(
	ctx context.Context,
	dst io.Writer,
	src io.Reader,
	backupProgressListener func(completedMBs float64),
) (int64, error) {
	buf := make([]byte, copyBufferSize)
	var totalBytesWritten int64
	var lastReportedMB float64

	for {
		select {
		case <-ctx.Done():
			return totalBytesWritten, fmt.Errorf("copy cancelled: %w", ctx.Err())
		default:
		}

		if config.IsShouldShutdown() {
			return totalBytesWritten, fmt.Errorf("copy cancelled due to shutdown")
		}

		bytesRead, readErr := src.Read(buf)
		if bytesRead > 0 {
			writeResultCh := make(chan writeResult, 1)
			go func() {
				bytesWritten, writeErr := dst.Write(buf[0:bytesRead])
				writeResultCh <- writeResult{bytesWritten, writeErr}
			}()

			var bytesWritten int
			var writeErr error

			select {
			case <-ctx.Done():
				return totalBytesWritten, fmt.Errorf("copy cancelled during write: %w", ctx.Err())
			case result := <-writeResultCh:
				bytesWritten = result.bytesWritten
				writeErr = result.writeErr
			}

			if bytesWritten < 0 || bytesRead < bytesWritten {
				bytesWritten = 0
				if writeErr == nil {
					writeErr = fmt.Errorf("invalid write result")
				}
			}

			if writeErr != nil {
				return totalBytesWritten, writeErr
			}

			if bytesRead != bytesWritten {
				return totalBytesWritten, io.ErrShortWrite
			}

			totalBytesWritten += int64(bytesWritten)

			if backupProgressListener != nil {
				currentSizeMB := float64(totalBytesWritten) / (1024 * 1024)
				if currentSizeMB >= lastReportedMB+progressReportIntervalMB {
					backupProgressListener(currentSizeMB)
					lastReportedMB = currentSizeMB
				}
			}
		}

		if readErr != nil {
			if readErr != io.EOF {
				return totalBytesWritten, readErr
			}
			break
		}
	}

	return totalBytesWritten, nil
}

func (uc *CreateKingbaseBackupUsecase) buildSysDumpArgs(kingbase *kingbasetypes.KingbaseLogicalDatabase) []string {
	args := []string{
		"-Fc",
		"--no-password",
		"-h", kingbase.Host,
		"-p", strconv.Itoa(kingbase.Port),
		"-U", kingbase.Username,
		"-d", *kingbase.Database,
		"--verbose",
	}

	for _, schema := range kingbase.IncludeSchemas {
		args = append(args, "-n", schema)
	}

	for _, table := range kingbase.ExcludeTables {
		args = append(args, "--exclude-table="+table)
	}

	compressionArgs := uc.getCompressionArgs(kingbase.Version)
	return append(args, compressionArgs...)
}

func (uc *CreateKingbaseBackupUsecase) getCompressionArgs(
	version tools.PostgresqlVersion,
) []string {
	if uc.isOlderKingbaseVersion(version) {
		uc.logger.Info("Using gzip compression level 5 (zstd not available)", "version", version)
		return []string{"-Z", strconv.Itoa(compressionLevel)}
	}

	uc.logger.Info("Using zstd compression level 5", "version", version)
	return []string{fmt.Sprintf("--compress=zstd:%d", compressionLevel)}
}

func (uc *CreateKingbaseBackupUsecase) isOlderKingbaseVersion(
	version tools.PostgresqlVersion,
) bool {
	return version == tools.PostgresqlVersion12 ||
		version == tools.PostgresqlVersion13 ||
		version == tools.PostgresqlVersion14 ||
		version == tools.PostgresqlVersion15
}

func (uc *CreateKingbaseBackupUsecase) createBackupContext(
	parentCtx context.Context,
) (context.Context, context.CancelCauseFunc) {
	ctx, cancel := context.WithCancelCause(parentCtx)

	timeout := time.AfterFunc(backupTimeout, func() { cancel(errBackupTimeout) })

	go func() {
		defer timeout.Stop()

		ticker := time.NewTicker(shutdownCheckInterval)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-parentCtx.Done():
				cancel(context.Cause(parentCtx))
				return
			case <-ticker.C:
				if config.IsShouldShutdown() {
					cancel(errBackupShutdown)
					return
				}
			}
		}
	}()

	return ctx, cancel
}

func (uc *CreateKingbaseBackupUsecase) setupSysEnvironment(
	cmd *exec.Cmd,
	credentials *postgresql_shared.CredentialTempFiles,
	sslMode postgresql_shared.PostgresSslMode,
	password string,
	cpuCount int,
	sysBin string,
) error {
	cmd.Env = os.Environ()
	cmd.Env = append(cmd.Env, "PGPASSFILE="+credentials.PgpassPath)

	uc.logger.Info("Setting up Kingbase environment",
		"passwordLength", len(password),
		"passwordEmpty", password == "",
		"sysBin", sysBin,
		"parallelJobs", cpuCount,
	)

	cmd.Env = append(cmd.Env,
		"PGCLIENTENCODING=UTF8",
		"PGCONNECT_TIMEOUT="+strconv.Itoa(sysConnectTimeout),
		"LC_ALL=C.UTF-8",
		"LANG=C.UTF-8",
	)

	resolvedSslMode := sslMode
	if resolvedSslMode == "" {
		resolvedSslMode = postgresql_shared.PostgresSslModeDisable
	}

	cmd.Env = append(cmd.Env,
		"PGSSLMODE="+string(resolvedSslMode),
		"PGSSLCERT="+credentials.ClientCertPath,
		"PGSSLKEY="+credentials.ClientKeyPath,
		"PGSSLROOTCERT="+credentials.RootCertPath,
		"PGSSLCRL=",
	)
	uc.logger.Info("Using SSL mode", "sslMode", resolvedSslMode)

	if _, err := exec.LookPath(sysBin); err != nil {
		return fmt.Errorf("Kingbase executable not found or not accessible: %s - %w", sysBin, err)
	}

	return nil
}

func (uc *CreateKingbaseBackupUsecase) setupBackupEncryption(
	backupID uuid.UUID,
	backupConfig *backups_config_logical.LogicalBackupConfig,
	storageWriter io.WriteCloser,
) (io.Writer, *backup_encryption.EncryptionWriter, backups_core_logical.BackupMetadata, error) {
	metadata := backups_core_logical.BackupMetadata{
		BackupID: backupID,
	}

	if backupConfig.Encryption != backups_core_enums.BackupEncryptionEncrypted {
		metadata.Encryption = backups_core_enums.BackupEncryptionNone
		uc.logger.Info("Encryption disabled for backup", "backupId", backupID)
		return storageWriter, nil, metadata, nil
	}

	masterKey, err := uc.secretKeyService.GetSecretKey()
	if err != nil {
		return nil, nil, metadata, fmt.Errorf("failed to get master key: %w", err)
	}

	encSetup, err := backup_encryption.SetupEncryptionWriter(storageWriter, masterKey, backupID)
	if err != nil {
		return nil, nil, metadata, err
	}

	metadata.EncryptionSalt = &encSetup.SaltBase64
	metadata.EncryptionIV = &encSetup.NonceBase64
	metadata.Encryption = backups_core_enums.BackupEncryptionEncrypted

	uc.logger.Info("Encryption enabled for backup", "backupId", backupID)
	return encSetup.Writer, encSetup.Writer, metadata, nil
}

func (uc *CreateKingbaseBackupUsecase) cleanupOnCancellation(
	encryptionWriter *backup_encryption.EncryptionWriter,
	storageWriter io.WriteCloser,
	saveErrCh chan error,
) {
	if encryptionWriter != nil {
		go func() {
			if closeErr := encryptionWriter.Close(); closeErr != nil {
				uc.logger.Error(
					"Failed to close encrypting writer during cancellation",
					"error",
					closeErr,
				)
			}
		}()
	}

	if err := storageWriter.Close(); err != nil {
		uc.logger.Error("Failed to close pipe writer during cancellation", "error", err)
	}

	<-saveErrCh
}

func (uc *CreateKingbaseBackupUsecase) closeWriters(
	encryptionWriter *backup_encryption.EncryptionWriter,
	storageWriter io.WriteCloser,
) error {
	encryptionCloseErrCh := make(chan error, 1)
	if encryptionWriter != nil {
		go func() {
			closeErr := encryptionWriter.Close()
			if closeErr != nil {
				uc.logger.Error("Failed to close encrypting writer", "error", closeErr)
			}
			encryptionCloseErrCh <- closeErr
		}()
	} else {
		encryptionCloseErrCh <- nil
	}

	encryptionCloseErr := <-encryptionCloseErrCh
	if encryptionCloseErr != nil {
		if err := storageWriter.Close(); err != nil {
			uc.logger.Error("Failed to close pipe writer after encryption error", "error", err)
		}
		return fmt.Errorf("failed to close encryption writer: %w", encryptionCloseErr)
	}

	if err := storageWriter.Close(); err != nil {
		uc.logger.Error("Failed to close pipe writer", "error", err)
		return err
	}

	return nil
}

func (uc *CreateKingbaseBackupUsecase) checkCancellation(ctx context.Context) error {
	if ctx.Err() == nil {
		return nil
	}

	return uc.classifyCancellation(ctx)
}

func (uc *CreateKingbaseBackupUsecase) classifyCancellation(ctx context.Context) error {
	cause := context.Cause(ctx)

	switch {
	case errors.Is(cause, errBackupShutdown):
		return errors.New("backup cancelled due to shutdown")
	case errors.Is(cause, errBackupTimeout):
		return errors.New("backup cancelled due to timeout")
	case cause == nil, errors.Is(cause, context.Canceled), errors.Is(cause, context.DeadlineExceeded):
		return errors.New("backup cancelled")
	default:
		return fmt.Errorf("save to storage: %w", cause)
	}
}

func (uc *CreateKingbaseBackupUsecase) buildSysDumpErrorMessage(
	waitErr error,
	stderrOutput []byte,
	sysBin string,
	args []string,
	password string,
) error {
	exitErr := &exec.ExitError{}
	if !errors.As(waitErr, &exitErr) {
		return fmt.Errorf("sys_dump failed: %w", waitErr)
	}

	exitCode := exitErr.ExitCode()
	stderrStr := strings.TrimSpace(string(stderrOutput))

	uc.logger.Error("sys_dump failed",
		"exitCode", exitCode,
		"stderr", stderrStr,
		"command", sysBin,
		"args", strings.Join(args, " "),
	)

	// Mask password from error output if present
	maskedStderr := stderrStr
	if password != "" {
		maskedStderr = strings.ReplaceAll(maskedStderr, password, "****")
	}

	baseMsg := fmt.Sprintf("sys_dump failed with exit code %d", exitCode)

	if maskedStderr != "" {
		return fmt.Errorf("%s: %s", baseMsg, maskedStderr)
	}

	switch exitCode {
	case exitCodeConnectionError:
		return fmt.Errorf("%s: connection error - verify host, port, and network connectivity", baseMsg)
	case exitCodeGenericError:
		return fmt.Errorf("%s: check database logs for details", baseMsg)
	default:
		return fmt.Errorf("%s: see database server logs for more information", baseMsg)
	}
}
