# Booking Pricing Implementation - Progress Summary

## ✅ Completed Tasks

### 1. **Removed Buses Field from Booking Form** ✓

**Files Modified:**

- `components/dashboards/trip-planner-dashboard.tsx`

**Changes:**

- ❌ Removed `number_of_buses` input field from booking form
- ❌ Removed buses validation logic
- ❌ Removed buses from booking data save (`number_of_buses: numberOfBuses || null`)
- ❌ Removed buses display from summary section

**Reason:** Transportation is now handled entirely through travel company services, not as a separate field.

---

### 2. **Created Comprehensive Documentation** ✓

**File Created:**

- `BOOKING_PRICING_STRUCTURE.md`

**Contents:**

- Complete pricing formula explanations
- Database schema documentation
- Old vs new pricing structure comparison
- Implementation guidelines with TypeScript code examples
- Real-world calculation examples
- Migration steps
- Testing scenarios
- Future enhancements roadmap

---

### 3. **Created SQL Migration Script** ✓

**File Created:**

- `supabase_migration_update_destination_pricing.sql`

**Migration Steps:**

1. Creates backup table `destinations_pricing_backup`
2. Updates all destinations with new pricing structure:
    - Old: `{teen, adult, child, guide}`
    - New: `{student, crew}`
3. Sets default values (₪50 per student, ₪100 per crew)
4. Includes rollback instructions

**To Execute:**

```sql
-- Run in Supabase SQL Editor
-- This will update all destination pricing structures
```

---

### 4. **Updated TypeScript Types** ✓

**Files Modified:**

#### A. `components/dashboards/trip-planner-dashboard.tsx`

```typescript
// OLD
pricing: { child?: number; teen?: number; adult?: number; guide?: number } | null;

// NEW
pricing: { student?: number; crew?: number } | null;
```

#### B. `app/(defaults)/destinations/add/page.tsx`

```typescript
// OLD
type Pricing = { child?: number; teen?: number; adult?: number; guide?: number };

// NEW
type Pricing = { student?: number; crew?: number };
```

#### C. `app/(defaults)/destinations/edit/[id]/page.tsx`

```typescript
// OLD
type Pricing = { child?: number; teen?: number; adult?: number; guide?: number };

// NEW
type Pricing = { student?: number; crew?: number };
```

#### D. `app/(defaults)/destinations/preview/[id]/page.tsx`

```typescript
// OLD
pricing: { child?: number; teen?: number; adult?: number; guide?: number } | null;

// NEW
pricing: { student?: number; crew?: number } | null;
```

---

### 5. **Updated Destination Add/Edit Forms** ✓

#### **Add Destination Form**

**File:** `app/(defaults)/destinations/add/page.tsx`

**Changes:**

- ✅ Changed from 4-column grid to 2-column grid
- ✅ Updated input fields:
    - ❌ Removed: Child, Teen, Adult, Guide
    - ✅ Added: Student, Crew
- ✅ Updated save logic to use new pricing structure
- ✅ Added helpful placeholders

**New Form Fields:**

```tsx
<input
  type="number"
  value={pricing.student}
  placeholder="Price per student"
/>
<input
  type="number"
  value={pricing.crew}
  placeholder="Price per crew member"
/>
```

#### **Edit Destination Form**

**File:** `app/(defaults)/destinations/edit/[id]/page.tsx`

**Changes:**

- ✅ Same updates as Add form
- ✅ Updated save logic to preserve new structure
- ✅ Properly loads existing pricing data

---

### 6. **Updated Destination Preview Page** ✓

**File:** `app/(defaults)/destinations/preview/[id]/page.tsx`

**Changes:**

- ✅ Updated pricing display section
- ✅ Changed from 4 pricing categories to 2
- ✅ Updated color coding:
    - Student: Blue gradient
    - Crew: Purple gradient
- ✅ Changed currency symbol from `$` to `₪`

**New Display:**

```tsx
[
    { key: 'student', label: t('pricing_student'), value: pricing.student, color: 'from-blue-500 to-cyan-500' },
    { key: 'crew', label: t('pricing_crew'), value: pricing.crew, color: 'from-purple-500 to-pink-500' },
];
```

---

### 7. **Added Translation Keys** ✓

#### **English (`public/locales/en.json`)**

```json
{
    "pricing_student": "Price per Student",
    "pricing_crew": "Price per Crew Member"
}
```

#### **Hebrew (`public/locales/he.json`)**

```json
{
    "pricing_student": "מחיר לתלמיד",
    "pricing_crew": "מחיר לצוות"
}
```

#### **Arabic (`public/locales/ae.json`)**

```json
{
    "pricing_student": "السعر لكل طالب",
    "pricing_crew": "السعر لكل فرد من الطاقم"
}
```

---

## 📋 Remaining Tasks

### **High Priority**

#### 1. **Create Price Calculation Utility** 🔄

**File to Create:** `utils/pricing/calculateBookingPrice.ts`

**What's Needed:**

```typescript
export function calculateBookingPrice(
    destinationPricing: { student: number; crew: number } | null,
    numberOfStudents: number,
    numberOfCrew: number,
    selectedServices: ServiceSelection[],
): BookingPriceCalculation {
    // Calculate destination base
    const destinationBase = destinationPricing ? destinationPricing.student * numberOfStudents + destinationPricing.crew * numberOfCrew : 0;

    // Calculate services total
    const servicesTotal = selectedServices.reduce((sum, service) => {
        return sum + service.unitPrice * service.quantity * service.days;
    }, 0);

    return {
        destinationBase,
        servicesTotal,
        totalPrice: destinationBase + servicesTotal,
        breakdown: {
            /* detailed breakdown */
        },
    };
}
```

---

#### 2. **Add Rate Type Selection** 🔄

**Component to Create:** `components/booking/ServiceRateSelector.tsx`

**What's Needed:**

- Dropdown component for rate type selection
- Options: Hourly, Daily (default), Regional, Overnight
- Display selected rate price
- Auto-calculate total based on quantity and days

**UI Mockup:**

```
Service: John Doe (Guide)
Quantity: [3] guides
Days: [2] days
Rate Type: [Daily ▼]  → Shows: ₪200/day
Total: ₪1,200
```

---

#### 3. **Integrate Real-time Pricing** 🔄

**Files to Modify:**

- `components/dashboards/trip-planner-dashboard.tsx`

**What's Needed:**

- Import `calculateBookingPrice` utility
- Call calculation function whenever:
    - Student/crew numbers change
    - Services are added/removed
    - Quantities/days change
    - Rate types change
- Update `totalPrice` state in real-time
- Display live price breakdown

---

#### 4. **Handle Entertainment & Education Sub-Services** 🔄

**What's Needed:**

- Fetch sub-services when entertainment/education selected
- Display sub-services checklist
- Include sub-service prices in calculation
- Formula: `base_price + Σ(selected_sub_services.price)`

---

#### 5. **Update booked_price Storage** 🔄

**Files to Modify:**

- `components/dashboards/trip-planner-dashboard.tsx` (booking save logic)

**What's Needed:**

- Ensure `booking_services.booked_price` stores **total** line price
- Formula: `booked_price = unitPrice × quantity × days`
- For entertainment/education: `booked_price = basePrice + subServicesTotal`

---

#### 6. **End-to-End Testing** 🔄

**Test Scenarios:**

1. Full trip booking with all services
2. Service-only bookings (guides only, etc.)
3. Rate type variations
4. Quantity and days variations
5. Entertainment/education with sub-services
6. Edge cases (0 students, null pricing, etc.)

---

## 🗄️ Database Migration Required

**IMPORTANT:** Before using the new pricing system, you must run the SQL migration:

1. Open Supabase SQL Editor
2. Run `supabase_migration_update_destination_pricing.sql`
3. Verify migration: `SELECT id, name, pricing FROM destinations LIMIT 10;`
4. Adjust default pricing values if needed

**Default Values Set:**

- Student: ₪50
- Crew: ₪100

You may want to review and adjust these per destination based on actual pricing.

---

## 📊 Current System State

### **Working**

✅ Destination pricing structure updated (types only)
✅ Forms display new pricing fields
✅ Types are consistent across codebase
✅ Translations added for all languages
✅ Buses field removed from bookings
✅ Documentation complete

### **Not Yet Working**

❌ Old pricing data still in database (migration not run)
❌ Price calculation not implemented
❌ Rate type selection not available
❌ Real-time pricing updates not working
❌ Sub-services not included in pricing

---

## 🚀 Next Steps

### **Immediate Actions Needed:**

1. **Run Database Migration** ⚠️

    - Execute `supabase_migration_update_destination_pricing.sql`
    - This is CRITICAL before the system can work properly

2. **Create Price Calculation Utility**

    - Build the `calculateBookingPrice()` function
    - Write unit tests for the function

3. **Build Rate Type Selector Component**

    - Create reusable dropdown for rate selection
    - Integrate with service booking UI

4. **Integrate Real-time Pricing**

    - Connect calculation to booking form
    - Show live price updates

5. **Test Thoroughly**
    - Test all booking scenarios
    - Verify calculations are correct
    - Test with real data

---

## 💡 Implementation Tips

### **For Price Calculation:**

- Keep calculation logic separate from UI
- Make it testable and reusable
- Handle null/undefined values gracefully
- Round to 2 decimal places for currency

### **For Rate Selection:**

- Default to "Daily" rate always
- Show the price next to rate type
- Disable unavailable rate types (if rate is null/0)
- Update total immediately on change

### **For Real-time Updates:**

- Use React state management
- Debounce rapid changes if needed
- Show loading states during calculations
- Display clear error messages

### **For Sub-Services:**

- Load sub-services lazily (only when needed)
- Allow multiple selections
- Show individual prices clearly
- Sum correctly in final total

---

## 📞 Questions or Issues?

Refer to:

1. **BOOKING_PRICING_STRUCTURE.md** - Complete pricing documentation
2. **supabase_migration_update_destination_pricing.sql** - Database migration
3. This file - Implementation progress and next steps

---

**Last Updated:** October 17, 2025  
**Status:** 40% Complete  
**Next Milestone:** Implement price calculation utility
