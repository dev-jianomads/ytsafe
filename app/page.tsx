'use client';

import { useState, useEffect } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { HistoryPane } from '@/components/HistoryPane';
import { FeedbackModal } from '@/components/FeedbackModal';
import { SummaryCard } from '@/components/SummaryCard';
import { CategoryTable } from '@/components/CategoryTable';
import { VideoList } from '@/components/VideoList';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Heart } from 'lucide-react';
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
      }, 2000);
      
      const messageTimer2 = setTimeout(() => {
        setLoadingMessage('Producing report...');
      }, 5000);
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
                <h1 className="text-2xl font-bold text-gray-900">YouTube Children-Safety Reviewer</h1>
                <p className="text-sm text-gray-600">ESRB-style content analysis for family-friendly viewing</p>
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
                    <span className="font-semibold">💡 Parent Tip:</span> Always preview content yourself and consider your child's maturity level. We've made it easy - click any video title or use the "View Channel" button to go straight to YouTube.
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
                  <h4 className="text-lg font-semibold text-green-900 mb-4 text-center">How Our Safety Analysis Works</h4>
                  
                  <div className="space-y-4 text-sm text-green-800">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-green-700">1</span>
                      </div>
                      <div>
                        <p className="font-medium mb-1">We analyze what's actually said and shown</p>
                        <p className="text-green-700">Our AI reviews video transcripts, titles, and descriptions to understand the real content - not just what creators claim it is.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-green-700">2</span>
                      </div>
                      <div>
                        <p className="font-medium mb-1">We check how the community responds</p>
                        <p className="text-green-700">Comments reveal the real audience age and concerns. Toxic discussions or inappropriate language in comments affects the rating.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-green-700">3</span>
                      </div>
                      <div>
                        <p className="font-medium mb-1">We look for warning signs in engagement</p>
                        <p className="text-green-700">Unusual patterns like very high controversy, clickbait behavior, or suspicious engagement help identify potentially problematic content.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-green-700">4</span>
                      </div>
                      <div>
                        <p className="font-medium mb-1">We focus on recent videos</p>
                        <p className="text-green-700">Channels change over time. We analyze the 8 most recent videos to give you current safety information, not outdated ratings.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-green-700">5</span>
                      </div>
                      <div>
                        <p className="font-medium mb-1">💡 Parent Tip</p>
                        <p className="text-green-700 font-medium">Always preview content yourself and consider your child's individual maturity level alongside these ratings.</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* ESRB Description and Rating Categories merged */}
                  <div className="mt-6 p-4 bg-white rounded-lg border border-green-100">
                    <p className="text-sm text-green-800 leading-relaxed mb-4">
                      <a 
                        href="https://www.esrb.org" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium text-green-600 hover:text-green-800 underline"
                      >
                        ESRB ratings
                      </a>{' '}
                      provide information about what's in a game or app so parents and consumers can make informed choices about which games are right for their family.
                    </p>
                    
                    <h5 className="font-semibold text-green-900 mb-2">Rating Categories (Just Like Video Games)</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-5 bg-green-500 rounded text-white text-center text-xs font-bold flex items-center justify-center">E</div>
                        <span className="text-green-700">Ages 6 and under</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-5 bg-emerald-500 rounded text-white text-center text-xs font-bold flex items-center justify-center">E10+</div>
                        <span className="text-green-700">Ages 7-10</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-5 bg-amber-500 rounded text-white text-center text-xs font-bold flex items-center justify-center">T</div>
                        <span className="text-green-700">Ages 11-15</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-5 bg-red-500 rounded text-white text-center text-xs font-bold flex items-center justify-center">16+</div>
                        <span className="text-green-700">Ages 16 and up</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
      
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