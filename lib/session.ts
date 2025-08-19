// Session management for feedback tracking
const SESSION_STORAGE_KEY = 'ytsafe_session';
const SEARCH_COUNT_KEY = 'ytsafe_search_count';
const FEEDBACK_SHOWN_KEY = 'ytsafe_feedback_shown';

export interface SessionData {
  sessionId: string;
  searchCount: number;
  feedbackShown: boolean;
  createdAt: number;
}

// Generate a persistent session ID that lasts for the browser session
export function getOrCreateSession(): SessionData {
  if (typeof window === 'undefined') {
    // Server-side: return temporary session
    return {
      sessionId: 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
      searchCount: 0,
      feedbackShown: false,
      createdAt: Date.now()
    };
  }

  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      const session: SessionData = JSON.parse(stored);
      // Validate session (expire after 24 hours)
      if (Date.now() - session.createdAt < 24 * 60 * 60 * 1000) {
        return session;
      }
    }
  } catch (error) {
    console.warn('Failed to load session from storage:', error);
  }

  // Create new session
  const newSession: SessionData = {
    sessionId: 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
    searchCount: 0,
    feedbackShown: false,
    createdAt: Date.now()
  };

  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
  } catch (error) {
    console.warn('Failed to save session to storage:', error);
  }

  return newSession;
}

// Increment search count and return whether to show feedback
export function incrementSearchCount(): { shouldShowFeedback: boolean; sessionId: string } {
  const session = getOrCreateSession();
  session.searchCount += 1;

  // Show feedback after 3rd search, not 2nd
  const shouldShowFeedback = session.searchCount === 3 && !session.feedbackShown;
  
  console.log('📊 Search count updated:', {
    sessionId: session.sessionId,
    searchCount: session.searchCount,
    feedbackShown: session.feedbackShown,
    shouldShowFeedback
  });

  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    console.warn('Failed to update session storage:', error);
  }

  return {
    shouldShowFeedback,
    sessionId: session.sessionId
  };
}

// Mark feedback as shown
export function markFeedbackShown(): void {
  const session = getOrCreateSession();
  session.feedbackShown = true;

  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    console.warn('Failed to mark feedback as shown:', error);
  }
}

// Get current session ID for analytics
export function getCurrentSessionId(): string {
  return getOrCreateSession().sessionId;
}