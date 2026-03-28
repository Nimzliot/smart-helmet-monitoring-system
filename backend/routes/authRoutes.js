const express = require("express");
const authController = require("../controllers/authController");
const validators = require("../middleware/validation");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/auth/login", validators.login, authController.login);
router.get("/auth/me", authenticate, authController.me);

module.exports = router;
