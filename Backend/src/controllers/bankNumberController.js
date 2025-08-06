import { BankNumber } from "../models/BankNumber.js";
import { Bank } from "../models/Bank.js";

export const bankNumberController = {
  getAll: async (req, res) => {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const skip = (page - 1) * limit;

      let query = {};
      if (search) {
        query.$or = [
          { bankCredited: { $regex: search, $options: "i" } },
          { bankNumber: { $regex: search, $options: "i" } },
        ];
      }

      const bankNumbers = await BankNumber.find(query)
        .populate("bankDebited", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await BankNumber.countDocuments(query);

      res.json({
        success: true,
        data: bankNumbers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener números de banco",
        error: error.message,
      });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const bankNumber = await BankNumber.findById(id).populate("bankDebited", "name");

      if (!bankNumber) {
        return res.status(404).json({
          success: false,
          message: "Número de banco no encontrado",
        });
      }

      res.json({
        success: true,
        data: bankNumber,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener número de banco",
        error: error.message,
      });
    }
  },

  create: async (req, res) => {
    try {
      const { bankDebited, bankCredited, bankNumber } = req.body;

      const existingBank = await Bank.findById(bankDebited);
      if (!existingBank) {
        return res.status(400).json({
          success: false,
          message: "El banco de cargo no existe",
        });
      }

      const existingBankNumber = await BankNumber.findOne({
        bankDebited,
        bankCredited,
        bankNumber,
      });

      if (existingBankNumber) {
        return res.status(400).json({
          success: false,
          message: "Ya existe un número de banco con estos datos",
        });
      }

      const newBankNumber = new BankNumber({
        bankDebited,
        bankCredited,
        bankNumber,
      });

      await newBankNumber.save();

      const populatedBankNumber = await BankNumber.findById(newBankNumber._id).populate(
        "bankDebited",
        "name"
      );

      res.status(201).json({
        success: true,
        message: "Número de banco creado exitosamente",
        data: populatedBankNumber,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al crear número de banco",
        error: error.message,
      });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { bankDebited, bankCredited, bankNumber } = req.body;

      const existingBank = await Bank.findById(bankDebited);
      if (!existingBank) {
        return res.status(400).json({
          success: false,
          message: "El banco de cargo no existe",
        });
      }

      const existingBankNumber = await BankNumber.findOne({
        _id: { $ne: id },
        bankDebited,
        bankCredited,
        bankNumber,
      });

      if (existingBankNumber) {
        return res.status(400).json({
          success: false,
          message: "Ya existe un número de banco con estos datos",
        });
      }

      const updatedBankNumber = await BankNumber.findByIdAndUpdate(
        id,
        { bankDebited, bankCredited, bankNumber },
        { new: true }
      ).populate("bankDebited", "name");

      if (!updatedBankNumber) {
        return res.status(404).json({
          success: false,
          message: "Número de banco no encontrado",
        });
      }

      res.json({
        success: true,
        message: "Número de banco actualizado exitosamente",
        data: updatedBankNumber,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al actualizar número de banco",
        error: error.message,
      });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedBankNumber = await BankNumber.findByIdAndDelete(id);

      if (!deletedBankNumber) {
        return res.status(404).json({
          success: false,
          message: "Número de banco no encontrado",
        });
      }

      res.json({
        success: true,
        message: "Número de banco eliminado exitosamente",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al eliminar número de banco",
        error: error.message,
      });
    }
  },

  getBanksForSelect: async (req, res) => {
    try {
      const banks = await Bank.find({ isActive: true })
        .select("name")
        .sort({ name: 1 });

      res.json({
        success: true,
        data: banks,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener bancos",
        error: error.message,
      });
    }
  },
}; 