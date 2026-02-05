// Orders Page - User's order history
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { format } from 'date-fns';
import Link from 'next/link';
import { Package, ChevronRight, Loader2 } from 'lucide-react';
import OrderTracker from '@/components/OrderTracker';
import './orders-page.css';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: Date;
  items: {
    id: string;
    title: string;
    price: number;
    quantity: number;
    artListing: {
      images: string[];
    };
  }[];
  shipment?: {
    trackingNumber?: string;
    status: string;
    estimatedDelivery?: Date;
  };
}

export default function OrdersPage() {
  const { user, isLoaded } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      fetchOrders();
    }
  }, [isLoaded, user]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      const data = await response.json();

      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'orange';
      case 'CONFIRMED':
      case 'PROCESSING':
        return 'blue';
      case 'SHIPPED':
        return 'cyan';
      case 'DELIVERED':
        return 'green';
      case 'CANCELLED':
      case 'REFUNDED':
        return 'red';
      default:
        return 'gray';
    }
  };

  if (!isLoaded) {
    return (
      <div className="orders-page">
        <div className="loading-container">
          <Loader2 size={32} className="spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="orders-page">
        <div className="auth-required">
          <h2>Sign In Required</h2>
          <p>Please sign in to view your orders.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="page-header">
        <h1>My Orders</h1>
        <p>Track and manage your orders</p>
      </div>

      {isLoading ? (
        <div className="loading-container">
          <Loader2 size={32} className="spin" />
          <span>Loading your orders...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="no-orders">
          <Package size={48} />
          <h2>No Orders Yet</h2>
          <p>You haven't placed any orders yet.</p>
          <Link href="/gallery" className="browse-btn">
            Browse Artworks
          </Link>
        </div>
      ) : (
        <div className="orders-container">
          <div className="orders-list">
            {orders.map((order) => (
              <div
                key={order.id}
                className={`order-card ${selectedOrder?.id === order.id ? 'selected' : ''}`}
                onClick={() => setSelectedOrder(order)}
              >
                <div className="order-header">
                  <div className="order-info">
                    <span className="order-number">Order #{order.orderNumber}</span>
                    <span className="order-date">
                      {format(new Date(order.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className={`order-status ${getStatusColor(order.status)}`}>
                    {order.status.replace(/_/g, ' ')}
                  </div>
                </div>

                <div className="order-items-preview">
                  {order.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="item-thumb">
                      <img
                        src={item.artListing.images[0] || '/placeholder.jpg'}
                        alt={item.title}
                      />
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="more-items">+{order.items.length - 3}</div>
                  )}
                </div>

                <div className="order-footer">
                  <span className="order-total">${order.total.toLocaleString()}</span>
                  <ChevronRight size={20} />
                </div>
              </div>
            ))}
          </div>

          {selectedOrder && (
            <div className="order-details">
              <OrderTracker order={selectedOrder} />

              <div className="order-items">
                <h3>Order Items</h3>
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="order-item">
                    <img
                      src={item.artListing.images[0] || '/placeholder.jpg'}
                      alt={item.title}
                    />
                    <div className="item-info">
                      <h4>{item.title}</h4>
                      <span className="item-qty">Qty: {item.quantity}</span>
                    </div>
                    <span className="item-price">${(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

