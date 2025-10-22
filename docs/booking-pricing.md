# Booking & Pricing (Canonical)

This guide consolidates the structure, implementation, utilities, examples, PDF generation, and booking references from the pricing/booking document series.

## Overview

- Booking data model and types
- Pricing engine structure and utilities
- Real-time pricing examples
- PDF generation (dev vs production)
- Booking reference format

## Data model & booking types

Summaries of booking types and database changes are kept in migrations; this guide focuses on using the pricing system and generating outputs.

Key artifacts to be aware of:

- Booking types (e.g., full_trip, guides_only, transportation_only, etc.)
- Reference format for bookings (human-readable and machine-friendly)

See archived: `BOOKING_REFERENCE_FORMAT.md` and the pricing structure docs.

## Pricing system

High-level:

- Pricing utilities provide reusable helpers for rate calculations (hourly/daily/regional/overnight)
- Consistent currency handling (ILS setup and icon replacement noted in related docs)
- Designed to support real-time updates in UI flows

Utilities quick start (see archived quick-start for full API):

- Rate normalization helpers
- Aggregation of line items
- Rounding and formatting

Real-time examples: cover common booking scenarios and edge cases (overnight, regional, mixed services).

## PDF generation

- Development setup and production setup differ (fonts/assets/environment)
- Summary PDF implementation outlines structure, sections, and style

Use the archived PDFs docs for step-by-step setup and troubleshooting.

## Quick start checklist

1) Identify booking type and compose pricing inputs
2) Use pricing utilities to compute totals and line items
3) Render UI and (optionally) generate PDF summary
4) Persist references using the agreed reference format

## Troubleshooting

- Currency symbols/formatting mismatches → verify ILS configuration and locale
- Discrepancies between UI and PDF totals → ensure shared utilities are used in both paths
- Long-running calculations → precompute when possible, memoize in UI

## Archived originals

For detailed, file-by-file guidance and examples, see:

- `docs/archive/BOOKING_PRICING_STRUCTURE.md`
- `docs/archive/BOOKING_PRICING_IMPLEMENTATION.md`
- `docs/archive/BOOKING_PRICING_INTEGRATION_COMPLETE.md`
- `docs/archive/PRICING_SYSTEM_COMPLETE.md`
- `docs/archive/PRICING_UTILITIES_QUICK_START.md`
- `docs/archive/REAL_TIME_PRICING_EXAMPLES.md`
- `docs/archive/BOOKING_PDF_SUMMARY_IMPLEMENTATION.md`
- `docs/archive/PDF_GENERATION_README.md`
- `docs/archive/PDF_PRODUCTION_SETUP.md`
- `docs/archive/BOOKING_REFERENCE_FORMAT.md`
