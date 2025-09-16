import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false, // fuerza a no usar SSL en local
});

export default pool;
