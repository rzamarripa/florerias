import express from 'express';
import {
    createInvoicesPackpageCompany,
    getInvoicesPackpageCompanyByPackpageId,
    updateInvoicesPackpageCompany,
    deleteInvoicesPackpageCompany,
    getInvoicesPackpageCompanyByCompanyId,
    getInvoicesPackpageCompanyByBrandId,
    getInvoicesPackpageCompanyByBranchId
} from '../controllers/invoicesPackpageCompanyController.js';

const router = express.Router();

// Crear una nueva relación
router.post('/', createInvoicesPackpageCompany);

// Obtener relación por packpageId
router.get('/packpage/:packpageId', getInvoicesPackpageCompanyByPackpageId);

// Obtener relaciones por companyId
router.get('/company/:companyId', getInvoicesPackpageCompanyByCompanyId);

// Obtener relaciones por brandId
router.get('/brand/:brandId', getInvoicesPackpageCompanyByBrandId);

// Obtener relaciones por branchId
router.get('/branch/:branchId', getInvoicesPackpageCompanyByBranchId);

// Actualizar una relación existente
router.put('/:id', updateInvoicesPackpageCompany);

// Eliminar una relación
router.delete('/:id', deleteInvoicesPackpageCompany);

export default router; 