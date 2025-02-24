import postgres from "postgres";
import "dotenv/config";

let sql;

try {
  sql = postgres({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 9001,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
  });
} catch (error) {
  console.error("Erro ao conectar ao banco de dados:", error);
}

export default sql;
