import { GoogleGenerativeAI } from "@google/generative-ai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

import { logger } from "../utils/logger.js";

let mcpClient;
let geminiModel;

// Helper: Translates standard MCP JSON Schema into Gemini's specific tool format
function convertMcpToGeminiTools(mcpTools) {
  return mcpTools.map((tool) => {
    const properties = {};
    const required = tool.inputSchema?.required || [];

    for (const [key, value] of Object.entries(
      tool.inputSchema?.properties || {},
    )) {
      properties[key] = {
        type: (value.type || "string").toUpperCase(),
        description: value.description || "",
      };
    }
    return {
      name: tool.name,
      description: tool.description,
      parameters: { type: "OBJECT", properties, required },
    };
  });
}

// Boot up the MCP connection and configure Gemini
export async function initOrchestrator() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["./agent/mcp-server.js"],
    env: { ...process.env, IS_MCP_SERVER: "true" },
  });
  mcpClient = new Client(
    { name: "orchestrator", version: "1.0" },
    { capabilities: {} },
  );

  await mcpClient.connect(transport);
  logger.info("✅ Orchestrator successfully connected to local MCP Server", {
    action: "mcp_connect",
  });

  // Ask the server what tools it has
  const toolResponse = await mcpClient.listTools();
  const geminiTools = convertMcpToGeminiTools(toolResponse.tools);

  // Initialize the AI with the dynamically loaded tools
  geminiModel = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL,
    systemInstruction: `
      You are a strict AI Orchestrator.

      Rules:
      - NEVER ask follow-up questions.
      - NEVER respond with conversational text if a tool can be used.
      - ALWAYS extract best possible parameters and call a tool.
      - If some fields are missing, infer reasonable defaults.
      - If a tool is relevant → MUST call it.
      - Only respond with plain text if NO tool is applicable.

      Current time: ${new Date().toLocaleString()}
    `,
    tools: [{ functionDeclarations: geminiTools }],
  });
}

// Handle the user prompt
export async function processPrompt(userPrompt) {
  const chat = geminiModel.startChat();

  const result = await chat.sendMessage(userPrompt);
  const functionCalls = result.response.functionCalls();

  if (functionCalls && functionCalls.length > 0) {
    const call = functionCalls[0];
    logger.info(`Routing task to MCP tool`, {
      tool_name: call.name,
      args: call.args,
    });

    const mcpResult = await mcpClient.callTool({
      name: call.name,
      arguments: call.args,
    });

    return {
      status: "Tool Executed via MCP",
      agent_routed: call.name,
      extracted_data: call.args,
      result: JSON.parse(mcpResult.content[0].text),
    };
  }

  return { reply: result.response.text() };
}
