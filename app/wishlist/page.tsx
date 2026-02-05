// Wishlist Page
export const dynamic = 'force-dynamic'

import { Suspense } from 'react';
import Link from 'next/link';
import { Heart, ArrowLeft, ShoppingCart, Trash2, X } from 'lucide-react';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import Image from 'next/image';
import toast from 'react-hot-toast';
import './wishlist-page.css';

function WishlistContent() {
  const { items, removeItem, clearWishlist } = useWishlist();
  const { addItem, openCart } = useCart();

  const handleMoveToCart = (artwork: any) => {
    addItem(artwork);
    removeItem(artwork.id);
    toast.success('Moved to cart!');
    openCart();
  };

  if (items.length === 0) {
    return (
      <div className="empty-wishlist-page">
        <div className="empty-icon">
          <Heart size={80} />
        </div>
        <h1>Your Wishlist is Empty</h1>
        <p>Save your favorite artworks to purchase later.</p>
        <div className="empty-actions">
          <Link href="/gallery" className="browse-btn">
            <ArrowLeft size={20} />
            Browse Artworks
          </Link>
          <Link href="/" className="home-btn">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="wishlist-page-header">
        <div className="header-content">
          <Heart size={32} className="header-icon" />
          <div>
            <h1>My Wishlist</h1>
            <span className="item-count">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
          </div>
        </div>
        <button className="clear-wishlist-btn" onClick={clearWishlist}>
          <Trash2 size={18} />
          Clear Wishlist
        </button>
      </div>

      <div className="wishlist-grid">
        {items.map((item) => {
          const artwork = item.artListing;
          if (!artwork) return null;

          const imageUrl = artwork.images?.[0] || '/placeholder.jpg';

          return (
            <div key={item.id} className="wishlist-card">
              <div className="wishlist-card-image">
                <Link href={`/gallery/${artwork.id}`}>
                  <Image
                    src={imageUrl}
                    alt={artwork.title}
                    width={300}
                    height={300}
                    className="artwork-image"
                  />
                </Link>
                <button
                  className="remove-btn"
                  onClick={() => removeItem(artwork.id)}
                  aria-label="Remove from wishlist"
                >
                  <X size={18} />
                </button>
                {artwork.featured && (
                  <span className="featured-badge">Featured</span>
                )}
              </div>

              <div className="wishlist-card-content">
                <Link href={`/gallery/${artwork.id}`} className="artwork-title">
                  {artwork.title}
                </Link>
                <p className="artwork-category">{artwork.category?.name || 'Uncategorized'}</p>
                <p className="artwork-region">{artwork.region}</p>
                <p className="artwork-price">${artwork.price?.toFixed(2)}</p>

                <div className="wishlist-card-actions">
                  <button
                    className="move-to-cart-btn"
                    onClick={() => handleMoveToCart(artwork)}
                  >
                    <ShoppingCart size={18} />
                    Move to Cart
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function WishlistPage() {
  return (
    <Suspense fallback={<div className="loading">Loading wishlist...</div>}>
      <WishlistContent />
    </Suspense>
  );
}

