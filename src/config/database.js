const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// On teste la connexion au démarrage
pool.on("connect", () => {
  console.log("✅ PostgreSQL connected");
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL error:", err);
  process.exit(1);
});

// Créer la table
const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS urls (
      id        SERIAL PRIMARY KEY,
      code      VARCHAR(10) UNIQUE NOT NULL,
      original  TEXT NOT NULL,
      clicks    INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log("✅ Table urls ready");
};

module.exports = { pool, initDB };