import express from "express";
import {
  closeSessionLog,
  getCompaniesSessionSummary,
  getCompanyBranchesSessionStats,
  getBranchUsersSessionDetails,
} from "../controllers/userSessionLogController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/companies-summary", getCompaniesSessionSummary);
router.get("/company/:companyId/branches-stats", getCompanyBranchesSessionStats);
router.get("/branch/:branchId/users-stats", getBranchUsersSessionDetails);
router.put("/close", closeSessionLog);

export default router;
