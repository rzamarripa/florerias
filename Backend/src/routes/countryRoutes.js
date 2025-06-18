import express from "express";
import {
  activeCountry,
  createCountry,
  deleteCountry,
  getAll,
  getAllCountries,
  getById,
  updateCountry,
} from "../controllers/countryController.js";

const router = express.Router();

router.get("/", getAllCountries);
router.get("/all", getAll);
router.get("/:id", getById);
router.post("/", createCountry);
router.put("/:id", updateCountry);
router.delete("/:id", deleteCountry);
router.put("/:id/active", activeCountry);

export default router;
