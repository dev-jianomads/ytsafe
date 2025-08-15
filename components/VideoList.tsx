import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import type { PerVideoScore } from '@/types';

interface VideoListProps {
  videos: PerVideoScore[];
}

export function VideoList({ videos }: VideoListProps) {
  const getRiskColor = (maxScore: number) => {
    if (maxScore <= 1) return 'bg-green-500';
    if (maxScore === 2) return 'bg-amber-500';
    return 'bg-red-500';
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
                    className="text-sm sm:text-base font-medium text-gray-900 hover:text-blue-600 line-clamp-2 sm:line-clamp-1 block"
                  >
                    {video.title}
                  </a>
                  <ExternalLink className="h-3 w-3 text-gray-400 inline ml-1" />
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
                  </div>
                  <Badge 
                    variant="secondary" 
                    className="text-xs whitespace-nowrap self-start sm:self-auto"
                  >
                    {video.riskNote}
                  </Badge>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}