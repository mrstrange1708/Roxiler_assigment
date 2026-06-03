require('dotenv').config();
const url = process.env.DATABASE_URL;
if (url) {
  const match = url.match(/:\/\/([^:]+):([^@]+)@/);
  if (match) {
    const password = match[2];
    console.log("Password character codes:");
    for (let i = 0; i < password.length; i++) {
      console.log(`${i}: ${password.charCodeAt(i)}`);
    }
  } else {
    console.log("No match for password in URL");
  }
} else {
  console.log("No DATABASE_URL");
}
