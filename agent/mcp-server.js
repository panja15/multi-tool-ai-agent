import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { logger } from "../utils/logger.js";
import { executeTask } from "../tools/tasks.js";
import { executeCalendar } from "../tools/calendar.js";

if (process.env.NODE_ENV !== "production") {
  await import("dotenv/config");
}

const requiredEnv = ["GOOGLE_CLOUD_PROJECT_ID"];

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing required env: ${key}`);
    process.exit(1);
  }
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception", {
    message: err.message,
    stack: err.stack,
  });
});

process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Rejection", {
    message: err?.message,
    stack: err?.stack,
  });
});

// Initialize MCP Server
const server = new McpServer({
  name: "productivity-tools",
  version: "1.0.0",
});

// Calendar Tool
server.tool(
  "schedule_meeting",
  "Schedules a meeting on the user's Google Calendar.",
  {
    summary: z.string().describe("Title of the meeting."),
    startTime: z.string().describe("Start time in UTC ISO 8601 format."),
    endTime: z.string().describe("End time in UTC ISO 8601 format."),
  },
  async (args) => {
    try {
      logger.info("Executing schedule_meeting", { args });

      const result = await executeCalendar(args);

      logger.info("schedule_meeting success", { result });

      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    } catch (error) {
      logger.error("schedule_meeting failed", {
        message: error.message,
        stack: error.stack,
      });

      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  },
);

// Task Tool
server.tool(
  "create_task",
  "Saves a task or reminder to the Firestore database.",
  {
    taskName: z.string().describe("The core action or task."),
    priority: z.string().describe("High, Medium, or Low"),
  },
  async (args) => {
    try {
      logger.info("Executing create_task", { args });

      const result = await executeTask(args);

      logger.info("create_task success", { result });

      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    } catch (error) {
      logger.error("create_task failed", {
        message: error.message,
        stack: error.stack,
      });

      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  },
);

// Start MCP Server
async function main() {
  try {
    const transport = new StdioServerTransport();

    logger.info("Starting MCP server...", {
      pid: process.pid,
      node: process.version,
    });

    await server.connect(transport);

    logger.info("✅ MCP connection established", {
      action: "mcp_connect",
    });
  } catch (error) {
    logger.error("MCP server failed to start", {
      message: error.message,
      stack: error.stack,
    });

    process.exit(1);
  }
}

main();
