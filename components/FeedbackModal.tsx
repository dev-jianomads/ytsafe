'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { X, Star, MessageSquare } from 'lucide-react';
import { saveFeedback } from '@/lib/feedback';
import { markFeedbackShown } from '@/lib/session';
import { hashUserAgent } from '@/lib/analytics';
import { toast } from 'sonner';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
}

export function FeedbackModal({ isOpen, onClose, sessionId }: FeedbackModalProps) {
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [showCommentField, setShowCommentField] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleScoreSelect = (selectedScore: number) => {
    setScore(selectedScore);
    setShowCommentField(true);
  };

  const handleSubmit = async () => {
    if (score === null) return;

    setIsSubmitting(true);
    
    // Get user agent hash for user identification
    const userAgent = navigator.userAgent;
    const userAgentHash = hashUserAgent(userAgent);
    
    console.log('🎯 Submitting feedback:', {
      sessionId,
      score,
      comment: comment.trim() || undefined,
      userAgentHash
    });

    try {
      const feedbackData = {
        session_id: sessionId,
        score,
        comment: comment.trim() || undefined,
        user_agent_hash: userAgentHash
      };

      const success = await saveFeedback(feedbackData);
      
      if (success) {
        toast.success('Thank you for your feedback!', {
          description: 'Your input helps us improve the app.',
          duration: 3000,
        });
        markFeedbackShown();
        onClose();
      } else {
        toast.error('Failed to save feedback', {
          description: 'Please check the console for details and try again.',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to save feedback', {
        description: 'Unexpected error occurred. Check console for details.',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMaybeLater = () => {
    markFeedbackShown();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 bg-white relative">
        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMaybeLater}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Star className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Help us improve!
          </h3>
          <p className="text-sm text-gray-600">
            Your feedback helps make YouTube safer for families
          </p>
        </div>

        {/* Question 1: Rating */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">
            How likely are you to recommend this app to your friends?
          </p>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500">Not likely</span>
            <span className="text-xs text-gray-500">Very likely</span>
          </div>
          <div className="flex justify-between gap-1">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <button
                key={num}
                onClick={() => handleScoreSelect(num)}
                className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                  score === num
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Question 2: Comment (shown after rating) */}
        {showCommentField && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-4 w-4 text-green-600" />
              <p className="text-sm font-medium text-gray-700">
                Any features you'd like to see in future versions?
              </p>
            </div>
            <Input
              type="text"
              placeholder="Optional: Share your ideas..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">Optional</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleMaybeLater}
            className="flex-1"
            disabled={isSubmitting}
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={score === null || isSubmitting}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </Card>
    </div>
  );
}