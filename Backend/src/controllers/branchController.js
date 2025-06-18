import { Branch } from "../models/Branch.js";
import { Brand } from "../models/Brand.js";
import { Company } from "../models/Company.js";
import { Country } from "../models/Country.js";
import { Municipality } from "../models/Municipality.js";
import { State } from "../models/State.js";

export const getAll = async (req, res) => {
  try {
    const branches = await Branch.find({ isActive: true })
      .select("_id name companyId countryId stateId municipalityId")
      .populate("companyId", "_id name")
      .populate("brandId", "_id name")
      .populate("countryId", "_id name")
      .populate("stateId", "_id name")
      .populate("municipalityId", "_id name")
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

    const filters = { isActive: true };
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: "i" } },
        { businessName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Branch.countDocuments(filters);
    const branches = await Branch.find(filters)
      .populate("companyId", "_id name")
      .populate("brandId", "_id name")
      .populate("countryId", "_id name")
      .populate("stateId", "_id name")
      .populate("municipalityId", "_id name")
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
      companyId,
      brandId,
      name,
      countryId,
      stateId,
      municipalityId,
      address,
      postalCode,
      phone,
      email,
      description,
    } = req.body;

    const company = await Company.findOne({ _id: companyId, isActive: true });
    if (!company) {
      return res.status(400).json({
        success: false,
        message: "Selected company does not exist or is not active",
      });
    }

    const brand = await Brand.findOne({ _id: brandId, isActive: true });
    if (!brand) {
      return res.status(400).json({
        success: false,
        message: "Selected brand does not exist or is not active",
      });
    }

    const country = await Country.findOne({ _id: countryId, isActive: true });
    if (!country) {
      return res.status(400).json({
        success: false,
        message: "Selected country does not exist or is not active",
      });
    }

    const state = await State.findOne({
      _id: stateId,
      countryId,
      isActive: true,
    });
    if (!state) {
      return res.status(400).json({
        success: false,
        message:
          "Selected state does not exist or does not belong to the selected country",
      });
    }

    const municipality = await Municipality.findOne({
      _id: municipalityId,
      stateId,
      isActive: true,
    });
    if (!municipality) {
      return res.status(400).json({
        success: false,
        message:
          "Selected municipality does not exist or does not belong to the selected state",
      });
    }

    const newBranch = await Branch.create({
      companyId,
      brandId,
      name,
      countryId,
      stateId,
      municipalityId,
      address,
      postalCode,
      phone,
      email,
      description,
      isActive: true,
    });

    await newBranch.populate([
      { path: "companyId", select: "_id name" },
      { path: "brandId", select: "_id name" },
      { path: "countryId", select: "_id name" },
      { path: "stateId", select: "_id name" },
      { path: "municipalityId", select: "_id name" },
    ]);

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
      companyId,
      brandId,
      name,
      countryId,
      stateId,
      municipalityId,
      address,
      postalCode,
      phone,
      email,
      description,
    } = req.body;

    const company = await Company.findOne({ _id: companyId, isActive: true });
    if (!company) {
      return res.status(400).json({
        success: false,
        message: "Selected company does not exist or is not active",
      });
    }

    const brand = await Brand.findOne({ _id: brandId, isActive: true });
    if (!brand) {
      return res.status(400).json({
        success: false,
        message: "Selected brand does not exist or is not active",
      });
    }

    const country = await Country.findOne({ _id: countryId, isActive: true });
    if (!country) {
      return res.status(400).json({
        success: false,
        message: "Selected country does not exist or is not active",
      });
    }

    const state = await State.findOne({
      _id: stateId,
      countryId,
      isActive: true,
    });
    if (!state) {
      return res.status(400).json({
        success: false,
        message:
          "Selected state does not exist or does not belong to the selected country",
      });
    }

    const municipality = await Municipality.findOne({
      _id: municipalityId,
      stateId,
      isActive: true,
    });
    if (!municipality) {
      return res.status(400).json({
        success: false,
        message:
          "Selected municipality does not exist or does not belong to the selected state",
      });
    }

    const updatedBranch = await Branch.findByIdAndUpdate(
      id,
      {
        companyId,
        brandId,
        name,
        countryId,
        stateId,
        municipalityId,
        address,
        postalCode,
        phone,
        email,
        description,
      },
      { new: true }
    ).populate([
      { path: "companyId", select: "_id name" },
      { path: "brandId", select: "_id name" },
      { path: "countryId", select: "_id name" },
      { path: "stateId", select: "_id name" },
      { path: "municipalityId", select: "_id name" },
    ]);

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
