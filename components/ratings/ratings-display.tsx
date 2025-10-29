'use client';
import { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';
import { motion } from 'framer-motion';
import IconStar from '@/components/icon/icon-star';
import IconUser from '@/components/icon/icon-user';
import IconCalendar from '@/components/icon/icon-calendar';

type Rating = {
    id: string;
    booking_id: string;
    user_id: string;
    service_type: string;
    service_id: string;
    destination_id: string | null;
    rating: number;
    comment: string | null;
    is_anonymous: boolean;
    created_at: string;
    user?: {
        full_name: string;
        email: string;
    };
};

type RatingsDisplayProps = {
    serviceType: string;
    serviceId: string;
    t: any;
    showAdminView?: boolean; // If true, shows all ratings including user info for anonymous ones
};

export default function RatingsDisplay({ serviceType, serviceId, t, showAdminView = false }: RatingsDisplayProps) {
    const [ratings, setRatings] = useState<Rating[]>([]);
    const [loading, setLoading] = useState(true);
    const [averageRating, setAverageRating] = useState(0);
    const [ratingDistribution, setRatingDistribution] = useState<Record<number, number>>({
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
    });

    useEffect(() => {
        fetchRatings();
    }, [serviceType, serviceId]);

    const fetchRatings = async () => {
        try {
            setLoading(true);

            // Fetch ratings with user info
            const { data, error } = await supabase
                .from('ratings')
                .select(
                    `
                    *,
                    user:users!user_id(full_name, email)
                `,
                )
                .eq('service_type', serviceType)
                .eq('service_id', serviceId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setRatings((data as any) || []);

            // Calculate average rating
            if (data && data.length > 0) {
                const sum = data.reduce((acc, r) => acc + r.rating, 0);
                const avg = sum / data.length;
                setAverageRating(avg);

                // Calculate distribution
                const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
                data.forEach((r) => {
                    distribution[r.rating] = (distribution[r.rating] || 0) + 1;
                });
                setRatingDistribution(distribution);
            }
        } catch (error) {
            console.error('Error fetching ratings:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const StarRating = ({ rating }: { rating: number }) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <IconStar key={star} className={`w-4 h-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (ratings.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="inline-flex p-6 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                    <IconStar className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('no_ratings_yet')}</h3>
                <p className="text-gray-600 dark:text-gray-400">{t('be_the_first_to_rate')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Rating Summary */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-6 border-2 border-yellow-200 dark:border-yellow-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Average Rating */}
                    <div className="text-center">
                        <div className="text-5xl font-black bg-gradient-to-r from-yellow-600 to-orange-600 dark:from-yellow-400 dark:to-orange-400 bg-clip-text text-transparent mb-2">
                            {averageRating.toFixed(1)}
                        </div>
                        <div className="flex justify-center mb-2">
                            <StarRating rating={Math.round(averageRating)} />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t('based_on')} {ratings.length} {ratings.length === 1 ? t('rating') : t('ratings')}
                        </p>
                    </div>

                    {/* Rating Distribution */}
                    <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((star) => {
                            const count = ratingDistribution[star] || 0;
                            const percentage = ratings.length > 0 ? (count / ratings.length) * 100 : 0;

                            return (
                                <div key={star} className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 w-12">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{star}</span>
                                        <IconStar className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    </div>
                                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 h-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-8 text-right">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Individual Ratings */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <IconUser className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    {t('customer_reviews')}
                </h3>

                {ratings.map((rating, index) => {
                    const showUserInfo = showAdminView || !rating.is_anonymous;

                    return (
                        <motion.div
                            key={rating.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                                        {showUserInfo && rating.user ? rating.user.full_name.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900 dark:text-white">{showUserInfo && rating.user ? rating.user.full_name : t('anonymous_user')}</div>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                            <IconCalendar className="w-3 h-3" />
                                            {formatDate(rating.created_at)}
                                        </div>
                                    </div>
                                </div>
                                <StarRating rating={rating.rating} />
                            </div>

                            {rating.comment && (
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border-l-4 border-purple-500">{rating.comment}</p>
                            )}

                            {showAdminView && rating.is_anonymous && (
                                <div className="mt-3 flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded-full w-fit">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {t('anonymous_rating_admin_notice')}
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
