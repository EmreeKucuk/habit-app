const crypto = require('crypto');

function generateSecrets() {
  console.log('🔐 Generating secure JWT secrets...\n');
  
  const jwtSecret = crypto.randomBytes(64).toString('hex');
  const refreshSecret = crypto.randomBytes(64).toString('hex');
  
  console.log('Copy these values to your .env file:\n');
  console.log('# JWT Secrets (Auto-generated)');
  console.log(`JWT_SECRET=${jwtSecret}`);
  console.log(`JWT_REFRESH_SECRET=${refreshSecret}`);
  console.log('\n✅ Secrets generated successfully!');
  console.log('⚠️  Keep these secrets secure and never share them publicly.');
}

generateSecrets();
