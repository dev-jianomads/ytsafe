import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AlertTriangle, Share, ExternalLink, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
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
  videos?: Array<{
    title: string;
    riskNotes: string[];
    categoryScores: Record<string, number>;
  }>;
}

export function SummaryCard({ aggregate, channel, transcriptCoverage, videos }: SummaryCardProps) {
  const getAgeBadgeColor = (ageBand: string) => {
    switch (ageBand) {
      case 'E': return 'bg-green-500 text-white hover:bg-green-600';
      case 'E10+': return 'bg-emerald-500 text-white hover:bg-emerald-600';
      case 'T': return 'bg-amber-500 text-white hover:bg-amber-600';
      case '16+': return 'bg-red-500 text-white hover:bg-red-600';
      default: return 'bg-gray-500 text-white hover:bg-gray-600';
    }
  };

  const getScoreLabel = (score: number) => {
    if (score <= 0.5) return 'None';
    if (score <= 1.5) return 'Mild';
    if (score <= 2.5) return 'Moderate';
    if (score <= 3.5) return 'Strong';
    return 'Extreme';
  };

  const categoryLabels: Record<string, string> = {
    violence: "Violence",
    language: "Language",
    sexual_content: "Sexual Content",
    substances: "Substances",
    gambling: "Gambling",
    sensitive_topics: "Sensitive Topics",
    commercial_pressure: "Commercial Pressure"
  };

  const handleShare = async () => {
    const channelName = channel?.title || 'Unknown Channel';
    const channelHandle = channel?.handle ? ` (${channel.handle})` : '';
    
    // Build the share text
    let shareText = `YouTube Safety Analysis - ${channelName}${channelHandle}\n`;
    shareText += `${'='.repeat(shareText.length - 1)}\n\n`;
    
    // Age rating and verdict
    shareText += `Age Rating: ${aggregate.ageBand}`;
    const ageDescription = {
      'E': ' (Ages 6 and under)',
      'E10+': ' (Ages 7-10)',
      'T': ' (Ages 11-15)',
      '16+': ' (Ages 16 and up)'
    };
    shareText += `${ageDescription[aggregate.ageBand] || ''}\n`;
    shareText += `Verdict: ${aggregate.verdict}\n\n`;
    
    // Content breakdown
    shareText += `Content Breakdown:\n`;
    Object.entries(aggregate.scores).forEach(([category, score]) => {
      const label = categoryLabels[category] || category;
      const scoreLabel = getScoreLabel(score);
      shareText += `• ${label}: ${score.toFixed(1)}/4 (${scoreLabel})\n`;
    });
    
    // Why this rating
    shareText += `\nWhy this rating:\n`;
    aggregate.bullets.forEach(bullet => {
      shareText += `• ${bullet}\n`;
    });
    
    // Transcript coverage warning if applicable
    if (transcriptCoverage && !transcriptCoverage.sufficient) {
      shareText += `\n⚠️  Limited Analysis: Only ${transcriptCoverage.percentage}% of videos had transcripts available.\n`;
    }
    
    // Recent videos summary
    if (videos && videos.length > 0) {
      shareText += `\nRecent Videos Analyzed (${videos.length}):\n`;
      videos.slice(0, 5).forEach(video => {
        const maxScore = Math.max(...Object.values(video.categoryScores));
        const riskIcon = maxScore <= 1 ? '✓' : maxScore === 2 ? '⚠️' : '🔴';
        const truncatedTitle = video.title.length > 50 ? 
          video.title.substring(0, 47) + '...' : video.title;
        const riskSummary = video.riskNotes.join(', ');
        shareText += `${riskIcon} "${truncatedTitle}" - ${riskSummary}\n`;
      });
      
      if (videos.length > 5) {
        shareText += `... and ${videos.length - 5} more videos\n`;
      }
    }
    
    // Footer
    shareText += `\n---\n`;
    shareText += `Analysis by StreamSafe Kids\n`;
    shareText += `Always preview content yourself and consider your child's individual maturity level.`;
    
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success('Analysis copied to clipboard!', {
        description: 'You can now paste this safety report anywhere.',
        duration: 3000,
      });
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      toast.success('Analysis copied to clipboard!', {
        description: 'You can now paste this safety report anywhere.',
        duration: 3000,
      });
    }
  };

  const handleShareGuide = async () => {
    const guideText = `YouTube Children-Safety Reviewer - Complete Rating Guide
${'='.repeat(60)}

🎯 How Our ESRB-Style Rating System Works

We analyze YouTube content using the same categories as video game ratings, but adapted for online video content. Each video gets scored 0-4 in seven key areas, then we calculate an overall age recommendation.

📊 Complete Rating Categories & Coverage:

1. 🥊 VIOLENCE
What it covers:
• Physical violence, fighting, weapons
• Graphic action sequences
• Combat/battle content
• Threatening behavior
• Blood/gore (visual or described)

2. 🤬 LANGUAGE  
What it covers:
• Profanity, swear words
• Hate speech, slurs
• Inappropriate language for age
• Offensive terminology
• Discriminatory language

3. 💋 SEXUAL CONTENT
What it covers:
• Sexual themes, innuendo
• Suggestive content
• Romantic content (age-inappropriate)
• Sexualized imagery or discussion
• Adult relationship topics

4. 🍺 SUBSTANCES
What it covers:
• Alcohol consumption/promotion
• Drug use (illegal/prescription abuse)
• Smoking/vaping
• Substance abuse instructions
• Addiction-related content

5. 🎰 GAMBLING
What it covers:
• Betting, casino games
• Loot boxes, gacha mechanics
• Gambling mechanics in games
• Sports betting
• Financial speculation as gambling

6. 🧠 SENSITIVE TOPICS
What it covers:
• Mental health (depression, anxiety, self-harm)
• Death and grief
• Family trauma (divorce, abuse, neglect)
• Bullying and social issues
• Scary/disturbing themes inappropriate for age
• Political/religious controversy
• Identity/sexuality discussions (age-appropriateness)
• Body image/eating disorders
• Conspiracy theories

7. 💰 COMMERCIAL PRESSURE
What it covers:
• Aggressive advertising/sponsorships
• Product placement pressure
• Purchase pressure targeting kids
• Scams and deceptive marketing
• MLM/pyramid scheme content
• Financial cons (crypto scams, get-rich-quick)
• Fake product claims
• Clickbait for ad revenue

📚 Educational Content Protection
Our system recognizes educational intent and automatically reduces scores by 1 point across all categories for genuinely educational content. This means:
• Science experiments discussing "dangerous" chemicals get lower scores
• History lessons about wars/conflicts aren't over-penalized  
• Health education about mental health topics is protected
• STEM content with sensitive topics gets fair treatment

Educational content gets a special 🎓 badge to help parents identify learning opportunities.

🎯 Scoring Scale (0-4 for each category):
0 = None/Not present
1 = Mild/Brief mentions
2 = Moderate/Some presence
3 = Strong/Frequent presence
4 = Extreme/Dominant theme

🏆 Age Band Calculation:
E (Ages 6 and under): All categories ≤ 1
E10+ (Ages 7-10): All categories ≤ 2
T (Ages 11-15): All categories ≤ 3
16+ (Ages 16+): Any category = 4

🔍 What We Analyze:
• Recent video titles and descriptions
• Video transcripts (when available)
• Top community comments
• Engagement patterns and controversy indicators`;

    try {
      await navigator.clipboard.writeText(guideText);
      toast.success('Rating guide copied to clipboard!', {
        description: 'Share this comprehensive guide with other parents.',
        duration: 3000,
      });
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = guideText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      toast.success('Rating guide copied to clipboard!', {
        description: 'Share this comprehensive guide with other parents.',
        duration: 3000,
      });
    }
  };

  const handleViewChannel = () => {
    if (channel?.handle) {
      // Clean the handle - remove any existing @ symbols, then add our own
      const cleanHandle = channel.handle.replace(/^@+/, '');
      const channelUrl = `https://www.youtube.com/${cleanHandle}`;
      
      // Detect mobile devices
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      if (isMobile) {
        if (isIOS) {
          // iOS: Use official YouTube URL - iOS will automatically try YouTube app first
          window.open(channelUrl, '_blank');
        } else {
          // Android: Try YouTube app scheme first, fallback to web
          const appUrl = `youtube://channel/${channel.handle.replace('@', '')}`;
          window.location.href = appUrl;
          setTimeout(() => {
            window.open(channelUrl, '_blank');
          }, 500);
        }
      } else {
        // Desktop: open in new tab
        window.open(channelUrl, '_blank');
      }
    }
  };

  return (
    <Card className="p-4 sm:p-6 mb-6">
      <div className="flex justify-between items-start gap-3 mb-4">
        <div className="flex-1 min-w-0">
          {/* Existing content will go here */}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {channel?.handle && (
            <Button
              onClick={handleViewChannel}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">View Channel</span>
              <span className="sm:hidden">Channel</span>
            </Button>
          )}
          <Button
            onClick={handleShareGuide}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Share Guide</span>
            <span className="sm:hidden">Guide</span>
          </Button>
          <Button
            onClick={handleShare}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Share className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        </div>
      </div>
      
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
                <p className="text-sm text-gray-500">{channel.handle.startsWith('@') ? channel.handle : `@${channel.handle}`}</p>
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
            {channel?.title && (
              <div className="hidden sm:block">
                <h3 className="font-semibold text-gray-900">{channel.title}</h3>
                {channel.handle && (
                  <p className="text-sm text-gray-500">{channel.handle.startsWith('@') ? channel.handle : `@${channel.handle}`}</p>
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