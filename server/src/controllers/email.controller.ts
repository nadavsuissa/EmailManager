import { Request, Response, NextFunction } from 'express';
import * as emailService from '../services/email.service';
import { firestore } from '../firebase/admin';
import { createBadRequestError, createNotFoundError, createAuthorizationError } from '../middleware/errorHandler';

// Collection references
const emailsCollection = firestore.collection('emails');
const emailAccountsCollection = firestore.collection('emailAccounts');
const emailTemplatesCollection = firestore.collection('emailTemplates');

/**
 * Process an email and extract tasks
 */
export const processEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { emailId } = req.body;
    const userId = req.user?.uid;
    
    if (!userId) {
      return next(createAuthorizationError('User not authenticated'));
    }
    
    if (!emailId) {
      return next(createBadRequestError('Email ID is required'));
    }
    
    // Process the email
    const result = await emailService.extractTasksFromEmail(emailId);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Analyze an email without saving tasks
 */
export const analyzeEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, subject, language } = req.body;
    const userId = req.user?.uid;
    
    if (!userId) {
      return next(createAuthorizationError('User not authenticated'));
    }
    
    if (!content) {
      return next(createBadRequestError('Email content is required'));
    }
    
    // Create a temporary email document
    const emailData = {
      subject: subject || '',
      content,
      userId,
      language: language || 'he',
      temporary: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const emailRef = await emailsCollection.add(emailData);
    
    // Process the email
    const result = await emailService.extractTasksFromEmail(emailRef.id);
    
    // Delete the temporary document
    await emailRef.delete();
    
    res.status(200).json({
      success: true,
      data: result
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
    const { emailId } = req.body;
    const userId = req.user?.uid;
    
    if (!userId) {
      return next(createAuthorizationError('User not authenticated'));
    }
    
    if (!emailId) {
      return next(createBadRequestError('Email ID is required'));
    }
    
    // Get the email from Firestore
    const emailDoc = await emailsCollection.doc(emailId).get();
    if (!emailDoc.exists) {
      return next(createNotFoundError('Email not found'));
    }
    
    const emailData = emailDoc.data();
    
    // Check if user has permission to access this email
    if (emailData?.userId !== userId) {
      return next(createAuthorizationError('You do not have permission to access this email'));
    }
    
    // Process the email
    const result = await emailService.extractTasksFromEmail(emailId);
    
    res.status(200).json({
      success: true,
      data: result
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
    const { page = 1, limit = 20, filter, sort } = req.query;
    
    if (!userId) {
      return next(createAuthorizationError('User not authenticated'));
    }
    
    // Start with a base query
    let query: any = emailsCollection
      .where('userId', '==', userId)
      .where('temporary', '==', false);
    
    // Apply filters if provided
    if (filter) {
      const filterObj = typeof filter === 'string' ? JSON.parse(filter) : filter;
      
      if (filterObj.read !== undefined) {
        query = query.where('read', '==', filterObj.read === true);
      }
      
      if (filterObj.processed !== undefined) {
        query = query.where('processed', '==', filterObj.processed === true);
      }
      
      if (filterObj.hasTasks !== undefined) {
        query = query.where('hasTasks', '==', filterObj.hasTasks === true);
      }
      
      if (filterObj.search) {
        // This is a simplified search, in a real app consider using algolia or similar
        // Note that Firestore doesn't support direct text search or contains operations
        query = query.where('content', '>=', filterObj.search)
                     .where('content', '<=', filterObj.search + '\uf8ff');
      }
    }
    
    // Apply sorting
    if (sort) {
      const sortObj = typeof sort === 'string' ? JSON.parse(sort) : sort;
      const field = sortObj.field || 'date';
      const direction = sortObj.direction === 'asc' ? 'asc' : 'desc';
      
      query = query.orderBy(field, direction);
    } else {
      // Default sort by date descending
      query = query.orderBy('date', 'desc');
    }
    
    // Apply pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;
    
    // Get the total count first (for pagination info)
    const countQuery = await query.count().get();
    const totalCount = countQuery.data().count;
    
    // Then get the paginated results
    const snapshot = await query.limit(limitNum).offset(offset).get();
    
    const emails = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.status(200).json({
      success: true,
      count: emails.length,
      totalCount,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum)
      },
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
    const { id } = req.params;
    const userId = req.user?.uid;
    
    if (!userId) {
      return next(createAuthorizationError('User not authenticated'));
    }
    
    // Get the email
    const emailDoc = await emailsCollection.doc(id).get();
    
    if (!emailDoc.exists) {
      return next(createNotFoundError('Email not found'));
    }
    
    const emailData = emailDoc.data();
    
    // Check if user has permission to access this email
    if (emailData?.userId !== userId) {
      return next(createAuthorizationError('You do not have permission to access this email'));
    }
    
    // Mark as read if not already
    if (!emailData?.read) {
      await emailsCollection.doc(id).update({ 
        read: true,
        updatedAt: new Date()
      });
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
 * Get all emails in a thread
 */
export const getEmailsInThread = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { threadId } = req.params;
    const userId = req.user?.uid;
    
    if (!userId) {
      return next(createAuthorizationError('User not authenticated'));
    }
    
    if (!threadId) {
      return next(createBadRequestError('Thread ID is required'));
    }
    
    // Get emails in the thread
    const snapshot = await emailsCollection
      .where('userId', '==', userId)
      .where('threadId', '==', threadId)
      .orderBy('date', 'asc')
      .get();
    
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
    const { accountId, to, subject, body, cc, bcc, isHtml, attachments, replyTo } = req.body;
    const userId = req.user?.uid;
    
    if (!userId) {
      return next(createAuthorizationError('User not authenticated'));
    }
    
    if (!accountId) {
      return next(createBadRequestError('Account ID is required'));
    }
    
    if (!to) {
      return next(createBadRequestError('Recipient email is required'));
    }
    
    if (!subject || !body) {
      return next(createBadRequestError('Subject and body are required'));
    }
    
    // Check if the account belongs to this user
    const accountDoc = await emailAccountsCollection.doc(accountId).get();
    
    if (!accountDoc.exists) {
      return next(createNotFoundError('Email account not found'));
    }
    
    const accountData = accountDoc.data();
    
    if (accountData?.userId !== userId) {
      return next(createAuthorizationError('You do not have permission to use this account'));
    }
    
    // Send the email
    const result = await emailService.sendEmail(
      accountId,
      to,
      subject,
      body,
      {
        cc,
        bcc,
        isHtml: isHtml || false,
        attachments,
        replyTo
      }
    );
    
    res.status(200).json({
      success: true,
      data: result
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
    const { emailId, body, includeOriginal, isHtml } = req.body;
    const userId = req.user?.uid;
    
    if (!userId) {
      return next(createAuthorizationError('User not authenticated'));
    }
    
    if (!emailId || !body) {
      return next(createBadRequestError('Email ID and reply body are required'));
    }
    
    // Get the original email
    const emailDoc = await emailsCollection.doc(emailId).get();
    
    if (!emailDoc.exists) {
      return next(createNotFoundError('Email not found'));
    }
    
    const emailData = emailDoc.data();
    
    // Check if user has permission to access this email
    if (emailData?.userId !== userId) {
      return next(createAuthorizationError('You do not have permission to access this email'));
    }
    
    // Get the account details
    const accountDoc = await emailAccountsCollection.doc(emailData.accountId).get();
    
    if (!accountDoc.exists) {
      return next(createNotFoundError('Email account not found'));
    }
    
    // Construct the reply
    let replyBody = body;
    
    if (includeOriginal && emailData.content) {
      // Format the original message for inclusion
      const originalContent = isHtml
        ? `<div style="border-left: 1px solid #ccc; padding-left: 10px; margin-top: 20px;">${emailData.content}</div>`
        : `\n\n> ${emailData.content.replace(/\n/g, '\n> ')}`;
      
      replyBody += originalContent;
    }
    
    // Create the subject with Re: prefix if not already present
    const subject = emailData.subject?.startsWith('Re:')
      ? emailData.subject
      : `Re: ${emailData.subject}`;
    
    // Get the reply-to or sender address
    const to = emailData.replyTo || emailData.sender;
    
    // Send the reply
    const result = await emailService.sendEmail(
      emailData.accountId,
      to,
      subject,
      replyBody,
      {
        isHtml: isHtml || false,
        replyTo: emailData.recipient // Reply from the original recipient address
      }
    );
    
    // Update the email thread information
    const threadId = emailData.threadId || emailId;
    
    await emailsCollection.doc(result.emailId).update({
      threadId,
      isReply: true,
      originalEmailId: emailId
    });
    
    res.status(200).json({
      success: true,
      data: result
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
    const { emailId, to, additionalComment, isHtml } = req.body;
    const userId = req.user?.uid;
    
    if (!userId) {
      return next(createAuthorizationError('User not authenticated'));
    }
    
    if (!emailId || !to) {
      return next(createBadRequestError('Email ID and recipient are required'));
    }
    
    // Get the original email
    const emailDoc = await emailsCollection.doc(emailId).get();
    
    if (!emailDoc.exists) {
      return next(createNotFoundError('Email not found'));
    }
    
    const emailData = emailDoc.data();
    
    // Check if user has permission to access this email
    if (emailData?.userId !== userId) {
      return next(createAuthorizationError('You do not have permission to access this email'));
    }
    
    // Construct the forwarded message
    let forwardBody = '';
    
    if (additionalComment) {
      forwardBody = additionalComment + (isHtml ? '<br><br>' : '\n\n');
    }
    
    // Add forwarded message header
    const header = isHtml
      ? `<p>---------- Forwarded message ----------</p>
         <p>From: ${emailData.sender}<br>
         Date: ${emailData.date instanceof Date ? emailData.date.toLocaleString('he-IL') : emailData.date}<br>
         Subject: ${emailData.subject}<br>
         To: ${emailData.recipient}</p><br>`
      : `---------- Forwarded message ----------\n` +
        `From: ${emailData.sender}\n` +
        `Date: ${emailData.date instanceof Date ? emailData.date.toLocaleString('he-IL') : emailData.date}\n` +
        `Subject: ${emailData.subject}\n` +
        `To: ${emailData.recipient}\n\n`;
    
    forwardBody += header + emailData.content;
    
    // Create the subject with Fwd: prefix if not already present
    const subject = emailData.subject?.startsWith('Fwd:')
      ? emailData.subject
      : `Fwd: ${emailData.subject}`;
    
    // Send the forwarded email
    const result = await emailService.sendEmail(
      emailData.accountId,
      to,
      subject,
      forwardBody,
      {
        isHtml: isHtml || false
      }
    );
    
    // Update the email metadata
    await emailsCollection.doc(result.emailId).update({
      isForward: true,
      originalEmailId: emailId
    });
    
    res.status(200).json({
      success: true,
      data: result
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
    const { accountId, to, subject, body, cc, bcc, isHtml } = req.body;
    const userId = req.user?.uid;
    
    if (!userId) {
      return next(createAuthorizationError('User not authenticated'));
    }
    
    if (!accountId) {
      return next(createBadRequestError('Account ID is required'));
    }
    
    // Check if the account belongs to this user
    const accountDoc = await emailAccountsCollection.doc(accountId).get();
    
    if (!accountDoc.exists) {
      return next(createNotFoundError('Email account not found'));
    }
    
    const accountData = accountDoc.data();
    
    if (accountData?.userId !== userId) {
      return next(createAuthorizationError('You do not have permission to use this account'));
    }
    
    // Create a draft email
    const draftData = {
      subject: subject || '',
      content: body || '',
      recipient: to || '',
      cc: cc || '',
      bcc: bcc || '',
      isHtml: isHtml || false,
      sender: accountData.email,
      accountId,
      userId,
      isDraft: true,
      outgoing: true,
      date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    let draftId = req.body.draftId; // For updating existing drafts
    
    if (draftId) {
      // Check if the draft exists and belongs to the user
      const draftDoc = await emailsCollection.doc(draftId).get();
      
      if (!draftDoc.exists || draftDoc.data()?.userId !== userId) {
        draftId = null; // Create a new draft instead
      } else {
        await emailsCollection.doc(draftId).update({
          ...draftData,
          updatedAt: new Date()
        });
      }
    }
    
    if (!draftId) {
      // Create a new draft
      const draftRef = await emailsCollection.add(draftData);
      draftId = draftRef.id;
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: draftId,
        ...draftData
      }
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
    
    if (!userId) {
      return next(createAuthorizationError('User not authenticated'));
    }
    
    // Get templates for this user (and system templates)
    const snapshot = await emailTemplatesCollection
      .where('userId', 'in', [userId, 'system'])
      .orderBy('name')
      .get();
    
    const templates = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.status(200).json({
      success: true,
      count: templates.length,
      data: templates
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
    const { name, description, subject, content, isHtml, language } = req.body;
    const userId = req.user?.uid;
    
    if (!userId) {
      return next(createAuthorizationError('User not authenticated'));
    }
    
    if (!name || !subject || !content) {
      return next(createBadRequestError('Name, subject, and content are required'));
    }
    
    // Create template
    const templateData = {
      name,
      description: description || '',
      subject,
      content,
      isHtml: isHtml || false,
      language: language || 'he',
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
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
    const { id } = req.params;
    const { name, description, subject, content, isHtml, language } = req.body;
    const userId = req.user?.uid;
    
    if (!userId) {
      return next(createAuthorizationError('User not authenticated'));
    }
    
    // Get the template
    const templateDoc = await emailTemplatesCollection.doc(id).get();
    
    if (!templateDoc.exists) {
      return next(createNotFoundError('Template not found'));
    }
    
    const templateData = templateDoc.data();
    
    // Check if user has permission to update this template
    if (templateData?.userId !== userId && templateData?.userId !== 'system') {
      return next(createAuthorizationError('You do not have permission to update this template'));
    }
    
    // Cannot update system templates
    if (templateData?.userId === 'system') {
      return next(createAuthorizationError('System templates cannot be modified'));
    }
    
    // Update the template
    const updateData: any = {
      updatedAt: new Date()
    };
    
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (subject) updateData.subject = subject;
    if (content) updateData.content = content;
    if (isHtml !== undefined) updateData.isHtml = isHtml;
    if (language) updateData.language = language;
    
    await emailTemplatesCollection.doc(id).update(updateData);
    
    res.status(200).json({
      success: true,
      data: {
        id,
        ...templateData,
        ...updateData
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
    const { id } = req.params;
    const userId = req.user?.uid;
    
    if (!userId) {
      return next(createAuthorizationError('User not authenticated'));
    }
    
    // Get the template
    const templateDoc = await emailTemplatesCollection.doc(id).get();
    
    if (!templateDoc.exists) {
      return next(createNotFoundError('Template not found'));
    }
    
    const templateData = templateDoc.data();
    
    // Check if user has permission to delete this template
    if (templateData?.userId !== userId) {
      return next(createAuthorizationError('You do not have permission to delete this template'));
    }
    
    // Cannot delete system templates
    if (templateData?.userId === 'system') {
      return next(createAuthorizationError('System templates cannot be deleted'));
    }
    
    // Delete the template
    await emailTemplatesCollection.doc(id).delete();
    
    res.status(200).json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all email accounts for the organization (admin only)
 */
export const getEmailAccounts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    
    if (!userId) {
      return next(createAuthorizationError('User not authenticated'));
    }
    
    // Get accounts
    const snapshot = await emailAccountsCollection.get();
    
    const accounts = snapshot.docs.map(doc => {
      const data = doc.data();
      // Hide sensitive information
      return {
        id: doc.id,
        email: data.email,
        username: data.username,
        server: data.server,
        port: data.port,
        useOAuth: data.useOAuth,
        userId: data.userId,
        name: data.name,
        active: data.active,
        settings: data.settings,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
    });
    
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
    const {
      email,
      username,
      password,
      server,
      port,
      useOAuth,
      oauth,
      userId: ownerUserId,
      name,
      settings
    } = req.body;
    const adminUserId = req.user?.uid;
    
    if (!adminUserId) {
      return next(createAuthorizationError('User not authenticated'));
    }
    
    if (!email || (!password && !useOAuth) || !server) {
      return next(createBadRequestError('Email, server, and either password or OAuth are required'));
    }
    
    // Create account
    const accountData: any = {
      email,
      username: username || email,
      password: password || null,
      server,
      port: port || 993,
      useOAuth: useOAuth || false,
      userId: ownerUserId || adminUserId,
      name: name || email,
      active: true,
      settings: settings || {
        autoProcessEmails: true,
        deleteAfterProcessing: false
      },
      createdBy: adminUserId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    if (useOAuth && oauth) {
      accountData.oauth = oauth;
    }
    
    const accountRef = await emailAccountsCollection.add(accountData);
    
    // Mask sensitive information in the response
    delete accountData.password;
    if (accountData.oauth) {
      delete accountData.oauth.clientSecret;
      delete accountData.oauth.refreshToken;
      delete accountData.oauth.accessToken;
    }
    
    // Try to connect to the account
    try {
      await emailService.connectToEmailAccount(accountRef.id);
    } catch (error) {
      console.error('Error connecting to account:', error);
      // Continue anyway, connection can be retried later
    }
    
    res.status(201).json({
      success: true,
      data: {
        id: accountRef.id,
        ...accountData
      }
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
    const { id } = req.params;
    const {
      email,
      username,
      password,
      server,
      port,
      useOAuth,
      oauth,
      userId: ownerUserId,
      name,
      active,
      settings
    } = req.body;
    const adminUserId = req.user?.uid;
    
    if (!adminUserId) {
      return next(createAuthorizationError('User not authenticated'));
    }
    
    // Get the account
    const accountDoc = await emailAccountsCollection.doc(id).get();
    
    if (!accountDoc.exists) {
      return next(createNotFoundError('Email account not found'));
    }
    
    // Update the account
    const updateData: any = {
      updatedAt: new Date()
    };
    
    if (email) updateData.email = email;
    if (username) updateData.username = username;
    if (password) updateData.password = password;
    if (server) updateData.server = server;
    if (port) updateData.port = port;
    if (useOAuth !== undefined) updateData.useOAuth = useOAuth;
    if (oauth) updateData.oauth = oauth;
    if (ownerUserId) updateData.userId = ownerUserId;
    if (name) updateData.name = name;
    if (active !== undefined) updateData.active = active;
    if (settings) updateData.settings = settings;
    
    await emailAccountsCollection.doc(id).update(updateData);
    
    // If the account was deactivated, disconnect it
    const originalData = accountDoc.data();
    if (originalData?.active && updateData.active === false) {
      emailService.disconnectFromEmailAccount(id);
    }
    
    // If the account was activated, connect it
    if (!originalData?.active && updateData.active === true) {
      try {
        await emailService.connectToEmailAccount(id);
      } catch (error) {
        console.error('Error connecting to account:', error);
        // Continue anyway, connection can be retried later
      }
    }
    
    // Mask sensitive information in the response
    const responseData = {
      ...originalData,
      ...updateData
    };
    
    delete responseData.password;
    if (responseData.oauth) {
      delete responseData.oauth.clientSecret;
      delete responseData.oauth.refreshToken;
      delete responseData.oauth.accessToken;
    }
    
    res.status(200).json({
      success: true,
      data: {
        id,
        ...responseData
      }
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
    const { id } = req.params;
    const adminUserId = req.user?.uid;
    
    if (!adminUserId) {
      return next(createAuthorizationError('User not authenticated'));
    }
    
    // Get the account
    const accountDoc = await emailAccountsCollection.doc(id).get();
    
    if (!accountDoc.exists) {
      return next(createNotFoundError('Email account not found'));
    }
    
    // Disconnect if connected
    emailService.disconnectFromEmailAccount(id);
    
    // Delete the account
    await emailAccountsCollection.doc(id).delete();
    
    res.status(200).json({
      success: true,
      message: 'Email account deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}; 