const express = require("express");
const riderController = require("../controllers/riderController");
const validators = require("../middleware/validation");
const { authenticate, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/riders", authenticate, riderController.getRiders);
router.post("/riders", authenticate, authorizeRoles("admin"), validators.rider, riderController.postRider);

module.exports = router;
