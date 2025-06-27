import { InvoicesPackpageCompany } from "../models/InvoicesPackpageCompany.js";
import mongoose from "mongoose";

// CREATE - Crear una nueva relación
export const createInvoicesPackpageCompany = async (req, res) => {
    try {
        const { packpageId, companyId, brandId, branchId } = req.body;

        // Validar datos requeridos
        if (!packpageId || !companyId) {
            return res.status(400).json({
                success: false,
                message: 'packpageId y companyId son requeridos.'
            });
        }

        // Verificar que no exista ya una relación para este paquete
        const existingRelation = await InvoicesPackpageCompany.findOne({ packpageId });
        if (existingRelation) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una relación para este paquete de facturas.'
            });
        }

        // Crear la relación
        const packpageCompanyData = {
            packpageId: new mongoose.Types.ObjectId(packpageId),
            companyId: new mongoose.Types.ObjectId(companyId)
        };

        if (brandId) {
            packpageCompanyData.brandId = new mongoose.Types.ObjectId(brandId);
        }

        if (branchId) {
            packpageCompanyData.branchId = new mongoose.Types.ObjectId(branchId);
        }

        const nuevaRelacion = new InvoicesPackpageCompany(packpageCompanyData);
        const relacionGuardada = await nuevaRelacion.save();

        // Obtener la relación con datos poblados
        const relacionCompleta = await InvoicesPackpageCompany.findById(relacionGuardada._id)
            .populate(['packpageId', 'companyId', 'brandId', 'branchId']);

        res.status(201).json({
            success: true,
            message: 'Relación creada exitosamente.',
            data: relacionCompleta
        });

    } catch (error) {
        console.error('Error creating invoices packpage company relation:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor.'
        });
    }
};

// READ - Obtener relación por packpageId
export const getInvoicesPackpageCompanyByPackpageId = async (req, res) => {
    try {
        const { packpageId } = req.params;

        const relacion = await InvoicesPackpageCompany.findByPackpageId(packpageId);

        if (!relacion) {
            return res.status(404).json({
                success: false,
                message: 'Relación no encontrada.'
            });
        }

        res.status(200).json({
            success: true,
            data: relacion,
            message: 'Relación encontrada exitosamente.'
        });

    } catch (error) {
        console.error('Error getting invoices packpage company relation:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor.'
        });
    }
};

// UPDATE - Actualizar una relación existente
export const updateInvoicesPackpageCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const { companyId, brandId, branchId } = req.body;

        // Buscar la relación existente
        const relacionExistente = await InvoicesPackpageCompany.findById(id);
        if (!relacionExistente) {
            return res.status(404).json({
                success: false,
                message: 'Relación no encontrada.'
            });
        }

        // Actualizar la relación
        const datosActualizacion = {};
        if (companyId) datosActualizacion.companyId = new mongoose.Types.ObjectId(companyId);
        if (brandId !== undefined) datosActualizacion.brandId = brandId ? new mongoose.Types.ObjectId(brandId) : null;
        if (branchId !== undefined) datosActualizacion.branchId = branchId ? new mongoose.Types.ObjectId(branchId) : null;

        const relacionActualizada = await InvoicesPackpageCompany.findByIdAndUpdate(
            id,
            { $set: datosActualizacion },
            { new: true, runValidators: true }
        ).populate(['packpageId', 'companyId', 'brandId', 'branchId']);

        res.status(200).json({
            success: true,
            message: 'Relación actualizada exitosamente.',
            data: relacionActualizada
        });

    } catch (error) {
        console.error('Error updating invoices packpage company relation:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor.'
        });
    }
};

// DELETE - Eliminar una relación
export const deleteInvoicesPackpageCompany = async (req, res) => {
    try {
        const { id } = req.params;

        const relacion = await InvoicesPackpageCompany.findByIdAndDelete(id);
        if (!relacion) {
            return res.status(404).json({
                success: false,
                message: 'Relación no encontrada.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Relación eliminada exitosamente.'
        });

    } catch (error) {
        console.error('Error deleting invoices packpage company relation:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor.'
        });
    }
};

// GET - Obtener relaciones por companyId
export const getInvoicesPackpageCompanyByCompanyId = async (req, res) => {
    try {
        const { companyId } = req.params;

        const relaciones = await InvoicesPackpageCompany.findByCompanyId(companyId);

        res.status(200).json({
            success: true,
            data: relaciones
        });

    } catch (error) {
        console.error('Error getting invoices packpage company relations by company:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor.'
        });
    }
};

// GET - Obtener relaciones por brandId
export const getInvoicesPackpageCompanyByBrandId = async (req, res) => {
    try {
        const { brandId } = req.params;

        const relaciones = await InvoicesPackpageCompany.findByBrandId(brandId);

        res.status(200).json({
            success: true,
            data: relaciones
        });

    } catch (error) {
        console.error('Error getting invoices packpage company relations by brand:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor.'
        });
    }
};

// GET - Obtener relaciones por branchId
export const getInvoicesPackpageCompanyByBranchId = async (req, res) => {
    try {
        const { branchId } = req.params;

        const relaciones = await InvoicesPackpageCompany.findByBranchId(branchId);

        res.status(200).json({
            success: true,
            data: relaciones
        });

    } catch (error) {
        console.error('Error getting invoices packpage company relations by branch:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor.'
        });
    }
}; 