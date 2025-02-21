import { readFileSync } from "fs";
import sql from "./db.js";

async function initDB() {
  try {
    const schema = readFileSync("table_test.SQL", "utf8");
    await sql.unsafe(schema);
    console.log("Tabela 'users' criada ou já existente.");
  } catch (error) {
    console.error("Erro ao criar a tabela:", error);
  }
}

initDB();
