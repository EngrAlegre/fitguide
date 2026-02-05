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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTextGeneration } from '@fastshot/ai';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const SYSTEM_PROMPT = `You are an elite AI fitness coach and personal trainer with expertise in:
- Personalized workout programming and periodization
- Exercise form and technique optimization
- Nutrition and meal planning for various fitness goals
- Recovery strategies and injury prevention
- Performance enhancement and motivation

Your coaching style is:
- Professional yet encouraging and supportive
- Evidence-based with practical, actionable advice
- Adaptive to all fitness levels from beginners to advanced athletes
- Focused on sustainable, long-term health and fitness

Always provide specific, detailed guidance. When discussing exercises, explain proper form. When advising on nutrition, give practical meal ideas. Keep responses concise but comprehensive.`;

export default function CoachScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content:
        "Welcome to Fitguide! I'm your Newell AI Coach, ready to help you reach your goals. Ask me for workout tips, nutrition advice, or just some motivation.",
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const { generateText, isLoading } = useTextGeneration({
    onSuccess: (response) => {
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
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
    },
  });

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');

    // Build conversation history
    const conversationHistory = messages
      .slice(-6) // Last 6 messages for context
      .map((msg) => `${msg.role === 'user' ? 'User' : 'Coach'}: ${msg.content}`)
      .join('\n\n');

    const fullPrompt = `${SYSTEM_PROMPT}

Previous conversation:
${conversationHistory}

User: ${userMessage.content}

Coach:`;

    await generateText(fullPrompt);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const quickPrompts = [
    'Give me a beginner workout plan',
    'What should I eat post-workout?',
    'How do I improve my running form?',
    'I need motivation to work out',
  ];

  const handleQuickPrompt = (prompt: string) => {
    setInputText(prompt);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Ionicons name="fitness" size={24} color={Colors.accent} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>NEWELL AI COACH</Text>
            <Text style={styles.subtitle}>Powered by Newell AI Gateway</Text>
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
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageWrapper,
              message.role === 'user' ? styles.userMessageWrapper : styles.assistantMessageWrapper,
            ]}
          >
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
          </View>
        ))}

        {isLoading && (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingBubble}>
              <ActivityIndicator color={Colors.accent} />
              <Text style={styles.loadingText}>Coach is typing...</Text>
            </View>
          </View>
        )}

        {/* Quick Prompts (only show if no messages except welcome) */}
        {messages.length === 1 && (
          <View style={styles.quickPromptsContainer}>
            <Text style={styles.quickPromptsTitle}>Try asking:</Text>
            {quickPrompts.map((prompt, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickPrompt}
                onPress={() => handleQuickPrompt(prompt)}
              >
                <Text style={styles.quickPromptText}>{prompt}</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.accent} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your message..."
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: Spacing.xxl + 20,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: `${Colors.accent}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    color: Colors.textPrimary,
    ...Fonts.heading,
    letterSpacing: 1,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
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
  messageWrapper: {
    marginBottom: Spacing.md,
  },
  userMessageWrapper: {
    alignItems: 'flex-end',
  },
  assistantMessageWrapper: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
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
  loadingContainer: {
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  loadingBubble: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    ...Fonts.body,
  },
  quickPromptsContainer: {
    marginTop: Spacing.lg,
  },
  quickPromptsTitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    ...Fonts.data,
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  quickPrompt: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickPromptText: {
    fontSize: 14,
    color: Colors.textPrimary,
    ...Fonts.body,
    flex: 1,
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
  },
  sendButtonDisabled: {
    backgroundColor: Colors.cardBg,
    opacity: 0.5,
  },
});
