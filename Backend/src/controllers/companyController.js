import { Company } from "../models/Company.js";

export const getAll = async (req, res) => {
  try {
    const companies = await Company.find({}).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: companies,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET - Obtener todas las razones sociales activas
export const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ isActive: true })
      .select('_id name rfc legalRepresentative')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: companies,
    });
  } catch (error) {
    console.error('Error al obtener razones sociales:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

export const createCompany = async (req, res) => {
  try {
    const { name, legalRepresentative, rfc, address, isActive } = req.body;

    const newCompany = await Company.create({
      name,
      legalRepresentative,
      rfc,
      address,
      isActive,
    });

    res.status(201).json({
      success: true,
      data: newCompany,
      message: "Razon social creada con exito",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCompany = async (req, res) => {
  try {
    console.log("updateCompany", req.body);
    const { id } = req.params;
    const { name, legalRepresentative, rfc, address, isActive } = req.body;

    const updateData = { name, legalRepresentative, rfc, address };
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedCompany = await Company.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedCompany)
      return res.status(404).json({
        success: false,
        message: "No encontrada",
      });

    res.json({
      success: true,
      data: updatedCompany,
      message: "Razon social actualizada con exito",
    });
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
        message: "No encontrada",
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
        message: "No encontrada",
      });

    res.json({ success: true, message: "Razon social activada con exito" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
