const express = require("express");
const authController = require("../controllers/authController");
const validators = require("../middleware/validation");

const router = express.Router();

router.post("/auth/login", validators.login, authController.login);

module.exports = router;
