const asyncHandler = require("../utils/asyncHandler");
const db = require("../services/databaseService");

const getHealth = asyncHandler(async (_req, res) => {
  const health = await db.getSystemHealth();
  res.json(health);
});

module.exports = {
  getHealth,
};
