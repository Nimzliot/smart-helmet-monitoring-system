const express = require("express");
const systemController = require("../controllers/systemController");

const router = express.Router();

router.get("/system/health", systemController.getHealth);

module.exports = router;
