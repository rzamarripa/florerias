import express from 'express';
import {
    createInvoicesPackage,
    getInvoicesPackages,
    getInvoicesPackageById,
    updateInvoicesPackage,
    deleteInvoicesPackage,
    getInvoicesPackagesSummary,
    getVencidosInvoicesPackages,
    changeInvoicesPackageStatus,
    getInvoicesPackagesByUsuario,
    getInvoicesPackagesCreatedByUsuario,
    enviarPaqueteADireccion,
    getBudgetByCompanyBrandBranch,
    getBudgetByCompanyForDashboard,
    getPaquetesEnviadosParaDashboard,
    generatePackageReport,
    requestFunding,
    getPackagesToFund,
    getPackageCompanyRelations,
    updatePackagesToGenerated,
    toggleInvoicesPackageActive,
    removeInvoiceFromPackage,
    removeCashPaymentFromPackage,
    markPackageAsPaid
} from '../controllers/invoicesPackpageController.js';
import packageTimelineController from '../controllers/packageTimelineController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Crear un nuevo paquete de facturas
router.post('/', protect, createInvoicesPackage);

// Obtener todos los paquetes con paginación
router.get('/', getInvoicesPackages);

// Obtener paquetes de facturas por usuario (con filtrado de visibilidad)
router.get('/by-usuario', getInvoicesPackagesByUsuario);

// Obtener paquetes creados por el usuario (sin filtrado de visibilidad)
router.get('/created-by-usuario', getInvoicesPackagesCreatedByUsuario);

// Obtener paquetes enviados para dashboard de pagos
router.get('/paquetes-enviados-dashboard', getPaquetesEnviadosParaDashboard);

// Obtener presupuesto por compañía, marca, sucursal y mes
router.get('/budget', getBudgetByCompanyBrandBranch);

// Obtener presupuesto por compañía y mes (específico para dashboard de pagos)
router.get('/budget-dashboard', getBudgetByCompanyForDashboard);

// Obtener relaciones paquete-sucursal/marca
router.get('/package-company-relations', getPackageCompanyRelations);

// Solicitar fondeo
router.post('/request-funding', protect, requestFunding);

// Obtener paquetes por fondear (preview)
router.get('/packages-to-fund', protect, getPackagesToFund);

// Obtener resumen de paquetes
router.get('/summary', getInvoicesPackagesSummary);

// Obtener paquetes vencidos
router.get('/vencidos', getVencidosInvoicesPackages);

// Obtener un paquete específico por ID
router.get('/:id', getInvoicesPackageById);

// Actualizar un paquete de facturas
router.put('/:id', updateInvoicesPackage);

// Eliminar un paquete de facturas
router.delete('/:id', deleteInvoicesPackage);

// Cambiar estatus de un paquete
router.patch('/:id/status', changeInvoicesPackageStatus);

// Cambiar estado activo de un paquete
router.patch('/:id/toggle-active', protect, toggleInvoicesPackageActive);

// Eliminar factura específica del arreglo embebido en el paquete
router.delete('/:packageId/invoices/:invoiceId', protect, removeInvoiceFromPackage);

// Eliminar pago en efectivo específico del arreglo embebido en el paquete
router.delete('/:packageId/cash-payments/:cashPaymentId', protect, removeCashPaymentFromPackage);

// Enviar paquete a dirección
router.post('/:id/enviar-direccion', protect, enviarPaqueteADireccion);

// Generar reporte (cambiar estatus a PorFondear)
router.post('/:id/generate-report', protect, generatePackageReport);

// Actualizar múltiples paquetes a estatus "Generado"
router.post('/update-to-generated', protect, updatePackagesToGenerated);

// Marcar paquete como pagado (de "Generado" a "Pagado")
router.post('/:id/mark-as-paid', protect, markPackageAsPaid);

// Rutas del timeline
router.post('/timeline', protect, packageTimelineController.createTimelineEntry);
router.get('/timeline/:packageId', protect, packageTimelineController.getPackageTimeline);
// DEBUG: Ruta para obtener todos los registros del timeline
router.get('/timeline-debug/all', protect, packageTimelineController.getAllTimelineEntries);

export default router; 