'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { SearchBar } from '@/components/SearchBar';
import { HistoryPane } from '@/components/HistoryPane';
import { FeedbackModal } from '@/components/FeedbackModal';
import { SummaryCard } from '@/components/SummaryCard';
import { CategoryTable } from '@/components/CategoryTable';
import { VideoList } from '@/components/VideoList';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Heart, Shield, Brain, GraduationCap, FileText } from 'lucide-react';
import type { AnalyseResponse, HistoryItem } from '@/types';
import { saveToHistory } from '@/lib/history';
import { incrementSearchCount } from '@/lib/session';
import { hashUserAgent } from '@/lib/analytics';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [results, setResults] = useState<AnalyseResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [shouldClearSearch, setShouldClearSearch] = useState(false);
  const [historyKey, setHistoryKey] = useState(0); // Force history refresh
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState<{ sessionId: string; userAgentHash?: string }>({ sessionId: '' });

  const handleAnalyse = async (searchQuery: string) => {
    setIsLoading(true);
    setLoadingMessage('Fetching video information...');
    setError(null);
    setResults(null);
    setQuery(searchQuery);
    setShouldClearSearch(false);

    try {
      // Update loading message after a brief delay
      const messageTimer1 = setTimeout(() => {
        setLoadingMessage('Analysing content...');
      }, 5000);
      
      const messageTimer2 = setTimeout(() => {
        setLoadingMessage('Producing report...');
      }, 10000);
      const response = await fetch('/api/analyse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: searchQuery }),
      });

      // Clear timers since we got a response
      clearTimeout(messageTimer1);
      clearTimeout(messageTimer2);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setResults(data);
      saveToHistory(searchQuery, data.aggregate.ageBand, data.aggregate.verdict);
      setHistoryKey(prev => prev + 1); // Trigger history refresh
      setShouldClearSearch(true);
      
      // Check if we should show feedback after successful search
      const userAgent = navigator.userAgent;
      const userAgentHash = userAgent ? hashUserAgent(userAgent) : undefined;
      const { shouldShowFeedback, sessionId, userAgentHash: storedHash } = incrementSearchCount(userAgentHash);
      if (shouldShowFeedback) {
        setFeedbackData({ sessionId, userAgentHash: storedHash });
        setShowFeedback(true);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleSelectFromHistory = (historicalQuery: string) => {
    console.log('📋 Selected from history:', historicalQuery);
    setQuery(historicalQuery);
    handleAnalyse(historicalQuery);
    setIsHistoryOpen(false);
  };

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'CHANNEL_NOT_FOUND':
        return 'Could not find the specified YouTube channel or video. Please check the URL or handle.';
      case 'NO_VIDEOS_FOUND':
        return 'No videos found for this channel.';
      case 'TIMEOUT':
        return 'Analysis timed out. Please try again.';
      case 'SERVER_MISCONFIG':
        return 'Server configuration error. API keys may be missing.';
      case 'ANALYSIS_FAILED':
        return 'Content analysis failed. This could be due to API rate limits, content restrictions, or temporary service issues. Please try again in a few minutes.';
      default:
        return `Analysis failed (${errorCode}). This could be due to API rate limits, network issues, or temporary service problems. Please try again later.`;
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "StreamSafe Kids",
              "description": "ESRB-style age ratings for YouTube channels. Free safety analysis tool helps parents make informed decisions about family-friendly viewing.",
              "url": "https://streamsafekids.com",
              "applicationCategory": "ParentalControlApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "creator": {
                "@type": "Organization",
                "name": "StreamSafe Kids"
              },
              "audience": {
                "@type": "Audience",
                "audienceType": "Parents"
              }
            })
          }}
        />
      </Head>
      <div className="flex lg:grid lg:grid-cols-[320px_1fr] relative">
        {/* History Sidebar */}
        <HistoryPane 
          key={historyKey}
          onSelectItem={handleSelectFromHistory}
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
        />
        
        {/* Main Content */}
        <div className="flex flex-col gradient-bg flex-1 min-w-0 min-h-screen">
          {/* Header */}
          <div className="hidden lg:block bg-white border-b px-6 py-4">
            <div className="flex items-center gap-3">
              <Heart className="h-8 w-8 text-pink-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">StreamSafe Kids</h1>
                <p className="text-sm text-gray-600">ESRB Age ratings for any YouTube channel—clear, fast, parent-friendly</p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <SearchBar 
            onAnalyse={handleAnalyse} 
            isLoading={isLoading}
            loadingMessage={loadingMessage}
            initialQuery={query}
            onToggleHistory={() => setIsHistoryOpen(true)}
           shouldClearAfterAnalysis={shouldClearSearch}
          />

          {/* Results Area */}
          <div className="flex-1 p-4 sm:p-6 min-h-0">
            {results && (
              <div className="space-y-6">
                <SummaryCard 
                  aggregate={results.aggregate} 
                  channel={results.channel}
                  transcriptCoverage={results.transcriptCoverage}
                  videos={results.videos}
                />
                
                <CategoryTable scores={results.aggregate.scores} />
                
                {/* Parent Tip */}
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800">
                    <span className="font-semibold">💡 Parent Tip:</span> Always preview content yourself and consider your child's maturity level. We've made it easy - click any video title or use the "Channel" button to go straight to YouTube.
                  </p>
                </div>
                
                <VideoList videos={results.videos} />
                
                {/* Move warnings after the dashboard */}
                {results.warnings && results.warnings.length > 0 && (
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      <ul className="list-disc list-inside">
                        {results.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
            
            {/* Move error messages after results area */}
            {error && (
              <Alert className="mt-6 border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {getErrorMessage(error)}
                </AlertDescription>
              </Alert>
            )}

            {!results && !error && !isLoading && (
              <Card className="p-8 sm:p-12">
                {/* How It Works Section */}
                <div className="p-6 bg-green-50 rounded-lg border border-green-200 text-left max-w-2xl mx-auto">
                  <h4 className="text-lg font-semibold text-green-900 mb-4 text-center">Why Trust StreamSafe Kids?</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Shield className="h-5 w-5 text-blue-600" />
                        </div>
                        <h5 className="font-semibold text-gray-900">ESRB-Standard Analysis</h5>
                      </div>
                      <p className="text-sm text-gray-700">
                        We use the same content categories and rating methodology as video game ratings, adapted for YouTube content.
                      </p>
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <a 
                          href="/how-it-works" 
                          className="text-sm text-blue-600 hover:text-blue-800 underline font-medium"
                        >
                          See detailed rating categories →
                        </a>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Brain className="h-5 w-5 text-purple-600" />
                        </div>
                        <h5 className="font-semibold text-gray-900">AI-Powered Content Review</h5>
                      </div>
                      <p className="text-sm text-gray-700">
                        Our analysis reviews actual video transcripts and community responses, not just metadata, for accurate safety assessments.
                      </p>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <GraduationCap className="h-5 w-5 text-emerald-600" />
                        </div>
                        <h5 className="font-semibold text-gray-900">Educational Content Protection</h5>
                      </div>
                      <p className="text-sm text-gray-700">
                        We recognize educational intent and adjust ratings fairly, so learning content isn't unfairly penalized for discussing sensitive topics.
                      </p>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-amber-600" />
                        </div>
                        <h5 className="font-semibold text-gray-900">Transparent & Actionable Results</h5>
                      </div>
                      <p className="text-sm text-gray-700">
                        We show you exactly why content received its rating with specific examples, risk factors, and clear next steps for parents.
                      </p>
                    </div>
                  </div>
                  
                  {/* Educational Content Protection Section */}
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <h6 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <span className="text-blue-600">🎓</span>
                      Educational Content Protection
                    </h6>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      Our system recognizes educational intent and automatically reduces scores by 1 point across all categories for genuinely educational content. This means science experiments discussing "dangerous" chemicals, history lessons about wars, or health education about mental health topics get fair treatment and aren't over-penalized.
                    </p>
                  </div>
                  
                  {/* Learn More Link */}
                  <div className="mt-4 text-center">
                    <a 
                      href="/how-it-works" 
                      className="text-sm text-green-600 hover:text-green-800 underline font-medium"
                    >
                      Learn more about our detailed analysis process →
                    </a>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-50 border-t py-6 px-4 text-center mt-auto">
        <p className="text-sm text-gray-600">
          Not affiliated with YouTube or any video platform.
        </p>
      </footer>
      
      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        sessionId={feedbackData.sessionId}
        userAgentHash={feedbackData.userAgentHash}
      />
    </div>
  );
}