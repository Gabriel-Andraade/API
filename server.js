import { serve } from "bun";
import routes from "./userRoute.js";
import "dotenv/config";

const server = serve({
  port: 5050,
  fetch(req) {
    console.log(`Recebendo request: ${req.method} ${req.url}`);

    try {
      const url = new URL(req.url, `http://${req.headers.get("host")}`);
      console.log(`Caminho da URL: ${url.pathname}`);

      const route = routes.get(url.pathname);
      if (!route) {
        console.error(`Rota não encontrada: ${url.pathname}`);
        return new Response(
          JSON.stringify({ message: "Rota não encontrada" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return route(req);
    } catch (error) {
      console.error("Erro no servidor:", error);
      return new Response(
        JSON.stringify({ message: "Erro interno do servidor" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },
});

if (import.meta.main) {
  console.log(`Servidor rodando em http://localhost:2345`);
}

export default server;

///voltei esse servisdor para esse jeito pois não sei oque eastava acontecendo que não estava querendo iniciar o servidor
