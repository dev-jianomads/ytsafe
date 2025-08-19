'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Menu, Sparkles } from 'lucide-react';

interface SearchBarProps {
  onAnalyse: (query: string) => void;
  isLoading: boolean;
  loadingMessage?: string;
  initialQuery?: string;
  onToggleHistory: () => void;
  shouldClearAfterAnalysis?: boolean;
}

export function SearchBar({ onAnalyse, isLoading, loadingMessage, initialQuery = '', onToggleHistory, shouldClearAfterAnalysis }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);

  // Clear search box when analysis completes
  useEffect(() => {
    if (shouldClearAfterAnalysis && !isLoading) {
      setQuery('');
    }
  }, [shouldClearAfterAnalysis, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onAnalyse(query.trim());
    }
  };

  return (
    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b p-4 sm:p-6">
      {/* Mobile history toggle */}
      <div className="flex items-center gap-3 mb-4 lg:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleHistory}
          className="flex-shrink-0"
        >
          <Menu className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold text-gray-900 truncate">YouTube Children-Safety Reviewer</h1>
      </div>

      {/* Promotional Banner */}
      <div className="mb-4 flex justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full text-sm font-medium shadow-lg">
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">Free and no sign-in required - just copy and paste YouTube URL or @handle</span>
          <span className="sm:hidden">Free - no sign-in required</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
          <Input
            type="text"
            placeholder="YouTube channel/video URL or @handle"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
            className="pl-10 text-sm sm:text-base"
          />
        </div>
        <Button 
          type="submit" 
          disabled={!query.trim() || isLoading}
          className="min-w-[100px] w-full sm:w-auto"
        >
          {isLoading ? (
            <span className="text-sm">
              {loadingMessage || 'Processing...'}
            </span>
          ) : (
            <>
              <span className="hidden sm:inline">Analyse</span>
              <span className="sm:hidden">Go</span>
            </>
          )}
        </Button>
      </form>
      
      {/* Loading message display */}
      {isLoading && loadingMessage && (
        <div className="mt-3 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            {loadingMessage}
          </div>
        </div>
      )}
    </div>
  );
}