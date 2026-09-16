// src/db.js - PostgreSQL pool + one-off migration runner

import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost')
        ? false
        : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
    console.error('Unexpected DB pool error:', err);
});

if (process.argv.includes('--migrate')) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const schemaPath = join(__dirname, '..', 'sql', 'schema.sql');

    console.log('Applying schema from', schemaPath);
    const schema = readFileSync(schemaPath, 'utf8');

    pool.query(schema)
        .then(() => {
            console.log('Schema applied successfully.');
            return pool.end();
        })
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('Migration failed:', err);
            process.exit(1);
        });
}