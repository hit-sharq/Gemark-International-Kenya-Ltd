// Review List Component
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import StarRating from './StarRating';
import { Loader2, MessageSquare } from 'lucide-react';
import './ReviewList.css';

interface ReviewListProps {
  artListingId: string;
}

interface Review {
  id: string;
  rating: number;
  title?: string;
  content: string;
  createdAt: Date;
  helpfulCount: number;
  user: {
    clerkId: string;
  };
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export default function ReviewList({ artListingId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`/api/reviews?artListingId=${artListingId}`);
        const data = await response.json();

        if (data.success) {
          setReviews(data.data.reviews);
          setStats(data.data.stats);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [artListingId]);

  if (isLoading) {
    return (
      <div className="reviews-loading">
        <Loader2 size={32} className="spin" />
        <span>Loading reviews...</span>
      </div>
    );
  }

  return (
    <div className="review-list">
      {/* Reviews Header */}
      <div className="reviews-header">
        <h3>
          <MessageSquare size={22} />
          Customer Reviews
        </h3>
        
        {stats && (
          <div className="reviews-summary">
            <div className="average-rating">
              <span className="rating-number">{stats.averageRating.toFixed(1)}</span>
              <div className="rating-stars">
                <StarRating rating={Math.round(stats.averageRating)} size="md" />
              </div>
              <span className="total-reviews">
                {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
              </span>
            </div>

            {/* Rating Distribution */}
            <div className="rating-bars">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats.ratingDistribution[star as keyof typeof stats.ratingDistribution];
                const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                
                return (
                  <div key={star} className="rating-bar-row">
                    <span className="star-label">{star} star</span>
                    <div className="rating-bar">
                      <div
                        className="rating-bar-fill"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="star-count">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Reviews List */}
      <div className="reviews-list">
        {reviews.length === 0 ? (
          <div className="no-reviews">
            <p>No reviews yet. Be the first to review this artwork!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="review-item">
              <div className="review-header">
                <div className="reviewer-info">
                  <div className="reviewer-avatar">
                    {review.user.clerkId.charAt(0).toUpperCase()}
                  </div>
                  <div className="reviewer-details">
                    <span className="reviewer-name">Customer</span>
                    <span className="review-date">
                      {format(new Date(review.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
                <StarRating rating={review.rating} size="sm" />
              </div>

              {review.title && (
                <h4 className="review-title">{review.title}</h4>
              )}
              
              <p className="review-content">{review.content}</p>

              <div className="review-footer">
                <button className="helpful-btn">
                  Helpful ({review.helpfulCount})
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

