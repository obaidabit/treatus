const mysql = require("mysql2");

const pool = new mysql.createPool(process.env.DATABASE_URL).promise();

module.exports = pool;
