import { type Database, PostgresSslMode, PostgresqlVersion } from '../../../../entity/databases';

interface Props {
  database: Database;
}

const postgresqlVersionLabels = {
  [PostgresqlVersion.PostgresqlVersion12]: '12',
  [PostgresqlVersion.PostgresqlVersion13]: '13',
  [PostgresqlVersion.PostgresqlVersion14]: '14',
  [PostgresqlVersion.PostgresqlVersion15]: '15',
  [PostgresqlVersion.PostgresqlVersion16]: '16',
  [PostgresqlVersion.PostgresqlVersion17]: '17',
  [PostgresqlVersion.PostgresqlVersion18]: '18',
};

const sslModeLabels: Record<string, string> = {
  [PostgresSslMode.Disable]: 'Disable',
  [PostgresSslMode.Require]: 'Require',
  [PostgresSslMode.VerifyCa]: 'Verify CA',
  [PostgresSslMode.VerifyFull]: 'Verify full',
};

export const ShowKingbaseSpecificDataComponent = ({ database }: Props) => {
  return (
    <div>
      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">Kingbase version</div>
        <div>
          {database.kingbase?.version
            ? postgresqlVersionLabels[database.kingbase.version]
            : ''}
        </div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px] break-all">Host</div>
        <div>{database.kingbase?.host || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">Port</div>
        <div>{database.kingbase?.port || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">Username</div>
        <div>{database.kingbase?.username || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">Password</div>
        <div>{'*************'}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">DB name</div>
        <div>{database.kingbase?.database || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">SSL mode</div>
        <div>{sslModeLabels[database.kingbase?.sslMode ?? PostgresSslMode.Disable]}</div>
      </div>

      {!!database.kingbase?.sslClientCert &&
        database.kingbase?.sslMode !== PostgresSslMode.Disable && (
          <div className="mb-1 flex w-full items-center">
            <div className="min-w-[150px]">Client certificate</div>
            <div>*************</div>
          </div>
        )}

      {!!database.kingbase?.includeSchemas?.length && (
        <div className="mb-1 flex w-full items-center">
          <div className="min-w-[150px]">Include schemas</div>
          <div>{database.kingbase.includeSchemas.join(', ')}</div>
        </div>
      )}

      {!!database.kingbase?.excludeTables?.length && (
        <div className="mb-1 flex w-full items-center">
          <div className="min-w-[150px]">Exclude tables</div>
          <div>{database.kingbase.excludeTables.join(', ')}</div>
        </div>
      )}

      {!!database.kingbase?.isSkipUserMappings && (
        <div className="mb-1 flex w-full items-center">
          <div className="min-w-[150px]">Skip user mappings</div>
          <div>Yes</div>
        </div>
      )}
    </div>
  );
};
