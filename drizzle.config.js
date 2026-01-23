import dotenv from "dotenv";
dotenv.config();

export default {
  schema: './models/**/*.js',
  out: './drizzle/migrations',
  // database type
  dialect: 'postgresql',
  // database credentials
  dbCredentials: {
    connectionString: process.env.PSQL_DATABASE_URL,  
    ssl: { rejectUnauthorized: false },
  },
};

