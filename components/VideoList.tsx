import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, MessageCircle, ThumbsUp, AlertTriangle, TrendingUp, Eye, GraduationCap } from 'lucide-react';
import type { PerVideoScore } from '@/types';

interface VideoListProps {
  videos: PerVideoScore[];
}

export function VideoList({ videos }: VideoListProps) {
  const getRiskColor = (maxScore: number) => {
    if (maxScore <= 1) return 'bg-green-500';      // Green: 0-1
    if (maxScore <= 2) return 'bg-amber-500';      // Yellow: >1-2
    if (maxScore <= 3) return 'bg-orange-500';     // Orange: >2-3
    return 'bg-red-500';                           // Red: Extreme
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatViewCount = (count?: number) => {
    if (!count) return '0';
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    if (count < 1000000000) return `${(count / 1000000).toFixed(1)}M`;
    return `${(count / 1000000000).toFixed(1)}B`;
  };

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'suspicious': return 'text-red-600';
      case 'high': return 'text-blue-600';
      case 'low': return 'text-gray-500';
      default: return 'text-gray-600';
    }
  };

  const getEngagementIcon = (level: string) => {
    switch (level) {
      case 'suspicious': return <AlertTriangle className="h-3 w-3" />;
      case 'high': return <TrendingUp className="h-3 w-3" />;
      case 'low': return <Eye className="h-3 w-3" />;
      default: return <ThumbsUp className="h-3 w-3" />;
    }
  };

  return (
    <Card className="p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold mb-4">Recent Videos Analyzed</h3>
      <div className="space-y-3 sm:space-y-4">
        {videos.map((video) => {
          const maxScore = Math.max(...Object.values(video.categoryScores));
          
          return (
            <div 
              key={video.videoId}
              className="flex items-start sm:items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div 
                className={`w-3 h-3 rounded-full flex-shrink-0 ${getRiskColor(maxScore)}`}
                title={`Risk level: ${maxScore}/4`}
              />
              
              <div className="flex-1 min-w-0 space-y-2 sm:space-y-1">
                <div className="space-y-1">
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm sm:text-base font-medium text-blue-600 hover:text-blue-800 hover:underline line-clamp-2 sm:line-clamp-1 block transition-colors duration-200 cursor-pointer"
                  >
                    {video.title}
                    <ExternalLink className="h-3 w-3 text-blue-500 inline ml-1 align-top" />
                  </a>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {formatDate(video.publishedAt)}
                    </span>
                    {video.viewCount && (
                      <>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {formatViewCount(video.viewCount)} views
                        </span>
                      </>
                    )}
                    {video.engagementMetrics && (
                      <>
                        <span className="text-xs text-gray-400">•</span>
                        <div className={`flex items-center gap-1 text-xs ${getEngagementColor(video.engagementMetrics.audienceEngagement)}`}>
                          {getEngagementIcon(video.engagementMetrics.audienceEngagement)}
                          <span className="capitalize">{video.engagementMetrics.audienceEngagement}</span>
                        </div>
                      </>
                    )}
                  </div>
                  <Badge 
                    variant="secondary" 
                    className="text-xs whitespace-nowrap self-start sm:self-auto"
                  >
                    {video.riskNotes[0]}
                  </Badge>
                  
                  {video.riskNotes.slice(1).map((note, idx) => (
                    <Badge 
                      key={idx}
                      variant="secondary" 
                      className="text-xs whitespace-nowrap self-start sm:self-auto"
                    >
                      {note}
                    </Badge>
                  ))}
                  
                  {video.isEducational && (
                    <Badge 
                      variant="outline" 
                      className="text-xs whitespace-nowrap self-start sm:self-auto bg-blue-50 text-blue-700 border-blue-200"
                    >
                      <GraduationCap className="h-3 w-3 mr-1" />
                      Educational
                    </Badge>
                  )}
                  
                  {video.commentAnalysis && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MessageCircle className="h-3 w-3" />
                      <span>{video.commentAnalysis.totalComments}</span>
                      {video.commentAnalysis.avgSentiment === 'negative' && (
                        <AlertTriangle className="h-3 w-3 text-amber-500" />
                      )}
                      {video.commentAnalysis.avgSentiment === 'positive' && (
                        <ThumbsUp className="h-3 w-3 text-green-500" />
                      )}
                    </div>
                  )}
                </div>
                
                {video.commentAnalysis?.communityFlags && video.commentAnalysis.communityFlags.length > 0 && (
                  <div className="mt-1">
                    <div className="flex flex-wrap gap-1">
                      {video.commentAnalysis.communityFlags.slice(0, 2).map((flag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs text-amber-700 bg-amber-50 border-amber-200">
                          {flag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {video.engagementMetrics && video.engagementMetrics.controversyScore > 0.5 && (
                  <div className="mt-1">
                    <Badge variant="outline" className="text-xs text-red-700 bg-red-50 border-red-200">
                      High controversy ({Math.round(video.engagementMetrics.controversyScore * 100)}%)
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}