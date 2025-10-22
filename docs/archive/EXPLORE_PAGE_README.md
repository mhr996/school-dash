# Explore Page Implementation

## Overview

Created a comprehensive "Explore" page for School Managers and Trip Planners to browse and discover all available services in the system.

## Features

### 1. **Multi-Category Service Browsing**

- **8 Service Categories:**
    - All Services (aggregate view)
    - Destinations
    - Guides
    - Paramedics
    - Security Companies
    - Entertainment Companies
    - Travel Companies
    - Education Programs

### 2. **Advanced Filtering & Search**

- Real-time search across:
    - Service names
    - Descriptions
    - Addresses
    - Service types
- Category-based filtering with live counts
- Animated category pills with gradient colors and icons

### 3. **Modern UI/UX Design**

- **Gradient Header:** Eye-catching blue-purple-indigo gradient with hero section
- **Search Bar:** Large, prominent search with icon and focus effects
- **Category Filters:**
    - Color-coded gradient buttons
    - Icon representation for each category
    - Live service counts
    - Smooth hover and active states
    - Staggered entrance animations
- **Service Cards:**
    - Gradient headers with category colors
    - Custom SVG illustrations for services without images
    - **Professional Illustrations:**
        - 🧑‍🏫 **Guides:** Tour guide with backpack and map
        - 🏥 **Paramedics:** Medical kit with red cross
        - 🛡️ **Security:** Shield with checkmark and stars
        - 🎭 **Entertainment:** Theater curtains with comedy/tragedy masks
        - 🚌 **Travel:** Modern bus with wheels and windows
        - 🎓 **Education:** Graduation cap with book and tassel
    - Image support with automatic fallback to illustrations
    - Price display (various rate types)
    - Contact information (phone, email, address)
    - Hover animations (scale, lift effect)
    - "View Details" CTA button

### 4. **Detailed Service Modal**

- **Full-Screen Modal:** Beautiful modal with backdrop blur
- **Service Image Header:** Large hero image or icon with gradient overlay
- **Two-Column Layout:**
    - Left: Basic info (description, location, contact)
    - Right: Pricing, properties, additional details
- **Pricing Information:**
    - Styled pricing box with gradient background
    - Supports multiple rate types (hourly, daily, regional, overnight)
    - ILS currency with shekel symbol
- **Properties & Tags:**
    - Color-coded badges for properties
    - Suitable-for tags with different styling
- **Additional Information:**
    - Vehicle count (for travel companies)
    - Company codes
    - Notes and descriptions
    - Zone information

### 5. **Responsive Design**

- Mobile-first approach
- Grid adapts: 1 column (mobile) → 2 (tablet) → 3 (desktop) → 4 (large screens)
- Touch-friendly interactions
- Optimized modal for mobile viewing

### 6. **Animations & Interactions**

- Framer Motion animations throughout
- Smooth page transitions
- Staggered card entrance animations
- Hover effects on cards and buttons
- Modal entrance/exit animations with spring physics
- Loading spinners

### 7. **Multi-Language Support**

- Full RTL support for Hebrew and Arabic
- Translations in all 3 languages (EN, HE, AR)
- Direction-aware layouts

## Technical Implementation

### Files Created

1. **`app/(defaults)/explore/page.tsx`**
    - Main explore page component
    - Service loading and filtering logic
    - Modal implementation

### Files Modified

1. **`components/layouts/sidebar.tsx`**

    - Added "Explore" menu item under Home
    - Restricted to School Manager and Trip Planner roles

2. **`public/locales/en.json`**

    - Added English translations

3. **`public/locales/he.json`**

    - Added Hebrew translations

4. **`public/locales/ae.json`**
    - Added Arabic translations

## Translation Keys Added

```json
{
    "explore": "Explore / סייר / استكشف",
    "explore_services": "Explore Services",
    "explore_services_description": "Discover all available services...",
    "all_services": "All Services",
    "search_services": "Search services, destinations, providers...",
    "no_services_found": "No Services Found",
    "try_different_search": "Try adjusting your search...",
    "tour_guide": "Tour Guide"
}
```

## Data Sources

The page fetches data from multiple Supabase tables:

- `destinations` - Travel destinations with properties
- `guides` - Tour guides with rates
- `paramedics` - Medical personnel with rates
- `security_companies` - Security providers with rates
- `external_entertainment_companies` - Entertainment providers
- `travel_companies` - Transportation providers
- `education_programs` - Educational service providers
- `zones` - Geographic zones for destinations

## Service Item Structure

```typescript
interface ServiceItem {
    id: string;
    name: string;
    category: ServiceCategory;
    type: string;
    description?: string;
    image?: string;
    price?: number;
    hourlyRate?: number;
    dailyRate?: number;
    regionalRate?: number;
    overnightRate?: number;
    phone?: string;
    email?: string;
    address?: string;
    zone?: string;
    properties?: string[];
    suitableFor?: string[];
    // ... additional category-specific fields
}
```

## Access Control

- **Visible to:** School Manager, Trip Planner
- **Not visible to:** Admin, Service Providers
- Menu item conditionally rendered based on user role

## User Flow

1. User clicks "Explore" in sidebar (appears under "Home")
2. Page loads with all services displayed in grid
3. User can:
    - Search by keywords
    - Filter by category
    - Click on any service card
4. Modal opens with full service details
5. User can close modal and continue browsing

## Design Highlights

- **Color Palette:**
    - Blue gradient (All Services)
    - Purple gradient (Destinations)
    - Green gradient (Guides)
    - Red gradient (Paramedics)
    - Yellow gradient (Security)
    - Pink gradient (Entertainment)
    - Indigo gradient (Travel)
    - Emerald gradient (Education)
- **Typography:**
    - Large, bold headers
    - Clear hierarchy
    - Readable body text
- **Icons:**
    - Consistent icon usage
    - Category-specific icons
    - Visual affordances

## Future Enhancements

- [ ] Add favorite/bookmark functionality
- [ ] Implement service ratings/reviews
- [ ] Add map view for destinations
- [ ] Enable service comparison
- [ ] Add "Quick Book" from explore page
- [ ] Gallery view for service images
- [ ] Filter by price range
- [ ] Sort options (price, name, rating)
- [ ] Service availability calendar
- [ ] Share service details

## Performance Considerations

- All services loaded once on mount
- Client-side filtering for instant results
- Lazy loading images
- Optimized re-renders with React best practices
- Efficient state management

## Accessibility

- Keyboard navigation support
- ARIA labels
- Focus management in modal
- Semantic HTML
- Screen reader friendly

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Progressive enhancement for older browsers
