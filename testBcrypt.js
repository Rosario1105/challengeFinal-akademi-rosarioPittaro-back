// testBcrypt.js
const bcrypt = require('bcryptjs');

async function test() {
  const plain = 'Otto11';  
  const hash  = '$2b$10$krpCQ6fYrsdc3F9t7I/HQO.94vCOBW.D/lP2pqfh2zSoyjue/OnF6';
  
  console.log('Plain:', plain);
  console.log('Hash :', hash);
  
  const match = await bcrypt.compare(plain, hash);
  console.log('¿Coincide bcrypt.compare?:', match);
}

test().catch(console.error);
