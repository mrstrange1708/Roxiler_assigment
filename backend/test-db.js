const { Client } = require('pg');
require('dotenv').config();

console.log("Testing connection to database...");
console.log("URL:", process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 40) + "..." : "undefined");

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

client.connect()
  .then(() => {
    console.log("SUCCESS: Connected to PostgreSQL!");
    client.end();
  })
  .catch(err => {
    console.error("FAILURE: Could not connect to PostgreSQL:", err.message);
    console.error(err);
  });
