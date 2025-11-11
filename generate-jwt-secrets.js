// Script para gerar chaves JWT seguras
// Execute: node generate-jwt-secrets.js

const crypto = require('crypto');

console.log('\n🔐 Gerando chaves JWT seguras...\n');
console.log('='.repeat(80));

console.log('\n✨ JWT_SECRET:');
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log(jwtSecret);

console.log('\n✨ JWT_REFRESH_SECRET:');
const jwtRefreshSecret = crypto.randomBytes(64).toString('hex');
console.log(jwtRefreshSecret);

console.log('\n' + '='.repeat(80));
console.log('\n📋 Copie as chaves acima e adicione no Render.com:');
console.log('   Environment Variables > Add Environment Variable\n');

console.log('⚠️  NUNCA commite estas chaves no repositório!');
console.log('⚠️  Use chaves diferentes para cada ambiente (dev/prod)\n');
