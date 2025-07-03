import { ExpenseConcept } from "../models/ExpenseConcept.js";

export const getAll = async (req, res) => {
  try {
    const concepts = await ExpenseConcept.find({ isActive: true })
      .select("_id name description categoryId departmentId")
      .populate("categoryId", "name")
      .populate("departmentId", "name")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: concepts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllExpenseConcepts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const categoryId = req.query.categoryId || "";
    const departmentId = req.query.departmentId || "";

    const filters = {};
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (categoryId) {
      filters.categoryId = categoryId;
    }
    if (departmentId) {
      filters.departmentId = departmentId;
    }

    const total = await ExpenseConcept.countDocuments(filters);
    const concepts = await ExpenseConcept.find(filters)
      .populate("categoryId", "name")
      .populate("departmentId", "name")
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: concepts,
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

export const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const concept = await ExpenseConcept.findOne({ _id: id, isActive: true })
      .select("_id name description categoryId departmentId")
      .populate("categoryId", "name")
      .populate("departmentId", "name");

    if (!concept) {
      return res.status(404).json({
        success: false,
        message: "Expense concept not found",
      });
    }
    res.status(200).json({ success: true, data: concept });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createExpenseConcept = async (req, res) => {
  try {
    const { name, description, categoryId, departmentId } = req.body;
    const newConcept = await ExpenseConcept.create({
      name: name.trim(),
      description: description.trim(),
      categoryId,
      departmentId,
      isActive: true,
    });

    const populatedConcept = await ExpenseConcept.findById(
      newConcept._id
    ).populate("categoryId", "name").populate("departmentId", "name");

    res.status(201).json({
      success: true,
      data: populatedConcept,
      message: "Expense concept created successfully",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "An expense concept with that name already exists for this category and department",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateExpenseConcept = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, categoryId, departmentId } = req.body;
    const updatedConcept = await ExpenseConcept.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        description: description.trim(),
        categoryId,
        departmentId,
      },
      { new: true }
    ).populate("categoryId", "name").populate("departmentId", "name");

    if (!updatedConcept) {
      return res.status(404).json({
        success: false,
        message: "Expense concept not found",
      });
    }
    res.json({
      success: true,
      data: updatedConcept,
      message: "Expense concept updated successfully",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "An expense concept with that name already exists for this category and department",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteExpenseConcept = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedConcept = await ExpenseConcept.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    if (!deletedConcept) {
      return res.status(404).json({
        success: false,
        message: "Expense concept not found",
      });
    }
    res.json({
      success: true,
      message: "Expense concept deactivated successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const activeExpenseConcept = async (req, res) => {
  try {
    const { id } = req.params;
    const activatedConcept = await ExpenseConcept.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    );
    if (!activatedConcept) {
      return res.status(404).json({
        success: false,
        message: "Expense concept not found",
      });
    }
    res.json({
      success: true,
      message: "Expense concept activated successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Obtener conceptos de gasto filtrados por departmentId
export const getExpenseConceptsByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;

    if (!departmentId) {
      return res.status(400).json({
        success: false,
        message: "departmentId es requerido",
      });
    }

    const concepts = await ExpenseConcept.find({
      departmentId: departmentId,
      isActive: true
    })
      .select("_id name description categoryId departmentId")
      .populate("categoryId", "name")
      .populate("departmentId", "name")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: concepts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
