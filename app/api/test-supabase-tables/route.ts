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
        details: `URL: ${supabaseUrl ? 'Set' : 'Missing'}\nService Key: ${supabaseServiceKey ? 'Set' : 'Missing'}`
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Test table access
    const tables = ['search_analytics', 'feedback'];
    const results = [];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          results.push(`${table}: ERROR - ${error.message}`);
        } else {
          results.push(`${table}: OK - Table accessible`);
        }
      } catch (err) {
        results.push(`${table}: ERROR - ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
    
    const hasErrors = results.some(r => r.includes('ERROR'));
    
    return NextResponse.json({
      success: !hasErrors,
      error: hasErrors ? 'Some tables not accessible' : null,
      details: results.join('\n')
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}