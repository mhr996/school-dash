'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTranslation } from '@/i18n';
import supabase from '@/lib/supabase';
import { getCurrentUserWithRole } from '@/lib/auth';
import Dropdown from '@/components/dropdown';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconCalendar from '@/components/icon/icon-calendar';
import IconCreditCard from '@/components/icon/icon-credit-card';
import IconFilter from '@/components/icon/icon-filter';
import IconEye from '@/components/icon/icon-eye';
import IconDownload from '@/components/icon/icon-download';
import IconSearch from '@/components/icon/icon-search';
import IconUsers from '@/components/icon/icon-users';
import IconHeart from '@/components/icon/icon-heart';
import IconLock from '@/components/icon/icon-lock';
import IconPlay from '@/components/icon/icon-play-circle';
import IconCar from '@/components/icon/icon-car';
import IconShoppingBag from '@/components/icon/icon-shopping-bag';
import IconStar from '@/components/icon/icon-star';
import IconCaretDown from '@/components/icon/icon-caret-down';
import IconX from '@/components/icon/icon-x';
import IconCheck from '@/components/icon/icon-check';

type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'active' | 'inactive';
type PaymentStatus = 'pending' | 'deposit_paid' | 'fully_paid' | 'cancelled' | 'paid';
type BookingType = 'full_trip' | 'guides_only' | 'paramedics_only' | 'security_only' | 'entertainment_only' | 'transportation_only' | 'mixed_services';

interface Booking {
    id: string;
    booking_reference: string;
    booking_type: BookingType;
    trip_date: string;
    total_amount: number;
    payment_status: PaymentStatus;
    status: BookingStatus;
    notes?: string;
    special_requests?: string;
    created_at: string;
    updated_at: string;
    destinations?: {
        id: string;
        name: string;
        address?: string;
        thumbnail_path?: string;
    } | null;
    services?: {
        selected_services?: Array<{
            type: string;
            name: string;
            quantity: number;
            cost: number;
        }>;
        created_from?: string;
    };
}

// Booking type configurations for display
const getBookingTypeConfigs = (t: any) => ({
    full_trip: {
        title: t('full_trip'),
        icon: IconStar,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
    },
    guides_only: {
        title: t('guides_only'),
        icon: IconUsers,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
    },
    paramedics_only: {
        title: t('paramedics_only'),
        icon: IconHeart,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
    },
    security_only: {
        title: t('security_only'),
        icon: IconLock,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
    },
    entertainment_only: {
        title: t('entertainment_only'),
        icon: IconPlay,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
    },
    transportation_only: {
        title: t('transportation_only'),
        icon: IconCar,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        borderColor: 'border-indigo-200',
    },
    mixed_services: {
        title: t('mixed_services'),
        icon: IconShoppingBag,
        color: 'text-teal-600',
        bgColor: 'bg-teal-50',
        borderColor: 'border-teal-200',
    },
});

const statusColors = {
    pending: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    confirmed: 'text-blue-600 bg-blue-50 border-blue-200',
    completed: 'text-green-600 bg-green-50 border-green-200',
    cancelled: 'text-red-600 bg-red-50 border-red-200',
    active: 'text-green-600 bg-green-50 border-green-200',
    inactive: 'text-gray-600 bg-gray-50 border-gray-200',
};

const paymentStatusColors = {
    pending: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    deposit_paid: 'text-blue-600 bg-blue-50 border-blue-200',
    fully_paid: 'text-green-600 bg-green-50 border-green-200',
    paid: 'text-green-600 bg-green-50 border-green-200',
    cancelled: 'text-red-600 bg-red-50 border-red-200',
};

export default function MyBookingsPage() {
    const { t } = getTranslation();
    const bookingTypeConfigs = getBookingTypeConfigs(t);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBookingType, setSelectedBookingType] = useState<BookingType | 'all'>('all');
    const [selectedStatus, setSelectedStatus] = useState<BookingStatus | 'all'>('all');
    const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<PaymentStatus | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'date' | 'amount' | 'created'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Fetch user and bookings together
    useEffect(() => {
        const fetchUserAndBookings = async () => {
            try {
                setLoading(true);

                // Get current user
                const { user, error: userError } = await getCurrentUserWithRole();
                if (userError || !user) {
                    setLoading(false);
                    return;
                }

                setCurrentUser(user);

                // Fetch bookings for this user
                const { data, error } = await supabase
                    .from('bookings')
                    .select(
                        `
                    id,
                    booking_reference,
                    booking_type,
                    trip_date,
                    total_amount,
                    payment_status,
                    status,
                    notes,
                    special_requests,
                    services,
                    created_at,
                    updated_at,
                    destinations (
                        id,
                        name,
                        address,
                        thumbnail_path
                    )
                `,
                    )
                    .eq('customer_id', user.id)
                    .order('trip_date', { ascending: false });

                if (error) {
                    console.error('Error fetching bookings:', error);
                } else {
                    setBookings((data as any) || []);
                }
            } catch (error) {
                console.error('Error fetching user and bookings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserAndBookings();
    }, []);

    const fetchBookings = async () => {
        if (!currentUser?.id) return;

        try {
            const { data, error } = await supabase
                .from('bookings')
                .select(
                    `
                    id,
                    booking_reference,
                    booking_type,
                    trip_date,
                    total_amount,
                    payment_status,
                    status,
                    notes,
                    special_requests,
                    services,
                    created_at,
                    updated_at,
                    destinations (
                        id,
                        name,
                        address,
                        thumbnail_path
                    )
                `,
                )
                .eq('customer_id', currentUser.id)
                .order('trip_date', { ascending: false });

            if (error) {
                console.error('Error fetching bookings:', error);
            } else {
                setBookings((data as any) || []);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
        }
    };

    // Filter and sort bookings
    const filteredAndSortedBookings = bookings
        .filter((booking) => {
            // Filter by booking type
            if (selectedBookingType !== 'all' && booking.booking_type !== selectedBookingType) {
                return false;
            }

            // Filter by status
            if (selectedStatus !== 'all' && booking.status !== selectedStatus) {
                return false;
            }

            // Filter by payment status
            if (selectedPaymentStatus !== 'all' && booking.payment_status !== selectedPaymentStatus) {
                return false;
            }

            // Filter by search term
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                return (
                    booking.booking_reference.toLowerCase().includes(searchLower) ||
                    booking.destinations?.name?.toLowerCase().includes(searchLower) ||
                    booking.notes?.toLowerCase().includes(searchLower)
                );
            }

            return true;
        })
        .sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case 'date':
                    comparison = new Date(a.trip_date).getTime() - new Date(b.trip_date).getTime();
                    break;
                case 'amount':
                    comparison = a.total_amount - b.total_amount;
                    break;
                case 'created':
                    comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                    break;
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('he-IL', {
            style: 'currency',
            currency: 'ILS',
        }).format(amount);
    };

    const getBookingTypeConfig = (type: BookingType) => {
        return bookingTypeConfigs[type] || bookingTypeConfigs.full_trip;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50 dark:from-slate-900 dark:via-purple-950 dark:to-slate-900">
                <div className="relative">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-t-4 border-purple-600"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <IconCalendar className="w-12 h-12 text-purple-600 animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-gray-900 dark:via-purple-900/10 dark:to-blue-900/10">
            <div className="container mx-auto px-4 py-8">
                {/* Header with Glassmorphism Effect */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-8">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 dark:from-purple-600/90 dark:via-violet-600/90 dark:to-fuchsia-600/90 p-8 shadow-2xl shadow-purple-500/30">
                        <div className="absolute inset-0 bg-[url('/assets/images/auth/bg-gradient.png')] opacity-10"></div>
                        <div className="relative z-10">
                            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                                <span className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                                    <IconCalendar className="w-8 h-8" />
                                </span>
                                {t('my_bookings')}
                            </h1>
                            <p className="text-purple-100">{t('manage_all_adventures')}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Enhanced Filters with Custom Dropdowns */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="relative z-20 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-purple-500/20 p-6 mb-8"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-xl shadow-lg">
                            <IconFilter className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 dark:from-purple-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
                            {t('filter_and_sort')}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                        {/* Search */}
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-purple-300 mb-2">{t('search')}</label>
                            <div className="relative group">
                                <IconSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 group-focus-within:text-purple-600 dark:group-focus-within:text-purple-400 w-5 h-5 transition-colors" />
                                <input
                                    type="text"
                                    placeholder={t('search_by_reference')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-900/50 border-2 border-purple-200 dark:border-purple-500/30 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white placeholder-gray-400 dark:placeholder-purple-300/50 transition-all"
                                />
                            </div>
                        </div>

                        {/* Booking Type Filter - Custom Dropdown */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-purple-300 mb-2">{t('booking_type')}</label>
                            <Dropdown
                                offset={[0, 5]}
                                placement="bottom-start"
                                btnClassName="w-full px-4 py-3 bg-white dark:bg-gray-900/50 border-2 border-purple-200 dark:border-purple-500/30 rounded-xl hover:border-purple-400 dark:hover:border-purple-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all flex items-center justify-between"
                                button={
                                    <div className="flex items-center justify-between w-full">
                                        <span className="text-gray-700 dark:text-white font-medium">
                                            {selectedBookingType === 'all' ? t('all_types') : bookingTypeConfigs[selectedBookingType].title}
                                        </span>
                                        <IconCaretDown className="w-4 h-4 text-purple-400" />
                                    </div>
                                }
                            >
                                <ul className="text-sm font-medium w-64 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-500/30 rounded-xl shadow-2xl overflow-hidden">
                                    {[
                                        { value: 'all', label: t('all_types'), icon: IconFilter },
                                        { value: 'full_trip', label: t('full_trip'), icon: IconStar },
                                        { value: 'guides_only', label: t('guides_only'), icon: IconUsers },
                                        { value: 'paramedics_only', label: t('paramedics_only'), icon: IconHeart },
                                        { value: 'security_only', label: t('security_only'), icon: IconLock },
                                        { value: 'entertainment_only', label: t('entertainment_only'), icon: IconPlay },
                                        { value: 'transportation_only', label: t('transportation_only'), icon: IconCar },
                                        { value: 'mixed_services', label: t('mixed_services'), icon: IconShoppingBag },
                                    ].map((option) => {
                                        const OptionIcon = option.icon;
                                        const isSelected = selectedBookingType === option.value;
                                        return (
                                            <li key={option.value}>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedBookingType(option.value as BookingType | 'all')}
                                                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors ${
                                                        isSelected ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300'
                                                    }`}
                                                >
                                                    <OptionIcon className="w-4 h-4" />
                                                    <span className="flex-1 text-left">{option.label}</span>
                                                    {isSelected && <IconCheck className="w-4 h-4" />}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </Dropdown>
                        </div>

                        {/* Status Filter - Custom Dropdown */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-purple-300 mb-2">{t('status')}</label>
                            <Dropdown
                                offset={[0, 5]}
                                placement="bottom-start"
                                btnClassName="w-full px-4 py-3 bg-white dark:bg-gray-900/50 border-2 border-purple-200 dark:border-purple-500/30 rounded-xl hover:border-purple-400 dark:hover:border-purple-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all flex items-center justify-between"
                                button={
                                    <div className="flex items-center justify-between w-full">
                                        <span className="text-gray-700 dark:text-white font-medium capitalize">{selectedStatus === 'all' ? t('all_status') : t(selectedStatus)}</span>
                                        <IconCaretDown className="w-4 h-4 text-purple-400" />
                                    </div>
                                }
                            >
                                <ul className="text-sm font-medium w-48 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-500/30 rounded-xl shadow-2xl overflow-hidden">
                                    {[
                                        { value: 'all', label: t('all_status') },
                                        { value: 'pending', label: t('pending') },
                                        { value: 'confirmed', label: t('confirmed') },
                                        { value: 'completed', label: t('completed') },
                                        { value: 'cancelled', label: t('cancelled') },
                                    ].map((option) => {
                                        const isSelected = selectedStatus === option.value;
                                        return (
                                            <li key={option.value}>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedStatus(option.value as BookingStatus | 'all')}
                                                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors ${
                                                        isSelected ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300'
                                                    }`}
                                                >
                                                    <span>{option.label}</span>
                                                    {isSelected && <IconCheck className="w-4 h-4" />}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </Dropdown>
                        </div>

                        {/* Payment Status Filter - Custom Dropdown */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-purple-300 mb-2">{t('payment')}</label>
                            <Dropdown
                                offset={[0, 5]}
                                placement="bottom-start"
                                btnClassName="w-full px-4 py-3 bg-white dark:bg-gray-900/50 border-2 border-purple-200 dark:border-purple-500/30 rounded-xl hover:border-purple-400 dark:hover:border-purple-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all flex items-center justify-between"
                                button={
                                    <div className="flex items-center justify-between w-full">
                                        <span className="text-gray-700 dark:text-white font-medium capitalize">{selectedPaymentStatus === 'all' ? t('all_payments') : t(selectedPaymentStatus)}</span>
                                        <IconCaretDown className="w-4 h-4 text-purple-400" />
                                    </div>
                                }
                            >
                                <ul className="text-sm font-medium w-52 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-500/30 rounded-xl shadow-2xl overflow-hidden">
                                    {[
                                        { value: 'all', label: t('all_payments') },
                                        { value: 'pending', label: t('pending') },
                                        { value: 'deposit_paid', label: t('deposit_paid') },
                                        { value: 'fully_paid', label: t('fully_paid') },
                                        { value: 'paid', label: t('paid') },
                                        { value: 'cancelled', label: t('cancelled') },
                                    ].map((option) => {
                                        const isSelected = selectedPaymentStatus === option.value;
                                        return (
                                            <li key={option.value}>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedPaymentStatus(option.value as PaymentStatus | 'all')}
                                                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors ${
                                                        isSelected ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300'
                                                    }`}
                                                >
                                                    <span>{option.label}</span>
                                                    {isSelected && <IconCheck className="w-4 h-4" />}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </Dropdown>
                        </div>

                        {/* Sort By - Custom Dropdown */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-purple-300 mb-2">{t('sort_by')}</label>
                            <div className="flex gap-2">
                                <Dropdown
                                    offset={[0, 5]}
                                    placement="bottom-start"
                                    btnClassName="flex-1 px-4 py-3 bg-white dark:bg-gray-900/50 border-2 border-purple-200 dark:border-purple-500/30 rounded-xl hover:border-purple-400 dark:hover:border-purple-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all flex items-center justify-between"
                                    button={
                                        <div className="flex items-center justify-between w-full">
                                            <span className="text-gray-700 dark:text-white font-medium">
                                                {sortBy === 'date' ? t('booking_date') : sortBy === 'amount' ? t('amount') : t('creation_date')}
                                            </span>
                                            <IconCaretDown className="w-4 h-4 text-purple-400" />
                                        </div>
                                    }
                                >
                                    <ul className="text-sm font-medium w-44 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-500/30 rounded-xl shadow-2xl overflow-hidden">
                                        {[
                                            { value: 'date', label: t('booking_date') },
                                            { value: 'amount', label: t('amount') },
                                            { value: 'created', label: t('creation_date') },
                                        ].map((option) => {
                                            const isSelected = sortBy === option.value;
                                            return (
                                                <li key={option.value}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSortBy(option.value as 'date' | 'amount' | 'created')}
                                                        className={`w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors ${
                                                            isSelected ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300'
                                                        }`}
                                                    >
                                                        <span>{option.label}</span>
                                                        {isSelected && <IconCheck className="w-4 h-4" />}
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </Dropdown>
                                <button
                                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                    className="px-2 py-2 bg-gradient-to-br from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 text-white border-2 border-transparent rounded-xl shadow-lg hover:shadow-xl transition-all"
                                >
                                    <IconCaretDown className={`w-5 h-5 transition-transform duration-300 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Active Filters Display */}
                    {(searchTerm || selectedBookingType !== 'all' || selectedStatus !== 'all' || selectedPaymentStatus !== 'all') && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-500/20">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium text-gray-600 dark:text-purple-300">{t('active_filters')}:</span>
                                {searchTerm && (
                                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                                        {t('search')}: "{searchTerm}"
                                        <button onClick={() => setSearchTerm('')} className="hover:bg-purple-200 dark:hover:bg-purple-500/30 rounded-full p-0.5">
                                            <IconX className="w-3 h-3" />
                                        </button>
                                    </span>
                                )}
                                {selectedBookingType !== 'all' && (
                                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                                        {t('type')}: {bookingTypeConfigs[selectedBookingType].title}
                                        <button onClick={() => setSelectedBookingType('all')} className="hover:bg-purple-200 dark:hover:bg-purple-500/30 rounded-full p-0.5">
                                            <IconX className="w-3 h-3" />
                                        </button>
                                    </span>
                                )}
                                {selectedStatus !== 'all' && (
                                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded-full text-sm capitalize">
                                        {t('status')}: {t(selectedStatus)}
                                        <button onClick={() => setSelectedStatus('all')} className="hover:bg-purple-200 dark:hover:bg-purple-500/30 rounded-full p-0.5">
                                            <IconX className="w-3 h-3" />
                                        </button>
                                    </span>
                                )}
                                {selectedPaymentStatus !== 'all' && (
                                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded-full text-sm capitalize">
                                        {t('payment')}: {t(selectedPaymentStatus)}
                                        <button onClick={() => setSelectedPaymentStatus('all')} className="hover:bg-purple-200 dark:hover:bg-purple-500/30 rounded-full p-0.5">
                                            <IconX className="w-3 h-3" />
                                        </button>
                                    </span>
                                )}
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSelectedBookingType('all');
                                        setSelectedStatus('all');
                                        setSelectedPaymentStatus('all');
                                    }}
                                    className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                                >
                                    {t('clear_all')}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </motion.div>

                {/* Bookings List */}
                {filteredAndSortedBookings.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="relative overflow-hidden bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-purple-500/20 p-12 text-center"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-fuchsia-50/50 dark:from-purple-900/10 dark:to-blue-900/10"></div>
                        <div className="relative z-10">
                            <div className="inline-flex p-6 bg-gradient-to-br from-purple-100 to-fuchsia-100 dark:from-purple-500/20 dark:to-fuchsia-500/20 rounded-3xl mb-6">
                                <IconCalendar className="w-20 h-20 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 dark:from-purple-400 dark:to-fuchsia-400 bg-clip-text text-transparent mb-3">
                                {t('no_bookings_found')}
                            </h3>
                            <p className="text-gray-600 dark:text-purple-200 mb-8 max-w-md mx-auto">
                                {searchTerm || selectedBookingType !== 'all' || selectedStatus !== 'all' || selectedPaymentStatus !== 'all' ? t('no_bookings_match_filters') : t('no_bookings_yet')}
                            </p>
                            <button
                                onClick={() => (window.location.href = '/')}
                                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 hover:from-purple-700 hover:via-violet-700 hover:to-fuchsia-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all transform hover:scale-105"
                            >
                                <IconStar className="w-5 h-5" />
                                {t('plan_your_first_trip')}
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <div className="space-y-6">
                        {filteredAndSortedBookings.map((booking, index) => {
                            const typeConfig = getBookingTypeConfig(booking.booking_type);
                            const TypeIcon = typeConfig.icon;

                            return (
                                <motion.div
                                    key={booking.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.05 * Math.min(index, 10) }}
                                    className="group relative overflow-hidden bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-purple-500/20 hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-400/40 transition-all duration-300"
                                >
                                    {/* Gradient Accent Bar */}
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-violet-500 to-fuchsia-500"></div>

                                    <div className="p-6">
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                                            {/* Left Section - Booking Info */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div
                                                        className={`relative p-3 rounded-2xl ${typeConfig.bgColor} ${typeConfig.borderColor} border-2 group-hover:scale-110 transition-transform duration-300`}
                                                    >
                                                        <TypeIcon className={`w-6 h-6 ${typeConfig.color}`} />
                                                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/40 to-transparent"></div>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{booking.booking_reference}</h3>
                                                        <p className={`text-sm font-semibold ${typeConfig.color}`}>{typeConfig.title}</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-3 ml-1">
                                                    {booking.destinations && (
                                                        <div className="flex items-center gap-3 group/item">
                                                            <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg group-hover/item:bg-purple-200 dark:group-hover/item:bg-purple-500/30 transition-colors">
                                                                <IconMapPin className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                            </div>
                                                            <span className="text-gray-700 dark:text-gray-200 font-medium">{booking.destinations.name}</span>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-3 group/item">
                                                        <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg group-hover/item:bg-blue-200 dark:group-hover/item:bg-blue-500/30 transition-colors">
                                                            <IconCalendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                        <span className="text-gray-700 dark:text-gray-200 font-medium">{formatDate(booking.trip_date)}</span>
                                                    </div>

                                                    {booking.services?.selected_services && booking.services.selected_services.length > 0 && (
                                                        <div className="flex items-center gap-3 group/item">
                                                            <div className="p-2 bg-fuchsia-100 dark:bg-fuchsia-500/20 rounded-lg group-hover/item:bg-fuchsia-200 dark:group-hover/item:bg-fuchsia-500/30 transition-colors">
                                                                <IconShoppingBag className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400" />
                                                            </div>
                                                            <span className="text-gray-700 dark:text-gray-200 font-medium">
                                                                {booking.services.selected_services.length} {t('services_included')}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right Section - Status and Actions */}
                                            <div className="flex flex-col lg:items-end gap-4">
                                                <div className="flex flex-wrap gap-2">
                                                    <span className={`px-4 py-2 rounded-xl text-xs font-bold border-2 backdrop-blur-sm ${statusColors[booking.status]} shadow-sm`}>
                                                        {t(booking.status).charAt(0).toUpperCase() + t(booking.status).slice(1)}
                                                    </span>
                                                    <span className={`px-4 py-2 rounded-xl text-xs font-bold border-2 backdrop-blur-sm ${paymentStatusColors[booking.payment_status]} shadow-sm`}>
                                                        {t(booking.payment_status).charAt(0).toUpperCase() + t(booking.payment_status).slice(1)}
                                                    </span>
                                                </div>

                                                <div className="text-right">
                                                    <div className="text-3xl font-black bg-gradient-to-r from-purple-600 to-fuchsia-600 dark:from-purple-400 dark:to-fuchsia-400 bg-clip-text text-transparent mb-1">
                                                        {formatCurrency(booking.total_amount)}
                                                    </div>
                                                    <div className="text-sm font-medium text-gray-600 dark:text-purple-300">{t('total_amount')}</div>
                                                </div>

                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedBooking(booking);
                                                            setIsModalOpen(true);
                                                        }}
                                                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all flex items-center gap-2 transform hover:scale-105"
                                                    >
                                                        <IconEye className="w-4 h-4" />
                                                        {t('view_details')}
                                                    </button>
                                                    {booking.status === 'completed' && (
                                                        <button className="p-3 border-2 border-purple-300 dark:border-purple-500/40 text-purple-700 dark:text-purple-300 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-500/20 transition-all transform hover:scale-105">
                                                            <IconDownload className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* Booking Details Modal */}
                <AnimatePresence>
                    {isModalOpen && selectedBooking && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsModalOpen(false)}
                                className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9998]"
                            />

                            {/* Modal Container */}
                            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 40 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 40 }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="relative w-full max-w-5xl bg-white dark:bg-gray-900 rounded-3xl shadow-[0_20px_80px_rgba(138,43,226,0.3)] dark:shadow-[0_20px_80px_rgba(138,43,226,0.5)] border-2 border-purple-200/50 dark:border-purple-500/40 max-h-[92vh] flex flex-col pointer-events-auto overflow-hidden"
                                >
                                    {/* Header - Fixed */}
                                    <div className="flex-shrink-0 bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 dark:from-purple-700 dark:via-violet-700 dark:to-fuchsia-700 p-8 shadow-xl">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h2 className="text-4xl font-black text-white mb-3 flex items-center gap-4">
                                                    {(() => {
                                                        const typeConfig = getBookingTypeConfig(selectedBooking.booking_type);
                                                        const TypeIcon = typeConfig.icon;
                                                        return (
                                                            <>
                                                                <span className="p-3 bg-white/25 backdrop-blur-sm rounded-2xl shadow-lg">
                                                                    <TypeIcon className="w-8 h-8" />
                                                                </span>
                                                                {t('booking_details')}
                                                            </>
                                                        );
                                                    })()}
                                                </h2>
                                                <p className="text-purple-50 text-xl font-bold tracking-wide">{selectedBooking.booking_reference}</p>
                                            </div>
                                            <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white/25 rounded-2xl transition-all hover:rotate-90 duration-300">
                                                <IconX className="w-7 h-7 text-white" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Scrollable Content */}
                                    <div
                                        className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30 dark:from-gray-900 dark:via-purple-900/10 dark:to-blue-900/10"
                                        style={{
                                            scrollbarWidth: 'thin',
                                            scrollbarColor: '#a855f7 transparent',
                                        }}
                                    >
                                        <style jsx>{`
                                            div::-webkit-scrollbar {
                                                width: 8px;
                                            }
                                            div::-webkit-scrollbar-track {
                                                background: transparent;
                                            }
                                            div::-webkit-scrollbar-thumb {
                                                background: linear-gradient(180deg, #a855f7, #ec4899);
                                                border-radius: 10px;
                                            }
                                            div::-webkit-scrollbar-thumb:hover {
                                                background: linear-gradient(180deg, #9333ea, #db2777);
                                            }
                                        `}</style>
                                        <div className="p-8 space-y-8">
                                            {/* Booking Information */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1 }}
                                                className="bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-500/30"
                                            >
                                                <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 dark:from-purple-400 dark:to-fuchsia-400 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                                                    <IconCalendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                                    {t('booking_information')}
                                                </h3>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-3">
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-600 dark:text-purple-300 mb-1">{t('booking_reference')}</p>
                                                            <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedBooking.booking_reference}</p>
                                                        </div>

                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-600 dark:text-purple-300 mb-1">{t('booking_type')}</p>
                                                            <p className="text-lg font-bold text-gray-900 dark:text-white">{getBookingTypeConfig(selectedBooking.booking_type).title}</p>
                                                        </div>

                                                        {selectedBooking.destinations && (
                                                            <div>
                                                                <p className="text-sm font-semibold text-gray-600 dark:text-purple-300 mb-1">{t('destination')}</p>
                                                                <p className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                                    <IconMapPin className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                                    {selectedBooking.destinations.name}
                                                                </p>
                                                                {selectedBooking.destinations.address && (
                                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedBooking.destinations.address}</p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="space-y-3">
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-600 dark:text-purple-300 mb-1">{t('trip_date')}</p>
                                                            <p className="text-lg font-bold text-gray-900 dark:text-white">{formatDate(selectedBooking.trip_date)}</p>
                                                        </div>

                                                        <div className="flex gap-3 items-center">
                                                            <div>
                                                                <p className="text-sm font-semibold text-gray-600 dark:text-purple-300 mb-1">{t('status')}</p>
                                                                <span className={`inline-block px-4 py-2 rounded-xl text-sm font-bold border-2 ${statusColors[selectedBooking.status]}`}>
                                                                    {t(selectedBooking.status).charAt(0).toUpperCase() + t(selectedBooking.status).slice(1)}
                                                                </span>
                                                            </div>

                                                            <div>
                                                                <p className="text-sm font-semibold text-gray-600 dark:text-purple-300 mb-1">{t('payment')}</p>
                                                                <span className={`inline-block px-4 py-2 rounded-xl text-sm font-bold border-2 ${paymentStatusColors[selectedBooking.payment_status]}`}>
                                                                    {t(selectedBooking.payment_status).charAt(0).toUpperCase() + t(selectedBooking.payment_status).slice(1)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>

                                            {/* Services Breakdown */}
                                            {selectedBooking.services?.selected_services && selectedBooking.services.selected_services.length > 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.2 }}
                                                    className="bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-900/20 dark:to-violet-900/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-500/30"
                                                >
                                                    <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                                                        <IconShoppingBag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                        {t('services_breakdown')}
                                                    </h3>

                                                    <div className="space-y-3">
                                                        {selectedBooking.services.selected_services.map((service, index) => (
                                                            <div key={index} className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-4 border border-blue-200 dark:border-blue-500/20">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex-1">
                                                                        <p className="font-bold text-gray-900 dark:text-white text-lg">{service.name}</p>
                                                                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                                            <span>
                                                                                <strong>{t('quantity')}:</strong> {service.quantity}
                                                                            </span>
                                                                            <span>
                                                                                <strong>{t('cost_per_unit')}:</strong> {formatCurrency(service.cost)}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-sm font-semibold text-gray-600 dark:text-purple-300">{t('subtotal')}</p>
                                                                        <p className="text-2xl font-black bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400 bg-clip-text text-transparent">
                                                                            {formatCurrency(service.cost * service.quantity)}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* Special Requests & Notes */}
                                            {(selectedBooking.special_requests || selectedBooking.notes) && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.3 }}
                                                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                                >
                                                    {selectedBooking.special_requests && (
                                                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-5 border-2 border-amber-200 dark:border-amber-500/30">
                                                            <h4 className="text-lg font-bold text-amber-700 dark:text-amber-400 mb-2">{t('special_requests')}</h4>
                                                            <p className="text-gray-700 dark:text-gray-300">{selectedBooking.special_requests}</p>
                                                        </div>
                                                    )}

                                                    {selectedBooking.notes && (
                                                        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-2xl p-5 border-2 border-teal-200 dark:border-teal-500/30">
                                                            <h4 className="text-lg font-bold text-teal-700 dark:text-teal-400 mb-2">{t('notes')}</h4>
                                                            <p className="text-gray-700 dark:text-gray-300">{selectedBooking.notes}</p>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}

                                            {/* Timeline */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.5 }}
                                                className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-500/30"
                                            >
                                                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                                                    <IconCalendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                                    {t('booking_timeline')}
                                                </h3>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-4 border border-gray-200 dark:border-gray-500/20">
                                                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">{t('booked_on')}</p>
                                                        <p className="text-lg font-bold text-gray-900 dark:text-white">{formatDate(selectedBooking.created_at)}</p>
                                                    </div>

                                                    <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-4 border border-gray-200 dark:border-gray-500/20">
                                                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">{t('last_updated')}</p>
                                                        <p className="text-lg font-bold text-gray-900 dark:text-white">{formatDate(selectedBooking.updated_at)}</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </div>
                                    </div>

                                    {/* Footer - Fixed */}
                                    <div className="flex-shrink-0 bg-gradient-to-r from-white via-purple-50/30 to-white dark:from-gray-900 dark:via-purple-900/10 dark:to-gray-900 border-t-2 border-purple-200 dark:border-purple-500/40 px-8 py-6 shadow-[0_-10px_30px_rgba(138,43,226,0.15)]">
                                        <div className="flex items-center justify-between gap-6 w-full">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-600 dark:text-purple-300 mb-2">{t('payment_status')}</p>
                                                <span className={`inline-block px-4 py-2 rounded-lg bg-transparent text-sm font-bold border-2 ${paymentStatusColors[selectedBooking.payment_status]}`}>
                                                    {t(selectedBooking.payment_status).charAt(0).toUpperCase() + t(selectedBooking.payment_status).slice(1)}
                                                </span>
                                            </div>

                                            <div className="h-16 w-px bg-gradient-to-b from-transparent via-purple-300 dark:via-purple-500/50 to-transparent"></div>

                                            <div>
                                                <p className="text-sm font-semibold text-right text-gray-600 dark:text-purple-300 mb-1">{t('total_amount')}</p>
                                                <p className="text-4xl font-black bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 dark:from-purple-400 dark:via-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
                                                    {formatCurrency(selectedBooking.total_amount)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
