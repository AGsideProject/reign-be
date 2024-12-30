const express = require("express");
const userController = require("../controllers/user.controller");
const authentication = require("../middleware/authentication");
const router = express.Router();
const routerModel = require("./model");
const routerAsset = require("./asset");
const errorHandler = require("../middleware/error-handler");

router.post("/v1/regiter", userController.signUp);
router.post("/v1/login", userController.signIn);
// router.use(authentication);
router.use("/v1/model", routerModel);
router.use("/v1/assets", routerAsset);
router.use(errorHandler);

module.exports = router;
