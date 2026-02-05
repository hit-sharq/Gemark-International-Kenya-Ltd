// Wishlist Button Component
'use client';

import { Heart } from 'lucide-react';
import { useWishlist } from '@/contexts/WishlistContext';
import { ArtListingType } from '@/types';
import './WishlistButton.css';

interface WishlistButtonProps {
  artwork: ArtListingType;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function WishlistButton({ 
  artwork, 
  showText = false, 
  size = 'md' 
}: WishlistButtonProps) {
  const { isInWishlist, toggleItem } = useWishlist();
  const isActive = isInWishlist(artwork.id);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(artwork);
  };

  const sizeClass = `wishlist-btn-${size}`;

  return (
    <button
      className={`wishlist-btn ${sizeClass} ${isActive ? 'active' : ''}`}
      onClick={handleClick}
      aria-label={isActive ? 'Remove from wishlist' : 'Add to wishlist'}
      title={isActive ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart 
        size={size === 'sm' ? 16 : size === 'md' ? 20 : 24}
        className={`heart-icon ${isActive ? 'filled' : ''}`}
      />
      {showText && (
        <span className="wishlist-text">
          {isActive ? 'In Wishlist' : 'Add to Wishlist'}
        </span>
      )}
    </button>
  );
}

