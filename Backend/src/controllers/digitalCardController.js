import { DigitalCard } from "../models/DigitalCard.js";
import { Client } from "../models/Client.js";
import { CardTransaction } from "../models/CardTransaction.js";
import { Branch } from "../models/Branch.js";
import qrCodeService from "../services/digitalCards/qrCodeService.js";
import appleWalletService from "../services/digitalCards/appleWalletService.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Genera o obtiene la tarjeta digital de un cliente
 */
export const generateDigitalCard = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { cardType = "generic" } = req.body;

    // Buscar el cliente con su información de sucursal
    const client = await Client.findById(clientId).populate("branch");
    
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
          branchId: client.branch._id,
        });

        await digitalCard.rotate(qrCode, qrData);
        tempQrCode = qrCode; // Guardar QR temporal para enviarlo al frontend

        // Registrar la rotación en las transacciones
        await CardTransaction.create({
          digitalCardId: digitalCard._id,
          clientId: client._id,
          transactionType: "card_rotated",
          locationData: {
            branchId: client.branch._id,
          },
        });
      }
    } else {
      // Primero generar el QR con un passSerialNumber temporal
      const tempPassSerialNumber = uuidv4();
      
      // Generar el QR con el passSerialNumber temporal
      const { qrCode, qrData, expiresAt } = await qrCodeService.generateQRCode({
        clientId: client._id,
        clientNumber: client.clientNumber,
        passSerialNumber: tempPassSerialNumber,
        branchId: client.branch._id,
      });

      tempQrCode = qrCode; // Guardar QR temporal para enviarlo al frontend

      // Generar código de barras
      const barcode = await qrCodeService.generateBarcode(client.clientNumber);

      // Ahora crear la tarjeta con todos los datos necesarios
      digitalCard = new DigitalCard({
        clientId: client._id,
        cardType,
        lastPointsBalance: client.points,
        branchId: client.branch._id,
        passSerialNumber: tempPassSerialNumber, // Usar el mismo passSerialNumber
        qrData: qrData, // Asignar qrData desde el inicio
        barcode: barcode,
        metadata: {
          logoText: client.branch.name || "Corazón Violeta",
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
          branchId: client.branch._id,
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
      branch: {
        name: client.branch.name,
        address: client.branch.address,
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
      .populate("branchId");

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
      .populate("branchId");

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
      branchName: digitalCard.branchId.name,
    };

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
        branchId: digitalCard.branchId._id,
      },
      deviceInfo: {
        deviceType: "ios",
        userAgent: req.headers["user-agent"],
      },
    });

    // Enviar el archivo .pkpass
    res.set({
      "Content-Type": "application/vnd.apple.pkpass",
      "Content-Disposition": `attachment; filename="${digitalCard.clientId.clientNumber}.pkpass"`,
    });

    res.send(passBuffer);
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
        branchId: digitalCard.branchId,
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
        branchId: digitalCard.branchId,
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
        branchId: digitalCard.branchId,
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