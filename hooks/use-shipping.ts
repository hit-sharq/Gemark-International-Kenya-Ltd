'use client';

import { useState, useMemo } from 'react';
import { 
  calculateShipping, 
  calculateTotalWeight,
  getShippingOptions,
  formatShippingCost,
  getShippingInfo,
  calculateLocalShipping,
  getLocalShippingOptions,
  formatLocalShippingCost,
  getLocalShippingInfo,
  type ShippingCalculationResult,
  type CartItemWithWeight,
  type LocalShippingCalculationResult
} from '@/lib/shipping-calculator';

interface UseShippingOptions {
  defaultCountry?: string;
  defaultWeight?: number;
}

export interface LocalShippingInfo {
  zone: string;
  courier: string;
  estimatedDelivery: string;
  flatRate: number;
  currency: string;
}

export interface InternationalShippingInfo {
  zone: string;
  courier: string;
  estimatedDelivery: string;
  freeShippingThreshold: number;
  currency: string;
}

export function useShipping(options: UseShippingOptions = {}) {
  const { defaultCountry = 'KE', defaultWeight = 0.5 } = options;
  
  const [countryCode, setCountryCode] = useState(defaultCountry);
  const [city, setCity] = useState('');
  const [localZone, setLocalZone] = useState<string>('rural');
  const [weight, setWeight] = useState(defaultWeight);
  const [selectedService, setSelectedService] = useState<string>('standard');
  
  const isLocal = countryCode.toUpperCase() === 'KE';
  
  // Local shipping calculation (zone-based)
  const localCalculation = useMemo(() => {
    if (!isLocal) return null;
    return calculateLocalShipping({
      countryCode,
      city: city || undefined,
      zone: localZone as any,
    });
  }, [countryCode, city, localZone, isLocal]);
  
  // International shipping calculation (weight-based)
  const internationalCalculation = useMemo(() => {
    if (isLocal) return null;
    return calculateShipping({
      weight,
      countryCode,
      subtotal: 0,
    });
  }, [weight, countryCode, isLocal]);
  
  const calculation = isLocal ? localCalculation : internationalCalculation;
  
  // Shipping options
  const shippingOptions = useMemo(() => {
    if (isLocal) {
      return getLocalShippingOptions(countryCode, city || undefined);
    }
    return getShippingOptions(countryCode, 0);
  }, [countryCode, city, isLocal]);
  
  const calculateForSubtotal = (subtotal: number, items?: CartItemWithWeight[]) => {
    if (isLocal) {
      return calculateLocalShipping({
        countryCode,
        city: city || undefined,
        zone: localZone as any,
      });
    }
    
    const totalWeight = items ? calculateTotalWeight(items, defaultWeight) : weight;
    
    return calculateShipping({
      weight: totalWeight,
      countryCode,
      subtotal,
    });
  };
  
  const getOptionsForSubtotal = (subtotal: number, items?: CartItemWithWeight[]) => {
    if (isLocal) {
      return getLocalShippingOptions(countryCode, city || undefined);
    }
    
    const totalWeight = items ? calculateTotalWeight(items, defaultWeight) : weight;
    
    return getShippingOptions(countryCode, subtotal).map(option => ({
      ...option,
      weight: totalWeight,
    }));
  };
  
  const shippingInfo = useMemo(() => {
    if (isLocal) {
      return getLocalShippingInfo(countryCode, city || undefined);
    }
    return getShippingInfo(countryCode);
  }, [countryCode, city, isLocal]) as LocalShippingInfo | InternationalShippingInfo;
  
  const formatShipping = (result: ShippingCalculationResult | LocalShippingCalculationResult) => {
    if (isLocal) {
      return formatLocalShippingCost(result as LocalShippingCalculationResult);
    }
    return formatShippingCost(result as ShippingCalculationResult);
  };
  
  return {
    countryCode,
    setCountryCode,
    city,
    setCity,
    localZone,
    setLocalZone,
    weight,
    setWeight,
    selectedService,
    setSelectedService,
    calculation,
    shippingOptions,
    calculateForSubtotal,
    getOptionsForSubtotal,
    formatShipping,
    shippingInfo,
    isFreeShipping: calculation?.isFreeShipping ?? false,
    estimatedDelivery: calculation?.estimatedDays ?? '',
    courier: calculation?.courier ?? '',
    isLocal,
  };
}

export function useCartShipping(countryCode: string, items: CartItemWithWeight[]) {
  const [selectedService, setSelectedService] = useState('standard');
  const [city, setCity] = useState('');
  const [localZone, setLocalZone] = useState<string>('rural');
  
  const isLocal = countryCode.toUpperCase() === 'KE';
  
  const totalWeight = useMemo(() => {
    return calculateTotalWeight(items, 0.5);
  }, [items]);
  
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [items]);
  
  const shippingOptions = useMemo(() => {
    if (isLocal) {
      return getLocalShippingOptions(countryCode, city || undefined);
    }
    return getShippingOptions(countryCode, subtotal).map(option => ({
      ...option,
      weight: totalWeight,
    }));
  }, [countryCode, subtotal, totalWeight, city, isLocal]);
  
  const selectedOption = useMemo(() => {
    if (isLocal) {
      return shippingOptions[0];
    }
    return shippingOptions.find(opt => opt.courier.includes(selectedService)) || shippingOptions[0];
  }, [shippingOptions, selectedService, isLocal]);
  
  const total = useMemo(() => {
    if (isLocal) {
      const localResult = selectedOption as LocalShippingCalculationResult;
      return {
        subtotal,
        shipping: localResult.flatRate,
        total: subtotal + localResult.flatRate,
        isFreeShipping: localResult.isFreeShipping,
        currency: 'KES',
      };
    }
    
    const intlResult = selectedOption as ShippingCalculationResult;
    return {
      subtotal,
      shipping: intlResult.totalKES,
      total: subtotal + intlResult.totalKES,
      isFreeShipping: intlResult.isFreeShipping,
      currency: 'USD',
    };
  }, [subtotal, selectedOption, isLocal]);
  
  return {
    totalWeight,
    subtotal,
    shippingOptions,
    selectedService,
    setSelectedService,
    selectedOption,
    total,
    city,
    setCity,
    localZone,
    setLocalZone,
    isLocal,
  };
}

