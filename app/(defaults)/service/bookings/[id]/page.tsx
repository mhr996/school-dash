'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { motion } from 'framer-motion';
import Link from 'next/link';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconCalendar from '@/components/icon/icon-calendar';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconShekelSign from '@/components/icon/icon-shekel-sign';
import IconCheck from '@/components/icon/icon-check';
import IconX from '@/components/icon/icon-x';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import { getTranslation } from '@/i18n';

interface BookingServiceDetail {
    id: string;
    booking_id: string;
    service_type: string;
    quantity: number;
    days: number;
    booked_price: number;
    acceptance_status: 'pending' | 'accepted' | 'rejected';
    accepted_at?: string;
    rejected_at?: string;
    rejection_reason?: string;
    bookings: {
        booking_reference: string;
        trip_date: string;
        number_of_students?: number;
        number_of_crew?: number;
        number_of_buses?: number;
        special_requests?: string;
        destinations?: {
            name: string;
            address: string;
        };
    };
}

export default function ServiceBookingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClientComponentClient();
    const { t } = getTranslation();

    const bookingServiceId = params?.id as string;

    const [bookingService, setBookingService] = useState<BookingServiceDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [alert, setAlert] = useState<{ visible: boolean; message: string; type: 'success' | 'danger' }>({
        visible: false,
        message: '',
        type: 'success',
    });
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        fetchCurrentUser();
        if (bookingServiceId) {
            fetchBookingService();
        }
    }, [bookingServiceId]);

    const fetchCurrentUser = async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (user) {
            const { data: userData } = await supabase.from('users').select('*').eq('auth_user_id', user.id).single();
            setCurrentUser(userData);
        }
    };

    const fetchBookingService = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('booking_services')
                .select(
                    `
                    *,
                    bookings (
                        booking_reference,
                        trip_date,
                        number_of_students,
                        number_of_crew,
                        number_of_buses,
                        special_requests,
                        destinations (
                            name,
                            address
                        )
                    )
                `,
                )
                .eq('id', bookingServiceId)
                .single();

            if (error) throw error;
            setBookingService(data as BookingServiceDetail);
        } catch (error) {
            console.error('Error fetching booking service:', error);
            setAlert({ visible: true, message: t('error_loading_data'), type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async () => {
        if (!currentUser) return;

        try {
            setProcessing(true);
            const response = await fetch(`/api/booking-services/${bookingServiceId}/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'accept',
                    userId: currentUser.id,
                }),
            });

            const result = await response.json();

            if (result.success) {
                setAlert({ visible: true, message: t('booking_accepted_successfully') || 'הזמנה אושרה בהצלחה', type: 'success' });
                fetchBookingService();
                setTimeout(() => router.push('/service/bookings'), 2000);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error accepting booking:', error);
            setAlert({ visible: true, message: t('error_processing_request'), type: 'danger' });
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!currentUser) return;

        try {
            setProcessing(true);
            const response = await fetch(`/api/booking-services/${bookingServiceId}/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'reject',
                    reason: rejectionReason,
                    userId: currentUser.id,
                }),
            });

            const result = await response.json();

            if (result.success) {
                setAlert({ visible: true, message: t('booking_rejected_successfully') || 'הזמנה נדחתה', type: 'success' });
                fetchBookingService();
                setShowRejectModal(false);
                setTimeout(() => router.push('/service/bookings'), 2000);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error rejecting booking:', error);
            setAlert({ visible: true, message: t('error_processing_request'), type: 'danger' });
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!bookingService) {
        return (
            <div className="panel">
                <p className="text-center">{t('booking_not_found')}</p>
            </div>
        );
    }

    const destination = bookingService.bookings.destinations as any;
    const isResponded = bookingService.acceptance_status !== 'pending';

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <Link href="/service/bookings" className="flex items-center gap-2 text-primary hover:underline mb-4">
                    <IconArrowLeft className="w-5 h-5" />
                    {t('back_to_bookings') || 'חזרה להזמנות'}
                </Link>

                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('booking_details') || 'פרטי הזמנה'}</h1>
                        <p className="text-gray-500 mt-1">
                            {t('reference') || 'אסמכתא'}: <span className="font-semibold">{bookingService.bookings.booking_reference}</span>
                        </p>
                    </div>

                    {/* Status Badge */}
                    <div>
                        {bookingService.acceptance_status === 'accepted' && (
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg font-semibold">
                                <IconCheck className="w-5 h-5" />
                                {t('accepted') || 'אושר'}
                            </span>
                        )}
                        {bookingService.acceptance_status === 'rejected' && (
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg font-semibold">
                                <IconX className="w-5 h-5" />
                                {t('rejected') || 'נדחה'}
                            </span>
                        )}
                        {bookingService.acceptance_status === 'pending' && (
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg font-semibold">
                                ⏳ {t('pending_response') || 'ממתין לתגובה'}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {alert.visible && (
                <div className="mb-6">
                    <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ ...alert, visible: false })} />
                </div>
            )}

            {/* Booking Information */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Trip Information */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="panel">
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <IconCalendar className="w-6 h-6 text-primary" />
                            {t('trip_information') || 'מידע על הטיול'}
                        </h3>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <IconCalendar className="w-5 h-5 text-gray-400 mt-1" />
                                <div>
                                    <p className="text-sm text-gray-500">{t('trip_date') || 'תאריך הטיול'}</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">{new Date(bookingService.bookings.trip_date).toLocaleDateString('he-IL')}</p>
                                </div>
                            </div>

                            {destination && (
                                <div className="flex items-start gap-3">
                                    <IconMapPin className="w-5 h-5 text-gray-400 mt-1" />
                                    <div>
                                        <p className="text-sm text-gray-500">{t('destination') || 'יעד'}</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">{destination.name}</p>
                                        {destination.address && <p className="text-sm text-gray-500 mt-1">{destination.address}</p>}
                                    </div>
                                </div>
                            )}

                            {bookingService.bookings.number_of_students && (
                                <div className="flex items-start gap-3">
                                    <span className="text-gray-400 mt-1">👥</span>
                                    <div>
                                        <p className="text-sm text-gray-500">{t('participants') || 'משתתפים'}</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            {bookingService.bookings.number_of_students} {t('students') || 'תלמידים'}
                                            {bookingService.bookings.number_of_crew && ` + ${bookingService.bookings.number_of_crew} ${t('crew') || 'צוות'}`}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Service Details */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="panel">
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <IconShekelSign className="w-6 h-6 text-primary" />
                            {t('your_service_details') || 'פרטי השירות שלך'}
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">{t('quantity') || 'כמות'}</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{bookingService.quantity}</p>
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">{t('days') || 'ימים'}</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{bookingService.days}</p>
                            </div>

                            <div className="col-span-2 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">{t('total_amount') || 'סכום כולל'}</p>
                                <p className="text-3xl font-bold text-green-600 dark:text-green-400">₪{bookingService.booked_price.toLocaleString()}</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Special Requests */}
                    {bookingService.bookings.special_requests && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="panel">
                            <h3 className="text-xl font-semibold mb-4">{t('special_requests') || 'בקשות מיוחדות'}</h3>
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{bookingService.bookings.special_requests}</p>
                        </motion.div>
                    )}

                    {/* Rejection Reason */}
                    {bookingService.acceptance_status === 'rejected' && bookingService.rejection_reason && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="panel bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                            <h3 className="text-xl font-semibold mb-2 text-red-700 dark:text-red-400">{t('rejection_reason') || 'סיבת הדחייה'}</h3>
                            <p className="text-gray-700 dark:text-gray-300">{bookingService.rejection_reason}</p>
                        </motion.div>
                    )}
                </div>

                {/* Actions Sidebar */}
                <div className="lg:col-span-1">
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="panel sticky top-6">
                        <h3 className="text-xl font-semibold mb-4">{t('actions') || 'פעולות'}</h3>

                        {!isResponded ? (
                            <div className="space-y-3">
                                <button onClick={handleAccept} disabled={processing} className="w-full btn btn-success flex items-center justify-center gap-2">
                                    <IconCheck className="w-5 h-5" />
                                    {processing ? t('processing') || 'מעבד...' : t('accept_booking') || 'אשר הזמנה'}
                                </button>

                                <button onClick={() => setShowRejectModal(true)} disabled={processing} className="w-full btn btn-danger flex items-center justify-center gap-2">
                                    <IconX className="w-5 h-5" />
                                    {t('reject_booking') || 'דחה הזמנה'}
                                </button>

                                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <p className="text-sm text-blue-700 dark:text-blue-400">💡 {t('booking_acceptance_note') || 'לאחר אישור או דחייה, לא תוכל לשנות את החלטתך'}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-gray-500">
                                    {bookingService.acceptance_status === 'accepted' ? t('you_accepted_this_booking') || 'אישרת הזמנה זו' : t('you_rejected_this_booking') || 'דחית הזמנה זו'}
                                </p>
                                <p className="text-sm text-gray-400 mt-2">
                                    {bookingService.accepted_at && new Date(bookingService.accepted_at).toLocaleString('he-IL')}
                                    {bookingService.rejected_at && new Date(bookingService.rejected_at).toLocaleString('he-IL')}
                                </p>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-xl font-semibold mb-4">{t('confirm_rejection') || 'אישור דחייה'}</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">{t('rejection_confirmation_text') || 'האם אתה בטוח שברצונך לדחות הזמנה זו?'}</p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">{t('reason_optional') || 'סיבה (אופציונלי)'}</label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="form-textarea w-full"
                                rows={3}
                                placeholder={t('enter_rejection_reason') || 'הזן סיבת דחייה...'}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button onClick={handleReject} disabled={processing} className="flex-1 btn btn-danger">
                                {processing ? t('processing') : t('confirm_reject') || 'אשר דחייה'}
                            </button>
                            <button onClick={() => setShowRejectModal(false)} disabled={processing} className="flex-1 btn btn-outline-dark">
                                {t('cancel') || 'ביטול'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
