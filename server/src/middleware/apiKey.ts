import { Request, Response, NextFunction } from 'express';
import { firestore } from '../firebase/admin';
import { config } from '../config/env';

/**
 * Middleware to check API key for webhook endpoints
 * The API key can be provided in the query string, headers, or as a bearer token
 */
export const checkApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the API key from request
    const apiKey = 
      req.query.apiKey || 
      req.query.api_key || 
      req.headers['x-api-key'] || 
      req.headers.authorization?.replace('Bearer ', '');
    
    // If no API key is provided
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key is required'
      });
    }
    
    // Check against the system API key from config
    if (apiKey === config.webhooks.apiKey) {
      // System API key is valid
      return next();
    }
    
    // Check against stored API keys in Firestore
    const keySnapshot = await firestore.collection('apiKeys')
      .where('key', '==', apiKey)
      .where('active', '==', true)
      .limit(1)
      .get();
    
    if (keySnapshot.empty) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }
    
    // Get the key data
    const keyData = keySnapshot.docs[0].data();
    
    // Check if the key has expired
    if (keyData.expiresAt && keyData.expiresAt.toDate() < new Date()) {
      return res.status(401).json({
        success: false,
        message: 'API key has expired'
      });
    }
    
    // Check if the key has the right permissions
    if (keyData.permissions && Array.isArray(keyData.permissions)) {
      // Extract the permission needed from the route
      const route = req.path;
      const method = req.method.toLowerCase();
      const requiredPermission = `${method}:${route}`;
      
      // Check for wildcard permissions or specific permission
      const hasPermission = 
        keyData.permissions.includes('*') || 
        keyData.permissions.includes(`${method}:*`) || 
        keyData.permissions.includes(`*:${route}`) || 
        keyData.permissions.includes(requiredPermission);
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'API key does not have permission for this operation'
        });
      }
    }
    
    // Store the API key data on the request for later use
    req.apiKey = keyData;
    
    // Update the last used timestamp
    await firestore.collection('apiKeys').doc(keySnapshot.docs[0].id).update({
      lastUsed: new Date()
    });
    
    next();
  } catch (error) {
    console.error('API key verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying API key'
    });
  }
}; 