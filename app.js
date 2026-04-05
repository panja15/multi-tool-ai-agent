import helmet from "helmet";
import express from "express";
import rateLimit from "express-rate-limit";

import apiRoutes from "./routes/api.js";
// import { initOrchestrator } from "./agent/agent.js";
import { logger } from "./utils/logger.js";

if (process.env.NODE_ENV !== "production") {
  await import("dotenv/config");
}

const app = express();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    error: "Too many requests, please try again later.",
  },
});

app.use(express.json());
app.use(helmet());
app.set("trust proxy", 1);

app.use((req, res, next) => {
  req.user = process.env.USER_ID;
  next();
});
app.use("/api", limiter);
app.use("/api", apiRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, async () => {
  // await initOrchestrator();
  logger.info(`🚀 API Server running`, {
    port: PORT,
    environment: process.env.NODE_ENV,
  });
});
