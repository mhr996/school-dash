'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTranslation } from '@/i18n';
import supabase from '@/lib/supabase';
import { getCurrentUserWithRole } from '@/lib/auth';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconCalendar from '@/components/icon/icon-calendar';
import IconClock from '@/components/icon/icon-clock';
import IconUsers from '@/components/icon/icon-users';
import IconDollarSign from '@/components/icon/icon-dollar-sign';
import IconSearch from '@/components/icon/icon-search';
import IconFilter from '@/components/icon/icon-filter';
import IconEye from '@/components/icon/icon-eye';
import IconEdit from '@/components/icon/icon-edit';
import IconTrash from '@/components/icon/icon-trash';
import IconPlus from '@/components/icon/icon-plus';

type Trip = {
    id: string;
    trip_name: string;
    description: string | null;
    destination: string;
    departure_date: string;
    return_date: string;
    departure_time: string | null;
    return_time: string | null;
    max_students: number;
    cost_per_student: number;
    grade_levels: string | null;
    trip_type: string;
    status: 'planning' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
    meeting_point: string | null;
    emergency_contact: string | null;
    special_requirements: string | null;
    created_at: string;
    updated_at: string;
    created_by: string;
    // Registration info
    registration_count?: number;
    my_registration?: {
        id: string;
        status: string;
        payment_status: string;
        amount_paid: number;
        registration_date: string;
    };
};

type FilterType = 'all' | 'upcoming' | 'completed' | 'cancelled';

const statusColors = {
    planning: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-200/50 dark:border-yellow-600/30',
    confirmed: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-600/30',
    in_progress: 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-200/50 dark:border-green-600/30',
    completed: 'bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-200/50 dark:border-gray-600/30',
    cancelled: 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-200/50 dark:border-red-600/30',
};

const paymentStatusColors = {
    unpaid: 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-200/50 dark:border-red-600/30',
    partial: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-200/50 dark:border-yellow-600/30',
    paid: 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-200/50 dark:border-green-600/30',
};

export default function MyTripsPage() {
    const [user, setUser] = useState<any>(null);
    const [t, setT] = useState<any>({});
    const [trips, setTrips] = useState<Trip[]>([]);
    const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
    const [showTripDetails, setShowTripDetails] = useState(false);

    useEffect(() => {
        const loadTranslations = async () => {
            const translations = await getTranslation();
            setT(translations);
        };
        loadTranslations();
    }, []);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const { user: userData, error } = await getCurrentUserWithRole();
                if (userData && !error) {
                    setUser(userData);
                }
            } catch (error) {
                console.error('Error loading user:', error);
            }
        };
        loadUser();
    }, []);

    const fetchTrips = async () => {
        if (!user?.id) return;

        try {
            setLoading(true);

            // Fetch trips with registration info
            const { data: tripsData, error: tripsError } = await supabase
                .from('trips')
                .select(
                    `
                    *,
                    trip_registrations!inner(
                        id,
                        status,
                        payment_status,
                        amount_paid,
                        registration_date,
                        registered_by
                    )
                `,
                )
                .eq('trip_registrations.registered_by', user.id)
                .order('departure_date', { ascending: false });

            if (tripsError) throw tripsError;

            // Transform data to include registration info
            const transformedTrips =
                tripsData?.map((trip) => ({
                    ...trip,
                    my_registration: trip.trip_registrations[0],
                })) || [];

            setTrips(transformedTrips);
        } catch (error) {
            console.error('Error fetching trips:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrips();
    }, [user?.id]);

    useEffect(() => {
        let filtered = trips;

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(
                (trip) =>
                    trip.trip_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    trip.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    trip.description?.toLowerCase().includes(searchTerm.toLowerCase()),
            );
        }

        // Apply status filter
        if (filterType !== 'all') {
            const now = new Date();
            filtered = filtered.filter((trip) => {
                const departureDate = new Date(trip.departure_date);
                const returnDate = new Date(trip.return_date);

                switch (filterType) {
                    case 'upcoming':
                        return departureDate > now && trip.status !== 'cancelled';
                    case 'completed':
                        return returnDate < now || trip.status === 'completed';
                    case 'cancelled':
                        return trip.status === 'cancelled';
                    default:
                        return true;
                }
            });
        }

        setFilteredTrips(filtered);
    }, [trips, searchTerm, filterType]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatTime = (timeString: string | null) => {
        if (!timeString) return '';
        return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getTripStatus = (trip: Trip) => {
        const now = new Date();
        const departureDate = new Date(trip.departure_date);
        const returnDate = new Date(trip.return_date);

        if (trip.status === 'cancelled') return 'cancelled';
        if (returnDate < now) return 'completed';
        if (departureDate <= now && returnDate >= now) return 'in_progress';
        if (departureDate > now && trip.status === 'confirmed') return 'confirmed';
        return 'planning';
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.3,
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.5 },
        },
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 min-h-screen">
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{t.my_trips || 'My Trips'}</h1>
                        <p className="text-gray-600 dark:text-gray-300">{t.my_trips_description || 'Manage and track all your registered trips'}</p>
                    </div>
                </motion.div>

                {/* Search and Filters */}
                <motion.div variants={itemVariants} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-slate-700/40 p-6 shadow-xl">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder={t.search_trips || 'Search trips...'}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-gray-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
                            />
                        </div>

                        {/* Filter Buttons */}
                        <div className="flex flex-wrap gap-2">
                            {(['all', 'upcoming', 'completed', 'cancelled'] as FilterType[]).map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setFilterType(filter)}
                                    className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                                        filterType === filter
                                            ? 'bg-blue-500 text-white shadow-lg'
                                            : 'bg-white/50 dark:bg-slate-700/50 hover:bg-white/70 dark:hover:bg-slate-700/70 text-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    {t[`filter_${filter}`] || filter.charAt(0).toUpperCase() + filter.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Trips Grid */}
                <motion.div variants={itemVariants}>
                    {filteredTrips.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredTrips.map((trip, index) => (
                                <motion.div
                                    key={trip.id}
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
                                    onClick={() => {
                                        setSelectedTrip(trip);
                                        setShowTripDetails(true);
                                    }}
                                >
                                    <div className="relative bg-white/20 dark:bg-slate-900/30 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl border border-white/30 dark:border-slate-700/40 transition-all duration-500 hover:bg-white/30 dark:hover:bg-slate-900/40 hover:border-white/50 dark:hover:border-slate-600/60">
                                        {/* Status Badge */}
                                        <div className="absolute top-4 left-4 z-10">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm border ${statusColors[getTripStatus(trip)]}`}>
                                                {t[`status_${getTripStatus(trip)}`] || getTripStatus(trip)}
                                            </span>
                                        </div>

                                        {/* Payment Status Badge */}
                                        {trip.my_registration && (
                                            <div className="absolute top-4 right-4 z-10">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm border ${paymentStatusColors[trip.my_registration.payment_status as keyof typeof paymentStatusColors] || paymentStatusColors.unpaid}`}
                                                >
                                                    {t[`payment_${trip.my_registration.payment_status}`] || trip.my_registration.payment_status}
                                                </span>
                                            </div>
                                        )}

                                        {/* Content */}
                                        <div className="p-6 pt-16">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 drop-shadow-sm">
                                                {trip.trip_name}
                                            </h3>

                                            {/* Destination */}
                                            <div className="flex items-center text-gray-700 dark:text-gray-200 mb-4">
                                                <IconMapPin className="h-4 w-4 ltr:mr-2 rtl:ml-2 flex-shrink-0" />
                                                <span className="text-sm truncate drop-shadow-sm">{trip.destination}</span>
                                            </div>

                                            {/* Trip Details */}
                                            <div className="space-y-3 mb-4">
                                                {/* Dates */}
                                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                                    <IconCalendar className="h-4 w-4 ltr:mr-2 rtl:ml-2 flex-shrink-0" />
                                                    <span>
                                                        {formatDate(trip.departure_date)} - {formatDate(trip.return_date)}
                                                    </span>
                                                </div>

                                                {/* Times */}
                                                {trip.departure_time && (
                                                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                                        <IconClock className="h-4 w-4 ltr:mr-2 rtl:ml-2 flex-shrink-0" />
                                                        <span>
                                                            {formatTime(trip.departure_time)} - {formatTime(trip.return_time)}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Cost */}
                                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                                    <IconDollarSign className="h-4 w-4 ltr:mr-2 rtl:ml-2 flex-shrink-0" />
                                                    <span>
                                                        ${trip.cost_per_student} {t.per_student || 'per student'}
                                                    </span>
                                                </div>

                                                {/* Grade Levels */}
                                                {trip.grade_levels && (
                                                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                                        <IconUsers className="h-4 w-4 ltr:mr-2 rtl:ml-2 flex-shrink-0" />
                                                        <span>{trip.grade_levels}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Description */}
                                            {trip.description && <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{trip.description}</p>}

                                            {/* Payment Info */}
                                            {trip.my_registration && (
                                                <div className="mt-4 pt-4 border-t border-gray-200/30 dark:border-gray-700/30">
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-gray-600 dark:text-gray-400">{t.amount_paid || 'Amount Paid'}:</span>
                                                        <span className="font-semibold text-green-600 dark:text-green-400">${trip.my_registration.amount_paid}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <motion.div variants={itemVariants} className="text-center py-12 bg-white/20 dark:bg-slate-900/30 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-slate-700/40">
                            <IconCalendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t.no_trips_found || 'No trips found'}</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                {searchTerm || filterType !== 'all'
                                    ? t.no_trips_match_filter || 'No trips match your current filter'
                                    : t.no_trips_registered || "You haven't registered for any trips yet"}
                            </p>
                        </motion.div>
                    )}
                </motion.div>
            </motion.div>

            {/* Trip Details Modal */}
            <AnimatePresence>
                {showTripDetails && selectedTrip && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowTripDetails(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedTrip.trip_name}</h2>
                                <button onClick={() => setShowTripDetails(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Trip Info */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-3">{t.trip_details || 'Trip Details'}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.destination || 'Destination'}</label>
                                            <p className="text-gray-900 dark:text-white">{selectedTrip.destination}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.trip_type || 'Trip Type'}</label>
                                            <p className="text-gray-900 dark:text-white">{selectedTrip.trip_type}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.departure_date || 'Departure Date'}</label>
                                            <p className="text-gray-900 dark:text-white">
                                                {formatDate(selectedTrip.departure_date)} {selectedTrip.departure_time && `at ${formatTime(selectedTrip.departure_time)}`}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.return_date || 'Return Date'}</label>
                                            <p className="text-gray-900 dark:text-white">
                                                {formatDate(selectedTrip.return_date)} {selectedTrip.return_time && `at ${formatTime(selectedTrip.return_time)}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                {selectedTrip.description && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-3">{t.description || 'Description'}</h3>
                                        <p className="text-gray-700 dark:text-gray-300">{selectedTrip.description}</p>
                                    </div>
                                )}

                                {/* Meeting Point */}
                                {selectedTrip.meeting_point && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-3">{t.meeting_point || 'Meeting Point'}</h3>
                                        <p className="text-gray-700 dark:text-gray-300">{selectedTrip.meeting_point}</p>
                                    </div>
                                )}

                                {/* Emergency Contact */}
                                {selectedTrip.emergency_contact && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-3">{t.emergency_contact || 'Emergency Contact'}</h3>
                                        <p className="text-gray-700 dark:text-gray-300">{selectedTrip.emergency_contact}</p>
                                    </div>
                                )}

                                {/* Special Requirements */}
                                {selectedTrip.special_requirements && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-3">{t.special_requirements || 'Special Requirements'}</h3>
                                        <p className="text-gray-700 dark:text-gray-300">{selectedTrip.special_requirements}</p>
                                    </div>
                                )}

                                {/* Registration Info */}
                                {selectedTrip.my_registration && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-3">{t.my_registration || 'My Registration'}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.registration_date || 'Registration Date'}</label>
                                                <p className="text-gray-900 dark:text-white">{formatDate(selectedTrip.my_registration.registration_date)}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.registration_status || 'Registration Status'}</label>
                                                <p className="text-gray-900 dark:text-white">{t[`registration_${selectedTrip.my_registration.status}`] || selectedTrip.my_registration.status}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.payment_status || 'Payment Status'}</label>
                                                <p className="text-gray-900 dark:text-white">
                                                    {t[`payment_${selectedTrip.my_registration.payment_status}`] || selectedTrip.my_registration.payment_status}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.amount_paid || 'Amount Paid'}</label>
                                                <p className="text-gray-900 dark:text-white font-semibold">
                                                    ${selectedTrip.my_registration.amount_paid} / ${selectedTrip.cost_per_student}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
