import { RazonSocial } from "../models/RazonSocial.js";

export const getAllRazonesSociales = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const filters = {};
    if (search) {
      filters.$or = [
        { nombreComercial: { $regex: search, $options: "i" } },
        { razonSocial: { $regex: search, $options: "i" } },
        { direccion: { $regex: search, $options: "i" } },
      ];
    }
    const total = await RazonSocial.countDocuments(filters);
    const razones = await RazonSocial.find(filters)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: razones,
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

export const createRazonSocial = async (req, res) => {
  try {
    const { nombreComercial, razonSocial, direccion, estatus } = req.body;
    const nueva = await RazonSocial.create({
      nombreComercial,
      razonSocial,
      direccion,
      estatus: estatus !== undefined ? estatus : true,
    });
    res.status(201).json({ success: true, data: nueva });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateRazonSocial = async (req, res) => {
  try {
    console.log("updateRazonSocial", req.body);
    const { id } = req.params;
    const { nombreComercial, razonSocial, direccion, estatus } = req.body;
    const updateData = { nombreComercial, razonSocial, direccion };
    if (estatus !== undefined) updateData.estatus = estatus;
    const actualizada = await RazonSocial.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!actualizada)
      return res.status(404).json({ success: false, message: "No encontrada" });
    res.json({ success: true, data: actualizada });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteRazonSocial = async (req, res) => {
  try {
    console.log("deleteRazonSocial");
    const { id } = req.params;
    const eliminada = await RazonSocial.findByIdAndUpdate(
      id,
      { estatus: false },
      { new: true }
    );
    if (!eliminada)
      return res.status(404).json({ success: false, message: "No encontrada" });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
