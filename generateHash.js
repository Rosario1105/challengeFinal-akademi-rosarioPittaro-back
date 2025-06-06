const bcrypt = require("bcryptjs");

async function generateHash() {
  const password = "TuPasswordAdmin123";
  const hashed = await bcrypt.hash(password, 10);
  console.log(hashed);
}

generateHash();
