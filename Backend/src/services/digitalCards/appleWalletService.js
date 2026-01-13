import { PKPass } from "passkit-generator";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AppleWalletService {
  constructor() {
    this.passTypeIdentifier = process.env.APPLE_PASS_TYPE_ID || "pass.com.corazonvioleta.loyalty";
    this.teamIdentifier = process.env.APPLE_TEAM_ID || "";
    this.organizationName = "Corazón Violeta";
    this.certificatesPath = path.join(__dirname, "../../../certificates");
  }

  /**
   * Genera un Apple Wallet Pass para un cliente
   * @param {Object} clientData - Datos del cliente
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
        webServiceURL: process.env.APPLE_WEB_SERVICE_URL || "https://api.corazonvioleta.com/wallet",
        authenticationToken: this.generateAuthToken(clientData.clientId),
      };

      // Si tenemos certificados configurados, generar el pass firmado
      if (await this.hasCertificates()) {
        const pass = new PKPass({}, 
          await fs.readFile(path.join(this.certificatesPath, "signerCert.pem")),
          await fs.readFile(path.join(this.certificatesPath, "signerKey.pem")),
          {
            // Contraseña del certificado si es necesaria
            passphrase: process.env.APPLE_CERT_PASSWORD,
          }
        );

        // Agregar los datos del pass
        Object.keys(passData).forEach(key => {
          pass[key] = passData[key];
        });

        // Agregar imágenes si existen
        await this.addPassImages(pass);

        // Generar el pass
        return await pass.generate();
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
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Agrega imágenes al pass si existen
   * @param {PKPass} pass - Instancia del pass
   */
  async addPassImages(pass) {
    const imagesPath = path.join(this.certificatesPath, "../assets/wallet");
    
    const images = [
      { name: "icon.png", key: "icon" },
      { name: "icon@2x.png", key: "icon@2x" },
      { name: "logo.png", key: "logo" },
      { name: "logo@2x.png", key: "logo@2x" },
      { name: "strip.png", key: "strip" },
      { name: "strip@2x.png", key: "strip@2x" },
    ];

    for (const img of images) {
      try {
        const imagePath = path.join(imagesPath, img.name);
        const imageBuffer = await fs.readFile(imagePath);
        pass.addBuffer(img.key, imageBuffer);
      } catch (error) {
        // Si la imagen no existe, continuar sin ella
        console.log(`Imagen ${img.name} no encontrada, omitiendo...`);
      }
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