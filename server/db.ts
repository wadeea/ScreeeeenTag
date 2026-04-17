import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (db) return db;

  db = await open({
    filename: path.join(process.cwd(), 'database.sqlite'),
    driver: sqlite3.Database
  });

  await setupSchema(db);
  return db;
}

async function setupSchema(db: Database) {
  // Products
  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      sku TEXT UNIQUE,
      barcode TEXT UNIQUE,
      name TEXT,
      price REAL,
      currency TEXT DEFAULT 'USD',
      category TEXT
    )
  `);

  // Tags
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      tagId TEXT UNIQUE,
      status TEXT,
      battery INTEGER,
      lastSeen DATETIME,
      apId TEXT,
      sku TEXT,
      FOREIGN KEY(sku) REFERENCES products(sku)
    )
  `);

  // Access Points
  await db.exec(`
    CREATE TABLE IF NOT EXISTS access_points (
      id TEXT PRIMARY KEY,
      apId TEXT UNIQUE,
      ip TEXT,
      mac TEXT,
      status TEXT,
      lastSeen DATETIME
    )
  `);

  // Tasks
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      type TEXT,
      targetId TEXT,
      payload TEXT,
      status TEXT,
      retries INTEGER DEFAULT 0,
      logs TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Users
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT
    )
  `);

  // Seed default admin if not exists
  const admin = await db.get('SELECT * FROM users WHERE username = ?', ['admin']);
  if (!admin) {
    await db.run('INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)', 
      ['1', 'admin', 'admin123', 'admin']);
  }
}
