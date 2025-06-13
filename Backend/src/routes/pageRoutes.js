import express from "express";
import {
  activatePage,
  addModuleToPage,
  createPage,
  deletePage,
  getAllPages,
  getPageById,
  removeModuleFromPage,
  updatePage,
} from "../controllers/pageController.js";
import { authorize, protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(getAllPages)
  .post(authorize(["SuperAdmin", "Admin"]), createPage);

router
  .route("/:id")
  .get(getPageById)
  .put(authorize(["SuperAdmin", "Admin"]), updatePage)
  .delete(authorize(["SuperAdmin", "Admin"]), deletePage);

router.put("/:id/activate", authorize(["SuperAdmin", "Admin"]), activatePage);

router
  .route("/:id/modules")
  .post(authorize(["SuperAdmin", "Admin"]), addModuleToPage);

router.delete(
  "/:id/modules/:moduleId",
  authorize(["SuperAdmin", "Admin"]),
  removeModuleFromPage
);

export default router;
