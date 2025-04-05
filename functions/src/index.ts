import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as express from "express";
import * as cors from "cors";
import openaiService from "./services/openai.service";

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Express app
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Add Hebrew character encoding support
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

// Routes
app.get("/health", (req, res) => {
  res.status(200).send({ status: "ok", language: "he-IL" });
});

// Tasks routes
app.get("/tasks", async (req, res) => {
  try {
    const userId = req.query.userId as string;
    
    if (!userId) {
      return res.status(400).send({ error: "User ID is required" });
    }
    
    // Get user's tasks
    const tasksSnapshot = await admin.firestore()
      .collection("tasks")
      .where("assignedToUserId", "==", userId)
      .orderBy("dueDate", "asc")
      .get();
    
    const tasks = tasksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return res.status(200).send({ tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return res.status(500).send({ error: "Failed to fetch tasks" });
  }
});

// Email webhook endpoint for processing tagged emails
app.post("/email/webhook", async (req, res) => {
  try {
    const { content, subject, from, to, cc, messageId, date } = req.body;
    
    if (!content || !subject || !from) {
      return res.status(400).send({ error: "Missing required email data" });
    }
    
    // Extract assignee from recipient
    let assigneeEmail = "";
    if (Array.isArray(to) && to.length > 0) {
      assigneeEmail = to[0];
    }
    
    // Get language preference (default to Hebrew)
    const language = req.query.language as 'he' | 'en' || 'he';
    
    // Use OpenAI to extract task from email
    const extractionResult = await openaiService.extractTaskFromEmail(
      content,
      subject,
      language
    );
    
    if (!extractionResult.success || !extractionResult.task.containsTask) {
      return res.status(200).send({ 
        status: "processed", 
        containsTask: false,
        message: "Email does not contain a task" 
      });
    }
    
    // Find user by email
    const usersSnapshot = await admin.firestore()
      .collection("users")
      .where("email", "==", assigneeEmail)
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      return res.status(404).send({ error: "Assignee user not found" });
    }
    
    const assigneeUser = usersSnapshot.docs[0];
    
    // Find sender user
    const sendersSnapshot = await admin.firestore()
      .collection("users")
      .where("email", "==", from)
      .limit(1)
      .get();
    
    let senderUserId = "unknown";
    if (!sendersSnapshot.empty) {
      senderUserId = sendersSnapshot.docs[0].id;
    }
    
    // Create task
    const taskData = {
      title: extractionResult.task.title,
      description: extractionResult.task.description,
      status: "pending",
      priority: extractionResult.task.priority || "medium",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      dueDate: extractionResult.task.dueDate ? new Date(extractionResult.task.dueDate) : null,
      assignedToUserId: assigneeUser.id,
      assignedByUserId: senderUserId,
      emailSource: {
        messageId,
        subject,
        sender: from,
        receivedAt: date ? new Date(date) : admin.firestore.FieldValue.serverTimestamp(),
      },
      tags: extractionResult.task.tags || [],
      language,
      reminderSettings: {
        enabled: true,
        frequency: "weekly",
        nextReminderDate: null,
      }
    };
    
    // Save to Firestore
    const taskRef = await admin.firestore()
      .collection("tasks")
      .add(taskData);
    
    // Create notification for the user
    await admin.firestore()
      .collection("notifications")
      .add({
        userId: assigneeUser.id,
        title: "משימה חדשה התקבלה",
        message: `נוצרה משימה חדשה: ${extractionResult.task.title}`,
        read: false,
        type: "task",
        relatedId: taskRef.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    
    return res.status(201).send({ 
      status: "created", 
      taskId: taskRef.id,
      task: extractionResult.task 
    });
  } catch (error) {
    console.error("Error processing email webhook:", error);
    return res.status(500).send({ error: "Failed to process email" });
  }
});

// Export the Express app as a Firebase Cloud Function
export const api = functions.https.onRequest(app);

// Scheduled function to send reminders
export const sendTaskReminders = functions.pubsub.schedule("0 9 * * *")
  .timeZone("Asia/Jerusalem") // Set to Israel timezone
  .onRun(async (context) => {
    try {
      const now = admin.firestore.Timestamp.now();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      // Find tasks due tomorrow
      const tasksSnapshot = await admin.firestore()
        .collection("tasks")
        .where("status", "==", "pending")
        .where("dueDate", "<=", admin.firestore.Timestamp.fromDate(tomorrow))
        .get();
      
      // This will be expanded in the automated reminders phase
      console.log(`Found ${tasksSnapshot.size} tasks due soon for reminders`);
      
      return null;
    } catch (error) {
      console.error("Error sending reminders:", error);
      return null;
    }
  });

// Function to process incoming emails
export const processEmail = functions.https.onCall(async (data, context) => {
  try {
    // Ensure user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to process emails"
      );
    }
    
    const { content, subject, language = "he" } = data;
    
    if (!content || !subject) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Email content and subject are required"
      );
    }
    
    // Use OpenAI to extract task
    const extractionResult = await openaiService.extractTaskFromEmail(
      content,
      subject,
      language as 'he' | 'en'
    );
    
    return extractionResult;
  } catch (error) {
    console.error("Error in processEmail function:", error);
    throw new functions.https.HttpsError(
      "internal",
      "An error occurred while processing the email"
    );
  }
}); 