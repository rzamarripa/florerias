import { Client } from "../models/Client.js";
import { Purchase } from "../models/Purchase.js";
import { Branch } from "../models/Branch.js";
import { PointsReward } from "../models/PointsReward.js";
import clientPointsService from "../services/clientPointsService.js";

// Function to generate unique redemption code
const generateRedemptionCode = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

export const getAllClients = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filters = {};

    // Filtro por sucursal basado en branchId del query
    if (req.query.branchId) {
      filters.branch = req.query.branchId;
    }

    // Filtros opcionales
    if (req.query.name) {
      filters.name = { $regex: req.query.name, $options: "i" };
    }

    if (req.query.lastName) {
      filters.lastName = { $regex: req.query.lastName, $options: "i" };
    }

    if (req.query.clientNumber) {
      filters.clientNumber = { $regex: req.query.clientNumber, $options: "i" };
    }

    if (req.query.phoneNumber) {
      filters.phoneNumber = { $regex: req.query.phoneNumber, $options: "i" };
    }

    if (req.query.status !== undefined) {
      filters.status = req.query.status === "true";
    }

    const clients = await Client.find(filters)
      .populate("purchases")
      .populate("branch")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Client.countDocuments(filters);

    const transformedClients = clients.map((client) => {
      const clientObj = client.toObject();
      clientObj.fullName = client.getFullName();
      return clientObj;
    });

    res.status(200).json({
      success: true,
      count: transformedClients.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      data: transformedClients,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createClient = async (req, res) => {
  try {
    const { name, lastName, phoneNumber, email, points, status, branch } = req.body;

    // Validaciones básicas
    if (!name || !lastName || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Name, lastName, and phoneNumber are required",
      });
    }

    if (!branch) {
      return res.status(400).json({
        success: false,
        message: "Branch is required",
      });
    }

    // Verificar si ya existe un cliente con el mismo número de teléfono en la misma sucursal
    const existingClient = await Client.findOne({ phoneNumber, branch });
    if (existingClient) {
      return res.status(400).json({
        success: false,
        message: "A client with this phone number already exists in this branch",
      });
    }

    const clientData = {
      name,
      lastName,
      phoneNumber,
      email: email || "",
      points: points || 0,
      status: status !== undefined ? status : true,
      branch,
    };

    const client = await Client.create(clientData);

    // Procesar puntos por registro de cliente si está habilitado
    let registrationPointsInfo = null;
    try {
      const pointsResult = await clientPointsService.processRegistrationPoints({
        clientId: client._id,
        branchId: branch,
        registeredBy: req.user?._id || null,
      });

      if (pointsResult.success && pointsResult.points > 0) {
        registrationPointsInfo = {
          pointsEarned: pointsResult.points,
          newBalance: pointsResult.newBalance,
        };
        console.log(`✅ Puntos por registro otorgados al cliente ${client._id}: ${pointsResult.points} pts`);
      }
    } catch (pointsError) {
      console.error("Error al procesar puntos por registro:", pointsError);
      // No fallar la creación del cliente si hay error al procesar puntos
    }

    // Obtener cliente actualizado con puntos
    const updatedClient = await Client.findById(client._id);

    res.status(201).json({
      success: true,
      message: "Client created successfully",
      data: {
        client: {
          _id: updatedClient._id,
          name: updatedClient.name,
          lastName: updatedClient.lastName,
          fullName: updatedClient.getFullName(),
          clientNumber: updatedClient.clientNumber,
          phoneNumber: updatedClient.phoneNumber,
          email: updatedClient.email,
          points: updatedClient.points,
          status: updatedClient.status,
          purchases: updatedClient.purchases,
          createdAt: updatedClient.createdAt,
          updatedAt: updatedClient.updatedAt,
        },
        registrationPoints: registrationPointsInfo,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id)
      .populate("purchases")
      .populate("branch");

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    const clientData = {
      ...client.toObject(),
      fullName: client.getFullName(),
    };

    res.status(200).json({
      success: true,
      data: clientData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateClient = async (req, res) => {
  try {
    const { name, lastName, phoneNumber, email, points, status } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (lastName) updateData.lastName = lastName;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (email !== undefined) updateData.email = email;
    if (points !== undefined) updateData.points = points;
    if (status !== undefined) updateData.status = status;

    // Verificar si el número de teléfono ya existe en otro cliente
    if (phoneNumber) {
      const existingClient = await Client.findOne({
        phoneNumber,
        _id: { $ne: req.params.id },
      });

      if (existingClient) {
        return res.status(400).json({
          success: false,
          message: "Phone number already exists",
        });
      }
    }

    const client = await Client.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).populate("purchases");

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Client updated successfully",
      data: {
        client: {
          ...client.toObject(),
          fullName: client.getFullName(),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { status: false },
      { new: true }
    );

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Client deactivated successfully",
      data: client,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const activateClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { status: true },
      { new: true }
    );

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Client activated successfully",
      data: client,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const addPointsToClient = async (req, res) => {
  try {
    const { points } = req.body;

    if (!points || points <= 0) {
      return res.status(400).json({
        success: false,
        message: "Points must be a positive number",
      });
    }

    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    await client.addPoints(points);

    res.status(200).json({
      success: true,
      message: "Points added successfully",
      data: {
        client: {
          ...client.toObject(),
          fullName: client.getFullName(),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const usePointsFromClient = async (req, res) => {
  try {
    const { points } = req.body;

    if (!points || points <= 0) {
      return res.status(400).json({
        success: false,
        message: "Points must be a positive number",
      });
    }

    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    try {
      await client.usePoints(points);

      res.status(200).json({
        success: true,
        message: "Points used successfully",
        data: {
          client: {
            ...client.toObject(),
            fullName: client.getFullName(),
          },
        },
      });
    } catch (pointsError) {
      return res.status(400).json({
        success: false,
        message: pointsError.message,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getClientPointsHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, type, branchId } = req.query;

    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    const result = await clientPointsService.getClientPointsHistory(id, {
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      branchId,
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message || "Error al obtener historial de puntos",
      });
    }

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      clientPoints: client.points,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const addCommentToClient = async (req, res) => {
  try {
    const { comentario, tipo, usuario } = req.body;

    // Validaciones básicas
    if (!comentario || !tipo || !usuario) {
      return res.status(400).json({
        success: false,
        message: "Comentario, tipo, and usuario are required",
      });
    }

    // Validar que el tipo sea válido
    if (!['positive', 'negative'].includes(tipo.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Tipo must be either 'positive' or 'negative'",
      });
    }

    // Validar longitud del comentario
    if (comentario.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Comentario cannot exceed 500 characters",
      });
    }

    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    // Crear el nuevo comentario
    const newComment = {
      comentario: comentario.trim(),
      tipo: tipo.toLowerCase(),
      usuario: usuario.trim(),
      fechaCreacion: new Date(),
    };

    // Agregar el comentario al array
    client.comentarios.push(newComment);
    await client.save();

    // Obtener el cliente actualizado con el nuevo comentario
    const updatedClient = await Client.findById(req.params.id).populate("purchases");

    res.status(200).json({
      success: true,
      message: "Comment added successfully",
      data: {
        client: {
          ...updatedClient.toObject(),
          fullName: updatedClient.getFullName(),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const verifyRewardCode = async (req, res) => {
  try {
    const { id } = req.params;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "El código es requerido",
      });
    }

    // Obtener cliente con rewards populados
    const client = await Client.findById(id).populate("rewards.reward");
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Cliente no encontrado",
      });
    }

    // Buscar el reward con el código proporcionado que no haya sido canjeado
    const rewardEntry = client.rewards?.find(
      (r) => r.code === code.toUpperCase() && !r.isRedeemed
    );

    if (!rewardEntry) {
      return res.status(404).json({
        success: false,
        message: "Código inválido o ya ha sido canjeado",
      });
    }

    const reward = rewardEntry.reward;

    res.status(200).json({
      success: true,
      message: "Código válido",
      data: {
        rewardEntryId: rewardEntry._id,
        code: rewardEntry.code,
        reward: {
          _id: reward._id,
          name: reward.name,
          rewardValue: reward.rewardValue,
          isPercentage: reward.isPercentage,
          pointsRequired: reward.pointsRequired,
        },
      },
    });
  } catch (error) {
    console.error("Error al verificar código de recompensa:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAvailableRewards = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener cliente con rewards populados (incluyendo producto asociado)
    const client = await Client.findById(id).populate({
      path: "rewards.reward",
      select: "name description rewardValue isPercentage pointsRequired validFrom validUntil rewardType isProducto productId productQuantity",
      populate: {
        path: "productId",
        select: "nombre precio imagen productCategory",
      },
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Cliente no encontrado",
      });
    }

    // Filtrar solo las recompensas que no han sido usadas (isRedeemed = false)
    const availableRewards = (client.rewards || [])
      .filter((r) => !r.isRedeemed && r.reward)
      .map((r) => ({
        _id: r._id,
        code: r.code,
        redeemedAt: r.redeemedAt,
        reward: {
          _id: r.reward._id,
          name: r.reward.name,
          description: r.reward.description,
          rewardValue: r.reward.rewardValue,
          isPercentage: r.reward.isPercentage,
          pointsRequired: r.reward.pointsRequired,
          validFrom: r.reward.validFrom,
          validUntil: r.reward.validUntil,
          rewardType: r.reward.rewardType,
          isProducto: r.reward.isProducto || false,
          productId: r.reward.productId || null,
          productQuantity: r.reward.productQuantity || 1,
        },
      }));

    res.status(200).json({
      success: true,
      count: availableRewards.length,
      data: availableRewards,
    });
  } catch (error) {
    console.error("Error al obtener recompensas disponibles:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getClientRewards = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener cliente con rewards populados
    const client = await Client.findById(id)
      .populate({
        path: "rewards.reward",
        select: "name description rewardValue isPercentage pointsRequired",
      })
      .populate({
        path: "rewards.usedInOrder",
        select: "orderNumber",
      });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Cliente no encontrado",
      });
    }

    // Filtrar y formatear las recompensas
    const rewards = client.rewards || [];

    res.status(200).json({
      success: true,
      message: "Recompensas obtenidas exitosamente",
      data: rewards,
    });
  } catch (error) {
    console.error("Error al obtener recompensas del cliente:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const redeemReward = async (req, res) => {
  try {
    const { id } = req.params;
    const { rewardId, branchId } = req.body;

    // Validaciones básicas
    if (!rewardId) {
      return res.status(400).json({
        success: false,
        message: "El ID de la recompensa es requerido",
      });
    }

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "El ID de la sucursal es requerido",
      });
    }

    // Obtener cliente
    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Cliente no encontrado",
      });
    }

    // Obtener recompensa
    const reward = await PointsReward.findById(rewardId);
    if (!reward) {
      return res.status(404).json({
        success: false,
        message: "Recompensa no encontrada",
      });
    }

    // Verificar si la recompensa puede ser canjeada
    if (!reward.canBeRedeemed()) {
      return res.status(400).json({
        success: false,
        message: "Esta recompensa no está disponible para canjear",
      });
    }

    // Verificar si el cliente tiene suficientes puntos
    if (client.points < reward.pointsRequired) {
      return res.status(400).json({
        success: false,
        message: `Puntos insuficientes. Necesitas ${reward.pointsRequired} puntos, tienes ${client.points}`,
      });
    }

    // Verificar límite de canjes por cliente (cuenta todos los reclamados, no importa si ya fueron usados)
    if (reward.maxRedemptionsPerClient > 0) {
      const clientRedemptions = client.rewards?.filter(
        (r) => r.reward.toString() === rewardId
      ).length || 0;

      if (clientRedemptions >= reward.maxRedemptionsPerClient) {
        return res.status(400).json({
          success: false,
          message: `Has alcanzado el límite de canjes para esta recompensa (${reward.maxRedemptionsPerClient})`,
        });
      }
    }

    // Generar código único
    const code = generateRedemptionCode();

    // Agregar la recompensa canjeada al cliente
    if (!client.rewards) {
      client.rewards = [];
    }

    client.rewards.push({
      reward: rewardId,
      code,
      isRedeemed: false,
      redeemedAt: new Date(),
    });

    await client.save();

    // Incrementar contador de canjes en la recompensa
    reward.totalRedemptions += 1;
    await reward.save();

    // Registrar en el historial de puntos y descontar puntos del cliente
    const pointsResult = await clientPointsService.addPointsToClient({
      clientId: id,
      points: reward.pointsRequired,
      type: "redeemed",
      reason: "redemption",
      branchId,
      description: `Canje de recompensa: ${reward.name}`,
      registeredBy: req.user?._id || null,
    });

    res.status(200).json({
      success: true,
      message: "Recompensa canjeada exitosamente",
      data: {
        code,
        reward: {
          _id: reward._id,
          name: reward.name,
          rewardValue: reward.rewardValue,
          isPercentage: reward.isPercentage,
          pointsRequired: reward.pointsRequired,
        },
        newBalance: pointsResult.newBalance,
      },
    });
  } catch (error) {
    console.error("Error al canjear recompensa:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};