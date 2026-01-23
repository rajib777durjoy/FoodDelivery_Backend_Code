import dotenv from "dotenv";
dotenv.config();

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.PSQL_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, 
  },
});

export const db = drizzle(pool);


