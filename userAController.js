import sql from "./db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";

function cleanCPF(cpf) {
  return cpf.replace(/\D/g, "");
}

function isValidCPF(cpf) {
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let sum = 0,
    remainder;

  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf[i], 10) * (10 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf[9], 10)) return false;

  sum = 0;

  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf[i], 10) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf[10], 10)) return false;

  return true;
}

async function getUserByEmailOrCPF(email, cpf) {
  const user =
    await sql`SELECT id, password FROM users WHERE email = ${email} OR cpf = ${cpf} LIMIT 1`;
  return user.length > 0 ? user[0] : null;
}

export async function register(req) {
  try {
    const body = await req.json();
    const { name, email, password } = body;
    let { cpf } = body;

    if (!name || !email || !password || !cpf) {
      return new Response(null, { status: 400 });
    }

    cpf = cleanCPF(cpf);

    if (!isValidCPF(cpf)) {
      return new Response(null, { status: 400 });
    }

    if (await getUserByEmailOrCPF(email, cpf)) {
      return new Response(null, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await sql`INSERT INTO users (name, email, password, cpf) VALUES (${name}, ${email}, ${hashedPassword}, ${cpf})`;
    return new Response(null, { status: 201 });
  } catch (error) {
    return new Response(null, { status: 500 });
  }
}

export function auth(route) {
  return async (req) => {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(null, { status: 403 });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return new Response(null, { status: 403 });
    }

    try {
      const id = jwt.verify(token, process.env.JWT_SECRET);
      return await route(req, id);
    } catch (error) {
      return new Response(null, { status: 403 });
    }
  };
}

export async function login(req) {
  try {
    const body = await req.json();
    const { email, cpf, password } = body;

    if ((!email && !cpf) || !password) {
      return new Response(null, { status: 400 });
    }

    let formattedCpf = cpf ? cleanCPF(cpf) : null;
    if (cpf && !isValidCPF(formattedCpf)) {
      return new Response(null, { status: 400 });
    }

    const user = await getUserByEmailOrCPF(email, formattedCpf);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return new Response(null, { status: 401 });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    return Response.json({ token }, { status: 200 });
  } catch (error) {
    return new Response(null, { status: 500 });
  }
}

export async function getUser(req, id) {
  try {
    const { id } = req.params;
    if (!id) {
      return new Response(null, { status: 400 });
    }

    const user =
      await sql`SELECT id, name, email, cpf FROM users WHERE id = ${id}`;
    if (user.length === 0) {
      return new Response(null, { status: 404 });
    }

    return Response.json(user[0], { status: 200 });
  } catch (error) {
    return new Response(null, { status: 500 });
  }
}
////para testar
import { writeFile } from "fs/promises";

export async function listUsers(req) {
  try {
    const users = await sql`SELECT id, name, email, cpf FROM users`;

    // Converte para JSON
    const jsonData = JSON.stringify(users, null, 2);

    // Salva no arquivo listUsers.json
    await writeFile("listUsers.json", jsonData, "utf8");

    return Response.json(users, { status: 200 });
  } catch (error) {
    return new Response(null, { status: 500 });
  }
}

////para testar

export async function deleteUser(req, id) {
  try {
    const { id } = req.params;
    const { rowCount } = await sql`DELETE FROM users WHERE id = ${id}`;
    if (rowCount === 0) {
      return new Response(null, { status: 404 });
    }
    return new Response(null, { status: 200 });
  } catch (error) {
    return new Response(null, { status: 500 });
  }
}

export async function updateUser(req, id) {
  try {
    const { id } = req.params;
    const body = await req.json();
    const { name, email, password } = body;
    if (!name && !email && !password) {
      return new Response(null, { status: 400 });
    }

    let updateFields = [];
    if (name) updateFields.push(sql`name = ${name}`);
    if (email) updateFields.push(sql`email = ${email}`);
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push(sql`password = ${hashedPassword}`);
    }

    const { rowCount } = await sql`
      UPDATE users
      SET ${sql.join(updateFields, sql`, `)}
      WHERE id = ${id}
    `;

    if (rowCount === 0) {
      return new Response(null, { status: 404 });
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    return new Response(null, { status: 500 });
  }
}
