import { Brand } from "../models/Brand.js";
import { Category } from "../models/Category.js";

export const getAll = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .select("_id name")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const filters = {};
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Category.countDocuments(filters);
    const categories = await Category.find(filters)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: categories,
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

export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const newCategory = await Category.create({
      name,
      description,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      data: newCategory,
      message: "Categoría creada con éxito",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Ya existe una categoría con ese nombre",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { name, description },
      { new: true }
    );

    if (!updatedCategory)
      return res.status(404).json({
        success: false,
        message: "Categoría no encontrada",
      });

    res.json({
      success: true,
      data: updatedCategory,
      message: "Categoría actualizada con éxito",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Ya existe una categoría con ese nombre",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const brandsCount = await Brand.countDocuments({
      categoryId: id,
      isActive: true,
    });

    if (brandsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar la categoría porque tiene ${brandsCount} marca(s) asociada(s)`,
      });
    }

    const deletedCategory = await Category.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!deletedCategory)
      return res.status(404).json({
        success: false,
        message: "Categoría no encontrada",
      });

    res.json({ success: true, message: "Categoría dada de baja con éxito" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const activeCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const activatedCategory = await Category.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    );

    if (!activatedCategory)
      return res.status(404).json({
        success: false,
        message: "Categoría no encontrada",
      });

    res.json({ success: true, message: "Categoría activada con éxito" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
