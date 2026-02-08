import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { useRouter, useSegments } from 'expo-router';
import { hasCompletedOnboarding } from '../utils/profile-storage';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

interface AuthError {
  message: string;
  code?: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  isLoading: boolean;
  error: AuthError | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface FirebaseAuthProviderProps {
  children: ReactNode;
  routes: {
    login: string;
    afterLogin: string;
  };
}

export function FirebaseAuthProvider({ children, routes }: FirebaseAuthProviderProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const router = useRouter();
  const segments = useSegments();

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsInitializing(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle navigation based on auth state
  useEffect(() => {
    if (isInitializing) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === 'onboarding';

    async function checkAndNavigate() {
      try {
        if (!user && !inAuthGroup) {
          // User is not authenticated and not in auth screens
          router.replace(routes.login as any);
        } else if (user && inAuthGroup) {
          // User is authenticated but still in auth screens, check onboarding
          try {
            const completed = await hasCompletedOnboarding();
            if (!completed) {
              router.replace('/onboarding' as any);
            } else {
              router.replace(routes.afterLogin as any);
            }
          } catch (firestoreError: any) {
            // If Firestore fails, assume onboarding not completed and proceed to onboarding
            console.warn('Firestore permission error, redirecting to onboarding:', firestoreError);
            router.replace('/onboarding' as any);
          }
        } else if (user && !inOnboardingGroup) {
          // User is authenticated and not in onboarding, check if they need to complete it
          try {
            const completed = await hasCompletedOnboarding();
            if (!completed) {
              router.replace('/onboarding' as any);
            }
          } catch (firestoreError: any) {
            // If Firestore fails, redirect to onboarding to be safe
            console.warn('Firestore permission error, redirecting to onboarding:', firestoreError);
            router.replace('/onboarding' as any);
          }
        }
      } catch (error: any) {
        console.error('Navigation error:', error);
        setError({ message: 'Navigation failed. Please try again.', code: error?.code });
      }
    }

    checkAndNavigate();
  }, [user, segments, isInitializing]);

  const handleSignInWithEmail = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);

      // Trigger success haptic feedback
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      const errorMessage = getFirebaseErrorMessage(err.code);
      setError({ message: errorMessage, code: err.code });

      // Trigger error haptic feedback
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpWithEmail = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // Create user profile in Firestore (with error handling)
      try {
        await setDoc(doc(db, 'user_profiles', newUser.uid), {
          email: newUser.email,
          daily_calorie_goal: 2500,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          onboarding_completed: false,
        });
      } catch (firestoreError) {
        console.warn('Failed to create user profile in Firestore:', firestoreError);
        // Don't fail signup if Firestore fails - user can complete profile during onboarding
      }

      setUser(newUser);

      // Trigger success haptic feedback
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      const errorMessage = getFirebaseErrorMessage(err.code);
      setError({ message: errorMessage, code: err.code });

      // Trigger error haptic feedback
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signOut(auth);
      setUser(null);
      router.replace(routes.login as any);
    } catch (err: any) {
      const errorMessage = getFirebaseErrorMessage(err.code);
      setError({ message: errorMessage, code: err.code });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    error,
    signInWithEmail: handleSignInWithEmail,
    signUpWithEmail: handleSignUpWithEmail,
    signOut: handleSignOut,
  };

  // Show nothing while initializing
  if (isInitializing) {
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useFirebaseAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }
  return context;
}

function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Invalid email address format';
    case 'auth/user-disabled':
      return 'This account has been disabled';
    case 'auth/user-not-found':
      return 'No account found with this email';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later';
    case 'auth/invalid-credential':
      return 'Invalid email or password';
    default:
      return 'An error occurred. Please try again';
  }
}
