const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const env = require("./config/env");
const { logger } = require("./config/logger");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: env.frontendUrl === "*" ? true : env.frontendUrl,
  },
});

app.locals.io = io;

io.on("connection", (socket) => {
  logger.info("Client connected", socket.id);

  socket.on("disconnect", () => {
    logger.info("Client disconnected", socket.id);
  });
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    logger.error(
      `Port ${env.port} is already in use. Stop the old backend process or set a different PORT in backend/.env.`
    );
    process.exit(1);
  }

  logger.error("Backend server failed to start", error);
  process.exit(1);
});

server.listen(env.port, () => {
  logger.info(`Smart Helmet backend running on port ${env.port}`);
});
