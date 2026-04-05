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

export async function fetchPendingTasks(args) {
  try {
    logger.info("Executing fetch_pending_tasks", { args });
    const firestore = new Firestore({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      databaseId: process.env.GOOGLE_CLOUD_FIRESTORE_DATABASE,
    });

    let query = firestore.collection("tasks").where("status", "==", "pending");
    if (args.userId) {
      query = query.where("userId", "==", args.userId);
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
      return { status: "Success", tasks: [] };
    }

    const tasks = [];
    snapshot.forEach((doc) => {
      tasks.push({ id: doc.id, ...doc.data() });
    });

    return { status: "Success", tasks };
  } catch (error) {
    logger.error("Failed to fetch pending tasks from Firestore", error);
    throw new Error("Failed to fetch from Firestore.");
  }
}

export async function updateTask(args) {
  try {
    logger.info("Executing update_task", { args });
    const firestore = new Firestore({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      databaseId: process.env.GOOGLE_CLOUD_FIRESTORE_DATABASE,
    });

    const { taskId, ...updateFields } = args;
    const docRef = firestore.collection("tasks").doc(taskId);

    await docRef.update(updateFields);

    return {
      status: "Success",
      action: "Task updated in Database",
      documentId: taskId,
      updatedFields: Object.keys(updateFields),
    };
  } catch (error) {
    logger.error("Failed to update task in Firestore", error);
    throw new Error("Failed to update Firestore document.");
  }
}
