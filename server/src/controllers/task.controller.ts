import { Request, Response, NextFunction } from 'express';
import { firestore } from '../config/firebase';
import { Task, TaskFilter, TaskSort, TaskPagination, TaskStatus } from '../../../shared/models/task.model';
import * as dateService from '../services/date.service';

/**
 * Get all tasks with filtering, sorting, and pagination
 */
export const getAllTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Parse query parameters
    const filter: TaskFilter = {};
    const sort: TaskSort = { field: 'createdAt', direction: 'desc' };
    const pagination: TaskPagination = { page: 1, limit: 20 };
    
    // Status filter
    if (req.query.status) {
      filter.status = (req.query.status as string).split(',') as TaskStatus[];
    }
    
    // Priority filter
    if (req.query.priority) {
      filter.priority = (req.query.priority as string).split(',') as any;
    }
    
    // Assignment filter
    if (req.query.assignTo) {
      filter.assignTo = (req.query.assignTo as string).split(',');
    }
    
    // Date filters
    if (req.query.dueBefore) {
      filter.dueBefore = req.query.dueBefore as string;
    }
    
    if (req.query.dueAfter) {
      filter.dueAfter = req.query.dueAfter as string;
    }
    
    // Team filter
    if (req.query.teamId) {
      filter.teamId = req.query.teamId as string;
    }
    
    // Search filter
    if (req.query.search) {
      filter.search = req.query.search as string;
    }
    
    // Overdue filter
    if (req.query.isOverdue === 'true') {
      filter.isOverdue = true;
    }
    
    // Completed filter
    if (req.query.isCompleted === 'true') {
      filter.isCompleted = true;
    }
    
    // Sorting
    if (req.query.sortField) {
      sort.field = req.query.sortField as any;
    }
    
    if (req.query.sortDirection) {
      sort.direction = req.query.sortDirection as 'asc' | 'desc';
    }
    
    // Pagination
    if (req.query.page) {
      pagination.page = parseInt(req.query.page as string, 10);
    }
    
    if (req.query.limit) {
      pagination.limit = parseInt(req.query.limit as string, 10);
    }
    
    // Build the Firestore query
    let query = firestore.collection('tasks')
      .where('createdBy', '==', userId);
    
    // Apply status filter
    if (filter.status && filter.status.length > 0) {
      query = query.where('status', 'in', filter.status);
    }
    
    // Apply priority filter
    if (filter.priority && filter.priority.length > 0) {
      query = query.where('priority', 'in', filter.priority);
    }
    
    // Apply assignment filter
    if (filter.assignTo && filter.assignTo.length > 0) {
      query = query.where('assignTo', 'in', filter.assignTo);
    }
    
    // Apply team filter
    if (filter.teamId) {
      query = query.where('teamId', '==', filter.teamId);
    }
    
    // Apply due date filters (need to do this client-side)
    
    // Apply sorting
    query = query.orderBy(sort.field, sort.direction);
    
    // Apply pagination
    const startAt = (pagination.page - 1) * pagination.limit;
    query = query.limit(pagination.limit);
    
    if (startAt > 0) {
      // Get the document at the startAt position
      const snapshot = await firestore.collection('tasks')
        .where('createdBy', '==', userId)
        .orderBy(sort.field, sort.direction)
        .limit(startAt)
        .get();
      
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      
      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }
    }
    
    // Execute the query
    const tasksSnapshot = await query.get();
    
    // Count total (for pagination)
    // This is not efficient for large collections, but is simplest for now
    const countSnapshot = await firestore.collection('tasks')
      .where('createdBy', '==', userId)
      .get();
    
    const total = countSnapshot.size;
    
    // Transform the results
    const tasks: Task[] = [];
    
    tasksSnapshot.forEach(doc => {
      const taskData = doc.data() as Task;
      
      // Apply client-side filtering for date ranges if needed
      const includeTask = 
        (!filter.dueBefore || !taskData.deadline || taskData.deadline <= filter.dueBefore) &&
        (!filter.dueAfter || !taskData.deadline || taskData.deadline >= filter.dueAfter) &&
        (!filter.isOverdue || (taskData.deadline && new Date(taskData.deadline) < new Date() && taskData.status !== 'completed')) &&
        (!filter.isCompleted || taskData.status === 'completed') &&
        (!filter.search || taskData.description.toLowerCase().includes(filter.search.toLowerCase()) || 
           (taskData.notes && taskData.notes.toLowerCase().includes(filter.search.toLowerCase())));
      
      if (includeTask) {
        tasks.push({
          ...taskData,
          id: doc.id
        });
      }
    });
    
    return res.status(200).json({
      success: true,
      data: {
        tasks,
        total,
        page: pagination.page,
        limit: pagination.limit,
        hasMore: total > pagination.page * pagination.limit
      }
    });
  } catch (error) {
    console.error('Error in getAllTasks:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve tasks',
      error: error.message
    });
  }
};

/**
 * Get task by ID
 */
export const getTaskById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { taskId } = req.params;
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
    
    const taskData = taskDoc.data() as Task;
    
    // Check if the user has access to the task
    if (taskData.createdBy !== userId && taskData.assignTo !== userId && 
        !(taskData.teamId && req.user?.teams?.includes(taskData.teamId))) {
      
      // Check if user is admin - they can access any task
      const isAdmin = req.user?.role === 'admin';
      
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this task'
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      data: {
        ...taskData,
        id: taskDoc.id
      }
    });
  } catch (error) {
    console.error('Error in getTaskById:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve task',
      error: error.message
    });
  }
};

/**
 * Create a new task
 */
export const createTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { description, priority, deadline, assignTo, notes, status, 
            tags, dueTime, language, teamId, isPublic, reminderSet, 
            reminderDate, parentTaskId } = req.body;
    
    const userId = req.user?.uid;
    
    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Description is required'
      });
    }
    
    // Validate assignTo if provided
    if (assignTo) {
      const userDoc = await firestore.collection('users').doc(assignTo).get();
      
      if (!userDoc.exists) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user does not exist'
        });
      }
    }
    
    // Validate teamId if provided
    if (teamId) {
      const teamDoc = await firestore.collection('teams').doc(teamId).get();
      
      if (!teamDoc.exists) {
        return res.status(400).json({
          success: false,
          message: 'Team does not exist'
        });
      }
      
      // Check if user is a member of the team
      const teamData = teamDoc.data();
      const isMember = teamData.members && teamData.members.some(
        (member: any) => member.userId === userId
      );
      
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this team'
        });
      }
    }
    
    // Validate parentTaskId if provided
    if (parentTaskId) {
      const parentTaskDoc = await firestore.collection('tasks').doc(parentTaskId).get();
      
      if (!parentTaskDoc.exists) {
        return res.status(400).json({
          success: false,
          message: 'Parent task does not exist'
        });
      }
      
      // Check if user has access to the parent task
      const parentTaskData = parentTaskDoc.data();
      
      if (parentTaskData.createdBy !== userId && 
          !(parentTaskData.teamId && parentTaskData.teamId === teamId)) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to create a subtask for this task'
        });
      }
    }
    
    // Handle deadline parsing if it's a text expression
    let parsedDeadline = deadline;
    let parsedDateInfo = null;
    
    if (deadline && typeof deadline === 'string' && dateService.containsDate(deadline)) {
      try {
        const dateInfo = await dateService.parseDate(deadline, language || 'he');
        parsedDeadline = dateInfo.gregorianDate;
        parsedDateInfo = dateInfo;
      } catch (error) {
        console.error('Error parsing deadline:', error);
        // Keep the original deadline if parsing fails
      }
    }
    
    // Create the task
    const taskData: Omit<Task, 'id'> = {
      description,
      priority: priority || 'medium',
      status: status || 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId,
      extracted: false,
      sourceType: 'manual',
      language: language || 'he'
    };
    
    // Add optional fields
    if (parsedDeadline) {
      taskData.deadline = parsedDeadline;
    }
    
    if (parsedDateInfo) {
      taskData.parsedDateInfo = parsedDateInfo;
    }
    
    if (assignTo) {
      taskData.assignTo = assignTo;
    }
    
    if (notes) {
      taskData.notes = notes;
    }
    
    if (tags && Array.isArray(tags)) {
      taskData.tags = tags;
    }
    
    if (dueTime) {
      taskData.dueTime = dueTime;
    }
    
    if (reminderSet) {
      taskData.reminderSet = reminderSet;
      
      if (reminderDate) {
        taskData.reminderDate = reminderDate;
      }
    }
    
    if (teamId) {
      taskData.teamId = teamId;
      taskData.isPublic = isPublic !== undefined ? isPublic : true;
    }
    
    if (parentTaskId) {
      taskData.parentTaskId = parentTaskId;
    }
    
    // Save to Firestore
    const taskRef = await firestore.collection('tasks').add(taskData);
    
    // If this is a team task, add activity entry
    if (teamId) {
      const activityData = {
        type: 'task_created',
        taskId: taskRef.id,
        teamId: teamId,
        performedBy: userId,
        timestamp: new Date().toISOString(),
        details: {
          taskDescription: description,
          assignTo: assignTo
        }
      };
      
      await firestore.collection('teamActivities').add(activityData);
    }
    
    return res.status(201).json({
      success: true,
      data: {
        id: taskRef.id,
        ...taskData
      }
    });
  } catch (error) {
    console.error('Error in createTask:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create task',
      error: error.message
    });
  }
};

/**
 * Update an existing task
 */
export const updateTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.uid;
    const updates = req.body;
    
    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: 'Task ID is required'
      });
    }
    
    // Get the existing task
    const taskDoc = await firestore.collection('tasks').doc(taskId).get();
    
    if (!taskDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    const taskData = taskDoc.data() as Task;
    
    // Check if the user can update this task
    const canUpdate = 
      taskData.createdBy === userId || 
      taskData.assignTo === userId || 
      (taskData.teamId && req.user?.teams?.includes(taskData.teamId)) ||
      req.user?.role === 'admin';
    
    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this task'
      });
    }
    
    // Handle deadline parsing if it's a text expression
    if (updates.deadline && typeof updates.deadline === 'string' && 
        dateService.containsDate(updates.deadline) && 
        updates.deadline !== taskData.deadline) {
      try {
        const dateInfo = await dateService.parseDate(
          updates.deadline, 
          updates.language || taskData.language || 'he'
        );
        updates.deadline = dateInfo.gregorianDate;
        updates.parsedDateInfo = dateInfo;
      } catch (error) {
        console.error('Error parsing deadline:', error);
        // Keep the original deadline if parsing fails
      }
    }
    
    // Track changes for history
    const changes: any[] = [];
    const validUpdateFields = [
      'description', 'priority', 'deadline', 'assignTo', 'notes', 
      'status', 'tags', 'dueTime', 'language', 'teamId', 'isPublic', 
      'reminderSet', 'reminderDate', 'parsedDateInfo'
    ];
    
    // Filter out invalid update fields
    const filteredUpdates: any = {};
    validUpdateFields.forEach(field => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
        
        // Track changes for history
        if (JSON.stringify(taskData[field]) !== JSON.stringify(updates[field])) {
          changes.push({
            field,
            oldValue: taskData[field],
            newValue: updates[field]
          });
        }
      }
    });
    
    // Add updated timestamp
    filteredUpdates.updatedAt = new Date().toISOString();
    
    // Set completedAt and completedBy if task is being marked as completed
    if (filteredUpdates.status === 'completed' && taskData.status !== 'completed') {
      filteredUpdates.completedAt = new Date().toISOString();
      filteredUpdates.completedBy = userId;
    } else if (filteredUpdates.status && filteredUpdates.status !== 'completed' && taskData.status === 'completed') {
      // If task is being un-completed, remove these fields
      filteredUpdates.completedAt = null;
      filteredUpdates.completedBy = null;
    }
    
    // Update the task
    await firestore.collection('tasks').doc(taskId).update(filteredUpdates);
    
    // Record task history if there are changes
    if (changes.length > 0) {
      const historyPromises = changes.map(change => {
        const historyEntry = {
          taskId,
          field: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue,
          changedAt: new Date().toISOString(),
          changedBy: userId
        };
        
        return firestore.collection('taskHistory').add(historyEntry);
      });
      
      await Promise.all(historyPromises);
    }
    
    // If this is a team task, add activity entry for significant changes
    if (taskData.teamId) {
      let activityType = null;
      let activityDetails = {};
      
      if (filteredUpdates.status === 'completed' && taskData.status !== 'completed') {
        activityType = 'task_completed';
        activityDetails = { completedBy: userId };
      } else if (filteredUpdates.assignTo && filteredUpdates.assignTo !== taskData.assignTo) {
        activityType = 'task_reassigned';
        activityDetails = { 
          previousAssignee: taskData.assignTo,
          newAssignee: filteredUpdates.assignTo
        };
      } else if (changes.length > 0) {
        activityType = 'task_updated';
        activityDetails = { updatedFields: changes.map(c => c.field) };
      }
      
      if (activityType) {
        const activityData = {
          type: activityType,
          taskId,
          teamId: taskData.teamId,
          performedBy: userId,
          timestamp: new Date().toISOString(),
          details: {
            taskDescription: taskData.description,
            ...activityDetails
          }
        };
        
        await firestore.collection('teamActivities').add(activityData);
      }
    }
    
    return res.status(200).json({
      success: true,
      data: {
        id: taskId,
        ...taskData,
        ...filteredUpdates
      }
    });
  } catch (error) {
    console.error('Error in updateTask:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update task',
      error: error.message
    });
  }
};

/**
 * Delete a task
 */
export const deleteTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.uid;
    
    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: 'Task ID is required'
      });
    }
    
    // Get the existing task
    const taskDoc = await firestore.collection('tasks').doc(taskId).get();
    
    if (!taskDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    const taskData = taskDoc.data() as Task;
    
    // Check if the user has permission to delete this task
    // Only the creator or an admin can delete tasks
    const canDelete = 
      taskData.createdBy === userId || 
      req.user?.role === 'admin';
    
    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this task'
      });
    }
    
    // Delete the task
    await firestore.collection('tasks').doc(taskId).delete();
    
    // Delete associated data (history, comments, etc.)
    const batch = firestore.batch();
    
    // Delete task history
    const historySnapshot = await firestore
      .collection('taskHistory')
      .where('taskId', '==', taskId)
      .get();
    
    historySnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete task comments
    const commentsSnapshot = await firestore
      .collection('taskComments')
      .where('taskId', '==', taskId)
      .get();
    
    commentsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Commit the batch delete
    await batch.commit();
    
    // If this was a team task, add activity entry
    if (taskData.teamId) {
      const activityData = {
        type: 'task_deleted',
        taskId,
        teamId: taskData.teamId,
        performedBy: userId,
        timestamp: new Date().toISOString(),
        details: {
          taskDescription: taskData.description
        }
      };
      
      await firestore.collection('teamActivities').add(activityData);
    }
    
    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteTask:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete task',
      error: error.message
    });
  }
};

/**
 * Assign a task to a user
 */
export const assignTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { taskId } = req.params;
    const { assignToUserId } = req.body;
    const userId = req.user?.uid;
    
    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: 'Task ID is required'
      });
    }
    
    if (!assignToUserId) {
      return res.status(400).json({
        success: false,
        message: 'assignToUserId is required'
      });
    }
    
    // Get the existing task
    const taskDoc = await firestore.collection('tasks').doc(taskId).get();
    
    if (!taskDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    const taskData = taskDoc.data() as Task;
    
    // Check if the user has permission to assign this task
    const canAssign = 
      taskData.createdBy === userId || 
      (taskData.teamId && req.user?.teams?.includes(taskData.teamId)) ||
      req.user?.role === 'admin';
    
    if (!canAssign) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to assign this task'
      });
    }
    
    // Validate that assignToUserId exists
    const assignedUserDoc = await firestore.collection('users').doc(assignToUserId).get();
    
    if (!assignedUserDoc.exists) {
      return res.status(400).json({
        success: false,
        message: 'Assigned user does not exist'
      });
    }
    
    // If this is a team task, make sure the assigned user is a team member
    if (taskData.teamId) {
      const teamDoc = await firestore.collection('teams').doc(taskData.teamId).get();
      
      if (!teamDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Task team does not exist'
        });
      }
      
      const teamData = teamDoc.data();
      const isTeamMember = teamData.members && teamData.members.some(
        (member: any) => member.userId === assignToUserId
      );
      
      if (!isTeamMember) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user is not a member of the task team'
        });
      }
    }
    
    // Update the task
    await firestore.collection('tasks').doc(taskId).update({
      assignTo: assignToUserId,
      updatedAt: new Date().toISOString()
    });
    
    // Record task history
    const historyEntry = {
      taskId,
      field: 'assignTo',
      oldValue: taskData.assignTo || null,
      newValue: assignToUserId,
      changedAt: new Date().toISOString(),
      changedBy: userId
    };
    
    await firestore.collection('taskHistory').add(historyEntry);
    
    // If this is a team task, add activity entry
    if (taskData.teamId) {
      const activityData = {
        type: 'task_assigned',
        taskId,
        teamId: taskData.teamId,
        performedBy: userId,
        timestamp: new Date().toISOString(),
        details: {
          taskDescription: taskData.description,
          assignedTo: assignToUserId
        }
      };
      
      await firestore.collection('teamActivities').add(activityData);
    }
    
    return res.status(200).json({
      success: true,
      message: 'Task assigned successfully',
      data: {
        id: taskId,
        ...taskData,
        assignTo: assignToUserId,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in assignTask:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to assign task',
      error: error.message
    });
  }
};

/**
 * Share a task with a team
 */
export const shareTaskWithTeam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { taskId } = req.params;
    const { teamId, isPublic = true } = req.body;
    const userId = req.user?.uid;
    
    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: 'Task ID is required'
      });
    }
    
    if (!teamId) {
      return res.status(400).json({
        success: false,
        message: 'Team ID is required'
      });
    }
    
    // Get the existing task
    const taskDoc = await firestore.collection('tasks').doc(taskId).get();
    
    if (!taskDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    const taskData = taskDoc.data() as Task;
    
    // Check if the user has permission to share this task
    // Only the creator can share tasks
    if (taskData.createdBy !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to share this task'
      });
    }
    
    // Validate the team
    const teamDoc = await firestore.collection('teams').doc(teamId).get();
    
    if (!teamDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }
    
    // Check if the user is a member of the team
    const teamData = teamDoc.data();
    const isTeamMember = teamData.members && teamData.members.some(
      (member: any) => member.userId === userId
    );
    
    if (!isTeamMember && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this team'
      });
    }
    
    // Update the task
    await firestore.collection('tasks').doc(taskId).update({
      teamId,
      isPublic,
      updatedAt: new Date().toISOString()
    });
    
    // Record task history
    const historyEntry = {
      taskId,
      field: 'teamId',
      oldValue: taskData.teamId || null,
      newValue: teamId,
      changedAt: new Date().toISOString(),
      changedBy: userId
    };
    
    await firestore.collection('taskHistory').add(historyEntry);
    
    // Add team activity entry
    const activityData = {
      type: 'task_shared',
      taskId,
      teamId,
      performedBy: userId,
      timestamp: new Date().toISOString(),
      details: {
        taskDescription: taskData.description,
        isPublic
      }
    };
    
    await firestore.collection('teamActivities').add(activityData);
    
    return res.status(200).json({
      success: true,
      message: 'Task shared with team successfully',
      data: {
        id: taskId,
        ...taskData,
        teamId,
        isPublic,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in shareTaskWithTeam:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to share task with team',
      error: error.message
    });
  }
};

/**
 * Add or remove a tag from a task
 */
export const updateTaskTags = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { taskId } = req.params;
    const { tags, action } = req.body; // action can be 'add' or 'remove'
    const userId = req.user?.uid;
    
    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: 'Task ID is required'
      });
    }
    
    if (!tags || !Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        message: 'Tags array is required'
      });
    }
    
    if (!action || (action !== 'add' && action !== 'remove')) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either "add" or "remove"'
      });
    }
    
    // Get the existing task
    const taskDoc = await firestore.collection('tasks').doc(taskId).get();
    
    if (!taskDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    const taskData = taskDoc.data() as Task;
    
    // Check if the user has permission to update this task
    const canUpdate = 
      taskData.createdBy === userId || 
      taskData.assignTo === userId || 
      (taskData.teamId && req.user?.teams?.includes(taskData.teamId)) ||
      req.user?.role === 'admin';
    
    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this task'
      });
    }
    
    // Update tags
    const currentTags = taskData.tags || [];
    let updatedTags: string[];
    
    if (action === 'add') {
      // Add new tags, avoiding duplicates
      updatedTags = [...new Set([...currentTags, ...tags])];
    } else {
      // Remove specified tags
      updatedTags = currentTags.filter(tag => !tags.includes(tag));
    }
    
    // Update the task
    await firestore.collection('tasks').doc(taskId).update({
      tags: updatedTags,
      updatedAt: new Date().toISOString()
    });
    
    // Record task history
    const historyEntry = {
      taskId,
      field: 'tags',
      oldValue: currentTags,
      newValue: updatedTags,
      changedAt: new Date().toISOString(),
      changedBy: userId
    };
    
    await firestore.collection('taskHistory').add(historyEntry);
    
    return res.status(200).json({
      success: true,
      message: `Tags ${action === 'add' ? 'added to' : 'removed from'} task successfully`,
      data: {
        id: taskId,
        ...taskData,
        tags: updatedTags,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in updateTaskTags:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update task tags',
      error: error.message
    });
  }
};

/**
 * Set a reminder for a task
 */
export const setTaskReminder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { taskId } = req.params;
    const { reminderDate, reminderSet = true } = req.body;
    const userId = req.user?.uid;
    
    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: 'Task ID is required'
      });
    }
    
    if (reminderSet && !reminderDate) {
      return res.status(400).json({
        success: false,
        message: 'Reminder date is required when setting a reminder'
      });
    }
    
    // Get the existing task
    const taskDoc = await firestore.collection('tasks').doc(taskId).get();
    
    if (!taskDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    const taskData = taskDoc.data() as Task;
    
    // Check if the user has permission to update this task
    const canUpdate = 
      taskData.createdBy === userId || 
      taskData.assignTo === userId || 
      req.user?.role === 'admin';
    
    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to set a reminder for this task'
      });
    }
    
    // Update the task
    const updateData: any = {
      reminderSet,
      updatedAt: new Date().toISOString()
    };
    
    if (reminderSet) {
      updateData.reminderDate = reminderDate;
    } else {
      // If turning off reminder, remove the date
      updateData.reminderDate = null;
    }
    
    await firestore.collection('tasks').doc(taskId).update(updateData);
    
    // Record task history
    const historyEntry = {
      taskId,
      field: 'reminder',
      oldValue: {
        reminderSet: taskData.reminderSet || false,
        reminderDate: taskData.reminderDate
      },
      newValue: {
        reminderSet,
        reminderDate: reminderSet ? reminderDate : null
      },
      changedAt: new Date().toISOString(),
      changedBy: userId
    };
    
    await firestore.collection('taskHistory').add(historyEntry);
    
    return res.status(200).json({
      success: true,
      message: reminderSet ? 'Reminder set successfully' : 'Reminder removed successfully',
      data: {
        id: taskId,
        ...taskData,
        reminderSet,
        reminderDate: reminderSet ? reminderDate : null,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in setTaskReminder:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to set task reminder',
      error: error.message
    });
  }
};

/**
 * Export all the task controller functions
 */
export default {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  assignTask,
  shareTaskWithTeam,
  updateTaskTags,
  setTaskReminder
}; 