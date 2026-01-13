#!/usr/bin/env node

/**
 * Script de configuración para Apple Wallet y Google Wallet
 * Ejecutar con: node setup-wallets.js
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

async function setupWallets() {
  console.log(`\n${colors.bright}${colors.blue}=================================`);
  console.log('🎫 Configuración de Wallets Digitales');
  console.log(`=================================${colors.reset}\n`);

  const config = {
    apple: {},
    google: {},
  };

  // Apple Wallet Configuration
  console.log(`${colors.cyan}📱 Configuración de Apple Wallet${colors.reset}\n`);
  
  const hasAppleDev = await question('¿Tienes una cuenta de Apple Developer? (s/n): ');
  
  if (hasAppleDev.toLowerCase() === 's') {
    config.apple.APPLE_TEAM_ID = await question('Ingresa tu Team ID (10 caracteres): ');
    config.apple.APPLE_PASS_TYPE_ID = await question('Ingresa tu Pass Type ID (ej: pass.com.tuempresa.loyalty): ');
    config.apple.APPLE_CERT_PASSWORD = await question('Ingresa la contraseña del certificado (opcional): ');
    config.apple.APPLE_WEB_SERVICE_URL = await question('URL del Web Service (ej: https://api.tudominio.com/wallet): ');
    
    console.log(`\n${colors.yellow}⚠️  Recuerda colocar los siguientes archivos en la carpeta certificates/:${colors.reset}`);
    console.log('   - signerCert.pem (Certificado de firma)');
    console.log('   - signerKey.pem (Llave privada)');
    console.log('   - WWDR.pem (Apple WWDR Certificate)\n');
    
    // Crear archivos de ejemplo
    await createAppleCertificateExamples();
  } else {
    console.log(`${colors.yellow}ℹ️  Apple Wallet no será configurado${colors.reset}\n`);
  }

  // Google Wallet Configuration
  console.log(`\n${colors.cyan}🤖 Configuración de Google Wallet${colors.reset}\n`);
  
  const hasGoogleConsole = await question('¿Tienes acceso a Google Pay & Wallet Console? (s/n): ');
  
  if (hasGoogleConsole.toLowerCase() === 's') {
    config.google.GOOGLE_WALLET_ISSUER_ID = await question('Ingresa tu Issuer ID (números): ');
    
    console.log(`\n${colors.yellow}⚠️  Recuerda:${colors.reset}`);
    console.log('   1. Descargar el archivo JSON del Service Account');
    console.log('   2. Renombrarlo a: google-service-account.json');
    console.log('   3. Colocarlo en la carpeta certificates/\n');
    
    // Crear archivo de ejemplo
    await createGoogleServiceAccountExample();
  } else {
    console.log(`${colors.yellow}ℹ️  Google Wallet no será configurado${colors.reset}\n`);
  }

  // Frontend Configuration
  console.log(`\n${colors.cyan}🌐 Configuración del Frontend${colors.reset}\n`);
  config.FRONTEND_URL = await question('URL del Frontend (ej: https://tudominio.com): ') || 'http://localhost:3000';
  config.API_URL = await question('URL del API Backend (ej: https://api.tudominio.com): ') || 'http://localhost:3001';

  // Generar archivo .env
  await generateEnvFile(config);
  
  // Crear estructura de carpetas
  await createFolderStructure();
  
  // Crear assets de ejemplo
  await createSampleAssets();

  console.log(`\n${colors.green}✅ Configuración completada exitosamente!${colors.reset}\n`);
  console.log(`${colors.bright}Próximos pasos:${colors.reset}`);
  console.log('1. Revisa el archivo .env.wallet generado');
  console.log('2. Copia las variables al archivo .env principal');
  console.log('3. Coloca los certificados en la carpeta certificates/');
  console.log('4. Personaliza los assets en la carpeta assets/wallet/');
  console.log('5. Reinicia el servidor\n');

  rl.close();
}

async function generateEnvFile(config) {
  let envContent = '# Wallet Configuration\n';
  envContent += '# Agregar estas variables al archivo .env principal\n\n';
  
  // Apple Wallet
  if (config.apple.APPLE_TEAM_ID) {
    envContent += '# Apple Wallet\n';
    envContent += `APPLE_TEAM_ID=${config.apple.APPLE_TEAM_ID}\n`;
    envContent += `APPLE_PASS_TYPE_ID=${config.apple.APPLE_PASS_TYPE_ID}\n`;
    envContent += `APPLE_CERT_PASSWORD=${config.apple.APPLE_CERT_PASSWORD || ''}\n`;
    envContent += `APPLE_WEB_SERVICE_URL=${config.apple.APPLE_WEB_SERVICE_URL}\n\n`;
  }
  
  // Google Wallet
  if (config.google.GOOGLE_WALLET_ISSUER_ID) {
    envContent += '# Google Wallet\n';
    envContent += `GOOGLE_WALLET_ISSUER_ID=${config.google.GOOGLE_WALLET_ISSUER_ID}\n\n`;
  }
  
  // URLs
  envContent += '# URLs\n';
  envContent += `FRONTEND_URL=${config.FRONTEND_URL}\n`;
  envContent += `API_URL=${config.API_URL}\n\n`;
  
  // Encryption keys
  envContent += '# Security (generar nuevas claves para producción)\n';
  envContent += `JWT_SECRET=${generateRandomString(32)}\n`;
  envContent += `ENCRYPTION_KEY=${generateRandomHex(32)}\n`;
  envContent += `ENCRYPTION_IV=${generateRandomHex(16)}\n`;
  
  await fs.writeFile(path.join(__dirname, '.env.wallet'), envContent);
  console.log(`\n${colors.green}✅ Archivo .env.wallet creado${colors.reset}`);
}

async function createFolderStructure() {
  const folders = [
    'certificates',
    'assets/wallet',
    'assets/wallet/apple',
    'assets/wallet/google',
  ];
  
  for (const folder of folders) {
    const folderPath = path.join(__dirname, folder);
    await fs.mkdir(folderPath, { recursive: true });
  }
  
  console.log(`${colors.green}✅ Estructura de carpetas creada${colors.reset}`);
}

async function createAppleCertificateExamples() {
  const exampleContent = `# Instrucciones para obtener certificados de Apple Wallet

## 1. Acceder a Apple Developer
- Ir a https://developer.apple.com
- Iniciar sesión con tu cuenta

## 2. Crear un Pass Type ID
- Ir a Certificates, Identifiers & Profiles
- Seleccionar Identifiers > Pass Type IDs
- Click en "+" para crear nuevo
- Usar formato: pass.com.tuempresa.loyalty

## 3. Crear certificado
- Ir a Certificates
- Crear nuevo certificado tipo "Pass Type ID Certificate"
- Seguir las instrucciones de Apple
- Descargar el certificado .cer

## 4. Convertir certificados
# Convertir .cer a .pem
openssl x509 -inform DER -in certificate.cer -out signerCert.pem

# Exportar llave privada
openssl pkcs12 -in Certificates.p12 -nocerts -out signerKey.pem

## 5. Descargar WWDR Certificate
- Descargar de: https://developer.apple.com/certificationauthority/AppleWWDRCA.cer
- Convertir: openssl x509 -inform DER -in AppleWWDRCA.cer -out WWDR.pem

## 6. Colocar archivos en certificates/
- signerCert.pem
- signerKey.pem  
- WWDR.pem
`;
  
  await fs.writeFile(
    path.join(__dirname, 'certificates', 'APPLE_SETUP.md'),
    exampleContent
  );
}

async function createGoogleServiceAccountExample() {
  const exampleContent = {
    type: 'service_account',
    project_id: 'tu-proyecto',
    private_key_id: 'key-id',
    private_key: '-----BEGIN PRIVATE KEY-----\nTU_LLAVE_PRIVADA\n-----END PRIVATE KEY-----\n',
    client_email: 'wallet-service@tu-proyecto.iam.gserviceaccount.com',
    client_id: 'client-id',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/wallet-service%40tu-proyecto.iam.gserviceaccount.com',
  };
  
  await fs.writeFile(
    path.join(__dirname, 'certificates', 'google-service-account-example.json'),
    JSON.stringify(exampleContent, null, 2)
  );
  
  const instructions = `# Instrucciones para configurar Google Wallet

## 1. Acceder a Google Pay & Wallet Console
- Ir a https://pay.google.com/business/console
- Iniciar sesión con tu cuenta de Google

## 2. Crear Issuer Account
- Si no tienes uno, crear un nuevo Issuer
- Anotar el Issuer ID (números)

## 3. Habilitar API
- Ir a Google Cloud Console
- Habilitar "Google Wallet API"

## 4. Crear Service Account
- En Google Cloud Console, ir a IAM & Admin > Service Accounts
- Crear nueva Service Account
- Nombre: wallet-service
- Otorgar rol: "Google Wallet Object Issuer"

## 5. Crear clave JSON
- En la Service Account creada, ir a Keys
- Add Key > Create New Key > JSON
- Descargar el archivo

## 6. Configurar
- Renombrar el archivo a: google-service-account.json
- Colocarlo en la carpeta certificates/
- NO commitear este archivo a git
`;
  
  await fs.writeFile(
    path.join(__dirname, 'certificates', 'GOOGLE_SETUP.md'),
    instructions
  );
}

async function createSampleAssets() {
  // Crear README para assets
  const assetsReadme = `# Assets para Wallets Digitales

## Apple Wallet
Coloca las siguientes imágenes en assets/wallet/apple/:

- icon.png (29x29)
- icon@2x.png (58x58)
- icon@3x.png (87x87)
- logo.png (160x50)
- logo@2x.png (320x100)
- logo@3x.png (480x150)
- strip.png (375x123)
- strip@2x.png (750x246)
- strip@3x.png (1125x369)
- thumbnail.png (90x90)
- thumbnail@2x.png (180x180)

## Google Wallet
Coloca las siguientes imágenes:

- logo.png (660x660)
- hero.jpg (1860x480)
- icon.png (512x512)

## Formato y recomendaciones:
- Usar PNG con fondo transparente para logos
- Optimizar imágenes para web
- Mantener consistencia de marca
- Usar colores corporativos (#8B5CF6)
`;
  
  await fs.writeFile(
    path.join(__dirname, 'assets/wallet', 'README.md'),
    assetsReadme
  );
  
  console.log(`${colors.green}✅ Assets de ejemplo creados${colors.reset}`);
}

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateRandomHex(bytes) {
  let result = '';
  for (let i = 0; i < bytes * 2; i++) {
    result += Math.floor(Math.random() * 16).toString(16);
  }
  return result;
}

// Ejecutar el setup
setupWallets().catch(console.error);