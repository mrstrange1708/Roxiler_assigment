require('dotenv').config();
const url = process.env.DATABASE_URL;
if (!url) {
  console.log("No DATABASE_URL found in .env");
  process.exit(1);
}

try {
  const parts = url.split('@')[0].split('://')[1].split(':');
  const user = parts[0];
  const pass = parts.slice(1).join(':');
  console.log("User:", user);
  console.log("Password length:", pass.length);
  
  // Check for special characters in password
  const hasSpecial = /[^a-zA-Z0-9]/.test(pass);
  console.log("Has special characters:", hasSpecial);
  if (hasSpecial) {
    console.log("Special characters found:", pass.match(/[^a-zA-Z0-9]/g).join(' '));
    // Let's print URL-encoded password
    console.log("URL Encoded Password:", encodeURIComponent(pass));
  }
} catch (e) {
  console.log("Error parsing URL:", e.message);
}
