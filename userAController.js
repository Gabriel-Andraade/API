import "dotenv/config";
import sql from "./db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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
  const user = await sql`
    SELECT id, password FROM users 
    WHERE email = ${email} OR cpf = ${cpf} 
    LIMIT 1
  `;
  return user.length > 0 ? user[0] : null;
}

export async function register(req) {
  try {
    const { name, email, password, cpf } = await req.json();
    if (!name || !email || !password || !cpf) {
      return new Response(null, { status: 400 });
    }

    const cleanedCPF = cleanCPF(cpf);
    if (!isValidCPF(cleanedCPF)) {
      return new Response(null, { status: 400 });
    }

    if (await getUserByEmailOrCPF(email, cleanedCPF)) {
      return new Response(null, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await sql`
      INSERT INTO users (name, email, password, cpf)
      VALUES (${name}, ${email}, ${hashedPassword}, ${cleanedCPF})
    `;
    return new Response(null, { status: 201 });
  } catch (error) {
    console.error("Erro no register:", error);
    return new Response(null, { status: 500 });
  }
}

export async function login(req) {
  try {
    const { email, cpf, password } = await req.json();
    if ((!email && !cpf) || !password) {
      return new Response(null, { status: 400 });
    }

    const formattedCpf = cpf ? cleanCPF(cpf) : null;
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
    return new Response(JSON.stringify({ token }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return new Response(null, { status: 500 });
  }
}

export async function getUser(req) {
  try {
    const id = req.params ? req.params.id : undefined;
    if (!id) {
      return new Response(null, { status: 400 });
    }
    const user = await sql`
      SELECT id, name, email, cpf FROM users WHERE id = ${id}
    `;
    if (user.length === 0) {
      return new Response(null, { status: 404 });
    }
    return new Response(JSON.stringify(user[0]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro no getUser:", error);
    return new Response(null, { status: 500 });
  }
}

export async function deleteUser(req) {
  try {
    const id = req.params ? req.params.id : undefined;
    const { rowCount } = await sql`
      DELETE FROM users WHERE id = ${id}
    `;
    if (rowCount === 0) {
      return new Response(null, { status: 404 });
    }
    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("Erro no deleteUser:", error);
    return new Response(null, { status: 500 });
  }
}

export async function updateUser(req) {
  try {
    const id = req.params ? req.params.id : undefined;
    const { name, email, password } = await req.json();
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
    console.error("Erro no updateUser:", error);
    return new Response(null, { status: 500 });
  }
}

export async function listUsers(req) {
  try {
    const users = await sql`
      SELECT id, name, email, cpf FROM users
    `;
    return new Response(JSON.stringify(users), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro no listUsers:", error);
    return new Response(null, { status: 500 });
  }
}
