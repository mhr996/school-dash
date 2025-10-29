'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import supabase from '@/lib/supabase';
import { getCurrentUserWithRole } from '@/lib/auth';
import { getTranslation } from '@/i18n';
import IconStar from '@/components/icon/icon-star';
import IconUser from '@/components/icon/icon-user';
import IconCalendar from '@/components/icon/icon-calendar';
import IconTrendingUp from '@/components/icon/icon-trending-up';
import IconFilter from '@/components/icon/icon-filter';

type Rating = {
    id: string;
    booking_id: string;
    user_id: string;
    service_type: string;
    service_id: string;
    rating: number;
    comment: string | null;
    is_anonymous: boolean;
    created_at: string;
    user?: {
        full_name: string;
        email: string;
    };
    booking?: {
        booking_reference: string;
        trip_date: string;
    };
};

type RatingStats = {
    average: number;
    total: number;
    distribution: Record<number, number>;
    recentTrend: 'up' | 'down' | 'stable';
};

export default function ServiceProviderRatingsPage() {
    const { t } = getTranslation();
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [ratings, setRatings] = useState<Rating[]>([]);
    const [stats, setStats] = useState<RatingStats>({
        average: 0,
        total: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        recentTrend: 'stable',
    });
    const [filterRating, setFilterRating] = useState<number | 'all'>('all');
    const [sortBy, setSortBy] = useState<'recent' | 'highest' | 'lowest'>('recent');

    useEffect(() => {
        fetchUserAndRatings();
    }, []);

    const fetchUserAndRatings = async () => {
        try {
            setLoading(true);

            // Get current user
            const { user, error: userError } = await getCurrentUserWithRole();
            if (userError || !user) {
                setLoading(false);
                return;
            }

            setCurrentUser(user);

            // Determine service type based on user role
            let serviceType = '';
            let serviceTableName = '';

            switch (user.role) {
                case 'guide':
                    serviceType = 'guides';
                    serviceTableName = 'guides';
                    break;
                case 'paramedic':
                    serviceType = 'paramedics';
                    serviceTableName = 'paramedics';
                    break;
                case 'security_company':
                    serviceType = 'security_companies';
                    serviceTableName = 'security_companies';
                    break;
                case 'travel_company':
                    serviceType = 'travel_companies';
                    serviceTableName = 'travel_companies';
                    break;
                case 'entertainment_company':
                    serviceType = 'external_entertainment_companies';
                    serviceTableName = 'external_entertainment_companies';
                    break;
                default:
                    console.error('User role does not match any service type');
                    setLoading(false);
                    return;
            }

            // Find the service ID for this user
            const { data: serviceData, error: serviceError } = await supabase.from(serviceTableName).select('id').eq('user_id', user.id).single();

            if (serviceError || !serviceData) {
                console.error('No service found for user:', serviceError);
                setLoading(false);
                return;
            }

            const serviceId = serviceData.id;

            // Fetch ratings for this service
            const { data: ratingsData, error: ratingsError } = await supabase
                .from('ratings')
                .select(
                    `
                    *,
                    user:users!user_id(full_name, email),
                    booking:bookings!booking_id(booking_reference, trip_date)
                `,
                )
                .eq('service_type', serviceType)
                .eq('service_id', serviceId)
                .order('created_at', { ascending: false });

            if (ratingsError) {
                console.error('Error fetching ratings:', ratingsError);
                setLoading(false);
                return;
            }

            setRatings((ratingsData as any) || []);

            // Calculate statistics
            if (ratingsData && ratingsData.length > 0) {
                const total = ratingsData.length;
                const sum = ratingsData.reduce((acc, r) => acc + r.rating, 0);
                const average = sum / total;

                const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
                ratingsData.forEach((r) => {
                    distribution[r.rating] = (distribution[r.rating] || 0) + 1;
                });

                // Calculate trend (compare last 5 vs previous 5)
                let recentTrend: 'up' | 'down' | 'stable' = 'stable';
                if (total >= 10) {
                    const recentFive = ratingsData.slice(0, 5);
                    const previousFive = ratingsData.slice(5, 10);
                    const recentAvg = recentFive.reduce((acc, r) => acc + r.rating, 0) / 5;
                    const previousAvg = previousFive.reduce((acc, r) => acc + r.rating, 0) / 5;

                    if (recentAvg > previousAvg + 0.2) recentTrend = 'up';
                    else if (recentAvg < previousAvg - 0.2) recentTrend = 'down';
                }

                setStats({
                    average,
                    total,
                    distribution,
                    recentTrend,
                });
            }
        } catch (error) {
            console.error('Error loading ratings:', error);
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
                    <IconStar key={star} className={`w-5 h-5 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
                ))}
            </div>
        );
    };

    // Filter and sort ratings
    const filteredAndSortedRatings = ratings
        .filter((rating) => {
            if (filterRating === 'all') return true;
            return rating.rating === filterRating;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'recent':
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                case 'highest':
                    return b.rating - a.rating;
                case 'lowest':
                    return a.rating - b.rating;
                default:
                    return 0;
            }
        });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 dark:from-slate-900 dark:via-orange-950 dark:to-slate-900">
                <div className="relative">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-t-4 border-yellow-600"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <IconStar className="w-12 h-12 text-yellow-600 animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-orange-900/10 dark:to-red-900/10">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-8">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 dark:from-yellow-600/90 dark:via-orange-600/90 dark:to-red-600/90 p-8 shadow-2xl shadow-orange-500/30">
                        <div className="absolute inset-0 bg-[url('/assets/images/auth/bg-gradient.png')] opacity-10"></div>
                        <div className="relative z-10">
                            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                                <span className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                                    <IconStar className="w-8 h-8" />
                                </span>
                                {t('my_ratings')}
                            </h1>
                            <p className="text-orange-100">{t('see_what_customers_think')}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Average Rating */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-yellow-500/20 p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t('average_rating')}</h3>
                            <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl">
                                <IconStar className="w-6 h-6 text-white fill-white" />
                            </div>
                        </div>
                        <div className="text-5xl font-black bg-gradient-to-r from-yellow-600 to-orange-600 dark:from-yellow-400 dark:to-orange-400 bg-clip-text text-transparent mb-2">
                            {stats.average.toFixed(1)}
                        </div>
                        <div className="flex items-center gap-2">
                            <StarRating rating={Math.round(stats.average)} />
                        </div>
                    </motion.div>

                    {/* Total Ratings */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-purple-500/20 p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t('total_ratings')}</h3>
                            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                                <IconUser className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div className="text-5xl font-black bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-2">{stats.total}</div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('customer_reviews')}</p>
                    </motion.div>

                    {/* Trend */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-green-500/20 p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t('recent_trend')}</h3>
                            <div
                                className={`p-3 rounded-xl ${stats.recentTrend === 'up' ? 'bg-gradient-to-br from-green-500 to-emerald-500' : stats.recentTrend === 'down' ? 'bg-gradient-to-br from-red-500 to-rose-500' : 'bg-gradient-to-br from-blue-500 to-cyan-500'}`}
                            >
                                <IconTrendingUp className={`w-6 h-6 text-white ${stats.recentTrend === 'down' ? 'rotate-180' : ''}`} />
                            </div>
                        </div>
                        <div
                            className={`text-3xl font-black mb-2 ${stats.recentTrend === 'up' ? 'text-green-600 dark:text-green-400' : stats.recentTrend === 'down' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}
                        >
                            {stats.recentTrend === 'up' ? t('improving') : stats.recentTrend === 'down' ? t('declining') : t('stable')}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('based_on_recent_reviews')}</p>
                    </motion.div>
                </div>

                {/* Rating Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-yellow-500/20 p-6 mb-8"
                >
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t('rating_distribution')}</h3>
                    <div className="space-y-3">
                        {[5, 4, 3, 2, 1].map((star) => {
                            const count = stats.distribution[star] || 0;
                            const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;

                            return (
                                <div key={star} className="flex items-center gap-4">
                                    <div className="flex items-center gap-1 w-16">
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{star}</span>
                                        <IconStar className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    </div>
                                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 h-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 w-16 text-right">
                                        {count} ({percentage.toFixed(0)}%)
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-purple-500/20 p-6 mb-8"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <IconFilter className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('filter_and_sort')}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Filter by Rating */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-purple-300 mb-2">{t('filter_by_rating')}</label>
                            <select
                                value={filterRating}
                                onChange={(e) => setFilterRating(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                                className="w-full px-4 py-3 bg-white dark:bg-gray-900/50 border-2 border-purple-200 dark:border-purple-500/30 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white"
                            >
                                <option value="all">{t('all_ratings')}</option>
                                <option value="5">5 {t('stars')}</option>
                                <option value="4">4 {t('stars')}</option>
                                <option value="3">3 {t('stars')}</option>
                                <option value="2">2 {t('stars')}</option>
                                <option value="1">1 {t('star')}</option>
                            </select>
                        </div>

                        {/* Sort By */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-purple-300 mb-2">{t('sort_by')}</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as 'recent' | 'highest' | 'lowest')}
                                className="w-full px-4 py-3 bg-white dark:bg-gray-900/50 border-2 border-purple-200 dark:border-purple-500/30 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white"
                            >
                                <option value="recent">{t('most_recent')}</option>
                                <option value="highest">{t('highest_rating')}</option>
                                <option value="lowest">{t('lowest_rating')}</option>
                            </select>
                        </div>
                    </div>
                </motion.div>

                {/* Ratings List */}
                {filteredAndSortedRatings.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="text-center py-12 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-purple-500/20"
                    >
                        <div className="inline-flex p-6 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                            <IconStar className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('no_ratings_yet')}</h3>
                        <p className="text-gray-600 dark:text-gray-400">{filterRating !== 'all' ? t('no_ratings_with_filter') : t('ratings_will_appear_here')}</p>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        {filteredAndSortedRatings.map((rating, index) => (
                            <motion.div
                                key={rating.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.05 * Math.min(index, 10) }}
                                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-yellow-300 dark:hover:border-yellow-600 transition-all duration-200 shadow-lg"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                            {rating.is_anonymous ? '?' : rating.user?.full_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900 dark:text-white">{rating.is_anonymous ? t('anonymous_user') : rating.user?.full_name}</div>
                                            {rating.booking && (
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {t('booking')}: {rating.booking.booking_reference} • {formatDate(rating.booking.trip_date)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <StarRating rating={rating.rating} />
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                            <IconCalendar className="w-3 h-3" />
                                            {formatDate(rating.created_at)}
                                        </div>
                                    </div>
                                </div>

                                {rating.comment && (
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border-l-4 border-yellow-500">{rating.comment}</p>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
