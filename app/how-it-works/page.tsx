import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Search, Brain, BarChart3, Shield, AlertTriangle, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How It Works - StreamSafe Kids YouTube Safety Analysis',
  description: 'Detailed explanation of how StreamSafe Kids analyzes YouTube channels for safety. Learn about our ESRB-style rating methodology, AI analysis, and content categories.',
  keywords: [
    'how StreamSafe Kids works',
    'YouTube content analysis',
    'ESRB rating methodology',
    'AI content classification',
    'YouTube safety analysis process',
    'content rating system'
  ],
  openGraph: {
    title: 'How It Works - StreamSafe Kids YouTube Safety Analysis',
    description: 'Learn how our AI-powered system analyzes YouTube channels and provides ESRB-style age ratings for family safety.',
    url: 'https://streamsafekids.com/how-it-works',
  },
  alternates: {
    canonical: 'https://streamsafekids.com/how-it-works',
  },
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border-b">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <Heart className="h-8 w-8 text-pink-500" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">How StreamSafe Kids Works</h1>
              <p className="text-gray-600">Understanding our YouTube safety analysis process</p>
            </div>
          </div>
          <Link href="/">
            <Button variant="outline" className="gap-2">
              ← Back to Analysis Tool
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Analysis Process */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Search className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Our Analysis Process</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-blue-700">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Channel Discovery</h3>
                <p className="text-gray-700 mb-2">
                  When you enter a channel name, @handle, or YouTube URL, we use the YouTube Data API to identify the channel and fetch information about their recent videos.
                </p>
                <Badge variant="outline" className="text-xs">YouTube Data API v3</Badge>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-green-700">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Content Extraction</h3>
                <p className="text-gray-700 mb-2">
                  We analyze the 5 most recent videos, extracting video transcripts (when available), titles, descriptions, and top community comments to understand the actual content.
                </p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">Video Transcripts</Badge>
                  <Badge variant="outline" className="text-xs">Community Comments</Badge>
                  <Badge variant="outline" className="text-xs">Metadata Analysis</Badge>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-purple-700">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">AI Classification</h3>
                <p className="text-gray-700 mb-2">
                  Our AI system scores content across 7 ESRB categories (0-4 scale) and identifies educational intent to provide fair, accurate ratings.
                </p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">OpenAI GPT-4</Badge>
                  <Badge variant="outline" className="text-xs">Educational Detection</Badge>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-amber-700">4</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Safety Report</h3>
                <p className="text-gray-700 mb-2">
                  You receive a comprehensive safety report with age recommendations, specific risk factors, and actionable guidance for parents.
                </p>
                <Badge variant="outline" className="text-xs">ESRB-Style Rating</Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Content Categories Detail */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="h-6 w-6 text-green-600" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Content Categories Explained</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { 
                name: 'Violence', 
                icon: '🥊',
                examples: 'Fighting, weapons, graphic action, threatening behavior, blood/gore'
              },
              { 
                name: 'Language', 
                icon: '🤬',
                examples: 'Profanity, slurs, hate speech, inappropriate language for age groups'
              },
              { 
                name: 'Sexual Content', 
                icon: '💋',
                examples: 'Sexual themes, innuendo, suggestive content, adult relationships'
              },
              { 
                name: 'Substances', 
                icon: '🍺',
                examples: 'Alcohol, drugs, smoking, vaping, substance abuse discussions'
              },
              { 
                name: 'Gambling', 
                icon: '🎰',
                examples: 'Betting, casino games, loot boxes, financial speculation'
              },
              { 
                name: 'Sensitive Topics', 
                icon: '🧠',
                examples: 'Mental health, trauma, scary themes, political/religious controversy'
              },
              { 
                name: 'Commercial Pressure', 
                icon: '💰',
                examples: 'Aggressive ads, scams, MLM schemes, purchase pressure targeting kids'
              }
            ].map((category, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{category.icon}</span>
                  <h3 className="font-semibold text-gray-900">{category.name}</h3>
                </div>
                <p className="text-sm text-gray-600">{category.examples}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Educational Content Protection */}
        <Card className="p-6 border-blue-200 bg-blue-50">
          <div className="flex items-center gap-3 mb-4">
            <GraduationCap className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl sm:text-2xl font-bold text-blue-900">Educational Content Protection</h2>
          </div>
          <p className="text-blue-800 mb-4">
            Our system recognizes when content is genuinely educational and automatically reduces safety scores by 1 point across all categories. This ensures that:
          </p>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
              Science experiments discussing "dangerous\" chemicals get fair treatment
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
              History lessons about wars and conflicts aren't over-penalized
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
              Health education about mental health topics is protected
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
              STEM content with sensitive topics gets appropriate consideration
            </li>
          </ul>
        </Card>

        {/* Limitations */}
        <Card className="p-6 border-amber-200 bg-amber-50">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
            <h2 className="text-xl sm:text-2xl font-bold text-amber-900">Important Limitations</h2>
          </div>
          <div className="space-y-3 text-amber-800">
            <p>
              <strong>Always preview content yourself.</strong> Our analysis provides guidance, but every child is different and parents know their children best.
            </p>
            <p>
              <strong>Recent content focus.</strong> We analyze the 5 most recent videos. Older content may have different themes.
            </p>
            <p>
              <strong>Transcript dependency.</strong> Analysis accuracy depends on transcript availability. When transcripts aren't available, we rely on titles, descriptions, and comments.
            </p>
            <p>
              <strong>Dynamic content.</strong> YouTube channels can change their content style over time. Regular re-checking is recommended for channels your children watch frequently.
            </p>
          </div>
        </Card>

        {/* Call to Action */}
        <div className="text-center py-8">
          <Link href="/">
            <Button size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Search className="h-5 w-5" />
              Try the Analysis Tool
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}