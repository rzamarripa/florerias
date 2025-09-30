import { Client } from "../models/Client.js";
import { Purchase } from "../models/Purchase.js";

export const getAllClients = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filters = {};

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
    const { name, lastName, phoneNumber, points, status } = req.body;

    // Validaciones básicas
    if (!name || !lastName || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Name, lastName, and phoneNumber are required",
      });
    }

    // Verificar si ya existe un cliente con el mismo número de teléfono
    const existingClient = await Client.findOne({ phoneNumber });
    if (existingClient) {
      return res.status(400).json({
        success: false,
        message: "A client with this phone number already exists",
      });
    }

    const clientData = {
      name,
      lastName,
      phoneNumber,
      points: points || 0,
      status: status !== undefined ? status : true,
    };

    const client = await Client.create(clientData);

    res.status(201).json({
      success: true,
      message: "Client created successfully",
      data: {
        client: {
          _id: client._id,
          name: client.name,
          lastName: client.lastName,
          fullName: client.getFullName(),
          clientNumber: client.clientNumber,
          phoneNumber: client.phoneNumber,
          points: client.points,
          status: client.status,
          purchases: client.purchases,
          createdAt: client.createdAt,
          updatedAt: client.updatedAt,
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

export const getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).populate("purchases");

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
    const { name, lastName, phoneNumber, points, status } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (lastName) updateData.lastName = lastName;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
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