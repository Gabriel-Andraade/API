import { serve } from "bun";
import userRoutes from "./userRoute.js";
import "dotenv/config";

const port = 6060;

let serverInstance;

if (import.meta.main) {
  serverInstance = serve({
    port,
    async fetch(req) {
      return await userRoutes(req);
    },
  });
  console.log(`Servidor rodando em http://localhost:${port}`);
} else {
  serverInstance = {
    stop() {
      console.log("Servidor não iniciado no ambiente de testes.");
    },
  };
}

export default serverInstance;
