import { Request, Response, NextFunction } from 'express';
import { firestore } from '../firebase/admin';
import * as openaiService from '../services/openai.service';
import { createBadRequestError, createNotFoundError } from '../middleware/errorHandler';

// Collection references
const emailsCollection = firestore.collection('emails');
const emailAccountsCollection = firestore.collection('emailAccounts');
const emailTemplatesCollection = firestore.collection('emailTemplates');

/**
 * Process an email - extract tasks and analyze content
 */
export const processEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subject, content, sender, recipient, date, threadId, language = 'he' } = req.body;
    
    if (!content) {
      return next(createBadRequestError('Email content is required'));
    }
    
    // Extract tasks from email content
    const extractionResult = await openaiService.extractTaskFromEmail(content, subject, language);
    
    // Analyze task priorities if tasks were found
    let priorityResults = null;
    if (extractionResult.tasks && extractionResult.tasks.length > 0) {
      const taskTexts = extractionResult.tasks.map(task => task.description);
      priorityResults = await openaiService.analyzeTaskPriority(taskTexts, language);
    }
    
    // Create email record in database
    const emailData = {
      subject: subject || '(No Subject)',
      content,
      sender: sender || '',
      recipient: recipient || '',
      date: date ? new Date(date) : new Date(),
      threadId: threadId || null,
      userId: req.user?.uid,
      processed: true,
      extractedTasks: extractionResult.tasks || [],
      taskAnalysis: priorityResults || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const emailRef = await emailsCollection.add(emailData);
    
    res.status(200).json({
      success: true,
      data: {
        emailId: emailRef.id,
        extraction: extractionResult,
        priorities: priorityResults
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Analyze an existing email
 */
export const analyzeEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { emailId, language = 'he' } = req.body;
    
    if (!emailId) {
      return next(createBadRequestError('Email ID is required'));
    }
    
    // Get the email from the database
    const emailDoc = await emailsCollection.doc(emailId).get();
    
    if (!emailDoc.exists) {
      return next(createNotFoundError('Email not found'));
    }
    
    const emailData = emailDoc.data();
    
    // Check if user is authorized to access this email
    if (emailData?.userId !== req.user?.uid && !req.user?.role?.includes('admin')) {
      return next(createNotFoundError('Email not found'));
    }
    
    // Extract tasks from email content
    const extractionResult = await openaiService.extractTaskFromEmail(
      emailData.content,
      emailData.subject,
      language
    );
    
    // Analyze task priorities if tasks were found
    let priorityResults = null;
    if (extractionResult.tasks && extractionResult.tasks.length > 0) {
      const taskTexts = extractionResult.tasks.map(task => task.description);
      priorityResults = await openaiService.analyzeTaskPriority(taskTexts, language);
    }
    
    // Update email record in database
    await emailsCollection.doc(emailId).update({
      processed: true,
      extractedTasks: extractionResult.tasks || [],
      taskAnalysis: priorityResults || null,
      updatedAt: new Date()
    });
    
    res.status(200).json({
      success: true,
      data: {
        emailId,
        extraction: extractionResult,
        priorities: priorityResults
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Extract tasks from an email
 */
export const extractTasksFromEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { emailId, content, subject, language = 'he' } = req.body;
    
    // If emailId is provided, get the email from the database
    if (emailId) {
      const emailDoc = await emailsCollection.doc(emailId).get();
      
      if (!emailDoc.exists) {
        return next(createNotFoundError('Email not found'));
      }
      
      const emailData = emailDoc.data();
      
      // Check if user is authorized to access this email
      if (emailData?.userId !== req.user?.uid && !req.user?.role?.includes('admin')) {
        return next(createNotFoundError('Email not found'));
      }
      
      // Extract tasks from email content
      const extractionResult = await openaiService.extractTaskFromEmail(
        emailData.content,
        emailData.subject,
        language
      );
      
      // Update email record in database
      await emailsCollection.doc(emailId).update({
        processed: true,
        extractedTasks: extractionResult.tasks || [],
        updatedAt: new Date()
      });
      
      return res.status(200).json({
        success: true,
        data: extractionResult
      });
    }
    
    // If content is provided directly
    if (!content) {
      return next(createBadRequestError('Either emailId or content is required'));
    }
    
    // Extract tasks from provided content
    const extractionResult = await openaiService.extractTaskFromEmail(
      content,
      subject || '',
      language
    );
    
    res.status(200).json({
      success: true,
      data: extractionResult
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all emails for the current user
 */
export const getAllEmails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    const { limit, offset, sort } = req.query;
    
    // Create query
    let query = emailsCollection.where('userId', '==', userId);
    
    // Apply sorting
    if (sort === 'asc') {
      query = query.orderBy('date', 'asc');
    } else {
      // Default sort by date descending
      query = query.orderBy('date', 'desc');
    }
    
    // Apply limit
    if (limit) {
      query = query.limit(parseInt(limit as string));
    }
    
    // Apply offset
    if (offset) {
      query = query.offset(parseInt(offset as string));
    }
    
    // Execute query
    const snapshot = await query.get();
    
    // Format results
    const emails = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.status(200).json({
      success: true,
      count: emails.length,
      data: emails
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single email by ID
 */
export const getEmailById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const emailId = req.params.id;
    const userId = req.user?.uid;
    
    // Get the email
    const emailDoc = await emailsCollection.doc(emailId).get();
    
    if (!emailDoc.exists) {
      return next(createNotFoundError('Email not found'));
    }
    
    const emailData = emailDoc.data();
    
    // Check if user is authorized to access this email
    if (emailData?.userId !== userId && !req.user?.role?.includes('admin')) {
      return next(createNotFoundError('Email not found'));
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: emailDoc.id,
        ...emailData
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get emails in the same thread
 */
export const getEmailsInThread = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const threadId = req.params.threadId;
    const userId = req.user?.uid;
    
    if (!threadId) {
      return next(createBadRequestError('Thread ID is required'));
    }
    
    // Get all emails in the thread
    const snapshot = await emailsCollection
      .where('threadId', '==', threadId)
      .where('userId', '==', userId)
      .orderBy('date', 'asc')
      .get();
    
    // Format results
    const emails = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.status(200).json({
      success: true,
      count: emails.length,
      data: emails
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send a new email
 */
export const sendEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { to, subject, content, cc, bcc, attachments } = req.body;
    const userId = req.user?.uid;
    
    if (!to) {
      return next(createBadRequestError('Recipient (to) is required'));
    }
    
    if (!content) {
      return next(createBadRequestError('Email content is required'));
    }
    
    // Create email record in database
    const emailData = {
      subject: subject || '(No Subject)',
      content,
      sender: req.user?.email || '',
      recipient: to,
      cc: cc || [],
      bcc: bcc || [],
      hasAttachments: attachments && attachments.length > 0,
      date: new Date(),
      threadId: null, // New email, no thread yet
      userId,
      sent: true,
      outgoing: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // In a real application, we would call an email sending service here
    
    // Save the email to the database
    const emailRef = await emailsCollection.add(emailData);
    
    res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      data: {
        id: emailRef.id,
        ...emailData
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reply to an email
 */
export const replyToEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { emailId, content, replyAll, attachments } = req.body;
    const userId = req.user?.uid;
    
    if (!emailId) {
      return next(createBadRequestError('Original email ID is required'));
    }
    
    if (!content) {
      return next(createBadRequestError('Reply content is required'));
    }
    
    // Get the original email
    const originalEmailDoc = await emailsCollection.doc(emailId).get();
    
    if (!originalEmailDoc.exists) {
      return next(createNotFoundError('Original email not found'));
    }
    
    const originalEmail = originalEmailDoc.data();
    
    // Check if user is authorized to access this email
    if (originalEmail?.userId !== userId && !req.user?.role?.includes('admin')) {
      return next(createNotFoundError('Original email not found'));
    }
    
    // Determine recipients for the reply
    const to = originalEmail.sender;
    let cc = [];
    
    if (replyAll && originalEmail.cc) {
      // Remove the current user's email from CC list
      cc = originalEmail.cc.filter(email => email !== req.user?.email);
    }
    
    // Create the reply email record
    const replyData = {
      subject: originalEmail.subject.startsWith('Re:') 
        ? originalEmail.subject 
        : `Re: ${originalEmail.subject}`,
      content,
      sender: req.user?.email || '',
      recipient: to,
      cc,
      hasAttachments: attachments && attachments.length > 0,
      date: new Date(),
      threadId: originalEmail.threadId || originalEmailDoc.id, // Use existing thread or original email ID
      userId,
      sent: true,
      outgoing: true,
      inReplyTo: emailId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // In a real application, we would call an email sending service here
    
    // Save the reply to the database
    const replyRef = await emailsCollection.add(replyData);
    
    res.status(200).json({
      success: true,
      message: 'Reply sent successfully',
      data: {
        id: replyRef.id,
        ...replyData
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Forward an email
 */
export const forwardEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { emailId, to, content, cc, bcc, attachments } = req.body;
    const userId = req.user?.uid;
    
    if (!emailId) {
      return next(createBadRequestError('Original email ID is required'));
    }
    
    if (!to) {
      return next(createBadRequestError('Recipient (to) is required'));
    }
    
    // Get the original email
    const originalEmailDoc = await emailsCollection.doc(emailId).get();
    
    if (!originalEmailDoc.exists) {
      return next(createNotFoundError('Original email not found'));
    }
    
    const originalEmail = originalEmailDoc.data();
    
    // Check if user is authorized to access this email
    if (originalEmail?.userId !== userId && !req.user?.role?.includes('admin')) {
      return next(createNotFoundError('Original email not found'));
    }
    
    // Create forwarded email content if not provided
    const forwardedContent = content || `---------- Forwarded message ---------
From: ${originalEmail.sender}
Date: ${originalEmail.date.toISOString()}
Subject: ${originalEmail.subject}
To: ${originalEmail.recipient}

${originalEmail.content}`;
    
    // Create the forwarded email record
    const forwardData = {
      subject: originalEmail.subject.startsWith('Fwd:') 
        ? originalEmail.subject 
        : `Fwd: ${originalEmail.subject}`,
      content: forwardedContent,
      sender: req.user?.email || '',
      recipient: to,
      cc: cc || [],
      bcc: bcc || [],
      hasAttachments: attachments && attachments.length > 0 || originalEmail.hasAttachments,
      date: new Date(),
      threadId: null, // Forwarded email starts a new thread
      userId,
      sent: true,
      outgoing: true,
      forwardedFrom: emailId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // In a real application, we would call an email sending service here
    
    // Save the forwarded email to the database
    const forwardRef = await emailsCollection.add(forwardData);
    
    res.status(200).json({
      success: true,
      message: 'Email forwarded successfully',
      data: {
        id: forwardRef.id,
        ...forwardData
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Save an email draft
 */
export const saveDraft = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, to, subject, content, cc, bcc, threadId } = req.body;
    const userId = req.user?.uid;
    
    // Create or update email draft
    const draftData = {
      subject: subject || '(No Subject)',
      content: content || '',
      sender: req.user?.email || '',
      recipient: to || '',
      cc: cc || [],
      bcc: bcc || [],
      threadId: threadId || null,
      userId,
      isDraft: true,
      sent: false,
      outgoing: true,
      updatedAt: new Date()
    };
    
    let draftRef;
    
    // If ID is provided, update existing draft
    if (id) {
      // Check if the draft exists and belongs to this user
      const draftDoc = await emailsCollection.doc(id).get();
      
      if (!draftDoc.exists) {
        return next(createNotFoundError('Draft not found'));
      }
      
      const draftData = draftDoc.data();
      
      // Check if user is authorized to access this draft
      if (draftData?.userId !== userId) {
        return next(createNotFoundError('Draft not found'));
      }
      
      // Update existing draft
      await emailsCollection.doc(id).update({
        ...draftData,
        updatedAt: new Date()
      });
      
      draftRef = emailsCollection.doc(id);
    } else {
      // Create new draft
      draftData.createdAt = new Date();
      draftRef = await emailsCollection.add(draftData);
    }
    
    res.status(200).json({
      success: true,
      message: 'Draft saved successfully',
      data: {
        id: draftRef.id,
        ...draftData
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all email accounts (admin only)
 */
export const getEmailAccounts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get all email accounts from database
    const snapshot = await emailAccountsCollection.get();
    
    // Format results
    const accounts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Exclude sensitive information like passwords or tokens
      password: undefined,
      accessToken: undefined,
      refreshToken: undefined
    }));
    
    res.status(200).json({
      success: true,
      count: accounts.length,
      data: accounts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a new email account (admin only)
 */
export const addEmailAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, name, provider, server, port, username, password, oauth } = req.body;
    
    if (!email) {
      return next(createBadRequestError('Email address is required'));
    }
    
    if (!provider) {
      return next(createBadRequestError('Email provider is required'));
    }
    
    // Check if account already exists
    const existingAccount = await emailAccountsCollection
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (!existingAccount.empty) {
      return next(createBadRequestError('An account with this email already exists'));
    }
    
    // Create the account
    const accountData = {
      email,
      name: name || email,
      provider,
      server: server || null,
      port: port || null,
      username: username || email,
      // In a real app, you would encrypt the password before storing
      password: password || null,
      useOAuth: !!oauth,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Save oauth data separately if provided
    if (oauth) {
      accountData['oauth'] = oauth;
    }
    
    // Save to database
    const accountRef = await emailAccountsCollection.add(accountData);
    
    // Return the new account (without sensitive data)
    const returnData = {
      ...accountData,
      id: accountRef.id,
      password: undefined
    };
    
    res.status(201).json({
      success: true,
      data: returnData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an email account (admin only)
 */
export const updateEmailAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accountId = req.params.id;
    const updateData = req.body;
    
    // Get the account
    const accountDoc = await emailAccountsCollection.doc(accountId).get();
    
    if (!accountDoc.exists) {
      return next(createNotFoundError('Email account not found'));
    }
    
    // Add updatedAt timestamp
    updateData.updatedAt = new Date();
    
    // Update the account
    await emailAccountsCollection.doc(accountId).update(updateData);
    
    // Get the updated account
    const updatedDoc = await emailAccountsCollection.doc(accountId).get();
    const updatedData = updatedDoc.data();
    
    // Return the updated account (without sensitive data)
    const returnData = {
      ...updatedData,
      id: updatedDoc.id,
      password: undefined,
      accessToken: undefined,
      refreshToken: undefined
    };
    
    res.status(200).json({
      success: true,
      data: returnData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an email account (admin only)
 */
export const deleteEmailAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accountId = req.params.id;
    
    // Check if the account exists
    const accountDoc = await emailAccountsCollection.doc(accountId).get();
    
    if (!accountDoc.exists) {
      return next(createNotFoundError('Email account not found'));
    }
    
    // Delete the account
    await emailAccountsCollection.doc(accountId).delete();
    
    res.status(200).json({
      success: true,
      message: 'Email account deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all email templates
 */
export const getEmailTemplates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    
    // Get templates owned by this user or that are public
    const snapshot = await emailTemplatesCollection
      .where('userId', '==', userId)
      .orderBy('name', 'asc')
      .get();
    
    // Get public templates
    const publicSnapshot = await emailTemplatesCollection
      .where('isPublic', '==', true)
      .get();
    
    // Combine and remove duplicates
    const userTemplates = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const publicTemplates = publicSnapshot.docs
      .filter(doc => doc.data().userId !== userId) // Remove user's own templates
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    
    const allTemplates = [...userTemplates, ...publicTemplates];
    
    res.status(200).json({
      success: true,
      count: allTemplates.length,
      data: allTemplates
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new email template
 */
export const createEmailTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, subject, content, isPublic, category } = req.body;
    const userId = req.user?.uid;
    
    if (!name) {
      return next(createBadRequestError('Template name is required'));
    }
    
    if (!content) {
      return next(createBadRequestError('Template content is required'));
    }
    
    // Create the template
    const templateData = {
      name,
      subject: subject || '',
      content,
      isPublic: isPublic || false,
      category: category || 'general',
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Save to database
    const templateRef = await emailTemplatesCollection.add(templateData);
    
    res.status(201).json({
      success: true,
      data: {
        id: templateRef.id,
        ...templateData
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an email template
 */
export const updateEmailTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const templateId = req.params.id;
    const updateData = req.body;
    const userId = req.user?.uid;
    
    // Get the template
    const templateDoc = await emailTemplatesCollection.doc(templateId).get();
    
    if (!templateDoc.exists) {
      return next(createNotFoundError('Email template not found'));
    }
    
    const templateData = templateDoc.data();
    
    // Check if user is authorized to update this template
    if (templateData?.userId !== userId && !req.user?.role?.includes('admin')) {
      return next(createNotFoundError('Email template not found'));
    }
    
    // Add updatedAt timestamp
    updateData.updatedAt = new Date();
    
    // Update the template
    await emailTemplatesCollection.doc(templateId).update(updateData);
    
    // Get the updated template
    const updatedDoc = await emailTemplatesCollection.doc(templateId).get();
    
    res.status(200).json({
      success: true,
      data: {
        id: updatedDoc.id,
        ...updatedDoc.data()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an email template
 */
export const deleteEmailTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const templateId = req.params.id;
    const userId = req.user?.uid;
    
    // Get the template
    const templateDoc = await emailTemplatesCollection.doc(templateId).get();
    
    if (!templateDoc.exists) {
      return next(createNotFoundError('Email template not found'));
    }
    
    const templateData = templateDoc.data();
    
    // Check if user is authorized to delete this template
    if (templateData?.userId !== userId && !req.user?.role?.includes('admin')) {
      return next(createNotFoundError('Email template not found'));
    }
    
    // Delete the template
    await emailTemplatesCollection.doc(templateId).delete();
    
    res.status(200).json({
      success: true,
      message: 'Email template deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}; 