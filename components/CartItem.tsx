// Cart Item Component
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, X, ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { CartItemType } from '@/types';

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const { removeItem, updateQuantity } = useCart();
  const artwork = item.artListing;

  if (!artwork) {
    return null;
  }

  const imageUrl = artwork.images?.[0] || '/placeholder.jpg';
  const price = artwork.price || 0;
  const subtotal = price * item.quantity;

  return (
    <div className="cart-item">
      <div className="cart-item-image">
        <Link href={`/gallery/${artwork.id}`}>
          <Image
            src={imageUrl}
            alt={artwork.title}
            width={80}
            height={80}
            className="cart-item-img"
          />
        </Link>
      </div>

      <div className="cart-item-details">
        <Link href={`/gallery/${artwork.id}`} className="cart-item-title">
          {artwork.title}
        </Link>
        
        <p className="cart-item-category">
          {artwork.category?.name || 'Uncategorized'}
        </p>
        
        <p className="cart-item-price">
          ${price.toFixed(2)}
        </p>

        <div className="cart-item-actions">
          <div className="quantity-control">
            <button
              className="quantity-btn"
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              aria-label="Decrease quantity"
            >
              <Minus size={14} />
            </button>
            <span className="quantity-value">{item.quantity}</span>
            <button
              className="quantity-btn"
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              aria-label="Increase quantity"
            >
              <Plus size={14} />
            </button>
          </div>

          <button
            className="remove-btn"
            onClick={() => removeItem(item.id)}
            aria-label="Remove item"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="cart-item-subtotal">
        <span className="subtotal-label">Subtotal</span>
        <span className="subtotal-value">${subtotal.toFixed(2)}</span>
      </div>

      <style jsx>{`
        .cart-item {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          border-bottom: 1px solid #e5e5e5;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .cart-item-image {
          flex-shrink: 0;
        }

        .cart-item-img {
          border-radius: 8px;
          object-fit: cover;
        }

        .cart-item-details {
          flex: 1;
          min-width: 0;
        }

        .cart-item-title {
          font-weight: 600;
          color: #1a1a1a;
          text-decoration: none;
          display: block;
          margin-bottom: 0.25rem;
          transition: color 0.2s;
        }

        .cart-item-title:hover {
          color: #c9a227;
        }

        .cart-item-category {
          font-size: 0.75rem;
          color: #666;
          margin-bottom: 0.5rem;
        }

        .cart-item-price {
          font-weight: 500;
          color: #333;
          margin-bottom: 0.5rem;
        }

        .cart-item-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .quantity-control {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #f5f5f5;
          border-radius: 8px;
          padding: 4px;
        }

        .quantity-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: none;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          color: #333;
        }

        .quantity-btn:hover {
          background: #c9a227;
          color: white;
        }

        .quantity-value {
          min-width: 24px;
          text-align: center;
          font-weight: 600;
        }

        .remove-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          color: #999;
          cursor: pointer;
          transition: all 0.2s;
          border-radius: 6px;
        }

        .remove-btn:hover {
          background: #fee2e2;
          color: #dc2626;
        }

        .cart-item-subtotal {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.25rem;
        }

        .subtotal-label {
          font-size: 0.75rem;
          color: #666;
        }

        .subtotal-value {
          font-weight: 700;
          font-size: 1rem;
          color: #1a1a1a;
        }

        @media (max-width: 480px) {
          .cart-item {
            flex-wrap: wrap;
          }

          .cart-item-subtotal {
            width: 100%;
            flex-direction: row;
            justify-content: space-between;
            margin-top: 0.5rem;
            padding-top: 0.5rem;
            border-top: 1px dashed #e5e5e5;
          }
        }
      `}</style>
    </div>
  );
}

