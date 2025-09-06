'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  Heart, TrendingUp, AlertTriangle, Share, 
  ArrowLeft, BarChart3, Search, Shield, Eye, Calendar
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface ChannelStat {
  query: string;
  channel_title?: string;
  channel_handle?: string;
  channel_url?: string;
  search_count: number;
  avg_score?: number;
  age_band?: string;
  latest_search?: string;
}

interface StatsData {
  mostSearched: ChannelStat[];
  highestRisk: ChannelStat[];
  totalSearches: number;
  totalChannels: number;
  avgRiskScore: number;
  ratingDistribution: Record<string, number>;
}

export default function ParentStatsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'all' | '30days'>('all');

  const fetchStats = async (range: 'all' | '30days') => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/parent-stats?range=${range}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch stats');
      }
      
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load statistics');
      console.error('Stats fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(timeRange);
  }, [timeRange]);

  const getAgeBadgeColor = (ageBand?: string) => {
    switch (ageBand) {
      case 'E': return 'bg-green-500 text-white';
      case 'E10+': return 'bg-emerald-500 text-white';
      case 'T': return 'bg-amber-500 text-white';
      case '16+': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getRiskColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score <= 1) return 'text-green-600';
    if (score <= 2) return 'text-yellow-600';
    if (score <= 3) return 'text-orange-600';
    return 'text-red-600';
  };

  const handleShare = async () => {
    if (!data) return;
    
    const shareText = `YouTube Safety Statistics - Parent Insights
${'='.repeat(50)}

📊 Community Safety Overview (${timeRange === 'all' ? 'All Time' : 'Last 30 Days'}):
• Total Searches: ${data.totalSearches.toLocaleString()}
• Unique Channels: ${data.totalChannels.toLocaleString()}
• Average Risk Score: ${data.avgRiskScore.toFixed(1)}/4

🔍 Most Searched Channels:
${data.mostSearched.slice(0, 5).map((channel, idx) => 
  `${idx + 1}. ${channel.channel_title || channel.query} (${channel.search_count} searches)`
).join('\n')}

⚠️ Highest Risk Channels:
${data.highestRisk.slice(0, 5).map((channel, idx) => 
  `${idx + 1}. ${channel.channel_title || channel.query} - ${channel.age_band} (${channel.avg_score?.toFixed(1)}/4)`
).join('\n')}

📈 Age Rating Distribution:
${Object.entries(data.ratingDistribution).map(([rating, count]) => 
  `• ${rating}: ${count} channels`
).join('\n')}

---
Data from StreamSafe Kids - ESRB Age Ratings for YouTube
Always preview content yourself and consider your child's maturity level.`;

    try {
      await navigator.clipboard.writeText(shareText);
      toast.success('Statistics copied to clipboard!', {
        description: 'Share these insights with other parents.',
        duration: 3000,
      });
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <Heart className="h-6 w-6 text-pink-500" />
            <h1 className="text-2xl font-bold text-gray-900">Parent Statistics</h1>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </Card>
            ))}
          </div>
          
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading statistics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <Heart className="h-6 w-6 text-pink-500" />
            <h1 className="text-2xl font-bold text-gray-900">Parent Statistics</h1>
          </div>
          
          <Card className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Statistics</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => fetchStats(timeRange)}>
              Try Again
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <Heart className="h-6 w-6 text-pink-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Parent Statistics</h1>
                <p className="text-sm text-gray-600">Community insights for safer YouTube viewing</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={handleShare}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Share className="h-4 w-4" />
                Share Stats
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Time Range Toggle */}
        <div className="flex justify-center mb-8">
          <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as 'all' | '30days')}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="all" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                All Time
              </TabsTrigger>
              <TabsTrigger value="30days" className="gap-2">
                <Calendar className="h-4 w-4" />
                Last 30 Days
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Search className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Searches</p>
                <p className="text-2xl font-bold text-gray-900">{data.totalSearches.toLocaleString()}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Unique Channels</p>
                <p className="text-2xl font-bold text-gray-900">{data.totalChannels.toLocaleString()}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Risk Score</p>
                <p className="text-2xl font-bold text-gray-900">{data.avgRiskScore.toFixed(1)}/4</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Most Common Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.entries(data.ratingDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Most Searched Channels */}
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Most Searched Channels</h2>
          </div>
          
          {/* Header for mobile */}
          <div className="flex justify-between items-center text-sm text-gray-600 font-medium mb-3 px-3 sm:hidden">
            <span>Channel</span>
            <span>Searches</span>
          </div>
          
          <div className="space-y-3">
            {data.mostSearched.slice(0, 10).map((channel, index) => (
              <div key={`${channel.query}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-700 flex-shrink-0">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {channel.channel_url ? (
                      <a
                        href={channel.channel_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-gray-900 hover:text-blue-600 hover:underline line-clamp-1"
                      >
                        {channel.channel_title || channel.query}
                      </a>
                    ) : (
                      <span className="font-semibold text-gray-900 line-clamp-1">
                        {channel.channel_title || channel.query}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  {channel.age_band && (
                    <Badge className={`text-xs ${getAgeBadgeColor(channel.age_band)}`}>
                      {channel.age_band}
                    </Badge>
                  )}
                  {channel.avg_score && (
                    <span className={`text-sm font-medium ${getRiskColor(channel.avg_score)} hidden sm:inline`}>
                      {channel.avg_score.toFixed(1)}/4
                    </span>
                  )}
                  <span className="text-sm text-gray-600 font-medium">
                    <span className="sm:hidden">{channel.search_count}</span>
                    <span className="hidden sm:inline">{channel.search_count} searches</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Highest Risk Channels */}
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <h2 className="text-xl font-bold text-gray-900">Highest Risk Channels</h2>
          </div>
          
          {/* Header for mobile - no searches column for highest risk */}
          <div className="text-sm text-gray-600 font-medium mb-3 px-3 sm:hidden">
            <span>Channel</span>
          </div>
          
          <div className="space-y-3">
            {data.highestRisk.slice(0, 10).map((channel, index) => (
              <div key={`${channel.query}-${index}`} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100 hover:bg-red-100 transition-colors">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-sm font-bold text-red-700 flex-shrink-0">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {channel.channel_url ? (
                      <a
                        href={channel.channel_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-gray-900 hover:text-red-600 hover:underline line-clamp-1"
                      >
                        {channel.channel_title || channel.query}
                      </a>
                    ) : (
                      <span className="font-semibold text-gray-900 line-clamp-1">
                        {channel.channel_title || channel.query}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  {channel.age_band && (
                    <Badge className={`text-xs ${getAgeBadgeColor(channel.age_band)}`}>
                      {channel.age_band}
                    </Badge>
                  )}
                  <span className={`text-sm font-medium ${getRiskColor(channel.avg_score)}`}>
                    {channel.avg_score?.toFixed(1)}/4
                  </span>
                  <span className="text-sm text-gray-600 font-medium hidden sm:inline">
                    {channel.search_count} searches
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Age Rating Distribution */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">Age Rating Distribution</h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(data.ratingDistribution).map(([rating, count]) => (
              <div key={rating} className="text-center p-4 bg-gray-50 rounded-lg">
                <Badge className={`text-lg px-3 py-1 mb-2 ${getAgeBadgeColor(rating)}`}>
                  {rating}
                </Badge>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-600">channels</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}