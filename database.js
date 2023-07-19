// import mysql2 library that deals with Database
const mysql = require("mysql2");
// creating a pool that is responsible for executing SQL queries
// pool is a group of connections that had been dealt with as one connection
// and using it as a promise in other JavaScripts pages
const pool = new mysql.createPool(process.env.DATABASE_URL).promise();
// exporting pool for use in other files
module.exports = pool;
