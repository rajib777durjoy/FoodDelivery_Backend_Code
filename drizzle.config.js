import dotenv from "dotenv";
dotenv.config();

export default {
  schema: './models/**/*.js',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.PSQL_DATABASE_URL + '?sslmode=require',
  },
};

