// Cart Sidebar Component
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { X, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import CartItem from './CartItem';
import { motion, AnimatePresence } from 'framer-motion';
import './CartSidebar.css';

export default function CartSidebar() {
  const {
    items,
    isOpen,
    closeCart,
    subtotal,
    itemCount,
    clearCart,
  } = useCart();

  // Close cart on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closeCart]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
          />

          {/* Sidebar */}
          <motion.div
            className="cart-sidebar"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className="cart-header">
              <div className="cart-header-title">
                <ShoppingBag size={24} />
                <h2>Your Cart</h2>
                <span className="cart-count">({itemCount} items)</span>
              </div>
              <button className="close-btn" onClick={closeCart}>
                <X size={24} />
              </button>
            </div>

            {/* Cart Items */}
            <div className="cart-content">
              {items.length === 0 ? (
                <div className="empty-cart">
                  <div className="empty-icon">
                    <ShoppingBag size={64} />
                  </div>
                  <h3>Your cart is empty</h3>
                  <p>Looks like you haven&apos;t added any artworks yet.</p>
                  <button className="browse-btn" onClick={closeCart}>
                    Browse Artworks
                  </button>
                </div>
              ) : (
                <div className="cart-items">
                  {items.map((item) => (
                    <CartItem key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="cart-footer">
                {/* Clear Cart */}
                <button
                  className="clear-cart-btn"
                  onClick={clearCart}
                >
                  <Trash2 size={16} />
                  Clear Cart
                </button>

                {/* Subtotal */}
                <div className="cart-subtotal">
                  <span>Subtotal</span>
                  <span className="subtotal-amount">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                {/* Shipping Note */}
                <p className="shipping-note">
                  Shipping and taxes calculated at checkout
                </p>

                {/* Checkout Button */}
                <Link
                  href="/checkout"
                  className="checkout-btn"
                  onClick={closeCart}
                >
                  Proceed to Checkout
                  <ArrowRight size={20} />
                </Link>

                {/* Continue Shopping */}
                <button className="continue-shopping" onClick={closeCart}>
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

