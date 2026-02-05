// Shipping System Type Definitions for ArtAfrik

import { ShipmentStatus, OrderStatus } from '@prisma/client';

// ============================================
// Core Shipping Types
// ============================================

export type ShippingZone = 
  | 'local'      // Kenya (domestic)
  | 'zone_a'     // East Africa
  | 'zone_b'     // Rest of Africa
  | 'zone_c'     // Asia & Middle East
  | 'zone_d'     // Europe
  | 'zone_e'     // Americas
  | 'zone_f';    // Oceania

export type CourierService = 
  | 'local_courier'
  | 'ems_economy'
  | 'dhl_express'
  | 'fedex'
  | 'ups'
  | 'aramex';

export type PaymentType = 'PREPAID' | 'COD';

// ============================================
// Shipment Types
// ============================================

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  countryCode: string;
  phone: string;
  email?: string;
}

export interface ShipmentItem {
  id?: string;
  artListingId: string;
  title: string;
  quantity: number;
  weight?: number;
  value: number;
  description?: string;
}

export interface ShipmentDimensions {
  length: number;   // cm
  width: number;    // cm
  height: number;   // cm
}

export interface ShipmentCost {
  baseRate: number;
  weightCharge: number;
  fuelSurcharge: number;
  insurance: number;
  handlingFee: number;
  total: number;
  currency: string;
}

// ============================================
// Tracking Types
// ============================================

export interface TrackingEvent {
  id?: string;
  timestamp: Date;
  status: string;
  statusCode: string;
  location?: string;
  description: string;
  isCurrentLocation?: boolean;
}

export interface TrackingInfo {
  trackingNumber: string;
  courier: string;
  status: ShipmentStatus;
  statusDescription: string;
  origin: string;
  destination: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  events: TrackingEvent[];
  weight?: number;
  dimensions?: ShipmentDimensions;
  lastUpdated: Date;
}

// ============================================
// Shipping Options Types
// ============================================

export interface ShippingOption {
  id: string;
  courier: string;
  service: CourierService;
  zone: ShippingZone;
  estimatedDays: {
    min: number;
    max: number;
  };
  price: number;
  currency: string;
  isAvailable: boolean;
  features?: string[];
}

export interface ShippingQuote {
  zone: ShippingZone;
  countryCode: string;
  countryName: string;
  options: ShippingOption[];
  freeShippingThreshold: number;
  currency: string;
}

// ============================================
// API Request/Response Types
// ============================================

export interface CreateShipmentRequest {
  orderId?: string;
  origin: ShippingAddress;
  destination: ShippingAddress;
  items: ShipmentItem[];
  courier: CourierService;
  serviceType: 'standard' | 'express' | 'economy';
  paymentType: PaymentType;
  description?: string;
  specialInstructions?: string;
  isReturn: boolean;
}

export interface CreateShipmentResponse {
  success: boolean;
  data?: {
    shipmentId: string;
    trackingNumber: string;
    labelUrl?: string;
    cost: ShipmentCost;
    estimatedDelivery: Date;
  };
  error?: string;
}

export interface UpdateShipmentRequest {
  status?: ShipmentStatus;
  trackingNumber?: string;
  courier?: string;
  estimatedDelivery?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  notes?: string;
  location?: string;
}

export interface ShipmentSearchParams {
  page?: number;
  limit?: number;
  status?: ShipmentStatus;
  courier?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface PaginatedShipments {
  data: Array<{
    id: string;
    trackingNumber: string | null;
    carrier: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// Shipping Rules Types
// ============================================

export interface ShippingRuleCondition {
  minSubtotal?: number;
  maxSubtotal?: number;
  minWeight?: number;
  maxWeight?: number;
  zones?: ShippingZone[];
  countries?: string[];
  coupons?: string[];
}

export interface ShippingRuleAction {
  type: 'free' | 'discount' | 'fixed';
  value: number;
}

export interface ShippingRule {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  priority: number;
  conditions: ShippingRuleCondition;
  action: ShippingRuleAction;
}

// ============================================
// Packaging Types
// ============================================

export interface PackagingBox {
  id: string;
  name: string;
  type: 'box' | 'envelope' | 'tube' | 'pallet';
  dimensions: ShipmentDimensions;
  maxWeight: number;
  isActive: boolean;
}

export interface PackagingRecommendation {
  box: PackagingBox;
  items: ShipmentItem[];
  totalWeight: number;
  totalValue: number;
  fits: boolean;
  message?: string;
}

// ============================================
// Email Template Types
// ============================================

export interface ShippingEmailData {
  customerName: string;
  customerEmail: string;
  trackingNumber: string;
  courier: string;
  status: ShipmentStatus;
  statusDescription: string;
  estimatedDelivery?: Date;
  destination: string;
  items: ShipmentItem[];
  trackingUrl?: string;
}

// ============================================
// Dashboard Types
// ============================================

export interface ShippingStats {
  totalShipments: number;
  pendingShipments: number;
  inTransitShipments: number;
  deliveredShipments: number;
  returnedShipments: number;
  averageDeliveryTime: number; // days
  totalRevenue: number;
}

export interface CourierStats {
  courier: string;
  totalShipments: number;
  delivered: number;
  inTransit: number;
  returned: number;
  averageDeliveryTime: number;
  onTimePercentage: number;
}

// ============================================
// Helper Type Guards
// ============================================

export function isValidShippingZone(zone: string): zone is ShippingZone {
  return ['local', 'zone_a', 'zone_b', 'zone_c', 'zone_d', 'zone_e', 'zone_f'].includes(zone);
}

export function isValidCourierService(service: string): service is CourierService {
  return ['local_courier', 'ems_economy', 'dhl_express', 'fedex', 'ups', 'aramex'].includes(service);
}

export function isValidShipmentStatus(status: string): status is ShipmentStatus {
  return ['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED', 'FAILED'].includes(status);
}

