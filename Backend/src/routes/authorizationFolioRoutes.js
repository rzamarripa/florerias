import express from 'express';
import {
    createAuthorizationFolio,
    getAllAuthorizationFolios,
    getAuthorizationFolioById,
    updateAuthorizationFolio,
    deleteAuthorizationFolio,
    authorizeOrRejectFolio,
    redeemFolio
} from '../controllers/authorizationFolioController.js';

const router = express.Router();

// CRUD routes
router.post('/', createAuthorizationFolio);
router.get('/', getAllAuthorizationFolios);
router.get('/:id', getAuthorizationFolioById);
router.put('/:id', updateAuthorizationFolio);
router.delete('/:id', deleteAuthorizationFolio);

// Authorize or Reject folio
router.post('/:id/authorize', authorizeOrRejectFolio);

// Redeem (Canjear) folio
router.post('/:id/redeem', redeemFolio);

export default router; 