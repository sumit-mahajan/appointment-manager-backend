import "dotenv/config";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { pool } from "./db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const schema = readFileSync(join(__dirname, "schema.sql"), "utf-8");
  console.log("Applying schema to Neon PostgreSQL...");
  await pool.query(schema);
  console.log("Schema applied successfully.");
  await pool.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
