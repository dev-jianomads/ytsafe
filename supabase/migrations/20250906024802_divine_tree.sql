/*
  # Parent Stats Functions

  1. Functions
    - `get_most_searched_channels` - Returns channels ordered by search count
    - `get_highest_risk_channels` - Returns channels ordered by estimated risk score

  2. Security
    - Functions are accessible to public for the stats page
*/

-- Function to get most searched channels
CREATE OR REPLACE FUNCTION get_most_searched_channels(days_filter INTEGER DEFAULT NULL)
RETURNS TABLE (
  query TEXT,
  channel_title TEXT,
  channel_handle TEXT,
  channel_thumbnail TEXT,
  search_count BIGINT,
  avg_score NUMERIC,
  age_band TEXT,
  latest_search TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.query,
    NULL::TEXT as channel_title,
    NULL::TEXT as channel_handle, 
    NULL::TEXT as channel_thumbnail,
    COUNT(*)::BIGINT as search_count,
    CASE 
      WHEN AVG(CASE sa.age_band 
        WHEN 'E' THEN 0.5 
        WHEN 'E10+' THEN 1.5 
        WHEN 'T' THEN 2.5 
        WHEN '16+' THEN 3.5 
        ELSE 0 
      END) > 0 THEN AVG(CASE sa.age_band 
        WHEN 'E' THEN 0.5 
        WHEN 'E10+' THEN 1.5 
        WHEN 'T' THEN 2.5 
        WHEN '16+' THEN 3.5 
        ELSE 0 
      END)
      ELSE NULL
    END as avg_score,
    MODE() WITHIN GROUP (ORDER BY sa.age_band) as age_band,
    MAX(sa.created_at) as latest_search
  FROM search_analytics sa
  WHERE sa.analysis_success = true
    AND (days_filter IS NULL OR sa.created_at >= NOW() - (days_filter || ' days')::INTERVAL)
  GROUP BY sa.query
  HAVING COUNT(*) >= 1
  ORDER BY search_count DESC, latest_search DESC
  LIMIT 20;
END;
$$;

-- Function to get highest risk channels
CREATE OR REPLACE FUNCTION get_highest_risk_channels(days_filter INTEGER DEFAULT NULL)
RETURNS TABLE (
  query TEXT,
  channel_title TEXT,
  channel_handle TEXT,
  channel_thumbnail TEXT,
  search_count BIGINT,
  avg_score NUMERIC,
  age_band TEXT,
  latest_search TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.query,
    NULL::TEXT as channel_title,
    NULL::TEXT as channel_handle,
    NULL::TEXT as channel_thumbnail,
    COUNT(*)::BIGINT as search_count,
    AVG(CASE sa.age_band 
      WHEN 'E' THEN 0.5 
      WHEN 'E10+' THEN 1.5 
      WHEN 'T' THEN 2.5 
      WHEN '16+' THEN 3.5 
      ELSE 0 
    END) as avg_score,
    MODE() WITHIN GROUP (ORDER BY sa.age_band) as age_band,
    MAX(sa.created_at) as latest_search
  FROM search_analytics sa
  WHERE sa.analysis_success = true
    AND (days_filter IS NULL OR sa.created_at >= NOW() - (days_filter || ' days')::INTERVAL)
    AND sa.age_band IS NOT NULL
  GROUP BY sa.query
  HAVING COUNT(*) >= 1 AND AVG(CASE sa.age_band 
    WHEN 'E' THEN 0.5 
    WHEN 'E10+' THEN 1.5 
    WHEN 'T' THEN 2.5 
    WHEN '16+' THEN 3.5 
    ELSE 0 
  END) > 0
  ORDER BY avg_score DESC, search_count DESC
  LIMIT 20;
END;
$$;