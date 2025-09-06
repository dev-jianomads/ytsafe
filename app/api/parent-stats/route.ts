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
    
    // Calculate date filter
    let dateFilter = '';
    if (range === '30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter = `AND created_at >= '${thirtyDaysAgo.toISOString()}'`;
    }

    // Get most searched channels
    const { data: mostSearchedData, error: mostSearchedError } = await supabase
      .rpc('get_most_searched_channels', { 
        days_filter: range === '30days' ? 30 : null 
      });

    if (mostSearchedError) {
      console.error('Most searched query error:', mostSearchedError);
    }

    // Get highest risk channels
    const { data: highestRiskData, error: highestRiskError } = await supabase
      .rpc('get_highest_risk_channels', { 
        days_filter: range === '30days' ? 30 : null 
      });

    if (highestRiskError) {
      console.error('Highest risk query error:', highestRiskError);
    }

    // Get overall stats
    const { data: statsData, error: statsError } = await supabase
      .from('search_analytics')
      .select('*')
      .eq('analysis_success', true)
      .gte('created_at', range === '30days' ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() : '1970-01-01');

    if (statsError) {
      console.error('Stats query error:', statsError);
    }

    // Calculate aggregate stats
    const totalSearches = statsData?.length || 0;
    const uniqueChannels = new Set(statsData?.map((s: any) => s.query) || []).size;
    
    // Calculate average risk score from category scores
    let totalRiskScore = 0;
    let riskScoreCount = 0;
    const ratingDistribution: Record<string, number> = { 'E': 0, 'E10+': 0, 'T': 0, '16+': 0 };

    statsData?.forEach(record => {
      if (record.age_band) {
        ratingDistribution[record.age_band] = (ratingDistribution[record.age_band] || 0) + 1;
      }
      
      // Calculate average risk score (we'll approximate from age band since we don't store individual category scores)
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

    return NextResponse.json({
      mostSearched: mostSearchedData || [],
      highestRisk: highestRiskData || [],
      totalSearches,
      totalChannels: uniqueChannels,
      avgRiskScore,
      ratingDistribution
    });

  } catch (error) {
    console.error('Parent stats API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch statistics',
      mostSearched: [],
      highestRisk: [],
      totalSearches: 0,
      totalChannels: 0,
      avgRiskScore: 0,
      ratingDistribution: {}
    }, { status: 500 });
  }
}