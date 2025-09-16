import express from "express";

import {
  bulkUpsertBlackListProviders,
  getBlackListProviders,
  getBlackListProvidersSummary,
  getBlackListProviderById,
  checkProviderInBlackList
} from '../controllers/blackListProvidersController.js';

import { protect } from '../middleware/auth.js';

const router = express.Router();

// router.use(protect);

router.post('/bulk-upsert', bulkUpsertBlackListProviders);

router.get('/', getBlackListProviders);

router.get('/summary', getBlackListProvidersSummary);

router.get('/check/:rfc', checkProviderInBlackList);

router.get('/:id', getBlackListProviderById);

export default router;