'use client';
import React, { useState, useEffect } from 'react';
import { getTranslation } from '@/i18n';
import supabase from '@/lib/supabase';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconSave from '@/components/icon/icon-save';
import IconCalendar from '@/components/icon/icon-calendar';
import CustomSelect from '@/components/elements/custom-select';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import IconPlus from '@/components/icon/icon-plus';
import IconTrashLines from '@/components/icon/icon-trash-lines';

interface BookingEditData {
    id: string;
    booking_reference: string;
    customer_name: string | null;
    customer_email: string | null;
    customer_phone: string | null;
    destination_id: string;
    destination: {
        name: string;
        address: string;
    };
    trip_date: string;
    total_amount: number;
    payment_status: string;
    status: string;
    notes: string | null;
    special_requests: string | null;
    created_at: string;
    updated_at: string;
    services: Array<{
        type: 'paramedics' | 'guides' | 'security_companies' | 'external_entertainment_companies';
        id: string | number;
        name: string;
        quantity: number;
        days: number;
        cost: number;
        rate_type: string;
    }>;
}

interface ServiceOption {
    id: string;
    name: string;
    price?: number; // For entertainment companies
    hourly_rate?: number; // For guides and paramedics
    daily_rate?: number; // For guides and paramedics
}

interface ServiceData {
    paramedics: ServiceOption[];
    guides: ServiceOption[];
    security_companies: ServiceOption[];
    external_entertainment_companies: ServiceOption[];
}

export default function EditBooking() {
    const { t } = getTranslation();
    const params = useParams();
    const router = useRouter();
    const bookingId = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [booking, setBooking] = useState<BookingEditData | null>(null);
    const [serviceData, setServiceData] = useState<ServiceData>({
        paramedics: [],
        guides: [],
        security_companies: [],
        external_entertainment_companies: [],
    });

    const [alert, setAlert] = useState<{
        visible: boolean;
        message: string;
        type: 'success' | 'danger';
    }>({
        visible: false,
        message: '',
        type: 'success',
    });

    // Status options
    const statusOptions = [
        { value: 'pending', label: t('pending') },
        { value: 'confirmed', label: t('confirmed') },
        { value: 'cancelled', label: t('cancelled') },
        { value: 'completed', label: t('completed') },
    ];

    // Payment status options
    const paymentStatusOptions = [
        { value: 'pending', label: t('pending') },
        { value: 'paid', label: t('paid') },
        { value: 'failed', label: t('failed') },
        { value: 'refunded', label: t('refunded') },
    ];

    // Payment method options
    const paymentMethodOptions = [
        { value: 'bank_transfer', label: t('bank_transfer') },
        { value: 'credit_card', label: t('credit_card') },
        { value: 'cash', label: t('cash') },
        { value: 'other', label: t('other') },
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch booking details with destination info
                const { data: bookingData, error: bookingError } = await supabase
                    .from('bookings')
                    .select(
                        `
                        *,
                        destination:destinations(
                            name,
                            address
                        )
                    `,
                    )
                    .eq('id', bookingId)
                    .single();

                if (bookingError) {
                    console.error('Error fetching booking:', bookingError);
                    setAlert({
                        visible: true,
                        message: t('error_loading_booking'),
                        type: 'danger',
                    });
                    return;
                }

                // Fetch services from both old JSON format and new normalized table
                let parsedServices = [];

                // Try to get services from the new normalized table first
                const { data: normalizedServices, error: servicesError } = await supabase.from('booking_services').select('*').eq('booking_id', bookingId);

                if (servicesError) {
                    console.error('Error fetching booking services:', servicesError);
                }

                if (normalizedServices && normalizedServices.length > 0) {
                    // Convert normalized services to the format expected by the UI
                    parsedServices = normalizedServices.map((service) => ({
                        id: service.service_id,
                        type: service.service_type,
                        quantity: service.quantity,
                        days: service.days,
                        cost: service.booked_price,
                        rate_type: service.rate_type,
                        // We'll fetch the name separately in the next step
                        name: `Service ${service.service_id}`, // Placeholder
                    }));
                } else if (bookingData.services) {
                    // Fallback to old JSON format if no normalized services found
                    if (typeof bookingData.services === 'string') {
                        parsedServices = JSON.parse(bookingData.services);
                    } else {
                        parsedServices = bookingData.services;
                    }
                }

                // Update booking data with parsed services
                setBooking({
                    ...bookingData,
                    services: parsedServices, // Ensure services is always an array
                });

                // Fetch all service options for the dropdowns
                const [paramedicsData, guidesData, securityData, entertainmentData] = await Promise.all([
                    supabase.from('paramedics').select('id, name, hourly_rate, daily_rate'),
                    supabase.from('guides').select('id, name, hourly_rate, daily_rate'),
                    supabase.from('security_companies').select('id, name'),
                    supabase.from('external_entertainment_companies').select('id, name, price'),
                ]);

                setServiceData({
                    paramedics: paramedicsData.data || [],
                    guides: guidesData.data || [],
                    security_companies: securityData.data || [],
                    external_entertainment_companies: entertainmentData.data || [],
                });

                // For each service in the booking, fetch the current details
                const enrichedServices = await Promise.all(
                    parsedServices.map(async (service: any) => {
                        let currentServiceData = null;

                        try {
                            switch (service.type) {
                                case 'guides':
                                    const { data: guideData } = await supabase.from('guides').select('id, name, hourly_rate, daily_rate').eq('id', service.id).single();
                                    currentServiceData = guideData;
                                    break;
                                case 'paramedics':
                                    const { data: paramedicData } = await supabase.from('paramedics').select('id, name, hourly_rate, daily_rate').eq('id', service.id).single();
                                    currentServiceData = paramedicData;
                                    break;
                                case 'security_companies':
                                    const { data: securityData } = await supabase.from('security_companies').select('id, name').eq('id', service.id).single();
                                    currentServiceData = securityData;
                                    break;
                                case 'external_entertainment_companies':
                                    const { data: entertainmentData } = await supabase.from('external_entertainment_companies').select('id, name, price').eq('id', service.id).single();
                                    currentServiceData = entertainmentData;
                                    break;
                            }
                        } catch (error) {
                            console.warn(`Could not fetch current data for ${service.type} with id ${service.id}:`, error);
                        }

                        return {
                            ...service,
                            // Use current data if available, otherwise keep the stored data
                            name: currentServiceData?.name || service.name || 'Unknown Service',
                            cost: service.cost || (currentServiceData as any)?.price || (currentServiceData as any)?.daily_rate || 0,
                            // Ensure we have the stored booking-specific data
                            quantity: service.quantity || 1,
                            days: service.days || 1,
                            rate_type: service.rate_type || 'fixed',
                        };
                    }),
                );

                // Update booking data with enriched services
                setBooking({
                    ...bookingData,
                    services: enrichedServices,
                });

                // Ensure currently selected services are included in the dropdown options
                // This handles cases where a service might not be in the active list but is currently selected
                const enrichedServiceData = {
                    paramedics: [...(paramedicsData.data || [])],
                    guides: [...(guidesData.data || [])],
                    security_companies: [...(securityData.data || [])],
                    external_entertainment_companies: [...(entertainmentData.data || [])],
                };

                // Add currently selected services to the dropdown options if they're not already there
                enrichedServices.forEach((service: any) => {
                    const serviceArray = enrichedServiceData[service.type as keyof typeof enrichedServiceData];
                    const existsInOptions = serviceArray.some((option: any) => String(option.id) === String(service.id));

                    console.log(`Checking service ${service.name} (ID: ${service.id}) of type ${service.type}:`, {
                        existsInOptions,
                        availableOptionIds: serviceArray.map((o: any) => String(o.id)),
                    });

                    if (!existsInOptions && service.name) {
                        console.log(`Adding missing service ${service.name} to ${service.type} options`);
                        // Add the currently selected service to the options
                        const currentServiceOption = {
                            id: service.id,
                            name: service.name,
                            hourly_rate: service.hourly_rate || 0,
                            daily_rate: service.daily_rate || 0,
                            price: service.cost || 0,
                        };
                        serviceArray.push(currentServiceOption);
                    }
                });

                setServiceData(enrichedServiceData);
            } catch (error) {
                console.error('Error fetching data:', error);
                setAlert({
                    visible: true,
                    message: t('error_loading_booking'),
                    type: 'danger',
                });
            } finally {
                setLoading(false);
            }
        };

        if (bookingId) {
            fetchData();
        }
    }, [bookingId]);

    const handleInputChange = (field: keyof BookingEditData, value: any) => {
        if (!booking) return;

        setBooking((prev) => ({
            ...prev!,
            [field]: value,
        }));
    };

    const handleServiceChange = (index: number, field: string, value: any) => {
        if (!booking) return;

        const updatedServices = [...booking.services];
        updatedServices[index] = {
            ...updatedServices[index],
            [field]: field === 'quantity' || field === 'days' || field === 'cost' ? parseFloat(value) || 0 : value,
        };

        setBooking((prev) => ({
            ...prev!,
            services: updatedServices,
        }));
    };

    const handleServiceSelectionChange = (index: number, serviceId: string) => {
        if (!booking) return;

        // Find the selected service in the appropriate service data
        const currentService = booking.services[index];
        const serviceOptions = serviceData[currentService.type];
        const selectedService = serviceOptions.find((service) => service.id === serviceId);

        if (selectedService) {
            setBooking((prev) => {
                if (!prev) return prev;
                const updatedServices = [...prev.services];
                updatedServices[index] = {
                    ...updatedServices[index],
                    id: selectedService.id,
                    name: selectedService.name,
                    cost: selectedService.price || selectedService.daily_rate || 0,
                };
                return { ...prev, services: updatedServices };
            });
        }
    };

    const calculateTotalAmount = () => {
        if (!booking) return 0;
        return booking.services.reduce((total, service) => {
            return total + service.cost;
        }, 0);
    };

    const handleSave = async () => {
        if (!booking) return;

        setSaving(true);
        try {
            // Calculate new total
            const calculatedTotal = calculateTotalAmount();

            const updateData = {
                customer_name: booking.customer_name,
                customer_email: booking.customer_email,
                customer_phone: booking.customer_phone,
                destination_id: booking.destination_id,
                trip_date: booking.trip_date,
                total_amount: calculatedTotal,
                payment_status: booking.payment_status,
                status: booking.status,
                notes: booking.notes,
                special_requests: booking.special_requests,
                services: booking.services,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase.from('bookings').update(updateData).eq('id', bookingId);

            if (error) {
                console.error('Error updating booking:', error);
                setAlert({
                    visible: true,
                    message: t('error_updating_booking'),
                    type: 'danger',
                });
                return;
            }

            setAlert({
                visible: true,
                message: t('booking_updated_successfully'),
                type: 'success',
            });

            // Redirect back to booking details after short delay
            setTimeout(() => {
                router.push(`/bookings/${bookingId}`);
            }, 1500);
        } catch (error) {
            console.error('Error saving booking:', error);
            setAlert({
                visible: true,
                message: t('error_updating_booking'),
                type: 'danger',
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="container mx-auto p-6">
                <div className="panel">
                    <div className="text-center py-12">
                        <h2 className="text-xl font-semibold text-gray-600 mb-2">{t('booking_not_found')}</h2>
                        <Link href="/bookings" className="btn btn-primary">
                            {t('back_to_bookings')}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            {/* Header */}
            <div className="flex items-center gap-5 mb-6">
                <Link href={`/bookings/${bookingId}`} className="text-primary hover:text-primary/80">
                    <IconArrowLeft className="h-7 w-7" />
                </Link>

                {/* Breadcrumb Navigation */}
                <ul className="flex space-x-2 rtl:space-x-reverse">
                    <li>
                        <Link href="/" className="text-primary hover:underline">
                            {t('home')}
                        </Link>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <Link href="/bookings" className="text-primary hover:underline">
                            {t('bookings')}
                        </Link>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <Link href={`/bookings/${bookingId}`} className="text-primary hover:underline">
                            {booking.booking_reference}
                        </Link>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <span>{t('edit')}</span>
                    </li>
                </ul>
            </div>

            {/* Title and Actions */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold">{t('edit_booking')}</h1>
                    <p className="text-gray-500 mt-2">
                        {t('booking_reference')}: {booking.booking_reference}
                    </p>
                </div>
                <button onClick={handleSave} disabled={saving} className="btn btn-primary flex items-center gap-2">
                    <IconSave className="w-4 h-4" />
                    {saving ? t('saving') : t('save_changes')}
                </button>
            </div>

            {/* Alert */}
            {alert.visible && (
                <div className="fixed top-4 right-4 z-50 min-w-80 max-w-md">
                    <Alert type={alert.type} title={alert.type === 'success' ? t('success') : t('error')} message={alert.message} onClose={() => setAlert({ ...alert, visible: false })} />
                </div>
            )}

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Customer Information */}
                    <div className="panel">
                        <div className="mb-5">
                            <h3 className="text-lg font-semibold">{t('customer_information')}</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('customer_name')}</label>
                                <input
                                    type="text"
                                    value={booking.customer_name || ''}
                                    onChange={(e) => handleInputChange('customer_name', e.target.value)}
                                    className="form-input"
                                    placeholder={t('enter_customer_name')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('customer_email')}</label>
                                <input
                                    type="email"
                                    value={booking.customer_email || ''}
                                    onChange={(e) => handleInputChange('customer_email', e.target.value)}
                                    className="form-input"
                                    placeholder={t('enter_customer_email')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('customer_phone')}</label>
                                <input
                                    type="tel"
                                    value={booking.customer_phone || ''}
                                    onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                                    className="form-input"
                                    placeholder={t('enter_customer_phone')}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Trip Details */}
                    <div className="panel">
                        <div className="mb-5">
                            <h3 className="text-lg font-semibold">{t('trip_details')}</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('destination')}</label>
                                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                                    <div className="font-semibold">{booking.destination?.name}</div>
                                    {booking.destination?.address && <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{booking.destination.address}</div>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('trip_date')}</label>
                                <input type="date" value={booking.trip_date} onChange={(e) => handleInputChange('trip_date', e.target.value)} className="form-input" />
                            </div>
                        </div>
                    </div>

                    {/* Services */}
                    <div className="panel">
                        <div className="mb-5">
                            <h3 className="text-lg font-semibold">{t('services')}</h3>
                        </div>
                        <div className="space-y-6">
                            {/* Group services by type and show separate selectors */}
                            {booking.services && booking.services.length > 0 ? (
                                <>
                                    {booking.services.some((s) => s.type === 'guides') && (
                                        <div className="mb-8">
                                            <h4 className="text-lg font-semibold mb-4 flex items-center gap-3">
                                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-200 dark:border-emerald-700">
                                                    <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <span className="text-gray-900 dark:text-white">{t('guides')}</span>
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
                                                    {booking.services?.filter((s) => s.type === 'guides').length} {t('selected')}
                                                </span>
                                            </h4>
                                            <div className="space-y-4">
                                                {booking.services
                                                    ?.filter((service) => service.type === 'guides')
                                                    .map((service, index) => {
                                                        const originalIndex = booking.services?.findIndex((s) => s === service) ?? -1;
                                                        return (
                                                            <div
                                                                key={originalIndex}
                                                                className="relative group bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-2 border-emerald-200 dark:border-emerald-700/50 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-600 hover:scale-[1.02]"
                                                            >
                                                                <div className="absolute top-4 right-4">
                                                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                                                                        <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                                        </svg>
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                    <div className="space-y-3">
                                                                        <label className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-2">
                                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                                            </svg>
                                                                            {t('select_guide')}
                                                                        </label>
                                                                        {serviceData.guides.length > 0 ? (
                                                                            <CustomSelect
                                                                                options={serviceData.guides.map((guide) => ({
                                                                                    value: String(guide.id),
                                                                                    label: guide.name,
                                                                                }))}
                                                                                value={String(service.id)}
                                                                                onChange={(value) => handleServiceSelectionChange(originalIndex, Array.isArray(value) ? value[0] : value)}
                                                                                placeholder={t('select_guide')}
                                                                            />
                                                                        ) : (
                                                                            <input
                                                                                type="text"
                                                                                value={service.name}
                                                                                onChange={(e) => handleServiceChange(originalIndex, 'name', e.target.value)}
                                                                                className="form-input"
                                                                                placeholder={t('enter_guide_name')}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                    <div className="space-y-3">
                                                                        <label className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-2">
                                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                                                                <path
                                                                                    fillRule="evenodd"
                                                                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5z"
                                                                                    clipRule="evenodd"
                                                                                />
                                                                            </svg>
                                                                            {t('cost')} (₪)
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            step="0.01"
                                                                            value={service.cost}
                                                                            onChange={(e) => handleServiceChange(originalIndex, 'cost', e.target.value)}
                                                                            className="w-full px-4 py-3 border-2 border-emerald-200 dark:border-emerald-700/50 rounded-lg bg-white dark:bg-gray-800 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/50 transition-all duration-200 text-lg font-medium"
                                                                            placeholder="0.00"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {/* Service Summary */}
                                                                <div className="mt-6 pt-4 border-t border-emerald-200 dark:border-emerald-700/50">
                                                                    <div className="flex items-center justify-between p-3 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-lg">
                                                                        <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                                <path
                                                                                    fillRule="evenodd"
                                                                                    d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                                                                                    clipRule="evenodd"
                                                                                />
                                                                            </svg>
                                                                            {t('service_total')}
                                                                        </span>
                                                                        <span className="text-xl font-bold text-emerald-900 dark:text-emerald-100">{service.cost.toLocaleString()} ₪</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Paramedics Section */}
                                    {booking.services?.some((s) => s.type === 'paramedics') && (
                                        <div>
                                            <h4 className="text-md font-medium mb-3 flex items-center gap-2">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                                    {t('paramedics')}
                                                </span>
                                            </h4>
                                            <div className="space-y-3">
                                                {booking.services
                                                    ?.filter((service) => service.type === 'paramedics')
                                                    .map((service, index) => {
                                                        const originalIndex = booking.services?.findIndex((s) => s === service) ?? -1;
                                                        return (
                                                            <div key={originalIndex} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="block text-sm font-medium mb-1">{t('select_paramedic')}</label>
                                                                        {serviceData.paramedics.length > 0 ? (
                                                                            <CustomSelect
                                                                                options={serviceData.paramedics.map((paramedic) => ({
                                                                                    value: String(paramedic.id),
                                                                                    label: paramedic.name,
                                                                                }))}
                                                                                value={String(service.id)}
                                                                                onChange={(value) => handleServiceSelectionChange(originalIndex, Array.isArray(value) ? value[0] : value)}
                                                                                placeholder={t('select_paramedic')}
                                                                            />
                                                                        ) : (
                                                                            <input
                                                                                type="text"
                                                                                value={service.name}
                                                                                onChange={(e) => handleServiceChange(originalIndex, 'name', e.target.value)}
                                                                                className="form-input"
                                                                                placeholder={t('enter_paramedic_name')}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-sm font-medium mb-1">{t('cost')} (₪)</label>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            step="0.01"
                                                                            value={service.cost}
                                                                            onChange={(e) => handleServiceChange(originalIndex, 'cost', e.target.value)}
                                                                            className="form-input"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                                    {t('service_total')}: {service.cost.toLocaleString()} ₪
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Security Companies Section */}
                                    {booking.services?.some((s) => s.type === 'security_companies') && (
                                        <div>
                                            <h4 className="text-md font-medium mb-3 flex items-center gap-2">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                                    {t('security_companies')}
                                                </span>
                                            </h4>
                                            <div className="space-y-3">
                                                {booking.services
                                                    ?.filter((service) => service.type === 'security_companies')
                                                    .map((service, index) => {
                                                        const originalIndex = booking.services?.findIndex((s) => s === service) ?? -1;
                                                        return (
                                                            <div key={originalIndex} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="block text-sm font-medium mb-1">{t('select_security_company')}</label>
                                                                        {serviceData.security_companies.length > 0 ? (
                                                                            <CustomSelect
                                                                                options={serviceData.security_companies.map((security) => ({
                                                                                    value: String(security.id),
                                                                                    label: security.name,
                                                                                }))}
                                                                                value={String(service.id)}
                                                                                onChange={(value) => handleServiceSelectionChange(originalIndex, Array.isArray(value) ? value[0] : value)}
                                                                                placeholder={t('select_security_company')}
                                                                            />
                                                                        ) : (
                                                                            <input
                                                                                type="text"
                                                                                value={service.name}
                                                                                onChange={(e) => handleServiceChange(originalIndex, 'name', e.target.value)}
                                                                                className="form-input"
                                                                                placeholder={t('enter_security_company_name')}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-sm font-medium mb-1">{t('cost')} (₪)</label>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            step="0.01"
                                                                            value={service.cost}
                                                                            onChange={(e) => handleServiceChange(originalIndex, 'cost', e.target.value)}
                                                                            className="form-input"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                                    {t('service_total')}: {service.cost.toLocaleString()} ₪
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Entertainment Companies Section */}
                                    {booking.services?.some((s) => s.type === 'external_entertainment_companies') && (
                                        <div>
                                            <h4 className="text-md font-medium mb-3 flex items-center gap-2">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                                    {t('external_entertainment_companies')}
                                                </span>
                                            </h4>
                                            <div className="space-y-3">
                                                {booking.services
                                                    ?.filter((service) => service.type === 'external_entertainment_companies')
                                                    .map((service, index) => {
                                                        const originalIndex = booking.services?.findIndex((s) => s === service) ?? -1;
                                                        return (
                                                            <div key={originalIndex} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="block text-sm font-medium mb-1">{t('select_entertainment_company')}</label>
                                                                        {serviceData.external_entertainment_companies.length > 0 ? (
                                                                            <CustomSelect
                                                                                options={serviceData.external_entertainment_companies.map((entertainment) => ({
                                                                                    value: String(entertainment.id),
                                                                                    label: entertainment.name,
                                                                                }))}
                                                                                value={String(service.id)}
                                                                                onChange={(value) => handleServiceSelectionChange(originalIndex, Array.isArray(value) ? value[0] : value)}
                                                                                placeholder={t('select_entertainment_company')}
                                                                            />
                                                                        ) : (
                                                                            <input
                                                                                type="text"
                                                                                value={service.name}
                                                                                onChange={(e) => handleServiceChange(originalIndex, 'name', e.target.value)}
                                                                                className="form-input"
                                                                                placeholder={t('enter_entertainment_company_name')}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-sm font-medium mb-1">{t('cost')} (₪)</label>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            step="0.01"
                                                                            value={service.cost}
                                                                            onChange={(e) => handleServiceChange(originalIndex, 'cost', e.target.value)}
                                                                            className="form-input"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                                    {t('service_total')}: {service.cost.toLocaleString()} ₪
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">{t('no_services_found')}</div>
                            )}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                            <div className="text-lg font-semibold text-right">
                                {t('total_amount')}: {calculateTotalAmount().toLocaleString()} ₪
                            </div>
                        </div>
                    </div>

                    {/* Additional Information */}
                    <div className="panel">
                        <div className="mb-5">
                            <h3 className="text-lg font-semibold">{t('additional_information')}</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('notes')}</label>
                                <textarea rows={3} value={booking.notes || ''} onChange={(e) => handleInputChange('notes', e.target.value)} className="form-textarea" placeholder={t('enter_notes')} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('special_requests')}</label>
                                <textarea
                                    rows={3}
                                    value={booking.special_requests || ''}
                                    onChange={(e) => handleInputChange('special_requests', e.target.value)}
                                    className="form-textarea"
                                    placeholder={t('enter_special_requests')}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Status Information */}
                    <div className="panel">
                        <div className="mb-5">
                            <h3 className="text-lg font-semibold">{t('booking_status')}</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('status')}</label>
                                <CustomSelect options={statusOptions} value={booking.status} onChange={(value) => handleInputChange('status', value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('payment_status')}</label>
                                <CustomSelect options={paymentStatusOptions} value={booking.payment_status} onChange={(value) => handleInputChange('payment_status', value)} />
                            </div>
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="panel">
                        <div className="mb-5">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <IconCalendar className="w-5 h-5 text-primary" />
                                {t('record_information')}
                            </h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('booking_reference')}</label>
                                <div className="text-sm font-semibold">{booking.booking_reference}</div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('created_at')}</label>
                                <div className="text-sm font-semibold">{new Date(booking.created_at).toLocaleDateString('tr-TR')}</div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('last_updated')}</label>
                                <div className="text-sm font-semibold">{new Date(booking.updated_at).toLocaleDateString('tr-TR')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
