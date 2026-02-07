import { generateText, generateImage } from '@fastshot/ai';
import { supabase } from '../lib/supabase';
import { auth } from '../lib/firebase';
import { getUserProfile } from '../utils/profile-storage';
import { MealPlan, DayPlan, Meal, MealType, BudgetCategory } from '../types/mealPlan';

interface RawMealData {
  name: string;
  description: string;
  cookingTime: number;
  budgetCategory: BudgetCategory;
  ingredients: {
    pantry: string[];
    toBuy: string[];
  };
  preparationSteps: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
}

/**
 * Generate a personalized 3-day meal plan using Newell AI
 */
export async function generateMealPlan(): Promise<MealPlan> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get user profile
  const profile = await getUserProfile();
  if (!profile) {
    throw new Error('User profile not found');
  }

  // Create the AI prompt
  const prompt = `You are a professional nutritionist and meal planner. Create a personalized 3-day meal plan based on the following user profile:

Age: ${profile.age}
Gender: ${profile.gender}
Height: ${profile.height}cm
Weight: ${profile.weight}kg
Activity Level: ${profile.activityLevel}
Financial Status: ${profile.financialStatus}
Fitness Goal: ${profile.fitnessGoal}
Daily Calorie Goal: ${profile.daily_calorie_goal} calories

IMPORTANT: The financial status must heavily influence your meal suggestions:
- budget_conscious: Simple, affordable meals using basic ingredients (rice, beans, eggs, pasta, seasonal vegetables). Snacks should be simple like fruits, nuts, or yogurt.
- balanced: Quality ingredients at reasonable prices (chicken, fish, fresh produce, whole grains). Snacks can include protein bars, smoothies, or cheese.
- premium_gourmet: High-end ingredients and gourmet preparations (organic meats, exotic produce, specialty items). Snacks can include gourmet items like artisanal cheeses, exotic fruits, or premium protein snacks.

Create EXACTLY 12 meals (3 days × 4 meals per day: breakfast, lunch, dinner, snacks) in valid JSON format.

Return a JSON object with this EXACT structure:
{
  "day1": {
    "breakfast": {
      "name": "Meal Name",
      "description": "Brief description",
      "cookingTime": 15,
      "budgetCategory": "budget|moderate|premium",
      "ingredients": {
        "pantry": ["item1", "item2"],
        "toBuy": ["item1", "item2"]
      },
      "preparationSteps": ["step1", "step2", "step3"],
      "nutrition": {
        "calories": 450,
        "protein": 20,
        "carbs": 50,
        "fats": 15
      }
    },
    "lunch": { ... same structure ... },
    "dinner": { ... same structure ... },
    "snacks": { ... same structure ... }
  },
  "day2": { ... same structure ... },
  "day3": { ... same structure ... }
}

Ensure:
1. Total daily calories align with the user's goal
2. Budget category matches the financial status
3. Meals are appropriate for the fitness goal (high protein for muscle building, lower calories for weight loss)
4. Cooking times are realistic
5. All fields are present and valid`;

  console.log('🤖 Generating meal plan with Newell AI...');

  // Generate the meal plan using Newell AI
  const response = await generateText({
    prompt,
    temperature: 0.7,
    injectBranding: false,
  });

  console.log('✅ Received AI response');

  // Parse the AI response
  let mealPlanData: any;
  try {
    // Extract JSON from the response (AI might include extra text)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }
    mealPlanData = JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    throw new Error('Failed to parse meal plan from AI');
  }

  console.log('📊 Parsed meal plan data');

  // Generate images for each meal and construct the meal plan
  const days: DayPlan[] = [];

  for (let dayNum = 1; dayNum <= 3; dayNum++) {
    const dayKey = `day${dayNum}`;
    const dayData = mealPlanData[dayKey];

    if (!dayData) {
      throw new Error(`Missing data for ${dayKey}`);
    }

    const breakfast = await createMealWithImage('breakfast', dayData.breakfast, dayNum);
    const lunch = await createMealWithImage('lunch', dayData.lunch, dayNum);
    const dinner = await createMealWithImage('dinner', dayData.dinner, dayNum);
    const snacks = await createMealWithImage('snacks', dayData.snacks, dayNum);

    days.push({
      dayNumber: dayNum,
      breakfast,
      lunch,
      dinner,
      snacks,
    });
  }

  // Create the meal plan object
  const mealPlan: MealPlan = {
    id: `${user.uid}_${Date.now()}`,
    userId: user.uid,
    days,
    createdAt: new Date().toISOString(),
    metadata: {
      age: profile.age || 0,
      gender: profile.gender || 'other',
      activityLevel: profile.activityLevel || 'sedentary',
      financialStatus: profile.financialStatus || 'balanced',
      fitnessGoal: profile.fitnessGoal || 'maintain',
    },
  };

  // Save to Firestore
  await saveMealPlan(mealPlan);

  console.log('✅ Meal plan saved to Firestore');

  return mealPlan;
}

/**
 * Create a meal object with an AI-generated image
 */
async function createMealWithImage(
  type: MealType,
  mealData: RawMealData,
  dayNumber: number
): Promise<Meal> {
  console.log(`🖼️  Generating image for ${type} (Day ${dayNumber})...`);

  // Generate meal image using Newell AI
  const imagePrompt = `Professional food photography, ${mealData.name}, ${mealData.description}, beautifully plated on a white dish, natural lighting, high-quality restaurant presentation, appetizing, vibrant colors, 4k resolution`;

  const imageResponse = await generateImage({
    prompt: imagePrompt,
    width: 1024,
    height: 1024,
    numOutputs: 1,
  });

  const imageUrl = imageResponse.images?.[0] || '';

  console.log(`✅ Image generated for ${type}`);

  // Parse ingredients
  const ingredients = [
    ...mealData.ingredients.pantry.map((name) => ({
      name,
      amount: 'As needed',
      isPantry: true,
    })),
    ...mealData.ingredients.toBuy.map((name) => ({
      name,
      amount: 'As needed',
      isPantry: false,
    })),
  ];

  return {
    id: `${type}_day${dayNumber}_${Date.now()}`,
    type,
    name: mealData.name,
    description: mealData.description,
    imageUrl,
    cookingTime: mealData.cookingTime,
    budgetCategory: mealData.budgetCategory,
    ingredients,
    preparationSteps: mealData.preparationSteps,
    calories: mealData.nutrition.calories,
    protein: mealData.nutrition.protein,
    carbs: mealData.nutrition.carbs,
    fats: mealData.nutrition.fats,
    isCompleted: false,
  };
}

/**
 * Save meal plan to Supabase
 */
async function saveMealPlan(mealPlan: MealPlan): Promise<void> {
  const { error } = await supabase
    .from('meal_plans')
    .upsert({
      id: mealPlan.id,
      user_id: mealPlan.userId,
      created_at: mealPlan.createdAt,
      metadata: mealPlan.metadata,
      days: mealPlan.days,
    });

  if (error) {
    console.error('Error saving meal plan:', error);
    throw new Error('Failed to save meal plan');
  }
}

/**
 * Get the latest meal plan for the current user with completion status
 */
export async function getLatestMealPlan(): Promise<MealPlan | null> {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }

  // Get the latest meal plan
  const { data: mealPlans, error } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('user_id', user.uid)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching meal plan:', error);
    return null;
  }

  if (!mealPlans || mealPlans.length === 0) {
    return null;
  }

  const mealPlan = mealPlans[0];

  // Get all completions for this meal plan
  const { data: completions, error: completionsError } = await supabase
    .from('meal_completions')
    .select('*')
    .eq('meal_plan_id', mealPlan.id);

  if (completionsError) {
    console.error('Error fetching completions:', completionsError);
  }

  // Map completion data back to meal plan structure
  const completionMap = new Map<string, boolean>();
  if (completions) {
    completions.forEach((completion) => {
      const key = `${completion.day_number}_${completion.meal_type}`;
      completionMap.set(key, true);
    });
  }

  // Update isCompleted flags based on completions
  const days = mealPlan.days.map((day: DayPlan) => ({
    ...day,
    breakfast: {
      ...day.breakfast,
      isCompleted: completionMap.has(`${day.dayNumber}_breakfast`) || false,
    },
    lunch: {
      ...day.lunch,
      isCompleted: completionMap.has(`${day.dayNumber}_lunch`) || false,
    },
    dinner: {
      ...day.dinner,
      isCompleted: completionMap.has(`${day.dayNumber}_dinner`) || false,
    },
    snacks: {
      ...day.snacks,
      isCompleted: completionMap.has(`${day.dayNumber}_snacks`) || false,
    },
  }));

  return {
    id: mealPlan.id,
    userId: mealPlan.user_id,
    days,
    createdAt: mealPlan.created_at,
    metadata: mealPlan.metadata,
  };
}

/**
 * Mark a meal as completed with optimistic locking
 */
export async function markMealAsCompleted(
  mealPlanId: string,
  dayNumber: number,
  mealType: MealType,
  calories: number
): Promise<{ success: boolean; error?: string }> {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    // Insert completion record (UNIQUE constraint ensures no duplicates)
    const { error } = await supabase
      .from('meal_completions')
      .insert({
        user_id: user.uid,
        meal_plan_id: mealPlanId,
        day_number: dayNumber,
        meal_type: mealType,
        calories,
        completed_at: new Date().toISOString(),
      });

    if (error) {
      // Check if it's a duplicate (already completed)
      if (error.code === '23505') {
        return { success: true }; // Already completed, treat as success
      }
      console.error('Error marking meal as completed:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error marking meal as completed:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Unmark a meal as completed
 */
export async function unmarkMealAsCompleted(
  mealPlanId: string,
  dayNumber: number,
  mealType: MealType
): Promise<{ success: boolean; error?: string }> {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    const { error } = await supabase
      .from('meal_completions')
      .delete()
      .eq('user_id', user.uid)
      .eq('meal_plan_id', mealPlanId)
      .eq('day_number', dayNumber)
      .eq('meal_type', mealType);

    if (error) {
      console.error('Error unmarking meal:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error unmarking meal:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Get daily progress for a specific day
 */
export async function getDailyProgress(
  mealPlanId: string,
  dayNumber: number
): Promise<{
  completed: number;
  total: number;
  consumedCalories: number;
  totalCalories: number;
}> {
  const user = auth.currentUser;
  if (!user) {
    return { completed: 0, total: 4, consumedCalories: 0, totalCalories: 0 };
  }

  // Get completions for this day
  const { data: completions, error } = await supabase
    .from('meal_completions')
    .select('calories')
    .eq('user_id', user.uid)
    .eq('meal_plan_id', mealPlanId)
    .eq('day_number', dayNumber);

  if (error) {
    console.error('Error fetching daily progress:', error);
    return { completed: 0, total: 4, consumedCalories: 0, totalCalories: 0 };
  }

  const consumedCalories = completions?.reduce((sum, c) => sum + (c.calories || 0), 0) || 0;

  // Get the meal plan to calculate total calories
  const mealPlan = await getLatestMealPlan();
  if (!mealPlan) {
    return { completed: completions?.length || 0, total: 4, consumedCalories, totalCalories: 0 };
  }

  const day = mealPlan.days.find((d) => d.dayNumber === dayNumber);
  if (!day) {
    return { completed: completions?.length || 0, total: 4, consumedCalories, totalCalories: 0 };
  }

  const totalCalories = day.breakfast.calories + day.lunch.calories + day.dinner.calories + day.snacks.calories;

  return {
    completed: completions?.length || 0,
    total: 4,
    consumedCalories,
    totalCalories,
  };
}
