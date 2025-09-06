import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function GET(req: NextRequest) {
  if (!supabase) {
    console.warn('Supabase not configured, returning mock data');
    return NextResponse.json({ 
      error: 'Database not configured',
      mostSearched: [],
      highestRisk: [],
      totalSearches: 0,
      totalChannels: 0,
      avgRiskScore: 0,
      ratingDistribution: {}
    });
  }

  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'all';
    
    console.log('📊 Fetching parent stats for range:', range);
    
    // Calculate date filter
    let dateFilter = {};
    if (range === '30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter = { created_at: { gte: thirtyDaysAgo.toISOString() } };
    }

    // Get all successful searches
    const { data: allSearches, error: searchError } = await supabase
      .from('search_analytics')
      .select('query, channel_name, channel_url, age_band, created_at')
      .eq('analysis_success', true)
      .gte('created_at', range === '30days' ? 
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() : 
        '1970-01-01'
      );

    if (searchError) {
      console.error('❌ Search query error:', searchError);
      throw new Error(`Database query failed: ${searchError.message}`);
    }

    console.log('📊 Raw search data:', {
      totalRecords: allSearches?.length || 0,
      sampleRecord: allSearches?.[0] || null
    });

    // Helper function to clean up display names and extract URLs from legacy data
    const processLegacyRecord = (record: any) => {
      let displayName = record.channel_name || record.query;
      let channelUrl = record.channel_url;
      let channelHandle = null;
      
      // If no channel_url but query looks like a URL, use it
      if (!channelUrl && record.query) {
        if (record.query.includes('youtube.com/')) {
          channelUrl = record.query;
        } else if (record.query.startsWith('@')) {
          // Convert @handle to proper YouTube URL
          const cleanHandle = record.query.replace(/^@+/, '');
          channelUrl = `https://www.youtube.com/@${cleanHandle}`;
          channelHandle = `@${cleanHandle}`;
        }
      }
      
      // Clean up display name
      if (!record.channel_name) {
        if (record.query.startsWith('@')) {
          // Convert "@gameranxTV" to "GameranxTV"
          displayName = record.query.replace(/^@+/, '');
        } else if (record.query.includes('youtube.com/watch')) {
          // For video URLs, try to extract a meaningful name or use "Video Link"
          displayName = 'Video Link';
        } else if (record.query.includes('youtube.com/')) {
          // For other YouTube URLs, try to extract channel info
          const urlParts = record.query.split('/');
          const lastPart = urlParts[urlParts.length - 1];
          if (lastPart && lastPart !== 'youtube.com') {
            displayName = lastPart.replace(/^@+/, '');
          } else {
            displayName = 'YouTube Channel';
          }
        }
        // Otherwise keep the original query as display name
      }
      
      // Extract handle from channel_url if we have one but no handle yet
      if (channelUrl && !channelHandle) {
        if (channelUrl.includes('youtube.com/@')) {
          const handleMatch = channelUrl.match(/youtube\.com\/@([^/?]+)/);
          if (handleMatch) {
            channelHandle = `@${handleMatch[1]}`;
          }
        } else if (channelUrl.includes('youtube.com/channel/')) {
          // For channel ID URLs, we can't extract a nice handle
          channelHandle = null;
        }
      }
      
      return {
        displayName,
        channelUrl,
        channelHandle
      };
    };

    if (!allSearches || allSearches.length === 0) {
      console.warn('⚠️ No search data found');
      return NextResponse.json({
        mostSearched: [],
        highestRisk: [],
        totalSearches: 0,
        totalChannels: 0,
        avgRiskScore: 0,
        ratingDistribution: { 'E': 0, 'E10+': 0, 'T': 0, '16+': 0 }
      });
    }

    // Group by query to get search counts
    const queryGroups: Record<string, any[]> = {};
    allSearches.forEach((search: any) => {
      if (!queryGroups[search.query]) {
        queryGroups[search.query] = [];
      }
      queryGroups[search.query].push(search);
    });

    console.log('📊 Query groups:', {
      totalQueries: Object.keys(queryGroups).length,
      sampleQueries: Object.keys(queryGroups).slice(0, 3)
    });

    // Calculate most searched channels
    const mostSearched = Object.entries(queryGroups)
      .map(([query, searches]) => {
        const latestSearch = searches.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        
        // Process legacy record data
        const processed = processLegacyRecord(latestSearch);
        
        // Calculate average risk score from age band
        const avgScore = searches.reduce((sum, search) => {
          const score = search.age_band === 'E' ? 0.5 :
                       search.age_band === 'E10+' ? 1.5 :
                       search.age_band === 'T' ? 2.5 :
                       search.age_band === '16+' ? 3.5 : 0;
          return sum + score;
        }, 0) / searches.length;

        return {
          query,
          channel_title: processed.displayName,
          channel_url: processed.channelUrl,
          channel_handle: processed.channelHandle,
          channel_thumbnail: null, // We don't store thumbnails
          search_count: searches.length,
          avg_score: avgScore,
          age_band: latestSearch.age_band,
          latest_search: latestSearch.created_at
        };
      })
      .sort((a, b) => b.search_count - a.search_count)
      .slice(0, 20);

    // Calculate highest risk channels (only those with scores > 0)
    const highestRisk = Object.entries(queryGroups)
      .map(([query, searches]) => {
        const latestSearch = searches.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        
        // Calculate average risk score from age band
        const avgScore = searches.reduce((sum, search) => {
          const score = search.age_band === 'E' ? 0.5 :
                       search.age_band === 'E10+' ? 1.5 :
                       search.age_band === 'T' ? 2.5 :
                       search.age_band === '16+' ? 3.5 : 0;
          return sum + score;
        }, 0) / searches.length;

        return {
          query,
          channel_title: latestSearch.channel_name || null,
          channel_handle: latestSearch.channel_url ? 
            latestSearch.channel_url.split('/').pop() : null,
          channel_thumbnail: null, // We don't store thumbnails
          search_count: searches.length,
          avg_score: avgScore,
          age_band: latestSearch.age_band,
          latest_search: latestSearch.created_at
        };
      })
      .filter(channel => channel.avg_score > 0)
      .sort((a, b) => b.avg_score - a.search_count) // Sort by risk score, then by search count
      .slice(0, 20);

    // Calculate aggregate stats
    const totalSearches = allSearches.length;
    const uniqueChannels = Object.keys(queryGroups).length;
    
    // Calculate average risk score and rating distribution
    let totalRiskScore = 0;
    let riskScoreCount = 0;
    const ratingDistribution: Record<string, number> = { 'E': 0, 'E10+': 0, 'T': 0, '16+': 0 };

    allSearches.forEach((record: any) => {
      if (record.age_band) {
        ratingDistribution[record.age_band] = (ratingDistribution[record.age_band] || 0) + 1;
      }
      
      // Calculate average risk score (estimate from age band)
      if (record.age_band) {
        let estimatedScore = 0;
        switch (record.age_band) {
          case 'E': estimatedScore = 0.5; break;
          case 'E10+': estimatedScore = 1.5; break;
          case 'T': estimatedScore = 2.5; break;
          case '16+': estimatedScore = 3.5; break;
        }
        totalRiskScore += estimatedScore;
        riskScoreCount++;
      }
    });

    const avgRiskScore = riskScoreCount > 0 ? totalRiskScore / riskScoreCount : 0;

    console.log('📊 Final stats:', {
      totalSearches,
      uniqueChannels,
      avgRiskScore,
      mostSearchedCount: mostSearched.length,
      highestRiskCount: highestRisk.length,
      ratingDistribution
    });

    return NextResponse.json({
      mostSearched,
      highestRisk,
      totalSearches,
      totalChannels: uniqueChannels,
      avgRiskScore,
      ratingDistribution
    });

  } catch (error) {
    console.error('❌ Parent stats API error:', error);
    return NextResponse.json({ 
      error: `Failed to fetch statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
      mostSearched: [],
      highestRisk: [],
      totalSearches: 0,
      totalChannels: 0,
      avgRiskScore: 0,
      ratingDistribution: { 'E': 0, 'E10+': 0, 'T': 0, '16+': 0 }
    }, { status: 500 });
  }
}