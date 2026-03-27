const env = require("../config/env");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const db = require("../services/databaseService");
const { signToken } = require("../utils/token");

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = db.authenticateUser(email, password);

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = signToken(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    env.jwtSecret,
    env.jwtExpiresInHours
  );

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

module.exports = {
  login,
};
