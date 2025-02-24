import { expect, test, beforeAll, afterAll } from "bun:test";
import server from "../server.js";
import sql from "../db.js";
import {
  register,
  login,
  getUser,
  deleteUser,
  updateUser,
} from "../userAController.js";

const testUsers = [
  {
    name: "Ayrton Senna",
    email: "ayrton@email.com",
    password: "mclaren88",
    cpf: "40440022015",
  },
  {
    name: "Niki Lauda",
    email: "niki@email.com",
    password: "forzaferrari76",
    cpf: "11111111111",
  },
  {
    name: "James Hunt",
    email: "hunt@email.com",
    password: "mclaren76",
    cpf: "19283746509",
  },
  {
    name: "Usuário Inválido",
    email: "invalido@email.com",
    password: "test123",
    cpf: "12345678900",
  },
];

let tokens = {};
let userIds = {};

beforeAll(async () => {
  for (const user of testUsers.slice(0, 3)) {
    const registerReq = { json: async () => user };
    const registerRes = await register(registerReq);
    if (registerRes.status === 201) {
      const result = await sql`
        SELECT id FROM users WHERE email = ${user.email} LIMIT 1
      `;
      if (result.length > 0) {
        userIds[user.email] = result[0].id;
        console.log(
          `Usuário ${user.email} cadastrado com ID: ${userIds[user.email]}`
        );
      }
      const loginReq = {
        json: async () => ({ email: user.email, password: user.password }),
      };
      const loginRes = await login(loginReq);
      if (loginRes.status === 200) {
        const { token } = await loginRes.json();
        tokens[user.email] = token;
      }
    }
  }
});

afterAll(async () => {
  await sql`DELETE FROM users WHERE email IN (${testUsers.map(
    (u) => u.email
  )})`;
  if (server && typeof server.stop === "function") {
    server.stop();
  }
});

test("Cadastro de usuário duplicado retorna 400", async () => {
  const req = { json: async () => testUsers[0] };
  const res = await register(req);
  expect(res.status).toBe(400);
});

test("Cadastro com CPF inválido retorna 400", async () => {
  const req = { json: async () => testUsers[3] };
  const res = await register(req);
  expect(res.status).toBe(400);
});

test("Login com credenciais corretas retorna 200", async () => {
  const req = {
    json: async () => ({
      email: testUsers[0].email,
      password: testUsers[0].password,
    }),
  };
  const res = await login(req);
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.token).toBeDefined();
  tokens[testUsers[0].email] = data.token;
});

test("Login com senha errada retorna 401", async () => {
  const req = {
    json: async () => ({ email: testUsers[0].email, password: "senhaErrada" }),
  };
  const res = await login(req);
  expect(res.status).toBe(401);
});

test("Buscar usuário por ID retorna 200", async () => {
  const userId = userIds[testUsers[0].email];
  const req = { params: { id: userId } };
  const res = await getUser(req);
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.id).toBe(userId);
});

test("Atualizar usuário retorna 200", async () => {
  const userId = userIds[testUsers[0].email];
  console.log(`ID do usuário a ser atualizado: ${userId}`);
  const req = {
    json: async () => ({ name: "Ayrton Senna atualizado" }),
    params: { id: userId },
  };
  const res = await updateUser(req);
  if (res.status !== 200) {
    console.error("Erro ao atualizar usuário:", res.error || res.message);
  }
  expect(res.status).toBe(200);
});

test("Deletar usuário retorna 200", async () => {
  const userId = userIds[testUsers[0].email];
  const req = { params: { id: userId } };
  const res = await deleteUser(req);
  expect(res.status).toBe(200);
});

test("Deletar usuário inexistente retorna 404", async () => {
  const req = { params: { id: 9999999 } };
  const res = await deleteUser(req);
  expect(res.status).toBe(404);
});

test("Buscar usuário inexistente retorna 404", async () => {
  const req = { params: { id: 9999999 } };
  const res = await getUser(req);
  expect(res.status).toBe(404);
});

test("Cadastro com CPF já cadastrado retorna 400", async () => {
  const req = { json: async () => testUsers[1] };
  const res = await register(req);
  expect(res.status).toBe(400);
});

test("Cadastro com e-mail já cadastrado retorna 400", async () => {
  const req = { json: async () => testUsers[0] };
  const res = await register(req);
  expect(res.status).toBe(400);
});
