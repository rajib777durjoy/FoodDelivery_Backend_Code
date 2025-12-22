import dotenv from "dotenv";
dotenv.config();

export default {
  schema: './models/**/*.js',
  out: './drizzle/migrations',
  // database type
  dialect: 'postgresql',
  // database credentials
  dbCredentials: {
    url: process.env.PSQL_DATABASE_URL,  
    ssl: process.env.NODE_ENV === 'production', 
  },
};

