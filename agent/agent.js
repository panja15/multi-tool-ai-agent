import { GoogleGenerativeAI } from "@google/generative-ai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

import { logger } from "../utils/logger.js";
import { getCurrentIST } from "../utils/date.js";

// Helper: Convert MCP tools → Gemini tools
function convertMcpToGeminiTools(mcpTools) {
  return mcpTools.map((tool) => {
    const properties = {};
    // Ensure 'userId' is never required by Gemini
    const required = (tool.inputSchema?.required || []).filter(
      (key) => key !== "userId",
    );

    for (const [key, value] of Object.entries(
      tool.inputSchema?.properties || {},
    )) {
      // Hide the userId parameter from the agent completely
      if (key === "userId") continue;

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

export async function processPrompt(userId, userPrompt) {
  let transport;
  const requestId = Math.random().toString(36).substring(7);
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  try {
    logger.info("Incoming request", { requestId, userPrompt });

    // MCP connection
    transport = new StdioClientTransport({
      command: process.execPath,
      args: ["./agent/mcp-server.js"],
      env: { ...process.env, IS_MCP_SERVER: "true" },
    });

    const mcpClient = new Client(
      { name: "orchestrator", version: "1.0" },
      { capabilities: {} },
    );

    logger.info("Connecting to MCP...", { requestId });

    await Promise.race([
      mcpClient.connect(transport),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("MCP connect timeout")), 5000),
      ),
    ]);

    logger.info("MCP connected", { requestId });

    const toolResponse = await mcpClient.listTools();
    const geminiTools = convertMcpToGeminiTools(toolResponse.tools);
    const currentTimeIST = getCurrentIST();

    // model
    const geminiModel = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
      systemInstruction: `
        You are a strict AI Orchestrator.

        Rules:
        - NEVER ask follow-up questions.
        - NEVER respond with conversational text if a tool can be used.
        - ALWAYS extract best possible parameters and call a tool.
        - If some fields are missing, infer reasonable defaults.
        - If a tool is relevant → MUST call it.
        - Only respond with plain text if NO tool is applicable.
        - If multiple actions are requested, call tools sequentially.

        Current time: ${currentTimeIST}
      `,
      tools: [{ functionDeclarations: geminiTools }],
    });

    const chat = geminiModel.startChat();

    let result = await chat.sendMessage(userPrompt);
    const accumulatedResults = [];
    let isDone = false;
    let loopCount = 0;

    // AGENTIC EXECUTION LOOP
    while (!isDone && loopCount < 5) {
      loopCount++;
      const functionCalls = result.response.functionCalls();

      if (functionCalls && functionCalls.length > 0) {
        const functionResponses = [];

        for (const call of functionCalls) {
          logger.info("Calling MCP tool", {
            requestId,
            tool: call.name,
            args: call.args,
          });

          const mcpResult = await Promise.race([
            mcpClient.callTool({
              name: call.name,
              arguments: { ...call.args, userId },
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("MCP tool timeout")), 10000),
            ),
          ]);

          logger.info("Tool executed successfully", {
            requestId,
            tool: call.name,
          });

          const parsedResult = JSON.parse(mcpResult.content[0].text);
          accumulatedResults.push({
            tool: call.name,
            extracted_data: call.args,
            result: parsedResult,
          });

          // Feed result back to Gemini so it can chain actions (like finding an ID, then updating it)
          functionResponses.push({
            functionResponse: {
              name: call.name,
              response: { result: parsedResult },
            },
          });
        }

        // Send all function results back to the model
        result = await chat.sendMessage(functionResponses);
      } else {
        isDone = true;
      }
    }

    if (accumulatedResults.length > 0) {
      return {
        status: "Tools Executed via MCP",
        executed_tools: accumulatedResults.length,
        results: accumulatedResults,
        final_agent_reply: result.response.text(),
      };
    }

    return { reply: result.response.text() };
  } catch (error) {
    logger.error("Orchestrator Error", {
      requestId,
      message: error.message,
      stack: error.stack,
    });

    return {
      error: "Execution failed",
      details: error.message,
    };
  } finally {
    if (transport) {
      try {
        await transport.close();
        logger.info("MCP connection closed", { requestId });
      } catch (e) {
        logger.error("Failed to close MCP transport", {
          requestId,
          error: e.message,
        });
      }
    }
  }
}
