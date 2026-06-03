const { Client } = require('pg');
require('dotenv').config();

let url = process.env.DATABASE_URL;
if (!url) {
  console.log("No DATABASE_URL found");
  process.exit(1);
}

// Clean URL: remove channel_binding if present
console.log("Original URL length:", url.length);
let cleanUrl = url.replace(/channel_binding=[^&]+&?/, '').replace(/\?&/, '?').replace(/&$/, '');
console.log("Cleaned URL length:", cleanUrl.length);

const client = new Client({
  connectionString: cleanUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

client.connect()
  .then(() => {
    console.log("SUCCESS: Connected to PostgreSQL with cleaned URL!");
    client.end();
  })
  .catch(err => {
    console.error("FAILURE with cleaned URL:", err.message);
  });
