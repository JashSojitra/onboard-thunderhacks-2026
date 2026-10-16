import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Database } from './db';

export async function runMigrations(database: Database, directory = path.resolve('migrations')) {
  await database.query(`create table if not exists nexus_schema_migrations (
    name text primary key,
    applied_at timestamptz not null default now()
  )`);
  const files = (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort();
  const applied: string[] = [];
  for (const name of files) {
    const existing = await database.query<{ name: string }>('select name from nexus_schema_migrations where name = $1', [name]);
    if (existing.rows[0]) continue;
    const sql = await readFile(path.join(directory, name), 'utf8');
    await database.transaction(async (executor) => {
      await executor.query(sql);
      await executor.query('insert into nexus_schema_migrations (name) values ($1)', [name]);
    });
    applied.push(name);
  }
  return applied;
}

