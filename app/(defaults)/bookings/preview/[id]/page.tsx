'use client';
import React, { useState, useEffect } from 'react';
import { getTranslation } from '@/i18n';
import supabase from '@/lib/supabase';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconCalendar from '@/components/icon/icon-calendar';
import IconDollarSign from '@/components/icon/icon-dollar-sign';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconUser from '@/components/icon/icon-user';
import IconPhone from '@/components/icon/icon-phone';
import IconMail from '@/components/icon/icon-mail';
import IconCreditCard from '@/components/icon/icon-credit-card';
import IconHeart from '@/components/icon/icon-heart';
import IconLock from '@/components/icon/icon-lock';
import IconStar from '@/components/icon/icon-star';
import IconEdit from '@/components/icon/icon-edit';

interface BookingDetails {
    id: string;
    booking_reference: string;
    customer_id: string;
    customer: {
        full_name: string;
        email: string;
        phone: string | null;
    } | null;
    destination_id: string;
    destination: {
        name: string;
        address: string;
        thumbnail_path: string | null;
        gallery_paths: string[] | null;
    };
    trip_date: string;
    total_amount: number;
    payment_status: string;
    payment_method: string;
    status: string;
    notes: string | null;
    special_requests: string | null;
    created_at: string;
    updated_at: string;
    booking_services?: Array<{
        service_type: string;
        service_id: string;
        quantity: number;
        days: number;
        booked_price: number;
        rate_type: string;
    }>;
}

export default function BookingDetailsPage() {
    const [booking, setBooking] = useState<BookingDetails | null>(null);
    const [services, setServices] = useState<
        Array<{
            type: string;
            id: string;
            name: string;
            quantity: number;
            days: number;
            cost: number;
            rate_type: string;
        }>
    >([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { t } = getTranslation();
    const params = useParams();
    const router = useRouter();
    const bookingId = params?.id as string;

    useEffect(() => {
        if (bookingId) {
            fetchBookingDetails();
        }
    }, [bookingId]);

    const fetchBookingDetails = async () => {
        try {
            setLoading(true);

            // Fetch booking details
            const { data: bookingData, error: bookingError } = await supabase
                .from('bookings')
                .select(
                    `
                    *,
                    customer:users!customer_id(full_name, email, phone),
                    destination:destinations(name, address, thumbnail_path, gallery_paths)
                `,
                )
                .eq('id', bookingId)
                .single();

            if (bookingError) throw bookingError;

            // Fetch booking services from the booking_services table
            const { data: servicesData, error: servicesError } = await supabase.from('booking_services').select('*').eq('booking_id', bookingId);

            if (servicesError) {
                console.error('Error fetching booking services:', servicesError);
            }

            // Transform services data and fetch service names
            let enrichedServices: Array<{
                type: string;
                id: string;
                name: string;
                quantity: number;
                days: number;
                cost: number;
                rate_type: string;
            }> = [];
            if (servicesData && servicesData.length > 0) {
                enrichedServices = await Promise.all(
                    servicesData.map(async (service) => {
                        let serviceName = '';

                        // Fetch service name based on type
                        try {
                            const { data: serviceDetails } = await supabase.from(service.service_type).select('name').eq('id', service.service_id).single();

                            serviceName = serviceDetails?.name || 'Unknown Service';
                        } catch (e) {
                            console.error(`Error fetching ${service.service_type} details:`, e);
                            serviceName = 'Unknown Service';
                        }

                        return {
                            type: service.service_type,
                            id: service.service_id,
                            name: serviceName,
                            quantity: service.quantity,
                            days: service.days,
                            cost: service.booked_price,
                            rate_type: service.rate_type,
                        };
                    }),
                );
            }

            setBooking(bookingData);
            setServices(enrichedServices);
        } catch (err: any) {
            setError(err.message);
            console.error('Error fetching booking details:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            confirmed: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', label: t('confirmed') },
            cancelled: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', label: t('cancelled') },
            completed: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', label: t('completed') },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.confirmed;

        return <span className={`px-3 py-1 text-sm font-semibold rounded-full ${config.color}`}>{config.label}</span>;
    };

    const getPaymentStatusBadge = (paymentStatus: string) => {
        const statusConfig = {
            paid: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', label: t('paid') },
            pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', label: t('pending') },
            failed: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', label: t('failed') },
            refunded: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300', label: t('refunded') },
        };

        const config = statusConfig[paymentStatus as keyof typeof statusConfig] || statusConfig.pending;

        return <span className={`px-3 py-1 text-sm font-semibold rounded-full ${config.color}`}>{config.label}</span>;
    };

    const getServiceIcon = (serviceType: string) => {
        switch (serviceType) {
            case 'paramedics':
                return <IconHeart className="w-5 h-5 text-red-500" />;
            case 'guides':
                return <IconUser className="w-5 h-5 text-blue-500" />;
            case 'security_companies':
                return <IconLock className="w-5 h-5 text-orange-500" />;
            case 'external_entertainment_companies':
                return <IconStar className="w-5 h-5 text-purple-500" />;
            default:
                return <IconUser className="w-5 h-5 text-gray-500" />;
        }
    };

    const calculateTotalCost = (service: any) => {
        return service.cost * service.quantity * service.days;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20 p-6">
                <div className="container mx-auto">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
                                <div className="h-48 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
                            </div>
                            <div className="space-y-6">
                                <div className="h-32 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
                                <div className="h-48 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20 p-6">
                <div className="container mx-auto">
                    <div className="text-center py-12">
                        <div className="text-red-500 text-xl mb-4">{error || t('booking_not_found')}</div>
                        <Link href="/bookings" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                            {t('back_to_bookings')}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20 p-6" dir={t('direction') || 'rtl'}>
            <div className="container mx-auto">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/bookings"
                                className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg border border-white/30 dark:border-slate-700/40 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300"
                            >
                                <IconArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300 ltr:rotate-180" />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('booking_details')}</h1>
                                <p className="text-gray-600 dark:text-gray-400 font-mono">{booking.booking_reference}</p>
                            </div>
                        </div>
                        <Link href={`/bookings/edit/${booking.id}`} className="btn btn-primary flex items-center gap-2">
                            <IconEdit className="w-4 h-4" />
                            {t('edit_booking')}
                        </Link>
                    </div>
                    <div className="flex items-center gap-3">
                        {getStatusBadge(booking.status)}
                        {getPaymentStatusBadge(booking.payment_status)}
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Trip Information */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/30 dark:border-slate-700/40"
                        >
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <IconMapPin className="w-5 h-5 text-blue-500" />
                                {t('trip_information')}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('destination')}</label>
                                    <p className="text-lg font-medium text-gray-900 dark:text-white">{booking.destination?.name}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{booking.destination?.address}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('trip_date')}</label>
                                    <div className="flex items-center gap-2">
                                        <IconCalendar className="w-4 h-4 text-gray-500" />
                                        <p className="text-lg font-medium text-gray-900 dark:text-white">
                                            {new Date(booking.trip_date).toLocaleDateString(t('locale'), {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Services */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/30 dark:border-slate-700/40"
                        >
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('selected_services')}</h2>
                            <div className="space-y-4">
                                {services && services.length > 0 ? (
                                    services.map((service: any, index: number) => (
                                        <div
                                            key={`${service.type}-${service.id}-${index}`}
                                            className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-slate-800/50 rounded-xl border border-gray-200/50 dark:border-slate-700/40"
                                        >
                                            <div className="flex items-center gap-3">
                                                {getServiceIcon(service.type)}
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 dark:text-white">{service.name}</h3>
                                                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                                        <span>
                                                            {t('quantity')}: {service.quantity}
                                                        </span>
                                                        {service.days > 1 && (
                                                            <span>
                                                                {t('days')}: {service.days}
                                                            </span>
                                                        )}
                                                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs">{t(service.rate_type)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-semibold text-gray-900 dark:text-white">{calculateTotalCost(service).toFixed(2)} ₪</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {service.cost.toFixed(2)} ₪ / {t(service.rate_type.replace('ly', ''))}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">{t('no_services_selected')}</div>
                                )}
                            </div>
                        </motion.div>

                        {/* Notes & Special Requests */}
                        {(booking.notes || booking.special_requests) && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/30 dark:border-slate-700/40"
                            >
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('additional_information')}</h2>
                                {booking.special_requests && (
                                    <div className="mb-4">
                                        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('special_requests')}</h3>
                                        <p className="text-gray-900 dark:text-white bg-yellow-50/50 dark:bg-yellow-900/20 p-3 rounded-lg">{booking.special_requests}</p>
                                    </div>
                                )}
                                {booking.notes && (
                                    <div>
                                        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('internal_notes')}</h3>
                                        <p className="text-gray-900 dark:text-white bg-blue-50/50 dark:bg-blue-900/20 p-3 rounded-lg">{booking.notes}</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Customer Information */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/30 dark:border-slate-700/40"
                        >
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <IconUser className="w-5 h-5 text-blue-500" />
                                {t('customer_information')}
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('name')}</label>
                                    <p className="text-gray-900 dark:text-white">{booking.customer?.full_name || t('guest')}</p>
                                </div>
                                {booking.customer?.email && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('email')}</label>
                                        <div className="flex items-center gap-2">
                                            <IconMail className="w-4 h-4 text-gray-500" />
                                            <p className="text-gray-900 dark:text-white">{booking.customer.email}</p>
                                        </div>
                                    </div>
                                )}
                                {booking.customer?.phone && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('phone')}</label>
                                        <div className="flex items-center gap-2">
                                            <IconPhone className="w-4 h-4 text-gray-500" />
                                            <p className="text-gray-900 dark:text-white">{booking.customer.phone}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Payment Information */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/30 dark:border-slate-700/40"
                        >
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <IconCreditCard className="w-5 h-5 text-green-500" />
                                {t('payment_information')}
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('total_amount')}</label>
                                    <div className="flex items-center gap-2">
                                        <IconDollarSign className="w-5 h-5 text-green-500" />
                                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{booking.total_amount.toFixed(2)} ₪</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('payment_method')}</label>
                                    <p className="text-gray-900 dark:text-white capitalize">{booking.payment_method.replace('_', ' ')}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('payment_status')}</label>
                                    {getPaymentStatusBadge(booking.payment_status)}
                                </div>
                            </div>
                        </motion.div>

                        {/* Booking Timeline */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/30 dark:border-slate-700/40"
                        >
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('booking_timeline')}</h2>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{t('booking_created')}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{new Date(booking.created_at).toLocaleString(t('locale'))}</p>
                                    </div>
                                </div>
                                {booking.updated_at !== booking.created_at && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{t('last_updated')}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{new Date(booking.updated_at).toLocaleString(t('locale'))}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
