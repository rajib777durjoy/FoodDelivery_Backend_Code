import dotenv from "dotenv";
dotenv.config();

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.PSQL_DATABASE_URL || 'postgresql://durjoychando:jNQJ7NEy3h8x6kIJE1fzUEt9frUTBzjf@dpg-d5pq856r433s73dhl020-a.oregon-postgres.render.com/food_delivery_application_tq48',
  ssl: {
    rejectUnauthorized: false, 
  },
});

export const db = drizzle(pool);


