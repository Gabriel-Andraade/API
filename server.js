import { serve } from "bun";
import routes from "./userRoute.js";
import "dotenv/config";

const server = serve({
  port: 2345,
  fetch(req) {
    console.log(`Recebendo request: ${req.method} ${req.url}`);

    try {
      const url = new URL(req.url, `http://${req.headers.get("host")}`);
      console.log(`Caminho da URL: ${url.pathname}`);

      const route = routes.get(url.pathname);
      if (!route) {
        console.error(` Rota não encontrada: ${url.pathname}`);
        return new Response(null, {status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      return route(req);
    } catch (error) {
      console.error(" Erro no servidor:", error);
      return new Response(null, { status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
});

console.log(` Servidor rodando em http://localhost:2345`);
