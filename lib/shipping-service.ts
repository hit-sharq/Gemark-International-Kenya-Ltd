// Shipping Service for ArtAfrik
// Internal shipping rate calculations and management

import { 
  ShippingZone, 
  SHIPPING_ZONES, 
  COUNTRY_ZONE_MAPPING,
  FREE_SHIPPING_THRESHOLDS,
  getShippingZone,
  getZoneInfo,
  type ShippingRate
} from '@/lib/shipping-config';
import type { 
  ShippingAddress,
  ShipmentItem,
  ShippingOption,
  ShippingQuote,
  ShippingRule,
  ShipmentCost
} from '@/types/shipping';

// Exchange rate (should come from config in production)
const USD_TO_KES = 150;

// ============================================
// Core Rate Calculations
// ============================================

export function calculateBaseRate(zone: ShippingZone, weight: number): number {
  const zoneInfo = SHIPPING_ZONES[zone];
  const baseWeight = 0.5; // First 0.5kg included
  const additionalWeight = Math.max(0, weight - baseWeight);
  
  return zoneInfo.baseRate + (additionalWeight * zoneInfo.ratePerKg);
}

export function calculateFuelSurcharge(baseCost: number, zone: ShippingZone): number {
  const surchargeRate = 0.15; // 15% fuel surcharge
  const isLocal = zone === 'local';
  
  if (isLocal) {
    return baseCost * surchargeRate;
  }
  return baseCost * surchargeRate; // USD amount, convert when needed
}

export function calculateInsurance(
  declaredValue: number, 
  zone: ShippingZone
): number {
  const insuranceRate = 0.02; // 2% of declared value
  const minInsurance = zone === 'local' ? 50 : 5 * USD_TO_KES; // Minimum insurance
  
  const insurance = Math.max(minInsurance, declaredValue * insuranceRate);
  
  // Cap insurance at 5% of declared value
  return Math.min(insurance, declaredValue * 0.05);
}

export function calculateHandlingFee(zone: ShippingZone): number {
  const fees: Record<ShippingZone, number> = {
    local: 50,         // KES
    zone_a: 5,         // USD
    zone_b: 7,         // USD
    zone_c: 7,         // USD
    zone_d: 8,         // USD
    zone_e: 10,        // USD
    zone_f: 10,        // USD
  };
  
  return fees[zone];
}

export function calculateTotalShippingCost(
  zone: ShippingZone,
  weight: number,
  declaredValue: number,
  isFreeShipping: boolean
): ShipmentCost {
  const baseRate = calculateBaseRate(zone, weight);
  const fuelSurcharge = calculateFuelSurcharge(baseRate, zone);
  const insurance = calculateInsurance(declaredValue, zone);
  const handlingFee = calculateHandlingFee(zone);
  
  const subtotal = baseRate + fuelSurcharge + insurance + handlingFee;
  const total = isFreeShipping ? 0 : subtotal;
  const currency = zone === 'local' ? 'KES' : 'USD';
  
  // Convert to KES for display if international
  const totalKES = currency === 'KES' ? total : total * USD_TO_KES;
  
  return {
    baseRate: currency === 'KES' ? baseRate : baseRate * USD_TO_KES,
    weightCharge: currency === 'KES' ? (baseRate - SHIPPING_ZONES[zone].baseRate) : (baseRate - SHIPPING_ZONES[zone].baseRate) * USD_TO_KES,
    fuelSurcharge: currency === 'KES' ? fuelSurcharge : fuelSurcharge * USD_TO_KES,
    insurance: currency === 'KES' ? insurance : insurance,
    handlingFee: currency === 'KES' ? handlingFee : handlingFee * USD_TO_KES,
    total: Math.round(totalKES),
    currency: 'KES',
  };
}

// ============================================
// Shipping Options
// ============================================

export function getAvailableCouriers(zone: ShippingZone): string[] {
  const couriers: Record<ShippingZone, string[]> = {
    local: ['G4S', 'Fastway', 'Private Courier'],
    zone_a: ['EMS', 'DHL'],
    zone_b: ['DHL', 'FedEx'],
    zone_c: ['DHL', 'FedEx', 'Aramex'],
    zone_d: ['DHL', 'FedEx', 'UPS'],
    zone_e: ['FedEx', 'UPS', 'DHL'],
    zone_f: ['DHL', 'FedEx'],
  };
  
  return couriers[zone];
}

export function getShippingOptionsForDestination(
  countryCode: string,
  subtotal: number = 0
): ShippingOption[] {
  const zone = getShippingZone(countryCode);
  const zoneInfo = getZoneInfo(zone);
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLDS[zone];
  
  const options: ShippingOption[] = [];
  
  // Economy option (for international)
  if (zone !== 'local') {
    options.push({
      id: 'economy',
      courier: 'EMS',
      service: 'ems_economy',
      zone,
      estimatedDays: {
        min: zoneInfo.estimatedDaysMax + 3,
        max: zoneInfo.estimatedDaysMax + 7,
      },
      price: 0, // Will be calculated
      currency: 'USD',
      isAvailable: true,
      features: ['Cost-effective', 'Tracking included'],
    });
  }
  
  // Standard option
  options.push({
    id: 'standard',
    courier: zoneInfo.courier,
    service: zone === 'local' ? 'local_courier' : 'dhl_express',
    zone,
    estimatedDays: {
      min: zoneInfo.estimatedDaysMin,
      max: zoneInfo.estimatedDaysMax,
    },
    price: 0,
    currency: zone === 'local' ? 'KES' : 'USD',
    isAvailable: true,
    features: ['Tracking included', 'Insurance included'],
  });
  
  // Express option (for international)
  if (zone !== 'local') {
    options.push({
      id: 'express',
      courier: 'DHL Express',
      service: 'dhl_express',
      zone,
      estimatedDays: {
        min: Math.max(1, zoneInfo.estimatedDaysMin - 1),
        max: Math.max(2, zoneInfo.estimatedDaysMax - 2),
      },
      price: 0,
      currency: 'USD',
      isAvailable: true,
      features: ['Fastest delivery', 'Full tracking', 'Insurance included', 'Door-to-door'],
    });
  }
  
  // Calculate prices for all options
  return options.map(option => {
    let multiplier = 1;
    
    if (option.id === 'economy') multiplier = 0.8;
    if (option.id === 'express') multiplier = 1.5;
    
    const baseCost = calculateBaseRate(zone, 1) * multiplier;
    const totalCost = isFreeShipping ? 0 : baseCost;
    
    return {
      ...option,
      price: option.currency === 'USD' 
        ? Math.round(totalCost * 100) / 100 
        : Math.round(totalCost * USD_TO_KES),
    };
  });
}

export function getShippingQuote(
  countryCode: string,
  subtotal: number = 0
): ShippingQuote {
  const zone = getShippingZone(countryCode);
  const country = COUNTRY_ZONE_MAPPING.find(c => c.code === countryCode.toUpperCase());
  
  return {
    zone,
    countryCode,
    countryName: country?.name || 'Unknown',
    options: getShippingOptionsForDestination(countryCode, subtotal),
    freeShippingThreshold: FREE_SHIPPING_THRESHOLDS[zone],
    currency: zone === 'local' ? 'KES' : 'USD',
  };
}

// ============================================
// Weight Calculations
// ============================================

export function calculateTotalWeight(
  items: ShipmentItem[],
  defaultWeight: number = 0.5
): number {
  return items.reduce((total, item) => {
    return total + ((item.weight || defaultWeight) * item.quantity);
  }, 0);
}

export function calculateVolumetricWeight(
  dimensions: { length: number; width: number; height: number }
): number {
  // Standard volumetric weight formula (cm / 5000)
  const volume = dimensions.length * dimensions.width * dimensions.height;
  return volume / 5000;
}

export function getBillableWeight(
  actualWeight: number,
  dimensions?: { length: number; width: number; height: number }
): number {
  if (!dimensions) return actualWeight;
  
  const volumetricWeight = calculateVolumetricWeight(dimensions);
  return Math.max(actualWeight, volumetricWeight);
}

// ============================================
// Free Shipping Checks
// ============================================

export function isEligibleForFreeShipping(
  subtotal: number,
  zone: ShippingZone
): boolean {
  return subtotal >= FREE_SHIPPING_THRESHOLDS[zone];
}

export function getAmountNeededForFreeShipping(
  subtotal: number,
  zone: ShippingZone
): number {
  const threshold = FREE_SHIPPING_THRESHOLDS[zone];
  return Math.max(0, threshold - subtotal);
}

// ============================================
// Zone Utilities
// ============================================

export function getZoneName(zone: ShippingZone): string {
  const names: Record<ShippingZone, string> = {
    local: 'Kenya (Local)',
    zone_a: 'East Africa',
    zone_b: 'Rest of Africa',
    zone_c: 'Asia & Middle East',
    zone_d: 'Europe',
    zone_e: 'Americas',
    zone_f: 'Oceania',
  };
  
  return names[zone];
}

export function getCountriesInZone(zone: ShippingZone): string[] {
  return COUNTRY_ZONE_MAPPING
    .filter(c => c.zone === zone)
    .map(c => c.code);
}

export function getZoneByCountry(countryCode: string): ShippingZone {
  return getShippingZone(countryCode);
}

// ============================================
// Delivery Estimates
// ============================================

export function getEstimatedDeliveryDate(
  zone: ShippingZone,
  serviceType: 'standard' | 'express' | 'economy' = 'standard'
): Date {
  const zoneInfo = getZoneInfo(zone);
  let daysToAdd = zoneInfo.estimatedDaysMax;
  
  if (serviceType === 'express') {
    daysToAdd = Math.max(2, zoneInfo.estimatedDaysMax - 2);
  } else if (serviceType === 'economy') {
    daysToAdd = zoneInfo.estimatedDaysMax + 5;
  }
  
  // Add buffer for processing
  daysToAdd += 1;
  
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + daysToAdd);
  
  return estimatedDate;
}

export function formatDeliveryEstimate(
  zone: ShippingZone,
  serviceType: 'standard' | 'express' | 'economy' = 'standard'
): string {
  const zoneInfo = getZoneInfo(zone);
  let minDays = zoneInfo.estimatedDaysMin;
  let maxDays = zoneInfo.estimatedDaysMax;
  
  if (serviceType === 'express') {
    minDays = Math.max(1, zoneInfo.estimatedDaysMin - 1);
    maxDays = Math.max(2, zoneInfo.estimatedDaysMax - 2);
  } else if (serviceType === 'economy') {
    minDays = zoneInfo.estimatedDaysMax + 2;
    maxDays = zoneInfo.estimatedDaysMax + 7;
  }
  
  return `${minDays}-${maxDays} business days`;
}

// ============================================
// Shipping Rules Engine
// ============================================

export function applyShippingRules(
  subtotal: number,
  zone: ShippingZone,
  weight: number,
  rules: ShippingRule[]
): { discount: number; freeShipping: boolean } {
  let discount = 0;
  let freeShipping = false;
  
  // Sort rules by priority
  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);
  
  for (const rule of sortedRules) {
    if (!rule.isActive) continue;
    
    const conditions = rule.conditions;
    
    // Check conditions
    const meetsMinSubtotal = !conditions.minSubtotal || subtotal >= conditions.minSubtotal;
    const meetsMaxSubtotal = !conditions.maxSubtotal || subtotal <= conditions.maxSubtotal;
    const meetsMinWeight = !conditions.minWeight || weight >= conditions.minWeight;
    const meetsMaxWeight = !conditions.maxWeight || weight <= conditions.maxWeight;
    const meetsZone = !conditions.zones || conditions.zones.includes(zone);
    
    if (meetsMinSubtotal && meetsMaxSubtotal && meetsMinWeight && meetsMaxWeight && meetsZone) {
      // Apply action
      if (rule.action.type === 'free') {
        freeShipping = true;
      } else if (rule.action.type === 'discount') {
        discount = rule.action.value;
      } else if (rule.action.type === 'fixed') {
        discount = rule.action.value;
      }
      
      // Only apply first matching rule
      break;
    }
  }
  
  return { discount, freeShipping };
}

// ============================================
// Validation
// ============================================

export function isValidShippingDestination(countryCode: string): boolean {
  const zone = getShippingZone(countryCode);
  return zone !== undefined;
}

export function validateAddress(address: ShippingAddress): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!address.firstName?.trim()) errors.push('First name is required');
  if (!address.lastName?.trim()) errors.push('Last name is required');
  if (!address.addressLine1?.trim()) errors.push('Address line 1 is required');
  if (!address.city?.trim()) errors.push('City is required');
  if (!address.countryCode?.trim()) errors.push('Country is required');
  if (!address.phone?.trim()) errors.push('Phone is required');
  
  // Validate email if provided
  if (address.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(address.email)) {
      errors.push('Invalid email address');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

