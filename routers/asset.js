const express = require("express");
const { AssetController, upload } = require("../controllers/asset.controller");
const authentication = require("../middleware/authentication");
const router = express.Router();

router.use(authentication);
router.post("/admin", upload.single("image_file"), AssetController.createAsset);
router.patch("/admin/bulk-order", AssetController.bulkUpdateAssetOrder);
router.get("/admin/:model_id", AssetController.listAssets);
router.delete("/admin/:id", AssetController.deleteAsset);
router.patch("/admin/:id/status", AssetController.updateAssetStatus);
router.patch("/admin/:id/order", AssetController.updateAssetOrder);
module.exports = router;
