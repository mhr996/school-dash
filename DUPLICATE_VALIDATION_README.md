# Duplicate Validation Implementation

## Overview

Implemented duplicate validation for destination properties and suitable-for options to prevent unique constraint violations and provide user-friendly error messages.

## Problem Statement

When users tried to add properties or suitable-for options with values that already existed in the database, they encountered a cryptic PostgreSQL error:

```
Error code: 23505
Message: "duplicate key value violates unique constraint destination_properties_value_unique"
```

This was poor UX and didn't explain the issue clearly to users.

## Database Constraints

Both tables have UNIQUE constraints on the `value` column:

- `destination_properties`: Constraint `destination_properties_value_unique`
- `suitable_for_options`: Constraint `suitable_for_options_value_unique`

These constraints are **intentional and good database design** - they prevent duplicate property/option values like having two "swimming_pool" properties.

## Solution: Two-Layer Validation

### Layer 1: Pre-flight Check (Primary)

Before attempting to insert, query the database to check if the value already exists:

```typescript
const { data: existingProperty } = await supabase.from('destination_properties').select('id, value').eq('value', newPropertyValue.trim().toLowerCase()).maybeSingle();

if (existingProperty) {
    setAlert({
        message: 'Property already exists...',
        type: 'danger',
    });
    return; // Stop execution, keep modal open
}
```

### Layer 2: Error Code Handler (Safety Net)

Catch the 23505 error code in case of race conditions:

```typescript
const { error: insertError } = await supabase
    .from('destination_properties')
    .insert([{ value: newPropertyValue.trim().toLowerCase(), ... }])
    .select()
    .single();

if (insertError) {
    if (insertError.code === '23505') {
        setAlert({
            message: 'Property already exists...',
            type: 'danger'
        });
        return;
    }
    throw insertError; // Re-throw other errors
}
```

## Key Features

### 1. Case-Insensitive Comparison

Values are normalized to lowercase before checking and inserting:

```typescript
.eq('value', newPropertyValue.trim().toLowerCase())
.insert([{ value: newPropertyValue.trim().toLowerCase(), ... }])
```

This prevents duplicates with different cases like:

- "swimming_pool" vs "Swimming_Pool" vs "SWIMMING_POOL"

### 2. User-Friendly Error Messages

Instead of showing database error codes, users see:

- For properties: `"Property 'swimming_pool' already exists. Please use a different value."`
- For suitable-for: `"Suitable-for option 'families' already exists. Please use a different value."`

### 3. Modal Behavior

- **On Error**: Modal stays open, allowing user to try a different value
- **On Success**: Modal closes and shows success message
- **Loading State**: Disabled during validation/save

## Files Modified

### Add Page

**File**: `app/(defaults)/destinations/add/page.tsx`

Functions updated:

- `handleAddNewProperty` (lines ~185-235)
- `handleAddNewSuitableFor` (lines ~237-280)

### Edit Page

**File**: `app/(defaults)/destinations/edit/[id]/page.tsx`

Functions updated:

- `handleAddNewProperty` (lines ~185-240)
- `handleAddNewSuitableFor` (lines ~270-315)

## Translation Keys Needed

Add these keys to all language files:

```typescript
// English (en.json)
"property_already_exists": "Property '{{value}}' already exists. Please use a different value.",
"suitable_for_already_exists": "Suitable-for option '{{value}}' already exists. Please use a different value."

// Arabic (ar.json)
"property_already_exists": "الخاصية '{{value}}' موجودة بالفعل. يرجى استخدام قيمة مختلفة.",
"suitable_for_already_exists": "خيار المناسب لـ '{{value}}' موجود بالفعل. يرجى استخدام قيمة مختلفة."

// Hebrew (he.json)
"property_already_exists": "המאפיין '{{value}}' כבר קיים. אנא השתמש בערך אחר.",
"suitable_for_already_exists": "אפשרות המתאים ל-'{{value}}' כבר קיימת. אנא השתמש בערך אחר."
```

## Testing Checklist

### Property Validation

- [ ] Add new unique property → Should succeed
- [ ] Add duplicate property (exact match) → Should show error
- [ ] Add duplicate with different case → Should show error
- [ ] Verify modal stays open on error
- [ ] Verify modal closes on success
- [ ] Check loading state during operation
- [ ] Test on both add and edit pages

### Suitable-For Validation

- [ ] Add new unique option → Should succeed
- [ ] Add duplicate option (exact match) → Should show error
- [ ] Add duplicate with different case → Should show error
- [ ] Verify modal stays open on error
- [ ] Verify modal closes on success
- [ ] Check loading state during operation
- [ ] Test on both add and edit pages

### Edge Cases

- [ ] Whitespace handling: "pool " vs "pool" → Should detect as duplicate
- [ ] Empty value: Should be caught by required validation
- [ ] Special characters: Test if allowed
- [ ] Race condition: Multiple users adding same value simultaneously
- [ ] Network error during check: Should show appropriate error

## Benefits

1. **Better UX**: Clear, actionable error messages instead of database codes
2. **Prevention**: Catch duplicates before attempting database insert
3. **Consistency**: Same validation logic on both add and edit pages
4. **Robustness**: Two-layer approach catches race conditions
5. **Case-Insensitive**: Prevents subtle duplicate issues
6. **Maintainability**: Centralized error handling logic

## Implementation Notes

- Uses `.maybeSingle()` instead of `.single()` to avoid errors when no match exists
- Normalizes to lowercase BEFORE checking to ensure consistent comparison
- Modal remains open on error so user can correct without re-entering data
- Loading states prevent double-submission during validation
- Error code 23505 handler serves as safety net for race conditions

## Future Enhancements

Potential improvements:

1. **Suggestion System**: When duplicate detected, suggest alternatives (e.g., "swimming_pool_indoor")
2. **Batch Validation**: Validate multiple values before inserting
3. **Real-time Validation**: Check as user types (debounced)
4. **Admin Override**: Allow admins to merge duplicates if needed
5. **Audit Log**: Track duplicate attempts for analytics

## Related Documentation

- `HARD_DELETE_IMPLEMENTATION.md` - Hard delete with usage validation
- `DESTINATION_PROPERTIES_UI_IMPROVEMENTS.md` - UI/UX enhancements
- Database schema migration files
