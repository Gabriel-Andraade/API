import postgres from "postgres";
import "dotenv/config";

const sql = postgres({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5050,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
});

export default sql;
