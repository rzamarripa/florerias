import { Branch } from "../models/Branch.js";
import { Brand } from "../models/Brand.js";
import { Company } from "../models/Company.js";
import { Country } from "../models/Country.js";
import { Municipality } from "../models/Municipality.js";
import { State } from "../models/State.js";
import { RsBranchBrand } from "../models/BranchBrands.js";

export const getAll = async (req, res) => {
  try {
    const branches = await Branch.find({ isActive: true })
      .select("_id name companyId countryId stateId municipalityId")
      .populate("companyId", "_id name")
      .populate("countryId", "_id name")
      .populate("stateId", "_id name")
      .populate("municipalityId", "_id name")
      .sort({ name: 1 });

    // Obtener las marcas asociadas a cada sucursal
    const branchesWithBrands = await Promise.all(
      branches.map(async (branch) => {
        const brandRelations = await RsBranchBrand.find({ branchId: branch._id })
          .populate("brandId", "_id name")
          .lean();

        const brands = brandRelations
          .filter((rel) => rel.brandId)
          .map((rel) => rel.brandId);

        return {
          ...branch.toObject(),
          brands: brands,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: branchesWithBrands,
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
        { email: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Branch.countDocuments(filters);
    const branches = await Branch.find(filters)
      .populate("companyId", "_id name")
      .populate("countryId", "_id name")
      .populate("stateId", "_id name")
      .populate("municipalityId", "_id name")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Obtener las marcas asociadas a cada sucursal
    const branchesWithBrands = await Promise.all(
      branches.map(async (branch) => {
        const brandRelations = await RsBranchBrand.find({ branchId: branch._id })
          .populate("brandId", "_id name")
          .lean();

        const brands = brandRelations
          .filter((rel) => rel.brandId)
          .map((rel) => rel.brandId);

        return {
          ...branch.toObject(),
          brands: brands,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: branchesWithBrands,
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
      name,
      countryId,
      stateId,
      municipalityId,
      address,
      postalCode,
      phone,
      email,
      description,
      rsBrands,
    } = req.body;

    const company = await Company.findOne({ _id: companyId, isActive: true });
    if (!company) {
      return res.status(400).json({
        success: false,
        message: "Selected company does not exist or is not active",
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

    if (rsBrands && Array.isArray(rsBrands) && rsBrands.length > 0) {
      const relations = rsBrands.map((brandId) => ({
        branchId: newBranch._id,
        brandId: brandId,
      }));
      await RsBranchBrand.insertMany(relations);
    }

    await newBranch.populate([
      { path: "companyId", select: "_id name" },
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
          "A branch with that name already exists for the selected company",
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
      name,
      countryId,
      stateId,
      municipalityId,
      address,
      postalCode,
      phone,
      email,
      description,
      rsBrands,
    } = req.body;

    const company = await Company.findOne({ _id: companyId, isActive: true });
    if (!company) {
      return res.status(400).json({
        success: false,
        message: "Selected company does not exist or is not active",
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

    if (rsBrands !== undefined) {
      await RsBranchBrand.deleteMany({ branchId: id });

      if (rsBrands && Array.isArray(rsBrands) && rsBrands.length > 0) {
        const relations = rsBrands.map((brandId) => ({
          branchId: id,
          brandId: brandId,
        }));
        await RsBranchBrand.insertMany(relations);
      }
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
          "A branch with that name already exists for the selected company",
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

export const getStatesByCountryId = async (req, res) => {
  try {
    const { countryId } = req.params;
    const country = await Country.findOne({ _id: countryId, isActive: true });
    if (!country) {
      return res.status(404).json({ success: false, message: "Country not found" });
    }
    const states = await State.find({ countryId, isActive: true })
      .select("_id name")
      .sort({ name: 1 });
    res.status(200).json({ success: true, data: states });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMunicipalitiesByStateId = async (req, res) => {
  try {
    const { stateId } = req.params;
    const state = await State.findOne({ _id: stateId, isActive: true });
    if (!state) {
      return res.status(404).json({ success: false, message: "State not found" });
    }
    const municipalities = await Municipality.find({ stateId, isActive: true })
      .select("_id name")
      .sort({ name: 1 });
    res.status(200).json({ success: true, data: municipalities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBranchesByBrand = async (req, res) => {
  try {
    const { brandId } = req.params;

    const relations = await RsBranchBrand.find({ brandId }).populate({
      path: "branchId",
      select: "_id name companyId brandId address phone email",
      match: { isActive: true },
      populate: {
        path: "companyId",
        select: "_id name",
      },
    });

    const branches = relations
      .filter((rel) => rel.branchId) // Filter out any null branchIds (from inactive branches)
      .map((rel) => rel.branchId);

    res.status(200).json({
      success: true,
      data: branches,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBranchBrands = async (req, res) => {
  try {
    const { branchId } = req.params;

    const relations = await RsBranchBrand.find({ branchId }).populate({
      path: "brandId",
      select: "_id name",
      match: { isActive: true },
    });

    const brands = relations
      .filter((rel) => rel.brandId) // Filter out any null brandIds (from inactive brands)
      .map((rel) => rel.brandId);

    res.status(200).json({
      success: true,
      data: brands,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const assignBrandsToBranch = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { brandIds } = req.body;

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    await RsBranchBrand.deleteMany({ branchId });

    const relations = await Promise.all(
      brandIds.map((brandId) =>
        RsBranchBrand.createRelation(branchId, brandId)
      )
    );

    const populatedRelations = await RsBranchBrand.find({
      _id: { $in: relations.map((r) => r._id) },
    }).populate("brandId");

    res.status(200).json({
      success: true,
      message: "Brands assigned successfully",
      data: populatedRelations,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeBrandFromBranch = async (req, res) => {
  try {
    const { branchId, brandId } = req.params;

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    await RsBranchBrand.removeRelation(branchId, brandId);

    res.status(200).json({
      success: true,
      message: "Brand removed successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
