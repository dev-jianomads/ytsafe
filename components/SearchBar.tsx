'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Menu, Sparkles, Heart, Camera } from 'lucide-react';

interface SearchBarProps {
  onAnalyse: (query: string) => void;
  isLoading: boolean;
  loadingMessage?: string;
  initialQuery?: string;
  onToggleHistory: () => void;
  shouldClearAfterAnalysis?: boolean;
  onImageUpload?: (file: File) => void;
}

export function SearchBar({ onAnalyse, isLoading, loadingMessage, initialQuery = '', onToggleHistory, shouldClearAfterAnalysis, onImageUpload }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isImageMode, setIsImageMode] = useState(false);

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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImageUpload) {
      onImageUpload(file);
      // Reset the input
      event.target.value = '';
    }
  };

  const toggleImageMode = () => {
    setIsImageMode(!isImageMode);
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
        <div className="flex items-center gap-2 min-w-0">
          <Heart className="h-6 w-6 text-pink-500 flex-shrink-0" />
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-gray-900 truncate">StreamSafe Kids</h1>
            <p className="text-xs text-gray-600 truncate">ESRB Age ratings for YouTube channels</p>
          </div>
        </div>
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
        <div className="relative flex-1 min-w-0 flex">
          {!isImageMode ? (
            <>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
              <Input
                type="text"
                placeholder="Channel name, @handle, or any YouTube URL"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={isLoading}
                className="pl-10 pr-12 text-sm sm:text-base flex-1"
              />
            </>
          ) : (
            <div className="flex-1 relative">
              <input
                type="file"
                accept="image/*,.heic"
                onChange={handleImageUpload}
                disabled={isLoading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                id="image-upload"
              />
              <div className="w-full h-full border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-2 text-gray-600">
                  <Camera className="h-4 w-4" />
                  <span className="text-sm">Upload screenshot or photo</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Toggle button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleImageMode}
            disabled={isLoading}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 z-20 h-8 w-8 p-0 hover:bg-gray-100"
            title={isImageMode ? "Switch to text search" : "Upload image instead"}
          >
            {isImageMode ? <Search className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
          </Button>
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
    </div>
  );
}