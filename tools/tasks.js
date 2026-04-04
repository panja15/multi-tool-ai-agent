import { Firestore } from "@google-cloud/firestore";

export async function executeTask(args) {
  try {
    console.error("[Tool] Executing create_task...", process.env.GOOGLE_CLOUD_PROJECT_ID);
    const firestore = new Firestore({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      databaseId: process.env.GOOGLE_CLOUD_FIRESTORE_DATABASE,
    });

    const taskData = {
      ...args,
      createdAt: new Date().toLocaleString(),
      status: "pending",
    };

    console.error(taskData)

    const docRef = await firestore.collection("tasks").add(taskData);

    console.error(docRef)

    return {
      status: "Success",
      action: "Task saved to Database",
      documentId: docRef.id,
    };
  } catch (error) {
    console.error("[Database Error]", error);
    throw new Error("Failed to save to Firestore.");
  }
}
