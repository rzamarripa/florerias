import { PKPass } from "passkit-generator";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AppleWalletService {
  constructor() {
    this.passTypeIdentifier = process.env.APPLE_PASS_TYPE_ID || "pass.mx.zolt.lealtad";
    this.teamIdentifier = process.env.APPLE_TEAM_ID || "VHWEEDN99C";
    this.organizationName = "Corazón Violeta";
    this.certificatesPath = path.join(__dirname, "../../../certificates");
    this.wwdrPath = path.join(this.certificatesPath, "wwdr.pem");
  }

  /**
   * Genera un Apple Wallet Pass para un cliente
   * @param {Object} clientData - Datos del cliente (incluye logoUrl y heroUrl)
   * @param {String} qrData - Datos encriptados para el QR
   * @returns {Promise<Buffer>} - Buffer del archivo .pkpass
   */
  async generatePass(clientData, qrData) {
    try {
      const companyName = clientData.branchName || "Corazón Violeta";
      const clientName = `${clientData.name || ''} ${clientData.lastName || ''}`.trim() || "Cliente";
      
      // Datos del pass - Deben pasarse al constructor
      const passData = {
        formatVersion: 1,
        passTypeIdentifier: this.passTypeIdentifier,
        serialNumber: clientData.passSerialNumber,
        teamIdentifier: this.teamIdentifier,
        organizationName: this.organizationName,
        logoText: companyName,
        description: "Programa de Lealtad",
        backgroundColor: "rgb(15, 23, 42)",
        foregroundColor: "rgb(255, 255, 255)",
        labelColor: "rgb(148, 163, 184)",
      };
      
      // Estructura de campos para STORECARD pass - Como en la imagen de referencia
      const storeCardFields = {
        // Header: Puntos arriba a la derecha
        headerFields: [
          {
            key: "points",
            label: "PUNTOS",
            value: String(clientData.points || 0), // Convertir a string
            textAlignment: "PKTextAlignmentRight",
          },
        ],
        
        // Primary: Nombre del cliente (campo prominente)
        primaryFields: [
          {
            key: "memberName",
            label: "NOMBRE",
            value: clientName || "Cliente",
          },
        ],
        
        // Sin campos secundarios ni auxiliares para diseño limpio
        secondaryFields: [],
        auxiliaryFields: [],
        
        // Back: Información adicional (parte trasera)
        backFields: [
          {
            key: "memberCode",
            label: "Código de Miembro",
            value: String(clientData.clientNumber || "N/A"),
          },
          {
            key: "level",
            label: "Nivel",
            value: this.getClientLevel(clientData.points),
          },
          {
            key: "company",
            label: "Empresa",
            value: String(companyName || "Corazón Violeta"),
          },
          {
            key: "phone",
            label: "Teléfono",
            value: String(clientData.phoneNumber || "No registrado"),
          },
          {
            key: "email",
            label: "Email",
            value: String(clientData.email || "No registrado"),
          },
          {
            key: "terms",
            label: "Términos y Condiciones",
            value: "Los puntos acumulados pueden ser canjeados por recompensas en cualquier sucursal participante. Vigencia: 12 meses.",
          },
        ],
      };

      // Si tenemos certificados configurados, generar el pass firmado
      if (await this.hasCertificates()) {
        // Leer los certificados
        const certificates = {
          wwdr: await fs.readFile(this.wwdrPath),
          signerCert: await fs.readFile(path.join(this.certificatesPath, "signerCert.pem")),
          signerKey: await fs.readFile(path.join(this.certificatesPath, "signerKey.pem")),
          signerKeyPassphrase: process.env.APPLE_CERT_PASSWORD || "Z@ltLe@1t@d2026"
        };

        // IMPORTANTE: Usar modelo STORECARD para que el QR sea visible en el frente
        const modelPath = path.join(__dirname, "../../../models/storeCard.pass");
        console.log("\n📱 Configuración del Apple Wallet Pass:");
        console.log("  • Modelo:", modelPath);
        console.log("  • Empresa:", companyName);
        console.log("  • Cliente:", clientName);
        console.log("  • Puntos:", clientData.points || 0);
        console.log("  • Código:", clientData.clientNumber || "N/A");
        console.log("  • Pass Serial:", clientData.passSerialNumber);
        
        // Crear el pass CON passData como segundo parámetro (como el código de ejemplo)
        const pass = await PKPass.from({
          model: modelPath,
          certificates: certificates
        }, passData);
        
        console.log("Pass STORECARD creado con datos dinámicos, agregando campos...");
        
        // Agregar los campos del storeCard pass
        storeCardFields.headerFields.forEach(field => pass.headerFields.push(field));
        storeCardFields.primaryFields.forEach(field => pass.primaryFields.push(field));
        if (storeCardFields.secondaryFields.length > 0) {
          storeCardFields.secondaryFields.forEach(field => pass.secondaryFields.push(field));
        }
        if (storeCardFields.auxiliaryFields.length > 0) {
          storeCardFields.auxiliaryFields.forEach(field => pass.auxiliaryFields.push(field));
        }
        storeCardFields.backFields.forEach(field => pass.backFields.push(field));

        // CRÍTICO: Agregar el código QR - En storeCard aparece en el FRENTE
        console.log("Agregando código QR (aparecerá en el frente)...");
        const memberCode = String(clientData.clientNumber || clientData.passSerialNumber?.slice(0, 20) || "MEMBER");
        
        // Asegurar que qrData sea string
        const qrMessage = String(qrData || "");
        
        pass.setBarcodes({
          message: qrMessage,
          format: "PKBarcodeFormatQR",
          messageEncoding: "iso-8859-1",
          altText: memberCode // Código que aparece debajo del QR
        });
        console.log("✓ Código QR agregado - será visible en el FRENTE del pass");

        // Agregar imágenes dinámicas desde Firebase
        await this.addDynamicImages(pass, clientData.logoUrl, clientData.heroUrl);

        // Generar el pass buffer
        console.log("Generando buffer del pass...");
        const buffer = pass.getAsBuffer();
        
        // Verificar que sea un buffer válido
        if (!Buffer.isBuffer(buffer)) {
          console.error("PKPass no generó un buffer válido, recibido:", typeof buffer);
          throw new Error("Failed to generate valid pass buffer");
        }
        
        // Verificar que el buffer no esté vacío
        if (buffer.length === 0) {
          console.error("Buffer del pass está vacío");
          throw new Error("Generated pass buffer is empty");
        }
        
        // Log del tamaño del buffer para debugging
        console.log(`✅ Apple Wallet Pass generado exitosamente: ${buffer.length} bytes`);
        console.log(`Pass Serial Number: ${clientData.passSerialNumber}`);
        console.log(`Tipo de pass: STORECARD (QR visible en el frente)`);
        
        return buffer;
      } else {
        // Si no hay certificados, lanzar un error claro
        console.error("Certificados de Apple no encontrados en:", this.certificatesPath);
        throw new Error("Certificados de Apple no encontrados. Verifique que existan signerCert.pem, signerKey.pem y wwdr.pem en Backend/certificates/");
      }
    } catch (error) {
      console.error("Error generando Apple Wallet Pass:", error);
      throw error;
    }
  }

  /**
   * Determina el nivel del cliente basado en sus puntos
   * @param {Number} points - Puntos del cliente
   * @returns {String} - Nivel del cliente
   */
  getClientLevel(points) {
    if (points >= 1000) return "Oro";
    if (points >= 500) return "Plata";
    if (points >= 100) return "Bronce";
    return "Inicial";
  }

  /**
   * Genera un token de autenticación para el pass
   * @param {String} clientId - ID del cliente
   * @returns {String} - Token de autenticación
   */
  generateAuthToken(clientId) {
    const timestamp = Date.now();
    return Buffer.from(`${clientId}:${timestamp}`).toString("base64");
  }

  /**
   * Verifica si existen los certificados necesarios
   * @returns {Promise<Boolean>}
   */
  async hasCertificates() {
    try {
      const signerCertPath = path.join(this.certificatesPath, "signerCert.pem");
      const signerKeyPath = path.join(this.certificatesPath, "signerKey.pem");
      
      console.log("Verificando certificados en:", this.certificatesPath);
      console.log("- signerCert.pem:", signerCertPath);
      console.log("- signerKey.pem:", signerKeyPath);
      console.log("- wwdr.pem:", this.wwdrPath);
      
      await fs.access(signerCertPath);
      console.log("✓ signerCert.pem encontrado");
      
      await fs.access(signerKeyPath);
      console.log("✓ signerKey.pem encontrado");
      
      await fs.access(this.wwdrPath);
      console.log("✓ wwdr.pem encontrado");
      
      return true;
    } catch (error) {
      console.error("❌ Certificados de Apple no encontrados:", error.message);
      console.error("Path verificado:", this.certificatesPath);
      return false;
    }
  }

  /**
   * Descarga una imagen desde una URL y la convierte a Buffer
   * @param {String} url - URL de la imagen
   * @returns {Promise<Buffer|null>} - Buffer de la imagen o null si falla
   */
  async downloadImageAsBuffer(url) {
    try {
      if (!url) return null;
      
      const response = await fetch(url);
      if (!response.ok) {
        console.log(`Error descargando imagen: ${response.status}`);
        return null;
      }
      
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.log(`Error descargando imagen desde ${url}:`, error.message);
      return null;
    }
  }

  /**
   * Redimensiona una imagen a las dimensiones especificadas
   * @param {Buffer} imageBuffer - Buffer de la imagen original
   * @param {Number} width - Ancho deseado
   * @param {Number} height - Alto deseado
   * @returns {Promise<Buffer>} - Buffer de la imagen redimensionada
   */
  async resizeImage(imageBuffer, width, height) {
    try {
      return await sharp(imageBuffer)
        .resize(width, height, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Fondo transparente
        })
        .png()
        .toBuffer();
    } catch (error) {
      console.error("Error redimensionando imagen:", error.message);
      return imageBuffer; // Retornar original si falla
    }
  }

  /**
   * Agrega imágenes dinámicas al pass desde Firebase
   * @param {PKPass} pass - Instancia del pass
   * @param {String} logoUrl - URL del logo de la empresa
   * @param {String} heroUrl - URL de la imagen hero/banner
   */
  async addDynamicImages(pass, logoUrl, heroUrl) {
    try {
      console.log("Agregando imágenes dinámicas al pass...");
      
      // Descargar logo o usar default
      let logoBuffer = null;
      if (logoUrl) {
        console.log("Descargando logo desde:", logoUrl);
        logoBuffer = await this.downloadImageAsBuffer(logoUrl);
      }
      
      if (!logoBuffer) {
        const defaultLogoUrl = "https://i.imgur.com/6KZMZqA.png";
        console.log("Usando logo default desde:", defaultLogoUrl);
        logoBuffer = await this.downloadImageAsBuffer(defaultLogoUrl);
      }
      
      if (logoBuffer) {
        console.log("Logo buffer obtenido, tamaño original:", logoBuffer.length, "bytes");
        
        // ICON: Debe ser cuadrado
        // @1x: 29×29, @2x: 58×58, @3x: 87×87
        console.log("Redimensionando icon...");
        const icon1x = await this.resizeImage(logoBuffer, 29, 29);
        const icon2x = await this.resizeImage(logoBuffer, 58, 58);
        const icon3x = await this.resizeImage(logoBuffer, 87, 87);
        
        pass.addBuffer("icon.png", icon1x);
        pass.addBuffer("icon@2x.png", icon2x);
        pass.addBuffer("icon@3x.png", icon3x);
        console.log("✓ Icons agregados (29×29, 58×58, 87×87)");
        
        // LOGO: Máximo 160×50 @1x
        // @1x: max 160×50, @2x: max 320×100, @3x: max 480×150
        console.log("Redimensionando logo...");
        const logo1x = await this.resizeImage(logoBuffer, 160, 50);
        const logo2x = await this.resizeImage(logoBuffer, 320, 100);
        const logo3x = await this.resizeImage(logoBuffer, 480, 150);
        
        pass.addBuffer("logo.png", logo1x);
        pass.addBuffer("logo@2x.png", logo2x);
        pass.addBuffer("logo@3x.png", logo3x);
        console.log("✓ Logos agregados (160×50, 320×100, 480×150)");
      } else {
        console.error("No se pudo obtener ningún logo buffer");
      }
      
      // Si hay imagen hero, usarla para thumbnail (en generic pass)
      if (heroUrl) {
        console.log("Descargando imagen hero desde:", heroUrl);
        const heroBuffer = await this.downloadImageAsBuffer(heroUrl);
        if (heroBuffer) {
          // THUMBNAIL: Para generic pass
          // @1x: 90×90, @2x: 180×180, @3x: 270×270
          console.log("Redimensionando thumbnail...");
          const thumb1x = await this.resizeImage(heroBuffer, 90, 90);
          const thumb2x = await this.resizeImage(heroBuffer, 180, 180);
          const thumb3x = await this.resizeImage(heroBuffer, 270, 270);
          
          pass.addBuffer("thumbnail.png", thumb1x);
          pass.addBuffer("thumbnail@2x.png", thumb2x);
          pass.addBuffer("thumbnail@3x.png", thumb3x);
          console.log("✓ Thumbnails agregados (90×90, 180×180, 270×270)");
        }
      }
    } catch (error) {
      console.error("Error agregando imágenes dinámicas:", error.message);
      // Continuar sin imágenes si hay error
    }
  }

  /**
   * Actualiza un pass existente con nuevos datos
   * @param {String} passSerialNumber - Número de serie del pass
   * @param {Object} updates - Datos a actualizar
   */
  async updatePass(passSerialNumber, updates) {
    try {
      // Aquí implementarías la lógica para enviar una notificación push
      // al dispositivo para que actualice el pass
      const pushData = {
        passTypeIdentifier: this.passTypeIdentifier,
        serialNumber: passSerialNumber,
        updates: updates,
      };

      // TODO: Implementar servicio de push notifications
      console.log("Pass update queued:", pushData);
      
      return { success: true, message: "Actualización enviada" };
    } catch (error) {
      console.error("Error actualizando pass:", error);
      throw error;
    }
  }

  /**
   * Registra un dispositivo para recibir actualizaciones del pass
   * @param {String} deviceId - ID del dispositivo
   * @param {String} passSerialNumber - Número de serie del pass
   * @param {String} pushToken - Token de push notifications
   */
  async registerDevice(deviceId, passSerialNumber, pushToken) {
    try {
      // Aquí guardarías la información del dispositivo en la base de datos
      // para poder enviar push notifications cuando el pass se actualice
      
      const registration = {
        deviceId,
        passSerialNumber,
        pushToken,
        registeredAt: new Date(),
      };

      // TODO: Guardar en base de datos
      console.log("Device registered:", registration);
      
      return { success: true };
    } catch (error) {
      console.error("Error registering device:", error);
      throw error;
    }
  }

  /**
   * Desregistra un dispositivo
   * @param {String} deviceId - ID del dispositivo
   * @param {String} passSerialNumber - Número de serie del pass
   */
  async unregisterDevice(deviceId, passSerialNumber) {
    try {
      // TODO: Eliminar de la base de datos
      console.log("Device unregistered:", { deviceId, passSerialNumber });
      return { success: true };
    } catch (error) {
      console.error("Error unregistering device:", error);
      throw error;
    }
  }

  /**
   * Obtiene el último estado del pass
   * @param {String} passSerialNumber - Número de serie del pass
   * @returns {Object} - Estado actual del pass
   */
  async getPassStatus(passSerialNumber) {
    try {
      // Aquí obtendrías el estado actual del pass de la base de datos
      // Esto se usa cuando el dispositivo solicita una actualización
      
      // TODO: Implementar consulta a la base de datos
      return {
        lastUpdated: new Date().toISOString(),
        // Incluir los campos que pueden haber cambiado
      };
    } catch (error) {
      console.error("Error getting pass status:", error);
      throw error;
    }
  }
}

export default new AppleWalletService();