import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for analytics
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: any = null;

// Only initialize if we have the required environment variables
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  console.log('Supabase analytics client initialized successfully');
} else {
  console.warn('Supabase analytics not configured:', {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey
  });
}

export interface AnalyticsData {
  query: string;
  query_type: 'channel_url' | 'video_url' | 'handle' | 'search_term';
  age_band?: string;
  video_count: number;
  transcript_coverage_percent: number;
  warnings_count: number;
  high_controversy_videos_count: number;
  suspicious_engagement_videos_count: number;
  avg_engagement_velocity: number;
  analysis_success: boolean;
  error_type?: string;
  session_id: string;
  user_agent_hash?: string;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_tokens: number;
  openai_requests_count: number;
}

// Generate anonymous session ID
export function generateSessionId(): string {
  return 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Hash user agent for privacy-preserving demographics
export function hashUserAgent(userAgent: string): string {
  let hash = 0;
  for (let i = 0; i < userAgent.length; i++) {
    const char = userAgent.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

// Determine query type from the search query
export function getQueryType(query: string): 'channel_url' | 'video_url' | 'handle' | 'search_term' {
  const trimmedQuery = query.trim().toLowerCase();
  
  if (trimmedQuery.includes('youtube.com/watch') || trimmedQuery.includes('youtu.be/')) {
    return 'video_url';
  }
  if (trimmedQuery.includes('youtube.com/channel') || 
      trimmedQuery.includes('youtube.com/c/') || 
      trimmedQuery.includes('youtube.com/user/')) {
    return 'channel_url';
  }
  if (trimmedQuery.startsWith('@')) {
    return 'handle';
  }
  return 'search_term';
}

// Calculate engagement metrics from video data
export function calculateEngagementStats(videos: any[]) {
  let highControversyCount = 0;
  let suspiciousEngagementCount = 0;
  let totalVelocity = 0;
  let velocityCount = 0;

  videos.forEach(video => {
    if (video.engagementMetrics) {
      const metrics = video.engagementMetrics;
      
      // Count high controversy videos (score > 0.7)
      if (metrics.controversyScore > 0.7) {
        highControversyCount++;
      }
      
      // Count suspicious engagement
      if (metrics.audienceEngagement === 'suspicious') {
        suspiciousEngagementCount++;
      }
      
      // Sum engagement velocity for average
      if (metrics.engagementVelocity > 0) {
        totalVelocity += metrics.engagementVelocity;
        velocityCount++;
      }
    }
  });

  return {
    high_controversy_videos_count: highControversyCount,
    suspicious_engagement_videos_count: suspiciousEngagementCount,
    avg_engagement_velocity: velocityCount > 0 ? Math.round(totalVelocity / velocityCount) : 0
  };
}

// Save analytics data to Supabase
export async function saveAnalytics(data: AnalyticsData): Promise<void> {
  // Skip if Supabase is not configured
  if (!supabase) {
    console.warn('Supabase not configured for analytics - skipping save');
    return;
  }

  try {
    console.log('Attempting to save analytics data:', {
      query: data.query,
      query_type: data.query_type,
      analysis_success: data.analysis_success,
      session_id: data.session_id
    });

    const { error } = await supabase
      .from('search_analytics')
      .insert([data]);

    if (error) {
      console.error('Failed to save analytics to Supabase:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
    } else {
      console.log('Analytics saved successfully to Supabase');
    }
  } catch (error) {
    console.error('Unexpected error saving analytics:', error);
  }
}

// Track successful analysis
export async function trackSuccessfulAnalysis(
  query: string,
  results: any,
  sessionId: string,
  userAgent?: string,
  tokenUsage?: {
    total_prompt_tokens: number;
    total_completion_tokens: number;
    total_tokens: number;
    openai_requests_count: number;
  }
) {
  const engagementStats = calculateEngagementStats(results.videos || []);
  
  const analyticsData: AnalyticsData = {
    query,
    query_type: getQueryType(query),
    age_band: results.aggregate?.ageBand,
    video_count: results.videos?.length || 0,
    transcript_coverage_percent: results.transcriptCoverage?.percentage || 0,
    warnings_count: results.warnings?.length || 0,
    ...engagementStats,
    analysis_success: true,
    session_id: sessionId,
    user_agent_hash: userAgent ? hashUserAgent(userAgent) : undefined,
    total_prompt_tokens: tokenUsage?.total_prompt_tokens || 0,
    total_completion_tokens: tokenUsage?.total_completion_tokens || 0,
    total_tokens: tokenUsage?.total_tokens || 0,
    openai_requests_count: tokenUsage?.openai_requests_count || 0
  };

  await saveAnalytics(analyticsData);
}

// Track failed analysis
export async function trackFailedAnalysis(
  query: string,
  errorType: string,
  sessionId: string,
  userAgent?: string,
  tokenUsage?: {
    total_prompt_tokens: number;
    total_completion_tokens: number;
    total_tokens: number;
    openai_requests_count: number;
  }
) {
  const analyticsData: AnalyticsData = {
    query,
    query_type: getQueryType(query),
    video_count: 0,
    transcript_coverage_percent: 0,
    warnings_count: 0,
    high_controversy_videos_count: 0,
    suspicious_engagement_videos_count: 0,
    avg_engagement_velocity: 0,
    analysis_success: false,
    error_type: errorType,
    session_id: sessionId,
    user_agent_hash: userAgent ? hashUserAgent(userAgent) : undefined,
    total_prompt_tokens: tokenUsage?.total_prompt_tokens || 0,
    total_completion_tokens: tokenUsage?.total_completion_tokens || 0,
    total_tokens: tokenUsage?.total_tokens || 0,
    openai_requests_count: tokenUsage?.openai_requests_count || 0
  };

  await saveAnalytics(analyticsData);
}