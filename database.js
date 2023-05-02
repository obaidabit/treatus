const mysql = require("mysql2");

const pool = new mysql.createPool({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  timezone: "+03:00",
  dateStrings: "DATETIME",
  port: process.env.PORT,
}).promise();

module.exports = pool;
