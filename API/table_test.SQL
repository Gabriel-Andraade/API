CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    cpf VARCHAR(11) UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
);
