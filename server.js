import userRoutes from "./userRoute.js";
import "dotenv/config";

const server = Bun.serve({
  port: 6060,
  fetch(req) {
    return userRoutes(req);
  },
});

console.log(`Servidor rodando em http://localhost:6060`);
export default server;
