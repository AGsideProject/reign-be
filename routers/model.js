const express = require("express");
const { ModelController, upload } = require("../controllers/model.controller");
const router = express.Router();

router.get("/", ModelController.getAllModels);
router.post("/", upload.single("cover_img"), ModelController.createArtist);
router.put("/:id", upload.single("cover_img"), ModelController.updateArtist);
router.delete("/:id", ModelController.deleteModelById);
router.get("/:slug", ModelController.getModelBySlug);
module.exports = router;
