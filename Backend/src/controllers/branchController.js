import { Branch } from "../models/Branch.js";
import { Brand } from "../models/Brand.js";

export const getAll = async (req, res) => {
  try {
    const branches = await Branch.find({ isActive: true })
      .select("_id name businessName city state")
      .populate("brandId", "_id name")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: branches,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllBranches = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const filters = {};
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: "i" } },
        { businessName: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { state: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Branch.countDocuments(filters);
    const branches = await Branch.find(filters)
      .populate("brandId", "_id name")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: branches,
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

export const createBranch = async (req, res) => {
  try {
    const {
      businessName,
      brandId,
      name,
      country,
      state,
      city,
      address,
      phone,
      email,
      description,
    } = req.body;

    const brand = await Brand.findOne({ _id: brandId, isActive: true });
    if (!brand) {
      return res.status(400).json({
        success: false,
        message: "Selected brand does not exist or is not active",
      });
    }

    const newBranch = await Branch.create({
      businessName,
      brandId,
      name,
      country,
      state,
      city,
      address,
      phone,
      email,
      description,
      isActive: true,
    });

    await newBranch.populate("brandId", "_id name");

    res.status(201).json({
      success: true,
      data: newBranch,
      message: "Branch created successfully",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "A branch with that name already exists for the selected brand",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      businessName,
      brandId,
      name,
      country,
      state,
      city,
      address,
      phone,
      email,
      description,
    } = req.body;

    const brand = await Brand.findOne({ _id: brandId, isActive: true });
    if (!brand) {
      return res.status(400).json({
        success: false,
        message: "Selected brand does not exist or is not active",
      });
    }

    const updatedBranch = await Branch.findByIdAndUpdate(
      id,
      {
        businessName,
        brandId,
        name,
        country,
        state,
        city,
        address,
        phone,
        email,
        description,
      },
      { new: true }
    ).populate("brandId", "_id name");

    if (!updatedBranch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    res.json({
      success: true,
      data: updatedBranch,
      message: "Branch updated successfully",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "A branch with that name already exists for the selected brand",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Check if branch has relationships with other models
    // Example: products, employees, sales, etc.
    // const relatedCount = await SomeModel.countDocuments({
    //   branchId: id,
    //   isActive: true,
    // });
    // if (relatedCount > 0) {
    //   return res.status(400).json({
    //     success: false,
    //     message: `Cannot delete branch because it has ${relatedCount} associated record(s)`,
    //   });
    // }

    const deletedBranch = await Branch.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!deletedBranch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    res.json({ success: true, message: "Branch deactivated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const activeBranch = async (req, res) => {
  try {
    const { id } = req.params;

    const activatedBranch = await Branch.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    );

    if (!activatedBranch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    res.json({ success: true, message: "Branch activated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
