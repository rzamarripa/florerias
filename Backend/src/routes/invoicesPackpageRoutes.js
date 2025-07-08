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
    getBudgetByCompanyBrandBranch
} from '../controllers/invoicesPackpageController.js';

const router = express.Router();

// Crear un nuevo paquete de facturas
router.post('/', createInvoicesPackage);

// Obtener todos los paquetes con paginación
router.get('/', getInvoicesPackages);

// Obtener paquetes de facturas por usuario (con filtrado de visibilidad)
router.get('/by-usuario', getInvoicesPackagesByUsuario);

// Obtener paquetes creados por el usuario (sin filtrado de visibilidad)
router.get('/created-by-usuario', getInvoicesPackagesCreatedByUsuario);

// Obtener presupuesto por compañía, marca, sucursal y mes
router.get('/budget', getBudgetByCompanyBrandBranch);

// Obtener un paquete específico por ID
router.get('/:id', getInvoicesPackageById);

// Actualizar un paquete de facturas
router.put('/:id', updateInvoicesPackage);

// Eliminar un paquete de facturas
router.delete('/:id', deleteInvoicesPackage);

// Obtener resumen de paquetes
router.get('/summary', getInvoicesPackagesSummary);

// Obtener paquetes vencidos
router.get('/vencidos', getVencidosInvoicesPackages);

// Cambiar estatus de un paquete
router.patch('/:id/status', changeInvoicesPackageStatus);

// Enviar paquete a dirección
router.post('/:id/enviar-direccion', enviarPaqueteADireccion);

export default router; 