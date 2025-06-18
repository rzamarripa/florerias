import { Country } from "../models/Country.js";

export const getAll = async (req, res) => {
  try {
    const countries = await Country.find({ isActive: true })
      .select("_id name")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: countries,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllCountries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const filters = { isActive: true };
    if (search) {
      filters.$or = [{ name: { $regex: search, $options: "i" } }];
    }

    const total = await Country.countDocuments(filters);
    const countries = await Country.find(filters)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: countries,
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

    const country = await Country.findOne({ _id: id, isActive: true }).select(
      "_id name"
    );

    if (!country) {
      return res.status(404).json({
        success: false,
        message: "Country not found",
      });
    }

    res.status(200).json({
      success: true,
      data: country,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCountry = async (req, res) => {
  try {
    const { name } = req.body;

    const newCountry = await Country.create({
      name: name.trim(),
      isActive: true,
    });

    res.status(201).json({
      success: true,
      data: newCountry,
      message: "Country created successfully",
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `A country with that ${field} already exists`,
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCountry = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const updatedCountry = await Country.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
      },
      { new: true }
    );

    if (!updatedCountry) {
      return res.status(404).json({
        success: false,
        message: "Country not found",
      });
    }

    res.json({
      success: true,
      data: updatedCountry,
      message: "Country updated successfully",
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `A country with that ${field} already exists`,
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCountry = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCountry = await Country.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!deletedCountry) {
      return res.status(404).json({
        success: false,
        message: "Country not found",
      });
    }

    res.json({ success: true, message: "Country deactivated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const activeCountry = async (req, res) => {
  try {
    const { id } = req.params;

    const activatedCountry = await Country.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    );

    if (!activatedCountry) {
      return res.status(404).json({
        success: false,
        message: "Country not found",
      });
    }

    res.json({ success: true, message: "Country activated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
