import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Link } from 'expo-router';
import { useFirebaseAuth } from '../../lib/firebase-auth-provider';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const { signInWithEmail, isLoading, error } = useFirebaseAuth();

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setLocalError('Please enter email and password');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      setLocalError(null);
      await signInWithEmail(email, password);
      // Success haptic is handled in the auth provider
    } catch (err) {
      // Error is already handled by auth provider (state + haptics)
      console.log('Sign in failed:', err);
    }
  };

  // Clear errors when user starts typing
  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (localError || error) {
      setLocalError(null);
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (localError || error) {
      setLocalError(null);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="fitness" size={48} color={Colors.accent} />
          </View>
          <Text style={styles.logo}>FITGUIDE</Text>
          <Text style={styles.tagline}>Your Budget-Friendly Fitness Journey</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue your fitness journey</Text>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={Colors.textSecondary}
                value={email}
                onChangeText={handleEmailChange}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={Colors.textSecondary}
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry={!showPassword}
                autoComplete="password"
                editable={!isLoading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Error Message */}
          {(error || localError) && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color={Colors.error} />
              <Text style={styles.errorText}>{localError || error?.message}</Text>
            </View>
          )}

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.signInButton, isLoading && styles.signInButtonDisabled]}
            onPress={handleEmailLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={Colors.background} size="small" />
                <Text style={[styles.signInButtonText, { marginLeft: Spacing.sm }]}>
                  SIGNING IN...
                </Text>
              </View>
            ) : (
              <Text style={styles.signInButtonText}>SIGN IN</Text>
            )}
          </TouchableOpacity>

          {/* Links */}
          <View style={styles.linksContainer}>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity>
                <Text style={styles.linkText}>
                  Don&apos;t have an account? <Text style={styles.linkTextBold}>Sign Up</Text>
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Track workouts • Log meals • Get AI-powered advice
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.full,
    backgroundColor: `${Colors.accent}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  logo: {
    fontSize: 36,
    color: Colors.accent,
    ...Fonts.heading,
    letterSpacing: 3,
    marginBottom: Spacing.xs,
  },
  tagline: {
    fontSize: 14,
    color: Colors.textSecondary,
    ...Fonts.body,
  },
  formSection: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 28,
    color: Colors.textPrimary,
    ...Fonts.heading,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    ...Fonts.body,
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 12,
    color: Colors.textSecondary,
    ...Fonts.data,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    ...Fonts.body,
    paddingVertical: Spacing.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.error}20`,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: Colors.error,
    ...Fonts.body,
  },
  signInButton: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  signInButtonDisabled: {
    opacity: 0.6,
  },
  signInButtonText: {
    fontSize: 16,
    color: Colors.background,
    ...Fonts.heading,
    letterSpacing: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linksContainer: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  linkText: {
    fontSize: 14,
    color: Colors.textSecondary,
    ...Fonts.body,
  },
  linkTextBold: {
    color: Colors.accent,
    ...Fonts.heading,
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textSecondary,
    ...Fonts.body,
    textAlign: 'center',
  },
});
