import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Parent Stats API Environment Check:', {
  hasUrl: !!supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  urlPreview: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'missing',
  keyPreview: supabaseServiceKey ? `${supabaseServiceKey.substring(0, 10)}...` : 'missing'
});

let supabase: any = null;

if (supabaseUrl && supabaseServiceKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log('✅ Supabase client created successfully');
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error);
  }
} else {
  console.warn('⚠️ Supabase not configured - missing environment variables');
}

export async function GET(req: NextRequest) {
  console.log('📊 Parent Stats API called');
  
  // If Supabase is not configured, return mock data
  if (!supabase) {
    console.warn('🔧 Supabase not configured, returning empty data');
    return NextResponse.json({ 
      mostSearched: [],
      highestRisk: [],
      totalSearches: 0,
      totalChannels: 0,
      avgRiskScore: 0,
      ratingDistribution: { 'E': 0, 'E10+': 0, 'T': 0, '16+': 0 },
      error: 'Database not configured - check environment variables'
    });
  }

  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'all';
    
    console.log('📊 Fetching parent stats for range:', range);
    
    // Test basic connection first
    console.log('🔍 Testing Supabase connection...');
    const { count: testCount, error: testError } = await supabase
      .from('search_analytics')
      .select('*', { count: 'exact', head: true });
    
    if (testError) {
      console.error('❌ Supabase connection test failed:', testError);
      return NextResponse.json({
        error: `Database connection failed: ${testError.message}`,
        mostSearched: [],
        highestRisk: [],
        totalSearches: 0,
        totalChannels: 0,
        avgRiskScore: 0,
        ratingDistribution: { 'E': 0, 'E10+': 0, 'T': 0, '16+': 0 }
      }, { status: 500 });
    }
    
    console.log('✅ Supabase connection test passed, total records:', testCount);
    
    // Calculate date filter
    let dateFilter = '1970-01-01';
    if (range === '30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter = thirtyDaysAgo.toISOString();
    }
    
    console.log('📅 Using date filter:', dateFilter);
    
    // Get all successful searches
    console.log('🔍 Querying search_analytics table...');
    const { data: allSearches, error: searchError } = await supabase
      .from('search_analytics')
      .select('query, channel_name, channel_url, age_band, created_at')
      .eq('analysis_success', true)
      .gte('created_at', dateFilter)
      .order('created_at', { ascending: false });

    if (searchError) {
      console.error('❌ Search query error:', searchError);
      return NextResponse.json({
        error: `Database query failed: ${searchError.message}`,
        mostSearched: [],
        highestRisk: [],
        totalSearches: 0,
        totalChannels: 0,
        avgRiskScore: 0,
        ratingDistribution: { 'E': 0, 'E10+': 0, 'T': 0, '16+': 0 }
      }, { status: 500 });
    }

    console.log('📊 Query successful, records found:', allSearches?.length || 0);

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

    // Process the data
    const processLegacyRecord = (record: any) => {
      let displayName = record.channel_name || record.query;
      let channelUrl = record.channel_url;
      
      // Clean up display name and generate URL if missing
      if (!record.channel_name) {
        if (record.query.startsWith('@')) {
          displayName = record.query.replace(/^@+/, '');
          if (!channelUrl) {
            channelUrl = `https://www.youtube.com/${record.query}`;
          }
        } else if (record.query.includes('youtube.com/watch')) {
          displayName = 'Video Link';
        } else if (record.query.includes('youtube.com/')) {
          channelUrl = record.query;
          const urlParts = record.query.split('/');
          const lastPart = urlParts[urlParts.length - 1];
          if (lastPart && lastPart !== 'youtube.com') {
            displayName = lastPart.replace(/^@+/, '');
          } else {
            displayName = 'YouTube Channel';
          }
        }
      }
      
      return { displayName, channelUrl };
    };

    // Group by query
    const queryGroups: Record<string, any[]> = {};
    allSearches.forEach((search: any) => {
      if (!queryGroups[search.query]) {
        queryGroups[search.query] = [];
      }
      queryGroups[search.query].push(search);
    });

    console.log('📊 Grouped into', Object.keys(queryGroups).length, 'unique queries');

    // Calculate most searched channels
    const mostSearched = Object.entries(queryGroups)
      .map(([query, searches]) => {
        const latestSearch = searches[0]; // Already sorted by created_at desc
        const processed = processLegacyRecord(latestSearch);
        
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
          search_count: searches.length,
          avg_score: avgScore,
          age_band: latestSearch.age_band,
          latest_search: latestSearch.created_at
        };
      })
      .sort((a, b) => b.search_count - a.search_count)
      .slice(0, 20);

    // Calculate highest risk channels
    const highestRisk = Object.entries(queryGroups)
      .map(([query, searches]) => {
        const latestSearch = searches[0];
        const processed = processLegacyRecord(latestSearch);
        
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
          search_count: searches.length,
          avg_score: avgScore,
          age_band: latestSearch.age_band,
          latest_search: latestSearch.created_at
        };
      })
      .filter(channel => channel.avg_score > 0)
      .sort((a, b) => b.avg_score - a.avg_score || b.search_count - a.search_count)
      .slice(0, 20);

    // Calculate aggregate stats
    const totalSearches = allSearches.length;
    const uniqueChannels = Object.keys(queryGroups).length;
    
    let totalRiskScore = 0;
    let riskScoreCount = 0;
    const ratingDistribution: Record<string, number> = { 'E': 0, 'E10+': 0, 'T': 0, '16+': 0 };

    allSearches.forEach((record: any) => {
      if (record.age_band) {
        ratingDistribution[record.age_band] = (ratingDistribution[record.age_band] || 0) + 1;
        
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

    console.log('✅ Successfully processed stats:', {
      totalSearches,
      uniqueChannels,
      avgRiskScore: avgRiskScore.toFixed(2),
      mostSearchedCount: mostSearched.length,
      highestRiskCount: highestRisk.length
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