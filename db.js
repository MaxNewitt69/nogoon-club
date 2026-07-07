const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let isPostgres = false;
let pgPool = null;
let sqliteDb = null;

if (process.env.DATABASE_URL) {
  console.log('Connecting to PostgreSQL database...');
  isPostgres = true;
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for Railway / Heroku external connections
    }
  });
} else {
  console.log('Connecting to SQLite database locally...');
  const dbPath = path.join(__dirname, 'nogoon.db');
  sqliteDb = new sqlite3.Database(dbPath);
}

// Unified query wrapper. SQLite supports $1, $2, $3 syntax just like PG.
async function query(sql, params = []) {
  if (isPostgres) {
    const res = await pgPool.query(sql, params);
    return res;
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.all(sql, params, (err, rows) => {
        if (err) {
          console.error('SQLite query error:', err, 'SQL:', sql, 'Params:', params);
          return reject(err);
        }
        resolve({ rows: rows || [] });
      });
    });
  }
}

async function initDb() {
  console.log('Initializing database schema...');
  
  const createUsersTable = isPostgres 
    ? `CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        google_id VARCHAR(255) UNIQUE,
        email VARCHAR(255),
        name VARCHAR(255) NOT NULL,
        picture TEXT,
        streak_start TIMESTAMP,
        highest_streak INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'ACTIVE',
        last_check_in TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`
    : `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        google_id TEXT UNIQUE,
        email TEXT,
        name TEXT NOT NULL,
        picture TEXT,
        streak_start TEXT,
        highest_streak INTEGER DEFAULT 0,
        status TEXT DEFAULT 'ACTIVE',
        last_check_in TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );`;

  const createPunishmentsTable = isPostgres
    ? `CREATE TABLE IF NOT EXISTS punishments (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        punishment_text TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      );`
    : `CREATE TABLE IF NOT EXISTS punishments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE,
        punishment_text TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        completed_at TEXT
      );`;
  
  // Wait! In SQLite, the FOREIGN KEY syntax must be:
  // user_id TEXT NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id)
  // Let's adjust SQLite query to use proper syntax or make it simple without foreign key constraints since it's local dev,
  // or write proper syntax.
  const createPunishmentsTableSQLite = `CREATE TABLE IF NOT EXISTS punishments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    punishment_text TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    completed_at TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );`;

  const createMessagesTable = isPostgres
    ? `CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message_text TEXT,
        image_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`
    : `CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        message_text TEXT,
        image_data TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      );`;
  
  try {
    await query(createUsersTable);
    if (isPostgres) {
      await query(createPunishmentsTable);
    } else {
      await query(createPunishmentsTableSQLite);
    }
    await query(createMessagesTable);
    
    // Seed Dax, Max, Reese if database is empty
    const countRes = await query(`SELECT COUNT(*) as count FROM users`);
    const count = parseInt(countRes.rows[0].count || countRes.rows[0].COUNT || 0);
    if (count === 0) {
      console.log('Seeding initial 3 friends: Dax, Max, Reese...');
      const now = new Date().toISOString();
      await query(
        `INSERT INTO users (id, google_id, email, name, picture, streak_start, last_check_in, highest_streak, status) VALUES 
         ('dax', NULL, NULL, 'Dax 🤫🧏‍♂️', 'https://api.dicebear.com/7.x/pixel-art/svg?seed=dax', $1, $2, 0, 'ACTIVE'),
         ('max', NULL, NULL, 'Max ⚡', 'https://api.dicebear.com/7.x/pixel-art/svg?seed=max', $3, $4, 0, 'ACTIVE'),
         ('reese', NULL, NULL, 'Reese 👑', 'https://api.dicebear.com/7.x/pixel-art/svg?seed=reese', $5, $6, 0, 'ACTIVE')`,
        [now, now, now, now, now, now]
      );
    }
    console.log('Database initialization complete.');
  } catch (err) {
    console.error('Database initialization failed:', err);
    throw err;
  }
}

module.exports = {
  query,
  initDb,
  isPostgres: () => isPostgres
};
