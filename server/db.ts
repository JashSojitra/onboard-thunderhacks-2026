import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from '@neondatabase/serverless';

export interface SqlExecutor {
  query<R extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]): Promise<QueryResult<R>>;
}

export interface Database extends SqlExecutor {
  transaction<T>(work: (executor: SqlExecutor) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

function queryWith<R extends QueryResultRow>(executor: Pool | PoolClient, text: string, values: unknown[] = []) {
  return executor.query<R>(text, values);
}

export function configuredDatabaseUrl(env: NodeJS.ProcessEnv = process.env) {
  return env.DATABASE_URL || env.STORAGE_DATABASE_URL;
}

export function databaseConfigured() {
  return Boolean(configuredDatabaseUrl());
}

export function createDatabase(connectionString: string): Database {
  const pool = new Pool({ connectionString });
  return {
    query: <R extends QueryResultRow>(text: string, values: unknown[] = []) => queryWith<R>(pool, text, values),
    async transaction<T>(work: (executor: SqlExecutor) => Promise<T>) {
      const client = await pool.connect();
      const executor: SqlExecutor = { query: <R extends QueryResultRow>(text: string, values: unknown[] = []) => queryWith<R>(client, text, values) };
      try {
        await client.query('begin');
        const result = await work(executor);
        await client.query('commit');
        return result;
      } catch (error) {
        await client.query('rollback');
        throw error;
      } finally {
        client.release();
      }
    },
    close: () => pool.end(),
  };
}

let database: Database | null = null;
export function db() {
  if (database) return database;
  const connectionString = configuredDatabaseUrl();
  if (!connectionString) throw new Error('Neon is not configured. Set DATABASE_URL or STORAGE_DATABASE_URL.');
  database = createDatabase(connectionString);
  return database;
}

export async function closeDatabase() {
  if (!database) return;
  await database.close();
  database = null;
}

