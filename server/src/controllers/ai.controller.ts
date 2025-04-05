import { Request, Response, NextFunction } from 'express';
import * as openaiService from '../services/openai.service';
import * as dateService from '../services/date.service';
import { firestore } from '../config/firebase';
import { TaskExtractionResult } from '../../../shared/services/openai.types';

/**
 * Extract tasks from provided text content
 */
export const extractTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, subject, language = 'he', emailId } = req.body;

    if (!content) {
      return res.status(400).json({ 
        success: false, 
        message: 'Content is required for task extraction' 
      });
    }

    const result = await openaiService.extractTaskFromEmail(content, subject, language);
    
    // If tasks were successfully extracted and there's an emailId, 
    // we can associate the tasks with the email in the database
    if (emailId && result.tasks && result.tasks.length > 0) {
      const userId = req.user?.uid;
      
      // Prepare batch operations for multiple tasks
      const batch = firestore.batch();
      const tasksCollection = firestore.collection('tasks');
      
      // Process each extracted task
      result.tasks.forEach(task => {
        const taskRef = tasksCollection.doc();
        batch.set(taskRef, {
          ...task,
          id: taskRef.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: userId,
          emailId: emailId,
          extracted: true,
          sourceType: 'email'
        });
      });
      
      // Commit the batch
      await batch.commit();
    }
    
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in extractTasks:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to extract tasks',
      error: error.message
    });
  }
};

/**
 * Extract tasks from email by ID
 */
export const extractTasksFromEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { emailId } = req.params;
    const userId = req.user?.uid;
    
    if (!emailId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email ID is required' 
      });
    }
    
    // Get the email from Firestore
    const emailDoc = await firestore.collection('emails').doc(emailId).get();
    
    if (!emailDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: 'Email not found' 
      });
    }
    
    const emailData = emailDoc.data();
    
    // Verify that the email belongs to the current user
    if (emailData.userId !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to access this email' 
      });
    }
    
    // Extract tasks from the email content
    const result = await openaiService.extractTaskFromEmail(
      emailData.body || emailData.textContent || '', 
      emailData.subject || '',
      emailData.language || 'he'
    );
    
    // Save the extracted tasks to Firestore
    if (result.tasks && result.tasks.length > 0) {
      const batch = firestore.batch();
      const tasksCollection = firestore.collection('tasks');
      
      result.tasks.forEach(task => {
        const taskRef = tasksCollection.doc();
        batch.set(taskRef, {
          ...task,
          id: taskRef.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: userId,
          emailId: emailId,
          extracted: true,
          sourceType: 'email'
        });
      });
      
      await batch.commit();
      
      // Update the email to mark it as processed
      await firestore.collection('emails').doc(emailId).update({
        processed: true,
        processingDate: new Date(),
        extractedTasks: result.tasks.length
      });
    }
    
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in extractTasksFromEmail:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to extract tasks from email',
      error: error.message
    });
  }
};

/**
 * Analyze priorities for a list of tasks
 */
export const analyzeTaskPriorities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { taskIds, language = 'he' } = req.body;
    const userId = req.user?.uid;
    
    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Task IDs array is required' 
      });
    }
    
    // Get tasks from Firestore
    const tasks = [];
    const taskDescriptions = [];
    
    for (const taskId of taskIds) {
      const taskDoc = await firestore.collection('tasks').doc(taskId).get();
      
      if (taskDoc.exists) {
        const taskData = taskDoc.data();
        
        // Check if the task belongs to the current user
        if (taskData.createdBy === userId || taskData.assignTo === userId) {
          tasks.push(taskData);
          // Create a description for AI analysis
          taskDescriptions.push(
            `Task: ${taskData.description || 'No description'}\n` +
            `Priority: ${taskData.priority || 'Not set'}\n` +
            `Deadline: ${taskData.deadline || 'None'}\n` +
            `Status: ${taskData.status || 'Not started'}`
          );
        }
      }
    }
    
    if (tasks.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No valid tasks found' 
      });
    }
    
    // Call the OpenAI service to analyze priorities
    const analysisResult = await openaiService.analyzeTaskPriority(taskDescriptions, language);
    
    // Match the analysis results with the task IDs
    const enhancedResults = analysisResult.priorities.map(priority => {
      const taskIndex = priority.taskIndex;
      if (taskIndex >= 0 && taskIndex < tasks.length) {
        return {
          ...priority,
          taskId: taskIds[taskIndex],
          taskDescription: tasks[taskIndex].description
        };
      }
      return priority;
    });
    
    return res.status(200).json({
      success: true,
      data: {
        ...analysisResult,
        priorities: enhancedResults
      }
    });
  } catch (error) {
    console.error('Error in analyzeTaskPriorities:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze task priorities',
      error: error.message
    });
  }
};

/**
 * Generate a follow-up email for a task
 */
export const generateFollowupEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { taskId, language = 'he' } = req.body;
    const userId = req.user?.uid;
    
    if (!taskId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Task ID is required' 
      });
    }
    
    // Get the task from Firestore
    const taskDoc = await firestore.collection('tasks').doc(taskId).get();
    
    if (!taskDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: 'Task not found' 
      });
    }
    
    const taskData = taskDoc.data();
    
    // Check if the task belongs to the current user
    if (taskData.createdBy !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to generate follow-up for this task' 
      });
    }
    
    // Calculate days overdue
    let daysOverdue = 0;
    if (taskData.deadline) {
      const deadlineDate = new Date(taskData.deadline);
      const currentDate = new Date();
      const timeDiff = currentDate.getTime() - deadlineDate.getTime();
      daysOverdue = Math.max(0, Math.floor(timeDiff / (1000 * 3600 * 24)));
    }
    
    // Get the assignee's name
    let recipientName = 'User';
    if (taskData.assignTo) {
      const userDoc = await firestore.collection('users').doc(taskData.assignTo).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        recipientName = userData.displayName || userData.email || 'User';
      }
    }
    
    // Generate the follow-up email
    const emailResult = await openaiService.generateFollowupEmail(
      taskData.description || 'Task',
      recipientName,
      daysOverdue,
      language
    );
    
    return res.status(200).json({
      success: true,
      data: emailResult
    });
  } catch (error) {
    console.error('Error in generateFollowupEmail:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate follow-up email',
      error: error.message
    });
  }
};

/**
 * Parse a date string with Hebrew support
 */
export const parseDate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { dateText, language = 'he' } = req.body;
    
    if (!dateText) {
      return res.status(400).json({ 
        success: false, 
        message: 'Date text is required' 
      });
    }
    
    const dateInfo = await dateService.parseDate(dateText, language);
    
    return res.status(200).json({
      success: true,
      data: dateInfo
    });
  } catch (error) {
    console.error('Error in parseDate:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to parse date',
      error: error.message
    });
  }
};

export default {
  extractTasks,
  extractTasksFromEmail,
  analyzeTaskPriorities,
  generateFollowupEmail,
  parseDate
}; 