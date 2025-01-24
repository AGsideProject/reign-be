const express = require("express");
const { ModelController, upload } = require("../controllers/model.controller");
const authentication = require("../middleware/authentication");

const router = express.Router();

router.get("/", ModelController.getAllPublicModels);
router.get("/:slug", ModelController.getModelBySlug);
router.get("/post/get-code-post", ModelController.getAccessTokenPost);
router.get("/insta/:username", ModelController.getUserPost);
router.use(authentication);
router.post("/admin", upload.single("cover_img"), ModelController.createArtist);
router.get("/admin/list", ModelController.getAllModels);
router.put(
  "/admin/:id",
  upload.single("cover_img"),
  ModelController.updateArtist
);
router.delete("/admin/:id", ModelController.deleteModelById);
router.patch("/admin/:id/status", ModelController.updateArtistStatus);
module.exports = router;
