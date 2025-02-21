import { expect, test, beforeAll, afterAll } from "bun:test";
import server from "../server.js"; // Importando o servidor
import sql from "../db.js"; // Importando conexão com o banco de dados
import {
  register,
  login,
  getUser,
  deleteUser,
  updateUser,
} from "../userAController.js";

// Usuários de teste
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
  }, // CPF inválido
];

let tokens = {};
let userIds = {};

beforeAll(async () => {
  // Registra e faz login dos usuários de teste
  for (const user of testUsers) {
    const req = { json: async () => user };
    const res = await register(req);
    if (res.status === 201) {
      const loginRes = await login(req);
      if (loginRes.status === 200) {
        const { token } = await loginRes.json();
        tokens[user.email] = token;
      }
    }
  }
});

afterAll(async () => {
  // Limpa os usuários de teste do banco de dados após todos os testes
  await sql`DELETE FROM users WHERE email IN (${testUsers.map(
    (u) => u.email
  )})`;

  // Fecha o servidor após todos os testes
  server.stop();
});

// Testes de Cadastro
test("Cadastro de usuário válido", async () => {
  const req = { json: async () => testUsers[0] };
  const res = await register(req);
  expect(res.status).toBe(400);
});

test("Cadastro com CPF inválido", async () => {
  const req = { json: async () => testUsers[3] };
  const res = await register(req);
  expect(res.status).toBe(400);
});

// Testes de Login
test("Login com credenciais corretas", async () => {
  const req = {
    json: async () => ({
      email: testUsers[0].email,
      password: testUsers[0].password,
    }),
  };
  const res = await login(req);
  expect(res.status).toBe(200);
});

test("Login com senha errada", async () => {
  const req = {
    json: async () => ({ email: testUsers[0].email, password: "senhaErrada" }),
  };
  const res = await login(req);
  expect(res.status).toBe(401);
});

// Testes de Usuário
test("Buscar usuário por ID", async () => {
  const req = { json: async () => ({}), params: { id: 1 } };
  const res = await getUser(req, req.params.id);
  expect(res.status).toBe(200);
});

test("Atualizar usuário", async () => {
  const req = {
    json: async () => ({ name: "Ayrton Senna atualizado" }),
    params: { id: 1 },
  };
  const res = await updateUser(req, req.params.id);
  expect(res.status).toBe(200);
});

test("Deletar usuário", async () => {
  const req = { params: { id: 1 } };
  const res = await deleteUser(req, req.params.id);
  expect(res.status).toBe(200);
});

test("Deletar usuário inexistente", async () => {
  const req = { params: { id: 999 } };
  const res = await deleteUser(req, req.params.id);
  expect(res.status).toBe(404);
});

test("Buscar usuário inexistente", async () => {
  const req = { json: async () => ({}), params: { id: 999 } };
  const res = await getUser(req, req.params.id);
  expect(res.status).toBe(404);
});

test("Cadastro com CPF já cadastrado", async () => {
  const req = { json: async () => testUsers[1] };
  const res = await register(req);
  expect(res.status).toBe(400);
});

test("Cadastro com e-mail já cadastrado", async () => {
  const req = { json: async () => testUsers[0] };
  const res = await register(req);
  expect(res.status).toBe(400);
});
