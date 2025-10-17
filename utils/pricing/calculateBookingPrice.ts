/**
 * Booking Price Calculation Utility
 * 
 * This module provides functions to calculate booking prices based on:
 * - Destination pricing (per student and per crew)
 * - Selected services with their rates, quantities, and days
 * - Sub-services for entertainment and education programs
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface DestinationPricing {
    student: number;
    crew: number;
}

export type ServiceType = 
    | 'guides' 
    | 'paramedics' 
    | 'security_companies' 
    | 'external_entertainment_companies' 
    | 'travel_companies' 
    | 'education_programs';

export type RateType = 'hourly' | 'daily' | 'regional' | 'overnight' | 'fixed';

export interface SubService {
    id: string;
    label: string;
    price: number;
}

export interface ServiceSelection {
    id: string;
    name: string;
    type: ServiceType;
    quantity: number;
    days: number;
    unitPrice: number;
    rateType: RateType;
    subServices?: SubService[];  // For entertainment/education programs
}

export interface PriceBreakdown {
    studentsCost: number;
    crewCost: number;
    servicesCosts: ServiceCost[];
}

export interface ServiceCost {
    serviceId: string;
    serviceName: string;
    serviceType: ServiceType;
    quantity: number;
    days: number;
    unitPrice: number;
    rateType: RateType;
    baseServiceCost: number;
    subServicesCost: number;
    totalCost: number;
}

export interface BookingPriceCalculation {
    destinationBase: number;
    servicesTotal: number;
    totalPrice: number;
    breakdown: PriceBreakdown;
}

// ============================================================================
// MAIN CALCULATION FUNCTION
// ============================================================================

/**
 * Calculate the total price for a booking
 * 
 * @param destinationPricing - Pricing structure from destination (student/crew prices)
 * @param numberOfStudents - Total number of students
 * @param numberOfCrew - Total number of crew members
 * @param selectedServices - Array of selected services with their details
 * @returns Complete price calculation with breakdown
 * 
 * @example
 * ```typescript
 * const result = calculateBookingPrice(
 *   { student: 50, crew: 100 },
 *   40, // students
 *   3,  // crew
 *   [
 *     {
 *       id: 'guide-1',
 *       name: 'John Doe',
 *       type: 'guides',
 *       quantity: 2,
 *       days: 2,
 *       unitPrice: 200,
 *       rateType: 'daily'
 *     }
 *   ]
 * );
 * // Result: { totalPrice: 3100, ... }
 * ```
 */
export function calculateBookingPrice(
    destinationPricing: DestinationPricing | null,
    numberOfStudents: number,
    numberOfCrew: number,
    selectedServices: ServiceSelection[]
): BookingPriceCalculation {
    // Calculate destination base price
    const studentsCost = destinationPricing 
        ? (destinationPricing.student || 0) * (numberOfStudents || 0)
        : 0;
    
    const crewCost = destinationPricing 
        ? (destinationPricing.crew || 0) * (numberOfCrew || 0)
        : 0;
    
    const destinationBase = studentsCost + crewCost;

    // Calculate services costs
    const servicesCosts: ServiceCost[] = selectedServices.map(service => {
        // Base service cost calculation
        const baseServiceCost = (service.unitPrice || 0) * 
                               (service.quantity || 0) * 
                               (service.days || 1);
        
        // Sub-services cost (for entertainment and education programs)
        const subServicesCost = service.subServices 
            ? service.subServices.reduce((sum, sub) => sum + (sub.price || 0), 0)
            : 0;

        // Total cost for this service line
        const totalCost = baseServiceCost + subServicesCost;

        return {
            serviceId: service.id,
            serviceName: service.name,
            serviceType: service.type,
            quantity: service.quantity,
            days: service.days,
            unitPrice: service.unitPrice,
            rateType: service.rateType,
            baseServiceCost,
            subServicesCost,
            totalCost
        };
    });

    // Calculate total services cost
    const servicesTotal = servicesCosts.reduce((sum, service) => sum + service.totalCost, 0);

    // Return complete calculation
    return {
        destinationBase,
        servicesTotal,
        totalPrice: destinationBase + servicesTotal,
        breakdown: {
            studentsCost,
            crewCost,
            servicesCosts
        }
    };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate the cost for a single service line
 * 
 * @param unitPrice - Price per unit (hourly/daily/regional/overnight rate)
 * @param quantity - Number of service providers
 * @param days - Number of days
 * @param subServices - Optional sub-services to include
 * @returns Total cost for the service line
 */
export function calculateServiceLineCost(
    unitPrice: number,
    quantity: number,
    days: number,
    subServices?: SubService[]
): number {
    const baseServiceCost = (unitPrice || 0) * (quantity || 0) * (days || 1);
    const subServicesCost = subServices 
        ? subServices.reduce((sum, sub) => sum + (sub.price || 0), 0)
        : 0;
    
    return baseServiceCost + subServicesCost;
}

/**
 * Get the appropriate rate from a service based on rate type
 * 
 * @param service - Service object with rate fields
 * @param rateType - Type of rate to retrieve
 * @returns The rate value or 0 if not available
 */
export function getServiceRate(
    service: {
        hourly_rate?: number;
        daily_rate?: number;
        regional_rate?: number;
        overnight_rate?: number;
        price?: number; // For fixed price services
        pricing_data?: { default_price?: number }; // For travel companies
    },
    rateType: RateType
): number {
    switch (rateType) {
        case 'hourly':
            return service.hourly_rate || 0;
        case 'daily':
            return service.daily_rate || 0;
        case 'regional':
            return service.regional_rate || 0;
        case 'overnight':
            return service.overnight_rate || 0;
        case 'fixed':
            return service.price || service.pricing_data?.default_price || 0;
        default:
            return service.daily_rate || 0; // Default to daily rate
    }
}

/**
 * Format price for display with currency symbol
 * 
 * @param price - Price value to format
 * @param currency - Currency symbol (default: ₪)
 * @returns Formatted price string
 */
export function formatPrice(price: number, currency: string = '₪'): string {
    return `${currency}${price.toLocaleString('en-US', { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 2 
    })}`;
}

/**
 * Validate pricing inputs
 * 
 * @param numberOfStudents - Number of students
 * @param numberOfCrew - Number of crew
 * @param selectedServices - Array of selected services
 * @returns Validation result with errors if any
 */
export function validatePricingInputs(
    numberOfStudents: number,
    numberOfCrew: number,
    selectedServices: ServiceSelection[]
): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (numberOfStudents < 0) {
        errors.push('Number of students cannot be negative');
    }

    if (numberOfCrew < 0) {
        errors.push('Number of crew cannot be negative');
    }

    selectedServices.forEach((service, index) => {
        if (service.quantity <= 0) {
            errors.push(`Service "${service.name}" must have quantity greater than 0`);
        }
        if (service.days <= 0) {
            errors.push(`Service "${service.name}" must have days greater than 0`);
        }
        if (service.unitPrice < 0) {
            errors.push(`Service "${service.name}" has invalid unit price`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Check if a service has sub-services available
 * 
 * @param serviceType - Type of service
 * @returns True if service type supports sub-services
 */
export function hasSubServices(serviceType: ServiceType): boolean {
    return serviceType === 'external_entertainment_companies' || 
           serviceType === 'education_programs';
}

/**
 * Get display label for rate type
 * 
 * @param rateType - Rate type
 * @returns Human-readable label
 */
export function getRateTypeLabel(rateType: RateType): string {
    const labels: Record<RateType, string> = {
        hourly: 'Hourly Rate',
        daily: 'Daily Rate',
        regional: 'Regional Rate',
        overnight: 'Overnight Rate',
        fixed: 'Fixed Price'
    };
    return labels[rateType] || 'Daily Rate';
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
    calculateBookingPrice,
    calculateServiceLineCost,
    getServiceRate,
    formatPrice,
    validatePricingInputs,
    hasSubServices,
    getRateTypeLabel
};
