import { Firestore } from "@google-cloud/firestore";

import { logger } from "../utils/logger.js";

export async function executeTask(args) {
  try {
    logger.info("Executing create_task", { task_data: args });
    const firestore = new Firestore({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      databaseId: process.env.GOOGLE_CLOUD_FIRESTORE_DATABASE,
    });

    const taskData = {
      ...args,
      createdAt: new Date().toLocaleString(),
      status: "pending",
    };

    const docRef = await firestore.collection("tasks").add(taskData);

    logger.info("Task successfully saved to Firestore", {
      documentId: docRef.id,
    });
    return {
      status: "Success",
      action: "Task saved to Database",
      documentId: docRef.id,
    };
  } catch (error) {
    logger.error("Failed to save task to Firestore", error);
    throw new Error("Failed to save to Firestore.");
  }
}
