import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTextGeneration, useImageAnalysis } from '@fastshot/ai';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';
import { MealType } from '../types/nutrition';
import { addMealToSupabase } from '../utils/supabase-storage';

interface LogMealModalProps {
  visible: boolean;
  mealType: MealType;
  onClose: () => void;
  onSave: () => void;
}

const NUTRITION_ANALYSIS_PROMPT = `You are a nutrition expert assistant. Analyze the meal description and provide nutritional estimates based on common, budget-friendly ingredients.

IMPORTANT RULES:
1. Focus on affordable, accessible ingredients (eggs, rice, lentils, beans, chicken, pasta, etc.)
2. Give ONLY the numerical values in this EXACT format: "CALORIES: X | PROTEIN: Yg | CARBS: Zg | FATS: Wg"
3. Be realistic about portion sizes (assume moderate portions unless specified)
4. No explanations, no extra text, just the numbers

Examples:
- "two boiled eggs and white rice" → "CALORIES: 380 | PROTEIN: 18g | CARBS: 52g | FATS: 12g"
- "chicken breast with vegetables" → "CALORIES: 280 | PROTEIN: 35g | CARBS: 15g | FATS: 8g"
- "lentil soup and bread" → "CALORIES: 320 | PROTEIN: 18g | CARBS: 55g | FATS: 4g"`;

const VISION_ANALYSIS_PROMPT = `You are a nutrition expert. Analyze this food image and estimate the nutritional content based on what you see. Focus on common, budget-friendly ingredients.

IMPORTANT: Respond ONLY with numbers in this EXACT format: "CALORIES: X | PROTEIN: Yg | CARBS: Zg | FATS: Wg"

No extra text, no explanations, just the nutritional values.`;

export default function LogMealModal({ visible, mealType, onClose, onSave }: LogMealModalProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'vision'>('text');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [nutritionData, setNutritionData] = useState<{
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  } | null>(null);

  const { generateText: analyzeText } = useTextGeneration();
  const { analyzeImage } = useImageAnalysis();

  const resetForm = () => {
    setActiveTab('text');
    setDescription('');
    setImageUri(null);
    setNutritionData(null);
    setAnalyzing(false);
  };

  const parseNutritionResponse = (response: string): {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  } | null => {
    try {
      // Extract numbers from format: "CALORIES: 380 | PROTEIN: 18g | CARBS: 52g | FATS: 12g"
      const caloriesMatch = response.match(/CALORIES:\s*(\d+)/i);
      const proteinMatch = response.match(/PROTEIN:\s*(\d+)g?/i);
      const carbsMatch = response.match(/CARBS:\s*(\d+)g?/i);
      const fatsMatch = response.match(/FATS:\s*(\d+)g?/i);

      if (!caloriesMatch || !proteinMatch || !carbsMatch || !fatsMatch) {
        return null;
      }

      return {
        calories: parseInt(caloriesMatch[1], 10),
        protein: parseInt(proteinMatch[1], 10),
        carbs: parseInt(carbsMatch[1], 10),
        fats: parseInt(fatsMatch[1], 10),
      };
    } catch (error) {
      console.error('Error parsing nutrition response:', error);
      return null;
    }
  };

  const handleTextAnalysis = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please describe your meal');
      return;
    }

    setAnalyzing(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const prompt = `${NUTRITION_ANALYSIS_PROMPT}\n\nMeal: "${description}"`;
      const result = await analyzeText(prompt);
      const response = result || '';

      const nutrition = parseNutritionResponse(response);
      if (!nutrition) {
        throw new Error('Failed to parse nutrition data');
      }

      setNutritionData(nutrition);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error analyzing meal:', error);
      Alert.alert('Error', 'Failed to analyze meal. Please try again.');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleImagePick = async (source: 'camera' | 'library') => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera access is needed to take photos');
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          setImageUri(result.assets[0].uri);
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Photo library access is needed');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          setImageUri(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleVisionAnalysis = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'Please select or take a photo of your meal');
      return;
    }

    setAnalyzing(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const result = await analyzeImage({
        imageUrl: imageUri,
        prompt: VISION_ANALYSIS_PROMPT,
      });
      const response = result || '';

      const nutrition = parseNutritionResponse(response);
      if (!nutrition) {
        throw new Error('Failed to parse nutrition data');
      }

      setNutritionData(nutrition);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      Alert.alert('Error', 'Failed to analyze meal image. Please try again.');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!nutritionData) {
      Alert.alert('Error', 'Please analyze your meal first');
      return;
    }

    const mealDescription =
      activeTab === 'text' ? description : `Photo of ${mealType.toLowerCase()}`;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const result = await addMealToSupabase({
        meal_type: mealType,
        description: mealDescription,
        calories: nutritionData.calories,
        protein_grams: nutritionData.protein,
        carbs_grams: nutritionData.carbs,
        fats_grams: nutritionData.fats,
        date: new Date().toISOString().split('T')[0],
        analysis_method: activeTab,
      });

      if (result) {
        onSave();
        resetForm();
        onClose();

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        throw new Error('Failed to save meal');
      }
    } catch (error) {
      console.error('Error saving meal:', error);
      Alert.alert('Error', 'Failed to save meal. Please try again.');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>LOG {mealType.toUpperCase()}</Text>
            <Text style={styles.headerSubtitle}>AI-Powered Nutrition Analysis</Text>
          </View>
          <View style={styles.closeButton} />
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'text' && styles.tabActive]}
            onPress={() => {
              setActiveTab('text');
              setImageUri(null);
              setNutritionData(null);
            }}
          >
            <Ionicons
              name="chatbubble-ellipses"
              size={20}
              color={activeTab === 'text' ? Colors.background : Colors.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === 'text' && styles.tabTextActive]}>
              Text Entry
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'vision' && styles.tabActive]}
            onPress={() => {
              setActiveTab('vision');
              setDescription('');
              setNutritionData(null);
            }}
          >
            <Ionicons
              name="camera"
              size={20}
              color={activeTab === 'vision' ? Colors.background : Colors.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === 'vision' && styles.tabTextActive]}>
              Photo
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {activeTab === 'text' ? (
            <View style={styles.textSection}>
              <Text style={styles.label}>DESCRIBE YOUR MEAL</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., two boiled eggs with white rice and vegetables..."
                placeholderTextColor={Colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                editable={!analyzing}
              />
              <Text style={styles.hint}>
                💡 Include details like portion size and ingredients for better accuracy
              </Text>

              <TouchableOpacity
                style={[styles.analyzeButton, analyzing && styles.analyzeButtonDisabled]}
                onPress={handleTextAnalysis}
                disabled={analyzing}
              >
                <Ionicons
                  name="sparkles"
                  size={20}
                  color={analyzing ? Colors.textSecondary : Colors.background}
                />
                <Text style={[styles.analyzeButtonText, analyzing && styles.analyzeButtonTextDisabled]}>
                  {analyzing ? 'ANALYZING...' : 'ANALYZE WITH AI'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.visionSection}>
              {!imageUri ? (
                <View style={styles.imagePickerSection}>
                  <Text style={styles.label}>CAPTURE OR SELECT MEAL PHOTO</Text>
                  <View style={styles.imageButtons}>
                    <TouchableOpacity
                      style={styles.imageButton}
                      onPress={() => handleImagePick('camera')}
                    >
                      <Ionicons name="camera" size={32} color={Colors.accent} />
                      <Text style={styles.imageButtonText}>Take Photo</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.imageButton}
                      onPress={() => handleImagePick('library')}
                    >
                      <Ionicons name="images" size={32} color={Colors.accent} />
                      <Text style={styles.imageButtonText}>Choose Photo</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.hint}>
                    💡 For best results, take a clear photo from directly above
                  </Text>
                </View>
              ) : (
                <View style={styles.imagePreviewSection}>
                  <Text style={styles.label}>MEAL PHOTO</Text>
                  <View style={styles.imagePreview}>
                    <Image source={{ uri: imageUri }} style={styles.previewImage} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => {
                        setImageUri(null);
                        setNutritionData(null);
                      }}
                    >
                      <Ionicons name="close-circle" size={32} color={Colors.error} />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[styles.analyzeButton, analyzing && styles.analyzeButtonDisabled]}
                    onPress={handleVisionAnalysis}
                    disabled={analyzing}
                  >
                    <Ionicons
                      name="sparkles"
                      size={20}
                      color={analyzing ? Colors.textSecondary : Colors.background}
                    />
                    <Text style={[styles.analyzeButtonText, analyzing && styles.analyzeButtonTextDisabled]}>
                      {analyzing ? 'ANALYZING...' : 'ANALYZE WITH AI'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Loading State */}
          {analyzing && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.accent} />
              <Text style={styles.loadingText}>AI is analyzing your meal...</Text>
            </View>
          )}

          {/* Nutrition Results */}
          {nutritionData && !analyzing && (
            <View style={styles.resultsSection}>
              <Text style={styles.resultsTitle}>NUTRITION ANALYSIS</Text>
              <View style={styles.resultsGrid}>
                <View style={styles.resultCard}>
                  <Text style={styles.resultValue}>{nutritionData.calories}</Text>
                  <Text style={styles.resultLabel}>Calories</Text>
                </View>
                <View style={styles.resultCard}>
                  <Text style={styles.resultValue}>{nutritionData.protein}g</Text>
                  <Text style={styles.resultLabel}>Protein</Text>
                </View>
                <View style={styles.resultCard}>
                  <Text style={styles.resultValue}>{nutritionData.carbs}g</Text>
                  <Text style={styles.resultLabel}>Carbs</Text>
                </View>
                <View style={styles.resultCard}>
                  <Text style={styles.resultValue}>{nutritionData.fats}g</Text>
                  <Text style={styles.resultLabel}>Fats</Text>
                </View>
              </View>
              <Text style={styles.disclaimer}>
                💡 Values are estimates based on common ingredients
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Save Button */}
        {nutritionData && !analyzing && (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>SAVE MEAL</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.xxl + 10,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    color: Colors.textPrimary,
    ...Fonts.heading,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    ...Fonts.body,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
  },
  tabActive: {
    backgroundColor: Colors.accent,
  },
  tabText: {
    fontSize: 14,
    color: Colors.textSecondary,
    ...Fonts.heading,
  },
  tabTextActive: {
    color: Colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  textSection: {
    gap: Spacing.md,
  },
  visionSection: {
    gap: Spacing.md,
  },
  label: {
    fontSize: 12,
    color: Colors.textSecondary,
    ...Fonts.data,
    letterSpacing: 1,
  },
  textInput: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.textPrimary,
    ...Fonts.body,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 13,
    color: Colors.textSecondary,
    ...Fonts.body,
    lineHeight: 18,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
  },
  analyzeButtonDisabled: {
    backgroundColor: Colors.cardBg,
  },
  analyzeButtonText: {
    fontSize: 14,
    color: Colors.background,
    ...Fonts.heading,
    letterSpacing: 1,
  },
  analyzeButtonTextDisabled: {
    color: Colors.textSecondary,
  },
  imagePickerSection: {
    gap: Spacing.md,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  imageButton: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  imageButtonText: {
    fontSize: 14,
    color: Colors.textPrimary,
    ...Fonts.body,
  },
  imagePreviewSection: {
    gap: Spacing.md,
  },
  imagePreview: {
    position: 'relative',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 300,
    backgroundColor: Colors.cardBg,
  },
  removeImageButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.full,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    ...Fonts.body,
  },
  resultsSection: {
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  resultsTitle: {
    fontSize: 14,
    color: Colors.accent,
    ...Fonts.heading,
    letterSpacing: 1,
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  resultCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  resultValue: {
    fontSize: 32,
    color: Colors.accent,
    ...Fonts.heading,
    marginBottom: Spacing.xs,
  },
  resultLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    ...Fonts.body,
  },
  disclaimer: {
    fontSize: 12,
    color: Colors.textSecondary,
    ...Fonts.body,
    lineHeight: 18,
    textAlign: 'center',
  },
  footer: {
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xl : Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveButton: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: Colors.background,
    ...Fonts.heading,
    letterSpacing: 1,
  },
});
