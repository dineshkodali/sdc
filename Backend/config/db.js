// C:\PostgreAuth\Backend\config\db.js
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

/**
 * Helper: treat empty / "null" / "undefined" strings as not-provided
 */
function present(value) {
  return value !== undefined && value !== null && String(value).trim() !== "" && String(value).toLowerCase() !== "null" && String(value).toLowerCase() !== "undefined";
}

// Prefer a single DATABASE_URL if provided (common in cloud environments)
const connectionString = present(process.env.DATABASE_URL)
  ? process.env.DATABASE_URL
  : present(process.env.CONNECTION_STRING)
  ? process.env.CONNECTION_STRING
  : null;

// Discrete connection details (used when no connection string)
const host = present(process.env.DB_HOST) ? process.env.DB_HOST : undefined;
const port = present(process.env.DB_PORT) ? parseInt(process.env.DB_PORT, 10) : undefined;
const database = present(process.env.DB_NAME) ? process.env.DB_NAME : undefined;
const user = present(process.env.DB_USER) ? process.env.DB_USER : undefined;
const password = present(process.env.DB_PASSWORD) ? process.env.DB_PASSWORD : undefined;

if (!connectionString && !(host && database && user && password)) {
  console.error(
    "Database configuration not found. Provide a valid DATABASE_URL (preferred) or DB_HOST/DB_NAME/DB_USER/DB_PASSWORD in environment."
  );
  // Fail fast in development so misconfiguration is obvious.
  // If you want the app to continue without DB, remove or comment out the next line.
  throw new Error("Missing database configuration");
}

// Pool configuration with sensible defaults (override via env)
const poolConfig = connectionString
  ? { connectionString }
  : {
      host,
      port,
      database,
      user,
      password,
      max: present(process.env.PGPOOL_MAX) ? parseInt(process.env.PGPOOL_MAX, 10) : 10,
      idleTimeoutMillis: present(process.env.PG_IDLE_TIMEOUT) ? parseInt(process.env.PG_IDLE_TIMEOUT, 10) : 30000,
      connectionTimeoutMillis: present(process.env.PG_CONN_TIMEOUT) ? parseInt(process.env.PG_CONN_TIMEOUT, 10) : 2000,
    };

const pool = new Pool(poolConfig);

// When a new client connects: set a safe search_path and log success
pool.on("connect", (client) => {
  console.log("✅ New DB client connected");
  client
    .query(`SET search_path TO public, "$user"`)
    .then(() => {
      console.log("🔧 search_path set to public for new client");
    })
    .catch((err) => {
      console.error("⚠️ Failed to set search_path on connect:", err && err.message ? err.message : err);
      // do not throw here — keep pool usable but log the problem
    });
});

// Global pool error handler (idle client errors)
pool.on("error", (err) => {
  console.error("❌ Unexpected error on idle DB client:", err && err.stack ? err.stack : err);
  // Don't exit the process automatically here. Investigate; you may choose to restart gracefully.
});

/**
 * Optional debug checks in non-production to help during development.
 * Will not throw — only logs.
 */
async function debugDb() {
  try {
    const info = await pool.query(`SELECT current_database() AS db, current_user AS user, current_schema() AS schema;`);
    console.log("🔍 DB Info:", info.rows[0]);

    const sp = await pool.query("SHOW search_path");
    console.log("🔍 search_path:", sp.rows[0].search_path);

    const t = await pool.query(
      `SELECT schemaname, tablename FROM pg_tables WHERE tablename = 'holidays' ORDER BY schemaname, tablename;`
    );
    console.log("🔍 holidays table exists:", t.rows.length > 0 ? JSON.stringify(t.rows) : "❌ Not found");
  } catch (err) {
    console.error("⚠️ DB debug error (non-fatal):", err && err.message ? err.message : err);
  }
}

if (process.env.NODE_ENV !== "production") {
  // run but do not allow unhandled rejections to crash: catch and log
  debugDb().catch((e) => {
    console.error("Debug DB check failed (caught):", e && e.message ? e.message : e);
  });
}

export default pool;
