const connection = require('./bdConexao.js');

connection.query('SHOW TABLES;', (err, results) => {
  if (err) {
    console.error('Erro na consulta:', err);
  } else {
    console.log('Tabelas do banco:', results);
  }
  connection.end(); // Fecha a conexão após a consulta
});