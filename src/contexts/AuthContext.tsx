import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, googleProvider } from '../lib/firebase';
import { db } from '../lib/firebase';
import { User, UserSubscription } from '../types';

interface AuthContextType {
  user: User | null;
  subscription: UserSubscription | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const refreshSubscription = async () => {
    if (!user) return;
    
    try {
      // Get user subscription
      const subscriptionDoc = await getDoc(doc(db, 'subscriptions', user.uid));
      if (subscriptionDoc.exists()) {
        const subData = subscriptionDoc.data();
        setSubscription({
          id: subscriptionDoc.id,
          ...subData,
          startDate: subData.startDate.toDate(),
          endDate: subData.endDate.toDate(),
          createdAt: subData.createdAt.toDate(),
        } as UserSubscription);
      } else {
        // Create default free subscription
        const freeSubscription = {
          userId: user.uid,
          plan: 'free' as const,
          status: 'active' as const,
          startDate: Timestamp.now(),
          endDate: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days
          createdAt: Timestamp.now(),
        };
        
        await setDoc(doc(db, 'subscriptions', user.uid), freeSubscription);
        setSubscription({
          id: user.uid,
          ...freeSubscription,
          startDate: freeSubscription.startDate.toDate(),
          endDate: freeSubscription.endDate.toDate(),
          createdAt: freeSubscription.createdAt.toDate(),
        });
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get user profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          let userData = userDoc.data();
          
          // Create user profile if doesn't exist
          if (!userData) {
            userData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: 'normal',
              createdAt: Timestamp.now(),
              lastLogin: Timestamp.now(),
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), userData);
          } else {
            // Update last login
            await updateDoc(doc(db, 'users', firebaseUser.uid), {
              lastLogin: Timestamp.now()
            });
          }
          
          const userProfile: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            role: userData.role || 'normal',
            createdAt: userData.createdAt?.toDate(),
            lastLogin: userData.lastLogin?.toDate(),
          };
          
          setUser(userProfile);
          setIsAdmin(userData.role === 'master');
        } catch (error) {
          console.error('Error loading user profile:', error);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            role: 'normal',
          });
        }
      } else {
        setUser(null);
        setSubscription(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user && !isAdmin) {
      refreshSubscription();
    }
  }, [user, isAdmin]);
  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName });
      
      // Create user profile in Firestore
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        displayName,
        photoURL: null,
        role: 'normal',
        createdAt: Timestamp.now(),
        lastLogin: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error signing up with email:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    user,
    subscription,
    loading,
    isAdmin,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    logout,
    refreshSubscription,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};