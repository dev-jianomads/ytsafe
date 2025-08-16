'use client';

import { useState, useEffect } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { HistoryPane } from '@/components/HistoryPane';
import { SummaryCard } from '@/components/SummaryCard';
import { CategoryTable } from '@/components/CategoryTable';
import { VideoList } from '@/components/VideoList';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Shield } from 'lucide-react';
import type { AnalyseResponse, HistoryItem } from '@/types';
import { saveToHistory } from '@/lib/history';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AnalyseResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [shouldClearSearch, setShouldClearSearch] = useState(false);

  const handleAnalyse = async (searchQuery: string) => {
    setIsLoading(true);
    setError(null);
    setResults(null);
    setQuery(searchQuery);
    setShouldClearSearch(false);

    try {
      const response = await fetch('/api/analyse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: searchQuery }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setResults(data);
      saveToHistory(searchQuery, data.aggregate.ageBand, data.aggregate.verdict);
      setShouldClearSearch(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFromHistory = (historicalQuery: string) => {
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
          onSelectItem={handleSelectFromHistory}
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
        />
        
        {/* Main Content */}
        <div className="flex flex-col gradient-bg flex-1 min-w-0">
          {/* Header */}
          <div className="hidden lg:block bg-white border-b px-6 py-4">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-600" />
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
            initialQuery={query}
            onToggleHistory={() => setIsHistoryOpen(true)}
           shouldClearAfterAnalysis={shouldClearSearch}
          />

          {/* Results Area */}
          <div className="flex-1 p-4 sm:p-6">
            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {getErrorMessage(error)}
                </AlertDescription>
              </Alert>
            )}

            {results && (
              <div className="space-y-6">
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

                <SummaryCard 
                  aggregate={results.aggregate} 
                  channel={results.channel}
                />
                
                <CategoryTable scores={results.aggregate.scores} />
                
                <VideoList videos={results.videos} />
              </div>
            )}

            {!results && !error && !isLoading && (
              <Card className="p-8 sm:p-12 text-center">
                <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                  Ready to Analyse YouTube Content
                </h3>
                <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
                  Paste a YouTube channel URL, video URL, or handle above to get an ESRB-style safety rating 
                  for family-friendly content evaluation.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}