import { GoogleAuth } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class GoogleWalletService {
  constructor() {
    this.baseUrl = 'https://walletobjects.googleapis.com/walletobjects/v1';
    this.issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
    this.classId = `${this.issuerId}.corazon_violeta_loyalty`;
    this.auth = null;
    this.initialized = false;
  }

  /**
   * Inicializa el servicio con las credenciales de Google
   */
  async initialize() {
    if (this.initialized) return;

    try {
      const keyFilePath = path.join(__dirname, '../../../certificates/google-service-account.json');
      
      // Verificar si existe el archivo de credenciales
      try {
        await fs.access(keyFilePath);
      } catch {
        console.warn('Google Wallet: Archivo de credenciales no encontrado');
        return;
      }

      // Configurar autenticación
      this.auth = new GoogleAuth({
        keyFile: keyFilePath,
        scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
      });

      this.initialized = true;
      console.log('Google Wallet Service inicializado correctamente');
    } catch (error) {
      console.error('Error inicializando Google Wallet Service:', error);
    }
  }

  /**
   * Crea o actualiza la clase de tarjeta de fidelidad
   */
  async createOrUpdateLoyaltyClass(heroImageUrl = null, companyName = 'Corazón Violeta', logoUrl = null) {
    await this.initialize();
    if (!this.auth) throw new Error('Google Wallet no configurado');

    const client = await this.auth.getClient();
    
    // En desarrollo usar APPROVED para evitar el mensaje de prueba
    // En producción usar UNDER_REVIEW hasta que Google apruebe la clase
    const reviewStatus = process.env.NODE_ENV === 'development' ? 'APPROVED' : 'UNDER_REVIEW';
    
    const loyaltyClass = {
      id: this.classId,
      issuerName: companyName,
      programName: 'Programa de Fidelidad',
      programLogo: {
        sourceUri: {
          uri: logoUrl || 'https://i.imgur.com/6KZMZqA.png', // Logo dinámico o default
        },
      },
      reviewStatus: reviewStatus,
      hexBackgroundColor: '#2563EB', // Azul más oscuro como CardPreview
      countryCode: 'MX',
      multipleDevicesAndHoldersAllowedStatus: 'MULTIPLE_HOLDERS',
      // callbackOptions: {
      //   url: `${process.env.API_URL}/api/digital-cards/google-callback`,
      //   updateRequestUrl: `${process.env.API_URL}/api/digital-cards/google-update`,
      // },
      classTemplateInfo: {
        cardTemplateOverride: {
          cardRowTemplateInfos: [
            {
              twoItems: {
                startItem: {
                  firstValue: {
                    fields: [{
                      fieldPath: 'object.textModulesData[0].header',
                    }],
                  },
                  secondValue: {
                    fields: [{
                      fieldPath: 'object.textModulesData[0].body',
                    }],
                  },
                },
                endItem: {
                  firstValue: {
                    fields: [{
                      fieldPath: 'object.textModulesData[1].header',
                    }],
                  },
                  secondValue: {
                    fields: [{
                      fieldPath: 'object.textModulesData[1].body',
                    }],
                  },
                },
              },
            },
          ],
        },
      },
      enableSmartTap: true,
      redemptionIssuers: [this.issuerId],
    };

    // Temporalmente sin imágenes para evitar errores de Google Wallet
    // TODO: Agregar imágenes cuando Google las acepte
    // if (heroImageUrl && heroImageUrl.includes('firebasestorage.googleapis.com')) {
    //   loyaltyClass.heroImage = {
    //     sourceUri: {
    //       uri: heroImageUrl,
    //     },
    //   };
    // }

    try {
      // Intentar obtener la clase existente
      const getUrl = `${this.baseUrl}/loyaltyClass/${this.classId}`;
      const getResponse = await client.request({ url: getUrl, method: 'GET' });
      
      // Si existe, actualizar
      const updateUrl = `${this.baseUrl}/loyaltyClass/${this.classId}`;
      await client.request({
        url: updateUrl,
        method: 'PUT',
        data: loyaltyClass,
      });
      
      console.log('Clase de fidelidad actualizada con reviewStatus:', reviewStatus);
    } catch (error) {
      if (error.response?.status === 404) {
        // Si no existe, crear
        const createUrl = `${this.baseUrl}/loyaltyClass`;
        await client.request({
          url: createUrl,
          method: 'POST',
          data: loyaltyClass,
        });
        console.log('Clase de fidelidad creada con reviewStatus:', reviewStatus);
      } else {
        throw error;
      }
    }
  }

  /**
   * Genera un objeto de tarjeta de fidelidad para un cliente
   */
  async generateLoyaltyObject(clientData) {
    await this.initialize();
    if (!this.auth) throw new Error('Google Wallet no configurado');
    if (!this.issuerId) throw new Error('GOOGLE_WALLET_ISSUER_ID no configurado en .env');

    // Usar passSerialNumber si existe, o generar uno nuevo basado en clientNumber y timestamp
    const uniqueId = clientData.passSerialNumber || `${clientData.clientNumber}_${Date.now()}`;
    const objectId = `${this.issuerId}.${uniqueId}`;
    const companyName = clientData.branchName || 'Corazón Violeta';
    
    console.log('Generando objeto de fidelidad:', {
      issuerId: this.issuerId,
      uniqueId,
      objectId,
      clientNumber: clientData.clientNumber
    });
    
    // La imagen hero ya se configuró en createOrUpdateLoyaltyClass
    
    const loyaltyObject = {
      id: objectId,
      classId: this.classId,
      accountId: clientData.clientNumber,
      accountName: `${clientData.name} ${clientData.lastName}`,
      state: 'ACTIVE',
      heroImage: clientData.heroUrl ? {
        sourceUri: {
          uri: clientData.heroUrl,
        },
      } : undefined,
      barcode: {
        type: 'QR_CODE',
        value: clientData.qrData || clientData.clientNumber,
        alternateText: clientData.clientNumber,
      },
      loyaltyPoints: {
        balance: {
          int: clientData.points || 0,
        },
        label: 'Puntos',
      },
      secondaryLoyaltyPoints: {
        balance: {
          string: this.getClientLevel(clientData.points),
        },
        label: 'Nivel',
      },
      linkedOfferIds: [], // Aquí se pueden agregar ofertas vinculadas
      messages: [],
      validTimeInterval: {
        start: {
          date: new Date().toISOString(),
        },
        end: {
          date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 año
        },
      },
      locations: clientData.locations || [],
      textModulesData: [
        {
          header: 'PUNTOS ACUMULADOS',
          body: `${clientData.points || 0} pts`,
          id: 'points_display',
        },
        {
          header: 'USUARIO',
          body: `${clientData.name} ${clientData.lastName}`,
          id: 'user_name',
        },
      ],
      infoModuleData: {
        labelValueRows: [
          {
            columns: [
              {
                label: 'Nombre de miembro',
                value: `${clientData.name} ${clientData.lastName}`,
              },
            ],
          },
          {
            columns: [
              {
                label: 'ID de miembro',
                value: clientData.clientNumber,
              },
            ],
          },
          {
            columns: [
              {
                label: 'Programa de Fidelidad',
                value: 'Disfruta de los beneficios exclusivos y acumula puntos en cada compra.',
              },
            ],
          },
        ],
        showLastUpdateTime: false,
      },
      linksModuleData: {
        uris: [
          {
            uri: process.env.FRONTEND_URL || 'https://corazonvioleta.com',
            description: 'Sitio Web',
          },
        ],
      },
      hasUsers: true,
    };

    const client = await this.auth.getClient();
    
    try {
      // Primero intentar obtener si ya existe
      try {
        const getUrl = `${this.baseUrl}/loyaltyObject/${objectId}`;
        const existingObject = await client.request({
          url: getUrl,
          method: 'GET',
        });
        
        // Si ya existe, actualizarlo
        const updateUrl = `${this.baseUrl}/loyaltyObject/${objectId}`;
        const response = await client.request({
          url: updateUrl,
          method: 'PATCH',
          data: {
            state: 'ACTIVE',
            loyaltyPoints: loyaltyObject.loyaltyPoints,
            textModulesData: loyaltyObject.textModulesData,
            secondaryLoyaltyPoints: loyaltyObject.secondaryLoyaltyPoints,
          },
        });
        
        console.log('Objeto de fidelidad actualizado:', objectId);
        
        return {
          objectId,
          saveUrl: this.generateSaveUrl(objectId),
          loyaltyObject: response.data,
        };
      } catch (getError) {
        // Si no existe (404), crear uno nuevo
        if (getError.response?.status === 404) {
          const createUrl = `${this.baseUrl}/loyaltyObject`;
          const response = await client.request({
            url: createUrl,
            method: 'POST',
            data: loyaltyObject,
          });
          
          console.log('Objeto de fidelidad creado:', objectId);
          
          // Verificar que el objeto se creó correctamente
          const verifyUrl = `${this.baseUrl}/loyaltyObject/${objectId}`;
          try {
            await client.request({
              url: verifyUrl,
              method: 'GET',
            });
            console.log('Objeto verificado exitosamente');
          } catch (verifyError) {
            console.error('Error verificando objeto:', verifyError);
          }
          
          return {
            objectId,
            saveUrl: this.generateSaveUrl(objectId),
            loyaltyObject: response.data,
          };
        }
        throw getError;
      }
    } catch (error) {
      console.error('Error procesando objeto de fidelidad:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Genera el enlace para guardar la tarjeta en Google Wallet
   */
  generateSaveUrl(objectId) {
    try {
      // Leer el service account para obtener el client_email correcto
      const keyFile = JSON.parse(
        fsSync.readFileSync(
          path.join(__dirname, '../../../certificates/google-service-account.json'),
          'utf8'
        )
      );

      const claims = {
        iss: keyFile.client_email, // Usar el client_email del archivo de credenciales
        aud: 'google',
        origins: [], // Dejar vacío para permitir todos los orígenes
        typ: 'savetowallet',
        payload: {
          loyaltyObjects: [
            {
              id: objectId,
            },
          ],
        },
      };

      const jwt = this.signJWT(claims);
      const saveUrl = `https://pay.google.com/gp/v/save/${jwt}`;
      
      console.log('SaveUrl generado:', {
        objectId,
        issuer: keyFile.client_email,
        jwtLength: jwt.length,
        url: saveUrl.substring(0, 80) + '...'
      });
      
      return saveUrl;
    } catch (error) {
      console.error('Error generando saveUrl:', error);
      // Si hay error, intentar con valores por defecto
      const fallbackClaims = {
        iss: 'zolt-wallet@zolt-wallet.iam.gserviceaccount.com',
        aud: 'google',
        origins: [],
        typ: 'savetowallet',
        payload: {
          loyaltyObjects: [
            {
              id: objectId,
            },
          ],
        },
      };
      const jwt = this.signJWT(fallbackClaims);
      return `https://pay.google.com/gp/v/save/${jwt}`;
    }
  }

  /**
   * Actualiza los puntos de una tarjeta existente
   */
  async updateLoyaltyPoints(objectId, newPoints) {
    await this.initialize();
    if (!this.auth) throw new Error('Google Wallet no configurado');

    const client = await this.auth.getClient();
    
    const updateData = {
      loyaltyPoints: {
        balance: {
          int: newPoints,
        },
        label: 'Puntos',
      },
      secondaryLoyaltyPoints: {
        balance: {
          string: this.getClientLevel(newPoints),
        },
        label: 'Nivel',
      },
      state: 'ACTIVE',
    };

    try {
      const updateUrl = `${this.baseUrl}/loyaltyObject/${objectId}`;
      const response = await client.request({
        url: updateUrl,
        method: 'PATCH',
        data: updateData,
      });
      
      console.log('Puntos actualizados en Google Wallet');
      return response.data;
    } catch (error) {
      console.error('Error actualizando puntos:', error);
      throw error;
    }
  }

  /**
   * Agrega un mensaje a la tarjeta
   */
  async addMessage(objectId, header, body) {
    await this.initialize();
    if (!this.auth) throw new Error('Google Wallet no configurado');

    const client = await this.auth.getClient();
    
    const message = {
      header,
      body,
      displayInterval: {
        start: {
          date: new Date().toISOString(),
        },
      },
    };

    try {
      const url = `${this.baseUrl}/loyaltyObject/${objectId}/addMessage`;
      const response = await client.request({
        url,
        method: 'POST',
        data: {
          message,
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error agregando mensaje:', error);
      throw error;
    }
  }

  /**
   * Obtiene el estado de una tarjeta
   */
  async getLoyaltyObject(objectId) {
    await this.initialize();
    if (!this.auth) throw new Error('Google Wallet no configurado');

    const client = await this.auth.getClient();
    
    try {
      const url = `${this.baseUrl}/loyaltyObject/${objectId}`;
      const response = await client.request({
        url,
        method: 'GET',
      });
      
      return response.data;
    } catch (error) {
      console.error('Error obteniendo objeto de fidelidad:', error);
      throw error;
    }
  }

  /**
   * Desactiva una tarjeta
   */
  async deactivateLoyaltyObject(objectId) {
    await this.initialize();
    if (!this.auth) throw new Error('Google Wallet no configurado');

    const client = await this.auth.getClient();
    
    try {
      const url = `${this.baseUrl}/loyaltyObject/${objectId}`;
      const response = await client.request({
        url,
        method: 'PATCH',
        data: {
          state: 'INACTIVE',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error desactivando tarjeta:', error);
      throw error;
    }
  }

  /**
   * Determina el nivel del cliente basado en sus puntos
   */
  getClientLevel(points) {
    if (points >= 5000) return 'Diamante';
    if (points >= 2000) return 'Oro';
    if (points >= 1000) return 'Plata';
    if (points >= 500) return 'Bronce';
    return 'Inicial';
  }

  /**
   * Firma un JWT con la clave privada del service account
   */
  signJWT(claims) {
    try {
      // Leer la clave privada del service account
      const keyFile = JSON.parse(
        fsSync.readFileSync(
          path.join(__dirname, '../../../certificates/google-service-account.json'),
          'utf8'
        )
      );

      const token = jwt.sign(
        claims,
        keyFile.private_key,
        {
          algorithm: 'RS256',
        }
      );

      return token;
    } catch (error) {
      console.error('Error firmando JWT:', error);
      throw error;
    }
  }

  /**
   * Genera un pass genérico de Google Wallet (para desarrollo)
   */
  generateGenericPass(clientData) {
    // URL de demostración para desarrollo
    const demoUrl = `https://pay.google.com/gp/v/save/demo_${clientData.clientNumber}`;
    
    return {
      url: demoUrl,
      objectId: `demo.${clientData.clientNumber}`,
      message: 'Modo de desarrollo: Configure las credenciales de Google Wallet para usar passes reales',
      instructions: [
        '1. Cree una cuenta en Google Pay & Wallet Console',
        '2. Obtenga un Issuer ID',
        '3. Cree un Service Account con permisos de Wallet',
        '4. Descargue el archivo JSON de credenciales',
        '5. Colóquelo en Backend/certificates/google-service-account.json',
        '6. Configure GOOGLE_WALLET_ISSUER_ID en el archivo .env',
      ],
    };
  }

  /**
   * Actualiza la imagen hero de la clase
   */
  async updateClassHeroImage(heroUrl) {
    if (!this.auth || !heroUrl) return;
    
    try {
      const client = await this.auth.getClient();
      const updateUrl = `${this.baseUrl}/loyaltyClass/${this.classId}`;
      
      await client.request({
        url: updateUrl,
        method: 'PATCH',
        data: {
          heroImage: {
            sourceUri: {
              uri: heroUrl,
            },
          },
        },
      });
      
      console.log('Imagen hero actualizada en la clase');
    } catch (error) {
      console.error('Error actualizando imagen hero:', error);
    }
  }

  /**
   * Verifica si el servicio está configurado correctamente
   */
  async isConfigured() {
    await this.initialize();
    return this.initialized && this.auth !== null && this.issuerId !== undefined;
  }

  /**
   * Procesa callbacks de Google Wallet
   */
  async processCallback(data) {
    console.log('Google Wallet callback recibido:', data);
    
    // Aquí puedes procesar eventos como:
    // - Tarjeta agregada al wallet
    // - Tarjeta eliminada
    // - Solicitud de actualización
    
    return { success: true };
  }

  /**
   * Genera un enlace de instalación de la app
   */
  generateAppInstallLink() {
    return 'https://play.google.com/store/apps/details?id=com.google.android.apps.walletnfcrel';
  }

  /**
   * Regenera el saveUrl para un objeto existente
   */
  async regenerateSaveUrl(objectId) {
    await this.initialize();
    if (!this.auth) throw new Error('Google Wallet no configurado');

    try {
      // Verificar que el objeto existe
      const client = await this.auth.getClient();
      const verifyUrl = `${this.baseUrl}/loyaltyObject/${objectId}`;
      
      const response = await client.request({
        url: verifyUrl,
        method: 'GET',
      });
      
      if (response.data && response.data.id === objectId) {
        // El objeto existe, generar nuevo saveUrl
        return this.generateSaveUrl(objectId);
      } else {
        throw new Error('Objeto no encontrado en Google Wallet');
      }
    } catch (error) {
      console.error('Error regenerando saveUrl:', error);
      throw error;
    }
  }
}

export default new GoogleWalletService();