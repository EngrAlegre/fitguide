import { auth, db } from '../lib/firebase';
import { collection, addDoc, getDoc, doc, Timestamp } from 'firebase/firestore';
import { Activity, ActivityType } from '../types/activity';

/**
 * Log an activity with Verify & Lock pattern
 * Ensures every activity is saved to Firestore and verified
 */
export async function logActivity(
  type: ActivityType,
  duration: number,
  intensity: number,
  caloriesBurned: number
): Promise<{ success: boolean; activity?: Activity; error?: string }> {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  const today = new Date().toISOString().split('T')[0];

  try {
    // Insert activity with verification
    const activityData = {
      user_id: user.uid,
      activity_type: type,
      duration_minutes: duration,
      intensity,
      calories_burned: caloriesBurned,
      date: today,
      completed_at: new Date().toISOString(),
      created_at: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'activities'), activityData);

    // Verify the insert by reading back (Verify & Lock pattern)
    const verifySnap = await getDoc(docRef);
    if (!verifySnap.exists()) {
      return { success: false, error: 'Activity was not saved properly' };
    }

    const savedData = verifySnap.data();

    // Success - transform to Activity type
    const activity: Activity = {
      id: docRef.id,
      type: savedData.activity_type as ActivityType,
      duration: savedData.duration_minutes,
      intensity: savedData.intensity,
      caloriesBurned: savedData.calories_burned,
      timestamp: new Date(savedData.completed_at).getTime(),
      date: savedData.date,
    };

    return { success: true, activity };
  } catch (error: any) {
    console.error('Error logging activity:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Get today's activities from Firestore
 */
export async function getTodayActivities(): Promise<Activity[]> {
  const user = auth.currentUser;
  if (!user) {
    return [];
  }

  const today = new Date().toISOString().split('T')[0];

  try {
    const { query, collection: firestoreCollection, where, orderBy: firestoreOrderBy, getDocs } = await import('firebase/firestore');

    const q = query(
      firestoreCollection(db, 'activities'),
      where('user_id', '==', user.uid),
      where('date', '==', today),
      firestoreOrderBy('completed_at', 'desc')
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.activity_type as ActivityType,
        duration: data.duration_minutes,
        intensity: data.intensity,
        caloriesBurned: data.calories_burned,
        timestamp: new Date(data.completed_at).getTime(),
        date: data.date,
      };
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return [];
  }
}

/**
 * Get total calories burned today
 */
export async function getTodayCaloriesBurned(): Promise<number> {
  const activities = await getTodayActivities();
  return activities.reduce((sum, activity) => sum + activity.caloriesBurned, 0);
}

/**
 * Get activities for a date range
 */
export async function getActivitiesInRange(
  startDate: string,
  endDate: string
): Promise<Activity[]> {
  const user = auth.currentUser;
  if (!user) {
    return [];
  }

  try {
    const { query, collection: firestoreCollection, where, orderBy: firestoreOrderBy, getDocs } = await import('firebase/firestore');

    const q = query(
      firestoreCollection(db, 'activities'),
      where('user_id', '==', user.uid),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      firestoreOrderBy('completed_at', 'desc')
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.activity_type as ActivityType,
        duration: data.duration_minutes,
        intensity: data.intensity,
        caloriesBurned: data.calories_burned,
        timestamp: new Date(data.completed_at).getTime(),
        date: data.date,
      };
    });
  } catch (error) {
    console.error('Error fetching activities in range:', error);
    return [];
  }
}

/**
 * Delete an activity
 */
export async function deleteActivity(activityId: string): Promise<{ success: boolean; error?: string }> {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    const { doc: firestoreDoc, getDoc, deleteDoc } = await import('firebase/firestore');

    const docRef = firestoreDoc(db, 'activities', activityId);

    // Verify ownership before deletion
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return { success: false, error: 'Activity not found' };
    }

    if (docSnap.data().user_id !== user.uid) {
      return { success: false, error: 'Not authorized to delete this activity' };
    }

    await deleteDoc(docRef);

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting activity:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}
