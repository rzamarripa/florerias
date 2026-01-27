import { PKPass } from "passkit-generator";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

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
      // Configuración del pass
      const passData = {
        formatVersion: 1,
        passTypeIdentifier: this.passTypeIdentifier,
        serialNumber: clientData.passSerialNumber,
        teamIdentifier: this.teamIdentifier,
        organizationName: this.organizationName,
        description: "Tarjeta de Fidelidad Corazón Violeta",
        logoText: "Corazón Violeta",
        foregroundColor: "rgb(255, 255, 255)",
        backgroundColor: "rgb(139, 92, 246)", // Purple
        labelColor: "rgb(255, 255, 255)",
        
        // Información del código de barras
        barcode: {
          message: qrData,
          format: "PKBarcodeFormatQR",
          messageEncoding: "iso-8859-1",
        },
        
        // Tipo de pass: Tarjeta de tienda genérica
        storeCard: {
          // Campos principales
          primaryFields: [
            {
              key: "points",
              label: "PUNTOS",
              value: clientData.points || 0,
              changeMessage: "Ahora tienes %@ puntos",
            },
          ],
          
          // Campos secundarios
          secondaryFields: [
            {
              key: "clientName",
              label: "CLIENTE",
              value: `${clientData.name} ${clientData.lastName}`,
            },
            {
              key: "clientNumber",
              label: "NÚMERO",
              value: clientData.clientNumber,
            },
          ],
          
          // Campos auxiliares
          auxiliaryFields: [
            {
              key: "branch",
              label: "SUCURSAL",
              value: clientData.branchName || "Principal",
            },
            {
              key: "level",
              label: "NIVEL",
              value: this.getClientLevel(clientData.points),
            },
          ],
          
          // Campos del reverso
          backFields: [
            {
              key: "terms",
              label: "Términos y Condiciones",
              value: "Los puntos acumulados pueden ser canjeados por recompensas en cualquier sucursal participante. Los puntos tienen una vigencia de 12 meses.",
            },
            {
              key: "website",
              label: "Sitio Web",
              value: "https://corazonvioleta.com",
            },
            {
              key: "phone",
              label: "Teléfono",
              value: clientData.phoneNumber || "N/A",
            },
            {
              key: "email",
              label: "Email",
              value: clientData.email || "N/A",
            },
            {
              key: "lastUpdate",
              label: "Última Actualización",
              value: new Date().toLocaleDateString("es-MX"),
              dateStyle: "PKDateStyleShort",
            },
          ],
        },
        
        // Web Service URL para actualizaciones push
        webServiceURL: process.env.APPLE_WEB_SERVICE_URL || "https://api.corazonvioleta.com/api/digital-cards",
        authenticationToken: this.generateAuthToken(clientData.clientId),
      };

      // Si tenemos certificados configurados, generar el pass firmado
      if (await this.hasCertificates()) {
        const pass = new PKPass({});
        
        // Configurar certificados
        pass.setCertificates(
          await fs.readFile(path.join(this.certificatesPath, "signerCert.pem")),
          await fs.readFile(path.join(this.certificatesPath, "signerKey.pem")),
          await fs.readFile(this.wwdrPath),
          process.env.APPLE_CERT_PASSWORD || "Z@ltLe@1t@d2026"
        );

        // Agregar los datos del pass
        Object.keys(passData).forEach(key => {
          pass[key] = passData[key];
        });

        // Agregar imágenes dinámicas desde Firebase
        await this.addDynamicImages(pass, clientData.logoUrl, clientData.heroUrl);

        // Generar el pass buffer
        const buffer = pass.getAsBuffer();
        return buffer;
      } else {
        // Para desarrollo: generar un pass no firmado (solo estructura)
        console.warn("No se encontraron certificados. Generando pass de prueba.");
        return this.generateMockPass(passData);
      }
    } catch (error) {
      console.error("Error generando Apple Wallet Pass:", error);
      throw error;
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
    // Implementar generación de token JWT o similar
    const timestamp = Date.now();
    return Buffer.from(`${clientId}:${timestamp}`).toString("base64");
  }

  /**
   * Verifica si existen los certificados necesarios
   * @returns {Promise<Boolean>}
   */
  async hasCertificates() {
    try {
      await fs.access(path.join(this.certificatesPath, "signerCert.pem"));
      await fs.access(path.join(this.certificatesPath, "signerKey.pem"));
      await fs.access(this.wwdrPath);
      return true;
    } catch (error) {
      console.log("Certificados de Apple no encontrados:", error.message);
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
   * Agrega imágenes dinámicas al pass desde Firebase
   * @param {PKPass} pass - Instancia del pass
   * @param {String} logoUrl - URL del logo de la empresa
   * @param {String} heroUrl - URL de la imagen hero/banner
   */
  async addDynamicImages(pass, logoUrl, heroUrl) {
    try {
      // Si hay logo de empresa, usarlo para icon y logo
      if (logoUrl) {
        const logoBuffer = await this.downloadImageAsBuffer(logoUrl);
        if (logoBuffer) {
          // Usar el mismo logo para icon y logo (PKPass los redimensionará)
          pass.addBuffer("icon", logoBuffer);
          pass.addBuffer("icon@2x", logoBuffer);
          pass.addBuffer("logo", logoBuffer);
          pass.addBuffer("logo@2x", logoBuffer);
        }
      }
      
      // Si hay imagen hero, usarla para strip
      if (heroUrl) {
        const heroBuffer = await this.downloadImageAsBuffer(heroUrl);
        if (heroBuffer) {
          pass.addBuffer("strip", heroBuffer);
          pass.addBuffer("strip@2x", heroBuffer);
        }
      }
    } catch (error) {
      console.log("Error agregando imágenes dinámicas:", error.message);
      // Continuar sin imágenes si hay error
    }
  }

  /**
   * Genera un pass de prueba para desarrollo
   * @param {Object} passData - Datos del pass
   * @returns {Buffer} - Buffer simulado del pass
   */
  generateMockPass(passData) {
    // Para desarrollo: retornar los datos del pass como JSON
    const mockPass = {
      ...passData,
      _mock: true,
      _message: "Este es un pass de prueba. Configure los certificados para generar passes reales.",
    };
    
    return Buffer.from(JSON.stringify(mockPass, null, 2));
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