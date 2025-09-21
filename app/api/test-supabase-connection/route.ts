import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        details: `URL: ${supabaseUrl ? 'Set' : 'Missing'}\nAnon Key: ${supabaseAnonKey ? 'Set' : 'Missing'}`
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test basic connection
    const { data, error } = await supabase.from('search_analytics').select('count').limit(1);
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Connection failed',
        details: `Error: ${error.message}\nCode: ${error.code}\nHint: ${error.hint || 'None'}`
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Connection successful',
      details: `Connected to: ${supabaseUrl.substring(0, 30)}...\nTest query executed successfully`
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}