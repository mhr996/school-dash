'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import IconFire from '@/components/icon/icon-fire';
import IconStar from '@/components/icon/icon-star';
import IconClock from '@/components/icon/icon-clock';
import IconShoppingBag from '@/components/icon/icon-shopping-bag';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconEye from '@/components/icon/icon-eye';
import IconCar from '@/components/icon/icon-car';
import IconCoffee from '@/components/icon/icon-coffee';
import IconUsersGroup from '@/components/icon/icon-users-group';
import IconBox from '@/components/icon/icon-box';
import { getTranslation } from '@/i18n';

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
    created_at?: string | null;
    updated_at?: string | null;
};

type DestinationTabKey = 'most_visited' | 'top_rated' | 'latest' | 'best_deals';

interface TabbedDestinationsSectionProps {
    mostVisitedDestinations: Destination[];
    topRatedDestinations: Destination[];
    latestDestinations: Destination[];
    bestDeals: Destination[];
    onSelectDestination: (destination: Destination) => void;
    onViewDestinationDetails: (destination: Destination) => void;
    onViewAll: () => void;
    getPublicUrlFromPath: (path: string) => string;
}

const getPropertyIcon = (property: string) => {
    const iconMap: { [key: string]: any } = {
        wifi: IconBox,
        swimming_pool: IconBox,
        parking: IconCar,
        restaurant: IconCoffee,
        accessible: IconUsersGroup,
    };
    return iconMap[property] || IconStar;
};

export default function TabbedDestinationsSection({
    mostVisitedDestinations,
    topRatedDestinations,
    latestDestinations,
    bestDeals,
    onSelectDestination,
    onViewDestinationDetails,
    onViewAll,
    getPublicUrlFromPath,
}: TabbedDestinationsSectionProps) {
    const { t } = getTranslation();
    const [activeTab, setActiveTab] = useState<DestinationTabKey>('most_visited');

    const getCurrentDestinations = (): Destination[] => {
        switch (activeTab) {
            case 'most_visited':
                return mostVisitedDestinations;
            case 'top_rated':
                return topRatedDestinations;
            case 'latest':
                return latestDestinations;
            case 'best_deals':
                return bestDeals;
            default:
                return mostVisitedDestinations;
        }
    };

    const getTabTheme = () => {
        switch (activeTab) {
            case 'most_visited':
                return {
                    gradient: 'from-purple-600 via-violet-600 to-fuchsia-600',
                    shadow: 'shadow-purple-500/30',
                    iconColor: 'text-purple-600 dark:text-purple-400',
                    hoverColor: 'hover:text-purple-600 dark:hover:text-purple-400',
                    buttonBg: 'bg-purple-600 hover:bg-purple-700',
                    buttonShadow: 'hover:shadow-purple-500/25',
                };
            case 'top_rated':
                return {
                    gradient: 'from-amber-600 via-orange-600 to-red-600',
                    shadow: 'shadow-amber-500/30',
                    iconColor: 'text-amber-600 dark:text-amber-400',
                    hoverColor: 'hover:text-amber-600 dark:hover:text-amber-400',
                    buttonBg: 'bg-amber-600 hover:bg-amber-700',
                    buttonShadow: 'hover:shadow-amber-500/25',
                };
            case 'latest':
                return {
                    gradient: 'from-blue-600 via-indigo-600 to-purple-600',
                    shadow: 'shadow-blue-500/30',
                    iconColor: 'text-blue-600 dark:text-blue-400',
                    hoverColor: 'hover:text-blue-600 dark:hover:text-blue-400',
                    buttonBg: 'bg-blue-600 hover:bg-blue-700',
                    buttonShadow: 'hover:shadow-blue-500/25',
                };
            case 'best_deals':
                return {
                    gradient: 'from-emerald-600 via-green-600 to-teal-600',
                    shadow: 'shadow-emerald-500/30',
                    iconColor: 'text-emerald-600 dark:text-emerald-400',
                    hoverColor: 'hover:text-emerald-600 dark:hover:text-emerald-400',
                    buttonBg: 'bg-emerald-600 hover:bg-emerald-700',
                    buttonShadow: 'hover:shadow-emerald-500/25',
                };
        }
    };

    const theme = getTabTheme();
    const currentDestinations = getCurrentDestinations();

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-16 mt-16">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200">{t('explore_destinations')}</h2>
                <button onClick={onViewAll} className={`text-purple-600 ${theme.hoverColor} dark:text-purple-400 dark:hover:text-purple-300 font-medium flex items-center gap-2 transition-colors`}>
                    {t('view_all')}
                    <svg className="w-4 h-4 ltr:rotate-0 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="relative bg-white/30 dark:bg-slate-900/30 backdrop-blur-xl rounded-2xl p-2 border border-white/40 dark:border-slate-700/40 shadow-lg mb-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveTab('most_visited')}
                        className={`relative px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                            activeTab === 'most_visited'
                                ? 'bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/30'
                                : 'bg-white/50 dark:bg-slate-800/50 text-gray-700 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-slate-800/70'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <span className="hidden sm:inline">{t('most_visited_destinations')}</span>
                            <span className="sm:hidden">{t('most_visited')}</span>
                        </div>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveTab('top_rated')}
                        className={`relative px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                            activeTab === 'top_rated'
                                ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-white shadow-lg shadow-amber-500/30'
                                : 'bg-white/50 dark:bg-slate-800/50 text-gray-700 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-slate-800/70'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <span className="hidden sm:inline">{t('top_rated_destinations')}</span>
                            <span className="sm:hidden">{t('top_rated')}</span>
                        </div>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveTab('latest')}
                        className={`relative px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                            activeTab === 'latest'
                                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                                : 'bg-white/50 dark:bg-slate-800/50 text-gray-700 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-slate-800/70'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <span className="hidden sm:inline">{t('latest_destinations')}</span>
                            <span className="sm:hidden">{t('latest')}</span>
                        </div>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveTab('best_deals')}
                        className={`relative px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                            activeTab === 'best_deals'
                                ? 'bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30'
                                : 'bg-white/50 dark:bg-slate-800/50 text-gray-700 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-slate-800/70'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <span className="hidden sm:inline">{t('best_deals')}</span>
                            <span className="sm:hidden">{t('deals')}</span>
                        </div>
                    </motion.button>
                </div>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    {currentDestinations.slice(0, 8).map((destination, index) => (
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
                                {/* Special Badge for Best Deals */}
                                {activeTab === 'best_deals' && (
                                    <div className="absolute top-4 left-4 z-10">
                                        <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">{t('best_deal')}</span>
                                    </div>
                                )}

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
                                                onViewDestinationDetails(destination);
                                            }}
                                        >
                                            <IconEye className="h-5 w-5 text-white drop-shadow-sm" />
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 bg-white/10 dark:bg-slate-800/10 backdrop-blur-sm">
                                    <h3 className={`text-xl font-bold text-gray-900 dark:text-white mb-2 ${theme.hoverColor} transition-colors duration-300 drop-shadow-sm`}>{destination.name}</h3>
                                    <div className="flex items-center text-gray-700 dark:text-gray-200 mb-4">
                                        <IconMapPin className="h-4 w-4 ltr:mr-2 rtl:ml-2 flex-shrink-0" />
                                        <span className="text-sm truncate drop-shadow-sm">{destination.address}</span>
                                    </div>

                                    {/* Pricing */}
                                    {destination.pricing && (
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className={`text-2xl font-bold ${theme.iconColor} drop-shadow-sm`}>
                                                        {destination.pricing?.child ? `₪${destination.pricing.child}` : t('contact_for_price')}
                                                    </div>
                                                    {activeTab === 'best_deals' &&
                                                        destination.pricing?.adult &&
                                                        destination.pricing?.child &&
                                                        destination.pricing.adult !== destination.pricing.child && (
                                                            <div className="flex flex-col">
                                                                <div className="text-sm text-gray-500 dark:text-gray-400 line-through">₪{destination.pricing.adult}</div>
                                                                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                                                    {Math.round(((destination.pricing.adult - destination.pricing.child) / destination.pricing.adult) * 100)}% {t('off')}
                                                                </div>
                                                            </div>
                                                        )}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{t('per_person')}</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Properties */}
                                    {destination.properties && destination.properties.length > 0 && (
                                        <div className="mb-4">
                                            <div className="flex flex-wrap gap-2">
                                                {destination.properties.slice(0, 3).map((property, idx) => {
                                                    const IconComponent = getPropertyIcon(property);
                                                    return (
                                                        <motion.div
                                                            key={idx}
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{ delay: 0.5 + idx * 0.1 }}
                                                            className={`inline-flex items-center gap-1 px-3 py-1 bg-${activeTab === 'most_visited' ? 'purple' : activeTab === 'top_rated' ? 'amber' : activeTab === 'latest' ? 'blue' : 'emerald'}-500/20 dark:bg-${activeTab === 'most_visited' ? 'purple' : activeTab === 'top_rated' ? 'amber' : activeTab === 'latest' ? 'blue' : 'emerald'}-400/20 text-${activeTab === 'most_visited' ? 'purple' : activeTab === 'top_rated' ? 'amber' : activeTab === 'latest' ? 'blue' : 'emerald'}-700 dark:text-${activeTab === 'most_visited' ? 'purple' : activeTab === 'top_rated' ? 'amber' : activeTab === 'latest' ? 'blue' : 'emerald'}-300 rounded-full text-xs font-medium backdrop-blur-sm border border-${activeTab === 'most_visited' ? 'purple' : activeTab === 'top_rated' ? 'amber' : activeTab === 'latest' ? 'blue' : 'emerald'}-200/50 dark:border-${activeTab === 'most_visited' ? 'purple' : activeTab === 'top_rated' ? 'amber' : activeTab === 'latest' ? 'blue' : 'emerald'}-600/30`}
                                                        >
                                                            <IconComponent className="h-3 w-3" />
                                                            <span className="drop-shadow-sm">{t(property)}</span>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Requirements Section */}
                                    {destination.requirements && destination.requirements.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-gray-200/30 dark:border-gray-700/30">
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3 flex items-center gap-2">
                                                <svg className="h-4 w-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {t('requirements')}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {destination.requirements.slice(0, 2).map((requirement: string, idx: number) => (
                                                    <motion.div
                                                        key={idx}
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ delay: 0.5 + idx * 0.1 }}
                                                        className="inline-flex items-center gap-1 px-3 py-1 bg-orange-500/20 dark:bg-orange-400/20 text-orange-700 dark:text-orange-300 rounded-full text-xs font-medium backdrop-blur-sm border border-orange-200/50 dark:border-orange-600/30"
                                                    >
                                                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" />
                                                        </svg>
                                                        <span className="drop-shadow-sm">{t(requirement)}</span>
                                                    </motion.div>
                                                ))}
                                                {destination.requirements.length > 2 && (
                                                    <span className="inline-flex items-center px-2 py-1 bg-gray-500/20 dark:bg-gray-400/20 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">
                                                        +{destination.requirements.length - 2}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelectDestination(destination);
                                            }}
                                            className={`flex-1 ${theme.buttonBg} text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl ${theme.buttonShadow} backdrop-blur-sm border border-white/10`}
                                        >
                                            {activeTab === 'best_deals' ? t('book_now') : t('select')}
                                        </motion.button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </AnimatePresence>

            {/* Empty State */}
            {currentDestinations.length === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12 bg-white/10 dark:bg-slate-900/10 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-slate-700/20"
                >
                    <p className="text-gray-600 dark:text-gray-400">{t('no_destinations_found')}</p>
                </motion.div>
            )}
        </motion.div>
    );
}
