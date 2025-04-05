import { Request, Response, NextFunction } from 'express';
import * as emailService from '../services/email.service';
import { firestore } from '../firebase/admin';
import { createBadRequestError, createNotFoundError } from '../middleware/errorHandler';

// Collection references
const emailsCollection = firestore.collection('emails');
const emailTagsCollection = firestore.collection('emailTags');

/**
 * Process a webhook from Gmail
 */
export const processGmailWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract the payload from the request
    const payload = req.body;
    
    // Process the webhook payload
    const result = await emailService.processWebhookPayload(payload, 'gmail');
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Process a webhook from Outlook
 */
export const processOutlookWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract the payload from the request
    const payload = req.body;
    
    // Process the webhook payload
    const result = await emailService.processWebhookPayload(payload, 'outlook');
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Process a webhook from a custom source
 */
export const processCustomWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract the payload from the request
    const payload = req.body;
    
    // Process the webhook payload
    const result = await emailService.processWebhookPayload(payload, 'custom');
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Tag an email with one or more tags
 */
export const tagEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { emailId, tags, userId } = req.body;
    
    if (!emailId) {
      return next(createBadRequestError('Email ID is required'));
    }
    
    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return next(createBadRequestError('Tags array is required'));
    }
    
    if (!userId) {
      return next(createBadRequestError('User ID is required'));
    }
    
    // Get the email
    const emailDoc = await emailsCollection.doc(emailId).get();
    
    if (!emailDoc.exists) {
      return next(createNotFoundError('Email not found'));
    }
    
    const emailData = emailDoc.data();
    
    // Check if the email belongs to the specified user
    if (emailData?.userId !== userId) {
      return next(createNotFoundError('Email not found for this user'));
    }
    
    // Process each tag
    const addedTags = [];
    const existingTags = [];
    
    for (const tagName of tags) {
      // Normalize the tag name
      const normalizedTag = tagName.trim().toLowerCase();
      
      if (!normalizedTag) continue;
      
      // Check if this tag already exists for this email
      const existingTagQuery = await emailTagsCollection
        .where('emailId', '==', emailId)
        .where('normalizedName', '==', normalizedTag)
        .limit(1)
        .get();
      
      if (!existingTagQuery.empty) {
        // Tag already exists
        existingTags.push(normalizedTag);
        continue;
      }
      
      // Add the new tag
      const tagData = {
        emailId,
        userId,
        name: tagName.trim(),
        normalizedName: normalizedTag,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await emailTagsCollection.add(tagData);
      addedTags.push(normalizedTag);
    }
    
    // Update the email's tags field (maintains a quick reference of all tags)
    const existingEmailTags = emailData.tags || [];
    const allTags = [...new Set([...existingEmailTags, ...addedTags])];
    
    await emailsCollection.doc(emailId).update({
      tags: allTags,
      updatedAt: new Date()
    });
    
    res.status(200).json({
      success: true,
      data: {
        emailId,
        addedTags,
        existingTags,
        allTags
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all tags for an email
 */
export const getEmailTags = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { emailId } = req.params;
    
    if (!emailId) {
      return next(createBadRequestError('Email ID is required'));
    }
    
    // Get all tags for this email
    const tagsSnapshot = await emailTagsCollection
      .where('emailId', '==', emailId)
      .orderBy('name')
      .get();
    
    const tags = tagsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.status(200).json({
      success: true,
      count: tags.length,
      data: tags
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a tag from an email
 */
export const removeEmailTag = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { emailId, tagId, userId } = req.body;
    
    if (!emailId) {
      return next(createBadRequestError('Email ID is required'));
    }
    
    if (!tagId) {
      return next(createBadRequestError('Tag ID is required'));
    }
    
    if (!userId) {
      return next(createBadRequestError('User ID is required'));
    }
    
    // Get the tag
    const tagDoc = await emailTagsCollection.doc(tagId).get();
    
    if (!tagDoc.exists) {
      return next(createNotFoundError('Tag not found'));
    }
    
    const tagData = tagDoc.data();
    
    // Check if the tag belongs to the specified user and email
    if (tagData?.userId !== userId || tagData?.emailId !== emailId) {
      return next(createNotFoundError('Tag not found for this user and email'));
    }
    
    // Delete the tag
    await emailTagsCollection.doc(tagId).delete();
    
    // Update the email's tags array
    const emailDoc = await emailsCollection.doc(emailId).get();
    
    if (emailDoc.exists) {
      const emailData = emailDoc.data();
      const currentTags = emailData?.tags || [];
      const updatedTags = currentTags.filter(tag => tag !== tagData.normalizedName);
      
      await emailsCollection.doc(emailId).update({
        tags: updatedTags,
        updatedAt: new Date()
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Tag removed successfully'
    });
  } catch (error) {
    next(error);
  }
}; 