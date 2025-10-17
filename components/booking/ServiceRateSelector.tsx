import React from 'react';
import { motion } from 'framer-motion';
import { RateType } from '@/utils/pricing/calculateBookingPrice';

interface ServiceRateSelectorProps {
    serviceName: string;
    rates: {
        hourly_rate?: number | null;
        daily_rate?: number | null;
        regional_rate?: number | null;
        overnight_rate?: number | null;
    };
    selectedRateType: RateType;
    onRateTypeChange: (rateType: RateType) => void;
    quantity?: number;
    days?: number;
    disabled?: boolean;
}

interface RateOption {
    value: RateType;
    label: string;
    price: number | null | undefined;
    priceLabel: string;
}

export default function ServiceRateSelector({ serviceName, rates, selectedRateType, onRateTypeChange, quantity = 1, days = 1, disabled = false }: ServiceRateSelectorProps) {
    // Build available rate options
    const rateOptions: RateOption[] = [
        {
            value: 'hourly' as RateType,
            label: 'Hourly Rate',
            price: rates.hourly_rate,
            priceLabel: '/hour',
        },
        {
            value: 'daily' as RateType,
            label: 'Daily Rate',
            price: rates.daily_rate,
            priceLabel: '/day',
        },
        {
            value: 'regional' as RateType,
            label: 'Regional Rate',
            price: rates.regional_rate,
            priceLabel: '/trip',
        },
        {
            value: 'overnight' as RateType,
            label: 'Overnight Rate',
            price: rates.overnight_rate,
            priceLabel: '/night',
        },
    ].filter((option) => option.price !== null && option.price !== undefined && option.price > 0);

    // If no rates available, show message
    if (rateOptions.length === 0) {
        return <div className="text-sm text-gray-500 dark:text-gray-400 italic">No rates configured for this service</div>;
    }

    // Calculate total for selected rate
    const selectedRate = rateOptions.find((opt) => opt.value === selectedRateType);
    const unitPrice = selectedRate?.price || 0;
    const totalCost = unitPrice * quantity * days;

    return (
        <div className="space-y-3">
            {/* Rate Type Selector */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rate Type</label>
                <div className="grid grid-cols-2 gap-2">
                    {rateOptions.map((option) => {
                        const isSelected = selectedRateType === option.value;
                        return (
                            <motion.button
                                key={option.value}
                                type="button"
                                whileHover={{ scale: disabled ? 1 : 1.02 }}
                                whileTap={{ scale: disabled ? 1 : 0.98 }}
                                onClick={() => !disabled && onRateTypeChange(option.value)}
                                disabled={disabled}
                                className={`
                                    relative p-3 rounded-lg border-2 transition-all duration-200 text-left
                                    ${
                                        isSelected
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-700'
                                    }
                                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                `}
                            >
                                {/* Selection Indicator */}
                                {isSelected && (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </motion.div>
                                )}

                                <div
                                    className={`
                                    text-sm font-medium mb-1
                                    ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}
                                `}
                                >
                                    {option.label}
                                </div>
                                <div
                                    className={`
                                    text-lg font-bold
                                    ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}
                                `}
                                >
                                    ₪{option.price?.toLocaleString()}
                                    <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1">{option.priceLabel}</span>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Calculation Summary */}
            {selectedRate && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3"
                >
                    <div className="flex items-center justify-between text-sm">
                        <div className="text-gray-600 dark:text-gray-400">
                            <span className="font-medium">{quantity}</span> ×<span className="font-medium ml-1">{days}</span> {days === 1 ? 'day' : 'days'} ×
                            <span className="font-medium ml-1">₪{unitPrice.toLocaleString()}</span>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Total</div>
                            <div className="text-xl font-bold text-green-600 dark:text-green-400">₪{totalCost.toLocaleString()}</div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
