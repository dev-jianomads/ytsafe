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
    const trimmedQuery = query.trim();
    if (trimmedQuery && !isLoading) {
      onAnalyse(trimmedQuery);
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
        <h1 className="text-lg font-semibold text-gray-900 truncate">StreamSafe Kids</h1>
      </div>

      {/* Promotional Banner */}
      <div className="mb-4 flex justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full text-sm font-medium shadow-lg">
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">Free - no sign-in required</span>
          <span className="sm:hidden">Free - no sign-in required</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
          <Input
            type="text"
            placeholder="Channel name, @handle, or any YouTube URL"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
            className="pl-10 text-sm sm:text-base"
          />
        </div>
        <Button 
          type="submit" 
          disabled={!query.trim() || isLoading}
          className="min-w-[100px] w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isLoading ? (
            <span className="text-sm flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {loadingMessage || 'Processing...'}
            </span>
          ) : (
            "Check a Channel"
          )}
        </Button>
      </form>
      
      {/* Helper text for parents */}
      <div className="mt-2 text-center">
        <p
          className="text-xs text-gray-500"
        >
          Enter any YouTube channel name, @handle, or URL to get instant safety ratings
        </p>
      </div>
    </div>
  );
}