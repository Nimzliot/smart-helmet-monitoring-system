const express = require("express");
const helmetController = require("../controllers/helmetController");
const validators = require("../middleware/validation");
const { authenticate, authenticateDevice, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/helmet-data", authenticateDevice, validators.helmetData, helmetController.postHelmetData);
router.get("/status", helmetController.getStatus);
router.get("/history", helmetController.getHistory);
router.get("/alerts", helmetController.getAlerts);

router.get("/helmets", authenticate, helmetController.getHelmets);
router.post("/helmets", authenticate, authorizeRoles("admin"), validators.helmet, helmetController.postHelmet);

module.exports = router;
