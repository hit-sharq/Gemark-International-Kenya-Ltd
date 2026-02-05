// Checkout Page with PesaPal Payment Only
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Lock, Loader2, Smartphone, Building, Truck, Clock, Check } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import toast from 'react-hot-toast';
import MainLayout from '../../components/MainLayout';
import './checkout.css';

// Payment method types
type PaymentMethod = 'pesapal';

// Shipping option type
interface ShippingOption {
  id: string;
  courier: string;
  service: string;
  estimatedDays: { min: number; max: number };
  price: number;
  currency: string;
  isAvailable: boolean;
  features: string[];
}

interface ShippingInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  countryCode: string;
}

// Exchange rate: USD to KES (will be fetched from API)
let USD_TO_KES_RATE = 130; // Default fallback, will be updated from API

// PesaPal Checkout Form
interface PesaPalCheckoutFormProps {
  cartItems: Array<{
    id: string;
    artListingId: string;
    quantity: number;
    artListing?: {
      id: string;
      title: string;
      price: number;
      images?: string[];
    };
  }>;
  shippingInfo: ShippingInfo;
  onSuccess: (orderId: string, orderNumber: string) => void;
  selectedMethod: 'mpesa' | 'card' | 'bank';
  onMethodChange: (method: 'mpesa' | 'card' | 'bank') => void;
  shippingCost: number;
  tax: number;
  totalUSD: number;
  subtotal: number;
  exchangeRate: number;
}

function PesaPalCheckoutForm({ 
  cartItems, 
  shippingInfo, 
  onSuccess, 
  selectedMethod, 
  onMethodChange,
  shippingCost,
  tax,
  totalUSD,
  subtotal: parentSubtotal,
  exchangeRate
}: PesaPalCheckoutFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Use subtotal from props (calculated in parent)
  const subtotal = parentSubtotal;

  // Use exchange rate from props (fetched from API)
  const totalKES = Math.round(totalUSD * exchangeRate);

  // Validate M-Pesa phone number
  const validatePhoneNumber = (phone: string): boolean => {
    if (!phone) {
      setPhoneError('Phone number is required for M-Pesa payments');
      return false;
    }
    
    // Remove spaces and special characters
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    // Check for various Kenyan phone formats
    const patterns = [
      /^254[71]\d{8}$/,           // 2547XXXXXXXX or 2541XXXXXXXX
      /^0[71]\d{8}$/,              // 07XXXXXXXX or 01XXXXXXXX
      /^\+254[71]\d{8}$/,          // +2547XXXXXXXX or +2541XXXXXXXX
    ];
    
    const isValid = patterns.some(pattern => pattern.test(cleanPhone));
    
    if (!isValid) {
      setPhoneError('Please enter a valid Kenyan phone number (e.g., 254712345678)');
      return false;
    }
    
    setPhoneError('');
    return true;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhoneNumber(value);
    
    // Validate on input
    if (value && selectedMethod === 'mpesa') {
      validatePhoneNumber(value);
    } else {
      setPhoneError('');
    }
  };

  const handlePesaPalPayment = async () => {
    // Validate shipping info before proceeding
    if (!shippingInfo.name || !shippingInfo.email || !shippingInfo.address || !shippingInfo.city || !shippingInfo.country) {
      toast.error('Please fill in all shipping information');
      return;
    }

    // Validate phone for M-Pesa
    if (selectedMethod === 'mpesa' && !validatePhoneNumber(phoneNumber)) {
      toast.error(phoneError);
      return;
    }

    setIsProcessing(true);
    setStatus('processing');
    setErrorMessage('');

    // Transform cart items for API
    const formattedCartItems = cartItems.map(item => ({
      artListingId: item.artListing?.id,
      title: item.artListing?.title,
      price: item.artListing?.price,
      quantity: item.quantity,
    }));

    try {
      const response = await fetch('/api/payments/pesapal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartId: 'local',
          cartItems: formattedCartItems,
          shippingInfo: {
            name: shippingInfo.name,
            email: shippingInfo.email,
            phone: shippingInfo.phone || phoneNumber,
            address: shippingInfo.address,
            city: shippingInfo.city,
            country: shippingInfo.country,
          },
          paymentMethod: selectedMethod,
          shippingCost: totalUSD - subtotal - tax, // Send actual shipping cost
          tax: tax,
          totalAmount: totalUSD,
        }),
      });

      const data = await response.json();
      console.log('[Checkout] Payment response:', data);

      if (data.success) {
        if (data.data.isDevelopment) {
          // Development mode - simulate
          setStatus('success');
          toast.success('PesaPal payment simulated!');
          setTimeout(() => onSuccess(data.data.orderId, data.data.orderNumber), 1500);
        } else if (data.data.redirectUrl) {
          // Redirect to PesaPal
          setStatus('idle');
          window.location.href = data.data.redirectUrl;
        } else {
          setStatus('success');
          toast.success('Payment initiated!');
          setTimeout(() => onSuccess(data.data.orderId, data.data.orderNumber), 1500);
        }
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Payment failed');
        toast.error(data.error || 'Payment failed');
      }
    } catch (error) {
      console.error('[Checkout] Payment error:', error);
      setStatus('error');
      setErrorMessage('Failed to initiate payment. Please try again.');
      toast.error('Failed to initiate payment');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="pesapal-checkout-form">
      <div className="pesapal-info">
        <Building size={24} />
        <div>
          <h4>PesaPal Payment</h4>
          <p>Pay securely with M-Pesa, credit/debit card, or bank transfer.</p>
        </div>
      </div>

      <div className="payment-methods-grid">
        <button
          type="button"
          className={`method-card ${selectedMethod === 'mpesa' ? 'active' : ''}`}
          onClick={() => onMethodChange('mpesa')}
        >
          <div className="method-icon">
            <Smartphone size={28} />
          </div>
          <div className="method-label">
            <span className="method-name">M-Pesa</span>
            <span className="method-desc">Mobile money</span>
          </div>
          {selectedMethod === 'mpesa' && <Check size={20} className="check-badge" />}
        </button>

        <button
          type="button"
          className={`method-card ${selectedMethod === 'card' ? 'active' : ''}`}
          onClick={() => onMethodChange('card')}
        >
          <div className="method-icon">
            <CreditCard size={28} />
          </div>
          <div className="method-label">
            <span className="method-name">Card</span>
            <span className="method-desc">Visa, Mastercard</span>
          </div>
          {selectedMethod === 'card' && <Check size={20} className="check-badge" />}
        </button>

        <button
          type="button"
          className={`method-card ${selectedMethod === 'bank' ? 'active' : ''}`}
          onClick={() => onMethodChange('bank')}
        >
          <div className="method-icon">
            <Building size={28} />
          </div>
          <div className="method-label">
            <span className="method-name">Bank</span>
            <span className="method-desc">Direct transfer</span>
          </div>
          {selectedMethod === 'bank' && <Check size={20} className="check-badge" />}
        </button>
      </div>

      {selectedMethod === 'mpesa' && (
        <div className="form-group">
          <label htmlFor="pesapalPhone">Phone Number *</label>
          <input
            type="tel"
            id="pesapalPhone"
            value={phoneNumber}
            onChange={handlePhoneChange}
            onBlur={() => validatePhoneNumber(phoneNumber)}
            placeholder="254712345678"
            className={phoneError ? 'error' : ''}
          />
          <span className="input-hint">Enter your M-Pesa registered number (2547XXXXXXXX)</span>
          {phoneError && <span className="error-message">{phoneError}</span>}
        </div>
      )}

      {status === 'processing' && (
        <div className="payment-status processing">
          <Loader2 size={20} className="spin" />
          <span>Processing payment...</span>
        </div>
      )}

      {status === 'success' && (
        <div className="payment-status success">
          <Check size={20} />
          <span>Payment successful! Redirecting...</span>
        </div>
      )}

      {status === 'error' && (
        <div className="payment-status error">
          <span>{errorMessage || 'Payment failed. Please try again.'}</span>
          <button 
            type="button" 
            className="retry-btn"
            onClick={() => {
              setStatus('idle');
              setErrorMessage('');
            }}
          >
            Try Again
          </button>
        </div>
      )}

      <button
        type="button"
        className="pay-btn pesapal-pay-btn"
        onClick={handlePesaPalPayment}
        disabled={isProcessing || (selectedMethod === 'mpesa' && !phoneNumber)}
      >
        {isProcessing ? (
          <><Loader2 size={20} className="spin" />Processing...</>
        ) : selectedMethod === 'mpesa' ? (
          <><Lock size={20} />Pay KSh {totalKES.toLocaleString()} with PesaPal</>
        ) : (
          <><Lock size={20} />Pay ${totalUSD.toFixed(2)} with PesaPal</>
        )}
      </button>

      <div className="secure-badge">
        <Lock size={14} />
        <span>Secured by PesaPal - PCI Compliant</span>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [paymentMethod] = useState<PaymentMethod>('pesapal');
  const [selectedMethod, setSelectedMethod] = useState<'mpesa' | 'card' | 'bank'>('mpesa');
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    countryCode: 'US',
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number>(130);

  // Fetch exchange rate on component mount
  useEffect(() => {
    async function fetchExchangeRate() {
      try {
        const response = await fetch('/api/settings/exchange-rate');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.rate) {
            const rate = data.data.rate;
            USD_TO_KES_RATE = rate;
            setExchangeRate(rate);
            console.log('[Checkout] Exchange rate fetched:', rate);
          }
        }
      } catch (error) {
        console.error('Error fetching exchange rate:', error);
      }
    }
    fetchExchangeRate();
  }, []);

  // Calculate totals
  const shippingCost = selectedShipping ? selectedShipping.price : 25;
  const tax = subtotal * 0.08;
  const totalUSD = subtotal + shippingCost + tax;
  const totalKES = Math.round(totalUSD * exchangeRate);

  // Fetch shipping options when country changes
  const fetchShippingOptions = async (countryCode: string) => {
    if (!countryCode) return;

    setIsCalculatingShipping(true);
    try {
      const cartItems = items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: item.artListing?.price || 0,
      }));

      const response = await fetch('/api/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryCode,
          items: cartItems,
          subtotal,
        }),
      });
      const data = await response.json();

      if (data.success && data.data?.options) {
        const options: ShippingOption[] = data.data.options.map((opt: any, index: number) => ({
          id: opt.courier?.toLowerCase().replace(/\s+/g, '-') || `option-${index}`,
          courier: opt.courier || 'ArtAfrik Shipping',
          service: opt.service || 'standard',
          estimatedDays: {
            min: parseInt(opt.estimatedDays?.split('-')[0]) || 5,
            max: parseInt(opt.estimatedDays?.split('-')[1]) || 10,
          },
          price: opt.totalUSD || 0,
          currency: 'USD',
          isAvailable: true,
          features: ['Tracking included', 'Insurance included'],
        }));

        setShippingOptions(options);
        if (options.length > 0 && !selectedShipping) {
          setSelectedShipping(options[1] || options[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching shipping options:', error);
    } finally {
      setIsCalculatingShipping(false);
    }
  };

  // Calculate shipping when country changes
  useEffect(() => {
    if (shippingInfo.countryCode) {
      fetchShippingOptions(shippingInfo.countryCode);
    }
  }, [shippingInfo.countryCode, subtotal]);

  const handleSuccess = (orderId: string, orderNumber: string) => {
    clearCart();
    window.location.href = `/checkout/success?orderId=${orderId}&orderNumber=${orderNumber}&method=pesapal`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'country') {
      const countryCodes: Record<string, string> = {
        'kenya': 'KE', 'nairobi': 'KE',
        'united states': 'US', 'usa': 'US', 'america': 'US',
        'united kingdom': 'GB', 'uk': 'GB', 'britain': 'GB',
        'canada': 'CA', 'australia': 'AU', 'germany': 'DE',
        'france': 'FR', 'south africa': 'ZA', 'nigeria': 'NG',
        'uganda': 'UG', 'tanzania': 'TZ', 'rwanda': 'RW',
      };
      const code = countryCodes[value.toLowerCase()] || value.toUpperCase().slice(0, 2);
      setShippingInfo((prev) => ({ ...prev, [name]: value, countryCode: code }));
    } else {
      setShippingInfo((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  // Redirect if cart is empty (on client side)
  useEffect(() => {
    if (items.length === 0 && typeof window !== 'undefined') {
      router.push('/cart');
    }
  }, [items.length, router]);

  if (items.length === 0) {
    return (
      <MainLayout>
        <div className="checkout-page">
          <div className="loading-container">
            <Loader2 size={40} className="spin" />
            <p>Redirecting to cart...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Check if form is valid
  const isFormValid = shippingInfo.name && shippingInfo.email && 
    shippingInfo.address && shippingInfo.city && shippingInfo.country;

  return (
    <MainLayout>
      <div className="checkout-page">
        <div className="checkout-header">
          <Link href="/cart" className="back-link">
            <ArrowLeft size={20} />
            Back to Cart
          </Link>
          <h1>Checkout</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="checkout-layout">
            <div className="checkout-form-section">
              {/* Shipping Information */}
              <div className="form-section">
                <h2><Truck size={22} />Shipping Information</h2>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label htmlFor="name">Full Name *</label>
                    <input 
                      type="text" 
                      id="name" 
                      name="name" 
                      value={shippingInfo.name} 
                      onChange={handleInputChange} 
                      placeholder="Joshua Mwendwa" 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input 
                      type="email" 
                      id="email" 
                      name="email" 
                      value={shippingInfo.email} 
                      onChange={handleInputChange} 
                      placeholder="joshua@example.com" 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Phone</label>
                    <input 
                      type="tel" 
                      id="phone" 
                      name="phone" 
                      value={shippingInfo.phone} 
                      onChange={handleInputChange} 
                      placeholder="+1 234 567 8900" 
                    />
                  </div>
                  <div className="form-group full-width">
                    <label htmlFor="address">Address *</label>
                    <input 
                      type="text" 
                      id="address" 
                      name="address" 
                      value={shippingInfo.address} 
                      onChange={handleInputChange} 
                      placeholder="123 Main St" 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="city">City *</label>
                    <input 
                      type="text" 
                      id="city" 
                      name="city" 
                      value={shippingInfo.city} 
                      onChange={handleInputChange} 
                      placeholder="New York" 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="country">Country *</label>
                    <input 
                      type="text" 
                      id="country" 
                      name="country" 
                      value={shippingInfo.country} 
                      onChange={handleInputChange} 
                      placeholder="United States" 
                      required 
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Options */}
              <div className="form-section">
                <h2><Truck size={22} />Shipping Method</h2>
                {isCalculatingShipping ? (
                  <div className="loading-shipping">
                    <Loader2 size={24} className="spin" />
                    <span>Calculating shipping options...</span>
                  </div>
                ) : shippingOptions.length > 0 ? (
                  <div className="shipping-options">
                    {shippingOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={`shipping-option ${selectedShipping?.id === option.id ? 'selected' : ''}`}
                        onClick={() => setSelectedShipping(option)}
                      >
                        <div className="option-radio">
                          <div className="radio-circle">
                            {selectedShipping?.id === option.id && <div className="radio-dot" />}
                          </div>
                        </div>
                        <div className="option-details">
                          <div className="option-header">
                            <span className="option-courier">{option.courier}</span>
                            <span className="option-price">
                              {option.price === 0 ? 'FREE' : `$${option.price.toFixed(2)}`}
                            </span>
                          </div>
                          <div className="option-meta">
                            <span className="option-delivery">
                              <Clock size={14} />
                              {option.estimatedDays.min}-{option.estimatedDays.max} business days
                            </span>
                          </div>
                          <div className="option-features">
                            {option.features.map((feature, idx) => (
                              <span key={idx} className="feature-tag">{feature}</span>
                            ))}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="no-shipping">
                    <p>Enter your country above to see available shipping options</p>
                  </div>
                )}
              </div>

              {/* Payment Method Section - PesaPal Only */}
              <div className="form-section">
                <h2><CreditCard size={22} />Payment Method</h2>
                <div className="payment-method-notice">
                  <div className="notice-content">
                    <Building size={20} />
                    <div>
                      <strong>PesaPal</strong>
                      <p>Secure payment via M-Pesa, credit/debit card, or bank transfer</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Form */}
              <div className="form-section payment-form-section">
                <PesaPalCheckoutForm 
                  cartItems={items} 
                  shippingInfo={shippingInfo} 
                  onSuccess={handleSuccess}
                  selectedMethod={selectedMethod}
                  onMethodChange={setSelectedMethod}
                  shippingCost={shippingCost}
                  tax={tax}
                  totalUSD={totalUSD}
                  subtotal={subtotal}
                  exchangeRate={exchangeRate}
                />
              </div>
            </div>

            {/* Order Summary */}
            <div className="order-summary-section">
              <div className="summary-card">
                <h2>Order Summary</h2>
                <div className="summary-items">
                  {items.map((item) => {
                    const artwork = item.artListing;
                    if (!artwork) return null;
                    const imageUrl = artwork.images?.[0] || '/placeholder.jpg';
                    return (
                      <div key={item.id} className="summary-item">
                        <div className="item-image">
                          <Image src={imageUrl} alt={artwork.title} width={60} height={60} />
                          <span className="item-quantity">{item.quantity}</span>
                        </div>
                        <div className="item-info">
                          <p className="item-title">{artwork.title}</p>
                          <p className="item-price">${(artwork.price || 0).toFixed(2)}</p>
                        </div>
                        <p className="item-subtotal">${((artwork.price || 0) * item.quantity).toFixed(2)}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="summary-totals">
                  <div className="summary-row"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                  <div className="summary-row">
                    <span>Shipping</span>
                    <span>{shippingCost === 0 ? <span className="free">FREE</span> : `$${shippingCost.toFixed(2)}`}</span>
                  </div>
                  <div className="summary-row"><span>Tax</span><span>${tax.toFixed(2)}</span></div>
                  <div className="summary-divider"></div>
                  <div className="summary-row total">
                    <span>Total</span>
                    <span className="currency-display">
                      <span className="usd-price">${totalUSD.toFixed(2)}</span>
                      {selectedMethod === 'mpesa' && (
                        <span className="kes-price">/ KSh {totalKES.toLocaleString()}</span>
                      )}
                    </span>
                  </div>
                </div>
                <div className="secure-badge">
                  <Lock size={16} />Secure Checkout with PesaPal
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}

