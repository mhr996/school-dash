'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import IconStar from '@/components/icon/icon-star';
import IconX from '@/components/icon/icon-x';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconUsers from '@/components/icon/icon-users';
import IconHeart from '@/components/icon/icon-heart';
import IconLock from '@/components/icon/icon-lock';
import IconPlayCircle from '@/components/icon/icon-play-circle';
import IconBook from '@/components/icon/icon-book';
import IconCar from '@/components/icon/icon-car';
import supabase from '@/lib/supabase';

interface RatingItem {
    type: 'destination' | 'guides' | 'paramedics' | 'security_companies' | 'external_entertainment_companies' | 'travel_companies' | 'education_programs';
    id: string;
    name: string;
    rating: number;
    comment: string;
}

interface RatingModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: any; // Booking with services and destination info
    onSubmitSuccess: () => void;
    t: (key: string) => string;
}

const serviceIcons: Record<string, any> = {
    destination: IconMapPin,
    guides: IconUsers,
    paramedics: IconHeart,
    security_companies: IconLock,
    external_entertainment_companies: IconPlayCircle,
    education_programs: IconBook,
    travel_companies: IconCar,
};

const serviceColors: Record<string, string> = {
    destination: 'from-blue-500 to-blue-600',
    guides: 'from-green-500 to-green-600',
    paramedics: 'from-red-500 to-red-600',
    security_companies: 'from-yellow-500 to-yellow-600',
    external_entertainment_companies: 'from-purple-500 to-purple-600',
    education_programs: 'from-orange-500 to-orange-600',
    travel_companies: 'from-indigo-500 to-indigo-600',
};

export default function RatingModal({ isOpen, onClose, booking, onSubmitSuccess, t }: RatingModalProps) {
    const [ratings, setRatings] = useState<RatingItem[]>([]);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize ratings when modal opens
    useEffect(() => {
        if (isOpen && booking) {
            const items: RatingItem[] = [];

            // Add destination if exists
            if (booking.destination_id && booking.destinations) {
                items.push({
                    type: 'destination',
                    id: booking.destination_id,
                    name: booking.destinations.name,
                    rating: 0,
                    comment: '',
                });
            }

            // Add services from booking_services
            if (booking.booking_services && booking.booking_services.length > 0) {
                booking.booking_services.forEach((service: any) => {
                    let name = '';

                    // Get service name based on type
                    if (service.service_type === 'guides' && service.guides) {
                        name = service.guides.name;
                    } else if (service.service_type === 'paramedics' && service.paramedics) {
                        name = service.paramedics.name;
                    } else if (service.service_type === 'security_companies' && service.security_companies) {
                        name = service.security_companies.name;
                    } else if (service.service_type === 'external_entertainment_companies') {
                        // For entertainment, we need the sub-service label
                        name = service.entertainment_company_services?.service_label || 'Entertainment Service';
                    } else if (service.service_type === 'education_programs') {
                        // For education, we need the sub-service label
                        name = service.education_program_services?.service_label || 'Education Program';
                    } else if (service.service_type === 'travel_companies' && service.travel_companies) {
                        name = service.travel_companies.name;
                    }

                    if (name) {
                        items.push({
                            type: service.service_type,
                            id: service.service_id,
                            name,
                            rating: 0,
                            comment: '',
                        });
                    }
                });
            }

            setRatings(items);
        }
    }, [isOpen, booking]);

    const handleRatingChange = (index: number, rating: number) => {
        const newRatings = [...ratings];
        newRatings[index].rating = rating;
        setRatings(newRatings);
        setError(null);
    };

    const handleCommentChange = (index: number, comment: string) => {
        const newRatings = [...ratings];
        newRatings[index].comment = comment;
        setRatings(newRatings);
    };

    const canSubmit = () => {
        // All items must have a rating (1-5)
        return ratings.every((item) => item.rating >= 1 && item.rating <= 5);
    };

    const handleSubmit = async () => {
        if (!canSubmit()) {
            setError(t('please_rate_all_services'));
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Get current user
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Get user profile to get the user_id
            const { data: userProfile, error: profileError } = await supabase.from('users').select('id').eq('auth_user_id', user.id).single();

            if (profileError) throw profileError;

            // Prepare rating records
            const ratingRecords = ratings.map((item) => ({
                booking_id: booking.id,
                user_id: userProfile.id,
                service_type: item.type,
                service_id: item.type === 'destination' ? null : item.id,
                destination_id: item.type === 'destination' ? item.id : null,
                rating: item.rating,
                comment: item.comment || null,
                is_anonymous: isAnonymous,
            }));

            // Insert all ratings
            const { error: insertError } = await supabase.from('ratings').insert(ratingRecords);

            if (insertError) throw insertError;

            // Success!
            onSubmitSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error submitting ratings:', err);
            setError(err.message || t('failed_to_submit_ratings'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const StarRating = ({ rating, onRate, size = 'md' }: { rating: number; onRate: (rating: number) => void; size?: 'sm' | 'md' | 'lg' }) => {
        const sizeClasses = {
            sm: 'w-4 h-4',
            md: 'w-6 h-6',
            lg: 'w-8 h-8',
        };

        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => onRate(star)} className="transition-transform hover:scale-110 focus:outline-none">
                        <IconStar className={`${sizeClasses[size]} ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
                    </button>
                ))}
            </div>
        );
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-3xl bg-white dark:bg-gray-900 shadow-2xl transition-all">
                                {/* Header */}
                                <div className="relative bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                                                <IconStar className="w-7 h-7 text-white fill-white" />
                                            </div>
                                            <div>
                                                <Dialog.Title className="text-2xl font-bold text-white">{t('rate_your_experience')}</Dialog.Title>
                                                <p className="text-yellow-100 text-sm mt-1">
                                                    {t('booking_reference')}: {booking?.booking_reference}
                                                </p>
                                            </div>
                                        </div>
                                        <button onClick={onClose} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-all">
                                            <IconX className="w-5 h-5 text-white" />
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 max-h-[60vh] overflow-y-auto">
                                    <p className="text-gray-600 dark:text-gray-400 mb-6">{t('rate_all_services_message')}</p>

                                    <div className="space-y-4">
                                        {ratings.map((item, index) => {
                                            const Icon = serviceIcons[item.type];
                                            const colorClass = serviceColors[item.type];

                                            return (
                                                <motion.div
                                                    key={`${item.type}-${item.id}`}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className={`w-10 h-10 bg-gradient-to-br ${colorClass} rounded-lg flex items-center justify-center shrink-0`}>
                                                            <Icon className="w-5 h-5 text-white" />
                                                        </div>
                                                        <div className="flex-1 space-y-3">
                                                            <div>
                                                                <h4 className="font-semibold text-gray-900 dark:text-white">{item.name}</h4>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{t(item.type)}</p>
                                                            </div>

                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                                    {t('rating')} <span className="text-red-500">*</span>
                                                                </label>
                                                                <StarRating rating={item.rating} onRate={(rating) => handleRatingChange(index, rating)} />
                                                            </div>

                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                                    {t('comment')} <span className="text-gray-400">({t('optional')})</span>
                                                                </label>
                                                                <textarea
                                                                    value={item.comment}
                                                                    onChange={(e) => handleCommentChange(index, e.target.value)}
                                                                    placeholder={t('share_your_thoughts')}
                                                                    rows={3}
                                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>

                                    {/* Anonymous Option */}
                                    <div className="mt-6 flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                                        <input
                                            type="checkbox"
                                            id="anonymous"
                                            checked={isAnonymous}
                                            onChange={(e) => setIsAnonymous(e.target.checked)}
                                            className="w-5 h-5 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                                        />
                                        <label htmlFor="anonymous" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                                            {t('submit_rating_anonymously')}
                                        </label>
                                    </div>

                                    {error && (
                                        <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg">
                                            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {ratings.filter((r) => r.rating > 0).length} / {ratings.length} {t('rated')}
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={onClose}
                                            disabled={isSubmitting}
                                            className="px-6 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
                                        >
                                            {t('cancel')}
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={!canSubmit() || isSubmitting}
                                            className={`px-6 py-2 rounded-xl font-semibold text-white transition-all ${
                                                canSubmit() && !isSubmitting
                                                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-lg hover:shadow-xl'
                                                    : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                                            }`}
                                        >
                                            {isSubmitting ? t('submitting') : t('submit_ratings')}
                                        </button>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
