import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for feedback
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: any = null;

// Only initialize if we have the required environment variables
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('Supabase feedback client initialized successfully');
} else {
  console.warn('Supabase feedback not configured:', {
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey
  });
}

export interface FeedbackData {
  session_id: string;
  score: number;
  comment?: string;
}

// Save feedback to Supabase
export async function saveFeedback(data: FeedbackData): Promise<boolean> {
  // Skip if Supabase is not configured
  if (!supabase) {
    console.warn('❌ Supabase not configured for feedback - skipping save');
    return false;
  }

  try {
    console.log('📝 Attempting to save feedback:', {
      session_id: data.session_id,
      score: data.score,
      hasComment: !!data.comment
    });

    const { error } = await supabase
      .from('feedback')
      .insert([data]);

    if (error) {
      console.error('❌ Failed to save feedback to Supabase:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return false;
    } else {
      console.log('✅ Feedback saved successfully to Supabase!');
      return true;
    }
  } catch (error) {
    console.error('💥 Unexpected error saving feedback:', error);
    return false;
  }
}