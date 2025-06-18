import { Municipality } from "../models/Municipality.js";
import { State } from "../models/State.js";

// Para selects - sin paginación
export const getAll = async (req, res) => {
  try {
    const municipalities = await Municipality.find({ isActive: true })
      .select("_id name stateId postalCodes")
      .populate({
        path: "stateId",
        select: "_id name",
        populate: {
          path: "countryId",
          select: "_id name",
        },
      })
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: municipalities,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Para tablas - con paginación y filtros
export const getAllMunicipalities = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const filters = { isActive: true };
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: "i" } },
        { postalCodes: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const total = await Municipality.countDocuments(filters);
    const municipalities = await Municipality.find(filters)
      .populate({
        path: "stateId",
        select: "_id name",
        populate: {
          path: "countryId",
          select: "_id name",
        },
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: municipalities,
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

    const municipality = await Municipality.findOne({ _id: id, isActive: true })
      .select("_id name stateId postalCodes")
      .populate({
        path: "stateId",
        select: "_id name",
        populate: {
          path: "countryId",
          select: "_id name",
        },
      });

    if (!municipality) {
      return res.status(404).json({
        success: false,
        message: "Municipality not found",
      });
    }

    res.status(200).json({
      success: true,
      data: municipality,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Para select en cascada - obtener municipios por estado
export const getByStateId = async (req, res) => {
  try {
    const { stateId } = req.params;

    // Verificar que el estado existe
    const state = await State.findOne({ _id: stateId, isActive: true });
    if (!state) {
      return res.status(404).json({
        success: false,
        message: "State not found",
      });
    }

    const municipalities = await Municipality.find({ stateId, isActive: true })
      .select("_id name postalCodes")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: municipalities,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createMunicipality = async (req, res) => {
  try {
    const { name, stateId, postalCodes } = req.body;

    // Verificar que el estado existe
    const state = await State.findOne({ _id: stateId, isActive: true });
    if (!state) {
      return res.status(400).json({
        success: false,
        message: "Selected state does not exist or is not active",
      });
    }

    const newMunicipality = await Municipality.create({
      name: name.trim(),
      stateId,
      postalCodes: postalCodes || [],
      isActive: true,
    });

    await newMunicipality.populate({
      path: "stateId",
      select: "_id name",
      populate: {
        path: "countryId",
        select: "_id name",
      },
    });

    res.status(201).json({
      success: true,
      data: newMunicipality,
      message: "Municipality created successfully",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "A municipality with that name already exists in the selected state",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMunicipality = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, stateId, postalCodes } = req.body;

    // Verificar que el estado existe
    const state = await State.findOne({ _id: stateId, isActive: true });
    if (!state) {
      return res.status(400).json({
        success: false,
        message: "Selected state does not exist or is not active",
      });
    }

    const updatedMunicipality = await Municipality.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        stateId,
        postalCodes: postalCodes || [],
      },
      { new: true }
    ).populate({
      path: "stateId",
      select: "_id name",
      populate: {
        path: "countryId",
        select: "_id name",
      },
    });

    if (!updatedMunicipality) {
      return res.status(404).json({
        success: false,
        message: "Municipality not found",
      });
    }

    res.json({
      success: true,
      data: updatedMunicipality,
      message: "Municipality updated successfully",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "A municipality with that name already exists in the selected state",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteMunicipality = async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Check if municipality has related branches
    // const relatedBranches = await Branch.countDocuments({
    //   municipalityId: id,
    //   isActive: true,
    // });
    // if (relatedBranches > 0) {
    //   return res.status(400).json({
    //     success: false,
    //     message: `Cannot delete municipality because it has ${relatedBranches} associated branch(es)`,
    //   });
    // }

    const deletedMunicipality = await Municipality.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!deletedMunicipality) {
      return res.status(404).json({
        success: false,
        message: "Municipality not found",
      });
    }

    res.json({
      success: true,
      message: "Municipality deactivated successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const activeMunicipality = async (req, res) => {
  try {
    const { id } = req.params;

    const activatedMunicipality = await Municipality.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    );

    if (!activatedMunicipality) {
      return res.status(404).json({
        success: false,
        message: "Municipality not found",
      });
    }

    res.json({ success: true, message: "Municipality activated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
