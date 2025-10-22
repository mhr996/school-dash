# Booking Pricing Structure - Complete Documentation

## Overview

This document explains the comprehensive pricing calculation system for school trip bookings. The pricing is calculated client-side in real-time as users select destinations and services.

---

## 📊 Pricing Formula

### **Total Booking Price**

```
Total Price = Destination Base Price + Services Total Price
```

### **Destination Base Price**

```
Destination Base = (Student Price × Number of Students) + (Crew Price × Number of Crew)
```

### **Services Total Price**

```
Services Total = Σ (Service Unit Price × Quantity × Days)
```

Where:

- **Service Unit Price** = Selected rate (hourly, daily, regional, or overnight) for each service
- **Quantity** = Number of service providers (e.g., 3 guides, 2 paramedics)
- **Days** = Number of days the service is booked for

---

## 🗄️ Database Schema

### 1. **Destinations Table - Pricing Structure**

#### **Old Format** (Deprecated):

```json
{
    "teen": 80,
    "adult": 80,
    "child": 80,
    "guide": 80
}
```

#### **New Format** (Current):

```json
{
    "student": 50,
    "crew": 100
}
```

**Fields:**

- `student` (number): Price per student for this destination
- `crew` (number): Price per crew/staff member for this destination

**Migration Required:**

- Update all existing destination records to use the new pricing structure
- Remove `teen`, `adult`, `child`, `guide` fields
- Add `student` and `crew` fields with appropriate pricing

---

### 2. **Services Pricing Structure**

#### **A. Guides Table**

```sql
CREATE TABLE public.guides (
  id uuid PRIMARY KEY,
  name varchar NOT NULL,
  hourly_rate numeric,
  daily_rate numeric,
  regional_rate numeric,
  overnight_rate numeric,
  ...
)
```

**Rate Types:**

- `hourly_rate`: Price per hour
- `daily_rate`: Price per day (8 hours) - **DEFAULT**
- `regional_rate`: Price for regional trips
- `overnight_rate`: Price for overnight stays

#### **B. Paramedics Table**

```sql
CREATE TABLE public.paramedics (
  id uuid PRIMARY KEY,
  name varchar NOT NULL,
  hourly_rate numeric,
  daily_rate numeric,
  regional_rate numeric,
  overnight_rate numeric,
  ...
)
```

**Same rate structure as guides.**

#### **C. Security Companies Table**

```sql
CREATE TABLE public.security_companies (
  id uuid PRIMARY KEY,
  name varchar NOT NULL,
  hourly_rate numeric DEFAULT 50.00,
  daily_rate numeric DEFAULT 400.00,
  regional_rate numeric DEFAULT 600.00,
  overnight_rate numeric DEFAULT 500.00,
  ...
)
```

**Same rate structure as guides/paramedics.**

#### **D. Travel Companies Table**

```sql
CREATE TABLE public.travel_companies (
  id uuid PRIMARY KEY,
  name varchar NOT NULL,
  pricing_data jsonb,
  ...
)
```

**Pricing Data Structure:**

```json
{
    "default_price": 500,
    "per_bus": 500,
    "per_km": 2,
    "minimum_charge": 300
}
```

**Note:** Transportation pricing is handled entirely through travel companies. There is NO `number_of_buses` field in bookings anymore - buses are booked as a travel company service.

#### **E. Entertainment Companies Table**

```sql
CREATE TABLE public.external_entertainment_companies (
  id uuid PRIMARY KEY,
  name varchar NOT NULL,
  price numeric,  -- Base price
  ...
)

CREATE TABLE public.entertainment_company_services (
  id uuid PRIMARY KEY,
  entertainment_company_id uuid,
  service_label varchar NOT NULL,
  service_price numeric NOT NULL,
  ...
)
```

**Pricing Calculation:**

```
Entertainment Total = Base Price + Σ(Sub-Service Prices)
```

Both the main entertainment company `price` field AND individual sub-service prices from `entertainment_company_services` are included in the total.

#### **F. Education Programs Table**

```sql
CREATE TABLE public.education_programs (
  id uuid PRIMARY KEY,
  name varchar NOT NULL,
  price numeric,  -- Base price
  ...
)

CREATE TABLE public.education_program_services (
  id uuid PRIMARY KEY,
  education_program_id uuid,
  service_label varchar NOT NULL,
  service_price numeric NOT NULL,
  ...
)
```

**Pricing Calculation:**

```
Education Total = Base Price + Σ(Sub-Service Prices)
```

Both the main program `price` field AND individual sub-service prices from `education_program_services` are included in the total.

---

### 3. **Booking Services Table**

```sql
CREATE TABLE public.booking_services (
  id uuid PRIMARY KEY,
  booking_id uuid NOT NULL,
  service_type varchar NOT NULL,  -- 'guides', 'paramedics', etc.
  service_id uuid NOT NULL,
  quantity integer DEFAULT 1,     -- Number of providers
  days integer DEFAULT 1,         -- Number of days
  booked_price numeric NOT NULL,  -- TOTAL LINE PRICE (not unit price)
  rate_type varchar DEFAULT 'fixed',
  ...
)
```

**Important:**

- `booked_price` stores the **TOTAL PRICE** for that service line, not the unit price
- Formula: `booked_price = (unit_price × quantity × days)`

**Example:**
If you book 3 guides for 2 days at 200/day:

```
booked_price = 200 × 3 × 2 = 1200
```

---

## 💻 Implementation

### Client-Side Price Calculation Utility

**File:** `utils/pricing/calculateBookingPrice.ts`

```typescript
interface DestinationPricing {
    student: number;
    crew: number;
}

interface ServiceSelection {
    type: 'guides' | 'paramedics' | 'security_companies' | 'external_entertainment_companies' | 'travel_companies' | 'education_programs';
    id: string;
    quantity: number;
    days: number;
    unitPrice: number; // Selected rate (hourly/daily/regional/overnight)
    rateType?: string; // 'hourly' | 'daily' | 'regional' | 'overnight'
    subServices?: Array<{ price: number }>; // For entertainment/education
}

interface BookingPriceCalculation {
    destinationBase: number;
    servicesTotal: number;
    totalPrice: number;
    breakdown: {
        studentsCost: number;
        crewCost: number;
        servicesCosts: Array<{
            serviceName: string;
            cost: number;
        }>;
    };
}

export function calculateBookingPrice(destinationPricing: DestinationPricing | null, numberOfStudents: number, numberOfCrew: number, selectedServices: ServiceSelection[]): BookingPriceCalculation {
    // Calculate destination base price
    const studentsCost = destinationPricing ? destinationPricing.student * numberOfStudents : 0;
    const crewCost = destinationPricing ? destinationPricing.crew * numberOfCrew : 0;
    const destinationBase = studentsCost + crewCost;

    // Calculate services total
    const servicesCosts = selectedServices.map((service) => {
        let baseServiceCost = service.unitPrice * service.quantity * service.days;

        // Add sub-services for entertainment/education programs
        if (service.subServices && service.subServices.length > 0) {
            const subServicesTotal = service.subServices.reduce((sum, sub) => sum + sub.price, 0);
            baseServiceCost += subServicesTotal;
        }

        return {
            serviceName: service.type,
            cost: baseServiceCost,
        };
    });

    const servicesTotal = servicesCosts.reduce((sum, service) => sum + service.cost, 0);

    return {
        destinationBase,
        servicesTotal,
        totalPrice: destinationBase + servicesTotal,
        breakdown: {
            studentsCost,
            crewCost,
            servicesCosts,
        },
    };
}
```

---

## 🔄 User Flow & UI Components

### 1. **Destination Selection**

- User selects a destination
- System retrieves `pricing` jsonb field
- Displays per-student and per-crew pricing

### 2. **Trip Details Input**

- User inputs number of students
- User inputs number of crew members
- System calculates destination base price in real-time

### 3. **Service Selection**

#### **For Guides/Paramedics/Security:**

- User selects service provider
- User selects quantity (number of providers)
- User selects number of days
- **User selects rate type** via dropdown:
    - Hourly Rate
    - **Daily Rate (DEFAULT)**
    - Regional Rate
    - Overnight Rate
- System calculates: `quantity × days × selected_rate`

#### **For Travel Companies:**

- User selects travel company
- User configures transportation details (buses, vehicles)
- System uses travel company's `pricing_data`
- Calculates based on travel company pricing structure

#### **For Entertainment Companies:**

- User selects entertainment company
- User selects sub-services from `entertainment_company_services`
- System calculates: `base_price + Σ(sub-service prices)`

#### **For Education Programs:**

- User selects education program
- User selects sub-services from `education_program_services`
- System calculates: `base_price + Σ(sub-service prices)`

### 4. **Price Preview**

- Displays real-time total as services are selected
- Shows breakdown:
    - Destination base (students + crew)
    - Each service line with its total
    - Grand total

### 5. **Checkout**

- Final price is locked in
- Booking record created with `total_amount`
- Individual service records created in `booking_services` with `booked_price` (line total)

---

## 📝 Example Calculations

### **Example 1: Full Trip Booking**

**Destination:**

- Student price: ₪50
- Crew price: ₪100

**Trip Details:**

- 40 students
- 3 crew members

**Selected Services:**

1. 2 Guides - 2 days - Daily rate (₪200/day)
2. 1 Paramedic - 2 days - Daily rate (₪250/day)
3. 1 Security Company - 2 days - Daily rate (₪400/day)
4. 1 Travel Company - ₪800 (fixed)

**Calculation:**

```
Destination Base:
  Students: ₪50 × 40 = ₪2,000
  Crew: ₪100 × 3 = ₪300
  Subtotal: ₪2,300

Services:
  Guides: ₪200 × 2 guides × 2 days = ₪800
  Paramedic: ₪250 × 1 × 2 days = ₪500
  Security: ₪400 × 1 × 2 days = ₪800
  Travel: ₪800
  Subtotal: ₪2,900

TOTAL PRICE: ₪5,200
```

---

### **Example 2: Entertainment Only Booking**

**No Destination** (entertainment booking only)

**Selected Services:**

1. Entertainment Company "Magic Show" - Base: ₪500
    - Sub-service: "Sound System" - ₪150
    - Sub-service: "Lighting" - ₪100

**Calculation:**

```
Destination Base: ₪0 (no destination)

Services:
  Entertainment Base: ₪500
  Sub-services: ₪150 + ₪100 = ₪250
  Entertainment Total: ₪750

TOTAL PRICE: ₪750
```

---

### **Example 3: Guides Only Booking**

**Destination:**

- Student price: ₪30
- Crew price: ₪80

**Trip Details:**

- 25 students
- 2 crew members

**Selected Services:**

1. 3 Guides - 1 day - Regional rate (₪300/day)

**Calculation:**

```
Destination Base:
  Students: ₪30 × 25 = ₪750
  Crew: ₪80 × 2 = ₪160
  Subtotal: ₪910

Services:
  Guides: ₪300 × 3 guides × 1 day = ₪900

TOTAL PRICE: ₪1,810
```

---

## 🚀 Migration Steps

### **Step 1: Update Destination Pricing**

Run this SQL migration to update existing destinations:

```sql
-- Backup existing pricing
CREATE TABLE destinations_pricing_backup AS
SELECT id, name, pricing FROM destinations;

-- Update pricing structure for all destinations
-- Assuming we want to set default values
UPDATE destinations
SET pricing = jsonb_build_object(
  'student', 50,
  'crew', 100
)
WHERE pricing IS NOT NULL;

-- Or manually update each destination with appropriate pricing
```

### **Step 2: Remove number_of_buses References**

✅ **Already Completed**

- Removed `number_of_buses` input field from trip-planner-dashboard.tsx
- Removed buses validation
- Removed buses from booking data save
- Removed buses display from summary section

**Note:** The `number_of_buses` column still exists in the database for historical bookings, but new bookings will not use it.

### **Step 3: Implement Rate Type Selection**

Add dropdown UI component for selecting rate types when adding guides/paramedics/security services.

### **Step 4: Implement Price Calculation**

Create the `calculateBookingPrice()` utility function and integrate it into the booking forms.

### **Step 5: Update Booking Forms**

Integrate real-time price calculation that updates as user selects/deselects services or changes quantities.

---

## ⚠️ Important Notes

### **Buses and Transportation**

- **Old System**: Buses were a separate field in bookings
- **New System**: All transportation is handled through travel companies
- Travel companies manage their own pricing, vehicles, and availability
- When user needs transportation, they select a travel company service with associated pricing

### **Rate Type Selection**

- **Default**: Always default to "Daily Rate" for guides/paramedics/security
- User can optionally change to hourly, regional, or overnight rates
- The selected rate type should be saved in `booking_services.rate_type` for reference

### **Sub-Services (Entertainment & Education)**

- Both the main service price AND sub-service prices are added to the total
- Main price might be ₪0 in some cases if only sub-services apply
- Sub-services are optional and user can select multiple

### **booked_price Field**

- **CRITICAL**: This must store the TOTAL line price, not the unit price
- Formula: `booked_price = unitPrice × quantity × days + subServices`
- This is used for financial reporting and payout calculations

---

## 📚 Files to Modify

### **Primary Files:**

1. `components/dashboards/trip-planner-dashboard.tsx` - Main booking interface
2. `utils/pricing/calculateBookingPrice.ts` - Pricing calculation utility (to be created)
3. `types/index.ts` or `types/pricing.ts` - TypeScript interfaces for pricing

### **Supporting Files:**

4. `components/booking/ServiceRateSelector.tsx` - Rate type dropdown component (to be created)
5. `components/booking/PriceBreakdown.tsx` - Price summary component (to be created)

### **Database:**

6. Migration SQL scripts for updating destination pricing structure

---

## 🧪 Testing Scenarios

### **Test Case 1: Full Trip with All Services**

- Destination with student/crew pricing
- Multiple guides, paramedics, security
- Travel company
- Entertainment and/or education programs
- Verify correct calculation at each step

### **Test Case 2: Service-Only Bookings**

- Guides only
- Paramedics only
- Security only
- Entertainment only
- Education only
- Transportation only

### **Test Case 3: Rate Type Variations**

- Book same guide with hourly rate
- Change to daily rate - verify price updates
- Change to regional rate - verify price updates
- Change to overnight rate - verify price updates

### **Test Case 4: Quantity and Days Variations**

- 1 guide for 1 day
- 3 guides for 1 day
- 1 guide for 3 days
- 3 guides for 3 days
- Verify multiplication is correct

### **Test Case 5: Sub-Services**

- Entertainment with no sub-services
- Entertainment with multiple sub-services
- Education program with no sub-services
- Education program with multiple sub-services

### **Test Case 6: Edge Cases**

- 0 students (should show validation error for full trip)
- 0 crew (should show validation error for full trip)
- No services selected (should show validation error)
- Destination with null pricing
- Service with null rates

---

## 🔮 Future Enhancements

### **Dynamic Pricing**

- Seasonal pricing adjustments
- Demand-based pricing
- Early booking discounts
- Group size discounts

### **Pricing Rules Engine**

- Minimum booking amounts
- Maximum capacities
- Package deals
- Promotional codes/coupons

### **Currency Support**

- Multi-currency support
- Exchange rate integration
- Display prices in user's preferred currency

### **Price History**

- Track price changes over time
- Show historical booking prices
- Generate pricing reports and trends

---

## 📞 Support

For questions or issues related to booking pricing:

1. Check this documentation first
2. Review the calculation examples
3. Test with the provided test scenarios
4. Verify database schema matches documentation

**Last Updated:** October 17, 2025
**Version:** 1.0.0
