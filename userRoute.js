import {
  register,
  login,
  getUser,
  deleteUser,
  updateUser,
  listUsers,
} from "./userAController.js";

//anmanhã faço adição direita do userRoute

export default async function userRoutes(req) {
  const url = new URL(req.url);
  const method = req.method;
  const pathParts = url.pathname.split("/").filter(Boolean);

  if (url.pathname === "/register" && method === "POST") {
    return register(req);
  }

  if (url.pathname === "/login" && method === "POST") {
    return login(req);
  }

  if (url.pathname === "/users" && method === "GET") {
    return listUsers(req);
  }

  if (pathParts[0] === "users" && pathParts.length === 2) {
    const id = pathParts[1];

    if (method === "GET") return getUser(req, id);
    if (method === "DELETE") return deleteUser(req, id);
    if (method === "PUT") return updateUser(req, id);
  }

  return new Response("Rota não encontrada", { status: 404 });
}
