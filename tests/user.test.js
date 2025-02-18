import { describe, expect, test } from "bun:test";

describe("User API", () => {
  test("should register a user", async () => {
    const response = await fetch("http://localhost:2345/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Niki",
        email: "forzaferrari@email.com",
        password: "Lauda",
        cpf: "111.222.333.44",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();
    expect(response.status).toBe(201);
    expect(data.message).toBe("Usuário criado com sucesso!");
  });

  test("should log in", async () => {
    const response = await fetch("http://localhost:2345/login", {
      method: "POST",
      body: JSON.stringify({
        email: "forzaferrari@email.com",
        password: "Lauda",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(typeof data.token).toBe("string");
  });
});
