import express from 'express';
import {
    createAuthorizationFolio,
    getAllAuthorizationFolios,
    getAuthorizationFolioById,
    updateAuthorizationFolio,
    deleteAuthorizationFolio,
    authorizeOrRejectFolio,
    redeemFolio,
    getAuthorizationFoliosByPackage,
    getPendingAuthorizationFolios,
    getAuthorizationFoliosWithUserInfo,
    authorizeFolio,
    rejectFolio
} from '../controllers/authorizationFolioController.js';

const router = express.Router();

// CRUD routes
router.post('/', createAuthorizationFolio);
router.get('/', getAllAuthorizationFolios);

// Get folios by package
router.get('/by-package/:packageId', getAuthorizationFoliosByPackage);

// Get pending folios
router.get('/pending', getPendingAuthorizationFolios);

// Get pending folios with user info
router.get('/pending-with-user-info', getAuthorizationFoliosWithUserInfo);

// CRUD routes with ID parameter (must be after specific routes)
router.get('/:id', getAuthorizationFolioById);
router.put('/:id', updateAuthorizationFolio);
router.delete('/:id', deleteAuthorizationFolio);

// Authorize or Reject folio (legacy)
router.post('/:id/authorize', authorizeOrRejectFolio);

// Authorize folio
router.put('/:id/authorize', authorizeFolio);

// Reject folio
router.put('/:id/reject', rejectFolio);

// Redeem (Canjear) folio
router.post('/:id/redeem', redeemFolio);

export default router; 