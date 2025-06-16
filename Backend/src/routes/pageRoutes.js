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

const router = express.Router();


router
  .route("/")
  .get(getAllPages)
  .post(createPage);

router
  .route("/:id")
  .get(getPageById)
  .put( updatePage)
  .delete( deletePage);

router.put("/:id/activate", activatePage);

router
  .route("/:id/modules")
  .post( addModuleToPage);

router.delete(
  "/:id/modules/:moduleId",
  removeModuleFromPage
);

export default router;
