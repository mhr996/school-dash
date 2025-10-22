# Price Calculation Utilities - Quick Start Guide

## 🎯 Overview

The pricing system consists of two main components:

1. **`calculateBookingPrice`** - Core calculation utility
2. **`ServiceRateSelector`** - UI component for rate type selection

---

## 📦 Installation

No installation needed - files are already in the project:

- `utils/pricing/calculateBookingPrice.ts` - Calculation logic
- `utils/pricing/index.ts` - Export module
- `components/booking/ServiceRateSelector.tsx` - UI component

---

## 🚀 Quick Start

### 1. Import the utilities

```typescript
import { calculateBookingPrice, type ServiceSelection, type DestinationPricing } from '@/utils/pricing';
```

### 2. Prepare your data

```typescript
// Destination pricing (from database)
const destinationPricing: DestinationPricing = {
    student: 50,
    crew: 100,
};

// Trip details
const numberOfStudents = 40;
const numberOfCrew = 3;

// Selected services
const selectedServices: ServiceSelection[] = [
    {
        id: 'guide-1',
        name: 'John Doe',
        type: 'guides',
        quantity: 2,
        days: 2,
        unitPrice: 200, // daily rate
        rateType: 'daily',
        subServices: [], // Empty for guides
    },
    {
        id: 'paramedic-1',
        name: 'Jane Smith',
        type: 'paramedics',
        quantity: 1,
        days: 2,
        unitPrice: 250,
        rateType: 'daily',
        subServices: [],
    },
];
```

### 3. Calculate the price

```typescript
const result = calculateBookingPrice(destinationPricing, numberOfStudents, numberOfCrew, selectedServices);

console.log(result);
// Output:
// {
//   destinationBase: 2300,  // (50 × 40) + (100 × 3)
//   servicesTotal: 1300,    // (200 × 2 × 2) + (250 × 1 × 2)
//   totalPrice: 3600,
//   breakdown: { ... }
// }
```

---

## 🎨 Using the ServiceRateSelector Component

```tsx
import ServiceRateSelector from '@/components/booking/ServiceRateSelector';

function MyBookingForm() {
    const [selectedRateType, setSelectedRateType] = useState<RateType>('daily');

    const guide = {
        name: 'John Doe',
        hourly_rate: 50,
        daily_rate: 200,
        regional_rate: 300,
        overnight_rate: 400,
    };

    return (
        <ServiceRateSelector
            serviceName={guide.name}
            rates={{
                hourly_rate: guide.hourly_rate,
                daily_rate: guide.daily_rate,
                regional_rate: guide.regional_rate,
                overnight_rate: guide.overnight_rate,
            }}
            selectedRateType={selectedRateType}
            onRateTypeChange={setSelectedRateType}
            quantity={2}
            days={3}
        />
    );
}
```

---

## 💡 Common Use Cases

### Use Case 1: Calculate destination base only

```typescript
const result = calculateBookingPrice(
    { student: 50, crew: 100 },
    40, // students
    3, // crew
    [], // no services
);
// result.totalPrice = 2300
```

### Use Case 2: Service-only booking (no destination)

```typescript
const result = calculateBookingPrice(
    null, // no destination
    0,
    0,
    [
        {
            id: 'guide-1',
            name: 'John Doe',
            type: 'guides',
            quantity: 3,
            days: 1,
            unitPrice: 200,
            rateType: 'daily',
        },
    ],
);
// result.totalPrice = 600 (3 guides × 1 day × 200)
```

### Use Case 3: Entertainment with sub-services

```typescript
const result = calculateBookingPrice({ student: 30, crew: 80 }, 25, 2, [
    {
        id: 'ent-1',
        name: 'Magic Show Company',
        type: 'external_entertainment_companies',
        quantity: 1,
        days: 1,
        unitPrice: 500, // base price
        rateType: 'fixed',
        subServices: [
            { id: 'sub-1', label: 'Sound System', price: 150 },
            { id: 'sub-2', label: 'Lighting', price: 100 },
        ],
    },
]);
// Entertainment total: 500 + 150 + 100 = 750
// Destination: (30 × 25) + (80 × 2) = 910
// Total: 1660
```

---

## 🔧 Helper Functions

### Format Price for Display

```typescript
import { formatPrice } from '@/utils/pricing';

const price = 1234.56;
console.log(formatPrice(price));
// Output: "₪1,234.56"

console.log(formatPrice(price, '$'));
// Output: "$1,234.56"
```

### Validate Inputs

```typescript
import { validatePricingInputs } from '@/utils/pricing';

const validation = validatePricingInputs(numberOfStudents, numberOfCrew, selectedServices);

if (!validation.isValid) {
    console.error('Errors:', validation.errors);
}
```

### Get Service Rate

```typescript
import { getServiceRate } from '@/utils/pricing';

const guide = {
    hourly_rate: 50,
    daily_rate: 200,
    regional_rate: 300,
};

const rate = getServiceRate(guide, 'daily');
// Returns: 200
```

### Check if Service Has Sub-Services

```typescript
import { hasSubServices } from '@/utils/pricing';

const canHaveSubServices = hasSubServices('external_entertainment_companies');
// Returns: true

const canHaveSubServices2 = hasSubServices('guides');
// Returns: false
```

---

## 📊 Understanding the Breakdown

The `calculateBookingPrice` function returns a detailed breakdown:

```typescript
interface BookingPriceCalculation {
    destinationBase: number; // Total destination cost
    servicesTotal: number; // Total services cost
    totalPrice: number; // Grand total
    breakdown: {
        studentsCost: number; // Student portion
        crewCost: number; // Crew portion
        servicesCosts: ServiceCost[]; // Detailed service costs
    };
}

interface ServiceCost {
    serviceId: string;
    serviceName: string;
    serviceType: ServiceType;
    quantity: number;
    days: number;
    unitPrice: number;
    rateType: RateType;
    baseServiceCost: number; // quantity × days × unitPrice
    subServicesCost: number; // Sum of sub-services
    totalCost: number; // base + sub-services
}
```

---

## ⚠️ Important Notes

### Rate Type Priority

When using `ServiceRateSelector`, the component automatically:

1. **Filters out** rates that are `null`, `undefined`, or `0`
2. **Defaults to daily rate** if available
3. **Shows "No rates configured"** if no valid rates exist

### Service Types

Valid service types:

- `'guides'` - Tour guides
- `'paramedics'` - Medical staff
- `'security_companies'` - Security personnel
- `'external_entertainment_companies'` - Entertainment (supports sub-services)
- `'travel_companies'` - Transportation
- `'education_programs'` - Educational services (supports sub-services)

### Sub-Services

Only these service types support sub-services:

- `external_entertainment_companies`
- `education_programs`

For other services, pass empty array or omit `subServices` property.

---

## 🧪 Testing

### Test Calculation

```typescript
import { calculateBookingPrice } from '@/utils/pricing';

// Test basic calculation
const testResult = calculateBookingPrice({ student: 50, crew: 100 }, 40, 3, [
    {
        id: 'test-1',
        name: 'Test Service',
        type: 'guides',
        quantity: 2,
        days: 2,
        unitPrice: 200,
        rateType: 'daily',
    },
]);

console.assert(testResult.destinationBase === 2300, 'Destination base should be 2300');
console.assert(testResult.servicesTotal === 800, 'Services total should be 800');
console.assert(testResult.totalPrice === 3100, 'Total should be 3100');
```

---

## 🎯 Next Steps

1. **Integrate into Booking Form** - See `BOOKING_PRICING_IMPLEMENTATION.md`
2. **Add Real-time Updates** - Call `calculateBookingPrice` on every change
3. **Display Price Breakdown** - Show users how price is calculated
4. **Save to Database** - Store `totalPrice` and individual `booked_price` values

---

## 📚 Reference

- **Full Documentation**: `BOOKING_PRICING_STRUCTURE.md`
- **Implementation Guide**: `BOOKING_PRICING_IMPLEMENTATION.md`
- **Source Code**: `utils/pricing/calculateBookingPrice.ts`

---

**Version:** 1.0.0  
**Last Updated:** October 17, 2025
