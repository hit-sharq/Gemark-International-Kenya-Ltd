// Order Tracker Component
'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Truck, Package, CheckCircle, Clock, MapPin } from 'lucide-react';
import './OrderTracker.css';

interface OrderTrackerProps {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    createdAt: Date;
    shipment?: {
      trackingNumber?: string;
      carrier?: string;
      shippingMethod?: string;
      estimatedDelivery?: Date;
      shippedAt?: Date;
      deliveredAt?: Date;
      status: string;
      location?: string;
    };
  };
}

const statusSteps = [
  { key: 'PENDING', label: 'Order Placed', icon: Clock },
  { key: 'CONFIRMED', label: 'Order Confirmed', icon: CheckCircle },
  { key: 'PROCESSING', label: 'Processing', icon: Package },
  { key: 'SHIPPED', label: 'Shipped', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle },
];

export default function OrderTracker({ order }: OrderTrackerProps) {
  const currentStepIndex = statusSteps.findIndex((s) => s.key === order.status);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'orange';
      case 'CONFIRMED':
        return 'blue';
      case 'PROCESSING':
        return 'purple';
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

  return (
    <div className="order-tracker">
      <div className="tracker-header">
        <div className="order-number">
          <span className="label">Order #</span>
          <span className="value">{order.orderNumber}</span>
        </div>
        <div className={`order-status ${getStatusColor(order.status)}`}>
          {order.status.replace(/_/g, ' ')}
        </div>
      </div>

      {/* Progress Steps */}
      <div className="progress-steps">
        {statusSteps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isPending = index > currentStepIndex;
          const Icon = step.icon;

          return (
            <div
              key={step.key}
              className={`step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isPending ? 'pending' : ''}`}
            >
              <div className="step-icon">
                <Icon size={20} />
              </div>
              <div className="step-label">{step.label}</div>
              {index < statusSteps.length - 1 && (
                <div className="step-line" />
              )}
            </div>
          );
        })}
      </div>

      {/* Shipment Details */}
      {order.shipment && (
        <div className="shipment-details">
          <h4>Shipment Information</h4>

          <div className="shipment-grid">
            {order.shipment.trackingNumber && (
              <div className="shipment-item">
                <span className="item-label">Tracking Number</span>
                <span className="item-value">{order.shipment.trackingNumber}</span>
              </div>
            )}

            {order.shipment.carrier && (
              <div className="shipment-item">
                <span className="item-label">Carrier</span>
                <span className="item-value">{order.shipment.carrier}</span>
              </div>
            )}

            {order.shipment.shippingMethod && (
              <div className="shipment-item">
                <span className="item-label">Shipping Method</span>
                <span className="item-value">{order.shipment.shippingMethod}</span>
              </div>
            )}

            {order.shipment.estimatedDelivery && (
              <div className="shipment-item">
                <span className="item-label">Estimated Delivery</span>
                <span className="item-value">
                  {format(new Date(order.shipment.estimatedDelivery), 'MMMM d, yyyy')}
                </span>
              </div>
            )}

            {order.shipment.location && (
              <div className="shipment-item full-width">
                <MapPin size={16} />
                <span className="item-value">{order.shipment.location}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Timeline */}
      <div className="order-timeline">
        <h4>Order Timeline</h4>
        <div className="timeline">
          <div className="timeline-item">
            <div className="timeline-dot" />
            <div className="timeline-content">
              <span className="timeline-title">Order Placed</span>
              <span className="timeline-date">
                {format(new Date(order.createdAt), 'MMMM d, yyyy h:mm a')}
              </span>
            </div>
          </div>

          {order.shipment?.shippedAt && (
            <div className="timeline-item">
              <div className="timeline-dot shipped" />
              <div className="timeline-content">
                <span className="timeline-title">Shipped</span>
                <span className="timeline-date">
                  {format(new Date(order.shipment.shippedAt), 'MMMM d, yyyy h:mm a')}
                </span>
              </div>
            </div>
          )}

          {order.shipment?.deliveredAt && (
            <div className="timeline-item">
              <div className="timeline-dot delivered" />
              <div className="timeline-content">
                <span className="timeline-title">Delivered</span>
                <span className="timeline-date">
                  {format(new Date(order.shipment.deliveredAt), 'MMMM d, yyyy h:mm a')}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

