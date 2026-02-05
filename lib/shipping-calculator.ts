// Shipping Calculator Utility for ArtAfrik
// All prices in USD
import { 
  ShippingZone, 
  SHIPPING_ZONES, 
  getShippingZone, 
  getZoneInfo,
  FREE_SHIPPING_THRESHOLDS,
  LocalZone,
  LOCAL_SHIPPING_ZONES,
  getLocalZoneInfo,
  getLocalZoneFromCity,
} from './shipping-config';

// ===========================================
// Helper Functions for Shipment Service
// ===========================================

/**
 * Get estimated delivery date based on zone
 */
export function getEstimatedDeliveryDate(zone: string): Date {
  const today = new Date();
  let daysToAdd: number;

  switch (zone.toLowerCase()) {
    case 'local':
      daysToAdd = 3;
      break;
    case 'zone_a': // East Africa
      daysToAdd = 7;
      break;
    case 'zone_b': // Rest of Africa
      daysToAdd = 10;
      break;
    case 'zone_c': // Asia & Middle East
      daysToAdd = 10;
      break;
    case 'zone_d': // Europe
      daysToAdd = 12;
      break;
    case 'zone_e': // Americas
      daysToAdd = 14;
      break;
    case 'zone_f': // Oceania
      daysToAdd = 14;
      break;
    default:
      daysToAdd = 14;
  }

  const deliveryDate = new Date(today);
  deliveryDate.setDate(deliveryDate.getDate() + daysToAdd);
  return deliveryDate;
}

/**
 * Get shipping zone by country code
 */
export function getZoneByCountry(countryCode: string): string {
  return getShippingZone(countryCode);
}

export interface ShippingCalculationParams {
  weight: number;
  countryCode: string;
  subtotal: number;
}

export interface ShippingCalculationResult {
  zone: ShippingZone;
  baseRate: number;
  weightCharge: number;
  fuelSurcharge: number;
  insurance: number;
  totalUSD: number;
  totalKES: number;
  currency: string;
  estimatedDays: string;
  courier: string;
  isFreeShipping: boolean;
  savings?: number;
}

export interface CartItemWithWeight {
  id: string;
  weight?: number;
  quantity: number;
  price: number;
}

export function calculateTotalWeight(
  items: CartItemWithWeight[], 
  defaultWeight: number = 0.5
): number {
  return items.reduce((total, item) => {
    return total + ((item.weight || defaultWeight) * item.quantity);
  }, 0);
}

export function calculateShipping(
  params: ShippingCalculationParams
): ShippingCalculationResult {
  const { weight, countryCode, subtotal } = params;
  const zone = getShippingZone(countryCode);
  const zoneInfo = getZoneInfo(zone);
  
  const freeShippingThreshold = FREE_SHIPPING_THRESHOLDS[zone];
  const isFreeShipping = subtotal >= freeShippingThreshold;
  
  const baseWeight = 0.5;
  const additionalWeight = Math.max(0, weight - baseWeight);
  
  const baseRate = zoneInfo.baseRate;
  const weightCharge = additionalWeight * zoneInfo.ratePerKg;
  
  // All calculations in USD
  let totalUSD = baseRate + weightCharge;
  
  // Fuel surcharge (20% for all zones)
  const fuelSurcharge = totalUSD * 0.20;
  
  // Insurance (1% with minimum based on zone)
  const insuranceMin = zone === 'local' ? 5 : 10;
  const insurance = Math.max(insuranceMin, subtotal * 0.01);
  
  const subtotalWithExtras = totalUSD + fuelSurcharge + insurance;
  
  totalUSD = isFreeShipping ? 0 : subtotalWithExtras;
  
  const savings = isFreeShipping ? subtotalWithExtras : 0;
  
  return {
    zone,
    baseRate,
    weightCharge,
    fuelSurcharge,
    insurance,
    totalUSD: Math.round(totalUSD * 100) / 100,
    totalKES: 0, // Not used anymore
    currency: 'USD',
    estimatedDays: `${zoneInfo.estimatedDaysMin}-${zoneInfo.estimatedDaysMax} days`,
    courier: zoneInfo.courier,
    isFreeShipping,
    savings: savings > 0 ? Math.round(savings) : undefined,
  };
}

export function getShippingOptions(
  countryCode: string,
  subtotal: number
): ShippingCalculationResult[] {
  const zone = getShippingZone(countryCode);
  const zoneInfo = getZoneInfo(zone);
  
  const options: ShippingCalculationResult[] = [];
  
  // Economy option (for international)
  if (zone !== 'local') {
    const economyResult = calculateShipping({
      weight: 1,
      countryCode,
      subtotal,
    });
    
    options.push({
      ...economyResult,
      courier: 'EMS (Economy)',
      estimatedDays: `${zoneInfo.estimatedDaysMax + 3}-${zoneInfo.estimatedDaysMax + 7} days`,
      totalUSD: Math.round((economyResult.totalUSD * 0.8) * 100) / 100,
    });
  }
  
  // Standard option
  options.push(calculateShipping({
    weight: 1,
    countryCode,
    subtotal,
  }));
  
  // Express option (for international)
  if (zone !== 'local') {
    const expressResult = calculateShipping({
      weight: 1,
      countryCode,
      subtotal,
    });
    
    options.push({
      ...expressResult,
      courier: 'DHL Express (Priority)',
      estimatedDays: `${Math.max(1, zoneInfo.estimatedDaysMin - 1)}-${Math.max(2, zoneInfo.estimatedDaysMax - 2)} days`,
      totalUSD: Math.round((expressResult.totalUSD * 1.5) * 100) / 100,
    });
  }
  
  return options;
}

export function formatShippingCost(result: ShippingCalculationResult): string {
  if (result.isFreeShipping) {
    return 'FREE';
  }
  
  return `$${result.totalUSD.toFixed(2)}`;
}

export function getShippingInfo(countryCode: string) {
  const zone = getShippingZone(countryCode);
  const zoneInfo = getZoneInfo(zone);
  
  return {
    zone,
    courier: zoneInfo.courier,
    estimatedDelivery: `${zoneInfo.estimatedDaysMin}-${zoneInfo.estimatedDaysMax} business days`,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLDS[zone],
    currency: 'USD',
  };
}

export function isValidShippingDestination(countryCode: string): boolean {
  const zone = getShippingZone(countryCode);
  return zone !== undefined;
}

// ===========================================
// LOCAL ZONE-BASED SHIPPING (KENYA)
// ===========================================

export interface LocalShippingCalculationResult {
  zone: LocalZone;
  flatRate: number;
  currency: string;
  estimatedDays: string;
  courier: string;
  isFreeShipping: boolean;
}

export interface LocalShippingParams {
  countryCode: string;
  city?: string;
  zone?: LocalZone;
}

export function calculateLocalShipping(
  params: LocalShippingParams
): LocalShippingCalculationResult {
  const { countryCode, city, zone: explicitZone } = params;
  
  // Determine the local zone
  let localZone: LocalZone;
  if (explicitZone) {
    localZone = explicitZone;
  } else if (city) {
    localZone = getLocalZoneFromCity(city);
  } else {
    localZone = 'rural'; // Default to rural if no city specified
  }
  
  const zoneInfo = getLocalZoneInfo(localZone);
  
  return {
    zone: localZone,
    flatRate: zoneInfo.flatRate,
    currency: zoneInfo.currency,
    estimatedDays: `${zoneInfo.estimatedDaysMin}-${zoneInfo.estimatedDaysMax} days`,
    courier: zoneInfo.courier,
    isFreeShipping: false, // No free shipping for local
  };
}

export function getLocalShippingOptions(
  countryCode: string,
  city?: string
): LocalShippingCalculationResult[] {
  // For local shipping, we only have one flat rate per zone
  const result = calculateLocalShipping({ countryCode, city });
  
  return [result];
}

export function formatLocalShippingCost(result: LocalShippingCalculationResult): string {
  return `${result.currency} ${result.flatRate.toLocaleString()}`;
}

export function getLocalShippingInfo(countryCode: string, city?: string) {
  const result = calculateLocalShipping({ countryCode, city });
  const zoneInfo = getLocalZoneInfo(result.zone);
  
  return {
    zone: result.zone,
    courier: zoneInfo.courier,
    estimatedDelivery: `${zoneInfo.estimatedDaysMin}-${zoneInfo.estimatedDaysMax} business days`,
    flatRate: zoneInfo.flatRate,
    currency: zoneInfo.currency,
  };
}


