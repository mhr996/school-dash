'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getTranslation } from '@/i18n';
import supabase from '@/lib/supabase';
import { getPublicUrlFromPath } from '@/utils/file-upload';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconPlus from '@/components/icon/icon-plus';
import IconEye from '@/components/icon/icon-eye';
import IconUser from '@/components/icon/icon-user';
import IconCreditCard from '@/components/icon/icon-credit-card';
import IconCalendar from '@/components/icon/icon-calendar';
import IconSettings from '@/components/icon/icon-settings';
import IconHome from '@/components/icon/icon-home';
import IconSun from '@/components/icon/icon-sun';
import IconBook from '@/components/icon/icon-book';
import IconAward from '@/components/icon/icon-award';
import IconClock from '@/components/icon/icon-clock';
import IconHeart from '@/components/icon/icon-heart';
import { getCurrentUserWithRole } from '@/lib/auth';
import IconCar from '@/components/icon/icon-car';
import IconCoffee from '@/components/icon/icon-coffee';
import IconUsersGroup from '@/components/icon/icon-users-group';
import IconLock from '@/components/icon/icon-lock';
import IconStar from '@/components/icon/icon-star';
import IconUsers from '@/components/icon/icon-users';
import IconRouter from '@/components/icon/icon-router';
import IconHelpCircle from '@/components/icon/icon-help-circle';
import IconFire from '@/components/icon/icon-fire';
import IconCaretDown from '@/components/icon/icon-caret-down';
import IconShoppingBag from '@/components/icon/icon-shopping-bag';
import IconPlayCircle from '@/components/icon/icon-play-circle';
import DestinationDetailsModal from '@/components/modals/destination-details-modal';
import TabbedDestinationsSection from '@/components/dashboards/tabbed-destinations-section';
import CustomSelect from '@/components/elements/custom-select';
import { calculateBookingPrice, getServiceRate, type ServiceSelection, type RateType } from '@/utils/pricing';

type Destination = {
    id: string;
    name: string;
    address: string | null;
    zone_id: string | null;
    thumbnail_path: string | null;
    gallery_paths?: string[] | null;
    properties_details: Array<{ value: string; icon: string | null }> | null;
    suitable_for_details: Array<{ value: string }> | null;
    requirements: string[] | null;
    pricing: { student?: number; crew?: number } | null;
};

type Zone = {
    id: string;
    name: string;
};

type Paramedic = {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    hourly_rate: number;
    daily_rate: number;
    status: string;
};

type Guide = {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    hourly_rate: number;
    daily_rate: number;
    status: string;
};

type SecurityCompany = {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    hourly_rate: number;
    daily_rate: number;
    status: string;
};

type ExternalEntertainmentCompany = {
    id: string;
    name: string;
    price: number;
    description?: string | null;
    image?: string | null;
    status: string;
};

type TravelCompany = {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    pricing_data?: any;
    status: string;
};

// Booking types
type BookingType = 'full_trip' | 'guides_only' | 'paramedics_only' | 'security_only' | 'entertainment_only' | 'education_only' | 'transportation_only';

type BookingTypeConfig = {
    id: BookingType;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    shadowColor: string;
    requiredServices: string[];
    allowsDestination: boolean;
    requiresDestination: boolean;
};

type RequirementSelection = {
    id: string;
    name: string;
    type: 'paramedics' | 'guides' | 'security_companies' | 'external_entertainment_companies' | 'travel_companies';
    quantity: number;
    rate_type: 'hourly' | 'daily' | 'regional' | 'overnight' | 'fixed';
    cost: number;
    hours?: number;
    days?: number;
};

// Helper function to format filter text (replace underscores with spaces and capitalize)
const formatFilterText = (text: string) => {
    return text
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

// Helper function to get icon for property
const getPropertyIcon = (property: string) => {
    const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
        indoor_activities: IconHome,
        outdoor_activities: IconSun,
        educational_value: IconBook,
        entertainment_value: IconAward,
        historical_significance: IconClock,
        natural_beauty: IconHeart,
        accessibility: IconUser,
        parking_available: IconCar,
        restroom_facilities: IconSettings,
        food_services: IconCoffee,
    };
    return iconMap[property] || IconSettings;
};

// Helper function to get icon for requirement
const getRequirementIcon = (requirement: string) => {
    const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
        paramedics: IconHeart,
        guides: IconUser,
        security_companies: IconSettings,
        external_entertainment_companies: IconAward,
    };
    return iconMap[requirement] || IconUser;
};

export default function TripPlannerDashboard() {
    const { t } = getTranslation();
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isAdminUser, setIsAdminUser] = useState(false); // Track if user is admin (for admin override features)
    const [currentView, setCurrentView] = useState<'dashboard' | 'destinations' | 'service-booking'>('dashboard');
    const [selectedBookingType, setSelectedBookingType] = useState<BookingType | null>(null);
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(false);

    // Dynamic filter options from database
    const [availableProperties, setAvailableProperties] = useState<Array<{ value: string; icon: string | null }>>([]);
    const [availableSuitableFor, setAvailableSuitableFor] = useState<Array<{ value: string }>>([]);

    // New trip dropdown state
    const [showTripDropdown, setShowTripDropdown] = useState(false);

    // Filter states
    const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
    const [selectedSuitableFor, setSuitableFor] = useState<string[]>([]);
    const [selectedZones, setSelectedZones] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // Modal state
    const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Requirements selection state
    const [showRequirementsSection, setShowRequirementsSection] = useState(false);
    const [selectedForPlanning, setSelectedForPlanning] = useState<Destination | null>(null);
    const [paramedics, setParamedics] = useState<Paramedic[]>([]);
    const [guides, setGuides] = useState<Guide[]>([]);
    const [securityCompanies, setSecurityCompanies] = useState<SecurityCompany[]>([]);
    const [entertainmentCompanies, setEntertainmentCompanies] = useState<ExternalEntertainmentCompany[]>([]);
    const [travelCompanies, setTravelCompanies] = useState<TravelCompany[]>([]);
    const [selectedRequirements, setSelectedRequirements] = useState<RequirementSelection[]>([]);
    const [totalPrice, setTotalPrice] = useState<number>(0);

    // Admin override state for school/user selection
    const [allSchools, setAllSchools] = useState<any[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    // Checkout modal states
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [paymentStep, setPaymentStep] = useState<'payment' | 'confirmation' | 'success'>('payment');
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [bookingReference, setBookingReference] = useState<string>('');

    // Filtered destinations
    const [filteredDestinations, setFilteredDestinations] = useState<Destination[]>([]);

    // Dashboard sections state
    const [topDestinations, setTopDestinations] = useState<Destination[]>([]);
    const [bestDeals, setBestDeals] = useState<Destination[]>([]);
    const [upcomingTrips, setUpcomingTrips] = useState<any[]>([]);
    const [previousTrips, setPreviousTrips] = useState<any[]>([]);
    const [previousPayments, setPreviousPayments] = useState<any[]>([]);
    const [dashboardLoading, setDashboardLoading] = useState(true); // TRUE BY DEFAULT!

    // Tabbed destinations state
    const [mostVisitedDestinations, setMostVisitedDestinations] = useState<Destination[]>([]);
    const [topRatedDestinations, setTopRatedDestinations] = useState<Destination[]>([]);
    const [latestDestinations, setLatestDestinations] = useState<Destination[]>([]);

    // Trip details state (number of students, crew, buses)
    const [numberOfStudents, setNumberOfStudents] = useState<number>();
    const [numberOfCrew, setNumberOfCrew] = useState<number>();
    const [numberOfBuses, setNumberOfBuses] = useState<number>();

    // Booking type configurations
    const bookingTypeConfigs: BookingTypeConfig[] = [
        {
            id: 'full_trip',
            title: t('full_trip'),
            description: t('complete_trip_with_destination_and_services'),
            icon: IconStar,
            color: 'from-blue-500 to-blue-600',
            shadowColor: 'shadow-blue-500/25',
            requiredServices: [],
            allowsDestination: true,
            requiresDestination: true,
        },
        {
            id: 'guides_only',
            title: t('guides_only'),
            description: t('professional_tour_guides_only'),
            icon: IconUsers,
            color: 'from-green-500 to-green-600',
            shadowColor: 'shadow-green-500/25',
            requiredServices: ['guides'],
            allowsDestination: false,
            requiresDestination: false,
        },
        {
            id: 'paramedics_only',
            title: t('paramedics_only'),
            description: t('medical_assistance_only'),
            icon: IconHeart,
            color: 'from-red-500 to-red-600',
            shadowColor: 'shadow-red-500/25',
            requiredServices: ['paramedics'],
            allowsDestination: false,
            requiresDestination: false,
        },
        {
            id: 'security_only',
            title: t('security_only'),
            description: t('security_services_only'),
            icon: IconLock,
            color: 'from-yellow-500 to-yellow-600',
            shadowColor: 'shadow-yellow-500/25',
            requiredServices: ['security_companies'],
            allowsDestination: false,
            requiresDestination: false,
        },
        {
            id: 'entertainment_only',
            title: t('entertainment_only'),
            description: t('entertainment_services_only'),
            icon: IconPlayCircle,
            color: 'from-purple-500 to-purple-600',
            shadowColor: 'shadow-purple-500/25',
            requiredServices: ['external_entertainment_companies'],
            allowsDestination: false,
            requiresDestination: false,
        },
        {
            id: 'transportation_only',
            title: t('transportation_only'),
            description: t('travel_and_transportation_only'),
            icon: IconCar,
            color: 'from-indigo-500 to-indigo-600',
            shadowColor: 'shadow-indigo-500/25',
            requiredServices: ['travel_companies'],
            allowsDestination: false,
            requiresDestination: false,
        },
        {
            id: 'education_only',
            title: t('education_only'),
            description: t('education_programs_only'),
            icon: IconBook,
            color: 'from-emerald-500 to-emerald-600',
            shadowColor: 'shadow-emerald-500/25',
            requiredServices: ['education_programs'],
            allowsDestination: false,
            requiresDestination: false,
        },
    ];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showTripDropdown) {
                setShowTripDropdown(false);
            }
        };

        if (showTripDropdown) {
            document.addEventListener('click', handleClickOutside);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [showTripDropdown]);

    // Fetch filter options from database
    useEffect(() => {
        const fetchFilterOptions = async () => {
            try {
                const [{ data: propertiesData }, { data: suitableForData }] = await Promise.all([
                    supabase.from('destination_properties').select('value, icon').eq('is_active', true).order('display_order'),
                    supabase.from('suitable_for_options').select('value').eq('is_active', true).order('display_order'),
                ]);

                setAvailableProperties(propertiesData || []);
                setAvailableSuitableFor(suitableForData || []);
            } catch (error) {
                console.error('Error loading filter options:', error);
            }
        };
        fetchFilterOptions();
    }, []);

    // Fetch current user and check if admin
    useEffect(() => {
        const fetchUser = async () => {
            const { user, error } = await getCurrentUserWithRole();
            if (!error && user) {
                setCurrentUser(user);
                // Check if user is admin (for admin override functionality)
                const isAdmin = user.user_roles?.name === 'admin';
                setIsAdminUser(isAdmin);

                // If admin, fetch schools and users for selection
                if (isAdmin) {
                    const [{ data: schools }, { data: users }] = await Promise.all([
                        supabase.from('schools').select('id, name').eq('status', 'active'),
                        supabase.from('users').select('id, full_name, school_id').eq('is_active', true),
                    ]);
                    setAllSchools(schools || []);
                    setAllUsers(users || []);
                }
            }
        };
        fetchUser();
    }, []);

    useEffect(() => {
        if (currentView === 'destinations') {
            loadDestinations();
            loadZones(); // Load zones when switching to destinations view
        } else if (currentView === 'dashboard' && currentUser?.id) {
            loadDashboardData();
        } else if (currentView === 'service-booking') {
            loadRequirementsData();
        }
    }, [currentView, currentUser]);

    useEffect(() => {
        // Load dashboard data when component mounts and user is authenticated
        if (currentView === 'dashboard' && currentUser?.id) {
            loadDashboardData();
        }
    }, [currentUser]);

    useEffect(() => {
        // Apply filters
        let filtered = destinations;

        if (selectedZones.length > 0) {
            filtered = filtered.filter((dest) => dest.zone_id && selectedZones.includes(dest.zone_id));
        }

        if (selectedProperties.length > 0) {
            filtered = filtered.filter((dest) => dest.properties_details?.some((prop) => selectedProperties.includes(prop.value)) ?? false);
        }

        if (selectedSuitableFor.length > 0) {
            filtered = filtered.filter((dest) => dest.suitable_for_details?.some((suitable) => selectedSuitableFor.includes(suitable.value)) ?? false);
        }

        setFilteredDestinations(filtered);
    }, [destinations, selectedProperties, selectedSuitableFor, selectedZones]);

    const loadDestinations = async () => {
        try {
            setLoading(true);
            const { data: destData, error: destError } = await supabase
                .from('destinations_with_details')
                .select('id, name, address, zone_id, thumbnail_path, gallery_paths, properties_details, suitable_for_details, requirements, pricing')
                .order('name');

            if (destError) throw destError;

            setDestinations(destData || []);
        } catch (error) {
            console.error('Error loading destinations:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadZones = async () => {
        try {
            const { data: zoneData, error: zoneError } = await supabase.from('zones').select('id, name').eq('is_active', true);

            if (zoneError) throw zoneError;

            setZones(zoneData || []);
        } catch (error) {
            console.error('Error loading zones:', error);
        }
    };

    const loadRequirementsData = async () => {
        try {
            const [
                { data: paramedicsData, error: paramedicsError },
                { data: guidesData, error: guidesError },
                { data: securityData, error: securityError },
                { data: entertainmentData, error: entertainmentError },
                { data: travelData, error: travelError },
            ] = await Promise.all([
                // Paramedics: id, name, phone, email, hourly_rate, daily_rate, status
                supabase.from('paramedics').select('id, name, phone, email, hourly_rate, daily_rate, status').eq('status', 'active'),
                // Guides: id, name, phone, email, hourly_rate, daily_rate, status
                supabase.from('guides').select('id, name, phone, email, hourly_rate, daily_rate, status').eq('status', 'active'),
                // Security companies: id, name, phone, email, hourly_rate, daily_rate, status
                supabase.from('security_companies').select('id, name, phone, email, hourly_rate, daily_rate, status').eq('status', 'active'),
                // Entertainment companies: id, name, price, description, status
                supabase.from('external_entertainment_companies').select('id, name, price, description, status').eq('status', 'active'),
                // Travel companies: id, name, phone, email, pricing_data, status
                supabase.from('travel_companies').select('id, name, phone, email, pricing_data, status').eq('status', 'active'),
            ]);

            if (paramedicsError) throw paramedicsError;
            if (guidesError) throw guidesError;
            if (securityError) throw securityError;
            if (entertainmentError) throw entertainmentError;
            if (travelError) throw travelError;

            setParamedics(paramedicsData || []);
            setGuides(guidesData || []);
            setSecurityCompanies(securityData || []);
            setEntertainmentCompanies(entertainmentData || []);
            setTravelCompanies(travelData || []);
        } catch (error) {
            console.error('Error loading requirements data:', error);
        }
    };

    const loadDashboardData = async () => {
        // Security check: Only load dashboard data if user is authenticated
        if (!currentUser?.id) {
            console.warn('Cannot load dashboard data: User not authenticated');
            return;
        }

        try {
            setDashboardLoading(true);

            // Load top destinations (most popular based on booking count)
            const { data: topDestData, error: topDestError } = await supabase
                .from('destinations_with_details')
                .select('id, name, address, zone_id, thumbnail_path, gallery_paths, properties_details, suitable_for_details, requirements, pricing')
                .eq('is_active', true)
                .limit(6);

            if (topDestError) throw topDestError;

            // Load best deals (destinations with special pricing or featured)
            const { data: bestDealsData, error: bestDealsError } = await supabase
                .from('destinations_with_details')
                .select('id, name, address, zone_id, thumbnail_path, gallery_paths, properties_details, suitable_for_details, requirements, pricing')
                .eq('is_active', true)
                .not('pricing', 'is', null)
                .limit(6);

            if (bestDealsError) throw bestDealsError;

            // Load user's upcoming trips (bookings with future trip_date)
            const today = new Date().toISOString().split('T')[0];
            const { data: upcomingData, error: upcomingError } = await supabase
                .from('bookings')
                .select(
                    `
                    id, booking_reference, trip_date, total_amount, status, payment_status,
                    destinations!bookings_destination_id_fkey(name, address, thumbnail_path)
                `,
                )
                .eq('customer_id', currentUser?.id) // Filter by current user
                .gte('trip_date', today)
                .in('status', ['confirmed', 'pending'])
                .order('trip_date', { ascending: true })
                .limit(5);

            if (upcomingError) throw upcomingError;

            // Load user's previous trips (completed bookings)
            const { data: previousData, error: previousError } = await supabase
                .from('bookings')
                .select(
                    `
                    id, booking_reference, trip_date, total_amount, status, payment_status,
                    destinations!bookings_destination_id_fkey(name, address, thumbnail_path)
                `,
                )
                .eq('customer_id', currentUser?.id) // Filter by current user
                .lt('trip_date', today)
                .in('status', ['completed', 'confirmed'])
                .order('trip_date', { ascending: false })
                .limit(5);

            if (previousError) throw previousError;

            // Load user's payment history
            // Note: payments table doesn't have customer_id, need to filter through bills->bookings relationship
            const { data: paymentsData, error: paymentsError } = await supabase
                .from('payments')
                .select(
                    `
                    id, amount, payment_type, payment_date,
                    bills!payments_bill_id_fkey(
                        bill_number, total_amount,
                        bookings!bills_booking_id_fkey(
                            booking_reference, customer_id,
                            destinations!bookings_destination_id_fkey(name)
                        )
                    )
                `,
                )
                .order('payment_date', { ascending: false });

            if (paymentsError) throw paymentsError;

            // Filter payments by customer_id on the client side (since we can't filter through nested relationships in Supabase)
            const userPayments =
                paymentsData
                    ?.filter((payment: any) => {
                        return payment.bills?.bookings?.customer_id === currentUser?.id;
                    })
                    .slice(0, 5) || [];

            // Load entertainment companies for the dashboard
            const { data: entertainmentData, error: entertainmentError } = await supabase
                .from('external_entertainment_companies')
                .select('id, name, image, description, price, status')
                .eq('status', 'active')
                .limit(10);

            if (entertainmentError) console.error('Error loading entertainment companies:', entertainmentError);

            setTopDestinations(topDestData || []);
            setBestDeals(bestDealsData || []);
            setUpcomingTrips(upcomingData || []);
            setPreviousTrips(previousData || []);
            setPreviousPayments(userPayments);
            setEntertainmentCompanies(entertainmentData || []);

            // Derive tabbed destinations categories
            const allDests = topDestData || [];
            setMostVisitedDestinations(allDests.slice(0, 8));
            setTopRatedDestinations([...allDests].sort((a, b) => (a.name || '').localeCompare(b.name || '')).slice(0, 8));
            setLatestDestinations([...allDests].sort((a, b) => (b.id || '').localeCompare(a.id || '')).slice(0, 8));
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setDashboardLoading(false);
        }
    };

    const handleSelectForPlanning = (destination: Destination) => {
        setSelectedForPlanning(destination);
        setShowRequirementsSection(true);
        setSelectedRequirements([]);
        setTotalPrice(0);
        if (paramedics.length === 0) {
            loadRequirementsData();
        }
        // Scroll to requirements section
        setTimeout(() => {
            document.getElementById('requirements-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const calculateTotalPrice = (requirements: RequirementSelection[]) => {
        // Convert requirements to ServiceSelection format for the pricing utility
        const serviceSelections: ServiceSelection[] = requirements.map((req) => {
            let service: any = null;
            let unitPrice = 0;

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

            return {
                id: req.id,
                name: req.name,
                type: req.type,
                quantity: req.quantity,
                days: req.rate_type === 'hourly' ? 0 : req.days || 1,
                hours: req.rate_type === 'hourly' ? req.hours || 1 : 0,
                unitPrice: unitPrice,
                rateType: req.rate_type as RateType,
                subServices: [], // Sub-services will be handled separately
            };
        });

        // Use the new pricing utility
        // Convert pricing to match DestinationPricing type
        const destinationPricing = selectedForPlanning?.pricing
            ? {
                  student: selectedForPlanning.pricing.student || 0,
                  crew: selectedForPlanning.pricing.crew || 0,
              }
            : null;

        const result = calculateBookingPrice(destinationPricing, numberOfStudents || 0, numberOfCrew || 0, serviceSelections);

        return result.totalPrice;
    };

    // Handle requirements selection
    const selectParamedic = (paramedic: Paramedic) => {
        if (isSelected('paramedics', paramedic.id)) {
            // Remove if already selected
            setSelectedRequirements((prev) => prev.filter((req) => !(req.type === 'paramedics' && req.id === paramedic.id)));
        } else {
            // Add new selection
            setSelectedRequirements((prev) => [
                ...prev,
                {
                    type: 'paramedics',
                    id: paramedic.id,
                    name: paramedic.name,
                    quantity: 1,
                    rate_type: 'daily',
                    cost: paramedic.daily_rate,
                    days: 1,
                },
            ]);
        }
    };

    const selectGuide = (guide: Guide) => {
        if (isSelected('guides', guide.id)) {
            // Remove if already selected
            setSelectedRequirements((prev) => prev.filter((req) => !(req.type === 'guides' && req.id === guide.id)));
        } else {
            // Add new selection
            setSelectedRequirements((prev) => [
                ...prev,
                {
                    type: 'guides',
                    id: guide.id,
                    name: guide.name,
                    quantity: 1,
                    rate_type: 'daily',
                    cost: guide.daily_rate,
                    days: 1,
                },
            ]);
        }
    };

    const selectSecurity = (security: SecurityCompany) => {
        if (isSelected('security_companies', security.id)) {
            // Remove if already selected
            setSelectedRequirements((prev) => prev.filter((req) => !(req.type === 'security_companies' && req.id === security.id)));
        } else {
            // Add new selection with actual daily rate
            setSelectedRequirements((prev) => [
                ...prev,
                {
                    type: 'security_companies',
                    id: security.id,
                    name: security.name,
                    quantity: 1,
                    rate_type: 'daily',
                    cost: security.daily_rate,
                    days: 1,
                },
            ]);
        }
    };

    const selectTravelCompany = (travelCompany: TravelCompany) => {
        if (isSelected('travel_companies', travelCompany.id)) {
            // Remove if already selected
            setSelectedRequirements((prev) => prev.filter((req) => !(req.type === 'travel_companies' && req.id === travelCompany.id)));
        } else {
            // Add new selection with default pricing
            const defaultPrice = travelCompany.pricing_data?.default_price || 100;
            setSelectedRequirements((prev) => [
                ...prev,
                {
                    type: 'travel_companies',
                    id: travelCompany.id,
                    name: travelCompany.name,
                    quantity: 1,
                    rate_type: 'daily',
                    cost: defaultPrice,
                    days: 1,
                },
            ]);
        }
    };

    const selectEntertainment = (entertainment: ExternalEntertainmentCompany) => {
        if (isSelected('external_entertainment_companies', entertainment.id)) {
            // Remove if already selected
            setSelectedRequirements((prev) => prev.filter((req) => !(req.type === 'external_entertainment_companies' && req.id === entertainment.id)));
        } else {
            // Add new selection
            setSelectedRequirements((prev) => [
                ...prev,
                {
                    type: 'external_entertainment_companies',
                    id: entertainment.id,
                    name: entertainment.name,
                    quantity: 1,
                    rate_type: 'fixed',
                    cost: entertainment.price,
                },
            ]);
        }
    };

    const removeRequirement = (index: number) => {
        setSelectedRequirements((prev) => prev.filter((_, i) => i !== index));
    };

    const isSelected = (type: string, id: string) => {
        return selectedRequirements.some((req) => req.type === type && req.id === id);
    };

    // Update requirement rate type
    const updateRequirementRateType = (index: number, rateType: 'hourly' | 'daily' | 'regional' | 'overnight' | 'fixed') => {
        setSelectedRequirements((prev) =>
            prev.map((req, i) => {
                if (i !== index) return req;

                // Update rate type and cost based on the service
                let newCost = req.cost;

                // Find the service and get the appropriate rate
                if (req.type === 'paramedics') {
                    const paramedic = paramedics.find((p) => p.id === req.id);
                    if (paramedic) {
                        if (rateType === 'hourly') newCost = paramedic.hourly_rate;
                        else if (rateType === 'daily') newCost = paramedic.daily_rate;
                        else if (rateType === 'regional') newCost = paramedic.daily_rate * 1.5;
                        else if (rateType === 'overnight') newCost = paramedic.daily_rate * 2;
                    }
                } else if (req.type === 'guides') {
                    const guide = guides.find((g) => g.id === req.id);
                    if (guide) {
                        if (rateType === 'hourly') newCost = guide.hourly_rate;
                        else if (rateType === 'daily') newCost = guide.daily_rate;
                        else if (rateType === 'regional') newCost = guide.daily_rate * 1.5;
                        else if (rateType === 'overnight') newCost = guide.daily_rate * 2;
                    }
                } else if (req.type === 'security_companies') {
                    const security = securityCompanies.find((s) => s.id === req.id);
                    if (security) {
                        if (rateType === 'hourly') newCost = security.hourly_rate;
                        else if (rateType === 'daily') newCost = security.daily_rate;
                        else if (rateType === 'regional') newCost = security.daily_rate * 1.5;
                        else if (rateType === 'overnight') newCost = security.daily_rate * 2;
                    }
                }

                return { ...req, rate_type: rateType, cost: newCost };
            }),
        );
    };

    // Validation function to check if all required services are selected
    const validateRequiredServices = () => {
        const missingServices: string[] = [];

        // Check trip details for full trip bookings
        if (selectedBookingType === 'full_trip' || !selectedBookingType) {
            if (numberOfStudents === 0) {
                missingServices.push(t('number_of_students'));
            }
            if (numberOfCrew === 0) {
                missingServices.push(t('number_of_crew'));
            }
        }

        // Get current booking type config
        const currentBookingConfig = selectedBookingType ? bookingTypeConfigs.find((config) => config.id === selectedBookingType) : null;

        // For full trip bookings, check destination requirement
        if (currentBookingConfig?.requiresDestination && !selectedForPlanning) {
            missingServices.push(t('destination'));
        }

        // Check required services based on booking type
        if (currentBookingConfig?.requiredServices && currentBookingConfig.requiredServices.length > 0) {
            currentBookingConfig.requiredServices.forEach((requiredService) => {
                const hasSelectedService = selectedRequirements.some((selected) => selected.type === requiredService);
                if (!hasSelectedService) {
                    switch (requiredService) {
                        case 'paramedics':
                            missingServices.push(t('paramedics'));
                            break;
                        case 'guides':
                            missingServices.push(t('guides'));
                            break;
                        case 'security_companies':
                            missingServices.push(t('security'));
                            break;
                        case 'external_entertainment_companies':
                            missingServices.push(t('entertainment'));
                            break;
                        case 'travel_companies':
                            missingServices.push(t('transportation'));
                            break;
                    }
                }
            });
        } else if (selectedBookingType === 'education_only' && selectedRequirements.length === 0) {
            // For education only, at least one service must be selected
            missingServices.push(t('at_least_one_service'));
        } else if (!currentBookingConfig && selectedForPlanning?.requirements && selectedForPlanning.requirements.length > 0) {
            // Fallback to destination requirements for legacy full trip mode
            const requiredServices = selectedForPlanning.requirements;

            requiredServices.forEach((requirement) => {
                const hasSelectedService = selectedRequirements.some((selected) => selected.type === requirement);
                if (!hasSelectedService) {
                    // Convert requirement type to human readable name
                    let serviceName = '';
                    switch (requirement) {
                        case 'paramedics':
                            serviceName = t('paramedics');
                            break;
                        case 'guides':
                            serviceName = t('guides');
                            break;
                        case 'security_companies':
                            serviceName = t('security');
                            break;
                        case 'external_entertainment_companies':
                            serviceName = t('entertainment');
                            break;
                        case 'travel_companies':
                            serviceName = t('transportation');
                            break;
                        default:
                            serviceName = requirement;
                    }
                    missingServices.push(serviceName);
                }
            });
        }

        return {
            isValid: missingServices.length === 0,
            missingServices,
        };
    };

    // Checkout functions
    const openCheckout = () => {
        // Validation is now handled by the disabled state of the button
        // Only open checkout if button is clickable (i.e., all validations pass)
        const validation = getValidationErrors();
        if (validation.isValid) {
            setShowCheckoutModal(true);
            setPaymentStep('payment');
        }
    };

    // Comprehensive validation function that returns all errors
    const getValidationErrors = () => {
        const errors: string[] = [];

        // 1. Validate date selection
        if (!selectedDate) {
            errors.push(t('trip_date'));
        }

        // 2. Validate number of students/crew - ONLY for full_trip booking type
        if (selectedBookingType === 'full_trip') {
            if (!numberOfStudents || numberOfStudents <= 0) {
                errors.push(t('number_of_students'));
            }
            if (!numberOfCrew || numberOfCrew <= 0) {
                errors.push(t('number_of_crew'));
            }
        }

        // 3. Validate admin selections if user is admin
        if (isAdminUser) {
            if (!selectedSchoolId) {
                errors.push(t('select_school'));
            }
            if (!selectedUserId) {
                errors.push(t('select_user'));
            }
        }

        // 4. Validate required services
        const validation = validateRequiredServices();
        if (!validation.isValid) {
            errors.push(...validation.missingServices);
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    };

    const closeCheckout = () => {
        setShowCheckoutModal(false);
        setPaymentStep('payment');
        setIsProcessingPayment(false);
    };

    const handlePaymentSubmit = async () => {
        // Prevent multiple submissions
        if (isProcessingPayment) {
            console.log('Payment already in progress, ignoring duplicate submission');
            return;
        }

        setIsProcessingPayment(true);

        try {
            console.log('Starting booking creation process...');

            // Validate that we have a current user
            if (!currentUser?.id) {
                throw new Error('User not authenticated or user ID not available');
            }

            // Admin validation: ensure school and user are selected
            if (isAdminUser) {
                if (!selectedSchoolId || !selectedUserId) {
                    alert(t('admin_must_select_school_and_user'));
                    setIsProcessingPayment(false);
                    return;
                }
            }

            // Determine school_id and customer_id for booking
            let school_id = null;
            let customer_id = null;

            if (isAdminUser) {
                // Admin: use selected school and user
                school_id = selectedSchoolId;
                customer_id = selectedUserId;
            } else {
                // Non-admin: use current user's school and id
                school_id = currentUser?.school_id;
                customer_id = currentUser?.id;
            }

            // Generate booking type prefix
            const getBookingTypePrefix = (type: BookingType): string => {
                const prefixMap: Record<BookingType, string> = {
                    full_trip: 'FT',
                    guides_only: 'GU',
                    paramedics_only: 'PM',
                    security_only: 'SC',
                    entertainment_only: 'EN',
                    transportation_only: 'TR',
                    education_only: 'ED',
                };
                return prefixMap[type] || 'BK';
            };

            // Generate unique booking reference to prevent collisions
            const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
            const random = Math.floor(Math.random() * 100)
                .toString()
                .padStart(2, '0');
            const bookingTypePrefix = getBookingTypePrefix(selectedBookingType || 'full_trip');
            const uniqueBookingRef = `${bookingTypePrefix}${timestamp}${random}`; // Prefix + 6 digits + 2 digits
            console.log('Generated booking reference:', uniqueBookingRef);
            console.log('Current user:', currentUser);
            console.log('School ID:', school_id);
            console.log('Customer ID:', customer_id);

            // Create booking record using the correct database schema
            const bookingData = {
                booking_reference: uniqueBookingRef,
                booking_type: selectedBookingType || 'full_trip',
                destination_id: selectedForPlanning?.id || null,
                customer_id,
                school_id,
                trip_date: selectedDate?.toISOString().split('T')[0],
                total_amount: totalPrice,
                payment_status: 'paid',
                payment_method: 'bank_transfer',
                status: 'pending',
                notes: `Booking created via trip planner - Type: ${selectedBookingType || 'full_trip'}`,
                number_of_students: numberOfStudents || null,
                number_of_crew: numberOfCrew || null,
            };

            console.log('Creating booking with data:', bookingData);
            const { data: booking, error: bookingError } = await supabase.from('bookings').insert([bookingData]).select().single();

            if (bookingError) {
                console.error('Error creating booking:', bookingError);
                setIsProcessingPayment(false); // Reset processing state on error
                throw bookingError;
            }

            console.log('Booking created successfully:', booking);

            // Create individual service records in booking_services table
            if (selectedRequirements.length > 0) {
                // All service types are now supported in booking_services table
                const allowedServiceTypes = ['guides', 'paramedics', 'security_companies', 'external_entertainment_companies', 'travel_companies', 'education_programs'];
                const validServiceRecords = selectedRequirements
                    .filter((requirement) => allowedServiceTypes.includes(requirement.type))
                    .map((requirement) => ({
                        booking_id: booking.id,
                        service_type: requirement.type,
                        service_id: requirement.id,
                        quantity: requirement.quantity,
                        days: requirement.days || 1,
                        booked_price: requirement.cost,
                        rate_type: requirement.rate_type || 'fixed',
                    }));

                if (validServiceRecords.length > 0) {
                    const { error: servicesError } = await supabase.from('booking_services').insert(validServiceRecords);

                    if (servicesError) {
                        console.error('Error creating service records:', servicesError);
                        throw servicesError;
                    }

                    console.log('Successfully created booking services:', validServiceRecords);
                }
            }

            // Store booking reference for success display
            setBookingReference(booking.booking_reference);

            // Simulate processing delay
            setTimeout(() => {
                setIsProcessingPayment(false);
                setPaymentStep('success');
            }, 2000);
        } catch (error) {
            console.error('Error processing booking:', error);
            setIsProcessingPayment(false);
            alert('Error processing booking. Please try again.');
        }
    };

    const handleBookingComplete = () => {
        // Reset all selections
        setSelectedRequirements([]);
        setTotalPrice(0);
        setSelectedForPlanning(null);
        setSelectedDate(null);
        setSelectedBookingType(null);
        setShowRequirementsSection(false);
        setBookingReference('');
        // Reset trip details
        setNumberOfStudents(0);
        setNumberOfCrew(0);
        setNumberOfBuses(0);
        setCurrentView('dashboard');
        closeCheckout();
    };

    // Helper function to determine if a service type should be shown based on booking type
    const shouldShowServiceType = (serviceType: string) => {
        // For full_trip bookings with a selected destination, check destination requirements
        if (selectedBookingType === 'full_trip' && selectedForPlanning?.requirements) {
            return selectedForPlanning.requirements.includes(serviceType);
        }

        // For legacy full trip mode (no booking type selected) with a destination
        if (!selectedBookingType && selectedForPlanning?.requirements) {
            return selectedForPlanning.requirements.includes(serviceType);
        }

        // For service-only bookings, check booking type configuration
        if (selectedBookingType && selectedBookingType !== 'full_trip') {
            const config = bookingTypeConfigs.find((c) => c.id === selectedBookingType);

            if (config?.requiredServices.length === 0) {
                // For education_only, show all services
                return true;
            }

            // For specific service types, only show the required service
            return config?.requiredServices.includes(serviceType) || false;
        }

        // Default: show all services (fallback for legacy or undefined states)
        return true;
    };

    useEffect(() => {
        const newTotal = calculateTotalPrice(selectedRequirements);
        setTotalPrice(newTotal);
    }, [selectedRequirements, paramedics, guides, securityCompanies, entertainmentCompanies, travelCompanies, numberOfStudents, numberOfCrew, selectedForPlanning]);

    const togglePropertyFilter = (property: string) => {
        setSelectedProperties((prev) => (prev.includes(property) ? prev.filter((p) => p !== property) : [...prev, property]));
    };

    const toggleSuitableForFilter = (suitable: string) => {
        setSuitableFor((prev) => (prev.includes(suitable) ? prev.filter((s) => s !== suitable) : [...prev, suitable]));
    };

    const toggleZoneFilter = (zoneId: string) => {
        setSelectedZones((prev) => (prev.includes(zoneId) ? prev.filter((z) => z !== zoneId) : [...prev, zoneId]));
    };

    const openDestinationModal = (destination: Destination) => {
        setSelectedDestination(destination);
        setIsModalOpen(true);
    };

    const closeDestinationModal = () => {
        setIsModalOpen(false);
        setSelectedDestination(null);
    };

    const getZoneName = (zoneId: string | null) => {
        if (!zoneId) return t('no_zone');
        const zone = zones.find((z) => z.id === zoneId);
        return zone?.name || t('unknown_zone');
    };

    // Trip options for dropdown
    const tripOptions = [
        {
            id: 'full-trip',
            title: t('full_trip'),
            description: t('complete_trip_planning'),
            icon: IconStar,
            color: 'from-blue-500 to-blue-600',
            onClick: () => {
                setSelectedBookingType('full_trip');
                setCurrentView('destinations');
                setShowTripDropdown(false);
            },
        },
        {
            id: 'paramedics',
            title: t('paramedics'),
            description: t('medical_services'),
            icon: IconHeart,
            color: 'from-red-500 to-red-600',
            onClick: () => {
                setSelectedBookingType('paramedics_only');
                setCurrentView('service-booking');
                setShowTripDropdown(false);
            },
        },
        {
            id: 'guides',
            title: t('guides'),
            description: t('tour_guides'),
            icon: IconUsers,
            color: 'from-green-500 to-green-600',
            onClick: () => {
                setSelectedBookingType('guides_only');
                setCurrentView('service-booking');
                setShowTripDropdown(false);
            },
        },
        {
            id: 'security',
            title: t('security'),
            description: t('security_services'),
            icon: IconLock,
            color: 'from-yellow-500 to-yellow-600',
            onClick: () => {
                setSelectedBookingType('security_only');
                setCurrentView('service-booking');
                setShowTripDropdown(false);
            },
        },
        {
            id: 'entertainment',
            title: t('entertainment'),
            description: t('entertainment_services'),
            icon: IconPlayCircle,
            color: 'from-purple-500 to-purple-600',
            onClick: () => {
                setSelectedBookingType('entertainment_only');
                setCurrentView('service-booking');
                setShowTripDropdown(false);
            },
        },
        {
            id: 'travel-companies',
            title: t('travel_companies'),
            description: t('transportation_services'),
            icon: IconCar,
            color: 'from-indigo-500 to-indigo-600',
            onClick: () => {
                setSelectedBookingType('transportation_only');
                setCurrentView('service-booking');
                setShowTripDropdown(false);
            },
        },
    ];

    const shortcuts = [
        {
            id: 'new-booking',
            title: t('new_booking'),
            description: t('start_planning_new_booking'),
            iconImage: '/assets/shortcuts-icons/add.png',
            color: 'from-blue-500 to-blue-600',
            shadowColor: 'shadow-blue-500/25',
            onClick: () => setShowTripDropdown(!showTripDropdown),
            hasDropdown: true,
        },
        {
            id: 'my-bookings',
            title: t('my_bookings'),
            description: t('view_manage_bookings'),
            iconImage: '/assets/shortcuts-icons/calendar.png',
            color: 'from-green-500 to-green-600',
            shadowColor: 'shadow-green-500/25',
            onClick: () => router.push('/my-bookings'),
        },
        {
            id: 'transactions',
            title: t('my_transactions'),
            description: t('view_payment_history'),
            iconImage: '/assets/shortcuts-icons/cards.png',
            color: 'from-purple-500 to-purple-600',
            shadowColor: 'shadow-purple-500/25',
            onClick: () => router.push('/my-transactions'),
        },
        {
            id: 'profile',
            title: t('my_profile'),
            description: t('manage_account_settings'),
            iconImage: '/assets/shortcuts-icons/profile.png',
            color: 'from-orange-500 to-orange-600',
            shadowColor: 'shadow-orange-500/25',
            onClick: () => router.push('/my-profile'),
        },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.6,
                staggerChildren: 0.1,
            },
        },
        exit: {
            opacity: 0,
            x: -50,
            transition: { duration: 0.3 },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: 'spring' as const,
                stiffness: 100,
                damping: 15,
            },
        },
    };

    const cardVariants = {
        hidden: { scale: 0.8, opacity: 0 },
        visible: {
            scale: 1,
            opacity: 1,
            transition: {
                type: 'spring' as const,
                stiffness: 100,
                damping: 15,
            },
        },
        hover: {
            scale: 1.05,
            y: -10,
            transition: {
                type: 'spring' as const,
                stiffness: 400,
                damping: 25,
            },
        },
    };

    return (
        <div
            className="min-h-screen bg-gradient-to-br overflow-x-hidden from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20"
            dir={t('direction') || 'rtl'}
        >
            <AnimatePresence mode="wait">
                {currentView === 'dashboard' && (
                    <motion.div key="dashboard" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="container mx-auto px-6 py-12">
                        {/* Welcome Header */}
                        <motion.div variants={itemVariants} className="text-center mb-12">
                            <motion.h1
                                className="text-2xl md:text-2xl lg:text-4xl text-left rtl:text-right font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-2"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.8, type: 'spring' }}
                            >
                                {(() => {
                                    const hour = new Date().getHours();
                                    let greeting = '';
                                    if (hour >= 5 && hour < 12) {
                                        greeting = t('good_morning');
                                    } else if (hour >= 12 && hour < 17) {
                                        greeting = t('good_afternoon');
                                    } else {
                                        greeting = t('good_evening');
                                    }
                                    return `${greeting}, ${currentUser?.full_name || ''}`;
                                })()}
                            </motion.h1>
                        </motion.div>

                        {/* Action Shortcuts Grid */}
                        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mx-auto">
                            {shortcuts.map((shortcut, index) => (
                                <motion.div
                                    key={shortcut.id}
                                    variants={cardVariants}
                                    whileHover="hover"
                                    whileTap={{ scale: 0.95 }}
                                    className={`relative group cursor-pointer ${shortcut.hasDropdown && showTripDropdown ? 'z-50' : ''}`}
                                    onClick={shortcut.onClick}
                                    style={{
                                        animationDelay: `${index * 0.1}s`,
                                    }}
                                >
                                    <div
                                        className={`absolute inset-0 bg-gradient-to-r ${shortcut.color} rounded-xl blur-lg opacity-25 group-hover:opacity-40 transition-all duration-300 ${shortcut.shadowColor} shadow-xl`}
                                    ></div>
                                    <div className="relative bg-white dark:bg-slate-900/80 rounded-xl p-4 md:p-6 border border-gray-200/50 dark:border-slate-700/60 backdrop-blur-sm hover:border-gray-300 dark:hover:border-slate-600 transition-all duration-300">
                                        <div
                                            className={`w-12 h-12 md:w-14 md:h-14 bg-transparent rounded-xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300`}
                                        >
                                            <img src={shortcut.iconImage} alt={shortcut.title} className="h-6 w-6 md:h-11 md:w-11 object-contain" />
                                        </div>
                                        <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                                            {shortcut.title}
                                        </h3>
                                        <p
                                            className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed overflow-hidden"
                                            style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
                                        >
                                            {shortcut.description}
                                        </p>

                                        {/* Dropdown for New Trip */}
                                        <AnimatePresence>
                                            {shortcut.hasDropdown && showTripDropdown && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    transition={{ duration: 0.2, ease: 'easeOut' }}
                                                    className="absolute top-full left-0 right-0 mt-2 md:w-[400px] w-[300px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-slate-700/60 backdrop-blur-xl overflow-hidden"
                                                    style={{ zIndex: 9999 }}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className="p-2">
                                                        {tripOptions.map((option, optionIndex) => (
                                                            <motion.div
                                                                key={option.id}
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: optionIndex * 0.05, duration: 0.2 }}
                                                                onClick={option.onClick}
                                                                className="group/option relative flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-all duration-200"
                                                            >
                                                                <div
                                                                    className={`w-10 h-10 bg-gradient-to-r ${option.color} rounded-lg flex items-center justify-center group-hover/option:scale-110 transition-transform duration-200`}
                                                                >
                                                                    <option.icon className="h-5 w-5 text-white" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white group-hover/option:text-blue-600 dark:group-hover/option:text-blue-400 transition-colors duration-200">
                                                                        {option.title}
                                                                    </h4>
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{option.description}</p>
                                                                </div>
                                                                <div className="opacity-0 group-hover/option:opacity-100 transition-opacity duration-200">
                                                                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                                                        <svg className="w-3 h-3 text-white ltr:rotate-0 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                        </svg>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Dashboard Sections */}
                        {!dashboardLoading && (
                            <>
                                {/* Tabbed Destinations Section - NEW */}
                                <TabbedDestinationsSection
                                    mostVisitedDestinations={mostVisitedDestinations}
                                    topRatedDestinations={topRatedDestinations}
                                    latestDestinations={latestDestinations}
                                    bestDeals={bestDeals}
                                    isLoading={dashboardLoading}
                                    onSelectDestination={handleSelectForPlanning}
                                    onViewDestinationDetails={openDestinationModal}
                                    onViewAll={() => setCurrentView('destinations')}
                                    getPublicUrlFromPath={getPublicUrlFromPath}
                                />

                                {/* Entertainment Companies Section */}
                                <motion.div variants={itemVariants} className="mb-16">
                                    <div className="relative -mx-6 mb-8 overflow-hidden">
                                        <div className="relative px-6 py-4 w-[96%] mx-auto rounded-lg bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 opacity-90">
                                            <div className="flex items-center justify-between">
                                                <h2 className="text-3xl font-bold text-white drop-shadow-lg">{t('entertainment_companies')}</h2>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => {
                                                        setSelectedBookingType('entertainment_only');
                                                        setCurrentView('service-booking');
                                                    }}
                                                    className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-lg font-medium transition-all duration-300 border border-white/30"
                                                >
                                                    {t('view_all')}
                                                </motion.button>
                                            </div>
                                        </div>
                                    </div>

                                    {entertainmentCompanies.length > 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                            {entertainmentCompanies.slice(0, 10).map((company, index) => (
                                                <motion.div
                                                    key={company.id}
                                                    initial={{ scale: 0, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    transition={{
                                                        delay: index * 0.1,
                                                        type: 'spring',
                                                        stiffness: 100,
                                                        damping: 15,
                                                    }}
                                                    whileHover={{
                                                        y: -10,
                                                        scale: 1.02,
                                                        transition: { type: 'spring', stiffness: 400, damping: 25 },
                                                    }}
                                                    className="group cursor-pointer flex"
                                                    onClick={() => {
                                                        setSelectedBookingType('entertainment_only');
                                                        setCurrentView('service-booking');
                                                        selectEntertainment(company);
                                                    }}
                                                >
                                                    <div className="relative bg-white/20 dark:bg-slate-900/30 backdrop-blur-xl rounded-2xl overflow-visible shadow-xl hover:shadow-2xl border border-white/30 dark:border-slate-700/40 transition-all duration-500 hover:bg-white/30 dark:hover:bg-slate-900/40 hover:border-white/50 dark:hover:border-slate-600/60 flex flex-col w-full">
                                                        {/* Image */}
                                                        <div className="relative h-32 overflow-hidden rounded-t-2xl">
                                                            <img
                                                                src={company.image ? company.image : '/assets/images/img-placeholder-fallback.webp'}
                                                                alt={company.name}
                                                                className="w-full h-full object-cover aspect-square group-hover:scale-110 transition-transform duration-500"
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
                                                        </div>

                                                        {/* Content */}
                                                        <div className="p-3 bg-white/10 dark:bg-slate-800/10 backdrop-blur-sm flex flex-col flex-grow">
                                                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1.5 line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300 drop-shadow-sm leading-tight">
                                                                {company.name}
                                                            </h3>
                                                            {company.description && <p className="text-[10px] text-gray-600 dark:text-gray-400 mb-2.5 line-clamp-2">{company.description}</p>}

                                                            {/* Price and Action Button */}
                                                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10 dark:border-slate-700/30 mt-auto">
                                                                {company.price && (
                                                                    <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 drop-shadow-sm leading-none">₪{company.price}</div>
                                                                )}
                                                                <motion.button
                                                                    whileHover={{ scale: 1.05 }}
                                                                    whileTap={{ scale: 0.95 }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedBookingType('entertainment_only');
                                                                        setCurrentView('service-booking');
                                                                        selectEntertainment(company);
                                                                    }}
                                                                    className="bg-gradient-to-r from-orange-500/80 to-amber-600/80 hover:from-orange-600/90 hover:to-amber-700/90 backdrop-blur-md text-white text-xs font-semibold py-2 px-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl border border-orange-400/30 whitespace-nowrap"
                                                                >
                                                                    <span className="drop-shadow-sm">{t('book_now')}</span>
                                                                </motion.button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 bg-white/20 dark:bg-slate-900/30 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-slate-700/40">
                                            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                                <IconAward className="w-8 h-8 text-white" />
                                            </div>
                                            <p className="text-gray-500 dark:text-gray-400 text-lg">{t('no_entertainment_companies')}</p>
                                        </div>
                                    )}
                                </motion.div>

                                {/* Upcoming Trips Section */}
                                <motion.div variants={itemVariants} className="mb-16">
                                    <div className="relative -mx-6 mb-8 overflow-hidden">
                                        <div className="relative px-6 py-4 w-[96%] mx-auto rounded-lg inset-0 bg-gradient-to-r from-blue-500 to-indigo-700 opacity-90">
                                            <h2 className="text-3xl font-bold text-white drop-shadow-lg">{t('my_upcoming_trips')}</h2>
                                        </div>
                                    </div>
                                    {upcomingTrips.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {upcomingTrips.map((trip, index) => (
                                                <motion.div
                                                    key={trip.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                    whileHover={{
                                                        y: -5,
                                                        scale: 1.02,
                                                        transition: { type: 'spring', stiffness: 400, damping: 25 },
                                                    }}
                                                    className="relative bg-white/20 dark:bg-slate-900/30 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl border border-white/30 dark:border-slate-700/40 transition-all duration-500 hover:bg-white/30 dark:hover:bg-slate-900/40"
                                                >
                                                    <div className="p-6">
                                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                            <div className="flex items-center gap-4 flex-1">
                                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                                                    <IconCalendar className="w-6 h-6 text-white" />
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 truncate">{trip.destinations?.name}</h3>
                                                                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                                                                        {t('booking_ref')}: {trip.booking_reference}
                                                                    </p>
                                                                    <p className="text-sm text-gray-500 mt-1">{new Date(trip.trip_date).toLocaleDateString()}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-center sm:text-right">
                                                                <div className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">{trip.total_amount}</div>
                                                                <span
                                                                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                                                        trip.status === 'confirmed'
                                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                                                                    }`}
                                                                >
                                                                    {t(trip.status)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 bg-white/20 dark:bg-slate-900/30 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-slate-700/40">
                                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                                <IconCalendar className="w-8 h-8 text-white" />
                                            </div>
                                            <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">{t('no_upcoming_trips')}</p>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setCurrentView('destinations')}
                                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/25"
                                            >
                                                {t('plan_your_first_trip')}
                                            </motion.button>
                                        </div>
                                    )}
                                </motion.div>

                                {/* Previous Trips Section */}
                                <motion.div variants={itemVariants} className="mb-16">
                                    <div className="relative -mx-6 mb-8 overflow-hidden">
                                        <div className="relative px-6 py-4 w-[96%] mx-auto rounded-lg bg-gradient-to-r from-green-500 via-teal-500 to-cyan-500 opacity-90">
                                            <h2 className="text-3xl font-bold text-white drop-shadow-lg">{t('my_previous_trips')}</h2>
                                        </div>
                                    </div>
                                    {previousTrips.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {previousTrips.map((trip, index) => (
                                                <motion.div
                                                    key={trip.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                    whileHover={{
                                                        y: -5,
                                                        scale: 1.02,
                                                        transition: { type: 'spring', stiffness: 400, damping: 25 },
                                                    }}
                                                    className="relative bg-white/20 dark:bg-slate-900/30 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl border border-white/30 dark:border-slate-700/40 transition-all duration-500 hover:bg-white/30 dark:hover:bg-slate-900/40"
                                                >
                                                    <div className="p-6">
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 truncate">{trip.destinations?.name}</h3>
                                                                <p className="text-gray-600 dark:text-gray-400 text-sm truncate">{trip.destinations?.address}</p>
                                                                <p className="text-sm text-gray-500 mt-2">{new Date(trip.trip_date).toLocaleDateString()}</p>
                                                            </div>
                                                            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-full text-xs font-medium ml-2">
                                                                {t('completed')}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <div className="text-lg font-bold text-gray-800 dark:text-gray-200">{trip.total_amount}</div>
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors"
                                                            >
                                                                {t('view_details')}
                                                            </motion.button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 bg-white/20 dark:bg-slate-900/30 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-slate-700/40">
                                            <div className="w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                                <IconMapPin className="w-8 h-8 text-white" />
                                            </div>
                                            <p className="text-gray-500 dark:text-gray-400 text-lg">{t('no_previous_trips')}</p>
                                        </div>
                                    )}
                                </motion.div>

                                {/* Previous Payments Section */}
                                <motion.div variants={itemVariants} className="mb-16">
                                    <div className="relative -mx-6 mb-8 overflow-hidden">
                                        <div className="relative px-6 py-4 w-[96%] mx-auto rounded-lg bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 opacity-90">
                                            <h2 className="text-3xl font-bold text-white drop-shadow-lg">{t('payment_history')}</h2>
                                        </div>
                                    </div>
                                    {previousPayments.length > 0 ? (
                                        <div className="space-y-4">
                                            {/* Desktop Table View */}
                                            <div className="hidden md:block bg-white/20 dark:bg-slate-900/30 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl border border-white/30 dark:border-slate-700/40">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead className="bg-white/10 dark:bg-slate-800/20">
                                                            <tr>
                                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                                    {t('payment_date')}
                                                                </th>
                                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('booking')}</th>
                                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('amount')}</th>
                                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                                    {t('payment_method')}
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-white/20 dark:divide-slate-700/30">
                                                            {previousPayments.map((payment, index) => (
                                                                <motion.tr
                                                                    key={payment.id}
                                                                    initial={{ opacity: 0, x: -20 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    transition={{ delay: index * 0.05 }}
                                                                    className="hover:bg-white/10 dark:hover:bg-slate-800/20 transition-colors"
                                                                >
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                                                        {new Date(payment.payment_date).toLocaleDateString()}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <div>
                                                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-300">{payment.bills?.bookings?.destinations?.name}</div>
                                                                            <div className="text-sm text-gray-500 dark:text-gray-400">{payment.bills?.bookings?.booking_reference}</div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-300">{payment.amount}</td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                                                            {t(payment.payment_type)}
                                                                        </span>
                                                                    </td>
                                                                </motion.tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Mobile Card View */}
                                            <div className="md:hidden space-y-4">
                                                {previousPayments.map((payment, index) => (
                                                    <motion.div
                                                        key={payment.id}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: index * 0.1 }}
                                                        className="bg-white/20 dark:bg-slate-900/30 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/30 dark:border-slate-700/40"
                                                    >
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 truncate">{payment.bills?.bookings?.destinations?.name}</h3>
                                                                <p className="text-gray-600 dark:text-gray-400 text-sm">{payment.bills?.bookings?.booking_reference}</p>
                                                                <p className="text-sm text-gray-500 mt-1">{new Date(payment.payment_date).toLocaleDateString()}</p>
                                                            </div>
                                                            <div className="text-right ml-4">
                                                                <div className="text-xl font-bold text-gray-800 dark:text-gray-200">{payment.amount}</div>
                                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 mt-2">
                                                                    {t(payment.payment_type)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 bg-white/20 dark:bg-slate-900/30 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-slate-700/40">
                                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                                <IconCreditCard className="w-8 h-8 text-white" />
                                            </div>
                                            <p className="text-gray-500 dark:text-gray-400 text-lg">{t('no_payment_history')}</p>
                                        </div>
                                    )}
                                </motion.div>
                            </>
                        )}

                        {dashboardLoading && (
                            <div className="space-y-16 mt-16">
                                {[1, 2, 3, 4, 5].map((section) => (
                                    <div key={section} className="animate-pulse">
                                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                                            {[1, 2, 3, 4, 5].map((card) => (
                                                <div key={card} className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-64"></div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {currentView === 'destinations' && (
                    <motion.div
                        key="destinations"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.4 }}
                        className="container mx-auto px-6 py-8"
                    >
                        {/* Header with Back Button */}
                        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setCurrentView('dashboard')}
                                    className="p-3 rounded-xl bg-white dark:bg-slate-900/80 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-200 dark:border-slate-700/60"
                                >
                                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-300 ltr:rotate-0 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                </button>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('choose_destination')}</h1>
                                    <p className="text-gray-600 dark:text-gray-300 mt-1">{t('select_perfect_destination')}</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Trip Date Selection */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.08 }}
                            className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 shadow-lg border border-blue-200/50 dark:border-blue-700/40 mb-6"
                        >
                            <div className="flex items-center justify-center">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                                            <IconCalendar className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('select_trip_date')}</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">{t('choose_preferred_date')}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 ltr:ml-8 rtl:mr-8">
                                        <motion.div whileHover={{ scale: 1.02 }} className="relative">
                                            <input
                                                type="date"
                                                value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                                                onChange={(e) => {
                                                    if (e.target.value) {
                                                        setSelectedDate(new Date(e.target.value));
                                                    } else {
                                                        setSelectedDate(null);
                                                    }
                                                }}
                                                min={new Date().toISOString().split('T')[0]}
                                                className={`px-4 py-3 bg-white dark:bg-slate-800 border-2 rounded-xl text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer min-w-[180px] [&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:dark:opacity-80 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:hover:opacity-60 ${
                                                    !selectedDate && !validateRequiredServices().isValid
                                                        ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-500/20'
                                                        : 'border-blue-200 dark:border-blue-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500/20'
                                                }`}
                                            />
                                        </motion.div>

                                        {selectedDate && (
                                            <motion.button
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0, opacity: 0 }}
                                                onClick={() => setSelectedDate(null)}
                                                className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-all duration-200 group"
                                                title={t('clear_date')}
                                            >
                                                <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </motion.button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {selectedDate && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="mt-4 pt-4 border-t border-blue-200/50 dark:border-blue-700/50"
                                >
                                    <div className="text-center">
                                        <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/40 px-4 py-2 rounded-full">
                                            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path
                                                    fillRule="evenodd"
                                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            <span className="text-blue-700 dark:text-blue-300 font-medium">
                                                {t('trip_scheduled_for')}{' '}
                                                {selectedDate.toLocaleDateString(t('locale'), {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>

                        {/* Filters Section */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white dark:bg-slate-900/80 rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-slate-700/60 mb-8"
                        >
                            {/* Zones Filter */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    {t('zones')}
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {zones.map((zone, index) => (
                                        <motion.button
                                            key={zone.id}
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() => toggleZoneFilter(zone.id)}
                                            className={`relative p-3 rounded-xl text-sm font-medium transition-all duration-300 border-2 ${
                                                selectedZones.includes(zone.id)
                                                    ? 'bg-purple-500 text-white border-purple-500 shadow-lg shadow-purple-500/25'
                                                    : 'bg-gray-50 dark:bg-slate-800/60 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:border-purple-300 dark:hover:border-purple-500'
                                            }`}
                                        >
                                            {zone.name}
                                            {selectedZones.includes(zone.id) && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
                                                >
                                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </motion.div>
                                            )}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Properties Filters */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                    {t('destination_properties')}
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                    {availableProperties.map((property, index) => (
                                        <motion.button
                                            key={property.value}
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() => togglePropertyFilter(property.value)}
                                            className={`relative p-3 rounded-xl text-sm font-medium transition-all duration-300 border-2 flex items-center justify-center gap-2 ${
                                                selectedProperties.includes(property.value)
                                                    ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/25'
                                                    : 'bg-gray-50 dark:bg-slate-800/60 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500'
                                            }`}
                                        >
                                            {property.icon ? (
                                                <img src={getPublicUrlFromPath(property.icon)} alt={property.value} className="w-4 h-4 object-contain" />
                                            ) : (
                                                <img src="/assets/images/img-placeholder-fallback.webp" alt={property.value} className="w-4 h-4 object-contain" />
                                            )}
                                            <span>{formatFilterText(property.value)}</span>
                                            {selectedProperties.includes(property.value) && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
                                                >
                                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </motion.div>
                                            )}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Suitable For Filters */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center">
                                        <IconUsersGroup className="w-4 h-4 text-white" />
                                    </div>
                                    {t('suitable_for')}
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                    {availableSuitableFor.map((suitable, index) => (
                                        <motion.button
                                            key={suitable.value}
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() => toggleSuitableForFilter(suitable.value)}
                                            className={`relative p-3 rounded-xl text-sm font-medium transition-all duration-300 border-2 flex items-center justify-center gap-2 ${
                                                selectedSuitableFor.includes(suitable.value)
                                                    ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/25'
                                                    : 'bg-gray-50 dark:bg-slate-800/60 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:border-green-300 dark:hover:border-green-500'
                                            }`}
                                        >
                                            <div className="w-4 h-4 bg-gray-300 dark:bg-slate-700 rounded flex items-center justify-center">
                                                <IconUsers className="w-2.5 h-2.5 text-gray-500" />
                                            </div>
                                            <span>{formatFilterText(suitable.value)}</span>
                                            {selectedSuitableFor.includes(suitable.value) && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"
                                                >
                                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </motion.div>
                                            )}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* Results Counter */}
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-center mb-8">
                            <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-full">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <span className="text-blue-600 dark:text-blue-400 font-medium">{loading ? t('loading') : `${filteredDestinations.length} ${t('destinations_found')}`}</span>
                            </div>
                        </motion.div>

                        {/* Destinations Grid */}
                        {loading ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                {[...Array(10)].map((_, i) => (
                                    <div key={i} className="bg-white dark:bg-slate-900/80 rounded-2xl p-3 animate-pulse">
                                        <div className="w-full h-32 bg-gray-300 dark:bg-slate-700 rounded-xl mb-2"></div>
                                        <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded mb-1"></div>
                                        <div className="h-3 bg-gray-300 dark:bg-slate-700 rounded mb-2 w-3/4"></div>
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded w-1/3"></div>
                                            <div className="h-6 bg-gray-300 dark:bg-slate-700 rounded w-1/3"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <motion.div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                                {filteredDestinations.map((destination, index) => (
                                    <motion.div
                                        key={destination.id}
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{
                                            delay: index * 0.1,
                                            type: 'spring',
                                            stiffness: 100,
                                            damping: 15,
                                        }}
                                        whileHover={{
                                            y: -10,
                                            scale: 1.02,
                                            transition: { type: 'spring', stiffness: 400, damping: 25 },
                                        }}
                                        className="group cursor-pointer flex"
                                    >
                                        <div className="relative bg-white/20 dark:bg-slate-900/30 backdrop-blur-xl rounded-2xl overflow-visible shadow-xl hover:shadow-2xl border border-white/30 dark:border-slate-700/40 transition-all duration-500 hover:bg-white/30 dark:hover:bg-slate-900/40 hover:border-white/50 dark:hover:border-slate-600/60 flex flex-col w-full">
                                            {/* Image */}
                                            <div className="relative h-32 overflow-hidden rounded-t-2xl">
                                                <img
                                                    src={destination.thumbnail_path ? getPublicUrlFromPath(destination.thumbnail_path) : '/assets/images/img-placeholder-fallback.webp'}
                                                    alt={destination.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
                                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    <div
                                                        className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-lg cursor-pointer hover:bg-white/30 hover:scale-110 transition-all duration-200"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openDestinationModal(destination);
                                                        }}
                                                    >
                                                        <IconEye className="h-4 w-4 text-white drop-shadow-sm" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-3 bg-white/10 dark:bg-slate-800/10 backdrop-blur-sm flex flex-col flex-grow">
                                                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1.5 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 drop-shadow-sm leading-tight">
                                                    {destination.name}
                                                </h3>
                                                <div className="flex items-center text-gray-500 dark:text-gray-400 mb-2.5">
                                                    <IconMapPin className="h-3 w-3 ltr:mr-1 rtl:ml-1 flex-shrink-0 opacity-70" />
                                                    <span className="text-[10px] truncate">{getZoneName(destination.zone_id)}</span>
                                                </div>

                                                {/* Requirements - With Badges */}
                                                {destination.requirements && destination.requirements.length > 0 && (
                                                    <div className="mb-3 relative group/requirements">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {destination.requirements.slice(0, 3).map((req: string, idx: number) => (
                                                                <span
                                                                    key={idx}
                                                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 text-orange-700 dark:text-orange-300 rounded-md text-[10px] font-medium border border-orange-200/50 dark:border-orange-700/30"
                                                                >
                                                                    <svg className="h-2.5 w-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                    <span className="line-clamp-1">{t(req)}</span>
                                                                </span>
                                                            ))}
                                                            {destination.requirements.length > 3 && (
                                                                <span className="inline-flex items-center px-2 py-0.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-md text-[10px] font-bold shadow-sm">
                                                                    +{destination.requirements.length - 3}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Tooltip - only show when more than 3 requirements */}
                                                        {destination.requirements.length > 3 && (
                                                            <div className="absolute left-0 right-0 bottom-full mb-2 opacity-0 invisible group-hover/requirements:opacity-100 group-hover/requirements:visible transition-all duration-200 pointer-events-none z-[100]">
                                                                <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white text-xs rounded-lg shadow-2xl p-3 border border-gray-700 max-w-xs">
                                                                    <div className="font-semibold mb-2 text-orange-400">{t('all_requirements')}:</div>
                                                                    <ul className="space-y-1">
                                                                        {destination.requirements.map((req: string, idx: number) => (
                                                                            <li key={idx} className="flex items-start gap-2">
                                                                                <svg className="h-3.5 w-3.5 flex-shrink-0 text-orange-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path
                                                                                        strokeLinecap="round"
                                                                                        strokeLinejoin="round"
                                                                                        strokeWidth="2"
                                                                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                                    />
                                                                                </svg>
                                                                                <span className="leading-tight break-words">{t(req)}</span>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Pricing and Action Button */}
                                                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10 dark:border-slate-700/30 mt-auto">
                                                    {destination.pricing && destination.pricing.student && (
                                                        <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 drop-shadow-sm leading-none">₪{destination.pricing.student}</div>
                                                    )}
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSelectForPlanning(destination);
                                                        }}
                                                        className="bg-gradient-to-r from-blue-500/80 to-blue-600/80 hover:from-blue-600/90 hover:to-blue-700/90 backdrop-blur-md text-white text-xs font-semibold py-2 px-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl border border-blue-400/30 whitespace-nowrap"
                                                    >
                                                        <span className="drop-shadow-sm">{t('select')}</span>
                                                    </motion.button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}

                        {!loading && filteredDestinations.length === 0 && (
                            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
                                <div className="w-24 h-24 bg-gray-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <IconMapPin className="h-12 w-12 text-gray-400" />
                                </div>
                                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">{t('no_destinations_found')}</h3>
                                <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">{t('try_adjusting_filters')}</p>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Service Booking View */}
            <AnimatePresence mode="wait">
                {currentView === 'service-booking' && (
                    <motion.div
                        key="service-booking"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.4 }}
                        className="container mx-auto px-6 py-8"
                    >
                        {/* Header with Back Button */}
                        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => {
                                        // Reset selections when going back to dashboard
                                        setSelectedRequirements([]);
                                        setTotalPrice(0);
                                        setSelectedDate(null);
                                        setSelectedBookingType(null);
                                        setCurrentView('dashboard');
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-700/40 hover:bg-white/30 dark:hover:bg-slate-800/30 transition-all duration-300"
                                >
                                    <svg className="w-4 h-4 ltr:rotate-0 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    <span className="text-sm font-medium">{t('back_to_dashboard')}</span>
                                </button>
                            </div>
                        </motion.div>

                        {/* Hero Section */}
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-center mb-12">
                            <div className="flex items-center justify-center mb-6">
                                {selectedBookingType &&
                                    (() => {
                                        const config = bookingTypeConfigs.find((c) => c.id === selectedBookingType);
                                        if (!config) return null;
                                        return (
                                            <div className={`w-20 h-20 bg-gradient-to-r ${config.color} rounded-2xl flex items-center justify-center shadow-xl`}>
                                                <config.icon className="w-10 h-10 text-white" />
                                            </div>
                                        );
                                    })()}
                            </div>
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-4">
                                {selectedBookingType && bookingTypeConfigs.find((config) => config.id === selectedBookingType)?.title}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto mb-8">
                                {selectedBookingType && bookingTypeConfigs.find((config) => config.id === selectedBookingType)?.description}
                            </p>
                        </motion.div>

                        {/* Service Selection Section */}
                        <motion.div
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white/10 dark:bg-slate-900/20 backdrop-blur-2xl rounded-3xl border border-white/20 dark:border-slate-700/30 shadow-2xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="relative bg-gradient-to-r from-blue-600/80 to-purple-600/80 backdrop-blur-md p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-2">{t('select_services')}</h2>
                                        <p className="text-blue-100">{t('choose_from_available_services_below')}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {/* Trip Date Selector */}
                                        <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 border border-white/30">
                                            <label className="block text-xs text-blue-100 mb-1">{t('trip_date')}</label>
                                            <input
                                                type="date"
                                                value={selectedDate?.toISOString().split('T')[0] || ''}
                                                onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : null)}
                                                className="bg-transparent text-white text-sm border-none outline-none"
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Admin Override Section - School and User Selection */}
                            {isAdminUser && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.25 }}
                                    className="relative z-30 bg-gradient-to-br from-amber-50/90 via-orange-50/80 to-yellow-50/70 dark:from-amber-900/20 dark:via-orange-900/15 dark:to-yellow-900/10 backdrop-blur-xl border-y border-amber-200/50 dark:border-amber-700/30 shadow-lg"
                                >
                                    <div className="px-6 py-6">
                                        <div className="max-w-4xl relative z-30">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                                        />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100">{t('admin_override')}</h3>
                                                    <p className="text-sm text-amber-700 dark:text-amber-300">{t('select_school_and_user')}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* School Selection */}
                                                <div className="space-y-2">
                                                    <label className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-100">
                                                        <div className="w-8 h-8 bg-gradient-to-br from-amber-600 to-orange-600 rounded-lg flex items-center justify-center shadow">
                                                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                                                            </svg>
                                                        </div>
                                                        {t('select_school')} <span className="text-red-500">*</span>
                                                    </label>
                                                    <CustomSelect
                                                        options={allSchools.map((school) => ({
                                                            value: school.id,
                                                            label: school.name,
                                                        }))}
                                                        value={selectedSchoolId || ''}
                                                        onChange={(value) => setSelectedSchoolId(Array.isArray(value) ? value[0] : value)}
                                                        placeholder={t('select_school')}
                                                    />
                                                </div>

                                                {/* User Selection */}
                                                <div className="space-y-2">
                                                    <label className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-100">
                                                        <div className="w-8 h-8 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg flex items-center justify-center shadow">
                                                            <IconUser className="h-4 w-4 text-white" />
                                                        </div>
                                                        {t('select_user')} <span className="text-red-500">*</span>
                                                    </label>
                                                    <CustomSelect
                                                        options={allUsers
                                                            .filter((user) => !selectedSchoolId || user.school_id === selectedSchoolId)
                                                            .map((user) => ({
                                                                value: user.id,
                                                                label: user.full_name,
                                                            }))}
                                                        value={selectedUserId || ''}
                                                        onChange={(value) => setSelectedUserId(Array.isArray(value) ? value[0] : value)}
                                                        placeholder={t('select_user')}
                                                        disabled={!selectedSchoolId}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Content */}
                            <div className="p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Left Column - Services Selection */}
                                    <div className="space-y-6">
                                        {/* Paramedics */}
                                        {shouldShowServiceType('paramedics') && paramedics.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-white/10 dark:bg-slate-800/20 backdrop-blur-sm rounded-xl p-4 border border-white/30 dark:border-slate-700/40"
                                            >
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                    <div className="w-6 h-6 bg-red-500 rounded-lg flex items-center justify-center">
                                                        <IconHeart className="w-4 h-4 text-white" />
                                                    </div>
                                                    {t('paramedics')}
                                                </h3>
                                                <div className="grid grid-cols-1 gap-3">
                                                    {paramedics.map((paramedic) => {
                                                        const selected = isSelected('paramedics', paramedic.id);
                                                        const selectedReq = selectedRequirements.find((req) => req.type === 'paramedics' && req.id === paramedic.id);

                                                        return (
                                                            <div key={paramedic.id} className="space-y-2">
                                                                <motion.div
                                                                    whileHover={{ scale: 1.02 }}
                                                                    whileTap={{ scale: 0.98 }}
                                                                    onClick={() => selectParamedic(paramedic)}
                                                                    className={`p-3 rounded-lg border-2 transition-all duration-300 cursor-pointer ${
                                                                        selected
                                                                            ? 'border-red-500 bg-red-50/10 dark:bg-red-900/10'
                                                                            : 'border-gray-200/50 dark:border-slate-700/50 hover:border-red-300 dark:hover:border-red-600'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <div>
                                                                            <h4 className="font-semibold text-gray-900 dark:text-white">{paramedic.name}</h4>
                                                                            <p className="text-sm text-gray-600 dark:text-gray-300">{paramedic.phone}</p>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                                                ₪{paramedic.daily_rate}/{t('day')}
                                                                            </p>
                                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                                ₪{paramedic.hourly_rate}/{t('hr')}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </motion.div>

                                                                {/* Rate Type Selection Buttons - Show when selected */}
                                                                {selected && (
                                                                    <motion.div
                                                                        initial={{ opacity: 0, height: 0 }}
                                                                        animate={{ opacity: 1, height: 'auto' }}
                                                                        exit={{ opacity: 0, height: 0 }}
                                                                        className="grid grid-cols-4 gap-2 px-3"
                                                                    >
                                                                        {[
                                                                            { value: 'hourly', label: t('hourly'), rate: paramedic.hourly_rate },
                                                                            { value: 'daily', label: t('daily'), rate: paramedic.daily_rate },
                                                                            { value: 'regional', label: t('regional'), rate: paramedic.daily_rate * 1.5 },
                                                                            { value: 'overnight', label: t('overnight'), rate: paramedic.daily_rate * 2 },
                                                                        ].map((rateOption) => (
                                                                            <button
                                                                                key={rateOption.value}
                                                                                onClick={() =>
                                                                                    updateRequirementRateType(
                                                                                        selectedRequirements.findIndex((r) => r.type === 'paramedics' && r.id === paramedic.id),
                                                                                        rateOption.value as any,
                                                                                    )
                                                                                }
                                                                                className={`py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${
                                                                                    selectedReq?.rate_type === rateOption.value
                                                                                        ? 'bg-red-500 text-white shadow-lg'
                                                                                        : 'bg-white/50 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/20'
                                                                                }`}
                                                                            >
                                                                                <div>{rateOption.label}</div>
                                                                                <div className="text-[10px] opacity-75">₪{rateOption.rate}</div>
                                                                            </button>
                                                                        ))}
                                                                    </motion.div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Guides */}
                                        {shouldShowServiceType('guides') && guides.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1 }}
                                                className="bg-white/10 dark:bg-slate-800/20 backdrop-blur-sm rounded-xl p-4 border border-white/30 dark:border-slate-700/40"
                                            >
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                    <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center">
                                                        <IconUsers className="w-4 h-4 text-white" />
                                                    </div>
                                                    {t('guides')}
                                                </h3>
                                                <div className="grid grid-cols-1 gap-3">
                                                    {guides.map((guide) => {
                                                        const selected = isSelected('guides', guide.id);
                                                        const selectedReq = selectedRequirements.find((req) => req.type === 'guides' && req.id === guide.id);

                                                        return (
                                                            <div key={guide.id} className="space-y-2">
                                                                <motion.div
                                                                    whileHover={{ scale: 1.02 }}
                                                                    whileTap={{ scale: 0.98 }}
                                                                    onClick={() => selectGuide(guide)}
                                                                    className={`p-3 rounded-lg border-2 transition-all duration-300 cursor-pointer ${
                                                                        selected
                                                                            ? 'border-green-500 bg-green-50/10 dark:bg-green-900/10'
                                                                            : 'border-gray-200/50 dark:border-slate-700/50 hover:border-green-300 dark:hover:border-green-600'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <div>
                                                                            <h4 className="font-semibold text-gray-900 dark:text-white">{guide.name}</h4>
                                                                            <p className="text-sm text-gray-600 dark:text-gray-300">{guide.phone}</p>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                                                ₪{guide.daily_rate}/{t('day')}
                                                                            </p>
                                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                                ₪{guide.hourly_rate}/{t('hr')}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </motion.div>

                                                                {/* Rate Type Selection Buttons - Show when selected */}
                                                                {selected && (
                                                                    <motion.div
                                                                        initial={{ opacity: 0, height: 0 }}
                                                                        animate={{ opacity: 1, height: 'auto' }}
                                                                        exit={{ opacity: 0, height: 0 }}
                                                                        className="grid grid-cols-4 gap-2 px-3"
                                                                    >
                                                                        {[
                                                                            { value: 'hourly', label: t('hourly'), rate: guide.hourly_rate },
                                                                            { value: 'daily', label: t('daily'), rate: guide.daily_rate },
                                                                            { value: 'regional', label: t('regional'), rate: guide.daily_rate * 1.5 },
                                                                            { value: 'overnight', label: t('overnight'), rate: guide.daily_rate * 2 },
                                                                        ].map((rateOption) => (
                                                                            <button
                                                                                key={rateOption.value}
                                                                                onClick={() =>
                                                                                    updateRequirementRateType(
                                                                                        selectedRequirements.findIndex((r) => r.type === 'guides' && r.id === guide.id),
                                                                                        rateOption.value as any,
                                                                                    )
                                                                                }
                                                                                className={`py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${
                                                                                    selectedReq?.rate_type === rateOption.value
                                                                                        ? 'bg-green-500 text-white shadow-lg'
                                                                                        : 'bg-white/50 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/20'
                                                                                }`}
                                                                            >
                                                                                <div>{rateOption.label}</div>
                                                                                <div className="text-[10px] opacity-75">₪{rateOption.rate}</div>
                                                                            </button>
                                                                        ))}
                                                                    </motion.div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Security Companies */}
                                        {shouldShowServiceType('security_companies') && securityCompanies.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2 }}
                                                className="bg-white/10 dark:bg-slate-800/20 backdrop-blur-sm rounded-xl p-4 border border-white/30 dark:border-slate-700/40"
                                            >
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                    <div className="w-6 h-6 bg-yellow-500 rounded-lg flex items-center justify-center">
                                                        <IconLock className="w-4 h-4 text-white" />
                                                    </div>
                                                    {t('security')}
                                                </h3>
                                                <div className="grid grid-cols-1 gap-3">
                                                    {securityCompanies.map((security) => {
                                                        const selected = isSelected('security_companies', security.id);
                                                        const selectedReq = selectedRequirements.find((req) => req.type === 'security_companies' && req.id === security.id);

                                                        return (
                                                            <div key={security.id} className="space-y-2">
                                                                <motion.div
                                                                    whileHover={{ scale: 1.02 }}
                                                                    whileTap={{ scale: 0.98 }}
                                                                    onClick={() => selectSecurity(security)}
                                                                    className={`p-3 rounded-lg border-2 transition-all duration-300 cursor-pointer ${
                                                                        selected
                                                                            ? 'border-yellow-500 bg-yellow-50/10 dark:bg-yellow-900/10'
                                                                            : 'border-gray-200/50 dark:border-slate-700/50 hover:border-yellow-300 dark:hover:border-yellow-600'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <div>
                                                                            <h4 className="font-semibold text-gray-900 dark:text-white">{security.name}</h4>
                                                                            <p className="text-sm text-gray-600 dark:text-gray-300">{security.phone}</p>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                                                ₪{security.daily_rate}/{t('day')}
                                                                            </p>
                                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                                ₪{security.hourly_rate}/{t('hr')}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </motion.div>

                                                                {/* Rate Type Selection Buttons - Show when selected */}
                                                                {selected && (
                                                                    <motion.div
                                                                        initial={{ opacity: 0, height: 0 }}
                                                                        animate={{ opacity: 1, height: 'auto' }}
                                                                        exit={{ opacity: 0, height: 0 }}
                                                                        className="grid grid-cols-4 gap-2 px-3"
                                                                    >
                                                                        {[
                                                                            { value: 'hourly', label: t('hourly'), rate: security.hourly_rate },
                                                                            { value: 'daily', label: t('daily'), rate: security.daily_rate },
                                                                            { value: 'regional', label: t('regional'), rate: security.daily_rate * 1.5 },
                                                                            { value: 'overnight', label: t('overnight'), rate: security.daily_rate * 2 },
                                                                        ].map((rateOption) => (
                                                                            <button
                                                                                key={rateOption.value}
                                                                                onClick={() =>
                                                                                    updateRequirementRateType(
                                                                                        selectedRequirements.findIndex((r) => r.type === 'security_companies' && r.id === security.id),
                                                                                        rateOption.value as any,
                                                                                    )
                                                                                }
                                                                                className={`py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${
                                                                                    selectedReq?.rate_type === rateOption.value
                                                                                        ? 'bg-yellow-500 text-white shadow-lg'
                                                                                        : 'bg-white/50 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/20'
                                                                                }`}
                                                                            >
                                                                                <div>{rateOption.label}</div>
                                                                                <div className="text-[10px] opacity-75">₪{rateOption.rate}</div>
                                                                            </button>
                                                                        ))}
                                                                    </motion.div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Entertainment Companies */}
                                        {shouldShowServiceType('external_entertainment_companies') && entertainmentCompanies.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.3 }}
                                                className="bg-white/10 dark:bg-slate-800/20 backdrop-blur-sm rounded-xl p-4 border border-white/30 dark:border-slate-700/40"
                                            >
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                    <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center">
                                                        <IconPlayCircle className="w-4 h-4 text-white" />
                                                    </div>
                                                    {t('entertainment')}
                                                </h3>
                                                <div className="grid grid-cols-1 gap-3">
                                                    {entertainmentCompanies.map((entertainment) => (
                                                        <motion.div
                                                            key={entertainment.id}
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => selectEntertainment(entertainment)}
                                                            className={`p-3 rounded-lg border-2 transition-all duration-300 cursor-pointer ${
                                                                isSelected('external_entertainment_companies', entertainment.id)
                                                                    ? 'border-purple-500 bg-purple-50/10 dark:bg-purple-900/10'
                                                                    : 'border-gray-200/50 dark:border-slate-700/50 hover:border-purple-300 dark:hover:border-purple-600'
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <h4 className="font-semibold text-gray-900 dark:text-white">{entertainment.name}</h4>
                                                                    <p className="text-sm text-gray-600 dark:text-gray-300">{entertainment.description}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{entertainment.price}</p>
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('fixed_price')}</p>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Travel Companies */}
                                        {shouldShowServiceType('travel_companies') && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.4 }}
                                                className="bg-white/10 dark:bg-slate-800/20 backdrop-blur-sm rounded-xl p-4 border border-white/30 dark:border-slate-700/40"
                                            >
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                    <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                                                        <IconCar className="w-4 h-4 text-white" />
                                                    </div>
                                                    {t('travel_companies')}
                                                </h3>
                                                <div className="grid grid-cols-1 gap-3">
                                                    {travelCompanies.map((travel) => (
                                                        <motion.div
                                                            key={travel.id}
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => selectTravelCompany(travel)}
                                                            className={`p-3 rounded-lg border-2 transition-all duration-300 cursor-pointer ${
                                                                isSelected('travel_companies', travel.id)
                                                                    ? 'border-blue-500 bg-blue-50/10 dark:bg-blue-900/10'
                                                                    : 'border-gray-200/50 dark:border-slate-700/50 hover:border-blue-300 dark:hover:border-blue-600'
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <h4 className="font-semibold text-gray-900 dark:text-white">{travel.name}</h4>
                                                                    <p className="text-sm text-gray-600 dark:text-gray-300">{travel.phone}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{travel.pricing_data?.default_price || 100}</p>
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('per_trip')}</p>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Right Column - Summary and Checkout */}
                                    <div className="space-y-6">
                                        {/* Selected Services Summary */}
                                        <div className="bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-white/30 dark:border-slate-700/40 sticky top-6 self-start overflow-y-auto">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                                                    <IconShoppingBag className="w-4 h-4 text-white" />
                                                </div>
                                                {t('booking_summary')}
                                            </h3>

                                            {selectedRequirements.length === 0 ? (
                                                <div className="text-center py-8">
                                                    <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <IconShoppingBag className="w-8 h-8 text-gray-400" />
                                                    </div>
                                                    <p className="text-gray-500 dark:text-gray-400 text-sm">{t('no_services_selected')}</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {selectedRequirements.map((requirement, index) => {
                                                        // Get the service type label and color (matching the service icon colors)
                                                        const getServiceTypeInfo = (type: string) => {
                                                            const typeMap: { [key: string]: { label: string; color: string } } = {
                                                                paramedics: { label: t('paramedics') || 'Paramedics', color: 'bg-red-500/20 text-red-600 dark:text-red-400' },
                                                                guides: { label: t('guides') || 'Guides', color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400' },
                                                                security_companies: { label: t('security_companies') || 'Security', color: 'bg-orange-500/20 text-orange-600 dark:text-orange-400' },
                                                                external_entertainment_companies: {
                                                                    label: t('external_entertainment_companies') || 'Entertainment',
                                                                    color: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
                                                                },
                                                                travel_companies: { label: t('travel_companies') || 'Transportation', color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400' },
                                                            };
                                                            return typeMap[type] || { label: type, color: 'bg-gray-500/20 text-gray-600 dark:text-gray-400' };
                                                        };

                                                        const serviceInfo = getServiceTypeInfo(requirement.type);

                                                        return (
                                                            <motion.div
                                                                key={index}
                                                                initial={{ opacity: 0, x: 20 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                className="flex items-center justify-between p-3 bg-white/10 dark:bg-slate-700/20 rounded-lg"
                                                            >
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{requirement.name}</h4>
                                                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${serviceInfo.color}`}>{serviceInfo.label}</span>
                                                                    </div>
                                                                    <p className="text-xs text-gray-600 dark:text-gray-300 capitalize">{requirement.rate_type}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="font-semibold text-gray-900 dark:text-white text-sm">₪{requirement.cost}</p>
                                                                    <button onClick={() => removeRequirement(index)} className="text-red-500 hover:text-red-700 text-xs">
                                                                        {t('remove')}
                                                                    </button>
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Total */}
                                            <div className="border-t border-gray-200/30 dark:border-slate-700/50 mt-4 pt-4">
                                                <div className="flex items-center justify-between text-lg font-bold text-gray-900 dark:text-white">
                                                    <span>{t('total')}</span>
                                                    <span>{totalPrice}</span>
                                                </div>
                                            </div>

                                            {/* Validation Errors */}
                                            {(() => {
                                                const validation = getValidationErrors();
                                                return !validation.isValid ? (
                                                    <div className="mt-4 p-3 bg-red-50/10 dark:bg-red-900/10 border border-red-200/30 dark:border-red-700/30 rounded-lg">
                                                        <p className="text-red-600 dark:text-red-400 text-sm font-medium mb-2">{t('missing_required')}:</p>
                                                        <ul className="text-red-600 dark:text-red-400 text-sm space-y-1">
                                                            {validation.errors.map((error, idx) => (
                                                                <li key={idx}>• {error}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                ) : null;
                                            })()}

                                            {/* Checkout Button */}
                                            <motion.button
                                                whileHover={getValidationErrors().isValid ? { scale: 1.02 } : {}}
                                                whileTap={getValidationErrors().isValid ? { scale: 0.98 } : {}}
                                                onClick={openCheckout}
                                                disabled={!getValidationErrors().isValid}
                                                className={`w-full mt-6 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                                                    getValidationErrors().isValid
                                                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer shadow-lg hover:shadow-emerald-500/25'
                                                        : 'bg-red-500 text-white cursor-not-allowed opacity-75'
                                                }`}
                                            >
                                                {getValidationErrors().isValid ? t('proceed_to_booking') : t('select_required_services_first')}
                                            </motion.button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Requirements Selection Section */}
            <AnimatePresence>
                {showRequirementsSection && (
                    <motion.div
                        id="requirements-section"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        transition={{ duration: 0.5 }}
                        className="mt-8 bg-white/10 dark:bg-slate-900/20 backdrop-blur-2xl rounded-3xl border border-white/20 dark:border-slate-700/30 shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="relative bg-gradient-to-r from-blue-600/80 to-purple-600/80 backdrop-blur-md p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-2">{selectedForPlanning ? t('plan_your_trip') : t('book_services')}</h2>
                                    {selectedForPlanning ? (
                                        <p className="text-blue-100">
                                            {t('selected_destination')}: <span className="font-semibold">{selectedForPlanning.name}</span>
                                        </p>
                                    ) : (
                                        <p className="text-blue-100">{selectedBookingType && bookingTypeConfigs.find((config) => config.id === selectedBookingType)?.title}</p>
                                    )}
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => {
                                        setShowRequirementsSection(false);
                                        // If it's a service-only booking, go back to dashboard
                                        if (!selectedForPlanning && selectedBookingType !== 'full_trip') {
                                            setCurrentView('dashboard');
                                        }
                                    }}
                                    className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 hover:bg-white/30 transition-all duration-300"
                                >
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </motion.button>
                            </div>

                            {/* Required Services Indicator */}
                            {selectedForPlanning?.requirements && selectedForPlanning?.requirements?.length > 0 ? (
                                <div className="mt-4">
                                    <p className="text-sm text-blue-100 mb-2">{t('required_services')}:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedForPlanning.requirements.map((requirement, idx) => (
                                            <div key={idx} className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 text-xs font-medium text-white">
                                                {t(requirement)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-4">
                                    <p className="text-sm text-blue-100">{t('choose_from_available_services')}</p>
                                </div>
                            )}
                        </div>

                        {/* Trip Date Selection */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="relative bg-gradient-to-br from-white/10 via-white/5 to-transparent dark:from-slate-800/30 dark:via-slate-800/20 dark:to-transparent backdrop-blur-xl border-y border-white/20 dark:border-slate-700/30 shadow-inner"
                        >
                            <div className="px-6 py-6">
                                <div className="max-w-4xl">
                                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                                        {/* Icon and Label */}
                                        <div className="flex items-center gap-4 lg:w-48 shrink-0">
                                            <motion.div
                                                whileHover={{ scale: 1.1, rotate: 5 }}
                                                className="relative w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl blur opacity-50 animate-pulse"></div>
                                                <IconCalendar className="relative h-7 w-7 text-white drop-shadow-lg" />
                                            </motion.div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-0.5">{t('trip_date')}</h3>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">{t('select_date')}</p>
                                            </div>
                                        </div>

                                        {/* Date Input */}
                                        <div className="flex-1 w-full lg:w-auto">
                                            <div className="relative">
                                                <input
                                                    type="date"
                                                    value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                                                    onChange={(e) => {
                                                        const date = e.target.value ? new Date(e.target.value) : null;
                                                        setSelectedDate(date);
                                                    }}
                                                    min={new Date().toISOString().split('T')[0]}
                                                    className="w-full px-5 py-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-2 border-gray-300/50 dark:border-slate-600/50 rounded-xl focus:ring-4 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 text-gray-900 dark:text-white font-medium text-lg shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500"
                                                    style={{
                                                        colorScheme: 'light',
                                                    }}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Selected Date Badge */}
                                        <AnimatePresence>
                                            {selectedDate && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.8, x: 20 }}
                                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                                    exit={{ opacity: 0, scale: 0.8, x: 20 }}
                                                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                                    className="lg:w-64 shrink-0"
                                                >
                                                    <div className="relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg shadow-green-500/30 p-4">
                                                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIwLjUiIG9wYWNpdHk9IjAuMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>
                                                        <div className="relative flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shrink-0">
                                                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold text-white truncate">
                                                                    {selectedDate.toLocaleDateString(t('locale'), {
                                                                        weekday: 'short',
                                                                        year: 'numeric',
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                    })}
                                                                </p>
                                                            </div>
                                                            <motion.button
                                                                whileHover={{ scale: 1.1, rotate: 90 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                onClick={() => setSelectedDate(null)}
                                                                className="w-7 h-7 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white/30 transition-all duration-200 shrink-0"
                                                            >
                                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </motion.button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Admin Override Section - School and User Selection */}
                        {isAdminUser && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                className="relative z-30 bg-gradient-to-br from-amber-50/90 via-orange-50/80 to-yellow-50/70 dark:from-amber-900/20 dark:via-orange-900/15 dark:to-yellow-900/10 backdrop-blur-xl border-y border-amber-200/50 dark:border-amber-700/30 shadow-lg"
                            >
                                <div className="px-6 py-6">
                                    <div className="max-w-4xl relative z-30">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                                    />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100">{t('admin_override')}</h3>
                                                <p className="text-sm text-amber-700 dark:text-amber-300">{t('select_school_and_user')}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* School Selection */}
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-100">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-amber-600 to-orange-600 rounded-lg flex items-center justify-center shadow">
                                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                                                        </svg>
                                                    </div>
                                                    {t('select_school')} <span className="text-red-500">*</span>
                                                </label>
                                                <CustomSelect
                                                    options={allSchools.map((school) => ({
                                                        value: school.id,
                                                        label: school.name,
                                                    }))}
                                                    value={selectedSchoolId || ''}
                                                    onChange={(value) => setSelectedSchoolId(Array.isArray(value) ? value[0] : value)}
                                                    placeholder={t('select_school')}
                                                />
                                            </div>

                                            {/* User Selection */}
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-100">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg flex items-center justify-center shadow">
                                                        <IconUser className="h-4 w-4 text-white" />
                                                    </div>
                                                    {t('select_user')} <span className="text-red-500">*</span>
                                                </label>
                                                <CustomSelect
                                                    options={allUsers
                                                        .filter((user) => !selectedSchoolId || user.school_id === selectedSchoolId)
                                                        .map((user) => ({
                                                            value: user.id,
                                                            label: user.full_name,
                                                        }))}
                                                    value={selectedUserId || ''}
                                                    onChange={(value) => setSelectedUserId(Array.isArray(value) ? value[0] : value)}
                                                    placeholder={t('select_user')}
                                                    disabled={!selectedSchoolId}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Trip Details Section (Students, Crew, Buses) */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="relative bg-gradient-to-br from-white/10 via-white/5 to-transparent dark:from-slate-800/30 dark:via-slate-800/20 dark:to-transparent backdrop-blur-xl border-y border-white/20 dark:border-slate-700/30 shadow-inner"
                        >
                            <div className="px-6 py-6">
                                <div className="max-w-4xl">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Number of Students */}
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                                                    <IconUsersGroup className="h-4 w-4 text-white" />
                                                </div>
                                                {t('number_of_students')} <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={numberOfStudents}
                                                onChange={(e) => setNumberOfStudents(parseInt(e.target.value) || 0)}
                                                placeholder="0"
                                                className="w-full px-4 py-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-2 border-gray-300/50 dark:border-slate-600/50 rounded-xl focus:ring-4 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 text-gray-900 dark:text-white font-medium shadow-sm hover:shadow-md"
                                            />
                                        </div>

                                        {/* Number of Crew */}
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                                                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                                    <IconUser className="h-4 w-4 text-white" />
                                                </div>
                                                {t('number_of_crew')} <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={numberOfCrew}
                                                onChange={(e) => setNumberOfCrew(parseInt(e.target.value) || 0)}
                                                placeholder="0"
                                                className="w-full px-4 py-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-2 border-gray-300/50 dark:border-slate-600/50 rounded-xl focus:ring-4 focus:ring-purple-500/30 dark:focus:ring-purple-400/30 focus:border-purple-500 dark:focus:border-purple-400 transition-all duration-300 text-gray-900 dark:text-white font-medium shadow-sm hover:shadow-md"
                                            />
                                        </div>
                                    </div>

                                    {/* Summary Info */}
                                    {((numberOfStudents || 0) > 0 || (numberOfCrew || 0) > 0 || (numberOfBuses || 0) > 0) && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="mt-4 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-400/10 dark:to-purple-400/10 rounded-xl border border-blue-300/30 dark:border-blue-600/30"
                                        >
                                            <div className="flex flex-wrap items-center gap-4 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-600 dark:text-gray-400">{t('total_participants')}:</span>
                                                    <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">{(numberOfStudents || 0) + (numberOfCrew || 0)}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        {/* Content */}
                        <div className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Left Column - Services Selection */}
                                <div className="space-y-6">
                                    {/* Show message if no requirements for full trip mode */}
                                    {selectedForPlanning && (!selectedForPlanning.requirements || selectedForPlanning.requirements.length === 0) && (
                                        <div className="text-center py-8">
                                            <div className="bg-blue-50/50 dark:bg-blue-900/20 backdrop-blur-sm rounded-xl p-6 border border-blue-200/50 dark:border-blue-700/40">
                                                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">{t('no_specific_requirements')}</h3>
                                                <p className="text-blue-700 dark:text-blue-300 text-sm">{t('destination_no_requirements_message')}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Paramedics */}
                                    {shouldShowServiceType('paramedics') && paramedics.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-white/10 dark:bg-slate-800/20 backdrop-blur-sm rounded-xl p-4 border border-white/30 dark:border-slate-700/40"
                                        >
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                <div className="w-6 h-6 bg-red-500 rounded-lg flex items-center justify-center">
                                                    <IconHeart className="w-4 h-4 text-white" />
                                                </div>
                                                {t('paramedics')}
                                            </h3>
                                            <div className="space-y-3">
                                                {paramedics.map((paramedic) => {
                                                    const selected = isSelected('paramedics', paramedic.id);
                                                    const selectedReq = selectedRequirements.find((req) => req.type === 'paramedics' && req.id === paramedic.id);

                                                    return (
                                                        <div key={paramedic.id} className="space-y-2">
                                                            <div className="flex items-center justify-between p-3 bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm rounded-lg border border-white/30 dark:border-slate-700/40">
                                                                <div>
                                                                    <p className="font-medium text-gray-900 dark:text-white">{paramedic.name}</p>
                                                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                                                        {paramedic.hourly_rate}₪/hr • {paramedic.daily_rate}₪/day
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    onClick={() => selectParamedic(paramedic)}
                                                                    className={`px-3 py-1 text-white text-sm rounded-lg transition-colors duration-200 ${
                                                                        selected ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                                                                    }`}
                                                                >
                                                                    {selected ? t('selected') : t('select')}
                                                                </button>
                                                            </div>

                                                            {/* Rate Selection Buttons */}
                                                            {selected && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, height: 0 }}
                                                                    animate={{ opacity: 1, height: 'auto' }}
                                                                    exit={{ opacity: 0, height: 0 }}
                                                                    className="grid grid-cols-4 gap-2 px-3"
                                                                >
                                                                    {[
                                                                        { value: 'hourly', label: t('hourly'), rate: paramedic.hourly_rate },
                                                                        { value: 'daily', label: t('daily'), rate: paramedic.daily_rate },
                                                                        { value: 'regional', label: t('regional'), rate: Math.round(paramedic.daily_rate * 1.5) },
                                                                        { value: 'overnight', label: t('overnight'), rate: paramedic.daily_rate * 2 },
                                                                    ].map((rateOption) => (
                                                                        <button
                                                                            key={rateOption.value}
                                                                            onClick={() => {
                                                                                const reqIndex = selectedRequirements.findIndex((r) => r.type === 'paramedics' && r.id === paramedic.id);
                                                                                if (reqIndex !== -1) {
                                                                                    updateRequirementRateType(reqIndex, rateOption.value as any);
                                                                                }
                                                                            }}
                                                                            className={`p-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                                                                                selectedReq?.rate_type === rateOption.value
                                                                                    ? 'bg-red-500 text-white shadow-md'
                                                                                    : 'bg-white/50 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-slate-700/80'
                                                                            }`}
                                                                        >
                                                                            <div className="font-semibold">{rateOption.label}</div>
                                                                            <div className="text-[10px] mt-0.5">₪{rateOption.rate}</div>
                                                                        </button>
                                                                    ))}
                                                                </motion.div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Guides */}
                                    {shouldShowServiceType('guides') && guides.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 }}
                                            className="bg-white/10 dark:bg-slate-800/20 backdrop-blur-sm rounded-xl p-4 border border-white/30 dark:border-slate-700/40"
                                        >
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                                                    <IconUser className="w-4 h-4 text-white" />
                                                </div>
                                                {t('guides')}
                                            </h3>
                                            <div className="space-y-3">
                                                {guides.map((guide) => {
                                                    const selected = isSelected('guides', guide.id);
                                                    const selectedReq = selectedRequirements.find((req) => req.type === 'guides' && req.id === guide.id);

                                                    return (
                                                        <div key={guide.id} className="space-y-2">
                                                            <div className="flex items-center justify-between p-3 bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm rounded-lg border border-white/30 dark:border-slate-700/40">
                                                                <div>
                                                                    <p className="font-medium text-gray-900 dark:text-white">{guide.name}</p>
                                                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                                                        {guide.hourly_rate}₪/hr • {guide.daily_rate}₪/day
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    onClick={() => selectGuide(guide)}
                                                                    className={`px-3 py-1 text-white text-sm rounded-lg transition-colors duration-200 ${
                                                                        selected ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'
                                                                    }`}
                                                                >
                                                                    {selected ? t('selected') : t('select')}
                                                                </button>
                                                            </div>

                                                            {/* Rate Selection Buttons */}
                                                            {selected && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, height: 0 }}
                                                                    animate={{ opacity: 1, height: 'auto' }}
                                                                    exit={{ opacity: 0, height: 0 }}
                                                                    className="grid grid-cols-4 gap-2 px-3"
                                                                >
                                                                    {[
                                                                        { value: 'hourly', label: t('hourly'), rate: guide.hourly_rate },
                                                                        { value: 'daily', label: t('daily'), rate: guide.daily_rate },
                                                                        { value: 'regional', label: t('regional'), rate: Math.round(guide.daily_rate * 1.5) },
                                                                        { value: 'overnight', label: t('overnight'), rate: guide.daily_rate * 2 },
                                                                    ].map((rateOption) => (
                                                                        <button
                                                                            key={rateOption.value}
                                                                            onClick={() => {
                                                                                const reqIndex = selectedRequirements.findIndex((r) => r.type === 'guides' && r.id === guide.id);
                                                                                if (reqIndex !== -1) {
                                                                                    updateRequirementRateType(reqIndex, rateOption.value as any);
                                                                                }
                                                                            }}
                                                                            className={`p-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                                                                                selectedReq?.rate_type === rateOption.value
                                                                                    ? 'bg-green-500 text-white shadow-md'
                                                                                    : 'bg-white/50 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-slate-700/80'
                                                                            }`}
                                                                        >
                                                                            <div className="font-semibold">{rateOption.label}</div>
                                                                            <div className="text-[10px] mt-0.5">₪{rateOption.rate}</div>
                                                                        </button>
                                                                    ))}
                                                                </motion.div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Security Companies */}
                                    {shouldShowServiceType('security_companies') && securityCompanies.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                            className="bg-white/10 dark:bg-slate-800/20 backdrop-blur-sm rounded-xl p-4 border border-white/30 dark:border-slate-700/40"
                                        >
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                <div className="w-6 h-6 bg-orange-500 rounded-lg flex items-center justify-center">
                                                    <IconLock className="w-4 h-4 text-white" />
                                                </div>
                                                {t('security')}
                                            </h3>
                                            <div className="space-y-3">
                                                {securityCompanies.map((security) => {
                                                    const selected = isSelected('security_companies', security.id);
                                                    const selectedReq = selectedRequirements.find((req) => req.type === 'security_companies' && req.id === security.id);

                                                    return (
                                                        <div key={security.id} className="space-y-2">
                                                            <div className="flex items-center justify-between p-3 bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm rounded-lg border border-white/30 dark:border-slate-700/40">
                                                                <div>
                                                                    <p className="font-medium text-gray-900 dark:text-white">{security.name}</p>
                                                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                                                        {security.hourly_rate}₪/hr • {security.daily_rate}₪/day
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    onClick={() => selectSecurity(security)}
                                                                    className={`px-3 py-1 text-white text-sm rounded-lg transition-colors duration-200 ${
                                                                        selected ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'
                                                                    }`}
                                                                >
                                                                    {selected ? t('selected') : t('select')}
                                                                </button>
                                                            </div>

                                                            {/* Rate Selection Buttons */}
                                                            {selected && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, height: 0 }}
                                                                    animate={{ opacity: 1, height: 'auto' }}
                                                                    exit={{ opacity: 0, height: 0 }}
                                                                    className="grid grid-cols-4 gap-2 px-3"
                                                                >
                                                                    {[
                                                                        { value: 'hourly', label: t('hourly'), rate: security.hourly_rate },
                                                                        { value: 'daily', label: t('daily'), rate: security.daily_rate },
                                                                        { value: 'regional', label: t('regional'), rate: Math.round(security.daily_rate * 1.5) },
                                                                        { value: 'overnight', label: t('overnight'), rate: security.daily_rate * 2 },
                                                                    ].map((rateOption) => (
                                                                        <button
                                                                            key={rateOption.value}
                                                                            onClick={() => {
                                                                                const reqIndex = selectedRequirements.findIndex((r) => r.type === 'security_companies' && r.id === security.id);
                                                                                if (reqIndex !== -1) {
                                                                                    updateRequirementRateType(reqIndex, rateOption.value as any);
                                                                                }
                                                                            }}
                                                                            className={`p-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                                                                                selectedReq?.rate_type === rateOption.value
                                                                                    ? 'bg-yellow-500 text-white shadow-md'
                                                                                    : 'bg-white/50 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-slate-700/80'
                                                                            }`}
                                                                        >
                                                                            <div className="font-semibold">{rateOption.label}</div>
                                                                            <div className="text-[10px] mt-0.5">₪{rateOption.rate}</div>
                                                                        </button>
                                                                    ))}
                                                                </motion.div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Entertainment Companies */}
                                    {shouldShowServiceType('external_entertainment_companies') && entertainmentCompanies.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="bg-white/10 dark:bg-slate-800/20 backdrop-blur-sm rounded-xl p-4 border border-white/30 dark:border-slate-700/40"
                                        >
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center">
                                                    <IconStar className="w-4 h-4 text-white" />
                                                </div>
                                                {t('entertainment')}
                                            </h3>
                                            <div className="space-y-3">
                                                {entertainmentCompanies.map((entertainment) => (
                                                    <div
                                                        key={entertainment.id}
                                                        className="flex items-center justify-between p-3 bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm rounded-lg border border-white/30 dark:border-slate-700/40"
                                                    >
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">{entertainment.name}</p>
                                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                                {entertainment.price} {t('fixed_price')}
                                                            </p>
                                                            {entertainment.description && <p className="text-xs text-purple-600 dark:text-purple-400">{entertainment.description}</p>}
                                                        </div>
                                                        <button
                                                            onClick={() => selectEntertainment(entertainment)}
                                                            className={`px-3 py-1 text-white text-sm rounded-lg transition-colors duration-200 ${
                                                                isSelected('external_entertainment_companies', entertainment.id)
                                                                    ? 'bg-green-500 hover:bg-green-600'
                                                                    : 'bg-purple-500 hover:bg-purple-600'
                                                            }`}
                                                        >
                                                            {isSelected('external_entertainment_companies', entertainment.id) ? t('selected') : t('select')}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Travel Companies */}
                                    {shouldShowServiceType('travel_companies') && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 }}
                                            className="bg-white/10 dark:bg-slate-800/20 backdrop-blur-sm rounded-xl p-4 border border-white/30 dark:border-slate-700/40"
                                        >
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                                                    <IconCar className="w-4 h-4 text-white" />
                                                </div>
                                                {t('travel_companies')}
                                            </h3>
                                            <div className="space-y-3">
                                                {travelCompanies.map((travelCompany) => (
                                                    <div
                                                        key={travelCompany.id}
                                                        className="flex items-center justify-between p-3 bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm rounded-lg border border-white/30 dark:border-slate-700/40"
                                                    >
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">{travelCompany.name}</p>
                                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                                {travelCompany.pricing_data?.default_price ? `${travelCompany.pricing_data.default_price}/day` : 'Contact for pricing'}
                                                            </p>
                                                            {travelCompany.phone && <p className="text-xs text-blue-600 dark:text-blue-400">{travelCompany.phone}</p>}
                                                        </div>
                                                        <button
                                                            onClick={() => selectTravelCompany(travelCompany)}
                                                            className={`px-3 py-1 text-white text-sm rounded-lg transition-colors duration-200 ${
                                                                isSelected('travel_companies', travelCompany.id) ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'
                                                            }`}
                                                        >
                                                            {isSelected('travel_companies', travelCompany.id) ? t('selected') : t('select')}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                {/* Right Column - Price Summary & Selection */}
                                <div className="space-y-6">
                                    {/* Total Price Summary */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-gradient-to-r from-emerald-100/40 to-blue-100/40 dark:from-emerald-800/30 dark:to-blue-800/30 backdrop-blur-md rounded-xl p-6 border border-emerald-200/50 dark:border-emerald-700/40 shadow-lg sticky top-6 self-start overflow-y-auto"
                                    >
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center">
                                                <IconCreditCard className="w-4 h-4 text-white" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('total_estimate')}</h3>
                                        </div>

                                        <div className="text-center mb-4">
                                            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{totalPrice.toFixed(2)}₪</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">{t('plus_destination_fees')}</p>
                                        </div>

                                        {selectedRequirements.length > 0 && (
                                            <div className="space-y-2 mb-4">
                                                <p className="text-sm font-medium text-gray-800 dark:text-white">{t('selected_services')}:</p>
                                                {selectedRequirements.map((req, idx) => {
                                                    // Get the service type label and color (matching the service icon colors)
                                                    const getServiceTypeInfo = (type: string) => {
                                                        const typeMap: { [key: string]: { label: string; color: string } } = {
                                                            paramedics: { label: t('paramedics') || 'Paramedics', color: 'bg-red-500/20 text-red-600 dark:text-red-400' },
                                                            guides: { label: t('guides') || 'Guides', color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400' },
                                                            security_companies: { label: t('security_companies') || 'Security', color: 'bg-orange-500/20 text-orange-600 dark:text-orange-400' },
                                                            external_entertainment_companies: {
                                                                label: t('external_entertainment_companies') || 'Entertainment',
                                                                color: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
                                                            },
                                                            travel_companies: { label: t('travel_companies') || 'Transportation', color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400' },
                                                        };
                                                        return typeMap[type] || { label: type, color: 'bg-gray-500/20 text-gray-600 dark:text-gray-400' };
                                                    };

                                                    const serviceInfo = getServiceTypeInfo(req.type);

                                                    return (
                                                        <div key={idx} className="flex flex-col gap-2 text-sm bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm rounded-lg p-3">
                                                            <div className="flex justify-between items-center">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-gray-700 dark:text-gray-300 font-medium">{req.name}</span>
                                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${serviceInfo.color}`}>{serviceInfo.label}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-semibold text-gray-900 dark:text-white">₪{req.cost}</span>
                                                                    <button
                                                                        onClick={() => removeRequirement(idx)}
                                                                        className="text-red-400 hover:text-red-600 transition-colors duration-200 p-1"
                                                                        title={t('remove')}
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth={2}
                                                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                            />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{req.rate_type}</p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Validation Message */}
                                        {(() => {
                                            const validation = getValidationErrors();
                                            return !validation.isValid ? (
                                                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700/50 rounded-lg">
                                                    <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">{t('must_select_required_services')}:</p>
                                                    <ul className="text-sm text-red-700 dark:text-red-400 list-disc list-inside">
                                                        {validation.errors.map((error, idx) => (
                                                            <li key={idx}>{error}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ) : null;
                                        })()}

                                        <motion.button
                                            whileHover={getValidationErrors().isValid ? { scale: 1.02 } : {}}
                                            whileTap={getValidationErrors().isValid ? { scale: 0.98 } : {}}
                                            onClick={openCheckout}
                                            disabled={!getValidationErrors().isValid}
                                            className={`w-full font-semibold py-3 rounded-xl transition-colors duration-300 ${
                                                getValidationErrors().isValid
                                                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer shadow-lg hover:shadow-emerald-500/25'
                                                    : 'bg-red-500 text-white cursor-not-allowed opacity-75'
                                            }`}
                                        >
                                            {getValidationErrors().isValid ? t('proceed_to_booking') : t('select_required_services_first')}
                                        </motion.button>
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Destination Details Modal */}
            <DestinationDetailsModal destination={selectedDestination} zones={zones} isOpen={isModalOpen} onClose={closeDestinationModal} />

            {/* Checkout Modal */}
            <AnimatePresence>
                {showCheckoutModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
                        onClick={(e) => {
                            if (e.target === e.currentTarget && paymentStep !== 'success') {
                                closeCheckout();
                            }
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/30 w-full max-w-md overflow-hidden"
                        >
                            {/* Payment Step */}
                            {paymentStep === 'payment' && (
                                <div className="p-8">
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('checkout')}</h2>
                                        <button
                                            onClick={closeCheckout}
                                            className="w-8 h-8 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors duration-200"
                                        >
                                            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Order Summary */}
                                    <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-4 mb-6">
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('checkout_order_summary')}</h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">{t('destination')}</span>
                                                <span className="text-gray-900 dark:text-white font-medium">{selectedForPlanning?.name}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">{t('trip_date')}</span>
                                                <span className="text-gray-900 dark:text-white font-medium">
                                                    {selectedDate?.toLocaleDateString(t('locale'), {
                                                        weekday: 'short',
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </span>
                                            </div>
                                            {selectedRequirements.map((req, idx) => (
                                                <div key={idx} className="flex justify-between text-sm">
                                                    <span className="text-gray-600 dark:text-gray-400">{req.name}</span>
                                                    <span className="text-gray-900 dark:text-white">{(req.cost * req.quantity * (req.days || 1)).toFixed(2)}</span>
                                                </div>
                                            ))}
                                            <div className="border-t dark:border-slate-700 pt-2 mt-3">
                                                <div className="flex justify-between font-semibold text-lg">
                                                    <span className="text-gray-900 dark:text-white">{t('checkout_total')}</span>
                                                    <span className="text-emerald-600 dark:text-emerald-400">{totalPrice.toFixed(2)}₪</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Method */}
                                    <div className="mb-6">
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('checkout_payment_method')}</h3>
                                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-700/40">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                                        />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">{t('checkout_bank_transfer') || t('bank_transfer')}</h4>
                                                    <p className="text-sm text-blue-700 dark:text-blue-300">{t('bank_transfer_only')}</p>
                                                </div>
                                            </div>

                                            {/* Bank Details */}
                                            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg p-3 space-y-2">
                                                <div className="grid grid-cols-3 gap-2 text-sm">
                                                    <span className="text-gray-600 dark:text-gray-400">{t('checkout_bank_name') || t('bank_name')}:</span>
                                                    <span className="col-span-2 font-mono text-gray-900 dark:text-white">National Bank Ltd.</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 text-sm">
                                                    <span className="text-gray-600 dark:text-gray-400">{t('checkout_account_number') || t('account_number')}:</span>
                                                    <span className="col-span-2 font-mono text-gray-900 dark:text-white">123-456-7890123</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 text-sm">
                                                    <span className="text-gray-600 dark:text-gray-400">{t('account_name')}:</span>
                                                    <span className="col-span-2 font-mono text-gray-900 dark:text-white">Travel Company Ltd.</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 text-sm">
                                                    <span className="text-gray-600 dark:text-gray-400">{t('swift_code')}:</span>
                                                    <span className="col-span-2 font-mono text-gray-900 dark:text-white">NBANKXXX</span>
                                                </div>
                                            </div>

                                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-3">{t('bank_transfer_instruction')}</p>
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <motion.button
                                        type="button"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handlePaymentSubmit();
                                        }}
                                        disabled={isProcessingPayment}
                                        className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-semibold py-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isProcessingPayment ? (
                                            <>
                                                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                    ></path>
                                                </svg>
                                                {t('processing_payment')}
                                            </>
                                        ) : (
                                            <>{t('confirm_payment_sent')}</>
                                        )}
                                    </motion.button>
                                </div>
                            )}

                            {/* Success Step */}
                            {paymentStep === 'success' && (
                                <div className="p-8 text-center">
                                    {/* Success Animation */}
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', duration: 0.5 }}
                                        className="w-20 h-20 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                                    >
                                        <motion.svg
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ delay: 0.3, duration: 0.6 }}
                                            className="w-10 h-10 text-white"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </motion.svg>
                                    </motion.div>

                                    {/* Success Message */}
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{t('booking_successful')}</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-6">{t('booking_confirmation_message')}</p>

                                        {/* Booking Details */}
                                        <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-4 mb-6 text-left">
                                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('booking_details')}</h3>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 dark:text-gray-400">{t('booking_id')}:</span>
                                                    <span className="font-mono text-gray-900 dark:text-white">{bookingReference}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 dark:text-gray-400">{t('destination')}:</span>
                                                    <span className="text-gray-900 dark:text-white">{selectedForPlanning?.name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 dark:text-gray-400">{t('trip_date')}:</span>
                                                    <span className="text-gray-900 dark:text-white">
                                                        {selectedDate?.toLocaleDateString(t('locale'), {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                        })}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 dark:text-gray-400">{t('total_paid')}:</span>
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{totalPrice.toFixed(2)}₪</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-3">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handleBookingComplete}
                                                className="flex-1 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-semibold py-3 rounded-xl transition-all duration-300"
                                            >
                                                {t('done')}
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
