import { serve } from "bun";
import userRoutes from "./userRoute.js";
import "dotenv/config";

const startServer = (port) => {
  try {
    const serverInstance = serve({
      port,
      async fetch(req) {
        return await userRoutes(req);
      },
    });
    console.log(`Servidor rodando em http://localhost:${port}`);
    return serverInstance;
  } catch (error) {
    if (error.code === "EADDRINUSE") {
      console.error(`Porta ${port} em uso, tentando outra porta`);
      return startServer(port + 1);
    } else {
      throw error;
    }
  }
};

let serverInstance;

if (import.meta.main) {
  serverInstance = startServer(3000);
} else {
  serverInstance = {
    stop() {
      console.log("Servidor não iniciado no ambiente de testes.");
    },
  };
}

export default serverInstance;

// Tratamento de erro para bcrypt
try {
  require("bcrypt");
} catch (error) {
  console.error("Erro ao carregar o módulo bcrypt:", error);
}
