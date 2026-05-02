const express = require("express");
const systemController = require("../controllers/systemController");

const router = express.Router();

router.get("/system/health", systemController.getHealth);
router.get("/system/db-check", systemController.getDbCheck);

module.exports = router;
