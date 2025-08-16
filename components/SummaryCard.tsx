import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AlertTriangle } from 'lucide-react';
import type { Aggregate } from '@/types';

interface SummaryCardProps {
  aggregate: Aggregate;
  channel?: {
    title?: string;
    thumbnail?: string;
    handle?: string;
  };
  transcriptCoverage?: {
    available: number;
    total: number;
    percentage: number;
    sufficient: boolean;
  };
}

export function SummaryCard({ aggregate, channel, transcriptCoverage }: SummaryCardProps) {
  const getAgeBadgeColor = (ageBand: string) => {
    switch (ageBand) {
      case 'E': return 'bg-green-500 text-white hover:bg-green-600';
      case 'E10+': return 'bg-emerald-500 text-white hover:bg-emerald-600';
      case 'T': return 'bg-amber-500 text-white hover:bg-amber-600';
      case '16+': return 'bg-red-500 text-white hover:bg-red-600';
      default: return 'bg-gray-500 text-white hover:bg-gray-600';
    }
  };

  return (
    <Card className="p-4 sm:p-6 mb-6">
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {channel?.thumbnail && (
            <Avatar className="h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0">
              <AvatarImage src={channel.thumbnail} alt={channel.title} />
              <AvatarFallback>{channel.title?.[0]}</AvatarFallback>
            </Avatar>
          )}
        
          {channel?.title && (
            <div className="sm:hidden">
              <h3 className="font-semibold text-gray-900 text-lg">{channel.title}</h3>
              {channel.handle && (
                <p className="text-sm text-gray-500">{channel.handle}</p>
              )}
            </div>
          )}
        </div>
        
        <div className="flex-1 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
            <Badge 
              className={`text-base sm:text-lg px-3 py-1 sm:px-4 sm:py-2 font-bold self-start ${getAgeBadgeColor(aggregate.ageBand)}`}
            >
              {aggregate.ageBand}
            </Badge>
            {transcriptCoverage && !transcriptCoverage.sufficient && (
              <Badge 
                variant="outline" 
                className="text-xs bg-amber-50 text-amber-700 border-amber-200 self-start flex items-center gap-1"
              >
                <AlertTriangle className="h-3 w-3" />
                Limited Analysis ({transcriptCoverage.percentage}% transcripts)
              </Badge>
            )}
            {channel?.title && (
              <div className="hidden sm:block">
                <h3 className="font-semibold text-gray-900">{channel.title}</h3>
                {channel.handle && (
                  <p className="text-sm text-gray-500">{channel.handle}</p>
                )}
              </div>
            )}
          </div>
          
          <p className="text-gray-700 mb-3 font-medium text-sm sm:text-base">
            {aggregate.verdict}
          </p>
          
          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-2">Why this rating:</p>
            <ul className="space-y-1.5">
              {aggregate.bullets.map((bullet, index) => (
                <li key={index} className="text-xs sm:text-sm text-gray-600 flex items-start">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2 flex-shrink-0 mt-1.5"></span>
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
}