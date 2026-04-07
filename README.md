# 🚀 MCP AI Orchestrator

An intelligent AI-powered backend system that uses the Model Context Protocol (MCP) to dynamically orchestrate tools like Calendar scheduling and Task management. 

---

## 🧠 Overview

This project demonstrates a modular AI agent architecture where a Gemini-powered orchestrator dynamically discovers and invokes tools via an MCP server.

The system interprets natural language prompts and executes real-world actions such as:

- 📅 Scheduling meetings via Google Calendar
- ✅ Creating tasks in Firestore

---

## ⚙️ Tech Stack

- Node.js (Express)
- Google Gemini API
- MCP (Model Context Protocol)
- Google Cloud Firestore
- Google Calendar API

---

## 🔥 Features

- 🧠 AI-driven tool orchestration
- 🔌 Dynamic tool discovery via MCP
- 🛠️ Modular tool architecture
- 🔒 Rate limiting & basic security
- ⚡ Real-time API execution

---

## 🧪 How to Test the API

This MVP is API-first. You can test the AI orchestrator using Postman or curl by sending a natural language prompt to the  `/api/execute endpoint`.

Endpoint: ### https://mcp-orchestrator-608793880270.asia-south1.run.app/api/execute
Method: **POST**
Content-Type: application/json
Request Body: 
  ```json
  { prompt: "" }
  ```
Response Object: 
  ```json
  {
    "status": "Tools Executed via MCP",
    "executed_tools": 3,
    "results": [],
    "final_agent_reply": "" //Summary of task execution
  }
  ```

##🧪 Test curl

```
  curl -X POST https://mcp-orchestrator-608793880270.asia-south1.run.app/api/execute \
    -H "Content-Type: application/json" \
    -d '{
      "prompt": "Create a high priority task to update resume"
    }'
```

Author: Tushar Panja
