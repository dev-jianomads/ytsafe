import { setCookie, getCookie, deleteCookie } from './cookies';
import type { HistoryItem } from '@/types';

const HISTORY_COOKIE_NAME = 'ykids_history_v2';
const MAX_HISTORY_ITEMS = 18; // Conservative limit for 4KB cookie space
const COOKIE_EXPIRY_DAYS = 30;

export function saveToHistory(q: string, ageBand: string, verdict: string) {
  const historyItem: HistoryItem = {
    q: q.slice(0, 100), // Truncate long queries to save space
    ageBand: ageBand as any,
    verdict: verdict.slice(0, 120), // Truncate long verdicts
    ts: Date.now()
  };

  try {
    const existing = getHistory();
    
    // Remove duplicate if exists (same query)
    const filtered = existing.filter(item => item.q !== historyItem.q);
    
    // Add new item at the beginning and limit to max items
    const updated = [historyItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    
    // Try to save to cookie
    const cookieValue = JSON.stringify(updated);
    
    // Check if cookie would be too large (conservative 3.5KB limit)
    if (cookieValue.length > 3500) {
      // Remove oldest items until it fits
      let trimmed = updated;
      while (JSON.stringify(trimmed).length > 3500 && trimmed.length > 1) {
        trimmed = trimmed.slice(0, -1);
      }
      setCookie(HISTORY_COOKIE_NAME, JSON.stringify(trimmed), COOKIE_EXPIRY_DAYS);
    } else {
      setCookie(HISTORY_COOKIE_NAME, cookieValue, COOKIE_EXPIRY_DAYS);
    }
  } catch (error) {
    console.warn('Failed to save history to cookies:', error);
    // Fallback to localStorage if cookies fail
    try {
      const existing = JSON.parse(localStorage.getItem('ykids_history_v1') || '[]');
      const updated = [historyItem, ...existing.slice(0, 9)];
      localStorage.setItem('ykids_history_v1', JSON.stringify(updated));
    } catch (localError) {
      console.warn('Failed to save history to localStorage:', localError);
    }
  }
}

export function getHistory(): HistoryItem[] {
  try {
    // Try cookies first
    const cookieData = getCookie(HISTORY_COOKIE_NAME);
    if (cookieData) {
      const parsed = JSON.parse(cookieData);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    
    // Fallback to localStorage and migrate to cookies
    const localData = localStorage.getItem('ykids_history_v1');
    if (localData) {
      const parsed = JSON.parse(localData);
      if (Array.isArray(parsed)) {
        // Migrate to cookies
        const limited = parsed.slice(0, MAX_HISTORY_ITEMS);
        setCookie(HISTORY_COOKIE_NAME, JSON.stringify(limited), COOKIE_EXPIRY_DAYS);
        return limited;
      }
    }
    
    return [];
  } catch (error) {
    console.warn('Failed to load history:', error);
    return [];
  }
}

export function clearHistory() {
  try {
    deleteCookie(HISTORY_COOKIE_NAME);
    // Also clear localStorage for migration
    localStorage.removeItem('ykids_history_v1');
  } catch (error) {
    console.warn('Failed to clear history:', error);
  }
}