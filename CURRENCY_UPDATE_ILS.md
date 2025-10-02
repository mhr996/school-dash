# Currency Update: Turkish Lira to Israeli Shekel

## Overview

Updated all currency formatting in the bills pages from Turkish Lira (TRY/₺) to Israeli Shekel (ILS/₪) to maintain consistency across the application.

## Changes Made

### 1. Bill Details Page (`app/(defaults)/bills/[id]/page.tsx`)

**Line 242**: Updated `formatCurrency` function

```typescript
// Before
return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);

// After
return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(amount);
```

### 2. Bills List Page (`app/(defaults)/bills/page.tsx`)

**Line 172**: Updated `formatCurrency` function

```typescript
// Before
return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);

// After
return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(amount);
```

### 3. Bill Edit Page (`app/(defaults)/bills/[id]/edit/page.tsx`)

**Line 444**: Updated `formatCurrency` function

```typescript
// Before
return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);

// After
return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(amount);
```

## Currency Formatting Details

### New Format Specifications

- **Locale**: `he-IL` (Hebrew - Israel)
- **Currency**: `ILS` (Israeli Shekel)
- **Symbol**: ₪
- **Format Example**: ₪1,234.56

### Intl.NumberFormat Configuration

```typescript
new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
});
```

## Affected UI Elements

### Bill Details Page

- Payment amounts
- Service prices and totals
- Subtotal display
- Tax amount
- Total amount
- Financial summary section

### Bills List Page

- Total amount column
- Subtotal and tax breakdown in tooltips

### Bill Edit Page

- Payment amounts
- Booking total amount
- Existing payments total
- New payments total
- Grand total
- Remaining balance

## Consistency Verification

### Already Using ILS (No Changes Needed)

The following files were already using ILS currency:

- ✅ `utils/pdf-generators/shared.ts` - PDF generation utility (already ILS)
- ✅ `utils/pdf-generators/shared-clean.ts` - Clean PDF utility (already ILS)
- ✅ All PDF generators use the shared formatCurrency function

### Other Currency Instances (Different Context)

Other `formatCurrency` functions found in:

- `utils/number-formatter.ts` - General number formatting utility
- `components/forms/multiple-payment-form.tsx` - Form component
- `app/api/generate-contract-pdf/route.ts` - Contract PDF API
- `app/(defaults)/page.tsx` - Dashboard page

These are separate implementations for different purposes and don't need to be changed unless they're displaying bills/payments.

## Impact

### User-Facing Changes

- All bill amounts now display with ₪ (Shekel) symbol
- Consistent currency formatting across all bill-related pages
- Proper Israeli locale formatting (he-IL)

### No Breaking Changes

- The underlying data (numeric values) remains unchanged
- Only the display format is affected
- All calculations remain the same

## Testing Checklist

- [ ] View bill details page - verify ₪ symbol appears
- [ ] Check bills list page - verify all amounts show ₪
- [ ] Edit bill page - verify payment amounts show ₪
- [ ] Create new bill - verify currency displays correctly
- [ ] Generate PDF - verify PDFs use ₪ (already implemented)
- [ ] View receipts - verify amounts show ₪
- [ ] Check tax invoices - verify all line items show ₪

## Benefits

- ✅ **Consistency**: Single currency throughout the entire application
- ✅ **Accuracy**: Reflects actual business operations in Israel
- ✅ **User Experience**: Clear and correct currency representation
- ✅ **Localization**: Proper Israeli locale formatting
- ✅ **Professional**: Matches real business requirements

## Technical Notes

### Locale Choice

- Used `he-IL` (Hebrew-Israel) instead of `en-IL` for proper Israeli formatting
- This provides the correct number grouping and decimal separators for the region
- The currency symbol ₪ is automatically inserted by the Intl.NumberFormat API

### Date Formatting

Note: Date formatting in bills pages still uses `tr-TR` locale for `toLocaleDateString`. This may need to be updated separately if Israeli date formatting is required (DD/MM/YYYY format).

## Related Files

- **Modified**:

    - `app/(defaults)/bills/[id]/page.tsx`
    - `app/(defaults)/bills/page.tsx`
    - `app/(defaults)/bills/[id]/edit/page.tsx`

- **Already Correct** (no changes):
    - `utils/pdf-generators/shared.ts`
    - `utils/pdf-generators/shared-clean.ts`
    - All PDF generator files

## Future Considerations

If date formatting also needs to be updated from Turkish to Israeli locale:

```typescript
// Current
new Date(date).toLocaleDateString('tr-TR');

// Suggested change for Israeli format
new Date(date).toLocaleDateString('he-IL');
```

This would change date format from Turkish style to Israeli DD/MM/YYYY format.
