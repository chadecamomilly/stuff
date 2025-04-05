const mysql = require('mysql2');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors()); // Para permitir requisições do front
app.use(express.json()); // Para receber JSON no body das requisições

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  multipleStatements: true
});

// Conectar ao MySQL antes de definir as rotas
connection.connect((err) => {
  if (err) {
    console.error('Erro ao conectar no MySQL:', err);
    return;
  }
  console.log('Conectado ao MySQL com sucesso!');
});

// Rota para criar um banco de dados
app.post('/criar-banco', (req, res) => {
  const { nomeBanco } = req.body;

  if (!nomeBanco) {
    return res.status(400).json({ error: 'O nome do banco é obrigatório.' });
  }

  // Validação do nome (apenas letras e números, sem espaços)
  const nomeValido = /^[a-zA-Z0-9_]+$/.test(nomeBanco);
  if (!nomeValido) {
    return res.status(400).json({ error: 'O nome do banco deve conter apenas letras, números e underline (_).' });
  }

  const query = `CREATE DATABASE ${nomeBanco}`;

  connection.query(query, (err, result) => {
    if (err) {
      console.error('Erro ao criar o banco:', err);

      // Captura erro de banco já existente
      if (err.code === 'ER_DB_CREATE_EXISTS') {
        return res.status(400).json({ error: `O banco '${nomeBanco}' já existe! Escolha outro nome.` });
      }

      return res.status(500).json({ error: 'Erro interno ao criar o banco de dados.' });
    }

    console.log("Resultado da criação do banco:", result);
    res.status(201).json({ message: `Banco de dados '${nomeBanco}' criado com sucesso!` });
  });
});

app.get('/listar-bancos', (req, res) => {
  const query = "SHOW DATABASES";

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao listar bancos:", err);
      return res.status(500).json({ error: "Erro ao listar bancos de dados" });
    }

    const bancos = results.map(db => db.Database);
    res.json({ bancos });
  });
});

app.post("/criar-tabela", (req, res) => {
  const { nomeBanco, nomeTabela, colunas } = req.body;

  if (!nomeBanco || !nomeTabela || !colunas || colunas.length === 0) {
    return res.status(400).json({ error: "Preencha todos os campos corretamente." });
  }

  // Gerando a query de criação da tabela
  const colunasQuery = colunas.map(col =>
    `${col.nome} ${col.tipo}${col.tipo === "VARCHAR" ? `(${col.tamanho})` : ""}`
  ).join(", ");

  const query = `CREATE TABLE ${nomeBanco}.${nomeTabela} (${colunasQuery})`;

  connection.query(query, (err, result) => {
    if (err) {
      console.error("Erro ao criar tabela:", err);
      return res.status(500).json({ error: "Erro ao criar a tabela." });
    }

    res.status(201).json({ message: `Tabela '${nomeTabela}' criada com sucesso!` });
  });
});


app.get("/listar-tabelas/:banco", (req, res) => {
  const nomeBanco = req.params.banco;
  const query = `SHOW TABLES FROM ${nomeBanco}`;

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao listar tabelas:", err);
      return res.status(500).json({ error: "Erro ao listar tabelas." });
    }

    const tabelas = results.map(row => Object.values(row)[0]);
    res.json({ tabelas });
  });
});

app.get("/listar-campos/:banco/:tabela", (req, res) => {
  const { banco, tabela } = req.params;

  // Adicione validação
  if (!banco || !tabela) {
    return res.status(400).json({ error: "Nome do banco e tabela são obrigatórios" });
  }

  const query = `SHOW COLUMNS FROM ${banco}.${tabela}`;

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao listar campos:", err);
      return res.status(500).json({
        error: "Erro ao listar campos.",
        details: err.message
      });
    }

    // Verifique se há resultados
    if (!results || results.length === 0) {
      return res.json({ campos: [] });
    }

    // Mapeie corretamente os campos
    const campos = results.map(row => ({
      nome: row.Field || row.field, // MySQL pode retornar como Field ou field
      tipo: row.Type || row.type,
      // Adicione outras propriedades úteis se necessário
    }));

    console.log("✅ Campos retornados:", campos);
    res.json({ campos });
  });
});


app.post("/inserir-registro", (req, res) => {
  console.log("Body recebido:", req.body);
  const { nomeBanco, nomeTabela, valores } = req.body;

  // Validação reforçada
  if (!nomeBanco || !nomeTabela) {
    return res.status(400).json({
      error: "Nome do banco e tabela são obrigatórios",
      details: "Forneça nomeBanco e nomeTabela válidos"
    });
  }

  if (!valores || typeof valores !== "object") {
    return res.status(400).json({
      error: "Valores inválidos",
      details: "Forneça um objeto com os valores a serem inseridos"
    });
  }



  // Filtra valores válidos
  const valoresFiltrados = {};
  for (const [key, value] of Object.entries(valores)) {
    if (key && value !== undefined && value !== null && value !== "") {
      valoresFiltrados[key] = value;
    }
  }

  if (Object.keys(valoresFiltrados).length === 0) {
    return res.status(400).json({
      error: "Nenhum valor válido",
      details: "Todos os valores fornecidos estão vazios ou são inválidos"
    });
  }

  // Prepara a query
  const colunas = Object.keys(valoresFiltrados).join(", ");
  const placeholders = Object.keys(valoresFiltrados).map(() => "?").join(", ");
  const valoresQuery = Object.values(valoresFiltrados);

  const query = `INSERT INTO \`${nomeBanco}\`.\`${nomeTabela}\` (${colunas}) VALUES (${placeholders})`;

  console.log("Query preparada:", query);
  console.log("Valores:", valoresQuery);

  // Executa a query
  connection.query(query, valoresQuery, (err, result) => {
    if (err) {
      console.error("Erro na query:", {
        error: err,
        query: query,
        values: valoresQuery
      });

      return res.status(500).json({
        error: "Erro ao inserir registro",
        details: err.sqlMessage || err.message,
        sqlErrorCode: err.code,
        sql: query
      });
    }

    res.json({
      success: true,
      message: `Registro inserido em ${nomeTabela} com sucesso!`,
      insertedId: result.insertId,
      affectedRows: result.affectedRows
    });
  });
});

app.get("/listar-registros/:banco/:tabela", (req, res) => {
  const { banco, tabela } = req.params;

  if (!banco || !tabela) {
    return res.status(400).json({ error: "Banco e tabela são obrigatórios" });
  }

  const query = `SELECT * FROM ${banco}.${tabela}`;

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao buscar registros:", err);
      return res.status(500).json({ error: "Erro ao buscar registros", details: err.sqlMessage });
    }

    res.json({ registros: results });
  });
});




// Inicia o servidor na porta 3001 (ou outra se preferir)
app.listen(3001, () => {
  console.log('Servidor rodando na porta 3001');
});

module.exports = connection;
