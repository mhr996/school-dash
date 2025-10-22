# Real-Time Pricing Integration - Code Examples

## Overview

This document provides practical code examples showing how the real-time pricing calculation works in the trip planner dashboard.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Trip Planner Dashboard                      │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  User Inputs                                        │    │
│  │  • Select Destination                               │    │
│  │  • Enter Number of Students                         │    │
│  │  • Enter Number of Crew                             │    │
│  │  • Select Services (guides, paramedics, etc.)       │    │
│  │  • Choose Rate Types (hourly/daily)                 │    │
│  └────────────────────────────────────────────────────┘    │
│                         ↓                                    │
│  ┌────────────────────────────────────────────────────┐    │
│  │  useEffect (Automatic Trigger)                      │    │
│  │  Dependencies: selectedRequirements, numberOfStudents│    │
│  │                numberOfCrew, selectedForPlanning    │    │
│  └────────────────────────────────────────────────────┘    │
│                         ↓                                    │
│  ┌────────────────────────────────────────────────────┐    │
│  │  calculateTotalPrice()                              │    │
│  │  • Converts RequirementSelection to ServiceSelection│    │
│  │  • Calls calculateBookingPrice utility              │    │
│  │  • Returns total price                              │    │
│  └────────────────────────────────────────────────────┘    │
│                         ↓                                    │
│  ┌────────────────────────────────────────────────────┐    │
│  │  setTotalPrice(newTotal)                            │    │
│  │  Updates state → UI re-renders with new price       │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Code Implementation

### 1. Import Section

```typescript
// Import the pricing utilities
import { calculateBookingPrice, getServiceRate, type ServiceSelection, type RateType } from '@/utils/pricing';
```

### 2. State Variables

The following state variables drive the pricing calculation:

```typescript
// Destination selected for planning
const [selectedForPlanning, setSelectedForPlanning] = useState<Destination | null>(null);

// Trip details
const [numberOfStudents, setNumberOfStudents] = useState<number>();
const [numberOfCrew, setNumberOfCrew] = useState<number>();

// Selected services (guides, paramedics, security, entertainment, travel)
const [selectedRequirements, setSelectedRequirements] = useState<RequirementSelection[]>([]);

// The calculated total price
const [totalPrice, setTotalPrice] = useState<number>(0);
```

### 3. Price Calculation Function

```typescript
const calculateTotalPrice = (requirements: RequirementSelection[]) => {
    // Convert requirements to ServiceSelection format for the pricing utility
    const serviceSelections: ServiceSelection[] = requirements.map((req) => {
        let service: any = null;
        let unitPrice = 0;

        // Find the service and get its rate based on type
        switch (req.type) {
            case 'paramedics':
                service = paramedics.find((p) => p.id === req.id);
                if (service) {
                    unitPrice = getServiceRate(service, req.rate_type as RateType);
                }
                break;
            case 'guides':
                service = guides.find((g) => g.id === req.id);
                if (service) {
                    unitPrice = getServiceRate(service, req.rate_type as RateType);
                }
                break;
            case 'security_companies':
                service = securityCompanies.find((s) => s.id === req.id);
                if (service) {
                    unitPrice = getServiceRate(service, req.rate_type as RateType);
                }
                break;
            case 'external_entertainment_companies':
                service = entertainmentCompanies.find((e) => e.id === req.id);
                if (service) {
                    unitPrice = service.price;
                }
                break;
            case 'travel_companies':
                service = travelCompanies.find((t) => t.id === req.id);
                if (service && service.pricing_data) {
                    unitPrice = service.pricing_data?.default_price || 100;
                }
                break;
        }

        // Return in ServiceSelection format
        return {
            id: req.id,
            name: req.name,
            type: req.type,
            quantity: req.quantity,
            days: req.rate_type === 'hourly' ? 0 : req.days || 1,
            hours: req.rate_type === 'hourly' ? req.hours || 1 : 0,
            unitPrice: unitPrice,
            rateType: req.rate_type as RateType,
            subServices: [], // Sub-services handled separately
        };
    });

    // Convert pricing to match DestinationPricing type
    const destinationPricing = selectedForPlanning?.pricing
        ? {
              student: selectedForPlanning.pricing.student || 0,
              crew: selectedForPlanning.pricing.crew || 0,
          }
        : null;

    // Use the pricing utility to calculate total
    const result = calculateBookingPrice(destinationPricing, numberOfStudents || 0, numberOfCrew || 0, serviceSelections);

    return result.totalPrice;
};
```

### 4. Automatic Recalculation with useEffect

```typescript
// Automatically recalculate price when any dependency changes
useEffect(() => {
    const newTotal = calculateTotalPrice(selectedRequirements);
    setTotalPrice(newTotal);
}, [
    selectedRequirements, // Services added/removed
    paramedics, // Paramedics list changes
    guides, // Guides list changes
    securityCompanies, // Security companies list changes
    entertainmentCompanies, // Entertainment companies list changes
    travelCompanies, // Travel companies list changes
    numberOfStudents, // Student count changes
    numberOfCrew, // Crew count changes
    selectedForPlanning, // Destination changes
]);
```

## Usage Examples

### Example 1: Basic Trip Booking

**User Actions**:

1. Selects destination with pricing: ₪50/student, ₪100/crew
2. Enters 30 students
3. Enters 2 crew members

**What Happens**:

```typescript
// useEffect triggers calculateTotalPrice()
const destinationPricing = { student: 50, crew: 100 };
const result = calculateBookingPrice(destinationPricing, 30, 2, []);

// Calculation:
// Students: 30 × ₪50 = ₪1,500
// Crew: 2 × ₪100 = ₪200
// Services: ₪0
// Total: ₪1,700

setTotalPrice(1700); // UI updates automatically
```

### Example 2: Adding a Guide

**User Actions**:

1. Has destination selected (₪50/student, ₪100/crew)
2. Has 30 students, 2 crew
3. Adds guide: "John Doe" @ ₪200/day for 2 days, quantity 1

**What Happens**:

```typescript
// selectedRequirements updated with new guide
const serviceSelections = [
    {
        id: 'guide-1',
        name: 'John Doe',
        type: 'guides',
        quantity: 1,
        days: 2,
        hours: 0,
        unitPrice: 200,
        rateType: 'daily',
        subServices: [],
    },
];

const result = calculateBookingPrice({ student: 50, crew: 100 }, 30, 2, serviceSelections);

// Calculation:
// Destination: (30 × ₪50) + (2 × ₪100) = ₪1,700
// Guide: 1 × ₪200 × 2 days = ₪400
// Total: ₪2,100

setTotalPrice(2100); // UI updates automatically
```

### Example 3: Changing Rate Type

**User Actions**:

1. Has guide selected at daily rate (₪200/day, 2 days) = ₪400
2. Changes to hourly rate (₪50/hour, 8 hours) = ₪400

**What Happens**:

```typescript
// Before: rate_type = 'daily', days = 2
const beforeService = {
    id: 'guide-1',
    name: 'John Doe',
    type: 'guides',
    quantity: 1,
    days: 2,
    hours: 0,
    unitPrice: 200, // daily_rate
    rateType: 'daily',
    subServices: [],
};
// Cost: 1 × 200 × 2 = ₪400

// After: rate_type = 'hourly', hours = 8
const afterService = {
    id: 'guide-1',
    name: 'John Doe',
    type: 'guides',
    quantity: 1,
    days: 0,
    hours: 8,
    unitPrice: 50, // hourly_rate
    rateType: 'hourly',
    subServices: [],
};
// Cost: 1 × 50 × 8 = ₪400

// Price remains same but calculation method changes
// useEffect triggers → calculateTotalPrice() → UI updates
```

### Example 4: Multiple Services

**User Actions**:

- Destination: ₪50/student, ₪100/crew
- 40 students, 3 crew
- 2 guides @ ₪200/day for 2 days
- 1 paramedic @ ₪150/day for 2 days
- 1 security @ ₪180/day for 2 days

**What Happens**:

```typescript
const serviceSelections = [
    { id: 'g1', name: 'Guide 1', type: 'guides', quantity: 1, days: 2, unitPrice: 200, rateType: 'daily' },
    { id: 'g2', name: 'Guide 2', type: 'guides', quantity: 1, days: 2, unitPrice: 200, rateType: 'daily' },
    { id: 'p1', name: 'Paramedic 1', type: 'paramedics', quantity: 1, days: 2, unitPrice: 150, rateType: 'daily' },
    { id: 's1', name: 'Security 1', type: 'security_companies', quantity: 1, days: 2, unitPrice: 180, rateType: 'daily' },
];

const result = calculateBookingPrice({ student: 50, crew: 100 }, 40, 3, serviceSelections);

// Calculation Breakdown:
// Destination Base:
//   Students: 40 × ₪50 = ₪2,000
//   Crew: 3 × ₪100 = ₪300
//   Subtotal: ₪2,300

// Services:
//   Guide 1: 1 × ₪200 × 2 = ₪400
//   Guide 2: 1 × ₪200 × 2 = ₪400
//   Paramedic: 1 × ₪150 × 2 = ₪300
//   Security: 1 × ₪180 × 2 = ₪360
//   Subtotal: ₪1,460

// TOTAL: ₪3,760

setTotalPrice(3760); // UI updates automatically
```

### Example 5: Service-Only Booking (No Destination)

**User Actions**:

- Selects "Guides Only" booking type
- No destination selected
- Adds 3 guides @ ₪200/day for 1 day

**What Happens**:

```typescript
const serviceSelections = [
    { id: 'g1', name: 'Guide 1', type: 'guides', quantity: 1, days: 1, unitPrice: 200, rateType: 'daily' },
    { id: 'g2', name: 'Guide 2', type: 'guides', quantity: 1, days: 1, unitPrice: 200, rateType: 'daily' },
    { id: 'g3', name: 'Guide 3', type: 'guides', quantity: 1, days: 1, unitPrice: 200, rateType: 'daily' },
];

const result = calculateBookingPrice(
    null, // No destination
    0, // No students
    0, // No crew
    serviceSelections,
);

// Calculation:
// Destination: ₪0 (no destination)
// Services:
//   Guide 1: 1 × ₪200 × 1 = ₪200
//   Guide 2: 1 × ₪200 × 1 = ₪200
//   Guide 3: 1 × ₪200 × 1 = ₪200
//   Subtotal: ₪600

// TOTAL: ₪600

setTotalPrice(600); // UI updates automatically
```

## Data Flow Diagram

```
┌─────────────────┐
│ User Input      │
│ Components      │
└────────┬────────┘
         │
         │ onChange events
         ↓
┌─────────────────┐
│ State Updates   │
│ • setNumberOf   │
│   Students()    │
│ • setNumberOf   │
│   Crew()        │
│ • setSelected   │
│   Requirements()│
└────────┬────────┘
         │
         │ triggers
         ↓
┌─────────────────┐
│ useEffect       │
│ (dependencies)  │
└────────┬────────┘
         │
         │ calls
         ↓
┌─────────────────┐
│calculateTotal   │
│Price()          │
└────────┬────────┘
         │
         │ calls
         ↓
┌─────────────────┐
│calculateBooking │
│Price() utility  │
└────────┬────────┘
         │
         │ returns
         ↓
┌─────────────────┐
│ Price Result    │
│ {               │
│   destination   │
│   Base,         │
│   servicesTotal,│
│   totalPrice    │
│ }               │
└────────┬────────┘
         │
         │ updates
         ↓
┌─────────────────┐
│ setTotalPrice() │
└────────┬────────┘
         │
         │ triggers
         ↓
┌─────────────────┐
│ UI Re-render    │
│ Shows new price │
└─────────────────┘
```

## Helper Functions Used

### getServiceRate()

Extracts the correct rate from a service based on the rate type:

```typescript
import { getServiceRate } from '@/utils/pricing';

const guide = {
    id: '1',
    name: 'John',
    hourly_rate: 50,
    daily_rate: 200,
    regional_rate: 500,
    overnight_rate: 800,
};

const dailyRate = getServiceRate(guide, 'daily'); // Returns 200
const hourlyRate = getServiceRate(guide, 'hourly'); // Returns 50
const regionalRate = getServiceRate(guide, 'regional'); // Returns 500
```

### Type Conversion

Converting from `RequirementSelection` (UI format) to `ServiceSelection` (utility format):

```typescript
// UI Format (RequirementSelection)
{
    id: 'guide-1',
    name: 'John Doe',
    type: 'guides',
    quantity: 2,
    rate_type: 'daily',
    cost: 200,
    days: 3
}

// Utility Format (ServiceSelection)
{
    id: 'guide-1',
    name: 'John Doe',
    type: 'guides',
    quantity: 2,
    days: 3,
    hours: 0,
    unitPrice: 200,
    rateType: 'daily',
    subServices: []
}
```

## Performance Considerations

### Efficient Re-renders

The useEffect only triggers when actual dependencies change:

```typescript
useEffect(() => {
    const newTotal = calculateTotalPrice(selectedRequirements);
    setTotalPrice(newTotal);
}, [
    selectedRequirements,
    numberOfStudents,
    numberOfCrew,
    selectedForPlanning,
    // ... other dependencies
]);
```

### Optimization Tips

1. **Memoize service arrays** if they're fetched frequently
2. **Debounce number inputs** if users type quickly
3. **Use React.memo** for child components that display price
4. **Cache calculations** for complex sub-service calculations

## Testing the Integration

### Manual Testing Steps

1. **Open trip planner dashboard**
2. **Select a destination** → Price should update
3. **Enter number of students** → Price should increase
4. **Enter number of crew** → Price should increase more
5. **Add a guide** → Price should jump by guide cost
6. **Change guide rate type** → Price should recalculate
7. **Add more services** → Price should accumulate
8. **Remove a service** → Price should decrease
9. **Clear destination** → Price should drop to services only

### Console Debugging

Add console logs to track calculations:

```typescript
const calculateTotalPrice = (requirements: RequirementSelection[]) => {
    console.log('🧮 Calculating price...');
    console.log('Destination:', selectedForPlanning?.pricing);
    console.log('Students:', numberOfStudents);
    console.log('Crew:', numberOfCrew);
    console.log('Requirements:', requirements);

    // ... calculation logic ...

    console.log('Total Price:', result.totalPrice);
    return result.totalPrice;
};
```

## Related Files

- **Utility**: `utils/pricing/calculateBookingPrice.ts`
- **Component**: `components/dashboards/trip-planner-dashboard.tsx`
- **Types**: Defined in both files above
- **Docs**: `BOOKING_PRICING_STRUCTURE.md`, `PRICING_UTILITIES_QUICK_START.md`

---

**Status**: ✅ Integration complete and documented
**Last Updated**: January 2024
