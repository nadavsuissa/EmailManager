import { Request, Response, NextFunction } from 'express';
import { auth } from '../firebase/admin';
import { createAuthenticationError, createAuthorizationError } from './errorHandler';

// Extend the Express Request interface to include the user object
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
        role?: string;
        name?: string;
      };
    }
  }
}

/**
 * Authentication middleware using Firebase Auth
 * Validates the JWT token from the Authorization header
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next(createAuthenticationError('No authentication token provided'));
    }

    // Format should be "Bearer <token>"
    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(createAuthenticationError('Invalid token format'));
    }

    try {
      // Verify the token with Firebase Auth
      const decodedToken = await auth.verifyIdToken(token);
      
      // Attach the user information to the request object
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        // Add any other user properties you need
        name: decodedToken.name || '',
        role: decodedToken.role || 'user'
      };
      
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return next(createAuthenticationError('Invalid or expired token'));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based authorization middleware
 * Use this after the authMiddleware to check for specific roles
 * @param allowedRoles - Array of roles allowed to access the resource
 */
export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if user exists (should be added by authMiddleware)
    if (!req.user) {
      return next(createAuthenticationError('User not authenticated'));
    }

    // Check if user has one of the allowed roles
    const userRole = req.user.role || 'user';
    if (!allowedRoles.includes(userRole)) {
      return next(createAuthorizationError(`Access denied. Required role: ${allowedRoles.join(' or ')}`));
    }

    // User has the required role
    next();
  };
}; 