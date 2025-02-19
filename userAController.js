import sql from "./db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { isReturnStatement } from "typescript";

function isValidCPF(cpf) {
  cpf = cpf.replace(/\D/g, "");

  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let sum = 0,
    remainder;
  for (let index = 1; index <= 9; index++)
    sum += parseInt(cpf[index - 1], 10) * (11 - index);
  remainder = (sum * 10) % 11;
  if (remainder >= 10) remainder = 0;
  if (remainder !== parseInt(cpf[9])) return false;

  sum = 0;
  for (let index = 1; index <= 10; index++)
    sum += parseInt(cpf[index - 1], 10) * (12 - index);
  remainder = (sum * 10) % 11;
  if (remainder >= 10) remainder = 0;
  if (remainder !== parseInt(cpf[10])) return false;

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
    console.log("Corpo recebido:", body); //para testar e encontrsr a falha.
    const { name, email, password } = body;
    let { cpf } = body;
    cpf = cpf.replace(/\D/g, "");

    if (!name || !email || !password || !cpf) {
      return new Response(null, { status: 400 });
    }
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

export async function login(req) {
  try {
    const body = await req.json();
    const { email, cpf, password } = body;

    if ((!email && !cpf) || !password) {
      return new Response(null, { status: 400 });
    }

    let formattedCpf = cpf ? cpf.replace(/\D/g, "") : null;
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

function authenticatetoken(req) {
  const authHeader = req.headers.get("Authorization");
}
export async function getUser(req) {
  try {
    const body = await req.json();
    const { id, cpf } = body;
    if (!id && !cpf) {
      return new Response(null, { status: 400 });
    }

    const user =
      await sql`SELECT id, name, email, cpf FROM users WHERE id = ${id} OR cpf = ${cpf}`;
    if (user.length === 0) {
      return new Response(null, { status: 404 });
    }

    return Response.json(user[0], { status: 200 });
  } catch (error) {
    return new Response(null, { status: 500 });
  }
}

export async function deleteUser(req) {
  try {
    const body = await req.json();
    const { id } = body;
    if (!id) {
      return new Response(null, { status: 400 });
    }

    const { rowCount } = await sql`DELETE FROM users WHERE id = ${id}`;
    if (rowCount === 0) {
      return new Response(null, { status: 404 });
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    return new Response(null, { status: 500 });
  }
}

export async function updateUser(req) {
  try {
    const body = await req.json();
    const { id, name, email, password } = body;
    if (!id || (!name && !email && !password)) {
      return new Response(null, { status: 400 });
    }

    let updateFields = [];
    if (name) updateFields.push(sql`name = ${name}`);
    if (email) updateFields.push(sql`email = ${email}`);
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push(sql`password = ${hashedPassword}`);
    }

    if (updateFields.length === 0) {
      return new Response(null, { status: 400 });
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
