import { Company } from "../models/Company.js";

export const getAllCompanies = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const filters = {};

    if (search) {
      filters.$or = [
        { tradeName: { $regex: search, $options: "i" } },
        { legalName: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Company.countDocuments(filters);
    const companies = await Company.find(filters)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: companies,
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

export const createCompany = async (req, res) => {
  try {
    const { tradeName, legalName, address, isActive } = req.body;
    const newCompany = await Company.create({
      tradeName,
      legalName,
      address
    });
    res.status(201).json({ success: true, data: newCompany, message: "Razon social creada con exito" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCompany = async (req, res) => {
  try {
    console.log("updateCompany", req.body);
    const { id } = req.params;
    const { tradeName, legalName, address, isActive } = req.body;
    const updateData = { tradeName, legalName, address };

    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedCompany = await Company.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedCompany)
      return res.status(404).json({
        success: false,
        message: "No encontrada"
      });

    res.json({ success: true, data: updatedCompany, message: "Razon social actualizada con exito" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCompany = await Company.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!deletedCompany)
      return res.status(404).json({
        success: false,
        message: "No encontrada"
      });

    res.json({ success: true, message: "Razon social dada de baja con exito" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const activeCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const activatedCompany = await Company.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    );

    if (!activatedCompany)
      return res.status(404).json({
        success: false,
        message: "No encontrada"
      });

    res.json({ success: true, message: "Razon social activada con exito" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};