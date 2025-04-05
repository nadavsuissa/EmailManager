import { Request, Response, NextFunction } from 'express';
import { auth } from '../firebase/admin';
import { createAuthenticationError } from './errorHandler';

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
        role?: string;
        displayName?: string;
      };
    }
  }
}

/**
 * Authentication middleware to verify Firebase ID tokens
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  // Get the authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(createAuthenticationError('Unauthorized - No token provided'));
  }
  
  // Extract the token from the header
  const token = authHeader.split('Bearer ')[1];
  
  try {
    // Verify the token with Firebase Auth
    const decodedToken = await auth.verifyIdToken(token);
    
    // If token is valid, set the user on the request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name
    };
    
    // Get additional user data from Firestore
    try {
      const userDoc = await auth.getUser(decodedToken.uid);
      
      // Get custom claims (contains role)
      const customClaims = userDoc.customClaims || {};
      
      // Add role to user object
      req.user.role = customClaims.role || 'user';
    } catch (error) {
      // If we can't get user data from Firestore, still allow the request
      // but log the error
      console.error('Error getting user data from Firestore:', error);
      req.user.role = 'user'; // Default to user role
    }
    
    return next();
  } catch (error: any) {
    // Handle different token verification errors
    if (error.code === 'auth/id-token-expired') {
      return next(createAuthenticationError('Unauthorized - Token expired'));
    }
    
    if (error.code === 'auth/id-token-revoked') {
      return next(createAuthenticationError('Unauthorized - Token revoked'));
    }
    
    if (error.code === 'auth/invalid-id-token') {
      return next(createAuthenticationError('Unauthorized - Invalid token'));
    }
    
    return next(createAuthenticationError('Unauthorized - Token verification failed'));
  }
}; 