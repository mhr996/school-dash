'use client';
import React from 'react';
import { motion } from 'framer-motion';

// Icons
import IconTrendingUp from '@/components/icon/icon-trending-up';
import IconTrendingDown from '@/components/icon/icon-trending-down';
import IconShekelSign from '@/components/icon/icon-shekel-sign';
import IconCreditCard from '@/components/icon/icon-credit-card';

interface RevenueCardProps {
    title: string;
    value: string;
    subtitle?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    icon: React.ReactNode;
    color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
    isLoading?: boolean;
}

const colorVariants = {
    blue: {
        gradient: 'from-blue-500 to-blue-600',
        bg: 'bg-blue-500/10',
        icon: 'text-blue-600',
        border: 'border-blue-200 dark:border-blue-800',
    },
    green: {
        gradient: 'from-green-500 to-green-600',
        bg: 'bg-green-500/10',
        icon: 'text-green-600',
        border: 'border-green-200 dark:border-green-800',
    },
    purple: {
        gradient: 'from-purple-500 to-purple-600',
        bg: 'bg-purple-500/10',
        icon: 'text-purple-600',
        border: 'border-purple-200 dark:border-purple-800',
    },
    orange: {
        gradient: 'from-orange-500 to-orange-600',
        bg: 'bg-orange-500/10',
        icon: 'text-orange-600',
        border: 'border-orange-200 dark:border-orange-800',
    },
    red: {
        gradient: 'from-red-500 to-red-600',
        bg: 'bg-red-500/10',
        icon: 'text-red-600',
        border: 'border-red-200 dark:border-red-800',
    },
};

const RevenueCard: React.FC<RevenueCardProps> = ({ title, value, subtitle, trend, trendValue, icon, color, isLoading = false }) => {
    const colors = colorVariants[color];

    if (isLoading) {
        return (
            <div className="panel border-0 shadow-xl animate-pulse">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-3 w-3/4"></div>
                        <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded mb-2 w-1/2"></div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
                    </div>
                    <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`panel border-0 shadow-xl hover:shadow-2xl transition-all duration-300 ${colors.border} bg-white dark:bg-slate-900`}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{title}</h3>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</div>
                    {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
                    {trend && trendValue && (
                        <div className="flex items-center mt-2">
                            {trend === 'up' ? <IconTrendingUp className="w-4 h-4 text-green-500" /> : trend === 'down' ? <IconTrendingDown className="w-4 h-4 text-red-500" /> : null}
                            <span className={`text-xs font-medium ml-1 ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500'}`}>{trendValue}</span>
                        </div>
                    )}
                </div>
                <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
                    <div className={`w-8 h-8 flex items-center justify-center ${colors.icon}`}>{icon}</div>
                </div>
            </div>
        </motion.div>
    );
};

export default RevenueCard;
