import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTextGeneration } from '@fastshot/ai';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import { useFirebaseAuth } from '../../lib/firebase-auth-provider';
import { db } from '../../lib/firebase';
import { collection, addDoc, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { getUserProfile } from '../../utils/profile-storage';
import { UserProfile } from '../../types/profile';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface DateGroup {
  date: string;
  label: string;
  messages: Message[];
}

const SUGGESTION_CHIPS = [
  { text: 'Summarize my progress', icon: 'analytics' as const },
  { text: 'Update my goals', icon: 'trophy' as const },
  { text: 'Plan today\'s workout', icon: 'barbell' as const },
  { text: 'Nutrition tips', icon: 'restaurant' as const },
];

export default function CoachScreen() {
  const { user } = useFirebaseAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const { generateText, isLoading } = useTextGeneration({
    onSuccess: async (response) => {
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Save assistant message to database
      if (user) {
        await saveMessageToDatabase(assistantMessage);
      }

      // Haptic feedback for received message
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    onError: (error) => {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please check your connection and try again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      console.error('AI Error:', error);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
  });

  // Load chat history from database
  useEffect(() => {
    if (user) {
      loadChatHistory();
      loadProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const loadProfile = async () => {
    try {
      const profileData = await getUserProfile();
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadChatHistory = async () => {
    if (!user) return;

    try {
      setIsLoadingHistory(true);

      const q = query(
        collection(db, 'coach_messages'),
        where('user_id', '==', user.uid),
        orderBy('timestamp', 'asc')
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const loadedMessages: Message[] = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            role: data.role,
            content: data.content,
            timestamp: data.timestamp,
          };
        });
        setMessages(loadedMessages);
      } else {
        // First time user - show welcome message
        const welcomeMsg = getWelcomeMessage();
        setMessages([welcomeMsg]);
        await saveMessageToDatabase(welcomeMsg);
      }
    } catch (error) {
      console.error('Error in loadChatHistory:', error);
      setMessages([getWelcomeMessage()]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const getWelcomeMessage = (): Message => ({
    id: '0',
    role: 'assistant',
    content:
      "Hey! I'm your personal AI Coach with a memory like an elephant 🐘. I'll remember everything about your fitness journey - your goals, progress, challenges, and wins. Think of me as your premium 1-on-1 personal training concierge. Let's get started!",
    timestamp: Date.now(),
  });

  const saveMessageToDatabase = async (message: Message) => {
    if (!user) return;

    try {
      await addDoc(collection(db, 'coach_messages'), {
        user_id: user.uid,
        role: message.role,
        content: message.content,
        timestamp: message.timestamp,
        user_context: profile
          ? {
              age: profile.age,
              weight: profile.weight,
              height: profile.height,
              goals: profile.fitnessGoal,
              activity_level: profile.activityLevel,
              financial_status: profile.financialStatus,
              daily_calories: profile.daily_calorie_goal,
            }
          : null,
        created_at: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error in saveMessageToDatabase:', error);
    }
  };

  const buildContextPrompt = (): string => {
    if (!profile) return '';

    const contextParts = [
      `\n\n=== USER PROFILE & CONTEXT ===`,
      `Name: ${user?.email?.split('@')[0] || 'User'}`,
      `Age: ${profile.age || 'Unknown'} years`,
      `Weight: ${profile.weight || 'Unknown'} kg`,
      `Height: ${profile.height || 'Unknown'} cm`,
      `Fitness Goal: ${profile.fitnessGoal || 'Not set'}`,
      `Activity Level: ${profile.activityLevel || 'Unknown'}`,
      `Budget: ${profile.financialStatus || 'Unknown'}`,
      `Daily Calorie Goal: ${profile.daily_calorie_goal || 'Unknown'} cal`,
      `\n=== CONVERSATION HISTORY (Last 10 messages) ===`,
    ];

    // Add last 10 messages for context
    const recentMessages = messages.slice(-10);
    recentMessages.forEach((msg) => {
      contextParts.push(`${msg.role === 'user' ? 'User' : 'Coach'}: ${msg.content}`);
    });

    return contextParts.join('\n');
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');

    // Save user message to database
    if (user) {
      await saveMessageToDatabase(userMessage);
    }

    // Build comprehensive context for AI
    const contextPrompt = buildContextPrompt();

    const systemPrompt = `You are a premium AI Fitness Coach with deep memory and context awareness. You remember EVERYTHING about this user's journey.

YOUR COACHING STYLE:
- Proactive & Personal: Reference past conversations, celebrate progress, acknowledge challenges
- Budget-Conscious: Focus on home workouts and affordable nutrition
- Contextual: Always consider their profile, goals, and history
- Encouraging: Be supportive but honest
- Concise: Keep responses 2-3 short paragraphs max

MEMORY GUIDELINES:
- Reference specific past events ("Remember when you mentioned...")
- Celebrate milestones and streaks
- Notice patterns in their behavior
- Adapt advice based on their progress

AREAS OF EXPERTISE:
- Home-based bodyweight exercises (no gym needed)
- Budget nutrition (affordable protein, meal prep under $50/week)
- Progress tracking and goal setting
- Motivation and mental strategies
${contextPrompt}

User's new message: ${userMessage.content}

Respond as their personal coach who truly knows them:`;

    await generateText(systemPrompt);
  };

  const handleQuickAction = (text: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setInputText(text);
  };

  // Group messages by date
  const groupMessagesByDate = (): DateGroup[] => {
    const groups: { [key: string]: Message[] } = {};

    messages.forEach((msg) => {
      const date = new Date(msg.timestamp);
      const dateKey = date.toISOString().split('T')[0];

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(msg);
    });

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    return Object.keys(groups)
      .sort()
      .map((dateKey) => {
        let label = 'Older';
        if (dateKey === today) label = 'Today';
        else if (dateKey === yesterday) label = 'Yesterday';
        else {
          const date = new Date(dateKey);
          const daysDiff = Math.floor((Date.now() - date.getTime()) / 86400000);
          if (daysDiff <= 7) label = 'Last Week';
        }

        return {
          date: dateKey,
          label,
          messages: groups[dateKey],
        };
      });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  if (isLoadingHistory) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingText}>Loading your conversation...</Text>
        </View>
      </View>
    );
  }

  const dateGroups = groupMessagesByDate();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar style="light" />

      {/* Premium Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.coachBadge}>
            <Ionicons name="sparkles" size={20} color={Colors.background} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>AI COACH</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.subtitle}>Always remembering • Always learning</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {dateGroups.map((group) => (
          <View key={group.date}>
            {/* Date Separator */}
            <View style={styles.dateSeparator}>
              <View style={styles.dateLine} />
              <Text style={styles.dateLabel}>{group.label}</Text>
              <View style={styles.dateLine} />
            </View>

            {/* Messages in this date group */}
            {group.messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                isLast={index === group.messages.length - 1}
                formatTime={formatTime}
              />
            ))}
          </View>
        ))}

        {/* Typing Indicator */}
        {isLoading && <TypingIndicator />}
      </ScrollView>

      {/* Quick Action Chips */}
      {!isLoading && (
        <ScrollView
          horizontal
          style={styles.chipsContainer}
          contentContainerStyle={styles.chipsContent}
          showsHorizontalScrollIndicator={false}
        >
          {SUGGESTION_CHIPS.map((chip, index) => (
            <TouchableOpacity
              key={index}
              style={styles.chip}
              onPress={() => handleQuickAction(chip.text)}
            >
              <Ionicons name={chip.icon} size={16} color={Colors.accent} />
              <Text style={styles.chipText}>{chip.text}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Message your coach..."
          placeholderTextColor={Colors.textSecondary}
          multiline
          maxLength={500}
          editable={!isLoading}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || isLoading}
        >
          <Ionicons
            name="send"
            size={20}
            color={!inputText.trim() || isLoading ? Colors.textSecondary : Colors.background}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// Message Bubble Component with Animation
const MessageBubble: React.FC<{
  message: Message;
  isLast: boolean;
  formatTime: (timestamp: number) => string;
}> = ({ message, isLast, formatTime }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (isLast) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLast]);

  const animatedStyle = isLast
    ? {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }
    : {};

  return (
    <Animated.View
      style={[
        styles.messageWrapper,
        message.role === 'user' ? styles.userMessageWrapper : styles.assistantMessageWrapper,
        animatedStyle,
      ]}
    >
      {message.role === 'assistant' && (
        <View style={styles.coachAvatar}>
          <Ionicons name="sparkles" size={16} color={Colors.background} />
        </View>
      )}
      <View
        style={[
          styles.messageBubble,
          message.role === 'user' ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            message.role === 'user' ? styles.userText : styles.assistantText,
          ]}
        >
          {message.content}
        </Text>
        <Text
          style={[
            styles.messageTime,
            message.role === 'user' ? styles.userTime : styles.assistantTime,
          ]}
        >
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </Animated.View>
  );
};

// Typing Indicator Component
const TypingIndicator: React.FC = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: -8,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animate(dot1, 0);
    animate(dot2, 150);
    animate(dot3, 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.typingContainer}>
      <View style={styles.coachAvatar}>
        <Ionicons name="sparkles" size={16} color={Colors.background} />
      </View>
      <View style={styles.typingBubble}>
        <View style={styles.typingDots}>
          <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot1 }] }]} />
          <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot2 }] }]} />
          <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot3 }] }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    ...Fonts.body,
  },
  header: {
    paddingTop: Spacing.xxl + 20,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  coachBadge: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    color: Colors.textPrimary,
    ...Fonts.heading,
    letterSpacing: 2,
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    ...Fonts.body,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dateLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    ...Fonts.data,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  messageWrapper: {
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
  },
  assistantMessageWrapper: {
    justifyContent: 'flex-start',
  },
  coachAvatar: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  userBubble: {
    backgroundColor: Colors.accent,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: Colors.cardBg,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    ...Fonts.body,
  },
  userText: {
    color: Colors.background,
  },
  assistantText: {
    color: Colors.textPrimary,
  },
  messageTime: {
    fontSize: 10,
    marginTop: Spacing.xs,
    ...Fonts.body,
  },
  userTime: {
    color: `${Colors.background}CC`,
    textAlign: 'right',
  },
  assistantTime: {
    color: Colors.textSecondary,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  typingBubble: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  chipsContainer: {
    maxHeight: 50,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  chipsContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.cardBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: {
    fontSize: 13,
    color: Colors.textPrimary,
    ...Fonts.body,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? Spacing.lg : Spacing.md,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 15,
    color: Colors.textPrimary,
    ...Fonts.body,
    maxHeight: 100,
    marginRight: Spacing.sm,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.cardBg,
    opacity: 0.5,
    shadowOpacity: 0,
  },
});
