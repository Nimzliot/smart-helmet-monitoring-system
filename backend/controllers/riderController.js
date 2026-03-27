const asyncHandler = require("../utils/asyncHandler");
const db = require("../services/databaseService");

const getRiders = asyncHandler(async (_req, res) => {
  const riders = await db.listRiders();
  res.json(riders);
});

const postRider = asyncHandler(async (req, res) => {
  const rider = await db.createRider(req.body);
  res.status(201).json(rider);
});

module.exports = {
  getRiders,
  postRider,
};
