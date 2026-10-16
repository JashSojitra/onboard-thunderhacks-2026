import { configuredDatabaseUrl, createDatabase } from '../server/db';

const connectionString = configuredDatabaseUrl();
if (!connectionString) throw new Error('Set DATABASE_URL or STORAGE_DATABASE_URL before inspecting the database.');

const target = new URL(connectionString);
const database = createDatabase(connectionString);

try {
  const metadata = await database.query<{ database: string; schema: string; version: string }>(
    'select current_database() as database, current_schema() as schema, version() as version',
  );
  const tables = await database.query<{ tablename: string }>(
    "select tablename from pg_tables where schemaname = 'public' order by tablename",
  );

  console.log(JSON.stringify({
    connected: true,
    host: target.hostname,
    database: metadata.rows[0].database,
    schema: metadata.rows[0].schema,
    engine: metadata.rows[0].version.split(' on ')[0],
    publicTables: tables.rows.map((row) => row.tablename),
  }, null, 2));
} finally {
  await database.close();
}
