import express from 'express';
import {
    createInvoicesPackpage,
    getInvoicesPackpages,
    getInvoicesPackpageById,
    updateInvoicesPackpage,
    deleteInvoicesPackpage,
    getInvoicesPackpagesSummary,
    getVencidosInvoicesPackpages,
    changeInvoicesPackpageStatus,
    getInvoicesPackpagesByUsuario
} from '../controllers/invoicesPackpageController.js';

const router = express.Router();

// Crear un nuevo paquete de facturas
router.post('/', createInvoicesPackpage);

// Obtener todos los paquetes con paginación
router.get('/', getInvoicesPackpages);

// Obtener paquetes de facturas por usuario
router.get('/by-usuario', getInvoicesPackpagesByUsuario);

// Obtener un paquete específico por ID
router.get('/:id', getInvoicesPackpageById);

// Actualizar un paquete de facturas
router.put('/:id', updateInvoicesPackpage);

// Eliminar un paquete de facturas
router.delete('/:id', deleteInvoicesPackpage);

// Obtener resumen de paquetes
router.get('/summary', getInvoicesPackpagesSummary);

// Obtener paquetes vencidos
router.get('/vencidos', getVencidosInvoicesPackpages);

// Cambiar estatus de un paquete
router.patch('/:id/status', changeInvoicesPackpageStatus);

export default router; 