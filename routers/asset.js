const express = require("express");
const { AssetController, upload } = require("../controllers/asset.controller");
const router = express.Router();

router.post("/", upload.single("image_file"), AssetController.createAsset);
router.delete("/:id", AssetController.deleteAsset);
module.exports = router;
