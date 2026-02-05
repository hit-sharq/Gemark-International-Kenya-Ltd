// New TypeScript types for ArtAfrik features

// ============ Shopping Cart Types ============
export interface CartItemType {
  id: string;
  cartId: string;
  artListingId: string;
  quantity: number;
  artListing?: ArtListingType;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartType {
  id: string;
  userId: string;
  items: CartItemType[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AddToCartPayload {
  artListingId: string;
  quantity?: number;
}

export interface UpdateCartItemPayload {
  cartItemId: string;
  quantity: number;
}

// ============ Wishlist Types ============
export interface WishlistItemType {
  id: string;
  wishlistId: string;
  artListingId: string;
  artListing?: ArtListingType;
  createdAt: Date;
}

export interface WishlistType {
  id: string;
  userId: string;
  items: WishlistItemType[];
  createdAt: Date;
  updatedAt: Date;
}

// ============ Order Types ============
export type OrderStatusType = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentStatusType = 
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REFUNDED';

export type ShipmentStatusType = 
  | 'PENDING'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'RETURNED'
  | 'FAILED';

export interface OrderItemType {
  id: string;
  orderId: string;
  artListingId: string;
  title: string;
  price: number;
  quantity: number;
  artListing?: ArtListingType;
}

export interface OrderType {
  id: string;
  userId: string;
  orderNumber: string;
  status: OrderStatusType;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  shippingName?: string;
  shippingEmail?: string;
  shippingPhone?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingCountry?: string;
  paymentMethod?: string;
  paymentStatus: PaymentStatusType;
  stripePaymentIntentId?: string;
  mpesaTransactionId?: string;
  notes?: string;
  items: OrderItemType[];
  shipment?: ShipmentType;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShipmentType {
  id: string;
  orderId: string;
  trackingNumber?: string;
  carrier?: string;
  shippingMethod?: string;
  estimatedDelivery?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  status: ShipmentStatusType;
  location?: string;
  notes?: string;
}

export interface CreateOrderPayload {
  cartId: string;
  shippingName: string;
  shippingEmail: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingCountry: string;
  paymentMethod: 'stripe' | 'mpesa';
  notes?: string;
}

// ============ Review Types ============
export interface ReviewReplyType {
  id: string;
  reviewId: string;
  name: string;
  content: string;
  isAdmin: boolean;
  createdAt: Date;
}

export interface ReviewType {
  id: string;
  userId: string;
  artListingId: string;
  rating: number;
  title?: string;
  content: string;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  helpfulCount: number;
  user?: {
    id: string;
    clerkId: string;
  };
  replies?: ReviewReplyType[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReviewPayload {
  artListingId: string;
  rating: number;
  title?: string;
  content: string;
}

export interface ReviewStatsType {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

// ============ Notification Types ============
export type NotificationTypeType = 
  | 'ORDER_CONFIRMATION'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'PAYMENT_RECEIVED'
  | 'REVIEW_REQUEST'
  | 'WISHLIST_ON_SALE'
  | 'ACCOUNT_UPDATE'
  | 'GENERAL';

export interface NotificationType {
  id: string;
  userId?: string;
  orderId?: string;
  type: NotificationTypeType;
  title: string;
  message: string;
  isRead: boolean;
  emailSent: boolean;
  emailSentAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// ============ Social Share Types ============
export interface SocialShareType {
  id: string;
  artListingId: string;
  platform: 'facebook' | 'twitter' | 'whatsapp' | 'pinterest';
  sharedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

// ============ Search & Filter Types ============
export interface SearchFiltersType {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  material?: string;
  region?: string;
  size?: string;
  featured?: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'oldest' | 'popular';
}

export interface SearchResultType {
  artworks: ArtListingType[];
  total: number;
  page: number;
  totalPages: number;
  filters: SearchFiltersType;
}

// ============ Existing Types (Extended) ============
export interface ArtListingType {
  id: string;
  title: string;
  description: string;
  price: number;
  categoryId: string;
  category?: CategoryType;
  material?: string;
  region: string;
  size: string;
  images: string[];
  featured: boolean;
  averageRating?: number;
  totalReviews?: number;
  inWishlist?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryType {
  id: string;
  name: string;
  description?: string;
  slug: string;
  image?: string;
  order: number;
  isActive: boolean;
}

// ============ Checkout Types ============
export interface CheckoutSessionType {
  orderId: string;
  clientSecret?: string;
  url?: string;
}

export interface ShippingInfoType {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
}

// ============ API Response Types ============
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

