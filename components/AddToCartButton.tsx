// Add to Cart Button Component
'use client';

import { useState } from 'react';
import { ShoppingCart, Plus, Check, Loader2, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { ArtListingType } from '@/types';
import toast from 'react-hot-toast';
import './AddToCartButton.css';

interface AddToCartButtonProps {
  artwork: ArtListingType;
  variant?: 'default' | 'icon-only' | 'large';
  showQuantity?: boolean;
}

export default function AddToCartButton({
  artwork,
  variant = 'default',
  showQuantity = false,
}: AddToCartButtonProps) {
  const { addItem, getItem } = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  
  const existingItem = getItem(artwork.id);
  const isInCart = !!existingItem;

  const handleAddToCart = async () => {
    setIsAdding(true);

    try {
      // Add item to cart
      addItem(artwork, quantity);

      // Show success toast
      toast.success(
        isInCart 
          ? 'Cart updated successfully!' 
          : `${artwork.title} added to cart!`,
        {
          duration: 3000,
          style: {
            background: '#10b981',
            color: 'white',
          },
        }
      );

      // Reset quantity
      setQuantity(1);
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRequestProduct = () => {
    router.push(`/contact?type=product&pieceTitle=${encodeURIComponent(artwork.title)}`);
  };

  const incrementQuantity = () => setQuantity(q => q + 1);
  const decrementQuantity = () => setQuantity(q => Math.max(1, q - 1));

  if (variant === 'icon-only') {
    return (
      <div className="addtocart-wrapper icon-only">
        <button
          className="addtocart-btn icon-only"
          onClick={handleAddToCart}
          disabled={isAdding}
          aria-label="Add to cart"
        >
          {isAdding ? (
            <Loader2 size={20} className="spin" />
          ) : (
            <ShoppingCart size={20} />
          )}
        </button>
        <button
          className="request-product-btn icon-only"
          onClick={handleRequestProduct}
          aria-label="Request this product"
        >
          <MessageCircle size={20} />
        </button>
      </div>
    );
  }

  if (variant === 'large') {
    return (
      <div className="addtocart-wrapper large">
        {showQuantity && (
          <div className="quantity-selector">
            <button onClick={decrementQuantity} disabled={quantity <= 1}>
              -
            </button>
            <span>{quantity}</span>
            <button onClick={incrementQuantity}>+</button>
          </div>
        )}
        <div className="button-group">
          <button
            className="addtocart-btn large"
            onClick={handleAddToCart}
            disabled={isAdding}
          >
            {isAdding ? (
              <>
                <Loader2 size={22} className="spin" />
                Adding...
              </>
            ) : (
              <>
                <ShoppingCart size={22} />
                Add to Cart - ${(artwork.price * quantity).toFixed(2)}
              </>
            )}
          </button>
          <button
            className="request-product-btn large"
            onClick={handleRequestProduct}
          >
            <MessageCircle size={22} />
            Request This Product
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="addtocart-wrapper">
      {showQuantity && (
        <div className="quantity-selector">
          <button onClick={decrementQuantity} disabled={quantity <= 1}>
            -
          </button>
          <span>{quantity}</span>
          <button onClick={incrementQuantity}>+</button>
        </div>
      )}
      <div className="button-group default">
        <button
          className="addtocart-btn"
          onClick={handleAddToCart}
          disabled={isAdding}
        >
          {isAdding ? (
            <Loader2 size={18} className="spin" />
          ) : (
            <>
              <ShoppingCart size={18} />
              {isInCart ? 'Update Cart' : 'Add to Cart'}
            </>
          )}
        </button>
        <button
          className="request-product-btn"
          onClick={handleRequestProduct}
        >
          <MessageCircle size={18} />
          Request Product
        </button>
      </div>
    </div>
  );
}

