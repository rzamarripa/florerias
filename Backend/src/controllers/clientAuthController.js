import jwt from "jsonwebtoken";
import { Client } from "../models/Client.js";

const generateClientToken = (clientId) => {
  return jwt.sign(
    {
      id: clientId,
      clientId,
      role: "client",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE,
    }
  );
};

export const loginClient = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email y contraseña son requeridos",
      });
    }

    const client = await Client.findOne({ email }).select("+password");

    if (!client) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas",
      });
    }

    if (!client.password) {
      return res.status(401).json({
        success: false,
        message: "Esta cuenta no tiene contraseña configurada. Contacta al administrador.",
      });
    }

    const isMatch = await client.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas",
      });
    }

    if (!client.status) {
      return res.status(401).json({
        success: false,
        message: "Tu cuenta está desactivada. Contacta al administrador.",
      });
    }

    const token = generateClientToken(client._id);

    res.status(200).json({
      success: true,
      message: "Login exitoso",
      data: {
        client: {
          _id: client._id,
          name: client.name,
          lastName: client.lastName,
          email: client.email,
          phoneNumber: client.phoneNumber,
          clientNumber: client.clientNumber,
          points: client.points,
          company: client.company,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Error en login de cliente:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};
