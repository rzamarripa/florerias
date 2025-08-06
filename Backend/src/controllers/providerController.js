import { Provider } from "../models/Provider.js";
import { Country } from "../models/Country.js";
import { State } from "../models/State.js";
import { Municipality } from "../models/Municipality.js";
import { Bank } from "../models/Bank.js";
import { Branch } from "../models/Branch.js";

export const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Provider.countDocuments({});
    const providers = await Provider.find({})
      .select("_id commercialName businessName rfc contactName countryId stateId municipalityId address phone email description bank accountNumber clabe referencia sucursal isActive createdAt updatedAt")
      .populate("countryId", "_id name")
      .populate("stateId", "_id name")
      .populate("municipalityId", "_id name")
      .populate("bank", "_id name")
      .populate("sucursal", "_id name")
      .sort({ commercialName: 1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: providers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllProviders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const filters = {};
    if (search) {
      filters.$or = [
        { commercialName: { $regex: search, $options: "i" } },
        { businessName: { $regex: search, $options: "i" } },
        { rfc: { $regex: search, $options: "i" } },
        { contactName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { referencia: { $regex: search, $options: "i" } },
      ];
    }
    if (req.query.isActive === "true") filters.isActive = true;
    if (req.query.isActive === "false") filters.isActive = false;

    const total = await Provider.countDocuments(filters);
    const providers = await Provider.find(filters)
      .populate("countryId", "_id name")
      .populate("stateId", "_id name")
      .populate("municipalityId", "_id name")
      .populate("bank", "_id name")
      .populate("sucursal", "_id name")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: providers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createProvider = async (req, res) => {
  try {
    const {
      commercialName,
      businessName,
      rfc,
      contactName,
      countryId,
      stateId,
      municipalityId,
      address,
      phone,
      email,
      description,
      bank,
      accountNumber,
      clabe,
      referencia,
      sucursal,
      isActive,
    } = req.body;

    // Validaciones existentes
    const country = await Country.findOne({ _id: countryId, isActive: true });
    if (!country) {
      return res.status(400).json({ success: false, message: "Selected country does not exist or is not active" });
    }
    const state = await State.findOne({ _id: stateId, countryId, isActive: true });
    if (!state) {
      return res.status(400).json({ success: false, message: "Selected state does not exist or does not belong to the selected country" });
    }
    const municipality = await Municipality.findOne({ _id: municipalityId, stateId, isActive: true });
    if (!municipality) {
      return res.status(400).json({ success: false, message: "Selected municipality does not exist or does not belong to the selected state" });
    }

    // Validaciones para los nuevos campos
    const bankExists = await Bank.findOne({ _id: bank, isActive: true });
    if (!bankExists) {
      return res.status(400).json({ success: false, message: "Selected bank does not exist or is not active" });
    }

    const branchExists = await Branch.findOne({ _id: sucursal, isActive: true });
    if (!branchExists) {
      return res.status(400).json({ success: false, message: "Selected branch does not exist or is not active" });
    }

    // Verificar que la referencia sea única
    const existingReference = await Provider.findOne({ referencia: referencia.toUpperCase() });
    if (existingReference) {
      return res.status(400).json({ success: false, message: "La referencia bancaria ya existe" });
    }

    const newProvider = await Provider.create({
      commercialName,
      businessName,
      rfc,
      contactName,
      countryId,
      stateId,
      municipalityId,
      address,
      phone,
      email,
      description,
      bank,
      accountNumber,
      clabe,
      referencia: referencia.toUpperCase(),
      sucursal,
      isActive,
    });

    res.status(201).json({
      success: true,
      data: newProvider,
      message: "Proveedor creado con éxito",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      commercialName,
      businessName,
      rfc,
      contactName,
      countryId,
      stateId,
      municipalityId,
      address,
      phone,
      email,
      description,
      bank,
      accountNumber,
      clabe,
      referencia,
      sucursal,
      isActive,
    } = req.body;

    // Validaciones existentes
    const country = await Country.findOne({ _id: countryId, isActive: true });
    if (!country) {
      return res.status(400).json({ success: false, message: "Selected country does not exist or is not active" });
    }
    const state = await State.findOne({ _id: stateId, countryId, isActive: true });
    if (!state) {
      return res.status(400).json({ success: false, message: "Selected state does not exist or does not belong to the selected country" });
    }
    const municipality = await Municipality.findOne({ _id: municipalityId, stateId, isActive: true });
    if (!municipality) {
      return res.status(400).json({ success: false, message: "Selected municipality does not exist or does not belong to the selected state" });
    }

    // Validaciones para los nuevos campos
    const bankExists = await Bank.findOne({ _id: bank, isActive: true });
    if (!bankExists) {
      return res.status(400).json({ success: false, message: "Selected bank does not exist or is not active" });
    }

    const branchExists = await Branch.findOne({ _id: sucursal, isActive: true });
    if (!branchExists) {
      return res.status(400).json({ success: false, message: "Selected branch does not exist or is not active" });
    }

    // Verificar que la referencia sea única (excluyendo el proveedor actual)
    if (referencia) {
      const existingReference = await Provider.findOne({
        referencia: referencia.toUpperCase(),
        _id: { $ne: id }
      });
      if (existingReference) {
        return res.status(400).json({ success: false, message: "La referencia bancaria ya existe" });
      }
    }

    const updateData = {
      commercialName,
      businessName,
      rfc,
      contactName,
      countryId,
      stateId,
      municipalityId,
      address,
      phone,
      email,
      description,
      bank,
      accountNumber,
      clabe,
      sucursal,
    };

    if (referencia) updateData.referencia = referencia.toUpperCase();
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedProvider = await Provider.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedProvider) {
      return res.status(404).json({ success: false, message: "Proveedor no encontrado" });
    }

    res.json({
      success: true,
      data: updatedProvider,
      message: "Proveedor actualizado con éxito",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProvider = await Provider.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    if (!deletedProvider) {
      return res.status(404).json({ success: false, message: "Proveedor no encontrado" });
    }
    res.json({ success: true, message: "Proveedor dado de baja con éxito" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const activateProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const activatedProvider = await Provider.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    );
    if (!activatedProvider) {
      return res.status(404).json({ success: false, message: "Proveedor no encontrado" });
    }
    res.json({ success: true, message: "Proveedor activado con éxito" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStatesByCountryId = async (req, res) => {
  try {
    const { countryId } = req.params;
    const country = await Country.findOne({ _id: countryId, isActive: true });
    if (!country) {
      return res.status(404).json({ success: false, message: "Country not found" });
    }
    const states = await State.find({ countryId, isActive: true })
      .select("_id name")
      .sort({ name: 1 });
    res.status(200).json({ success: true, data: states });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMunicipalitiesByStateId = async (req, res) => {
  try {
    const { stateId } = req.params;
    const state = await State.findOne({ _id: stateId, isActive: true });
    if (!state) {
      return res.status(404).json({ success: false, message: "State not found" });
    }
    const municipalities = await Municipality.find({ stateId, isActive: true })
      .select("_id name")
      .sort({ name: 1 });
    res.status(200).json({ success: true, data: municipalities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllBanks = async (req, res) => {
  try {
    const banks = await Bank.find({ isActive: true })
      .select("_id name")
      .sort({ name: 1 });
    res.status(200).json({ success: true, data: banks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.find({ isActive: true })
      .select("_id name")
      .sort({ name: 1 });
    res.status(200).json({ success: true, data: branches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET - Obtener proveedores por RFCs
export const getProvidersByRfcs = async (req, res) => {
  try {
    const { rfcs } = req.query;

    console.log('getProvidersByRfcs llamado con rfcs:', rfcs);

    if (!rfcs) {
      console.log('Error: parámetro rfcs faltante');
      return res.status(400).json({
        success: false,
        message: 'El parámetro rfcs es requerido (separado por comas)',
      });
    }

    // Convertir string de RFCs a array
    const rfcArray = rfcs.split(',').map(rfc => rfc.trim().toUpperCase());
    console.log('RFCs procesados:', rfcArray);

    const providers = await Provider.find({
      rfc: { $in: rfcArray },
      isActive: true
    })
      .select('_id commercialName businessName rfc contactName bank accountNumber clabe referencia sucursal')
      .populate('bank', '_id name')
      .populate('sucursal', '_id name')
      .sort({ commercialName: 1 });

    console.log('Proveedores encontrados:', providers.length);
    console.log('Proveedores:', providers.map(p => ({ rfc: p.rfc, name: p.commercialName })));

    res.status(200).json({
      success: true,
      data: providers,
    });
  } catch (error) {
    console.error('Error al obtener proveedores por RFCs:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

export const getBankAccountsByBank = async (req, res) => {
  try {
    const { bankId } = req.params;
    const { BankAccount } = await import("../models/BankAccount.js");

    const bankAccounts = await BankAccount.find({
      bank: bankId,
      isActive: true
    })
      .select("_id accountNumber clabe")
      .sort({ accountNumber: 1 });

    res.status(200).json({ success: true, data: bankAccounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
