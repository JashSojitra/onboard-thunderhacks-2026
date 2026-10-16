import { configuredDatabaseUrl, createDatabase } from '../server/db';
import { runMigrations } from '../server/migrations';

const connectionString = configuredDatabaseUrl();
if (!connectionString) throw new Error('Set DATABASE_URL or STORAGE_DATABASE_URL before running migrations.');
const database = createDatabase(connectionString);
try {
  const applied = await runMigrations(database);
  console.log(applied.length ? `Applied migrations: ${applied.join(', ')}` : 'Database is already up to date.');
} finally {
  await database.close();
}

