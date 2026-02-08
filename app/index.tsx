import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { auth } from '../lib/firebase';
import { hasCompletedOnboarding } from '../utils/profile-storage';

export default function Index() {
  const [isChecking, setIsChecking] = useState(true);
  const [destination, setDestination] = useState<string>('/(auth)/login');

  useEffect(() => {
    async function determineDestination() {
      try {
        // Wait for auth to initialize
        const user = auth.currentUser;

        if (!user) {
          // Not authenticated
          setDestination('/(auth)/login');
        } else {
          // Authenticated - check onboarding status
          const completed = await hasCompletedOnboarding();
          if (completed) {
            setDestination('/(tabs)');
          } else {
            setDestination('/onboarding');
          }
        }
      } catch (error) {
        console.error('Error determining destination:', error);
        setDestination('/(auth)/login');
      } finally {
        setIsChecking(false);
      }
    }

    // Small delay to allow auth to initialize
    const timeout = setTimeout(determineDestination, 100);
    return () => clearTimeout(timeout);
  }, []);

  if (isChecking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Redirect href={destination as any} />;
}
