import { Request, Response, NextFunction } from 'express';
import { firestore } from '../firebase/admin';
import { createNotFoundError, createBadRequestError } from '../middleware/errorHandler';

// Collection reference
const tasksCollection = firestore.collection('tasks');

/**
 * Get all tasks for the current user
 */
export const getAllTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    const { status, priority, dueDate, sortBy, sortOrder, limit, offset } = req.query;
    
    // Build the query
    let query: any = tasksCollection.where('userId', '==', userId);
    
    // Apply filters if provided
    if (status) {
      query = query.where('status', '==', status);
    }
    
    if (priority) {
      query = query.where('priority', '==', priority);
    }
    
    if (dueDate) {
      // Convert to Date object if needed
      const due = new Date(dueDate as string);
      query = query.where('dueDate', '<=', due);
    }
    
    // Apply sorting
    if (sortBy) {
      query = query.orderBy(sortBy as string, (sortOrder as string)?.toLowerCase() === 'desc' ? 'desc' : 'asc');
    } else {
      // Default sorting by createdAt
      query = query.orderBy('createdAt', 'desc');
    }
    
    // Apply pagination
    if (limit) {
      query = query.limit(parseInt(limit as string));
    }
    
    if (offset) {
      query = query.offset(parseInt(offset as string));
    }
    
    // Execute query
    const snapshot = await query.get();
    
    // Format results
    const tasks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single task by ID
 */
export const getTaskById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = req.params.id;
    const userId = req.user?.uid;
    
    const taskDoc = await tasksCollection.doc(taskId).get();
    
    if (!taskDoc.exists) {
      return next(createNotFoundError('Task not found'));
    }
    
    const taskData = taskDoc.data();
    
    // Check if the task belongs to the current user
    if (taskData?.userId !== userId && !req.user?.role?.includes('admin')) {
      return next(createNotFoundError('Task not found'));
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: taskDoc.id,
        ...taskData
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new task
 */
export const createTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, dueDate, priority, status, emailId } = req.body;
    const userId = req.user?.uid;
    
    if (!title) {
      return next(createBadRequestError('Title is required'));
    }
    
    // Create the task object
    const task = {
      title,
      description: description || '',
      dueDate: dueDate ? new Date(dueDate) : null,
      priority: priority || 'medium',
      status: status || 'open',
      userId,
      emailId: emailId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      assignedTo: userId,
      completedAt: null
    };
    
    // Save to Firestore
    const docRef = await tasksCollection.add(task);
    
    res.status(201).json({
      success: true,
      data: {
        id: docRef.id,
        ...task
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a task
 */
export const updateTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = req.params.id;
    const userId = req.user?.uid;
    const updateData = req.body;
    
    // Check if the task exists
    const taskDoc = await tasksCollection.doc(taskId).get();
    
    if (!taskDoc.exists) {
      return next(createNotFoundError('Task not found'));
    }
    
    const taskData = taskDoc.data();
    
    // Check if the task belongs to the current user
    if (taskData?.userId !== userId && !req.user?.role?.includes('admin')) {
      return next(createNotFoundError('Task not found'));
    }
    
    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.userId;
    
    // Add updatedAt timestamp
    updateData.updatedAt = new Date();
    
    // Update the task
    await tasksCollection.doc(taskId).update(updateData);
    
    // Get the updated document
    const updatedTaskDoc = await tasksCollection.doc(taskId).get();
    
    res.status(200).json({
      success: true,
      data: {
        id: updatedTaskDoc.id,
        ...updatedTaskDoc.data()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a task
 */
export const deleteTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = req.params.id;
    const userId = req.user?.uid;
    
    // Check if the task exists
    const taskDoc = await tasksCollection.doc(taskId).get();
    
    if (!taskDoc.exists) {
      return next(createNotFoundError('Task not found'));
    }
    
    const taskData = taskDoc.data();
    
    // Check if the task belongs to the current user
    if (taskData?.userId !== userId && !req.user?.role?.includes('admin')) {
      return next(createNotFoundError('Task not found'));
    }
    
    // Delete the task
    await tasksCollection.doc(taskId).delete();
    
    res.status(200).json({
      success: true,
      data: null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get tasks by user ID (admin only)
 */
export const getTasksByUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targetUserId = req.params.userId;
    
    // Query tasks for the specified user
    const snapshot = await tasksCollection
      .where('userId', '==', targetUserId)
      .orderBy('createdAt', 'desc')
      .get();
    
    // Format results
    const tasks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create multiple tasks at once (admin only)
 */
export const createBulkTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tasks } = req.body;
    
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return next(createBadRequestError('Tasks array is required'));
    }
    
    // Create a batch write
    const batch = firestore.batch();
    
    // Process each task
    const taskRefs = tasks.map(task => {
      // Create a new document reference
      const docRef = tasksCollection.doc();
      
      // Add to batch
      batch.set(docRef, {
        ...task,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      return docRef;
    });
    
    // Commit the batch
    await batch.commit();
    
    res.status(201).json({
      success: true,
      count: tasks.length,
      message: `${tasks.length} tasks created successfully`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete multiple tasks at once (admin only)
 */
export const deleteBulkTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { taskIds } = req.body;
    
    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return next(createBadRequestError('Task IDs array is required'));
    }
    
    // Create a batch write
    const batch = firestore.batch();
    
    // Add each deletion to the batch
    taskIds.forEach(id => {
      const docRef = tasksCollection.doc(id);
      batch.delete(docRef);
    });
    
    // Commit the batch
    await batch.commit();
    
    res.status(200).json({
      success: true,
      count: taskIds.length,
      message: `${taskIds.length} tasks deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign a task to a user
 */
export const assignTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = req.params.id;
    const { assigneeId } = req.body;
    const userId = req.user?.uid;
    
    if (!assigneeId) {
      return next(createBadRequestError('Assignee ID is required'));
    }
    
    // Check if the task exists
    const taskDoc = await tasksCollection.doc(taskId).get();
    
    if (!taskDoc.exists) {
      return next(createNotFoundError('Task not found'));
    }
    
    const taskData = taskDoc.data();
    
    // Check if the task belongs to the current user
    if (taskData?.userId !== userId && !req.user?.role?.includes('admin')) {
      return next(createNotFoundError('Task not found'));
    }
    
    // Update the task
    await tasksCollection.doc(taskId).update({
      assignedTo: assigneeId,
      updatedAt: new Date()
    });
    
    // Get the updated document
    const updatedTaskDoc = await tasksCollection.doc(taskId).get();
    
    res.status(200).json({
      success: true,
      data: {
        id: updatedTaskDoc.id,
        ...updatedTaskDoc.data()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a task as complete
 */
export const completeTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = req.params.id;
    const userId = req.user?.uid;
    
    // Check if the task exists
    const taskDoc = await tasksCollection.doc(taskId).get();
    
    if (!taskDoc.exists) {
      return next(createNotFoundError('Task not found'));
    }
    
    const taskData = taskDoc.data();
    
    // Check if the user is assigned to the task or is the owner
    if (taskData?.assignedTo !== userId && taskData?.userId !== userId && !req.user?.role?.includes('admin')) {
      return next(createNotFoundError('Task not found'));
    }
    
    // Update the task
    await tasksCollection.doc(taskId).update({
      status: 'completed',
      completedAt: new Date(),
      updatedAt: new Date()
    });
    
    // Get the updated document
    const updatedTaskDoc = await tasksCollection.doc(taskId).get();
    
    res.status(200).json({
      success: true,
      data: {
        id: updatedTaskDoc.id,
        ...updatedTaskDoc.data()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reopen a completed task
 */
export const reopenTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = req.params.id;
    const userId = req.user?.uid;
    
    // Check if the task exists
    const taskDoc = await tasksCollection.doc(taskId).get();
    
    if (!taskDoc.exists) {
      return next(createNotFoundError('Task not found'));
    }
    
    const taskData = taskDoc.data();
    
    // Check if the user is the owner
    if (taskData?.userId !== userId && !req.user?.role?.includes('admin')) {
      return next(createNotFoundError('Task not found'));
    }
    
    // Update the task
    await tasksCollection.doc(taskId).update({
      status: 'open',
      completedAt: null,
      updatedAt: new Date()
    });
    
    // Get the updated document
    const updatedTaskDoc = await tasksCollection.doc(taskId).get();
    
    res.status(200).json({
      success: true,
      data: {
        id: updatedTaskDoc.id,
        ...updatedTaskDoc.data()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change task priority
 */
export const changeTaskPriority = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = req.params.id;
    const { priority } = req.body;
    const userId = req.user?.uid;
    
    if (!priority || !['low', 'medium', 'high', 'urgent'].includes(priority)) {
      return next(createBadRequestError('Valid priority is required (low, medium, high, urgent)'));
    }
    
    // Check if the task exists
    const taskDoc = await tasksCollection.doc(taskId).get();
    
    if (!taskDoc.exists) {
      return next(createNotFoundError('Task not found'));
    }
    
    const taskData = taskDoc.data();
    
    // Check if the user is the owner
    if (taskData?.userId !== userId && !req.user?.role?.includes('admin')) {
      return next(createNotFoundError('Task not found'));
    }
    
    // Update the task
    await tasksCollection.doc(taskId).update({
      priority,
      updatedAt: new Date()
    });
    
    // Get the updated document
    const updatedTaskDoc = await tasksCollection.doc(taskId).get();
    
    res.status(200).json({
      success: true,
      data: {
        id: updatedTaskDoc.id,
        ...updatedTaskDoc.data()
      }
    });
  } catch (error) {
    next(error);
  }
}; 