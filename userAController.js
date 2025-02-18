import sql from "./db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";


function isValidCPF(cpf) {
  cpf = cpf.replace(/\D/g, ""); // Remove pontos e traços

  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let sum = 0, remainder;
  for (let index = 1; index <= 9; index++) sum += parseInt(cpf[index - 1]) * (11 - index);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf[9])) return false;

  sum = 0;
  for (let index = 1; index <= 10; index++) sum += parseInt(cpf[index - 1]) * (12 - index);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf[10])) return false;

  return true;
}


// Função para verificar se o usuário existe pelo email ou CPF
async function userByEmail(email, cpf) {
  const user = await sql`SELECT id, password FROM users WHERE email= ${email} OR cpf = ${cpf} LIMIT 1`;
  return user.length > 0 ? user[0] : null;
}

//momento do cadastro
export async function register(req) {
  let body;
    try {
      body = await req.json();
  
    } catch {
      return Response.json({ message: "Erro: corpo de requisição inválido"}, {status: 400});
    }
      const { name, email, password} = body;
      let {cpf} = body;
      cpf = cpf.replace(/\D/g, "");

      if(!name || !email || !password || !cpf){
          return Response.json({ message: "Todos os campos são obrigatórios"}, {status: 400});
      }
        if (!isValidCPF(cpf)){
            return Response.json({ message: "CPF inválids"});
        }

        if(await userByEmail(email, cpf)){
          return Response.json({ message: "Email ou CPF já registrado"}, {status: 400});
        }
            const hashedPassword = await bcrypt.hash(password, 10);
            await sql`INSERT INTO users (name, email, password, cpf) VALUES (${name},${email},${hashedPassword},${cpf})`;
      return Response.json({ message: "Usuário criado com sucesso"}, { status: 201});
  }
// Login de usuário
export async function login(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ message: "Erro: corpo da requisição inválido" }, { status: 400 });
  }

  const { email, cpf, password } = body;

  if ((!email && !cpf) || !password) {
    return Response.json({ message: "Informe email ou CPF e a senha" }, { status: 400 });
  }

  let formattedCpf = cpf ? cpf.replace(/\D/g, "") : null; 

  if (cpf && !isValidCPF(formattedCpf)) {
    return Response.json({ message: "CPF inválido" }, { status: 400 });
  }

  const user = await sql`
    SELECT id, password FROM users WHERE email = ${email} OR cpf = ${formattedCpf} LIMIT 1`;

  if (!user.length || !(await bcrypt.compare(password, user[0].password))) {
    return Response.json({ message: "Credenciais inválidas" }, { status: 401 });
  }

  const token = jwt.sign({ id: user[0].id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  return Response.json({ token }, { status: 200 });
}

// Buscar um usuário pelo ID
export async function getUser(req) {
  let body;
  try {
    body = await req.json();
  } catch (error) {
    return Response.json({ message: "Corpo da requisição inválido" }, { status: 400 });
  }

  const { id, cpf } = body;
  if (!id && !cpf) {
    return  Response.json({ message: "Informe ID ou CPF"}, { status: 400 });
  }

  const user = await sql`SELECT id, name, email, cpf FROM users WHERE id = ${id} OR cpf = ${cpf}`;
  if (user.length === 0) {
    return  Response(null, { status: 404});
  }

  return  Response.json(user[0], { status: 200 });
}

// Deletar usuário pelo ID
export async function deleteUser(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return  Response.json({ message: "Corpo da requisição inválido" }, { status: 400 });
  }

  const { id } = body;
  if (!id) {
    return  Response.json({ message: "ID é obrigatório." }, { status: 400 });
  }

  const { rowCount } = await sql`DELETE FROM users WHERE id = ${id}`;
  if (rowCount === 0) {
    return new Response(null, { status: 404 });
  }

    return Response.json({ message: "Usuário deletado com sucesso" }, { status: 200 });

}

// Atualizar informações do usuário
export async function updateUser(req) {
  let body;
  try {
    body = await req.json();
  } catch {
        return Response.json({ message: "Erro: corpo da requisição inválido" }, { status: 400 });
  }
  const { id, name, email, cpf } = body;
  if (!id || !name || !email || !cpf) {
    return Response.json({ message: "Todos os campos são obrigatórios" }, { status: 400 });
  }
      let cpfFormatado = cpf.replace(/\D/g, "");
  if (!isValidCPF(cpfFormatado)) {
          return Response.json({ message: "CPF inválido" }, { status: 400 });
  }

      const { rowCount } = await sql`UPDATE users SET name = ${name}, email = ${email}, cpf = ${cpfFormatado} WHERE id = ${id}`;
    if (rowCount === 0) {
    return Response(null, { status: 404 });
  }
              return Response.json({ message: "Usuário atualizado com sucesso" }, { status: 200 });
}
