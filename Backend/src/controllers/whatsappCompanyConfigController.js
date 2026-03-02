import { WhatsappCompanyConfig } from "../models/WhatsappCompanyConfig.js";
import { Company } from "../models/Company.js";

// GET /whatsapp-config/company/:companyId — Obtener configuración WhatsApp
export const getWhatsappConfig = async (req, res) => {
  try {
    const { companyId } = req.params;

    const config = await WhatsappCompanyConfig.findOne({ companyId });

    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error("Error en getWhatsappConfig:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener la configuración de WhatsApp",
    });
  }
};

// PUT /whatsapp-config/company/:companyId — Upsert configuración WhatsApp
export const upsertWhatsappConfig = async (req, res) => {
  try {
    const { companyId } = req.params;

    // Verificar que la empresa exista y tenga WhatsApp activo
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Empresa no encontrada",
      });
    }

    if (!company.activeWhatsApp) {
      return res.status(400).json({
        success: false,
        message: "La empresa no tiene WhatsApp activo",
      });
    }

    const configData = {
      ...req.body,
      companyId,
      adminId: req.user._id,
    };

    const config = await WhatsappCompanyConfig.findOneAndUpdate(
      { companyId },
      configData,
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: config,
      message: "Configuración de WhatsApp guardada exitosamente",
    });
  } catch (error) {
    console.error("Error en upsertWhatsappConfig:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al guardar la configuración de WhatsApp",
    });
  }
};
