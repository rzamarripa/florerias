import { Provider } from "../models/Provider.js";
import { Country } from "../models/Country.js";
import { State } from "../models/State.js";
import { Municipality } from "../models/Municipality.js";

export const getAll = async (req, res) => {
  try {
    const providers = await Provider.find({ isActive: true })
      .select("_id commercialName businessName contactName countryId stateId municipalityId address phone email description")
      .populate("countryId", "_id name")
      .populate("stateId", "_id name")
      .populate("municipalityId", "_id name")
      .sort({ commercialName: 1 });

    res.status(200).json({
      success: true,
      data: providers,
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

    const filters = { isActive: true };
    if (search) {
      filters.$or = [
        { commercialName: { $regex: search, $options: "i" } },
        { businessName: { $regex: search, $options: "i" } },
        { contactName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Provider.countDocuments(filters);
    const providers = await Provider.find(filters)
      .populate("countryId", "_id name")
      .populate("stateId", "_id name")
      .populate("municipalityId", "_id name")
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
      contactName,
      countryId,
      stateId,
      municipalityId,
      address,
      phone,
      email,
      description,
      isActive,
    } = req.body;

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

    const newProvider = await Provider.create({
      commercialName,
      businessName,
      contactName,
      countryId,
      stateId,
      municipalityId,
      address,
      phone,
      email,
      description,
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
      contactName,
      countryId,
      stateId,
      municipalityId,
      address,
      phone,
      email,
      description,
      isActive,
    } = req.body;

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

    const updateData = {
      commercialName,
      businessName,
      contactName,
      countryId,
      stateId,
      municipalityId,
      address,
      phone,
      email,
      description,
    };
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
