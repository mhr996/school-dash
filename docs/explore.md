# Explore Page (Canonical)

Consolidated reference for the Explore page and the “Book Now” deep-link to the Trip Planner.

## Overview

- Multi-category service browsing with search and filters
- Modern, animated UI with category gradients and icons
- Detail modal with pricing, tags, and properties
- RTL and i18n support (EN/HE/AR)

## Categories

- All Services, Destinations, Guides, Paramedics, Security Companies, Entertainment Companies, Travel Companies, Education Programs

## Book Now deep link

Each card has two actions: View Details (modal) and Book Now (navigate to Trip Planner with preselection).

URL params:

```
/?bookingType={type}&serviceType={serviceType}&serviceId={id}
/?bookingType=full_trip&destinationId={id}
```

Category → booking mapping:

| Category      | bookingType         | serviceType                      |
| ------------- | ------------------- | -------------------------------- |
| Destinations  | full_trip           | —                                |
| Guides        | guides_only         | guides                           |
| Paramedics    | paramedics_only     | paramedics                       |
| Security      | security_only       | security_companies               |
| Entertainment | entertainment       | external_entertainment_companies |
| Travel        | transportation_only | travel_companies                 |
| Education     | education_only      | education_programs               |

Flow:

1. Explore → Build URL → Navigate to `/`
2. Home detects params → switches to Trip Planner tab
3. Trip Planner reads params → loads data → pre-selects item → switches to service booking view → clears URL

Duplicate prevention: a `useRef` guard ensures URL params are processed once and form renders only once.

## UI/UX notes

- Buttons are stacked vertically on the card for clarity
- Book Now uses a green/emerald gradient; Details uses blue/purple
- Removed card-level onClick to avoid accidental modal opens when clicking Book Now

## Files touched

- `app/(defaults)/explore/page.tsx` – cards, actions, navigation
- `components/dashboards/trip-planner-dashboard.tsx` – URL param handling and guards
- `app/(defaults)/page.tsx` – auto-tab switch to trip planner

## Archived originals

- `docs/archive/EXPLORE_PAGE_README.md`
- `docs/archive/EXPLORE_PAGE_BOOK_NOW_IMPLEMENTATION.md`
