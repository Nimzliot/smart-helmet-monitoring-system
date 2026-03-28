const env = require("../config/env");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const db = require("../services/databaseService");
const { signToken } = require("../utils/token");

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await db.authenticateUser(email, password);

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
    user: db.sanitizeUser(user),
  });
});

const me = asyncHandler(async (req, res) => {
  const user = await db.getUserById(req.user.sub);

  res.json({
    user: user || {
      id: req.user.sub,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

module.exports = {
  login,
  me,
};
