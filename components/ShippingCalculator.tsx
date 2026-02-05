'use client';

import { useState, useEffect, useMemo } from 'react';
import { useShipping, useCartShipping } from '@/hooks/use-shipping';
import type { LocalShippingInfo, InternationalShippingInfo } from '@/hooks/use-shipping';
import { COUNTRY_ZONE_MAPPING, KENYA_MAJOR_CITIES } from '@/lib/shipping-config';
import type { CartItemWithWeight } from '@/lib/shipping-calculator';
import type { LocalShippingCalculationResult } from '@/lib/shipping-calculator';
import type { ShippingCalculationResult } from '@/lib/shipping-calculator';

interface ShippingCalculatorProps {
  cartItems?: CartItemWithWeight[];
  onShippingChange?: (shippingCost: number, isFree: boolean) => void;
  showOptions?: boolean;
}

export default function ShippingCalculator({ 
  cartItems, 
  onShippingChange,
  showOptions = true 
}: ShippingCalculatorProps) {
  const {
    countryCode,
    setCountryCode,
    city,
    setCity,
    localZone,
    setLocalZone,
    calculateForSubtotal,
    getOptionsForSubtotal,
    formatShipping,
    shippingInfo,
    isFreeShipping,
    estimatedDelivery,
    isLocal,
  } = useShipping({ defaultCountry: 'KE' });

  const subtotal = useMemo(() => {
    if (cartItems) {
      return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }
    return 0;
  }, [cartItems]);

  const shippingCalculation = useMemo(() => {
    return calculateForSubtotal(subtotal, cartItems);
  }, [subtotal, cartItems, calculateForSubtotal]);

  const shippingOptions = useMemo(() => {
    return getOptionsForSubtotal(subtotal, cartItems);
  }, [subtotal, cartItems, getOptionsForSubtotal]);

  useEffect(() => {
    if (onShippingChange) {
      if (isLocal && shippingCalculation) {
        const localCalc = shippingCalculation as LocalShippingCalculationResult;
        onShippingChange(localCalc.flatRate, localCalc.isFreeShipping);
      } else if (shippingCalculation) {
        const intlCalc = shippingCalculation as ShippingCalculationResult;
        onShippingChange(intlCalc.totalKES, intlCalc.isFreeShipping);
      }
    }
  }, [shippingCalculation, onShippingChange, isLocal]);

  const selectedCountry = useMemo(() => {
    return COUNTRY_ZONE_MAPPING.find(c => c.code === countryCode);
  }, [countryCode]);

  // Helper to get shipping cost display
  const getShippingCostDisplay = (): string => {
    if (!shippingCalculation) return 'N/A';
    
    if (isLocal) {
      const calc = shippingCalculation as LocalShippingCalculationResult;
      return `KES ${calc.flatRate.toLocaleString()}`;
    } else {
      const calc = shippingCalculation as ShippingCalculationResult;
      return calc.isFreeShipping ? 'FREE' : `$${calc.totalUSD.toFixed(2)}`;
    }
  };

  // Helper to get shipping info display
  const getShippingInfoDisplay = () => {
    if (!shippingInfo) return { delivery: '', courier: '', shippingCost: '', freeShipping: '' };
    
    if (isLocal) {
      const info = shippingInfo as LocalShippingInfo;
      return {
        delivery: estimatedDelivery,
        courier: info.courier,
        shippingCost: `KES ${info.flatRate.toLocaleString()}`,
        freeShipping: 'N/A',
      };
    } else {
      const info = shippingInfo as InternationalShippingInfo;
      return {
        delivery: estimatedDelivery,
        courier: info.courier,
        shippingCost: '',
        freeShipping: `$${info.freeShippingThreshold.toLocaleString()}+`,
      };
    }
  };

  const shippingInfoDisplay = getShippingInfoDisplay();

  return (
    <div className="shipping-calculator">
      <h3 className="text-lg font-semibold mb-4">Shipping Method</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Destination Country
        </label>
        <select
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value)}
          className="w-full p-2 border rounded-lg"
        >
          <option value="">Select Country</option>
          {COUNTRY_ZONE_MAPPING.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
      </div>

      {/* Local Zone Selector for Kenya */}
      {isLocal && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Location in Kenya
          </label>
          <select
            value={city || localZone}
            onChange={(e) => {
              const value = e.target.value;
              // Check if it's a city name
              if (KENYA_MAJOR_CITIES.some(c => c === value)) {
                setCity(value);
                setLocalZone('major_cities');
              } else if (value === 'nairobi') {
                setCity(value);
                setLocalZone('nairobi');
              } else {
                // It's a zone selector
                setCity('');
                setLocalZone(value);
              }
            }}
            className="w-full p-2 border rounded-lg"
          >
            <optgroup label="Nairobi">
              <option value="nairobi">Nairobi</option>
            </optgroup>
            <optgroup label="Major Cities">
              {KENYA_MAJOR_CITIES.map((cityName) => (
                <option key={cityName} value={cityName}>{cityName}</option>
              ))}
            </optgroup>
            <optgroup label="Other Areas">
              <option value="rural">Rural / Other Areas</option>
            </optgroup>
          </select>
        </div>
      )}

      {countryCode && (
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Estimated Delivery:</span>
            <span className="text-sm font-medium">{shippingInfoDisplay.delivery}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Carrier:</span>
            <span className="text-sm font-medium">{shippingInfoDisplay.courier}</span>
          </div>
          {isLocal ? (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Shipping Cost:</span>
              <span className="text-sm font-medium">{shippingInfoDisplay.shippingCost}</span>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Free Shipping:</span>
              <span className="text-sm font-medium">{shippingInfoDisplay.freeShipping}</span>
            </div>
          )}
        </div>
      )}

      {showOptions && shippingOptions.length > 0 && !isLocal && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Select Shipping Option
          </label>
          <div className="space-y-2">
            {(shippingOptions as ShippingCalculationResult[]).map((option, index) => (
              <label
                key={index}
                className={`flex items-center p-3 border rounded-lg cursor-pointer ${
                  option.isFreeShipping 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-primary'
                }`}
              >
                <input
                  type="radio"
                  name="shippingOption"
                  value={index}
                  defaultChecked={index === 1}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{option.courier}</span>
                    <span className={`font-bold ${
                      option.isFreeShipping ? 'text-green-600' : ''
                    }`}>
                      {formatShipping(option)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Delivery: {option.estimatedDays}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {!isFreeShipping && !isLocal && subtotal > 0 && (() => {
        const intlInfo = shippingInfo as InternationalShippingInfo;
        return intlInfo.freeShippingThreshold ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-700">
            Add ${(
              intlInfo.freeShippingThreshold - subtotal
            ).toLocaleString()} more for free shipping!
          </p>
          <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-600 h-2 rounded-full"
              style={{
                width: `${Math.min(100, (subtotal / intlInfo.freeShippingThreshold) * 100)}%`
              }}
            />
          </div>
        </div>
        ) : null;
      })()}

      <div className="border-t pt-4">
        <div className="flex justify-between items-center">
          <span className="font-medium">Shipping Cost:</span>
          <span className={`text-xl font-bold ${
            isFreeShipping ? 'text-green-600' : ''
          }`}>
            {getShippingCostDisplay()}
          </span>
        </div>
      </div>
    </div>
  );
}

export function CartShippingSummary({ 
  items, 
  countryCode 
}: {
  items: CartItemWithWeight[];
  countryCode: string;
}) {
  const { 
    totalWeight, 
    subtotal, 
    shippingOptions, 
    selectedOption, 
    total, 
    setSelectedService,
    city,
    setCity,
    localZone,
    setLocalZone,
    isLocal,
  } = useCartShipping(countryCode, items);

  const isKenya = countryCode.toUpperCase() === 'KE';

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="font-semibold mb-3">Shipping</h4>
      
      {/* Local Zone Selector for Kenya */}
      {isKenya && (
        <div className="mb-3">
          <label className="block text-sm font-medium mb-2">
            Location
          </label>
          <select
            value={city || localZone}
            onChange={(e) => {
              const value = e.target.value;
              if (KENYA_MAJOR_CITIES.some(c => c === value)) {
                setCity(value);
                setLocalZone('major_cities');
              } else if (value === 'nairobi') {
                setCity(value);
                setLocalZone('nairobi');
              } else {
                setCity('');
                setLocalZone(value);
              }
            }}
            className="w-full p-2 border rounded-lg text-sm"
          >
            <optgroup label="Nairobi">
              <option value="nairobi">Nairobi - KES 250</option>
            </optgroup>
            <optgroup label="Major Cities">
              {KENYA_MAJOR_CITIES.map((cityName) => (
                <option key={cityName} value={cityName}>{cityName} - KES 500</option>
              ))}
            </optgroup>
            <optgroup label="Other Areas">
              <option value="rural">Rural / Other - KES 800</option>
            </optgroup>
          </select>
        </div>
      )}
      
      {!isKenya && (
        <div className="mb-3 text-sm">
          <span className="text-gray-600">Weight: </span>
          <span className="font-medium">{totalWeight.toFixed(2)} kg</span>
        </div>
      )}

      <div className="space-y-2 mb-4">
        {(isKenya 
          ? (shippingOptions as LocalShippingCalculationResult[]) 
          : (shippingOptions as ShippingCalculationResult[])
        ).map((option: any, index: number) => (
          <label
            key={index}
            className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-white"
          >
            <div className="flex items-center">
              {!isKenya && (
                <input
                  type="radio"
                  name="cartShipping"
                  value={option.courier}
                  checked={selectedOption.courier === option.courier}
                  onChange={() => setSelectedService(
                    option.courier.includes('Economy') ? 'economy' : 
                    option.courier.includes('Priority') ? 'priority' : 'standard'
                  )}
                  className="mr-2"
                />
              )}
              <div>
                <div className="text-sm font-medium">{option.courier}</div>
                <div className="text-xs text-gray-500">{option.estimatedDays}</div>
              </div>
            </div>
            <div className="text-sm font-bold">
              {isKenya 
                ? `KES ${option.flatRate?.toLocaleString()}` 
                : option.isFreeShipping 
                  ? 'FREE' 
                  : `$${option.totalUSD?.toFixed(2)}`
              }
            </div>
          </label>
        ))}
      </div>

      <div className="border-t pt-3">
        <div className="flex justify-between items-center">
          <span className="text-sm">Shipping:</span>
          <span className={`font-bold ${total.isFreeShipping ? 'text-green-600' : ''}`}>
            {isKenya 
              ? `KES ${(selectedOption as LocalShippingCalculationResult).flatRate?.toLocaleString() || '0'}` 
              : total.isFreeShipping 
                ? 'FREE' 
                : `$${(selectedOption as ShippingCalculationResult).totalUSD?.toFixed(2)}`
            }
          </span>
        </div>
      </div>
    </div>
  );
}

