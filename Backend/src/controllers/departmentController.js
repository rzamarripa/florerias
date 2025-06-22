import { Department } from "../models/Department.js";

export const getAll = async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true })
      .select("_id name")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: departments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllDepartments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const filters = {};
    if (search) {
      filters.name = { $regex: search, $options: "i" };
    }

    const total = await Department.countDocuments(filters);
    const departments = await Department.find(filters)
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: departments,
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
    const department = await Department.findOne({ _id: id, isActive: true })
      .select("_id name");

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }
    res.status(200).json({ success: true, data: department });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createDepartment = async (req, res) => {
  try {
    const { name } = req.body;
    const newDepartment = await Department.create({
      name: name.trim(),
      isActive: true,
    });

    res.status(201).json({
      success: true,
      data: newDepartment,
      message: "Department created successfully",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A department with that name already exists",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const updatedDepartment = await Department.findByIdAndUpdate(
      id,
      { name: name.trim() },
      { new: true }
    );

    if (!updatedDepartment) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }
    res.json({
      success: true,
      data: updatedDepartment,
      message: "Department updated successfully",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A department with that name already exists",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedDepartment = await Department.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    if (!deletedDepartment) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }
    res.json({ success: true, message: "Department deactivated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const activeDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const activatedDepartment = await Department.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    );
    if (!activatedDepartment) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }
    res.json({ success: true, message: "Department activated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
