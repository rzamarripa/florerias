import { Brand } from "../models/Brand.js";
import { RsCompanyBrand } from "../models/CompanyBrands.js";

export const getAll = async (req, res) => {
  try {
    const brands = await Brand.find({ isActive: true })
      .select("_id name")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: brands,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllBrands = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const filters = {};
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Brand.countDocuments(filters);
    const brands = await Brand.find(filters)
      .populate({
        path: "categoryId",
        select: "name description",
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const brandsWithCompanies = await Promise.all(
      brands.map(async (brand) => {
        const brandObj = brand.toObject();

        const relations = await RsCompanyBrand.find({ brandId: brand._id });

        brandObj.companies = relations.map((relation) =>
          relation.companyId.toString()
        );

        return brandObj;
      })
    );

    res.status(200).json({
      success: true,
      data: brandsWithCompanies,
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

export const createBrand = async (req, res) => {
  try {
    const { name, categoryId, description } = req.body;

    // Parsear rsCompanies si viene como string JSON
    let rsCompanies = [];
    if (req.body.rsCompanies) {
      try {
        rsCompanies = JSON.parse(req.body.rsCompanies);
      } catch (e) {
        // Si no es JSON válido, asumir que es un array
        rsCompanies = Array.isArray(req.body.rsCompanies)
          ? req.body.rsCompanies
          : [req.body.rsCompanies];
      }
    }

    let logoData = {};
    if (req.file) {
      logoData = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
    }

    const newBrand = await Brand.create({
      logo: logoData,
      name,
      categoryId,
      description,
      isActive: true, // Por defecto true para nuevas marcas
    });

    if (rsCompanies && rsCompanies.length > 0) {
      const relations = rsCompanies.map((companyId) => ({
        brandId: newBrand._id,
        companyId: companyId,
      }));
      await RsCompanyBrand.insertMany(relations);
    }

    // Populate la categoría antes de enviar la respuesta
    const populatedBrand = await Brand.findById(newBrand._id).populate({
      path: "categoryId",
      select: "name description",
    });

    res.status(201).json({
      success: true,
      data: populatedBrand,
      message: "Marca creada con éxito",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, categoryId, description } = req.body;

    // Parsear rsCompanies si viene como string JSON
    let rsCompanies;
    if (req.body.rsCompanies !== undefined) {
      try {
        rsCompanies = JSON.parse(req.body.rsCompanies);
      } catch (e) {
        // Si no es JSON válido, asumir que es un array
        rsCompanies = Array.isArray(req.body.rsCompanies)
          ? req.body.rsCompanies
          : [req.body.rsCompanies];
      }
    }

    const updateData = { name, categoryId, description };

    if (req.file) {
      updateData.logo = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
    }

    const updatedBrand = await Brand.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate({
      path: "categoryId",
      select: "name description",
    });

    if (!updatedBrand)
      return res.status(404).json({
        success: false,
        message: "Marca no encontrada",
      });

    // Solo actualizar relaciones si rsCompanies está definido
    if (rsCompanies !== undefined) {
      await RsCompanyBrand.deleteMany({ brandId: id });

      if (rsCompanies.length > 0) {
        const relations = rsCompanies.map((companyId) => ({
          brandId: id,
          companyId: companyId,
        }));
        await RsCompanyBrand.insertMany(relations);
      }
    }

    res.json({
      success: true,
      data: updatedBrand,
      message: "Marca actualizada con éxito",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBrand = await Brand.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!deletedBrand)
      return res.status(404).json({
        success: false,
        message: "Marca no encontrada",
      });

    res.json({ success: true, message: "Marca dada de baja con éxito" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const activeBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const activatedBrand = await Brand.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    );

    if (!activatedBrand)
      return res.status(404).json({
        success: false,
        message: "Marca no encontrada",
      });

    res.json({ success: true, message: "Marca activada con éxito" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
