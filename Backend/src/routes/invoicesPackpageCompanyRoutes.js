import express from 'express';
import {
    createInvoicesPackageCompany,
    getInvoicesPackageCompanyByPackageId,
    updateInvoicesPackageCompany,
    deleteInvoicesPackageCompany,
    getInvoicesPackageCompanyByCompanyId,
    getInvoicesPackageCompanyByBrandId,
    getInvoicesPackageCompanyByBranchId
} from '../controllers/invoicesPackpageCompanyController.js';

const router = express.Router();

// Crear una nueva relación
router.post('/', createInvoicesPackageCompany);

// Obtener relación por packageId
router.get('/package/:packageId', getInvoicesPackageCompanyByPackageId);

// Obtener relaciones por companyId
router.get('/company/:companyId', getInvoicesPackageCompanyByCompanyId);

// Obtener relaciones por brandId
router.get('/brand/:brandId', getInvoicesPackageCompanyByBrandId);

// Obtener relaciones por branchId
router.get('/branch/:branchId', getInvoicesPackageCompanyByBranchId);

// Actualizar una relación existente
router.put('/:id', updateInvoicesPackageCompany);

// Eliminar una relación
router.delete('/:id', deleteInvoicesPackageCompany);

export default router; 