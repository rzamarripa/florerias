import { InvoicesPackageCompany } from "../models/InvoicesPackpageCompany.js";
import mongoose from "mongoose";

// CREATE - Crear una nueva relación
export const createInvoicesPackageCompany = async (req, res) => {
    try {
        const { packageId, companyId, brandId, branchId } = req.body;

        // Validar datos requeridos
        if (!packageId || !companyId) {
            return res.status(400).json({
                success: false,
                message: 'packageId y companyId son requeridos.'
            });
        }

        // Verificar que no exista ya una relación para este paquete
        const existingRelation = await InvoicesPackageCompany.findOne({ packageId });
        if (existingRelation) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una relación para este paquete de facturas.'
            });
        }

        // Crear la relación
        const packageCompanyData = {
            packageId: new mongoose.Types.ObjectId(packageId),
            companyId: new mongoose.Types.ObjectId(companyId)
        };

        if (brandId) {
            packageCompanyData.brandId = new mongoose.Types.ObjectId(brandId);
        }

        if (branchId) {
            packageCompanyData.branchId = new mongoose.Types.ObjectId(branchId);
        }

        const nuevaRelacion = new InvoicesPackageCompany(packageCompanyData);
        const relacionGuardada = await nuevaRelacion.save();

        // Obtener la relación con datos poblados
        const relacionCompleta = await InvoicesPackageCompany.findById(relacionGuardada._id)
            .populate(['packageId', 'companyId', 'brandId', 'branchId']);

        res.status(201).json({
            success: true,
            message: 'Relación creada exitosamente.',
            data: relacionCompleta
        });

    } catch (error) {
        console.error('Error creating invoices package company relation:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor.'
        });
    }
};

// READ - Obtener relación por packageId
export const getInvoicesPackageCompanyByPackageId = async (req, res) => {
    try {
        const { packageId } = req.params;

        const relacion = await InvoicesPackageCompany.findByPackageId(packageId);

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
        console.error('Error getting invoices package company relation:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor.'
        });
    }
};

// UPDATE - Actualizar una relación existente
export const updateInvoicesPackageCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const { companyId, brandId, branchId } = req.body;

        // Buscar la relación existente
        const relacionExistente = await InvoicesPackageCompany.findById(id);
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

        const relacionActualizada = await InvoicesPackageCompany.findByIdAndUpdate(
            id,
            { $set: datosActualizacion },
            { new: true, runValidators: true }
        ).populate(['packageId', 'companyId', 'brandId', 'branchId']);

        res.status(200).json({
            success: true,
            message: 'Relación actualizada exitosamente.',
            data: relacionActualizada
        });

    } catch (error) {
        console.error('Error updating invoices package company relation:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor.'
        });
    }
};

// DELETE - Eliminar una relación
export const deleteInvoicesPackageCompany = async (req, res) => {
    try {
        const { id } = req.params;

        const relacion = await InvoicesPackageCompany.findByIdAndDelete(id);
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
        console.error('Error deleting invoices package company relation:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor.'
        });
    }
};

// GET - Obtener relaciones por companyId
export const getInvoicesPackageCompanyByCompanyId = async (req, res) => {
    try {
        const { companyId } = req.params;

        const relaciones = await InvoicesPackageCompany.findByCompanyId(companyId);

        res.status(200).json({
            success: true,
            data: relaciones
        });

    } catch (error) {
        console.error('Error getting invoices package company relations by company:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor.'
        });
    }
};

// GET - Obtener relaciones por brandId
export const getInvoicesPackageCompanyByBrandId = async (req, res) => {
    try {
        const { brandId } = req.params;

        const relaciones = await InvoicesPackageCompany.findByBrandId(brandId);

        res.status(200).json({
            success: true,
            data: relaciones
        });

    } catch (error) {
        console.error('Error getting invoices package company relations by brand:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor.'
        });
    }
};

// GET - Obtener relaciones por branchId
export const getInvoicesPackageCompanyByBranchId = async (req, res) => {
    try {
        const { branchId } = req.params;

        const relaciones = await InvoicesPackageCompany.findByBranchId(branchId);

        res.status(200).json({
            success: true,
            data: relaciones
        });

    } catch (error) {
        console.error('Error getting invoices package company relations by branch:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor.'
        });
    }
}; 