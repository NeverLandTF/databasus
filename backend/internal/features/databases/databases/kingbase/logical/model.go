package kingbase_logical

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"gorm.io/gorm"

	postgresql_shared "databasus-backend/internal/features/databases/databases/postgresql/shared"
	"databasus-backend/internal/util/encryption"
	"databasus-backend/internal/util/tools"
)

type KingbaseLogicalDatabase struct {
	ID uuid.UUID `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`

	DatabaseID *uuid.UUID `json:"databaseId" gorm:"type:uuid;column:database_id"`

	Version tools.KingbaseVersion `json:"version" gorm:"type:text;not null"`

	Host     string  `json:"host"     gorm:"type:text;not null"`
	Port     int     `json:"port"     gorm:"type:int;not null"`
	Username string  `json:"username" gorm:"type:text;not null"`
	Password string  `json:"password" gorm:"type:text;not null"`
	Database *string `json:"database" gorm:"type:text"`

	// SSL / TLS connection settings
	SslMode       postgresql_shared.PostgresSslMode `json:"sslMode"       gorm:"column:ssl_mode;type:text;not null;default:'disable'"`
	SslClientCert string                            `json:"sslClientCert" gorm:"column:ssl_client_cert;type:text;not null;default:''"`
	SslClientKey  string                            `json:"sslClientKey"  gorm:"column:ssl_client_key;type:text;not null;default:''"`
	SslRootCert   string                            `json:"sslRootCert"   gorm:"column:ssl_root_cert;type:text;not null;default:''"`

	// backup settings
	IncludeSchemas       []string `json:"includeSchemas"     gorm:"-"`
	IncludeSchemasString string   `json:"-"                  gorm:"column:include_schemas;type:text;not null;default:''"`
	ExcludeTables        []string `json:"excludeTables"      gorm:"-"`
	ExcludeTablesString  string   `json:"-"                  gorm:"column:exclude_tables;type:text;not null;default:''"`
	CpuCount             int      `json:"cpuCount"           gorm:"column:cpu_count;type:int;not null;default:1"`
	IsSkipUserMappings   bool     `json:"isSkipUserMappings" gorm:"column:is_skip_user_mappings;type:bool;not null;default:false"`

	// restore settings (not saved to DB)
	IsExcludeExtensions bool `json:"isExcludeExtensions" gorm:"-"`
	IsRestoreOwnership  bool `json:"isRestoreOwnership"  gorm:"-"`
	IsRestorePrivileges bool `json:"isRestorePrivileges" gorm:"-"`
}

func (k *KingbaseLogicalDatabase) TableName() string {
	return "kingbase_logical_databases"
}

func (k *KingbaseLogicalDatabase) BeforeSave(_ *gorm.DB) error {
	if len(k.IncludeSchemas) > 0 {
		k.IncludeSchemasString = strings.Join(k.IncludeSchemas, ",")
	} else {
		k.IncludeSchemasString = ""
	}

	if len(k.ExcludeTables) > 0 {
		k.ExcludeTablesString = strings.Join(k.ExcludeTables, ",")
	} else {
		k.ExcludeTablesString = ""
	}

	return nil
}

func (k *KingbaseLogicalDatabase) AfterFind(_ *gorm.DB) error {
	if k.IncludeSchemasString != "" {
		k.IncludeSchemas = strings.Split(k.IncludeSchemasString, ",")
	} else {
		k.IncludeSchemas = []string{}
	}

	if k.ExcludeTablesString != "" {
		k.ExcludeTables = strings.Split(k.ExcludeTablesString, ",")
	} else {
		k.ExcludeTables = []string{}
	}

	return nil
}

func (k *KingbaseLogicalDatabase) Validate() error {
	if k.SslMode == "" {
		k.SslMode = postgresql_shared.PostgresSslModeDisable
	}

	if k.Host == "" {
		return errors.New("host is required")
	}

	if k.Port == 0 {
		return errors.New("port is required")
	}

	if k.Username == "" {
		return errors.New("username is required")
	}

	if k.Password == "" {
		return errors.New("password is required")
	}

	if k.CpuCount <= 0 {
		return errors.New("cpu count must be greater than 0")
	}

	if err := k.validateSslConfig(); err != nil {
		return err
	}

	// Prevent Databasus from backing up itself
	// Databasus runs an internal PostgreSQL instance that should not be backed up through the UI
	// because it would expose internal metadata to non-system administrators.
	// To properly backup Databasus, see: https://databasus.com/faq#backup-databasus
	if k.Database != nil && *k.Database != "" {
		localhostHosts := []string{
			"localhost",
			"127.0.0.1",
			"172.17.0.1",
			"host.docker.internal",
			"::1",     // IPv6 loopback (equivalent to 127.0.0.1)
			"::",      // IPv6 all interfaces (equivalent to 0.0.0.0)
			"0.0.0.0", // IPv4 all interfaces
		}

		isLocalhost := false

		for _, host := range localhostHosts {
			if strings.EqualFold(k.Host, host) {
				isLocalhost = true
				break
			}
		}

		// Also check if the host is in the entire 127.0.0.0/8 loopback range
		if strings.HasPrefix(k.Host, "127.") {
			isLocalhost = true
		}

		if isLocalhost && strings.EqualFold(*k.Database, "databasus") {
			return errors.New(
				"backing up Databasus internal database is not allowed. To backup Databasus itself, see https://databasus.com/faq#backup-databasus",
			)
		}
	}

	return nil
}

func (k *KingbaseLogicalDatabase) TestConnection(
	logger *slog.Logger,
	encryptor encryption.FieldEncryptor,
) error {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	return testSingleDatabaseConnection(logger, ctx, k, encryptor)
}

// GetRawDbSizeMb returns whole-database size via pg_database_size; when
// IncludeSchemas filters the dump, the value remains the full DB size.
func (k *KingbaseLogicalDatabase) GetRawDbSizeMb(
	ctx context.Context,
	logger *slog.Logger,
	encryptor encryption.FieldEncryptor,
) (float64, error) {
	if k.Database == nil || *k.Database == "" {
		return 0, nil
	}

	conn, err := openPgConn(ctx, k, *k.Database, encryptor)
	if err != nil {
		return 0, fmt.Errorf("failed to connect to database '%s': %w", *k.Database, err)
	}
	defer func() {
		if closeErr := conn.Close(ctx); closeErr != nil {
			logger.Error("Failed to close connection", "error", closeErr)
		}
	}()

	var sizeBytes int64
	if err := conn.QueryRow(ctx, "SELECT pg_database_size(current_database())").Scan(&sizeBytes); err != nil {
		return 0, fmt.Errorf("failed to query pg_database_size: %w", err)
	}

	return float64(sizeBytes) / (1024 * 1024), nil
}

func (k *KingbaseLogicalDatabase) HideSensitiveData() {
	if k == nil {
		return
	}

	k.Password = ""
	k.SslClientKey = ""
}

func (k *KingbaseLogicalDatabase) ValidateUpdate(_ *KingbaseLogicalDatabase) error {
	return nil
}

func (k *KingbaseLogicalDatabase) Update(incoming *KingbaseLogicalDatabase) {
	k.Version = incoming.Version
	k.Host = incoming.Host
	k.Port = incoming.Port
	k.Username = incoming.Username
	k.Database = incoming.Database
	k.SslMode = incoming.SslMode
	k.SslClientCert = incoming.SslClientCert
	k.SslRootCert = incoming.SslRootCert
	k.IncludeSchemas = incoming.IncludeSchemas
	k.ExcludeTables = incoming.ExcludeTables
	k.CpuCount = incoming.CpuCount
	k.IsSkipUserMappings = incoming.IsSkipUserMappings

	if incoming.Password != "" {
		k.Password = incoming.Password
	}

	if incoming.SslClientKey != "" {
		k.SslClientKey = incoming.SslClientKey
	}
}

func (k *KingbaseLogicalDatabase) EncryptSensitiveFields(
	encryptor encryption.FieldEncryptor,
) error {
	for _, field := range []*string{
		&k.Password,
		&k.SslClientCert,
		&k.SslClientKey,
		&k.SslRootCert,
	} {
		if *field == "" {
			continue
		}

		encrypted, err := encryptor.Encrypt(*field)
		if err != nil {
			return err
		}

		*field = encrypted
	}

	return nil
}

// PopulateDbData detects and sets the Kingbase version.
// This should be called before encrypting sensitive fields.
func (k *KingbaseLogicalDatabase) PopulateDbData(
	logger *slog.Logger,
	encryptor encryption.FieldEncryptor,
) error {
	return k.PopulateVersion(logger, encryptor)
}

// PopulateVersion detects and sets the Kingbase version by querying the database.
func (k *KingbaseLogicalDatabase) PopulateVersion(
	logger *slog.Logger,
	encryptor encryption.FieldEncryptor,
) error {
	if k.Database == nil || *k.Database == "" {
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	conn, err := openPgConn(ctx, k, *k.Database, encryptor)
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}
	defer func() {
		if closeErr := conn.Close(ctx); closeErr != nil {
			logger.Error("Failed to close connection", "error", closeErr)
		}
	}()

	detectedVersion, err := detectDatabaseVersion(ctx, conn)
	if err != nil {
		return err
	}

	k.Version = detectedVersion
	return nil
}

// IsUserReadOnly checks if the database user has read-only privileges.
//
// This method performs a comprehensive security check by examining:
// - Role-level attributes (superuser, createrole, createdb, bypassrls, replication)
// - Database-level privileges (CREATE, TEMP)
// - Schema-level privileges (CREATE on any non-system schema)
// - Table-level write permissions (INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER)
// - Function-level privileges (EXECUTE on SECURITY DEFINER functions)
//
// A user is considered read-only only if they have ZERO write privileges
// across all levels. This ensures the database user follows the
// principle of least privilege for backup operations.
//
// Returns: (isReadOnly, detectedPrivileges, error)
func (k *KingbaseLogicalDatabase) IsUserReadOnly(
	ctx context.Context,
	logger *slog.Logger,
	encryptor encryption.FieldEncryptor,
) (bool, []string, error) {
	conn, err := openPgConn(ctx, k, *k.Database, encryptor)
	if err != nil {
		return false, nil, fmt.Errorf("failed to connect to database: %w", err)
	}
	defer func() {
		if closeErr := conn.Close(ctx); closeErr != nil {
			logger.Error("Failed to close connection", "error", closeErr)
		}
	}()

	var privileges []string

	// LEVEL 1: Check role-level attributes
	var isSuperuser, canCreateRole, canCreateDB, canBypassRLS, canReplication bool
	err = conn.QueryRow(ctx, `
		SELECT
			rolsuper,
			rolcreaterole,
			rolcreatedb,
			rolbypassrls,
			rolreplication
		FROM pg_roles
		WHERE rolname = current_user
	`).Scan(&isSuperuser, &canCreateRole, &canCreateDB, &canBypassRLS, &canReplication)
	if err != nil {
		return false, nil, fmt.Errorf("failed to check role attributes: %w", err)
	}

	if isSuperuser {
		privileges = append(privileges, "SUPERUSER")
	}
	if canCreateRole {
		privileges = append(privileges, "CREATEROLE")
	}
	if canCreateDB {
		privileges = append(privileges, "CREATEDB")
	}
	if canBypassRLS {
		privileges = append(privileges, "BYPASSRLS")
	}
	if canReplication {
		privileges = append(privileges, "REPLICATION")
	}

	// LEVEL 2: Check database-level privileges
	var canCreate, canTemp bool
	err = conn.QueryRow(ctx, `
		SELECT
			has_database_privilege(current_user, current_database(), 'CREATE') as can_create,
			has_database_privilege(current_user, current_database(), 'TEMP') as can_temp
	`).Scan(&canCreate, &canTemp)
	if err != nil {
		return false, nil, fmt.Errorf("failed to check database privileges: %w", err)
	}

	if canCreate {
		privileges = append(privileges, "CREATE (database)")
	}
	if canTemp {
		privileges = append(privileges, "TEMP")
	}

	// LEVEL 2.5: Check schema-level CREATE privileges
	var hasSchemaCreate bool
	err = conn.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1
			FROM pg_namespace n
			WHERE has_schema_privilege(current_user, n.nspname, 'CREATE')
			AND nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
		)
	`).Scan(&hasSchemaCreate)
	if err != nil {
		return false, nil, fmt.Errorf("failed to check schema privileges: %w", err)
	}
	if hasSchemaCreate {
		privileges = append(privileges, "CREATE (schema)")
	}

	// LEVEL 3: Check table-level write permissions
	writePrivileges := map[string]bool{
		"INSERT":     true,
		"UPDATE":     true,
		"DELETE":     true,
		"TRUNCATE":   true,
		"REFERENCES": true,
		"TRIGGER":    true,
	}

	var tablePrivileges []string
	rows, err := conn.Query(ctx, `
		SELECT DISTINCT privilege_type
		FROM information_schema.role_table_grants
		WHERE grantee = current_user
		AND table_schema NOT IN ('pg_catalog', 'information_schema')
	`)
	if err != nil {
		return false, nil, fmt.Errorf("failed to check table privileges: %w", err)
	}

	for rows.Next() {
		var privilege string
		if err := rows.Scan(&privilege); err != nil {
			rows.Close()
			return false, nil, fmt.Errorf("failed to scan privilege: %w", err)
		}
		tablePrivileges = append(tablePrivileges, privilege)
	}
	rows.Close()

	if err := rows.Err(); err != nil {
		return false, nil, fmt.Errorf("error iterating privileges: %w", err)
	}

	for _, privilege := range tablePrivileges {
		if writePrivileges[privilege] {
			privileges = append(privileges, privilege)
		}
	}

	// LEVEL 4: Check for EXECUTE privilege on functions that are SECURITY DEFINER
	var funcCount int
	err = conn.QueryRow(ctx, `
		SELECT COUNT(*)
		FROM pg_proc p
		JOIN pg_namespace n ON p.pronamespace = n.oid
		WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
		AND p.prosecdef = true
		AND has_function_privilege(current_user, p.oid, 'EXECUTE')
	`).Scan(&funcCount)
	if err != nil {
		return false, nil, fmt.Errorf("failed to check function privileges: %w", err)
	}
	if funcCount > 0 {
		privileges = append(privileges, "EXECUTE (SECURITY DEFINER)")
	}

	isReadOnly := len(privileges) == 0
	return isReadOnly, privileges, nil
}
