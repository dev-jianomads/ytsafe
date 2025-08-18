'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Clock, X, RefreshCw, ExternalLink } from 'lucide-react';
import type { HistoryItem } from '@/types';
import { getHistory, clearHistory } from '@/lib/history';

interface HistoryPaneProps {
  onSelectItem: (query: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function HistoryPane({ onSelectItem, isOpen, onClose }: HistoryPaneProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const loadHistory = useCallback(() => {
    const historyData = getHistory();
    setHistory(historyData);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    // Refresh when panel opens
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, loadHistory]);

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  const getAgeBadgeColor = (ageBand: string) => {
    switch (ageBand) {
      case 'E': return 'bg-green-100 text-green-800 border-green-200';
      case 'E10+': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'T': return 'bg-amber-100 text-amber-800 border-amber-200';
      case '16+': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimestamp = (ts: number) => {
    const now = Date.now();
    const diff = now - ts;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* History panel */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
        w-80 lg:w-80 bg-gray-50 border-r min-h-screen p-4
        transform transition-transform duration-300 ease-in-out lg:transform-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Mobile close button */}
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <h2 className="text-lg font-semibold text-gray-900">Search History</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="hidden lg:flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Search History</h2>
          {history.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearHistory}
              className="text-gray-500 hover:text-gray-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Clear button for mobile */}
        {history.length > 0 && (
          <div className="mb-4 lg:hidden">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearHistory}
              className="w-full text-gray-500 hover:text-gray-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear History
            </Button>
          </div>
        )}

        {history.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No searches yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.slice(0, 20).map((item, index) => (
              <Card 
                key={`${item.q}-${item.ts}-${index}`}
                className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  onSelectItem(item.q);
                  onClose();
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <Badge 
                    variant="outline" 
                    className={`text-xs font-medium ${getAgeBadgeColor(item.ageBand)}`}
                  >
                    {item.ageBand}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(item.ts)}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                  {item.q}
                </p>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {item.verdict}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}