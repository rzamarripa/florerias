import { DigitalCard } from "../models/DigitalCard.js";
import { Client } from "../models/Client.js";
import { CardTransaction } from "../models/CardTransaction.js";
import qrCodeService from "../services/digitalCards/qrCodeService.js";
import appleWalletService from "../services/digitalCards/appleWalletService.js";
import googleWalletService from "../services/digitalCards/googleWalletService.js";
import { sendGoogleWalletCard, sendAppleWalletCard } from "../services/emailService.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Genera o obtiene la tarjeta digital de un cliente
 */
export const generateDigitalCard = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { cardType = "generic" } = req.body;

    // Buscar el cliente con su información de empresa
    const client = await Client.findById(clientId).populate("company");
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Cliente no encontrado",
      });
    }

    // Variable para almacenar el QR temporal
    let tempQrCode = null;

    // Verificar si ya existe una tarjeta digital para este cliente
    let digitalCard = await DigitalCard.findOne({ clientId });

    if (digitalCard) {
      // Si la tarjeta existe pero necesita rotación
      if (digitalCard.needsRotation()) {
        const { qrCode, qrData } = await qrCodeService.rotateQRCode({
          clientId: client._id,
          clientNumber: client.clientNumber,
          passSerialNumber: digitalCard.passSerialNumber,
          companyId: client.company._id,
        });

        await digitalCard.rotate(qrCode, qrData);
        tempQrCode = qrCode; // Guardar QR temporal para enviarlo al frontend

        // Registrar la rotación en las transacciones
        await CardTransaction.create({
          digitalCardId: digitalCard._id,
          clientId: client._id,
          transactionType: "card_rotated",
          locationData: {
            companyId: client.company._id,
          },
        });
      }
    } else {
      // Primero generar el QR con un passSerialNumber temporal
      const tempPassSerialNumber = uuidv4();
      
      // Generar el QR con el passSerialNumber temporal
      const { qrCode, qrData } = await qrCodeService.generateQRCode({
        clientId: client._id,
        clientNumber: client.clientNumber,
        passSerialNumber: tempPassSerialNumber,
        companyId: client.company._id,
      });

      tempQrCode = qrCode; // Guardar QR temporal para enviarlo al frontend

      // Generar código de barras
      const barcode = await qrCodeService.generateBarcode(client.clientNumber);

      // Ahora crear la tarjeta con todos los datos necesarios
      digitalCard = new DigitalCard({
        clientId: client._id,
        cardType,
        lastPointsBalance: client.points,
        companyId: client.company._id,
        passSerialNumber: tempPassSerialNumber, // Usar el mismo passSerialNumber
        qrData: qrData, // Asignar qrData desde el inicio
        barcode: barcode,
        metadata: {
          logoText: client.company?.tradeName || client.company?.legalName || "Corazón Violeta",
        },
      });

      // Guardar la tarjeta con todos los datos
      await digitalCard.save();

      // Registrar la generación en las transacciones
      await CardTransaction.create({
        digitalCardId: digitalCard._id,
        clientId: client._id,
        transactionType: "card_generated",
        balanceAfter: client.points,
        locationData: {
          companyId: client.company._id,
        },
      });
    }

    // Convertir a objeto plano si es necesario
    const digitalCardObj = digitalCard.toObject ? digitalCard.toObject() : digitalCard;
    
    // Preparar respuesta con datos del cliente
    const cardData = {
      ...digitalCardObj,
      tempQrCode: tempQrCode, // Agregar el QR temporal para que el frontend lo suba
      client: {
        name: client.name,
        lastName: client.lastName,
        fullName: client.getFullName(),
        clientNumber: client.clientNumber,
        points: client.points,
        phoneNumber: client.phoneNumber,
        email: client.email,
      },
      company: {
        name: client.company?.tradeName || client.company?.legalName || "Empresa",
        id: client.company?._id,
      },
    };

    res.status(200).json({
      success: true,
      data: cardData,
    });
  } catch (error) {
    console.error("Error generando tarjeta digital:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Obtiene la tarjeta digital de un cliente
 */
export const getDigitalCard = async (req, res) => {
  try {
    const { clientId } = req.params;

    const digitalCard = await DigitalCard.findOne({ clientId })
      .populate("clientId")
      .populate("companyId");

    if (!digitalCard) {
      return res.status(404).json({
        success: false,
        message: "Tarjeta digital no encontrada",
      });
    }

    // Actualizar el balance de puntos si es necesario
    const client = await Client.findById(clientId);
    if (client && client.points !== digitalCard.lastPointsBalance) {
      await digitalCard.updateBalance(client.points);
    }

    res.status(200).json({
      success: true,
      data: digitalCard,
    });
  } catch (error) {
    console.error("Error obteniendo tarjeta digital:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Descarga la tarjeta digital en formato Apple Wallet
 */
export const downloadAppleWallet = async (req, res) => {
  try {
    const { cardId } = req.params;

    const digitalCard = await DigitalCard.findById(cardId)
      .populate("clientId")
      .populate("companyId");

    if (!digitalCard) {
      return res.status(404).json({
        success: false,
        message: "Tarjeta digital no encontrada",
      });
    }

    // Preparar datos del cliente para el pass
    const clientData = {
      clientId: digitalCard.clientId._id,
      name: digitalCard.clientId.name,
      lastName: digitalCard.clientId.lastName,
      clientNumber: digitalCard.clientId.clientNumber,
      phoneNumber: digitalCard.clientId.phoneNumber,
      email: digitalCard.clientId.email,
      points: digitalCard.clientId.points,
      passSerialNumber: digitalCard.passSerialNumber,
      branchName: digitalCard.companyId?.tradeName || digitalCard.companyId?.legalName || "Corazón Violeta",
      logoUrl: digitalCard.companyId?.logoUrl || null, // Logo dinámico de la empresa
      heroUrl: digitalCard.heroUrl || null, // Imagen hero/banner desde Firebase
    };

    try {
      // Generar el Apple Wallet Pass
      const passBuffer = await appleWalletService.generatePass(
        clientData,
        digitalCard.qrData
      );

      // Registrar la descarga
      await digitalCard.recordDownload();

      // Registrar en transacciones
      await CardTransaction.create({
        digitalCardId: digitalCard._id,
        clientId: digitalCard.clientId._id,
        transactionType: "card_downloaded",
        locationData: {
          companyId: digitalCard.companyId._id,
        },
        deviceInfo: {
          deviceType: "ios",
          userAgent: req.headers["user-agent"],
        },
      });

      // Enviar por correo si el cliente tiene email
      if (clientData.email) {
        try {
          const companyName = digitalCard.companyId?.tradeName || digitalCard.companyId?.legalName || "Corazón Violeta";
          const emailResult = await sendAppleWalletCard(
            clientData,
            passBuffer,
            companyName
          );
          
          if (emailResult.success) {
            console.log("Apple Wallet Pass enviado por correo exitosamente");
          } else {
            console.error("Error enviando correo de Apple Wallet:", emailResult.error);
          }
        } catch (emailError) {
          console.error("Error enviando correo de Apple Wallet:", emailError);
        }
      }

      // Enviar el archivo .pkpass como respuesta
      res.set({
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="${digitalCard.clientId.clientNumber}.pkpass"`,
      });

      res.send(passBuffer);
    } catch (serviceError) {
      console.error("Error con Apple Wallet Service:", serviceError);
      
      // Si hay error, retornar mensaje de error
      return res.status(500).json({
        success: false,
        message: "Error generando Apple Wallet Pass. Verifique que los certificados estén configurados correctamente.",
        error: serviceError.message,
      });
    }
  } catch (error) {
    console.error("Error descargando Apple Wallet:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Actualiza los puntos en la tarjeta digital
 */
export const updateCardPoints = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { points, reason } = req.body;

    const digitalCard = await DigitalCard.findById(cardId);

    if (!digitalCard) {
      return res.status(404).json({
        success: false,
        message: "Tarjeta digital no encontrada",
      });
    }

    const previousBalance = digitalCard.lastPointsBalance;
    await digitalCard.updateBalance(points);

    // Registrar la actualización en transacciones
    await CardTransaction.create({
      digitalCardId: digitalCard._id,
      clientId: digitalCard.clientId,
      transactionType: points > previousBalance ? "points_earned" : "points_redeemed",
      pointsInvolved: Math.abs(points - previousBalance),
      balanceBefore: previousBalance,
      balanceAfter: points,
      locationData: {
        companyId: digitalCard.companyId,
      },
      notes: reason,
    });

    // Si tiene configurado Apple Wallet, enviar actualización push
    if (digitalCard.passTypeId) {
      await appleWalletService.updatePass(digitalCard.passSerialNumber, {
        points: points,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        previousBalance,
        newBalance: points,
        updated: true,
      },
    });
  } catch (error) {
    console.error("Error actualizando puntos:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Obtiene las transacciones de una tarjeta digital
 */
export const getCardTransactions = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { limit = 50, skip = 0, type, startDate, endDate } = req.query;

    const digitalCard = await DigitalCard.findById(cardId);

    if (!digitalCard) {
      return res.status(404).json({
        success: false,
        message: "Tarjeta digital no encontrada",
      });
    }

    const transactions = await CardTransaction.getHistory(
      digitalCard.clientId,
      {
        limit: parseInt(limit),
        skip: parseInt(skip),
        type,
        companyId: digitalCard.companyId,
        startDate,
        endDate,
      }
    );

    const total = await CardTransaction.countDocuments({
      clientId: digitalCard.clientId,
    });

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
      },
    });
  } catch (error) {
    console.error("Error obteniendo transacciones:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Obtiene estadísticas de uso de la tarjeta
 */
export const getCardStatistics = async (req, res) => {
  try {
    const { cardId } = req.params;

    const digitalCard = await DigitalCard.findById(cardId);

    if (!digitalCard) {
      return res.status(404).json({
        success: false,
        message: "Tarjeta digital no encontrada",
      });
    }

    const statistics = await CardTransaction.getStatistics(
      digitalCard.clientId,
      digitalCard.branchId
    );

    res.status(200).json({
      success: true,
      data: {
        ...statistics,
        cardInfo: {
          downloads: digitalCard.downloads,
          lastDownloadedAt: digitalCard.lastDownloadedAt,
          lastUpdated: digitalCard.lastUpdated,
          isActive: digitalCard.isActive,
          devicesCount: digitalCard.devices.length,
        },
      },
    });
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Desactiva una tarjeta digital
 */
export const deactivateCard = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { reason } = req.body;

    const digitalCard = await DigitalCard.findById(cardId);

    if (!digitalCard) {
      return res.status(404).json({
        success: false,
        message: "Tarjeta digital no encontrada",
      });
    }

    digitalCard.isActive = false;
    await digitalCard.save();

    // Registrar la desactivación
    await CardTransaction.create({
      digitalCardId: digitalCard._id,
      clientId: digitalCard.clientId,
      transactionType: "card_updated",
      locationData: {
        companyId: digitalCard.companyId,
      },
      notes: `Tarjeta desactivada: ${reason || "Sin razón especificada"}`,
    });

    res.status(200).json({
      success: true,
      message: "Tarjeta desactivada correctamente",
    });
  } catch (error) {
    console.error("Error desactivando tarjeta:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Genera un QR temporal para una transacción
 */
export const generateTemporaryQR = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { type, data } = req.body;

    const client = await Client.findById(clientId);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Cliente no encontrado",
      });
    }

    const temporaryQR = await qrCodeService.generateTemporaryQR({
      clientId: client._id,
      clientNumber: client.clientNumber,
      type,
      ...data,
    });

    res.status(200).json({
      success: true,
      data: temporaryQR,
    });
  } catch (error) {
    console.error("Error generando QR temporal:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Actualiza las URLs del QR después de subirlo a Firebase
 */
export const updateQRUrls = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { qrCodeUrl, qrCodePath } = req.body;

    if (!qrCodeUrl || !qrCodePath) {
      return res.status(400).json({
        success: false,
        message: "Se requieren qrCodeUrl y qrCodePath",
      });
    }

    const digitalCard = await DigitalCard.findById(cardId);

    if (!digitalCard) {
      return res.status(404).json({
        success: false,
        message: "Tarjeta digital no encontrada",
      });
    }

    // Actualizar URLs del QR
    digitalCard.qrCodeUrl = qrCodeUrl;
    digitalCard.qrCodePath = qrCodePath;
    // Limpiar el campo qrCode base64 si existe
    digitalCard.qrCode = undefined;
    
    await digitalCard.save();

    res.status(200).json({
      success: true,
      data: digitalCard,
      message: "URLs del QR actualizadas correctamente",
    });
  } catch (error) {
    console.error("Error actualizando URLs del QR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Actualiza las URLs de la imagen hero después de subir a Firebase
 */
export const updateHeroUrls = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { heroUrl, heroPath } = req.body;

    if (!heroUrl || !heroPath) {
      return res.status(400).json({
        success: false,
        message: "Se requieren heroUrl y heroPath",
      });
    }

    const digitalCard = await DigitalCard.findById(cardId);

    if (!digitalCard) {
      return res.status(404).json({
        success: false,
        message: "Tarjeta digital no encontrada",
      });
    }

    // Actualizar URLs de la imagen hero
    digitalCard.heroUrl = heroUrl;
    digitalCard.heroPath = heroPath;
    
    await digitalCard.save();

    res.status(200).json({
      success: true,
      data: digitalCard,
      message: "URLs de la imagen hero actualizadas correctamente",
    });
  } catch (error) {
    console.error("Error actualizando URLs de la imagen hero:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Obtiene todas las tarjetas digitales de una sucursal
 */
export const getCardsByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { page = 1, limit = 10, isActive } = req.query;
    
    const skip = (page - 1) * limit;
    const query = { branchId };
    
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const cards = await DigitalCard.find(query)
      .populate("clientId", "name lastName clientNumber phoneNumber points")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await DigitalCard.countDocuments(query);

    res.status(200).json({
      success: true,
      data: cards,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error obteniendo tarjetas por sucursal:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Obtiene o regenera el saveUrl para Google Wallet
 */
export const getGoogleWalletSaveUrl = async (req, res) => {
  try {
    const { cardId } = req.params;

    const digitalCard = await DigitalCard.findById(cardId)
      .populate("clientId")
      .populate("companyId");

    if (!digitalCard) {
      return res.status(404).json({
        success: false,
        message: "Tarjeta digital no encontrada",
      });
    }

    // Si ya tiene un googleWalletId, regenerar el saveUrl
    if (digitalCard.googleWalletId) {
      try {
        const newSaveUrl = await googleWalletService.regenerateSaveUrl(digitalCard.googleWalletId);
        
        // Actualizar el saveUrl en la base de datos
        digitalCard.passUrl = {
          ...digitalCard.passUrl,
          google: newSaveUrl,
        };
        await digitalCard.save();

        return res.status(200).json({
          success: true,
          saveUrl: newSaveUrl,
          objectId: digitalCard.googleWalletId,
          message: "SaveUrl regenerado exitosamente",
        });
      } catch (error) {
        console.error("Error regenerando saveUrl:", error);
      }
    }

    // Si no tiene googleWalletId o falló la regeneración, generar nueva tarjeta
    return downloadGoogleWallet(req, res);
  } catch (error) {
    console.error("Error obteniendo saveUrl de Google Wallet:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Descarga la tarjeta digital en formato Google Wallet
 */
export const downloadGoogleWallet = async (req, res) => {
  try {
    const { cardId } = req.params;

    const digitalCard = await DigitalCard.findById(cardId)
      .populate("clientId")
      .populate("companyId");

    if (!digitalCard) {
      return res.status(404).json({
        success: false,
        message: "Tarjeta digital no encontrada",
      });
    }

    // Preparar datos del cliente para el pass
    const clientData = {
      clientId: digitalCard.clientId._id,
      name: digitalCard.clientId.name,
      lastName: digitalCard.clientId.lastName,
      clientNumber: digitalCard.clientId.clientNumber,
      phoneNumber: digitalCard.clientId.phoneNumber,
      email: digitalCard.clientId.email,
      points: digitalCard.clientId.points,
      passSerialNumber: digitalCard.passSerialNumber,
      branchName: digitalCard.companyId?.tradeName || digitalCard.companyId?.legalName || "Corazón Violeta",
      qrData: digitalCard.qrData,
      logoUrl: digitalCard.clientId.logoUrl || null, // Logo dinámico si existe
      heroUrl: digitalCard.heroUrl || null, // Imagen hero si existe
    };

    try {
      // Verificar si el servicio está configurado
      const isConfigured = await googleWalletService.isConfigured();
      
      if (!isConfigured) {
        // Modo de desarrollo - generar pass demo
        const demoPass = googleWalletService.generateGenericPass(clientData);
        
        return res.status(200).json({
          success: true,
          isDevelopment: true,
          data: demoPass,
        });
      }

      // Inicializar y crear/actualizar la clase de tarjeta con imagen hero si existe
      const companyName = digitalCard.companyId?.tradeName || digitalCard.companyId?.legalName || "Corazón Violeta";
      const logoUrl = digitalCard.companyId?.logoUrl || null;
      await googleWalletService.createOrUpdateLoyaltyClass(digitalCard.heroUrl, companyName, logoUrl);

      // Generar el objeto de fidelidad
      const result = await googleWalletService.generateLoyaltyObject(clientData);

      // Validar que el saveUrl se generó correctamente
      if (!result.saveUrl || !result.saveUrl.startsWith('https://pay.google.com/gp/v/save/')) {
        console.error('SaveUrl inválido:', result.saveUrl);
        throw new Error('No se pudo generar el enlace para Google Wallet');
      }

      // Actualizar el ID de Google Wallet en la tarjeta digital
      if (result.objectId) {
        digitalCard.googleWalletId = result.objectId;
        digitalCard.passUrl = {
          ...digitalCard.passUrl,
          google: result.saveUrl,
        };
        await digitalCard.save();
      }

      // Registrar la descarga
      await digitalCard.recordDownload();

      // Registrar en transacciones
      await CardTransaction.create({
        digitalCardId: digitalCard._id,
        clientId: digitalCard.clientId._id,
        transactionType: "card_downloaded",
        locationData: {
          companyId: digitalCard.companyId._id,
        },
        deviceInfo: {
          deviceType: "mobile",
          userAgent: req.headers["user-agent"],
        },
      });

      // Enviar correo con el enlace de Google Wallet
      if (clientData.email && result.saveUrl) {
        try {
          const emailResult = await sendGoogleWalletCard(
            clientData,
            result.saveUrl,
            companyName
          );
          
          if (emailResult.success) {
            console.log("Correo de Google Wallet enviado exitosamente con saveUrl:", result.saveUrl);
          } else {
            console.error("Error enviando correo:", emailResult.error);
          }
        } catch (emailError) {
          console.error("Error enviando correo de Google Wallet:", emailError);
        }
      }

      // Retornar la URL para guardar en Google Wallet
      res.status(200).json({
        success: true,
        saveUrl: result.saveUrl,
        objectId: result.objectId,
        message: "Tarjeta lista para agregar a Google Wallet",
        emailSent: clientData.email ? true : false,
      });
    } catch (serviceError) {
      console.error("Error con Google Wallet Service:", serviceError);
      
      // Si hay error con el servicio, generar pass demo
      const demoPass = googleWalletService.generateGenericPass(clientData);
      
      return res.status(200).json({
        success: true,
        isDevelopment: true,
        data: demoPass,
        error: serviceError.message,
      });
    }
  } catch (error) {
    console.error("Error descargando Google Wallet:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};