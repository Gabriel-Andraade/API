import {
  register,
  login,
  getUser,
  deleteUser,
  updateUser,
  listUsers,
} from "./userAController.js";

// Define as rotas com seus handlers por método HTTP
const routes = {
  "/register": {
    POST: register,
  },
  "/login": {
    POST: login,
  },
  "/users": {
    GET: listUsers,
  },
  "/users/:id": {
    GET: getUser,
    PUT: updateUser,
    DELETE: deleteUser,
  },
};

// Função para fazer o matching da URL com o padrão definido
function matchRoute(urlPath, routePattern) {
  const urlSegments = urlPath.split("/").filter(Boolean);
  const patternSegments = routePattern.split("/").filter(Boolean);
  if (urlSegments.length !== patternSegments.length) return { matched: false };

  const params = {};
  for (let i = 0; i < patternSegments.length; i++) {
    const p = patternSegments[i];
    const segment = urlSegments[i];
    if (p.startsWith(":")) {
      // Extrai o parâmetro (ex: ":id" se torna "id")
      params[p.slice(1)] = segment;
    } else if (p !== segment) {
      return { matched: false };
    }
  }
  return { matched: true, params };
}

export default async function userRoutes(req) {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const method = req.method;

  // Cabeçalhos padrão (incluindo CORS)
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Resposta para requisições OPTIONS (CORS preflight)
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  // Procura pela rota que corresponda ao pathname
  for (const routePattern in routes) {
    const { matched, params } = matchRoute(pathname, routePattern);
    if (matched) {
      const handler = routes[routePattern][method];
      if (handler) {
        // Insere os parâmetros extraídos em req.params
        req.params = params;
        return await handler(req);
      }
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers,
      });
    }
  }

  return new Response(JSON.stringify({ error: "Not Found" }), {
    status: 404,
    headers,
  });
}
