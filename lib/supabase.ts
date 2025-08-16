import { createClient } from '@supabase/supabase-js';
import type { AnalyseResponse } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for database tables
export interface SearchRecord {
  id: string;
  query: string;
  channel_id?: string;
  channel_title?: string;
  channel_handle?: string;
  age_band: 'E' | 'E10+' | 'T' | '16+';
  verdict: string;
  aggregate_scores: Record<string, number>;
  video_count: number;
  transcript_coverage?: {
    available: number;
    total: number;
    percentage: number;
    sufficient: boolean;
  };
  warnings?: string[];
  user_ip?: string;
  created_at: string;
}

export interface VideoAnalysisRecord {
  id: string;
  search_id: string;
  video_id: string;
  title: string;
  url: string;
  published_at?: string;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  category_scores: Record<string, number>;
  risk_note: string;
  engagement_metrics?: any;
  comment_analysis?: any;
  created_at: string;
}

// Save search results to Supabase
export async function saveSearchToSupabase(
  analysisResult: AnalyseResponse,
  userIP?: string
): Promise<string | null> {
  try {
    // Insert search record
    const searchData = {
      query: analysisResult.query,
      channel_id: analysisResult.channel?.id,
      channel_title: analysisResult.channel?.title,
      channel_handle: analysisResult.channel?.handle,
      age_band: analysisResult.aggregate.ageBand,
      verdict: analysisResult.aggregate.verdict,
      aggregate_scores: analysisResult.aggregate.scores,
      video_count: analysisResult.videos.length,
      transcript_coverage: analysisResult.transcriptCoverage,
      warnings: analysisResult.warnings || [],
      user_ip: userIP
    };

    const { data: searchRecord, error: searchError } = await supabase
      .from('searches')
      .insert(searchData)
      .select('id')
      .single();

    if (searchError) {
      console.error('Error saving search:', searchError);
      return null;
    }

    const searchId = searchRecord.id;

    // Insert video analysis records
    const videoData = analysisResult.videos.map(video => ({
      search_id: searchId,
      video_id: video.videoId,
      title: video.title,
      url: video.url,
      published_at: video.publishedAt,
      view_count: video.viewCount,
      like_count: video.likeCount,
      comment_count: video.commentCount,
      category_scores: video.categoryScores,
      risk_note: video.riskNote,
      engagement_metrics: video.engagementMetrics,
      comment_analysis: video.commentAnalysis
    }));

    const { error: videoError } = await supabase
      .from('video_analyses')
      .insert(videoData);

    if (videoError) {
      console.error('Error saving video analyses:', videoError);
      // Don't return null here - search was saved successfully
    }

    return searchId;
  } catch (error) {
    console.error('Error saving to Supabase:', error);
    return null;
  }
}

// Get recent searches for history
export async function getRecentSearches(limit: number = 20): Promise<SearchRecord[]> {
  try {
    const { data, error } = await supabase
      .from('searches')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent searches:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching recent searches:', error);
    return [];
  }
}

// Get search analytics
export async function getSearchAnalytics() {
  try {
    const { data: totalSearches, error: totalError } = await supabase
      .from('searches')
      .select('id', { count: 'exact', head: true });

    const { data: ageBandStats, error: ageBandError } = await supabase
      .from('searches')
      .select('age_band')
      .order('created_at', { ascending: false })
      .limit(1000); // Last 1000 searches for stats

    const { data: recentSearches, error: recentError } = await supabase
      .from('searches')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (totalError || ageBandError || recentError) {
      console.error('Error fetching analytics:', { totalError, ageBandError, recentError });
      return null;
    }

    // Calculate age band distribution
    const ageBandCounts = (ageBandStats || []).reduce((acc: Record<string, number>, item) => {
      acc[item.age_band] = (acc[item.age_band] || 0) + 1;
      return acc;
    }, {});

    return {
      totalSearches: totalSearches?.length || 0,
      recentSearches: recentSearches?.length || 0,
      ageBandDistribution: ageBandCounts
    };
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return null;
  }
}

// Get detailed search by ID
export async function getSearchDetails(searchId: string) {
  try {
    const { data: search, error: searchError } = await supabase
      .from('searches')
      .select('*')
      .eq('id', searchId)
      .single();

    if (searchError) {
      console.error('Error fetching search details:', searchError);
      return null;
    }

    const { data: videos, error: videosError } = await supabase
      .from('video_analyses')
      .select('*')
      .eq('search_id', searchId)
      .order('created_at', { ascending: true });

    if (videosError) {
      console.error('Error fetching video analyses:', videosError);
      return { search, videos: [] };
    }

    return { search, videos: videos || [] };
  } catch (error) {
    console.error('Error fetching search details:', error);
    return null;
  }
}