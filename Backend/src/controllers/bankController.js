import { Bank } from "../models/Bank.js";

export const getAll = async (req, res) => {
  try {
    const banks = await Bank.find({ isActive: true })
      .select("_id name")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: banks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllBanks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const filters = {};
    if (search) {
      filters.$or = [{ name: { $regex: search, $options: "i" } }];
    }

    const total = await Bank.countDocuments(filters);
    const banks = await Bank.find(filters)
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: banks,
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
    const bank = await Bank.findOne({ _id: id, isActive: true }).select(
      "_id name"
    );
    if (!bank) {
      return res
        .status(404)
        .json({ success: false, message: "Bank not found" });
    }
    res.status(200).json({ success: true, data: bank });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createBank = async (req, res) => {
  try {
    const { name } = req.body;
    const newBank = await Bank.create({ name: name.trim(), isActive: true });
    res.status(201).json({
      success: true,
      data: newBank,
      message: "Bank created successfully",
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `A bank with that ${field} already exists`,
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBank = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const updatedBank = await Bank.findByIdAndUpdate(
      id,
      { name: name.trim() },
      { new: true }
    );
    if (!updatedBank) {
      return res
        .status(404)
        .json({ success: false, message: "Bank not found" });
    }
    res.json({
      success: true,
      data: updatedBank,
      message: "Bank updated successfully",
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `A bank with that ${field} already exists`,
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBank = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBank = await Bank.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    if (!deletedBank) {
      return res
        .status(404)
        .json({ success: false, message: "Bank not found" });
    }
    res.json({ success: true, message: "Bank deactivated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const activeBank = async (req, res) => {
  try {
    const { id } = req.params;
    const activatedBank = await Bank.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    );
    if (!activatedBank) {
      return res
        .status(404)
        .json({ success: false, message: "Bank not found" });
    }
    res.json({ success: true, message: "Bank activated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
