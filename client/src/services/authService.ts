import axios from 'axios';
import { User, UserCredentials, RegisterCredentials } from '../types/user';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

// API URL from environment
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
  const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
  };
  
  firebase.initializeApp(firebaseConfig);
}

/**
 * Login using email and password
 */
export const loginWithEmailPassword = async (credentials: UserCredentials): Promise<User> => {
  try {
    // Firebase authentication
    const userCredential = await firebase.auth().signInWithEmailAndPassword(
      credentials.email,
      credentials.password
    );
    
    if (!userCredential.user) {
      throw new Error('Authentication failed');
    }
    
    // Get ID token for API call
    const idToken = await userCredential.user.getIdToken();
    
    // Set auth header
    axios.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;
    
    // Get user data from our API
    const response = await axios.get(`${API_URL}/users/me`);
    
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Authentication failed');
  }
};

/**
 * Login with Google
 */
export const loginWithGoogle = async (): Promise<User> => {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    // Set language to Hebrew
    provider.setCustomParameters({
      'lang': 'he'
    });
    
    // Firebase authentication
    const userCredential = await firebase.auth().signInWithPopup(provider);
    
    if (!userCredential.user) {
      throw new Error('Authentication failed');
    }
    
    // Get ID token for API call
    const idToken = await userCredential.user.getIdToken();
    
    // Set auth header
    axios.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;
    
    // Get user data from our API
    const response = await axios.get(`${API_URL}/users/me`);
    
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Authentication failed');
  }
};

/**
 * Register a new user
 */
export const registerUser = async (userData: RegisterCredentials): Promise<User> => {
  try {
    // Create user in Firebase
    const userCredential = await firebase.auth().createUserWithEmailAndPassword(
      userData.email,
      userData.password
    );
    
    if (!userCredential.user) {
      throw new Error('Registration failed');
    }
    
    // Update the user's display name
    await userCredential.user.updateProfile({
      displayName: userData.displayName,
    });
    
    // Get ID token for API call
    const idToken = await userCredential.user.getIdToken();
    
    // Set auth header
    axios.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;
    
    // Create user in our database
    const { password, ...userDataWithoutPassword } = userData;
    const response = await axios.post(`${API_URL}/users`, userDataWithoutPassword);
    
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Registration failed');
  }
};

/**
 * Reset password
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await firebase.auth().sendPasswordResetEmail(email);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Password reset failed');
  }
};

/**
 * Log out
 */
export const logout = async (): Promise<void> => {
  try {
    await firebase.auth().signOut();
    delete axios.defaults.headers.common['Authorization'];
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Logout failed');
  }
};

/**
 * Get current user
 */
export const getCurrentUser = async (): Promise<User | null> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
      unsubscribe();
      
      if (user) {
        try {
          // Get ID token for API call
          const idToken = await user.getIdToken();
          
          // Set auth header
          axios.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;
          
          // Get user data from our API
          const response = await axios.get(`${API_URL}/users/me`);
          resolve(response.data);
        } catch (error) {
          reject(error);
        }
      } else {
        resolve(null);
      }
    }, reject);
  });
};

/**
 * Change password
 */
export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  try {
    const user = firebase.auth().currentUser;
    
    if (!user || !user.email) {
      throw new Error('User not found');
    }
    
    // Reauthenticate user
    const credential = firebase.auth.EmailAuthProvider.credential(
      user.email,
      currentPassword
    );
    
    await user.reauthenticateWithCredential(credential);
    
    // Change password
    await user.updatePassword(newPassword);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Password change failed');
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userData: Partial<User>): Promise<User> => {
  try {
    const response = await axios.put(`${API_URL}/users/me`, userData);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Profile update failed');
  }
};

/**
 * Delete user account
 */
export const deleteUserAccount = async (): Promise<void> => {
  try {
    const user = firebase.auth().currentUser;
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Delete user data from our API
    await axios.delete(`${API_URL}/users/me`);
    
    // Delete Firebase user
    await user.delete();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Account deletion failed');
  }
}; 