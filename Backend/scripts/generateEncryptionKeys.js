import crypto from 'crypto';

console.log('\n🔐 Generating encryption keys for QR codes...\n');

const encryptionKey = crypto.randomBytes(32).toString('hex');
const encryptionIV = crypto.randomBytes(16).toString('hex');

console.log('Add these lines to your .env file:\n');
console.log(`ENCRYPTION_KEY=${encryptionKey}`);
console.log(`ENCRYPTION_IV=${encryptionIV}`);

console.log('\n⚠️  IMPORTANT:');
console.log('1. Save these keys securely - they cannot be recovered if lost');
console.log('2. Use the same keys across all server instances');
console.log('3. Changing these keys will invalidate all previously generated QR codes');
console.log('4. If not provided, the system will generate deterministic keys based on JWT_SECRET\n');