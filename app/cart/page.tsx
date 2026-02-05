'use client';

export const dynamic = 'force-dynamic'

import { Suspense } from 'react';
import Link from 'next/link';
import { ShoppingCart, ArrowLeft, Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import Image from 'next/image';
import MainLayout from '../../components/MainLayout';
import './cart-page.css';

function CartContent() {
  const { items, subtotal, itemCount, removeItem, updateQuantity, clearCart } = useCart();

  const shippingEstimate = subtotal > 500 ? 0 : 25;
  const taxEstimate = subtotal * 0.08;
  const total = subtotal + shippingEstimate + taxEstimate;

  if (items.length === 0) {
    return (
      <div className="empty-cart-page">
        <div className="empty-icon">
          <ShoppingCart size={80} />
        </div>
        <h1>Your Cart is Empty</h1>
        <p>Looks like you haven&apos;t added any artworks to your cart yet.</p>
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
    <div className="cart-page">
      <div className="cart-page-header">
        <h1>Shopping Cart</h1>
        <span className="item-count">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
      </div>

      <div className="cart-layout">
        {/* Cart Items */}
        <div className="cart-items-section">
          <div className="cart-items-header">
            <span>Product</span>
            <span>Price</span>
            <span>Quantity</span>
            <span>Subtotal</span>
          </div>

          <div className="cart-items-list">
            {items.map((item) => {
              const artwork = item.artListing;
              if (!artwork) return null;
              
              const imageUrl = artwork.images?.[0] || '/placeholder.jpg';
              const price = artwork.price || 0;
              const itemSubtotal = price * item.quantity;

              return (
                <div key={item.id} className="cart-item-row">
                  <div className="item-product">
                    <Link href={`/gallery/${artwork.id}`} className="item-image-link">
                      <Image
                        src={imageUrl}
                        alt={artwork.title}
                        width={100}
                        height={100}
                        className="item-image"
                      />
                    </Link>
                    <div className="item-details">
                      <Link href={`/gallery/${artwork.id}`} className="item-title">
                        {artwork.title}
                      </Link>
                      <p className="item-category">{artwork.category?.name || 'Uncategorized'}</p>
                      <p className="item-region">{artwork.region}</p>
                    </div>
                  </div>

                  <div className="item-price">
                    ${price.toFixed(2)}
                  </div>

                  <div className="item-quantity">
                    <div className="quantity-controls">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={16} />
                      </button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="item-subtotal">
                    ${itemSubtotal.toFixed(2)}
                  </div>

                  <button
                    className="remove-item-btn"
                    onClick={() => removeItem(item.id)}
                    aria-label="Remove item"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="cart-actions">
            <Link href="/gallery" className="continue-shopping">
              <ArrowLeft size={18} />
              Continue Shopping
            </Link>
            <button className="clear-cart-btn" onClick={clearCart}>
              <Trash2 size={18} />
              Clear Cart
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="order-summary">
          <h2>Order Summary</h2>

          <div className="summary-row">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>

          <div className="summary-row">
            <span>Shipping Estimate</span>
            <span>
              {shippingEstimate === 0 ? (
                <span className="free-shipping">FREE</span>
              ) : (
                `$${shippingEstimate.toFixed(2)}`
              )}
            </span>
          </div>

          {shippingEstimate > 0 && (
            <p className="shipping-note">
              Free shipping on orders over $500!
            </p>
          )}

          <div className="summary-row">
            <span>Tax Estimate</span>
            <span>${taxEstimate.toFixed(2)}</span>
          </div>

          <div className="summary-divider"></div>

          <div className="summary-row total">
            <span>Order Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <Link href="/checkout" className="checkout-btn">
            Proceed to Checkout
          </Link>

          <div className="secure-checkout">
            <span className="lock-icon">🔒</span>
            Secure Checkout
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <MainLayout>
      <Suspense fallback={<div className="loading">Loading cart...</div>}>
        <CartContent />
      </Suspense>
    </MainLayout>
  );
}

