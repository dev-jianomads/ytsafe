export function extractVideoId(url: string): string {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  
  return '';
}

export async function resolveChannelId(q: string, apiKey: string): Promise<string> {
  const query = q.trim();
  
  console.log('🔍 Resolving channel ID for query:', {
    original: q,
    trimmed: query,
    length: query.length,
    type: typeof query
  });
  
  // Handle @name format
  if (/^@[\w.-]+$/.test(query)) {
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.set('part', 'snippet');
    searchUrl.searchParams.set('type', 'channel');
    searchUrl.searchParams.set('q', query);
    searchUrl.searchParams.set('key', apiKey);
    searchUrl.searchParams.set('maxResults', '1');
    
    const response = await fetch(searchUrl);
    const data = await response.json();
    return data.items?.[0]?.snippet?.channelId ?? "";
  }
  
  // Video URL → channelId
  if (query.includes("youtube.com/watch") || query.includes("youtu.be/")) {
    const videoId = extractVideoId(query);
    if (videoId) {
      const videoUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
      videoUrl.searchParams.set('part', 'snippet');
      videoUrl.searchParams.set('id', videoId);
      videoUrl.searchParams.set('key', apiKey);
      
      const response = await fetch(videoUrl);
      const data = await response.json();
      return data.items?.[0]?.snippet?.channelId ?? "";
    }
  }
  
  // Channel URL
  if (query.includes("youtube.com/")) {
    // Try /channel/UC... format
    const channelMatch = query.match(/\/channel\/(UC[\w-]+)/);
    if (channelMatch) return channelMatch[1];
    
    // Try /user/ or /c/ format via search
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.set('part', 'snippet');
    searchUrl.searchParams.set('type', 'channel');
    searchUrl.searchParams.set('q', query);
    searchUrl.searchParams.set('key', apiKey);
    searchUrl.searchParams.set('maxResults', '1');
    
    const response = await fetch(searchUrl);
    const data = await response.json();
    return data.items?.[0]?.snippet?.channelId ?? "";
  }
  
  // Generic search
  const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
  searchUrl.searchParams.set('part', 'snippet');
  searchUrl.searchParams.set('type', 'channel');
  searchUrl.searchParams.set('q', query);
  searchUrl.searchParams.set('key', apiKey);
  searchUrl.searchParams.set('maxResults', '1');
  
  const response = await fetch(searchUrl);
  const data = await response.json();
  return data.items?.[0]?.snippet?.channelId ?? "";
}

export async function getVideoComments(videoId: string, apiKey: string, maxResults: number = 20) {
  const commentsUrl = new URL('https://www.googleapis.com/youtube/v3/commentThreads');
  commentsUrl.searchParams.set('part', 'snippet');
  commentsUrl.searchParams.set('videoId', videoId);
  commentsUrl.searchParams.set('order', 'relevance'); // Get top comments
  commentsUrl.searchParams.set('maxResults', maxResults.toString());
  commentsUrl.searchParams.set('key', apiKey);
  
  try {
    const response = await fetch(commentsUrl);
    const data = await response.json();
    
    if (!response.ok) {
      // Comments might be disabled or restricted
      return [];
    }
    
    return (data.items ?? []).map((item: any) => ({
      id: item.id,
      text: item.snippet.topLevelComment.snippet.textDisplay,
      author: item.snippet.topLevelComment.snippet.authorDisplayName,
      likeCount: item.snippet.topLevelComment.snippet.likeCount || 0,
      publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
      replyCount: item.snippet.totalReplyCount || 0
    }));
  } catch (error) {
    console.warn(`Failed to fetch comments for video ${videoId}:`, error);
    return [];
  }
}

export async function listRecentVideoIds(channelId: string, apiKey: string, max: number = 10): Promise<string[]> {
  const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
  searchUrl.searchParams.set('part', 'snippet');
  searchUrl.searchParams.set('channelId', channelId);
  searchUrl.searchParams.set('order', 'date');
  searchUrl.searchParams.set('type', 'video');
  searchUrl.searchParams.set('maxResults', max.toString());
  searchUrl.searchParams.set('key', apiKey);
  
  const response = await fetch(searchUrl);
  const data = await response.json();
  return (data.items ?? []).map((item: any) => item.id?.videoId).filter(Boolean);
}

export async function getChannelInfo(channelId: string, apiKey: string) {
  const channelUrl = new URL('https://www.googleapis.com/youtube/v3/channels');
  channelUrl.searchParams.set('part', 'snippet');
  channelUrl.searchParams.set('id', channelId);
  channelUrl.searchParams.set('key', apiKey);
  
  const response = await fetch(channelUrl);
  const data = await response.json();
  const channel = data.items?.[0];
  
  return {
    id: channel?.id,
    title: channel?.snippet?.title,
    handle: channel?.snippet?.customUrl ? (channel.snippet.customUrl.startsWith('@') ? channel.snippet.customUrl : `@${channel.snippet.customUrl}`) : undefined,
    thumbnail: channel?.snippet?.thumbnails?.default?.url
  };
}