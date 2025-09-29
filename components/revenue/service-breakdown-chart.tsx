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

interface ServiceBreakdownData {
    serviceType: string;
    revenue: number;
    count: number;
    percentage: number;
}

interface ServiceBreakdownChartProps {
    data: ServiceBreakdownData[];
    isLoading?: boolean;
}

const ServiceBreakdownChart: React.FC<ServiceBreakdownChartProps> = ({ data, isLoading = false }) => {
    const { t } = getTranslation();
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);

    const getServiceIcon = (serviceType: string) => {
        const icons = {
            guides: '👨‍🏫',
            paramedics: '🏥',
            security_companies: '🛡️',
            external_entertainment_companies: '🎭',
        };
        return icons[serviceType as keyof typeof icons] || '📋';
    };

    const getServiceLabel = (serviceType: string) => {
        const labels = {
            guides: 'Guides',
            paramedics: 'Paramedics',
            security_companies: 'Security',
            external_entertainment_companies: 'Entertainment',
        };
        return labels[serviceType as keyof typeof labels] || serviceType;
    };

    const chartOptions = {
        chart: {
            type: 'donut' as const,
            height: 300,
        },
        colors: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
        labels: data.map((item) => getServiceLabel(item.serviceType)),
        dataLabels: {
            enabled: true,
            formatter: (val: number) => `${val.toFixed(1)}%`,
            style: {
                fontSize: '12px',
                fontWeight: 'bold',
                colors: ['#fff'],
            },
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '60%',
                    labels: {
                        show: true,
                        name: {
                            show: true,
                            fontSize: '16px',
                            offsetY: -10,
                            color: isDark ? '#9CA3AF' : '#374151',
                        },
                        value: {
                            show: true,
                            fontSize: '24px',
                            fontWeight: 'bold',
                            color: isDark ? '#F3F4F6' : '#111827',
                            offsetY: 16,
                            formatter: (val: string) => `$${parseInt(val).toLocaleString()}`,
                        },
                        total: {
                            show: true,
                            showAlways: false,
                            label: 'Total Revenue',
                            fontSize: '14px',
                            color: isDark ? '#9CA3AF' : '#6B7280',
                            formatter: function (w: any) {
                                const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                                return `$${total.toLocaleString()}`;
                            },
                        },
                    },
                },
            },
        },
        legend: {
            position: 'bottom' as const,
            horizontalAlign: 'center' as const,
            fontSize: '14px',
            labels: {
                colors: isDark ? '#9CA3AF' : '#6B7280',
            },
            markers: {
                size: 6,
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
                breakpoint: 480,
                options: {
                    chart: {
                        width: 200,
                    },
                    legend: {
                        position: 'bottom' as const,
                    },
                },
            },
        ],
    };

    const series = data.map((item) => item.revenue);

    if (isLoading) {
        return (
            <div className="panel">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded mb-6 w-1/2"></div>
                    <div className="h-[300px] bg-gray-300 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8 }} className="panel">
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('revenue_by_service')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('service_breakdown')}</p>
            </div>

            {data.length > 0 ? (
                <>
                    <ReactApexChart options={chartOptions} series={series} type="donut" height={300} />

                    {/* Service Details */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.map((item, index) => (
                            <motion.div
                                key={item.serviceType}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg"
                            >
                                <div className="flex items-center space-x-3">
                                    <span className="text-2xl">{getServiceIcon(item.serviceType)}</span>
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white">{getServiceLabel(item.serviceType)}</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {item.count} booking{item.count !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold text-gray-900 dark:text-white">${item.revenue.toLocaleString()}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">{item.percentage.toFixed(1)}%</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="h-[300px] flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-gray-400 mb-4">📊</div>
                        <p className="text-gray-500 dark:text-gray-400">No service data available yet</p>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default ServiceBreakdownChart;
