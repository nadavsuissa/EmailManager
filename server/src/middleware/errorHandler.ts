import { Request, Response, NextFunction } from 'express';

// Custom error classes
export class HttpError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends HttpError {
  constructor(message: string) {
    super(message, 401);
  }
}

export class AuthorizationError extends HttpError {
  constructor(message: string) {
    super(message, 403);
  }
}

export class ValidationError extends HttpError {
  errors: Record<string, string>;
  
  constructor(message: string, errors: Record<string, string>) {
    super(message, 422);
    this.errors = errors;
  }
}

// Helper functions to create errors
export const createNotFoundError = (message: string) => new NotFoundError(message);
export const createBadRequestError = (message: string) => new BadRequestError(message);
export const createAuthenticationError = (message: string) => new AuthenticationError(message);
export const createAuthorizationError = (message: string) => new AuthorizationError(message);
export const createValidationError = (message: string, errors: Record<string, string>) => new ValidationError(message, errors);

/**
 * Global error handling middleware
 */
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log error for debugging
  console.error(`[Error] ${err.stack || err.message}`);
  
  // Handle HttpError instances
  if (err instanceof HttpError) {
    // For validation errors, include the validation errors object
    if (err instanceof ValidationError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
        errors: err.errors
      });
    }
    
    // For other HttpErrors, just include the message
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }
  
  // Handle Firebase auth errors
  if (err.name === 'FirebaseAuthError' || err.name === 'FirebaseError') {
    const firebaseError = err as any;
    
    switch (firebaseError.code) {
      case 'auth/invalid-email':
      case 'auth/weak-password':
      case 'auth/email-already-exists':
      case 'auth/invalid-password':
        return res.status(400).json({
          success: false,
          message: firebaseError.message
        });
        
      case 'auth/id-token-expired':
      case 'auth/id-token-revoked':
      case 'auth/invalid-id-token':
      case 'auth/user-not-found':
        return res.status(401).json({
          success: false,
          message: 'Authentication failed'
        });
        
      case 'auth/insufficient-permission':
      case 'auth/forbidden-claim':
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to perform this action'
        });
    }
  }
  
  // Handle all other errors as 500 Internal Server Error
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message || 'Internal Server Error'
  });
};

// Catch unhandled promise rejections
export const setupUncaughtExceptionHandlers = () => {
  process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(err.name, err.message, err.stack);
    process.exit(1);
  });

  process.on('unhandledRejection', (err: any) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message, err.stack);
    process.exit(1);
  });
}; 