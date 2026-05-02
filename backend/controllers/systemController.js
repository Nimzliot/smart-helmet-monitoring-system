const asyncHandler = require("../utils/asyncHandler");
const db = require("../services/databaseService");
const { checkSupabaseConnection } = require("../config/supabase");

const getHealth = asyncHandler(async (_req, res) => {
  const health = await db.getSystemHealth();
  res.json(health);
});

const getDbCheck = asyncHandler(async (_req, res) => {
  const result = await checkSupabaseConnection();
  res.json(result);
});

module.exports = {
  getHealth,
  getDbCheck,
};
