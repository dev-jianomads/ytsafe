import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Shield, Users, Zap, ExternalLink, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About StreamSafe Kids - YouTube Safety Analysis Tool',
  description: 'Learn how StreamSafe Kids provides ESRB-style age ratings for YouTube channels. Our AI-powered analysis helps parents make informed decisions about family-friendly content.',
  keywords: [
    'about StreamSafe Kids',
    'YouTube safety tool',
    'ESRB ratings explained',
    'content analysis methodology',
    'parent safety tools',
    'YouTube channel checker'
  ],
  openGraph: {
    title: 'About StreamSafe Kids - YouTube Safety Analysis Tool',
    description: 'Learn how our AI-powered analysis provides ESRB-style age ratings for YouTube channels to help parents make informed decisions.',
    url: 'https://streamsafekids.com/about',
  },
  alternates: {
    canonical: 'https://streamsafekids.com/about',
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border-b">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <Heart className="h-8 w-8 text-pink-500" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">About StreamSafe Kids</h1>
              <p className="text-gray-600">Making YouTube safer for families, one channel at a time</p>
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
        {/* Mission Statement */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Our Mission</h2>
          </div>
          <p className="text-gray-700 leading-relaxed mb-4">
            StreamSafe Kids provides ESRB-style age ratings for YouTube channels, helping parents make informed decisions about what content is appropriate for their children. We analyze recent videos using AI-powered content classification to give you clear, actionable safety information.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Unlike basic content filters, we provide detailed breakdowns of exactly why content received its rating, empowering parents with the information they need to make the best choices for their family.
          </p>
        </Card>

        {/* How It Works */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="h-6 w-6 text-green-600" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">How Our Analysis Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-blue-700">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Content Analysis</h3>
                  <p className="text-sm text-gray-600">We analyze video transcripts, titles, descriptions, and community comments to understand the actual content.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-green-700">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">ESRB Classification</h3>
                  <p className="text-sm text-gray-600">Content is scored across 7 categories using the same standards as video game ratings.</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-amber-700">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Community Insights</h3>
                  <p className="text-sm text-gray-600">We examine engagement patterns and community responses to identify potential concerns.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-purple-700">4</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Clear Recommendations</h3>
                  <p className="text-sm text-gray-600">You get an age-appropriate rating with specific reasons and actionable next steps.</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Rating Categories */}
        <Card className="p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Content Categories We Analyze</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Violence', desc: 'Physical aggression, fighting, weapons, graphic content' },
              { name: 'Language', desc: 'Profanity, inappropriate language, offensive terminology' },
              { name: 'Sexual Content', desc: 'Sexual themes, suggestive content, adult relationships' },
              { name: 'Substances', desc: 'Alcohol, drugs, smoking, vaping, substance abuse' },
              { name: 'Gambling', desc: 'Betting, casino games, loot boxes, financial speculation' },
              { name: 'Sensitive Topics', desc: 'Mental health, trauma, scary themes, controversial topics' },
              { name: 'Commercial Pressure', desc: 'Aggressive ads, scams, purchase pressure targeting kids' }
            ].map((category, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
                <p className="text-sm text-gray-600">{category.desc}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Age Ratings */}
        <Card className="p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Age Rating System</h2>
          <div className="space-y-3">
            {[
              { rating: 'E', color: 'bg-green-500', age: 'Ages 6 and under', desc: 'Content suitable for young children with minimal concerning elements' },
              { rating: 'E10+', color: 'bg-emerald-500', age: 'Ages 7-10', desc: 'Generally appropriate with some mild content that may need parent guidance' },
              { rating: 'T', color: 'bg-amber-500', age: 'Ages 11-15', desc: 'Teen content with moderate themes requiring parent awareness' },
              { rating: '16+', color: 'bg-red-500', age: 'Ages 16 and up', desc: 'Mature content with strong themes not suitable for younger viewers' }
            ].map((rating, index) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <Badge className={`${rating.color} text-white font-bold px-2 py-1 text-sm flex-shrink-0`}>
                  {rating.rating}
                </Badge>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900">{rating.age}</h3>
                  <p className="text-sm text-gray-600">{rating.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Why Trust Us */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Why Trust StreamSafe Kids?</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">ESRB-Standard Analysis</h3>
                <p className="text-sm text-gray-600">We use the same content categories and rating methodology as the Entertainment Software Rating Board (ESRB).</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">AI-Powered Accuracy</h3>
                <p className="text-sm text-gray-600">Our analysis reviews actual video content, not just metadata, for more accurate safety assessments.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Educational Content Protection</h3>
                <p className="text-sm text-gray-600">We recognize educational intent and adjust ratings accordingly, so learning content isn't unfairly penalized.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Transparent Methodology</h3>
                <p className="text-sm text-gray-600">We show you exactly why content received its rating with specific examples and risk factors.</p>
              </div>
            </div>
          </div>
        </Card>

        {/* External Resources */}
        <Card className="p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Trusted Resources</h2>
          <div className="space-y-3">
            <a
              href="https://www.esafety.gov.au/parents"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <ExternalLink className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-900">eSafety Commissioner (Australia)</h3>
                <p className="text-sm text-blue-700">Official online safety resources for parents</p>
              </div>
            </a>
            
            <a
              href="https://www.esrb.org"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <ExternalLink className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">Entertainment Software Rating Board (ESRB)</h3>
                <p className="text-sm text-green-700">The rating system we base our analysis on</p>
              </div>
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}