'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import IconCar from '@/components/icon/icon-car';
import IconCoffee from '@/components/icon/icon-coffee';
import IconUsersGroup from '@/components/icon/icon-users-group';
import IconLock from '@/components/icon/icon-lock';
import IconStar from '@/components/icon/icon-star';
import DestinationDetailsModal from '@/components/modals/destination-details-modal';

type Destination = {
    id: string;
    name: string;
    address: string | null;
    zone_id: string | null;
    thumbnail_path: string | null;
    gallery_paths?: string[] | null;
    properties: string[] | null;
    requirements: string[] | null;
    suitable_for: string[] | null;
    pricing: { child?: number; teen?: number; adult?: number; guide?: number } | null;
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
    status: string;
};

type ExternalEntertainmentCompany = {
    id: string;
    name: string;
    price: number;
    description?: string | null;
    status: string;
};

type RequirementSelection = {
    id: string;
    name: string;
    type: 'paramedics' | 'guides' | 'security_companies' | 'external_entertainment_companies';
    quantity: number;
    rate_type: 'hourly' | 'daily' | 'fixed';
    cost: number;
    hours?: number;
    days?: number;
};

const PROPERTY_FILTERS = [
    'indoor_activities',
    'outdoor_activities',
    'educational_value',
    'entertainment_value',
    'historical_significance',
    'natural_beauty',
    'accessibility',
    'parking_available',
    'restroom_facilities',
    'food_services',
];

const SUITABLE_FOR_FILTERS = ['kindergarten', 'elementary', 'high_school', 'college', 'families', 'teachers'];

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
    const [currentView, setCurrentView] = useState<'dashboard' | 'destinations'>('dashboard');
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(false);

    // Filter states
    const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
    const [selectedSuitableFor, setSuitableFor] = useState<string[]>([]);
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
    const [selectedRequirements, setSelectedRequirements] = useState<RequirementSelection[]>([]);
    const [totalPrice, setTotalPrice] = useState<number>(0);

    // Checkout modal states
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [paymentStep, setPaymentStep] = useState<'payment' | 'confirmation' | 'success'>('payment');
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [bookingReference, setBookingReference] = useState<string>('');

    // Filtered destinations
    const [filteredDestinations, setFilteredDestinations] = useState<Destination[]>([]);

    useEffect(() => {
        if (currentView === 'destinations') {
            loadDestinations();
        }
    }, [currentView]);

    useEffect(() => {
        // Apply filters
        let filtered = destinations;

        if (selectedProperties.length > 0) {
            filtered = filtered.filter((dest) => dest.properties?.some((prop) => selectedProperties.includes(prop)) ?? false);
        }

        if (selectedSuitableFor.length > 0) {
            filtered = filtered.filter((dest) => dest.suitable_for?.some((suitable) => selectedSuitableFor.includes(suitable)) ?? false);
        }

        setFilteredDestinations(filtered);
    }, [destinations, selectedProperties, selectedSuitableFor]);

    const loadDestinations = async () => {
        try {
            setLoading(true);
            const [{ data: destData, error: destError }, { data: zoneData, error: zoneError }] = await Promise.all([
                supabase.from('destinations').select('id, name, address, zone_id, thumbnail_path, gallery_paths, properties, requirements, suitable_for, pricing').order('name'),
                supabase.from('zones').select('id, name').eq('is_active', true),
            ]);

            if (destError) throw destError;
            if (zoneError) throw zoneError;

            setDestinations(destData || []);
            setZones(zoneData || []);
        } catch (error) {
            console.error('Error loading destinations:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadRequirementsData = async () => {
        try {
            const [
                { data: paramedicsData, error: paramedicsError },
                { data: guidesData, error: guidesError },
                { data: securityData, error: securityError },
                { data: entertainmentData, error: entertainmentError },
            ] = await Promise.all([
                // Paramedics: id, name, phone, email, hourly_rate, daily_rate, status
                supabase.from('paramedics').select('id, name, phone, email, hourly_rate, daily_rate, status').eq('status', 'active'),
                // Guides: id, name, phone, email, hourly_rate, daily_rate, status
                supabase.from('guides').select('id, name, phone, email, hourly_rate, daily_rate, status').eq('status', 'active'),
                // Security companies: id, name, phone, email, status (no hourly/daily rates in schema)
                supabase.from('security_companies').select('id, name, phone, email, status').eq('status', 'active'),
                // Entertainment companies: id, name, price, description, status
                supabase.from('external_entertainment_companies').select('id, name, price, description, status').eq('status', 'active'),
            ]);

            if (paramedicsError) throw paramedicsError;
            if (guidesError) throw guidesError;
            if (securityError) throw securityError;
            if (entertainmentError) throw entertainmentError;

            setParamedics(paramedicsData || []);
            setGuides(guidesData || []);
            setSecurityCompanies(securityData || []);
            setEntertainmentCompanies(entertainmentData || []);
        } catch (error) {
            console.error('Error loading requirements data:', error);
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
        let total = 0;

        requirements.forEach((req) => {
            let itemPrice = 0;

            switch (req.type) {
                case 'paramedics':
                    const paramedic = paramedics.find((p) => p.id === req.id);
                    if (paramedic) {
                        if (req.rate_type === 'hourly') {
                            itemPrice = paramedic.hourly_rate * (req.hours || 1) * req.quantity;
                        } else {
                            itemPrice = paramedic.daily_rate * (req.days || 1) * req.quantity;
                        }
                    }
                    break;
                case 'guides':
                    const guide = guides.find((g) => g.id === req.id);
                    if (guide) {
                        if (req.rate_type === 'hourly') {
                            itemPrice = guide.hourly_rate * (req.hours || 1) * req.quantity;
                        } else {
                            itemPrice = guide.daily_rate * (req.days || 1) * req.quantity;
                        }
                    }
                    break;
                case 'security_companies':
                    const security = securityCompanies.find((s) => s.id === req.id);
                    if (security) {
                        // Security companies don't have hourly/daily rates in the schema
                        // Use a fixed rate for now
                        itemPrice = 100 * (req.days || 1) * req.quantity; // Fixed daily rate of $100
                    }
                    break;
                case 'external_entertainment_companies':
                    const entertainment = entertainmentCompanies.find((e) => e.id === req.id);
                    if (entertainment) {
                        itemPrice = entertainment.price * req.quantity;
                    }
                    break;
            }

            total += itemPrice;
        });

        return total;
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
            // Add new selection with fixed daily rate
            setSelectedRequirements((prev) => [
                ...prev,
                {
                    type: 'security_companies',
                    id: security.id,
                    name: security.name,
                    quantity: 1,
                    rate_type: 'daily',
                    cost: 100, // Fixed daily rate since not in schema
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

    // Validation function to check if all required services and trip date are selected
    const validateRequiredServices = () => {
        const missingServices: string[] = [];

        // Check if trip date is selected
        if (!selectedDate) {
            missingServices.push(t('trip_date'));
        }

        // Check required services only if destination has requirements
        if (selectedForPlanning?.requirements && selectedForPlanning.requirements.length > 0) {
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
        const validation = validateRequiredServices();

        if (!validation.isValid) {
            // Show error message for missing required services
            alert(`${t('must_select_required_services')}: ${validation.missingServices.join(', ')}`);
            return;
        }

        setShowCheckoutModal(true);
        setPaymentStep('payment');
    };

    const closeCheckout = () => {
        setShowCheckoutModal(false);
        setPaymentStep('payment');
        setIsProcessingPayment(false);
    };

    const handlePaymentSubmit = async () => {
        setIsProcessingPayment(true);

        try {
            // Create booking record with services stored as JSON
            const bookingData = {
                destination_id: selectedForPlanning?.id,
                trip_date: selectedDate?.toISOString().split('T')[0],
                total_amount: totalPrice,
                payment_status: 'paid',
                payment_method: 'bank_transfer',
                status: 'confirmed',
                customer_name: 'Customer Name', // TODO: Get from user profile
                customer_email: 'customer@example.com', // TODO: Get from user profile
                customer_phone: '+1234567890', // TODO: Get from user profile
                services: selectedRequirements, // Store all selected services as JSON
                notes: 'Booking created via trip planner',
            };

            const { data: booking, error: bookingError } = await supabase.from('bookings').insert([bookingData]).select().single();

            if (bookingError) {
                console.error('Error creating booking:', bookingError);
                throw bookingError;
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
        setShowRequirementsSection(false);
        setBookingReference('');
        closeCheckout();
    };

    useEffect(() => {
        const newTotal = calculateTotalPrice(selectedRequirements);
        setTotalPrice(newTotal);
    }, [selectedRequirements, paramedics, guides, securityCompanies, entertainmentCompanies]);

    const togglePropertyFilter = (property: string) => {
        setSelectedProperties((prev) => (prev.includes(property) ? prev.filter((p) => p !== property) : [...prev, property]));
    };

    const toggleSuitableForFilter = (suitable: string) => {
        setSuitableFor((prev) => (prev.includes(suitable) ? prev.filter((s) => s !== suitable) : [...prev, suitable]));
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

    const shortcuts = [
        {
            id: 'new-trip',
            title: t('new_trip'),
            description: t('start_planning_new_trip'),
            icon: IconPlus,
            color: 'from-blue-500 to-blue-600',
            shadowColor: 'shadow-blue-500/25',
            onClick: () => setCurrentView('destinations'),
        },
        {
            id: 'my-trips',
            title: t('my_trips'),
            description: t('view_manage_trips'),
            icon: IconCalendar,
            color: 'from-green-500 to-green-600',
            shadowColor: 'shadow-green-500/25',
            onClick: () => {}, // TODO: Navigate to trips
        },
        {
            id: 'transactions',
            title: t('my_transactions'),
            description: t('view_payment_history'),
            icon: IconCreditCard,
            color: 'from-purple-500 to-purple-600',
            shadowColor: 'shadow-purple-500/25',
            onClick: () => {}, // TODO: Navigate to transactions
        },
        {
            id: 'profile',
            title: t('my_profile'),
            description: t('manage_account_settings'),
            icon: IconUser,
            color: 'from-orange-500 to-orange-600',
            shadowColor: 'shadow-orange-500/25',
            onClick: () => {}, // TODO: Navigate to profile
        },
        {
            id: 'settings',
            title: t('settings'),
            description: t('app_preferences'),
            icon: IconSettings,
            color: 'from-gray-500 to-gray-600',
            shadowColor: 'shadow-gray-500/25',
            onClick: () => {}, // TODO: Navigate to settings
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
                                className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-4"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.8, type: 'spring' }}
                            >
                                {t('welcome_trip_planner')}
                            </motion.h1>
                            <motion.p
                                className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2, duration: 0.6 }}
                            >
                                {t('trip_planner_subtitle')}
                            </motion.p>
                        </motion.div>

                        {/* Action Shortcuts Grid */}
                        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                            {shortcuts.map((shortcut, index) => (
                                <motion.div
                                    key={shortcut.id}
                                    variants={cardVariants}
                                    whileHover="hover"
                                    whileTap={{ scale: 0.95 }}
                                    className={`relative group cursor-pointer`}
                                    onClick={shortcut.onClick}
                                    style={{
                                        animationDelay: `${index * 0.1}s`,
                                    }}
                                >
                                    <div
                                        className={`absolute inset-0 bg-gradient-to-r ${shortcut.color} rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-all duration-300 ${shortcut.shadowColor} shadow-2xl`}
                                    ></div>
                                    <div className="relative bg-white dark:bg-slate-900/80 rounded-2xl p-8 border border-gray-200/50 dark:border-slate-700/60 backdrop-blur-sm hover:border-gray-300 dark:hover:border-slate-600 transition-all duration-300">
                                        <div
                                            className={`w-16 h-16 bg-gradient-to-r ${shortcut.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                                        >
                                            <shortcut.icon className="h-8 w-8 text-white" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                                            {shortcut.title}
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{shortcut.description}</p>
                                        <div className="absolute bottom-7 ltr:right-6 rtl:left-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center">
                                                <svg className="w-4 h-4 text-white ltr:rotate-0 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
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
                                    {PROPERTY_FILTERS.map((property, index) => (
                                        <motion.button
                                            key={property}
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() => togglePropertyFilter(property)}
                                            className={`relative p-3 rounded-xl text-sm font-medium transition-all duration-300 border-2 ${
                                                selectedProperties.includes(property)
                                                    ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/25'
                                                    : 'bg-gray-50 dark:bg-slate-800/60 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500'
                                            }`}
                                        >
                                            {t(`property_${property}`)}
                                            {selectedProperties.includes(property) && (
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
                                    {SUITABLE_FOR_FILTERS.map((suitable, index) => (
                                        <motion.button
                                            key={suitable}
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() => toggleSuitableForFilter(suitable)}
                                            className={`relative p-3 rounded-xl text-sm font-medium transition-all duration-300 border-2 ${
                                                selectedSuitableFor.includes(suitable)
                                                    ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/25'
                                                    : 'bg-gray-50 dark:bg-slate-800/60 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:border-green-300 dark:hover:border-green-500'
                                            }`}
                                        >
                                            {t(`suitable_${suitable}`)}
                                            {selectedSuitableFor.includes(suitable) && (
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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="bg-white dark:bg-slate-900/80 rounded-2xl p-6 animate-pulse">
                                        <div className="w-full h-48 bg-gray-300 dark:bg-slate-700 rounded-xl mb-4"></div>
                                        <div className="h-6 bg-gray-300 dark:bg-slate-700 rounded mb-2"></div>
                                        <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded mb-4 w-3/4"></div>
                                        <div className="h-10 bg-gray-300 dark:bg-slate-700 rounded"></div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
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
                                        className="group cursor-pointer"
                                    >
                                        <div className="relative bg-white/20 dark:bg-slate-900/30 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl border border-white/30 dark:border-slate-700/40 transition-all duration-500 hover:bg-white/30 dark:hover:bg-slate-900/40 hover:border-white/50 dark:hover:border-slate-600/60">
                                            {/* Image */}
                                            <div className="relative h-48 overflow-hidden">
                                                <img
                                                    src={destination.thumbnail_path ? getPublicUrlFromPath(destination.thumbnail_path) : '/assets/images/img-placeholder-fallback.webp'}
                                                    alt={destination.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
                                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    <div
                                                        className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-lg cursor-pointer hover:bg-white/30 hover:scale-110 transition-all duration-200"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openDestinationModal(destination);
                                                        }}
                                                    >
                                                        <IconEye className="h-5 w-5 text-white drop-shadow-sm" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-6 bg-white/10 dark:bg-slate-800/10 backdrop-blur-sm">
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 drop-shadow-sm">
                                                    {destination.name}
                                                </h3>
                                                <div className="flex items-center text-gray-700 dark:text-gray-200 mb-4">
                                                    <IconMapPin className="h-4 w-4 ltr:mr-2 rtl:ml-2 flex-shrink-0" />
                                                    <span className="text-sm truncate drop-shadow-sm">{getZoneName(destination.zone_id)}</span>
                                                </div>

                                                {/* Requirements */}
                                                {destination.requirements && destination.requirements.length > 0 && (
                                                    <div className="mb-4">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 drop-shadow-sm">{t('trip_requirements')}</span>
                                                            <div className="flex-1 h-px bg-white/30 dark:bg-slate-600/50"></div>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {destination.requirements.slice(0, 4).map((requirement, idx) => {
                                                                const IconComponent = getRequirementIcon(requirement);
                                                                return (
                                                                    <motion.div
                                                                        key={idx}
                                                                        initial={{ scale: 0 }}
                                                                        animate={{ scale: 1 }}
                                                                        transition={{ delay: idx * 0.1 }}
                                                                        className="flex items-center gap-1 bg-amber-200/30 dark:bg-amber-500/20 backdrop-blur-sm px-2 py-1 rounded-lg border border-amber-300/50 dark:border-amber-500/30 shadow-sm"
                                                                    >
                                                                        <IconComponent className="h-3 w-3 text-amber-700 dark:text-amber-300 drop-shadow-sm" />
                                                                        <span className="text-xs font-medium text-amber-800 dark:text-amber-200 drop-shadow-sm">{t(requirement)}</span>
                                                                    </motion.div>
                                                                );
                                                            })}
                                                            {destination.requirements.length > 4 && (
                                                                <div className="flex items-center justify-center bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/40 dark:border-slate-600/40 shadow-sm">
                                                                    <span className="text-xs font-medium text-gray-800 dark:text-gray-200 drop-shadow-sm">+{destination.requirements.length - 4}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Detailed Pricing */}
                                                {destination.pricing && (
                                                    <div className="mb-4">
                                                        <div className="bg-gradient-to-r from-emerald-100/40 to-blue-100/40 dark:from-emerald-800/30 dark:to-blue-800/30 backdrop-blur-md rounded-xl p-4 border border-emerald-200/50 dark:border-emerald-700/40 shadow-lg">
                                                            {/* Header */}
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div className="flex items-center gap-2">
                                                                    <IconCreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400 drop-shadow-sm" />
                                                                    <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 drop-shadow-sm">{t('trip_pricing')}</span>
                                                                </div>
                                                                <div className="text-xs text-gray-600 dark:text-gray-300 bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm px-2 py-1 rounded-md border border-white/40 dark:border-slate-600/40 shadow-sm">
                                                                    {t('per_person')}
                                                                </div>
                                                            </div>

                                                            {/* Price Grid */}
                                                            <div className="space-y-2 mb-3">
                                                                {destination.pricing.child && (
                                                                    <div className="flex items-center justify-between bg-white/40 dark:bg-slate-700/40 backdrop-blur-sm rounded-lg p-2 border border-white/50 dark:border-slate-600/50 shadow-sm">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                                                                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200 drop-shadow-sm">{t('child_price')}</span>
                                                                        </div>
                                                                        <span className="text-sm font-bold text-green-600 dark:text-green-400 drop-shadow-sm">{destination.pricing.child}₪</span>
                                                                    </div>
                                                                )}
                                                                {destination.pricing.teen && (
                                                                    <div className="flex items-center justify-between bg-white/40 dark:bg-slate-700/40 backdrop-blur-sm rounded-lg p-2 border border-white/50 dark:border-slate-600/50 shadow-sm">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
                                                                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200 drop-shadow-sm">{t('teen_price')}</span>
                                                                        </div>
                                                                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400 drop-shadow-sm">{destination.pricing.teen}₪</span>
                                                                    </div>
                                                                )}
                                                                {destination.pricing.adult && (
                                                                    <div className="flex items-center justify-between bg-white/40 dark:bg-slate-700/40 backdrop-blur-sm rounded-lg p-2 border border-white/50 dark:border-slate-600/50 shadow-sm">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-3 h-3 bg-purple-500 rounded-full shadow-sm"></div>
                                                                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200 drop-shadow-sm">{t('adult_price')}</span>
                                                                        </div>
                                                                        <span className="text-sm font-bold text-purple-600 dark:text-purple-400 drop-shadow-sm">{destination.pricing.adult}₪</span>
                                                                    </div>
                                                                )}
                                                                {destination.pricing.guide && (
                                                                    <div className="flex items-center justify-between bg-white/40 dark:bg-slate-700/40 backdrop-blur-sm rounded-lg p-2 border border-white/50 dark:border-slate-600/50 shadow-sm">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-3 h-3 bg-orange-500 rounded-full shadow-sm"></div>
                                                                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200 drop-shadow-sm">{t('guide_price')}</span>
                                                                        </div>
                                                                        <span className="text-sm font-bold text-orange-600 dark:text-orange-400 drop-shadow-sm">{destination.pricing.guide}₪</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                {/* Action Buttons */}
                                                <div className="flex gap-2">
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSelectForPlanning(destination);
                                                        }}
                                                        className="flex-1 bg-gradient-to-r from-blue-500/80 to-blue-600/80 hover:from-blue-600/90 hover:to-blue-700/90 backdrop-blur-md text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl border border-blue-400/30 hover:border-blue-300/50"
                                                    >
                                                        <span className="drop-shadow-sm">{t('choose_this_destination')}</span>
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openDestinationModal(destination);
                                                        }}
                                                        className="bg-white/20 hover:bg-white/30 dark:bg-slate-800/40 dark:hover:bg-slate-800/60 backdrop-blur-md text-gray-800 dark:text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl border border-white/30 dark:border-slate-700/40 hover:border-white/50 dark:hover:border-slate-600/60"
                                                    >
                                                        <IconEye className="h-5 w-5" />
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

            {/* Requirements Selection Section */}
            <AnimatePresence>
                {showRequirementsSection && selectedForPlanning && (
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
                                    <h2 className="text-2xl font-bold text-white mb-2">{t('plan_your_trip')}</h2>
                                    <p className="text-blue-100">
                                        {t('selected_destination')}: <span className="font-semibold">{selectedForPlanning.name}</span>
                                    </p>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowRequirementsSection(false)}
                                    className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 hover:bg-white/30 transition-all duration-300"
                                >
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </motion.button>
                            </div>

                            {/* Required Services Indicator */}
                            {selectedForPlanning.requirements && selectedForPlanning.requirements.length > 0 ? (
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

                        {/* Content */}
                        <div className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Left Column - Services Selection */}
                                <div className="space-y-6">
                                    {/* Show message if no requirements */}
                                    {(!selectedForPlanning.requirements || selectedForPlanning.requirements.length === 0) && (
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
                                    {selectedForPlanning.requirements?.includes('paramedics') && paramedics.length > 0 && (
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
                                                {paramedics.map((paramedic) => (
                                                    <div
                                                        key={paramedic.id}
                                                        className="flex items-center justify-between p-3 bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm rounded-lg border border-white/30 dark:border-slate-700/40"
                                                    >
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">{paramedic.name}</p>
                                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                                {paramedic.hourly_rate}₪/hr • {paramedic.daily_rate}₪/day
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => selectParamedic(paramedic)}
                                                            className={`px-3 py-1 text-white text-sm rounded-lg transition-colors duration-200 ${
                                                                isSelected('paramedics', paramedic.id) ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                                                            }`}
                                                        >
                                                            {isSelected('paramedics', paramedic.id) ? t('selected') : t('select')}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Guides */}
                                    {selectedForPlanning.requirements?.includes('guides') && guides.length > 0 && (
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
                                                {guides.map((guide) => (
                                                    <div
                                                        key={guide.id}
                                                        className="flex items-center justify-between p-3 bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm rounded-lg border border-white/30 dark:border-slate-700/40"
                                                    >
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">{guide.name}</p>
                                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                                ${guide.hourly_rate}/hr • ${guide.daily_rate}/day
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => selectGuide(guide)}
                                                            className={`px-3 py-1 text-white text-sm rounded-lg transition-colors duration-200 ${
                                                                isSelected('guides', guide.id) ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'
                                                            }`}
                                                        >
                                                            {isSelected('guides', guide.id) ? t('selected') : t('select')}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Security Companies */}
                                    {(selectedForPlanning.requirements?.includes('security') || selectedForPlanning.requirements?.includes('security_companies')) && securityCompanies.length > 0 && (
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
                                                {securityCompanies.map((security) => (
                                                    <div
                                                        key={security.id}
                                                        className="flex items-center justify-between p-3 bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm rounded-lg border border-white/30 dark:border-slate-700/40"
                                                    >
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">{security.name}</p>
                                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                                {t('contact')}: {security.phone || security.email || t('contact_company')}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => selectSecurity(security)}
                                                            className={`px-3 py-1 text-white text-sm rounded-lg transition-colors duration-200 ${
                                                                isSelected('security_companies', security.id) ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'
                                                            }`}
                                                        >
                                                            {isSelected('security_companies', security.id) ? t('selected') : t('select')}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Entertainment Companies */}
                                    {(selectedForPlanning.requirements?.includes('entertainment') || selectedForPlanning.requirements?.includes('external_entertainment_companies')) &&
                                        entertainmentCompanies.length > 0 && (
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
                                                                    ${entertainment.price} {t('fixed_price')}
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
                                </div>

                                {/* Right Column - Price Summary & Selection */}
                                <div className="space-y-6">
                                    {/* Total Price Summary */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-gradient-to-r from-emerald-100/40 to-blue-100/40 dark:from-emerald-800/30 dark:to-blue-800/30 backdrop-blur-md rounded-xl p-6 border border-emerald-200/50 dark:border-emerald-700/40 shadow-lg"
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
                                                {selectedRequirements.map((req, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-sm bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm rounded-lg p-2">
                                                        <span className="text-gray-700 dark:text-gray-300">{req.name}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-gray-900 dark:text-white">${(req.cost * req.quantity * (req.days || 1)).toFixed(2)}</span>
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
                                                ))}
                                            </div>
                                        )}

                                        {/* Validation Message */}
                                        {!validateRequiredServices().isValid && (
                                            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700/50 rounded-lg">
                                                <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">{t('must_select_required_services')}:</p>
                                                <ul className="text-sm text-red-700 dark:text-red-400 list-disc list-inside">
                                                    {validateRequiredServices().missingServices.map((service, idx) => (
                                                        <li key={idx}>{service}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={openCheckout}
                                            className={`w-full font-semibold py-3 rounded-xl transition-colors duration-300 ${
                                                validateRequiredServices().isValid ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
                                            }`}
                                        >
                                            {validateRequiredServices().isValid ? t('proceed_to_booking') : t('select_required_services_first')}
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
                                                    <span className="text-gray-900 dark:text-white">${(req.cost * req.quantity * (req.days || 1)).toFixed(2)}</span>
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
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handlePaymentSubmit}
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
