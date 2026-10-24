// O bot original abria uma conexão nova (mysql.createConnection) em cada
// arquivo de comando, sem reconexão automática — se o MySQL reiniciasse,
// os comandos paravam de funcionar até reiniciar o bot inteiro.
// Aqui é um único pool (mysql2), compartilhado por todos os comandos,
// que reconecta sozinho e também resolve a incompatibilidade do pacote
// "mysql" antigo com o MySQL 8 (plugin caching_sha2_password).

const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
