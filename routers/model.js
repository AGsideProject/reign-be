const express = require("express");
const {
  ModelController,
  upload,
  uploadv2,
} = require("../controllers/model.controller");
const authentication = require("../middleware/authentication");

const router = express.Router();

router.get("/", ModelController.getAllPublicModels);
router.get("/:slug", ModelController.getModelBySlug);
router.use(authentication);
router.post(
  "/admin",
  uploadv2.single("cover_img"),
  ModelController.createArtist
);
router.get("/admin/stat", ModelController.getStattisticAllTime);
router.get("/admin/list", ModelController.getAllModels);
router.post("/instgaram/synchronize", ModelController.getInstagramPost);
router.put(
  "/admin/:id",
  uploadv2.single("cover_img"),
  ModelController.updateArtist
);
router.delete("/admin/:id", ModelController.deleteModelById);
router.patch("/admin/:id/status", ModelController.updateArtistStatus);
router.get("/admin/list/lite", ModelController.getAllModelsPub);
module.exports = router;
