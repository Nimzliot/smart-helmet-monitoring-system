const express = require("express");
const cors = require("cors");
const helmetRoutes = require("./routes/helmetRoutes");
const riderRoutes = require("./routes/riderRoutes");
const authRoutes = require("./routes/authRoutes");
const systemRoutes = require("./routes/systemRoutes");
const { requestLogger } = require("./config/logger");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const env = require("./config/env");

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.frontendOrigins.includes("*") || env.frontendOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(requestLogger);

app.use("/api", authRoutes);
app.use("/api", systemRoutes);
app.use("/api", helmetRoutes);
app.use("/api", riderRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
