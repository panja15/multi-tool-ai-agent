import express from "express";

import { logger } from "../utils/logger.js";
import { processPrompt } from "../agent/agent.js";

const router = express.Router();

router.post("/execute", async (req, res) => {
  try {
    if (!req.body.prompt)
      return res.status(400).json({ error: "Prompt required" });

    const response = await processPrompt(req.user, req.body.prompt);
    res.status(200).json(response);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
