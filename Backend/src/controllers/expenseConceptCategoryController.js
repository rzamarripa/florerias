import { ExpenseConceptCategory } from "../models/ExpenseConceptCategory.js";

export const getAll = async (req, res) => {
  try {
    const categories = await ExpenseConceptCategory.find({ isActive: true })
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

export const getAllExpenseConceptCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const isActive = req.query.isActive;

    const filters = {};
    if (search) {
      filters.name = { $regex: search, $options: "i" };
    }
    if (isActive !== undefined && isActive !== "") {
      filters.isActive = isActive === "true";
    }
    const total = await ExpenseConceptCategory.countDocuments(filters);
    const categories = await ExpenseConceptCategory.find(filters)
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

export const createExpenseConceptCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const newCategory = await ExpenseConceptCategory.create({
      name,
      isActive: true,
    });
    res.status(201).json({
      success: true,
      data: newCategory,
      message: "Categoría de concepto de gasto creada con éxito",
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

export const updateExpenseConceptCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const updatedCategory = await ExpenseConceptCategory.findByIdAndUpdate(
      id,
      { name },
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

export const deleteExpenseConceptCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCategory = await ExpenseConceptCategory.findByIdAndUpdate(
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

export const activateExpenseConceptCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const activatedCategory = await ExpenseConceptCategory.findByIdAndUpdate(
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
