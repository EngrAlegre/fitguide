import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Activity, DailySummary, WeeklySummary } from '../types/activity';
import { Meal, DailyNutritionSummary, EnergyBalance } from '../types/nutrition';

// ============ Activities ============

export async function addActivityToFirestore(
  activity: Omit<Activity, 'id' | 'timestamp'>
): Promise<Activity | null> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const activityData = {
      user_id: user.uid,
      activity_type: activity.type,
      duration_minutes: activity.duration,
      intensity: activity.intensity,
      calories_burned: activity.caloriesBurned,
      date: activity.date,
      created_at: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'activities'), activityData);

    return {
      id: docRef.id,
      type: activity.type,
      duration: activity.duration,
      intensity: activity.intensity,
      caloriesBurned: activity.caloriesBurned,
      timestamp: Date.now(),
      date: activity.date,
    };
  } catch (error) {
    console.error('Error adding activity:', error);
    return null;
  }
}

export async function getTodayActivitiesFromFirestore(): Promise<DailySummary> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const today = new Date().toISOString().split('T')[0];

    const q = query(
      collection(db, 'activities'),
      where('user_id', '==', user.uid),
      where('date', '==', today),
      orderBy('created_at', 'desc')
    );

    const querySnapshot = await getDocs(q);

    const activities: Activity[] = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.activity_type,
        duration: data.duration_minutes,
        intensity: data.intensity,
        caloriesBurned: data.calories_burned,
        timestamp: data.created_at?.toMillis() || Date.now(),
        date: data.date,
      };
    });

    const totalCalories = activities.reduce((sum, a) => sum + a.caloriesBurned, 0);

    return {
      date: today,
      totalCalories,
      activities,
    };
  } catch (error) {
    console.error('Error fetching today activities:', error);
    return {
      date: new Date().toISOString().split('T')[0],
      totalCalories: 0,
      activities: [],
    };
  }
}

export async function getWeeklySummaryFromFirestore(): Promise<WeeklySummary> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const q = query(
      collection(db, 'activities'),
      where('user_id', '==', user.uid),
      where('date', '>=', last7Days[0]),
      where('date', '<=', last7Days[6])
    );

    const querySnapshot = await getDocs(q);

    const activitiesData = querySnapshot.docs.map((doc) => ({
      date: doc.data().date,
      calories_burned: doc.data().calories_burned,
    }));

    const dailyTotals = last7Days.map((date) => {
      const dayActivities = activitiesData.filter((row) => row.date === date);
      const calories = dayActivities.reduce((sum, row) => sum + row.calories_burned, 0);
      return { date, calories };
    });

    const bestDay = dailyTotals.reduce<{ date: string; calories: number } | null>((best, day) => {
      if (day.calories === 0) return best;
      if (!best || day.calories > best.calories) return day;
      return best;
    }, null);

    const totalCalories = dailyTotals.reduce((sum, day) => sum + day.calories, 0);

    return {
      totalCalories,
      bestDay,
      dailyTotals,
    };
  } catch (error) {
    console.error('Error fetching weekly summary:', error);
    return {
      totalCalories: 0,
      bestDay: null,
      dailyTotals: Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return { date: date.toISOString().split('T')[0], calories: 0 };
      }),
    };
  }
}

// ============ Meals & Nutrition ============

export async function addMealToFirestore(
  meal: Omit<Meal, 'id' | 'user_id' | 'created_at'>
): Promise<Meal | null> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const mealData = {
      user_id: user.uid,
      meal_type: meal.meal_type,
      description: meal.description,
      calories: meal.calories,
      protein_grams: meal.protein_grams,
      carbs_grams: meal.carbs_grams,
      fats_grams: meal.fats_grams,
      date: meal.date,
      analysis_method: meal.analysis_method,
      created_at: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'meals'), mealData);

    return {
      id: docRef.id,
      user_id: user.uid,
      ...meal,
      created_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error adding meal:', error);
    return null;
  }
}

export async function getTodayMealsFromFirestore(): Promise<DailyNutritionSummary> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const today = new Date().toISOString().split('T')[0];

    const q = query(
      collection(db, 'meals'),
      where('user_id', '==', user.uid),
      where('date', '==', today),
      orderBy('created_at', 'desc')
    );

    const querySnapshot = await getDocs(q);

    const meals: Meal[] = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        user_id: data.user_id,
        meal_type: data.meal_type,
        description: data.description,
        calories: data.calories,
        protein_grams: data.protein_grams,
        carbs_grams: data.carbs_grams,
        fats_grams: data.fats_grams,
        date: data.date,
        analysis_method: data.analysis_method,
        created_at: data.created_at?.toDate().toISOString() || new Date().toISOString(),
      };
    });

    const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
    const totalProtein = meals.reduce((sum, m) => sum + m.protein_grams, 0);
    const totalCarbs = meals.reduce((sum, m) => sum + m.carbs_grams, 0);
    const totalFats = meals.reduce((sum, m) => sum + m.fats_grams, 0);

    const mealsByType = {
      Breakfast: meals.filter((m) => m.meal_type === 'Breakfast'),
      Lunch: meals.filter((m) => m.meal_type === 'Lunch'),
      Dinner: meals.filter((m) => m.meal_type === 'Dinner'),
      Snack: meals.filter((m) => m.meal_type === 'Snack'),
    };

    return {
      date: today,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFats,
      meals,
      mealsByType,
    };
  } catch (error) {
    console.error('Error fetching today meals:', error);
    return {
      date: new Date().toISOString().split('T')[0],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFats: 0,
      meals: [],
      mealsByType: {
        Breakfast: [],
        Lunch: [],
        Dinner: [],
        Snack: [],
      },
    };
  }
}

export async function getEnergyBalanceFromFirestore(date?: string): Promise<EnergyBalance> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const targetDate = date || new Date().toISOString().split('T')[0];

    // Get calories burned from activities
    const activitiesQuery = query(
      collection(db, 'activities'),
      where('user_id', '==', user.uid),
      where('date', '==', targetDate)
    );

    const activitiesSnapshot = await getDocs(activitiesQuery);
    const caloriesOut = activitiesSnapshot.docs.reduce(
      (sum, doc) => sum + doc.data().calories_burned,
      0
    );

    // Get calories consumed from meals
    const mealsQuery = query(
      collection(db, 'meals'),
      where('user_id', '==', user.uid),
      where('date', '==', targetDate)
    );

    const mealsSnapshot = await getDocs(mealsQuery);
    const caloriesIn = mealsSnapshot.docs.reduce((sum, doc) => sum + doc.data().calories, 0);

    return {
      caloriesIn,
      caloriesOut,
      balance: caloriesIn - caloriesOut,
      date: targetDate,
    };
  } catch (error) {
    console.error('Error fetching energy balance:', error);
    return {
      caloriesIn: 0,
      caloriesOut: 0,
      balance: 0,
      date: date || new Date().toISOString().split('T')[0],
    };
  }
}

// ============ User Profile ============

export async function getDailyGoalFromFirestore(): Promise<number> {
  try {
    const user = auth.currentUser;
    if (!user) return 2500;

    const docRef = doc(db, 'user_profiles', user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data()?.daily_calorie_goal || 2500;
    }

    return 2500;
  } catch (error) {
    console.error('Error fetching daily goal:', error);
    return 2500;
  }
}

export async function updateDailyGoalInFirestore(goal: number): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const docRef = doc(db, 'user_profiles', user.uid);
    await updateDoc(docRef, {
      daily_calorie_goal: goal,
      updated_at: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating daily goal:', error);
  }
}
