import type { PostgresSslMode } from '../postgresql/PostgresSslMode';
import type { PostgresqlVersion } from '../postgresql/PostgresqlVersion';

export interface KingbaseDatabase {
  id: string;
  version: PostgresqlVersion;

  // connection data
  host: string;
  port: number;
  username: string;
  password: string;
  database?: string;

  // SSL / TLS
  sslMode: PostgresSslMode;
  sslClientCert?: string;
  sslClientKey?: string;
  sslRootCert?: string;

  // backup settings
  includeSchemas?: string[];
  excludeTables?: string[];
  cpuCount: number;
  isSkipUserMappings?: boolean;

  // restore settings (not saved to DB)
  isExcludeExtensions?: boolean;
  isRestoreOwnership?: boolean;
  isRestorePrivileges?: boolean;
}
