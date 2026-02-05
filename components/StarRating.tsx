// Star Rating Component
'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import './StarRating.css';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  interactive?: boolean;
}

export default function StarRating({
  rating,
  onRatingChange,
  size = 'md',
  showValue = false,
  interactive = false,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (value: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleMouseEnter = (value: number) => {
    if (interactive) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || rating;
  const sizeClass = `stars-${size}`;

  return (
    <div className={`star-rating ${sizeClass}`}>
      <div className="stars-container">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            className={`star-btn ${value <= displayRating ? 'filled' : ''} ${interactive ? 'interactive' : ''}`}
            onClick={() => handleClick(value)}
            onMouseEnter={() => handleMouseEnter(value)}
            onMouseLeave={handleMouseLeave}
            disabled={!interactive}
            aria-label={`Rate ${value} stars`}
          >
            <Star
              size={size === 'sm' ? 14 : size === 'md' ? 18 : 24}
              className="star-icon"
              fill={value <= displayRating ? 'currentColor' : 'none'}
            />
          </button>
        ))}
      </div>
      {showValue && (
        <span className="rating-value">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

