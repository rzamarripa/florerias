import QRCode from "qrcode";
import jwt from "jsonwebtoken";
import crypto from "crypto";

class QRCodeService {
  constructor() {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET environment variable is required");
    }
    this.jwtSecret = process.env.JWT_SECRET;
    
    // Use stable encryption keys from environment or generate deterministic ones
    if (process.env.ENCRYPTION_KEY) {
      this.encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    } else {
      // Generate a deterministic key based on JWT secret for consistency
      this.encryptionKey = crypto.createHash('sha256')
        .update(this.jwtSecret + '-encryption-key')
        .digest();
    }
    
    if (process.env.ENCRYPTION_IV) {
      this.encryptionIV = Buffer.from(process.env.ENCRYPTION_IV, 'hex');
    } else {
      // Generate a deterministic IV based on JWT secret for consistency
      this.encryptionIV = crypto.createHash('sha256')
        .update(this.jwtSecret + '-encryption-iv')
        .digest()
        .slice(0, 16); // IV must be 16 bytes for AES
    }
  }

  /**
   * Genera un código QR con datos encriptados del cliente
   * @param {Object} clientData - Datos del cliente
   * @returns {Promise<Object>} - QR en base64 y datos encriptados
   */
  async generateQRCode(clientData) {
    try {
      // Preparar los datos para el QR
      const qrPayload = {
        clientId: clientData.clientId,
        clientNumber: clientData.clientNumber,
        passSerialNumber: clientData.passSerialNumber,
        companyId: clientData.companyId,
        timestamp: Date.now(),
        version: "1.0",
      };

      // Encriptar los datos
      const encryptedData = this.encryptData(qrPayload);

      // Generar JWT token para mayor seguridad
      const token = jwt.sign(
        {
          data: encryptedData,
          exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 días
        },
        this.jwtSecret
      );

      // Generar el código QR
      const qrOptions = {
        errorCorrectionLevel: "M",
        type: "image/png",
        quality: 0.92,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        width: 512,
      };

      const qrCodeBase64 = await QRCode.toDataURL(token, qrOptions);

      return {
        qrCode: qrCodeBase64,
        qrData: token,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
      };
    } catch (error) {
      console.error("Error generando código QR:", error);
      throw error;
    }
  }

  /**
   * Valida y decodifica un código QR escaneado
   * @param {String} qrData - Datos del QR escaneado
   * @returns {Object} - Datos decodificados del cliente
   */
  async validateQRCode(qrData) {
    try {
      // Verificar el JWT
      const decoded = jwt.verify(qrData, this.jwtSecret);
      
      // Desencriptar los datos
      const decryptedData = this.decryptData(decoded.data);
      
      // Validar timestamp (evitar QR muy antiguos)
      const qrAge = Date.now() - decryptedData.timestamp;
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 días
      
      if (qrAge > maxAge) {
        throw new Error("QR code expired");
      }

      return {
        valid: true,
        data: decryptedData,
      };
    } catch (error) {
      console.error("Error validando QR:", error);
      return {
        valid: false,
        error: error.message,
      };
    }
  }

  /**
   * Genera un código de barras alternativo
   * @param {String} clientNumber - Número del cliente
   * @returns {Promise<String>} - Código de barras en base64
   */
  async generateBarcode(clientNumber) {
    try {
      const barcodeOptions = {
        format: "CODE128",
        width: 300,
        height: 100,
        displayValue: true,
        fontSize: 18,
        margin: 10,
      };

      // Aquí podrías usar una librería de códigos de barras si es necesario
      // Por ahora retornamos el número formateado
      return `BAR-${clientNumber}`;
    } catch (error) {
      console.error("Error generando código de barras:", error);
      throw error;
    }
  }

  /**
   * Genera un QR temporal para una transacción específica
   * @param {Object} transactionData - Datos de la transacción
   * @returns {Promise<Object>} - QR temporal
   */
  async generateTemporaryQR(transactionData) {
    try {
      const tempPayload = {
        ...transactionData,
        type: "temporary",
        expiresAt: Date.now() + (5 * 60 * 1000), // 5 minutos
        nonce: crypto.randomBytes(16).toString("hex"),
      };

      const token = jwt.sign(tempPayload, this.jwtSecret, {
        expiresIn: "5m",
      });

      const qrCodeBase64 = await QRCode.toDataURL(token, {
        errorCorrectionLevel: "L",
        width: 256,
      });

      return {
        qrCode: qrCodeBase64,
        token: token,
        expiresIn: 300, // segundos
      };
    } catch (error) {
      console.error("Error generando QR temporal:", error);
      throw error;
    }
  }

  /**
   * Encripta datos sensibles
   * @param {Object} data - Datos a encriptar
   * @returns {String} - Datos encriptados
   */
  encryptData(data) {
    try {
      const algorithm = "aes-256-cbc";
      // Keys are already Buffers from constructor
      const key = this.encryptionKey;
      const iv = this.encryptionIV;

      const cipher = crypto.createCipheriv(algorithm, key, iv);
      
      let encrypted = cipher.update(JSON.stringify(data), "utf8", "hex");
      encrypted += cipher.final("hex");

      return encrypted;
    } catch (error) {
      console.error("Error encriptando datos:", error);
      throw error;
    }
  }

  /**
   * Desencripta datos
   * @param {String} encryptedData - Datos encriptados
   * @returns {Object} - Datos desencriptados
   */
  decryptData(encryptedData) {
    try {
      const algorithm = "aes-256-cbc";
      // Keys are already Buffers from constructor
      const key = this.encryptionKey;
      const iv = this.encryptionIV;

      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      
      let decrypted = decipher.update(encryptedData, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return JSON.parse(decrypted);
    } catch (error) {
      console.error("Error desencriptando datos:", error);
      throw error;
    }
  }

  /**
   * Genera un QR para compartir puntos o recompensas
   * @param {Object} shareData - Datos para compartir
   * @returns {Promise<Object>} - QR para compartir
   */
  async generateShareQR(shareData) {
    try {
      const sharePayload = {
        type: "share",
        fromClient: shareData.fromClientId,
        toClient: shareData.toClientId,
        points: shareData.points,
        rewardId: shareData.rewardId,
        message: shareData.message,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 horas
        shareCode: crypto.randomBytes(8).toString("hex"),
      };

      const token = jwt.sign(sharePayload, this.jwtSecret, {
        expiresIn: "24h",
      });

      const qrCodeBase64 = await QRCode.toDataURL(token, {
        errorCorrectionLevel: "M",
        width: 256,
        color: {
          dark: "#8B5CF6", // Purple
          light: "#FFFFFF",
        },
      });

      return {
        qrCode: qrCodeBase64,
        shareCode: sharePayload.shareCode,
        expiresIn: 86400, // segundos
      };
    } catch (error) {
      console.error("Error generando QR de compartir:", error);
      throw error;
    }
  }

  /**
   * Verifica si un QR necesita rotación
   * @param {Date} lastRotation - Última fecha de rotación
   * @param {Number} intervalDays - Intervalo en días
   * @returns {Boolean} - Si necesita rotación
   */
  needsRotation(lastRotation, intervalDays = 30) {
    const daysSinceRotation = (Date.now() - new Date(lastRotation)) / (1000 * 60 * 60 * 24);
    return daysSinceRotation >= intervalDays;
  }

  /**
   * Genera un nuevo QR rotado manteniendo la información del cliente
   * @param {Object} clientData - Datos actuales del cliente
   * @returns {Promise<Object>} - Nuevo QR
   */
  async rotateQRCode(clientData) {
    try {
      // Mantener el mismo passSerialNumber pero actualizar el timestamp
      // Esto evita problemas con el escaneo del QR
      const rotatedData = {
        ...clientData,
        passSerialNumber: clientData.passSerialNumber, // Mantener el mismo
        rotatedAt: Date.now(),
        timestamp: Date.now(), // Nuevo timestamp
      };

      return await this.generateQRCode(rotatedData);
    } catch (error) {
      console.error("Error rotando QR:", error);
      throw error;
    }
  }
}

export default new QRCodeService();