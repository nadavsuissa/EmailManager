import { Request, Response, NextFunction } from 'express';
import { createAuthorizationError } from './errorHandler';

/**
 * Middleware to check if user has the specified role
 * Must be used after the authentication middleware
 * 
 * @param role Required role to access the route
 */
export const checkRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // First check if user is authenticated and req.user exists
    if (!req.user) {
      return next(createAuthorizationError('Access denied - Authentication required'));
    }
    
    // Check if user has the required role
    if (req.user.role !== role) {
      return next(createAuthorizationError(`Access denied - Requires ${role} role`));
    }
    
    // User has the required role, proceed
    next();
  };
};

/**
 * Middleware to check if user has one of the specified roles
 * Must be used after the authentication middleware
 * 
 * @param roles Array of allowed roles to access the route
 */
export const checkRoles = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // First check if user is authenticated and req.user exists
    if (!req.user) {
      return next(createAuthorizationError('Access denied - Authentication required'));
    }
    
    // Check if user has one of the required roles
    if (!req.user.role || !roles.includes(req.user.role)) {
      return next(createAuthorizationError(`Access denied - Requires one of these roles: ${roles.join(', ')}`));
    }
    
    // User has one of the required roles, proceed
    next();
  };
};

/**
 * Middleware to check if user is the owner of the resource or has admin role
 * Must be used after the authentication middleware
 * 
 * @param getUserId Function that returns the owner ID of the resource from the request
 */
export const checkOwnerOrAdmin = (getUserId: (req: Request) => string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // First check if user is authenticated and req.user exists
    if (!req.user) {
      return next(createAuthorizationError('Access denied - Authentication required'));
    }
    
    // If user is admin, allow access
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Check if user is the owner of the resource
    const ownerId = getUserId(req);
    
    if (req.user.uid !== ownerId) {
      return next(createAuthorizationError('Access denied - Not the owner of this resource'));
    }
    
    // User is the owner, proceed
    next();
  };
}; 