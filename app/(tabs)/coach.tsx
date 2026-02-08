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
  Image,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useTextGeneration, useImageAnalysis } from '@fastshot/ai';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import { useFirebaseAuth } from '../../lib/firebase-auth-provider';
import { db } from '../../lib/firebase';
import { collection, addDoc, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { getUserProfile } from '../../utils/profile-storage';
import { UserProfile } from '../../types/profile';
import {
  getCoachDataContext,
  generateProactiveMessage,
  RecentMeal,
  RecentActivity,
} from '../../services/coachDataService';
import MealCard from '../../components/coach/MealCard';
import ActivityCard from '../../components/coach/ActivityCard';
import ShareToCoachSheet from '../../components/coach/ShareToCoachSheet';
import { ChatHistorySkeletonLoader } from '../../components/coach/SkeletonLoader';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  imageUri?: string;
  attachedMeal?: RecentMeal;
  attachedActivity?: RecentActivity;
}

interface DateGroup {
  date: string;
  label: string;
  messages: Message[];
}

const SUGGESTION_CHIPS = [
  { text: 'How was my nutrition yesterday?', icon: 'analytics' as const },
  { text: 'Did I do enough cardio?', icon: 'bicycle' as const },
  { text: 'Plan today\'s workout', icon: 'barbell' as const },
  { text: 'Budget meal ideas', icon: 'restaurant' as const },
];

const VISION_ANALYSIS_PROMPT = `You are a nutrition and fitness expert AI coach. Analyze this image and provide detailed, personalized feedback.

If it's a meal/food:
- Identify the food items and estimate portion sizes
- Provide nutritional estimates (calories, protein, carbs, fats)
- Give coaching feedback on the meal quality and how it fits their goals
- Suggest improvements or complementary foods

If it's a workout form/posture:
- Analyze the form and posture
- Point out what's good and what needs improvement
- Provide specific tips to optimize the movement
- Mention safety considerations

Be conversational, supportive, and specific. Focus on actionable advice.`;

export default function CoachScreen() {
  const { user } = useFirebaseAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

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

  const { analyzeImage } = useImageAnalysis();

  // Load chat history from database
  useEffect(() => {
    if (user) {
      loadChatHistory();
      loadProfile();
      checkForProactiveMessage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    // Longer delay for history load to ensure smooth rendering
    const delay = isLoadingHistory ? 0 : messages.length > 5 ? 500 : 200;

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: !isLoadingHistory });
    }, delay);
  }, [messages, isLoadingHistory]);

  const loadProfile = async () => {
    try {
      const profileData = await getUserProfile();
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const checkForProactiveMessage = async () => {
    try {
      const proactiveMsg = await generateProactiveMessage();
      if (proactiveMsg && messages.length > 1) {
        // Only show proactive messages if there's existing conversation history
        const proactiveMessage: Message = {
          id: `proactive-${Date.now()}`,
          role: 'assistant',
          content: proactiveMsg,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, proactiveMessage]);
        await saveMessageToDatabase(proactiveMessage);
      }
    } catch (error) {
      console.error('Error generating proactive message:', error);
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
            imageUri: data.image_uri,
            attachedMeal: data.attached_meal,
            attachedActivity: data.attached_activity,
          };
        });
        setMessages(loadedMessages);

        // Haptic feedback on successful history load
        if (Platform.OS !== 'web' && loadedMessages.length > 0) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        // First time user - show welcome message
        const welcomeMsg = getWelcomeMessage();
        setMessages([welcomeMsg]);
        await saveMessageToDatabase(welcomeMsg);

        // Light haptic for welcome
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      }
    } catch (error) {
      console.error('Error in loadChatHistory:', error);
      setMessages([getWelcomeMessage()]);

      // Error haptic
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      // Smooth transition with slight delay
      setTimeout(() => {
        setIsLoadingHistory(false);

        // Fade in the messages
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }, 300);
    }
  };

  const getWelcomeMessage = (): Message => ({
    id: '0',
    role: 'assistant',
    content:
      "Hey! I'm your personal AI Coach with a memory like an elephant 🐘. I can analyze your meals and workout form from photos, reference your actual logged data, and provide truly personalized guidance. I'll remember everything about your fitness journey. Let's crush your goals together!",
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
        image_uri: message.imageUri || null,
        attached_meal: message.attachedMeal || null,
        attached_activity: message.attachedActivity || null,
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

  const buildContextPrompt = async (): Promise<string> => {
    if (!profile) return '';

    // Fetch recent data for context
    const dataContext = await getCoachDataContext();

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
      `\n=== LAST 48 HOURS ACTIVITY DATA ===`,
      dataContext.last48HoursSummary,
      `\n=== CONVERSATION HISTORY (Last 10 messages) ===`,
    ];

    // Add last 10 messages for context
    const recentMessages = messages.slice(-10);
    recentMessages.forEach((msg) => {
      let msgContent = `${msg.role === 'user' ? 'User' : 'Coach'}: ${msg.content}`;
      if (msg.attachedMeal) {
        msgContent += ` [Attached Meal: ${msg.attachedMeal.meal_type} - ${msg.attachedMeal.description}, ${msg.attachedMeal.calories} cal]`;
      }
      if (msg.attachedActivity) {
        msgContent += ` [Attached Workout: ${msg.attachedActivity.type}, ${msg.attachedActivity.duration}min, ${msg.attachedActivity.caloriesBurned} cal]`;
      }
      contextParts.push(msgContent);
    });

    return contextParts.join('\n');
  };

  const handleSend = async () => {
    if ((!inputText.trim() && !selectedImage) || isLoading) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Handle image message with vision analysis
    if (selectedImage) {
      setUploadingImage(true);
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: inputText.trim() || 'Can you analyze this image?',
        timestamp: Date.now(),
        imageUri: selectedImage,
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputText('');
      const imageToAnalyze = selectedImage;
      setSelectedImage(null);

      // Save user message
      if (user) {
        await saveMessageToDatabase(userMessage);
      }

      try {
        // Analyze image with AI vision
        const visionResponse = await analyzeImage({
          imageUrl: imageToAnalyze,
          prompt: VISION_ANALYSIS_PROMPT,
        });

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: visionResponse || "I couldn't analyze the image. Please try again.",
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        if (user) {
          await saveMessageToDatabase(assistantMessage);
        }

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (error) {
        console.error('Vision analysis error:', error);
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "I had trouble analyzing that image. Please try again or describe what you'd like help with.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setUploadingImage(false);
      }
      return;
    }

    // Regular text message
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
    const contextPrompt = await buildContextPrompt();

    const systemPrompt = `You are a premium AI Fitness Coach with deep memory, data awareness, and visual intelligence. You remember EVERYTHING about this user's journey and can see their actual logged data.

YOUR COACHING STYLE:
- Data-Driven & Proactive: Reference their ACTUAL logged meals and workouts from the last 48 hours
- Visual Intelligence: Analyze meal photos and workout form images with specific feedback
- Budget-Conscious: Focus on home workouts and affordable nutrition (under $50/week)
- Contextual: Always consider their profile, goals, and recent activity
- Encouraging: Be supportive but honest - call out wins AND areas for improvement
- Concise: Keep responses 2-3 short paragraphs max unless detailed analysis is needed

DATA REFERENCE GUIDELINES:
- When they ask "How was my nutrition yesterday?", look at their ACTUAL meal logs
- When they ask "Did I do enough cardio?", check their ACTUAL activity logs
- Mention specific meals and workouts they logged: "I see you had that chicken and rice lunch yesterday!"
- Notice patterns: "You've logged breakfast every day this week - great consistency!"
- Call out gaps: "I don't see any protein at breakfast today"

VISUAL ANALYSIS GUIDELINES (when image provided):
- For meal photos: Identify foods, estimate portions, calculate nutrition, give meal quality feedback
- For form photos: Analyze posture, point out good form, suggest corrections, mention safety
- Be specific: "Your elbows are flaring out - keep them tucked at 45°"
- Be actionable: "Next time, add a fist-sized portion of veggies"

MEMORY GUIDELINES:
- Reference specific past events ("Remember when you mentioned...")
- Celebrate milestones and streaks
- Notice behavior patterns
- Adapt advice based on their progress

AREAS OF EXPERTISE:
- Home-based bodyweight exercises (no gym needed)
- Budget nutrition (affordable protein, meal prep under $50/week)
- Progress tracking and goal setting
- Motivation and mental strategies
${contextPrompt}

User's new message: ${userMessage.content}

Respond as their personal coach who truly knows them and their data:`;

    await generateText(systemPrompt);
  };

  const handleQuickAction = (text: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setInputText(text);
  };

  const handleImagePicker = async (source: 'camera' | 'gallery') => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      let result;
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera access is needed to take photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Photo library access is needed to select images.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const handleShareMeal = (meal: RecentMeal) => {
    const messageText = `Can you give me feedback on this meal?\n\n${meal.meal_type}: ${meal.description}\n${meal.calories} cal | ${meal.protein_grams}g protein | ${meal.carbs_grams}g carbs | ${meal.fats_grams}g fats`;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: Date.now(),
      attachedMeal: meal,
    };

    setMessages((prev) => [...prev, userMessage]);

    if (user) {
      saveMessageToDatabase(userMessage);
    }

    // Auto-send for analysis
    buildContextPrompt().then((contextPrompt) => {
      const systemPrompt = `You are a premium AI Fitness Coach analyzing a specific meal the user logged.

USER MEAL TO ANALYZE:
- Type: ${meal.meal_type}
- Description: ${meal.description}
- Calories: ${meal.calories}
- Protein: ${meal.protein_grams}g
- Carbs: ${meal.carbs_grams}g
- Fats: ${meal.fats_grams}g
- Logged: ${meal.timeAgo}

${contextPrompt}

Provide specific, actionable feedback on this meal:
1. What's good about it?
2. How does it fit their daily goals?
3. Any improvements or additions to suggest?
4. Budget-friendly tips if relevant

Keep it conversational and supportive:`;

      generateText(systemPrompt);
    });
  };

  const handleShareActivity = (activity: RecentActivity) => {
    const intensityText = activity.intensity === 1 ? 'Light' : activity.intensity === 2 ? 'Moderate' : 'Intense';
    const messageText = `What do you think about this workout?\n\n${activity.type} - ${activity.duration} minutes (${intensityText} intensity)\n${activity.caloriesBurned} calories burned`;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: Date.now(),
      attachedActivity: activity,
    };

    setMessages((prev) => [...prev, userMessage]);

    if (user) {
      saveMessageToDatabase(userMessage);
    }

    // Auto-send for analysis
    buildContextPrompt().then((contextPrompt) => {
      const systemPrompt = `You are a premium AI Fitness Coach analyzing a specific workout the user completed.

USER WORKOUT TO ANALYZE:
- Type: ${activity.type}
- Duration: ${activity.duration} minutes
- Intensity: ${intensityText}
- Calories Burned: ${activity.caloriesBurned}
- Completed: ${activity.timeAgo}

${contextPrompt}

Provide specific, encouraging feedback on this workout:
1. Celebrate the effort and consistency
2. How does it fit their fitness goals?
3. Suggestions for progression or variety
4. Tips for recovery or complementary exercises

Keep it motivating and practical:`;

      generateText(systemPrompt);
    });
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
                <Text style={styles.subtitle}>Data-aware • Visual intelligence</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Skeleton Loader with Electric Lime Pulse */}
        <ScrollView style={styles.messagesContainer}>
          <ChatHistorySkeletonLoader />
        </ScrollView>
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
              <Text style={styles.subtitle}>Data-aware • Visual intelligence</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Messages */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
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
      </Animated.View>

      {/* Quick Action Chips */}
      {!isLoading && !selectedImage && (
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

      {/* Image Preview */}
      {selectedImage && (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
          <TouchableOpacity style={styles.removeImageButton} onPress={() => setSelectedImage(null)}>
            <Ionicons name="close-circle" size={24} color={Colors.error} />
          </TouchableOpacity>
        </View>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        {/* Attachment Button */}
        <TouchableOpacity
          style={styles.attachButton}
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            Alert.alert('Attach Content', 'What would you like to share?', [
              { text: 'Take Photo', onPress: () => handleImagePicker('camera') },
              { text: 'Choose Photo', onPress: () => handleImagePicker('gallery') },
              { text: 'Recent Logs', onPress: () => setShowShareSheet(true) },
              { text: 'Cancel', style: 'cancel' },
            ]);
          }}
          disabled={isLoading || uploadingImage}
        >
          <Ionicons name="add-circle" size={28} color={isLoading ? Colors.textSecondary : Colors.accent} />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder={selectedImage ? 'Add a message about this image...' : 'Message your coach...'}
          placeholderTextColor={Colors.textSecondary}
          multiline
          maxLength={500}
          editable={!isLoading && !uploadingImage}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          blurOnSubmit={false}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() && !selectedImage) || isLoading || uploadingImage
              ? styles.sendButtonDisabled
              : {},
          ]}
          onPress={handleSend}
          disabled={(!inputText.trim() && !selectedImage) || isLoading || uploadingImage}
        >
          {uploadingImage ? (
            <ActivityIndicator size="small" color={Colors.background} />
          ) : (
            <Ionicons
              name="send"
              size={20}
              color={
                !inputText.trim() && !selectedImage || isLoading ? Colors.textSecondary : Colors.background
              }
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Share to Coach Sheet */}
      <ShareToCoachSheet
        visible={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        onShareMeal={handleShareMeal}
        onShareActivity={handleShareActivity}
      />
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
        {/* Image if present */}
        {message.imageUri && (
          <Image source={{ uri: message.imageUri }} style={styles.messageImage} />
        )}

        {/* Attached Meal Card */}
        {message.attachedMeal && (
          <View style={styles.attachedCard}>
            <MealCard meal={message.attachedMeal} />
          </View>
        )}

        {/* Attached Activity Card */}
        {message.attachedActivity && (
          <View style={styles.attachedCard}>
            <ActivityCard activity={message.attachedActivity} />
          </View>
        )}

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
    borderRadius: 24,
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
    borderRadius: 16,
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
  messageImage: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    resizeMode: 'cover',
  },
  attachedCard: {
    marginBottom: Spacing.sm,
    width: '100%',
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
  imagePreviewContainer: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  imagePreview: {
    width: '100%',
    height: 150,
    borderRadius: BorderRadius.md,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: 12,
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
  attachButton: {
    marginRight: Spacing.xs,
    marginBottom: 8,
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
    borderRadius: 22,
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
