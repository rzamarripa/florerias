import { Country } from "../models/Country.js";
import { State } from "../models/State.js";

export const getAll = async (req, res) => {
  try {
    const states = await State.find({ isActive: true })
      .select("_id name countryId")
      .populate("countryId", "_id name")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: states,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllStates = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const filters = {};
    if (search) {
      filters.$or = [{ name: { $regex: search, $options: "i" } }];
    }

    const total = await State.countDocuments(filters);
    const states = await State.find(filters)
      .populate("countryId", "_id name")
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: states,
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

    const state = await State.findOne({ _id: id, isActive: true })
      .select("_id name countryId")
      .populate("countryId", "_id name");

    if (!state) {
      return res.status(404).json({
        success: false,
        message: "State not found",
      });
    }

    res.status(200).json({
      success: true,
      data: state,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getByCountryId = async (req, res) => {
  try {
    const { countryId } = req.params;

    const country = await Country.findOne({ _id: countryId, isActive: true });
    if (!country) {
      return res.status(404).json({
        success: false,
        message: "Country not found",
      });
    }

    const states = await State.find({ countryId, isActive: true })
      .select("_id name")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: states,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createState = async (req, res) => {
  try {
    const { name, countryId } = req.body;

    const country = await Country.findOne({ _id: countryId, isActive: true });
    if (!country) {
      return res.status(400).json({
        success: false,
        message: "Selected country does not exist or is not active",
      });
    }

    const newState = await State.create({
      name: name.trim(),
      countryId,
      isActive: true,
    });

    await newState.populate("countryId", "_id name");

    res.status(201).json({
      success: true,
      data: newState,
      message: "State created successfully",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "A state with that name already exists in the selected country",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateState = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, countryId } = req.body;

    const country = await Country.findOne({ _id: countryId, isActive: true });
    if (!country) {
      return res.status(400).json({
        success: false,
        message: "Selected country does not exist or is not active",
      });
    }

    const updatedState = await State.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        countryId,
      },
      { new: true }
    ).populate("countryId", "_id name");

    if (!updatedState) {
      return res.status(404).json({
        success: false,
        message: "State not found",
      });
    }

    res.json({
      success: true,
      data: updatedState,
      message: "State updated successfully",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "A state with that name already exists in the selected country",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteState = async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Check if state has related municipalities (municipalities)
    // const relatedMunicipalities = await Municipality.countDocuments({
    //   stateId: id,
    //   isActive: true,
    // });
    // if (relatedMunicipalities > 0) {
    //   return res.status(400).json({
    //     success: false,
    //     message: `Cannot delete state because it has ${relatedMunicipalities} associated municipality(ies)`,
    //   });
    // }

    const deletedState = await State.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!deletedState) {
      return res.status(404).json({
        success: false,
        message: "State not found",
      });
    }

    res.json({ success: true, message: "State deactivated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const activeState = async (req, res) => {
  try {
    const { id } = req.params;

    const activatedState = await State.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    );

    if (!activatedState) {
      return res.status(404).json({
        success: false,
        message: "State not found",
      });
    }

    res.json({ success: true, message: "State activated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
