import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for feedback
const supabaseUrl = typeof window !== 'undefined' 
  ? process.env.NEXT_PUBLIC_SUPABASE_URL 
  : process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = typeof window !== 'undefined'
  ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: any = null;

// Only initialize if we have the required environment variables
if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase feedback client initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Supabase feedback client:', error);
  }
} else {
  console.warn('Supabase feedback not configured:', {
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'missing',
    supabaseAnonKey: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 10)}...` : 'missing'
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
    console.error('❌ Supabase not configured for feedback - skipping save', {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey
    });
    return false;
  }

  try {
    console.log('📝 Attempting to save feedback to Supabase:', {
      session_id: data.session_id,
      score: data.score,
      hasComment: !!data.comment,
      commentLength: data.comment?.length || 0
    });

    // Validate data before sending
    if (!data.session_id || typeof data.score !== 'number' || data.score < 0 || data.score > 10) {
      console.error('❌ Invalid feedback data:', data);
      return false;
    }

    const { error } = await supabase
      .from('feedback')
      .insert([data]);

    if (error) {
      console.error('❌ Failed to save feedback to Supabase:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
        payload: data,
        supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'missing'
      return false;
    } else {
      console.log('✅ Feedback saved successfully to Supabase!', {
        session_id: data.session_id,
        score: data.score
      });
      return true;
    }
  } catch (error) {
    console.error('💥 Unexpected error saving feedback:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      data
    });
    return false;
  }
}