import { Request, Response, NextFunction } from 'express';
import { auth, firestore } from '../firebase/admin';
import { createAuthenticationError, createNotFoundError, createBadRequestError } from '../middleware/errorHandler';

// Collection reference
const usersCollection = firestore.collection('users');

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    if (!email || !password) {
      return next(createBadRequestError('Email and password are required'));
    }
    
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `${firstName || ''} ${lastName || ''}`.trim(),
      disabled: false
    });
    
    // Create user profile in Firestore
    await usersCollection.doc(userRecord.uid).set({
      email,
      firstName: firstName || '',
      lastName: lastName || '',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: {
        language: 'he',
        theme: 'light',
        notifications: true
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully'
    });
  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
      return next(createBadRequestError('Email already in use'));
    }
    
    if (error.code === 'auth/invalid-email') {
      return next(createBadRequestError('Invalid email format'));
    }
    
    if (error.code === 'auth/weak-password') {
      return next(createBadRequestError('Password is too weak'));
    }
    
    next(error);
  }
};

/**
 * Login user
 * Note: In a real application, authentication would typically be handled
 * by Firebase client SDK or another auth provider, not by the server.
 * This is a simplified version for illustration purposes.
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Note: This is a placeholder. In a real app, you would use Firebase client SDK
    // or another authentication provider to handle login.
    res.status(200).json({
      success: true,
      message: 'Login should be handled by Firebase client SDK'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return next(createBadRequestError('Email is required'));
    }
    
    // Get user by email
    const userRecord = await auth.getUserByEmail(email);
    
    // Generate password reset link
    const resetLink = await auth.generatePasswordResetLink(email);
    
    // In a real application, you would send this link via email
    // Here we just return success
    
    res.status(200).json({
      success: true,
      message: 'Password reset instructions sent to email'
    });
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      // For security reasons, still return success even if user not found
      return res.status(200).json({
        success: true,
        message: 'If a user with this email exists, password reset instructions have been sent'
      });
    }
    
    next(error);
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Note: This is a placeholder. Password reset is typically handled
    // by Firebase client SDK or a dedicated page
    
    res.status(200).json({
      success: true,
      message: 'Password reset should be handled by Firebase'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    
    if (!userId) {
      return next(createAuthenticationError('User not authenticated'));
    }
    
    // Get user profile from Firestore
    const userDoc = await usersCollection.doc(userId).get();
    
    if (!userDoc.exists) {
      return next(createNotFoundError('User profile not found'));
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: userDoc.id,
        ...userDoc.data()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user profile
 */
export const updateCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    const updateData = req.body;
    
    if (!userId) {
      return next(createAuthenticationError('User not authenticated'));
    }
    
    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.email; // Email should be updated separately
    delete updateData.role; // Role should be updated by admin only
    delete updateData.createdAt;
    
    // Add updatedAt timestamp
    updateData.updatedAt = new Date();
    
    // Update user profile in Firestore
    await usersCollection.doc(userId).update(updateData);
    
    // Update display name in Auth if provided
    if (updateData.firstName || updateData.lastName) {
      const userDoc = await usersCollection.doc(userId).get();
      const userData = userDoc.data();
      
      const firstName = updateData.firstName || userData?.firstName || '';
      const lastName = updateData.lastName || userData?.lastName || '';
      
      await auth.updateUser(userId, {
        displayName: `${firstName} ${lastName}`.trim()
      });
    }
    
    // Get the updated document
    const updatedUserDoc = await usersCollection.doc(userId).get();
    
    res.status(200).json({
      success: true,
      data: {
        id: updatedUserDoc.id,
        ...updatedUserDoc.data()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 */
export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    const { newPassword } = req.body;
    
    if (!userId) {
      return next(createAuthenticationError('User not authenticated'));
    }
    
    if (!newPassword) {
      return next(createBadRequestError('New password is required'));
    }
    
    // Update password in Firebase Auth
    await auth.updateUser(userId, {
      password: newPassword
    });
    
    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error: any) {
    if (error.code === 'auth/weak-password') {
      return next(createBadRequestError('Password is too weak'));
    }
    
    next(error);
  }
};

/**
 * Update user settings
 */
export const updateUserSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    const { settings } = req.body;
    
    if (!userId) {
      return next(createAuthenticationError('User not authenticated'));
    }
    
    if (!settings || typeof settings !== 'object') {
      return next(createBadRequestError('Settings object is required'));
    }
    
    // Get current user document
    const userDoc = await usersCollection.doc(userId).get();
    
    if (!userDoc.exists) {
      return next(createNotFoundError('User profile not found'));
    }
    
    const userData = userDoc.data();
    
    // Merge existing settings with new settings
    const updatedSettings = {
      ...userData?.settings,
      ...settings,
    };
    
    // Update user settings in Firestore
    await usersCollection.doc(userId).update({
      settings: updatedSettings,
      updatedAt: new Date()
    });
    
    // Get the updated document
    const updatedUserDoc = await usersCollection.doc(userId).get();
    
    res.status(200).json({
      success: true,
      data: {
        id: updatedUserDoc.id,
        ...updatedUserDoc.data()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users (admin only)
 */
export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get all users from Firestore
    const snapshot = await usersCollection.get();
    
    // Format results
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID (admin only)
 */
export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.id;
    
    // Get user profile from Firestore
    const userDoc = await usersCollection.doc(userId).get();
    
    if (!userDoc.exists) {
      return next(createNotFoundError('User not found'));
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: userDoc.id,
        ...userDoc.data()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new user (admin only)
 */
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    
    if (!email || !password) {
      return next(createBadRequestError('Email and password are required'));
    }
    
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `${firstName || ''} ${lastName || ''}`.trim(),
      disabled: false
    });
    
    // Create user profile in Firestore
    await usersCollection.doc(userRecord.uid).set({
      email,
      firstName: firstName || '',
      lastName: lastName || '',
      role: role || 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: {
        language: 'he',
        theme: 'light',
        notifications: true
      }
    });
    
    // Get the created user
    const userDoc = await usersCollection.doc(userRecord.uid).get();
    
    res.status(201).json({
      success: true,
      data: {
        id: userDoc.id,
        ...userDoc.data()
      }
    });
  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
      return next(createBadRequestError('Email already in use'));
    }
    
    if (error.code === 'auth/invalid-email') {
      return next(createBadRequestError('Invalid email format'));
    }
    
    if (error.code === 'auth/weak-password') {
      return next(createBadRequestError('Password is too weak'));
    }
    
    next(error);
  }
};

/**
 * Update a user (admin only)
 */
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;
    
    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.email; // Email should be updated separately
    delete updateData.createdAt;
    
    // Add updatedAt timestamp
    updateData.updatedAt = new Date();
    
    // Update user profile in Firestore
    await usersCollection.doc(userId).update(updateData);
    
    // Update display name in Auth if provided
    if (updateData.firstName || updateData.lastName) {
      const userDoc = await usersCollection.doc(userId).get();
      const userData = userDoc.data();
      
      const firstName = updateData.firstName || userData?.firstName || '';
      const lastName = updateData.lastName || userData?.lastName || '';
      
      await auth.updateUser(userId, {
        displayName: `${firstName} ${lastName}`.trim()
      });
    }
    
    // Get the updated document
    const updatedUserDoc = await usersCollection.doc(userId).get();
    
    res.status(200).json({
      success: true,
      data: {
        id: updatedUserDoc.id,
        ...updatedUserDoc.data()
      }
    });
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      return next(createNotFoundError('User not found'));
    }
    
    next(error);
  }
};

/**
 * Delete a user (admin only)
 */
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.id;
    
    // Delete user from Firebase Auth
    await auth.deleteUser(userId);
    
    // Delete user profile from Firestore
    await usersCollection.doc(userId).delete();
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      return next(createNotFoundError('User not found'));
    }
    
    next(error);
  }
};

/**
 * Update user role (admin only)
 */
export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;
    
    if (!role || !['user', 'admin'].includes(role)) {
      return next(createBadRequestError('Valid role is required (user, admin)'));
    }
    
    // Update user role in Firestore
    await usersCollection.doc(userId).update({
      role,
      updatedAt: new Date()
    });
    
    // Get the updated document
    const updatedUserDoc = await usersCollection.doc(userId).get();
    
    res.status(200).json({
      success: true,
      data: {
        id: updatedUserDoc.id,
        ...updatedUserDoc.data()
      }
    });
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      return next(createNotFoundError('User not found'));
    }
    
    next(error);
  }
};

/**
 * Update user status (admin only)
 */
export const updateUserStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.id;
    const { disabled } = req.body;
    
    if (typeof disabled !== 'boolean') {
      return next(createBadRequestError('Disabled status must be a boolean'));
    }
    
    // Update user status in Firebase Auth
    await auth.updateUser(userId, { disabled });
    
    // Update status in Firestore
    await usersCollection.doc(userId).update({
      disabled,
      updatedAt: new Date()
    });
    
    // Get the updated document
    const updatedUserDoc = await usersCollection.doc(userId).get();
    
    res.status(200).json({
      success: true,
      data: {
        id: updatedUserDoc.id,
        ...updatedUserDoc.data()
      }
    });
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      return next(createNotFoundError('User not found'));
    }
    
    next(error);
  }
}; 