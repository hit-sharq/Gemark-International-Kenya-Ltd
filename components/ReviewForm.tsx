// Review Form Component
'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import StarRating from './StarRating';
import { Loader2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import './ReviewForm.css';

interface ReviewFormProps {
  artListingId: string;
  onSuccess?: () => void;
}

export default function ReviewForm({ artListingId, onSuccess }: ReviewFormProps) {
  const { user, isLoaded } = useUser();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoaded || !user) {
      toast.error('Please sign in to leave a review');
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!content.trim()) {
      toast.error('Please write a review');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artListingId,
          rating,
          title: title.trim() || undefined,
          content: content.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSubmitted(true);
        toast.success('Thank you for your review!');
        onSuccess?.();
      } else {
        toast.error(data.error || 'Failed to submit review');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="review-form-loading">
        <Loader2 size={24} className="spin" />
        <span>Loading...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="review-form-guest">
        <p>Please sign in to leave a review.</p>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="review-form-success">
        <div className="success-icon">
          <Check size={32} />
        </div>
        <h3>Review Submitted!</h3>
        <p>Thank you for sharing your feedback. Your review will appear after moderation.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="review-form">
      <h3>Write a Review</h3>

      {/* Rating */}
      <div className="form-group">
        <label>Your Rating</label>
        <StarRating
          rating={rating}
          onRatingChange={setRating}
          size="lg"
          interactive
        />
      </div>

      {/* Title (optional) */}
      <div className="form-group">
        <label htmlFor="review-title">Review Title (optional)</label>
        <input
          type="text"
          id="review-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          maxLength={100}
        />
      </div>

      {/* Content */}
      <div className="form-group">
        <label htmlFor="review-content">Your Review</label>
        <textarea
          id="review-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your thoughts about this artwork..."
          rows={5}
          required
        />
        <span className="char-count">{content.length}/1000 characters</span>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="submit-btn"
        disabled={isSubmitting || rating === 0 || !content.trim()}
      >
        {isSubmitting ? (
          <>
            <Loader2 size={18} className="spin" />
            Submitting...
          </>
        ) : (
          'Submit Review'
        )}
      </button>
    </form>
  );
}

