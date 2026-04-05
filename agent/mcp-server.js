import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { logger } from "../utils/logger.js";
import { executeTask } from "../tools/tasks.js";
import { executeCalendar } from "../tools/calendar.js";

if (process.env.NODE_ENV !== "production") {
  await import("dotenv/config");
}

// Initialize MCP Server
const server = new McpServer({
  name: "productivity-tools",
  version: "1.0.0",
});

// Register Calendar Tool
server.tool(
  "schedule_meeting",
  "Schedules a meeting on the user's Google Calendar.",
  {
    summary: z.string().describe("Title of the meeting."),
    startTime: z.string().describe("Start time in UTC ISO 8601 format."),
    endTime: z.string().describe("End time in UTC ISO 8601 format."),
    // attendees: z.string().optional().describe("Comma-separated list of attendee emails.")
  },
  async (args) => {
    try {
      const result = await executeCalendar(args);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  },
);

// Register Task Tool
server.tool(
  "create_task",
  "Saves a task or reminder to the Firestore database.",
  {
    taskName: z.string().describe("The core action or task."),
    priority: z.string().describe("High, Medium, or Low"),
  },
  async (args) => {
    try {
      const result = await executeTask(args);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("✅ MCP connection established", { action: "mcp_connect" });
}

main().catch((error) => {
  logger.error("MCP connection failed", error);
});
