import { supabase } from '../supabaseClient';
import { UserPreference } from '../types/recommendation';

/**
 * Initialize user preferences in the database if they don't exist
 * @param userId - User ID to initialize preferences for
 * @returns The user preferences object
 */
export async function initUserPreferences(userId: string): Promise<UserPreference | null> {
  try {
    // Check if preferences already exist
    const { data: existingPrefs, error: fetchError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('userid', userId);

    if (fetchError) {
      console.error('Error checking for existing preferences:', fetchError);
      return null;
    }

    // If preferences already exist, return the first one
    if (existingPrefs && existingPrefs.length > 0) {
      return existingPrefs[0] as UserPreference;
    }

    // Create default preferences
    const defaultPreferences: Omit<UserPreference, 'id'> = {
      userid: userId,
      categorypreferences: {},
      tagpreferences: {},
      viewhistory: [],
      purchasehistory: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert new preferences
    const { data: newPrefs, error: insertError } = await supabase
      .from('user_preferences')
      .insert([defaultPreferences])
      .select('*')
      .single();

    if (insertError) {
      console.error('Error creating user preferences:', insertError);
      return null;
    }

    return newPrefs as UserPreference;
  } catch (err) {
    console.error('Exception in initUserPreferences:', err);
    return null;
  }
}

/**
 * Get the current user's ID from Supabase auth
 * @returns User ID or 'anonymous-user' if not logged in
 */
export async function getCurrentUserId(): Promise<string> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || 'anonymous-user';
  } catch (err) {
    console.error('Error getting current user:', err);
    return 'anonymous-user';
  }
}
