'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { IRootState } from '@/store';
import { getTranslation } from '@/i18n';

// Dynamically import chart to avoid SSR issues
const ReactApexChart = dynamic(() => import('react-apexcharts'), {
    ssr: false,
    loading: () => (
        <div className="h-[300px] flex items-center justify-center animate-pulse bg-gray-200 dark:bg-gray-700 rounded">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 animate-pulse"></div>
        </div>
    ),
});

interface RevenueChartData {
    month: string;
    revenue: number;
    payments: number;
}

interface RevenueChartProps {
    data: RevenueChartData[];
    isLoading?: boolean;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data, isLoading = false }) => {
    const { t } = getTranslation();
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);
    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass === 'rtl');

    const chartOptions = {
        chart: {
            type: 'area' as const,
            height: 300,
            zoom: {
                enabled: false,
            },
            toolbar: {
                show: false,
            },
            background: 'transparent',
        },
        colors: ['#4F46E5', '#10B981'],
        dataLabels: {
            enabled: false,
        },
        stroke: {
            curve: 'smooth' as const,
            width: 3,
        },
        grid: {
            borderColor: isDark ? '#404040' : '#E5E7EB',
            strokeDashArray: 3,
        },
        xaxis: {
            categories: data.map((item) => item.month),
            labels: {
                style: {
                    colors: isDark ? '#9CA3AF' : '#6B7280',
                    fontSize: '12px',
                },
            },
            axisBorder: {
                show: true,
                color: isDark ? '#374151' : '#E5E7EB',
            },
        },
        yaxis: {
            opposite: isRtl,
            labels: {
                style: {
                    colors: isDark ? '#9CA3AF' : '#6B7280',
                    fontSize: '12px',
                },
                formatter: (value: number) => `$${value.toLocaleString()}`,
            },
        },
        fill: {
            type: 'gradient',
            gradient: {
                shade: isDark ? 'dark' : 'light',
                type: 'vertical',
                shadeIntensity: 0.3,
                gradientToColors: ['#818CF8', '#34D399'],
                inverseColors: false,
                opacityFrom: 0.8,
                opacityTo: 0.1,
                stops: [0, 100],
            },
        },
        legend: {
            position: 'top' as const,
            horizontalAlign: 'right' as const,
            labels: {
                colors: isDark ? '#9CA3AF' : '#6B7280',
            },
        },
        tooltip: {
            theme: isDark ? 'dark' : 'light',
            y: {
                formatter: (value: number) => `$${value.toLocaleString()}`,
            },
        },
        responsive: [
            {
                breakpoint: 768,
                options: {
                    legend: {
                        position: 'bottom' as const,
                    },
                },
            },
        ],
    };

    const series = [
        {
            name: 'Revenue Earned',
            data: data.map((item) => item.revenue),
        },
        {
            name: 'Payments Received',
            data: data.map((item) => item.payments),
        },
    ];

    if (isLoading) {
        return (
            <div className="panel">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded mb-6 w-1/3"></div>
                    <div className="h-[300px] bg-gray-300 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7 }} className="panel">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('revenue_trends')}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('monthly_revenue')} vs {t('payments_received_chart')}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">Revenue</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">Payments</span>
                    </div>
                </div>
            </div>

            {data.length > 0 ? (
                <ReactApexChart options={chartOptions} series={series} type="area" height={300} />
            ) : (
                <div className="h-[300px] flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-gray-400 mb-4">📈</div>
                        <p className="text-gray-500 dark:text-gray-400">No revenue data available yet</p>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default RevenueChart;
