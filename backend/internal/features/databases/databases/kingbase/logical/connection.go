package kingbase_logical

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"

	postgresql_shared "databasus-backend/internal/features/databases/databases/postgresql/shared"
	"databasus-backend/internal/util/encryption"
)

// CredentialSpec maps this database into the strategy-agnostic credential inputs
// shared by every libpq path: the pgx connections here and sys_dump / sys_restore
// in the backup and restore usecases.
func (k *KingbaseLogicalDatabase) CredentialSpec() postgresql_shared.CredentialSpec {
	return postgresql_shared.CredentialSpec{
		Host:          k.Host,
		Port:          k.Port,
		Username:      k.Username,
		SslMode:       k.SslMode,
		SslClientCert: k.SslClientCert,
		SslClientKey:  k.SslClientKey,
		SslRootCert:   k.SslRootCert,
	}
}

// openPgConn writes k's credential files, opens a pgx connection to dbName, and
// removes the files once the TLS handshake has completed.
func openPgConn(
	ctx context.Context,
	k *KingbaseLogicalDatabase,
	dbName string,
	encryptor encryption.FieldEncryptor,
) (*pgx.Conn, error) {
	password, err := postgresql_shared.DecryptFieldIfNeeded(k.Password, encryptor)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt password: %w", err)
	}

	files, err := postgresql_shared.WriteCredentialFilesToTempDir(k.CredentialSpec(), password, encryptor)
	if err != nil {
		return nil, err
	}
	defer files.Remove()

	return pgx.Connect(ctx, postgresql_shared.BuildConnString(k.CredentialSpec(), password, dbName, files))
}
