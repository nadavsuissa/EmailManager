import { firestore } from '../firebase/admin';
import { config } from '../config/env';
import nodemailer from 'nodemailer';
import { simpleParser, ParsedMail } from 'mailparser';
import Imap from 'imap';
import { createNotFoundError, createBadRequestError } from '../middleware/errorHandler';
import * as openaiService from './openai.service';

// Collection references
const emailsCollection = firestore.collection('emails');
const emailAccountsCollection = firestore.collection('emailAccounts');
const emailTemplatesCollection = firestore.collection('emailTemplates');

// Map to store active IMAP connections
const activeConnections: Map<string, Imap> = new Map();

/**
 * Connect to an email account using IMAP
 * @param accountId ID of the email account to connect to
 */
export const connectToEmailAccount = async (accountId: string) => {
  try {
    // Check if already connected
    if (activeConnections.has(accountId)) {
      console.log(`Already connected to account ${accountId}`);
      return { success: true, message: 'Already connected' };
    }

    // Get account details from Firestore
    const accountDoc = await emailAccountsCollection.doc(accountId).get();
    if (!accountDoc.exists) {
      throw createNotFoundError('Email account not found');
    }

    const account = accountDoc.data();
    if (!account) {
      throw createNotFoundError('Email account data not found');
    }
    
    // Create IMAP connection
    const imap = new Imap({
      user: account.username || account.email,
      password: account.password,
      host: account.server,
      port: account.port || 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false } // For development only, remove in production
    });

    // Set up event handlers
    imap.once('ready', () => {
      console.log(`Connected to email account: ${account.email}`);
      startListening(imap, accountId, account.email, account.userId);
    });

    imap.once('error', (err: Error) => {
      console.error(`Error with email account ${account.email}:`, err);
      activeConnections.delete(accountId);
    });

    imap.once('end', () => {
      console.log(`Connection to ${account.email} ended`);
      activeConnections.delete(accountId);
    });

    // Connect to the server
    imap.connect();
    
    // Store the connection
    activeConnections.set(accountId, imap);
    
    return { success: true, message: 'Connection established' };
  } catch (error) {
    console.error('Error connecting to email account:', error);
    throw error;
  }
};

/**
 * Disconnect from an email account
 * @param accountId ID of the email account to disconnect from
 */
export const disconnectFromEmailAccount = (accountId: string) => {
  try {
    const imap = activeConnections.get(accountId);
    if (imap) {
      imap.end();
      activeConnections.delete(accountId);
      return { success: true, message: 'Disconnected successfully' };
    }
    return { success: false, message: 'Not connected to this account' };
  } catch (error) {
    console.error('Error disconnecting from email account:', error);
    throw error;
  }
};

/**
 * Start listening for new emails
 */
const startListening = (imap: Imap, accountId: string, email: string, userId: string) => {
  try {
    imap.openBox('INBOX', false, (err, mailbox) => {
      if (err) {
        console.error('Error opening inbox:', err);
        return;
      }
      
      console.log(`Opened inbox for ${email}`);
      
      // Listen for new emails
      imap.on('mail', (numNewMsgs: number) => {
        console.log(`Received ${numNewMsgs} new messages`);
        fetchNewEmails(imap, accountId, email, userId);
      });
      
      // Initially fetch unread emails
      fetchNewEmails(imap, accountId, email, userId);
    });
  } catch (error) {
    console.error('Error starting to listen for emails:', error);
  }
};

/**
 * Fetch new emails from an IMAP connection
 */
const fetchNewEmails = (imap: Imap, accountId: string, email: string, userId: string) => {
  try {
    imap.search(['UNSEEN'], (err, results) => {
      if (err) {
        console.error('Error searching for unread emails:', err);
        return;
      }
      
      if (!results || results.length === 0) {
        console.log('No new emails');
        return;
      }
      
      console.log(`Found ${results.length} new emails`);
      
      const fetch = imap.fetch(results, { bodies: '', markSeen: true });
      
      fetch.on('message', (msg, seqno) => {
        msg.on('body', (stream, info) => {
          let buffer = '';
          
          stream.on('data', (chunk) => {
            buffer += chunk.toString('utf8');
          });
          
          stream.once('end', async () => {
            try {
              // Parse the email
              const parsedEmail = await simpleParser(buffer);
              
              // Process the email
              await processEmail(parsedEmail, accountId, userId);
            } catch (error) {
              console.error('Error processing email:', error);
            }
          });
        });
      });
      
      fetch.once('error', (err) => {
        console.error('Fetch error:', err);
      });
      
      fetch.once('end', () => {
        console.log('Done fetching new emails');
      });
    });
  } catch (error) {
    console.error('Error fetching new emails:', error);
  }
};

/**
 * Process a parsed email and extract information
 */
const processEmail = async (parsedEmail: ParsedMail, accountId: string, userId: string) => {
  try {
    // Extract email data
    const from = parsedEmail.from?.text || '';
    const to = parsedEmail.to?.text || '';
    const subject = parsedEmail.subject || '';
    const date = parsedEmail.date || new Date();
    const messageId = parsedEmail.messageId || '';
    
    // Handle different content types for the body
    let textContent = '';
    
    if (parsedEmail.text) {
      textContent = parsedEmail.text;
    } else if (parsedEmail.html) {
      // Very basic HTML to text conversion
      textContent = parsedEmail.html.replace(/<[^>]*>/g, ' ');
    }
    
    // Support Hebrew content
    // Ensure the content is properly encoded for Hebrew characters
    const encoding = detectEncoding(textContent);
    
    // Detect language (simple heuristic)
    const language = containsHebrew(textContent) ? 'he' : 'en';
    
    // Create email record in Firestore
    const emailData = {
      subject,
      content: textContent,
      sender: from,
      recipient: to,
      date,
      messageId,
      accountId,
      userId,
      language,
      encoding,
      processed: false,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const emailRef = await emailsCollection.add(emailData);
    
    // Start AI processing if automatic processing is enabled
    const accountDoc = await emailAccountsCollection.doc(accountId).get();
    const accountData = accountDoc.data();
    
    if (accountData?.settings?.autoProcessEmails) {
      await extractTasksFromEmail(emailRef.id);
    }
    
    console.log(`Processed and saved email with ID: ${emailRef.id}`);
    
    return { success: true, emailId: emailRef.id };
  } catch (error) {
    console.error('Error processing email:', error);
    throw error;
  }
};

/**
 * Extract tasks from an email and update the email document
 */
export const extractTasksFromEmail = async (emailId: string) => {
  try {
    // Get the email from Firestore
    const emailDoc = await emailsCollection.doc(emailId).get();
    if (!emailDoc.exists) {
      throw createNotFoundError('Email not found');
    }
    
    const emailData = emailDoc.data();
    if (!emailData) {
      throw createNotFoundError('Email data not found');
    }
    
    // Use OpenAI to extract tasks
    const content = emailData.content || '';
    const subject = emailData.subject || '';
    const language = emailData.language || 'he';
    
    const extractionResult = await openaiService.extractTaskFromEmail(content, subject, language);
    
    // Analyze task priorities if tasks were found
    let priorityResults = null;
    if (extractionResult.tasks && extractionResult.tasks.length > 0) {
      const taskTexts = extractionResult.tasks.map(task => task.description);
      priorityResults = await openaiService.analyzeTaskPriority(taskTexts, language);
    }
    
    // Update the email document
    await emailsCollection.doc(emailId).update({
      extractedTasks: extractionResult.tasks || [],
      taskAnalysis: priorityResults || null,
      processed: true,
      updatedAt: new Date()
    });
    
    return { 
      success: true, 
      extractedTasks: extractionResult.tasks,
      priorities: priorityResults
    };
  } catch (error) {
    console.error('Error extracting tasks from email:', error);
    throw error;
  }
};

/**
 * Send an email with Hebrew support
 */
export const sendEmail = async (
  accountId: string,
  to: string, 
  subject: string, 
  body: string,
  options: {
    cc?: string,
    bcc?: string,
    isHtml?: boolean,
    attachments?: any[],
    replyTo?: string
  } = {}
) => {
  try {
    // Get account details from Firestore
    const accountDoc = await emailAccountsCollection.doc(accountId).get();
    if (!accountDoc.exists) {
      throw createNotFoundError('Email account not found');
    }

    const account = accountDoc.data();
    if (!account) {
      throw createNotFoundError('Email account data not found');
    }
    
    // Create nodemailer transport
    const transportOptions: any = {
      host: account.server,
      port: account.port || 587,
      secure: account.port === 465, // true for 465, false for other ports
      auth: {
        user: account.username || account.email,
        pass: account.password,
      },
    };
    
    // If using OAuth (future implementation)
    if (account.useOAuth && account.oauth) {
      transportOptions.auth = {
        type: 'OAuth2',
        user: account.email,
        clientId: account.oauth.clientId,
        clientSecret: account.oauth.clientSecret,
        refreshToken: account.oauth.refreshToken,
        accessToken: account.oauth.accessToken,
        expires: account.oauth.expiresAt?.toDate().getTime() || 0,
      };
    }
    
    const transporter = nodemailer.createTransport(transportOptions);
    
    // Set up email options
    const mailOptions: any = {
      from: account.email,
      to,
      subject,
      text: !options.isHtml ? body : undefined,
      html: options.isHtml ? body : undefined,
      cc: options.cc,
      bcc: options.bcc,
      replyTo: options.replyTo,
      attachments: options.attachments,
      // Ensure proper encoding for Hebrew
      encoding: 'utf-8',
      headers: {
        'Content-Type': options.isHtml 
          ? 'text/html; charset=utf-8' 
          : 'text/plain; charset=utf-8'
      }
    };
    
    // Send the email
    const info = await transporter.sendMail(mailOptions);
    
    // Save sent email to Firestore
    const emailData = {
      subject,
      content: body,
      sender: account.email,
      recipient: to,
      cc: options.cc,
      bcc: options.bcc,
      hasAttachments: options.attachments && options.attachments.length > 0,
      messageId: info.messageId,
      date: new Date(),
      accountId,
      userId: account.userId,
      sent: true,
      outgoing: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const emailRef = await emailsCollection.add(emailData);
    
    return { 
      success: true, 
      messageId: info.messageId,
      emailId: emailRef.id
    };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send a follow-up email based on task information
 */
export const sendFollowupEmail = async (
  accountId: string,
  taskId: string,
  recipientEmail: string,
  options: {
    customMessage?: string,
    language?: string,
    useTemplate?: string
  } = {}
) => {
  try {
    // Get the task details
    const taskDoc = await firestore.collection('tasks').doc(taskId).get();
    if (!taskDoc.exists) {
      throw createNotFoundError('Task not found');
    }
    
    const task = taskDoc.data();
    if (!task) {
      throw createNotFoundError('Task data not found');
    }
    
    // Get account details
    const accountDoc = await emailAccountsCollection.doc(accountId).get();
    if (!accountDoc.exists) {
      throw createNotFoundError('Email account not found');
    }
    
    const account = accountDoc.data();
    if (!account) {
      throw createNotFoundError('Email account data not found');
    }
    
    let emailContent: string;
    let emailSubject: string;
    
    // If using a template
    if (options.useTemplate) {
      const templateDoc = await emailTemplatesCollection.doc(options.useTemplate).get();
      if (!templateDoc.exists) {
        throw createNotFoundError('Email template not found');
      }
      
      const template = templateDoc.data();
      if (!template) {
        throw createNotFoundError('Template data not found');
      }
      
      // Replace placeholders in the template
      emailSubject = replaceTemplatePlaceholders(template.subject, task);
      emailContent = replaceTemplatePlaceholders(template.content, task);
    } else {
      // Use OpenAI to generate the follow-up email
      const language = options.language || task.language || 'he';
      const daysOverdue = task.dueDate ? 
        Math.floor((new Date().getTime() - task.dueDate.toDate().getTime()) / (1000 * 60 * 60 * 24)) : 0;
      
      const result = await openaiService.generateFollowupEmail(
        task.title,
        task.assignedTo || recipientEmail,
        daysOverdue,
        language
      );
      
      emailSubject = result.subject || `Follow-up: ${task.title}`;
      emailContent = options.customMessage || result.emailContent || '';
    }
    
    // Send the email
    const result = await sendEmail(
      accountId,
      recipientEmail,
      emailSubject,
      emailContent,
      {
        isHtml: true
      }
    );
    
    // Update the task with the follow-up information
    await firestore.collection('tasks').doc(taskId).update({
      followups: firestore.FieldValue.arrayUnion({
        emailId: result.emailId,
        sentAt: new Date(),
        messageId: result.messageId
      }),
      updatedAt: new Date()
    });
    
    return result;
  } catch (error) {
    console.error('Error sending follow-up email:', error);
    throw error;
  }
};

/**
 * Replace placeholders in a template with task data
 */
const replaceTemplatePlaceholders = (template: string, task: any): string => {
  if (!template) return '';
  
  return template
    .replace(/\{taskTitle\}/g, task.title || '')
    .replace(/\{taskDescription\}/g, task.description || '')
    .replace(/\{taskPriority\}/g, task.priority || 'normal')
    .replace(/\{taskDueDate\}/g, task.dueDate ? formatDate(task.dueDate.toDate()) : '')
    .replace(/\{taskStatus\}/g, task.status || 'open')
    .replace(/\{taskId\}/g, task.id || '')
    .replace(/\{assignee\}/g, task.assignedTo || '')
    .replace(/\{creator\}/g, task.createdBy || '')
    .replace(/\{currentDate\}/g, formatDate(new Date()));
};

/**
 * Format a date for display
 */
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

/**
 * Set up a webhook for email processing
 */
export const processWebhookPayload = async (payload: any, provider: string) => {
  try {
    // Process based on the email provider
    switch (provider.toLowerCase()) {
      case 'gmail':
        return processGmailWebhook(payload);
      case 'outlook':
        return processOutlookWebhook(payload);
      case 'custom':
        return processCustomWebhook(payload);
      default:
        throw createBadRequestError('Unsupported email provider');
    }
  } catch (error) {
    console.error('Error processing webhook payload:', error);
    throw error;
  }
};

/**
 * Process Gmail webhook
 */
const processGmailWebhook = async (payload: any) => {
  try {
    // Get email details from the payload
    const { emailAddress, messageId } = payload;
    
    if (!emailAddress || !messageId) {
      throw createBadRequestError('Missing required webhook data');
    }
    
    // Find the account for this email address
    const accountSnapshot = await emailAccountsCollection
      .where('email', '==', emailAddress)
      .limit(1)
      .get();
    
    if (accountSnapshot.empty) {
      throw createNotFoundError('Account not found for this email address');
    }
    
    const accountDoc = accountSnapshot.docs[0];
    const account = accountDoc.data();
    
    // In a real implementation, you would fetch the email details from Gmail API
    // For this example, we'll create a placeholder
    const emailData = {
      subject: 'New email from webhook',
      content: 'Email content would be fetched from Gmail API',
      sender: 'webhook@example.com',
      recipient: emailAddress,
      date: new Date(),
      messageId,
      accountId: accountDoc.id,
      userId: account.userId,
      processed: false,
      read: false,
      source: 'webhook',
      webhookProvider: 'gmail',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const emailRef = await emailsCollection.add(emailData);
    
    // Process the email if automatic processing is enabled
    if (account.settings?.autoProcessEmails) {
      await extractTasksFromEmail(emailRef.id);
    }
    
    return { success: true, emailId: emailRef.id };
  } catch (error) {
    console.error('Error processing Gmail webhook:', error);
    throw error;
  }
};

/**
 * Process Outlook webhook
 */
const processOutlookWebhook = async (payload: any) => {
  // Similar implementation to Gmail but for Outlook
  return { success: false, message: 'Outlook webhook not implemented yet' };
};

/**
 * Process a custom webhook
 */
const processCustomWebhook = async (payload: any) => {
  try {
    const { 
      to, 
      from, 
      subject, 
      text, 
      html, 
      date,
      messageId,
      accountId,
      userId
    } = payload;
    
    if (!to || !from || !accountId) {
      throw createBadRequestError('Missing required webhook data');
    }
    
    // Verify the account exists
    const accountDoc = await emailAccountsCollection.doc(accountId).get();
    if (!accountDoc.exists) {
      throw createNotFoundError('Email account not found');
    }
    
    // Detect language
    const content = text || html?.replace(/<[^>]*>/g, ' ') || '';
    const language = containsHebrew(content) ? 'he' : 'en';
    
    // Create email record
    const emailData = {
      subject: subject || '',
      content,
      sender: from,
      recipient: to,
      date: date ? new Date(date) : new Date(),
      messageId: messageId || `custom-${Date.now()}`,
      accountId,
      userId: userId || accountDoc.data()?.userId,
      language,
      processed: false,
      read: false,
      source: 'webhook',
      webhookProvider: 'custom',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const emailRef = await emailsCollection.add(emailData);
    
    // Process if auto-processing is enabled
    const account = accountDoc.data();
    if (account?.settings?.autoProcessEmails) {
      await extractTasksFromEmail(emailRef.id);
    }
    
    return { success: true, emailId: emailRef.id };
  } catch (error) {
    console.error('Error processing custom webhook:', error);
    throw error;
  }
};

/**
 * Check if a string contains Hebrew characters
 */
const containsHebrew = (text: string): boolean => {
  return /[\u0590-\u05FF]/.test(text);
};

/**
 * Detect the encoding of text (simplified)
 */
const detectEncoding = (text: string): string => {
  // For most modern web applications, UTF-8 is the standard
  // This is a placeholder - in a real app you might need more sophisticated detection
  return 'utf-8';
};

/**
 * Initialize email listeners for all active accounts on server startup
 */
export const initializeEmailListeners = async () => {
  try {
    // Get all active email accounts
    const accountsSnapshot = await emailAccountsCollection
      .where('active', '==', true)
      .get();
    
    if (accountsSnapshot.empty) {
      console.log('No active email accounts found');
      return;
    }
    
    console.log(`Found ${accountsSnapshot.size} active email accounts`);
    
    // Connect to each account
    for (const doc of accountsSnapshot.docs) {
      try {
        await connectToEmailAccount(doc.id);
      } catch (error) {
        console.error(`Error connecting to account ${doc.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error initializing email listeners:', error);
  }
};

/**
 * Shutdown all email connections
 */
export const shutdownEmailConnections = () => {
  activeConnections.forEach((imap, accountId) => {
    try {
      imap.end();
      console.log(`Disconnected from account ${accountId}`);
    } catch (error) {
      console.error(`Error disconnecting from account ${accountId}:`, error);
    }
  });
  
  activeConnections.clear();
}; 