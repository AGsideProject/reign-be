const express = require("express");
const userController = require("../controllers/user.controller");
const authentication = require("../middleware/authentication");
const router = express.Router();
const routerModel = require("./model");
const routerAsset = require("./asset");
const routerBooking = require("./booking");
const errorHandler = require("../middleware/error-handler");

router.post("/v1/login", userController.signIn);
router.post("/v1/refresh-token", userController.refreshToken);
router.post("/v1/logout", userController.logout);
// Model
router.use("/v1/model", routerModel);
// Assets
router.use("/v1/assets", routerAsset);
// Booking
router.use("/v1/booking", routerBooking);
router.use(authentication);
router.get("/v1/users", userController.getAllUsers);
router.post("/v1/register", userController.signUp);
router.patch("/v1/update-user/:userId", userController.updateUser);
router.delete("/v1/delete-user/:userId", userController.deleteUser);

router.use(errorHandler);

module.exports = router;
