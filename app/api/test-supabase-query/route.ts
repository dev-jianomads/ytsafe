import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing service role key',
        details: 'Service role key required for data queries'
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Test actual data query like parent-stats does
    const { data: searchData, error: searchError } = await supabase
      .from('search_analytics')
      .select('query, channel_name, channel_url, age_band, created_at, analysis_success')
      .eq('analysis_success', true)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (searchError) {
      return NextResponse.json({
        success: false,
        error: 'Query failed',
        details: `Error: ${searchError.message}\nCode: ${searchError.code}\nHint: ${searchError.hint || 'None'}`
      });
    }
    
    if (!searchData || searchData.length === 0) {
      return NextResponse.json({
        success: true,
        warning: true,
        message: 'No data found',
        details: 'Database is accessible but contains no search analytics data.\nThis is normal if no searches have been performed yet.'
      });
    }
    
    // Test feedback table too
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('feedback')
      .select('count')
      .limit(1);
    
    const feedbackStatus = feedbackError ? 
      `Feedback table: ERROR - ${feedbackError.message}` : 
      'Feedback table: OK';
    
    return NextResponse.json({
      success: true,
      message: 'Data queries successful',
      details: `Search Analytics: ${searchData.length} records found\n${feedbackStatus}\nSample record: ${JSON.stringify(searchData[0], null, 2)}`
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}