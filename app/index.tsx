import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import { auth } from '../lib/firebase';
import { hasCompletedOnboarding } from '../utils/profile-storage';
import { Colors } from '../constants/theme';
import * as Haptics from 'expo-haptics';

export default function Index() {
  const [isChecking, setIsChecking] = useState(true);
  const [destination, setDestination] = useState<string | null>(null);
  const fadeAnim = useState(new Animated.Value(1))[0];

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
            // Haptic feedback for returning user
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          } else {
            setDestination('/onboarding');
          }
        }
      } catch (error) {
        console.error('Error determining destination:', error);
        setDestination('/(auth)/login');
      } finally {
        // Smooth fade out before navigation
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setIsChecking(false);
        });
      }
    }

    // Allow minimal time for auth initialization
    const timeout = setTimeout(determineDestination, 50);
    return () => clearTimeout(timeout);
  }, [fadeAnim]);

  if (isChecking || !destination) {
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {/* Splash screen with Pro Athlete aesthetic */}
        <View style={styles.logoContainer}>
          <View style={styles.logoPulse} />
        </View>
      </Animated.View>
    );
  }

  return <Redirect href={destination as any} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPulse: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.accent,
    opacity: 0.6,
  },
});
