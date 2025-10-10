'use client';
import React, { useEffect, useState } from 'react';
import { getTranslation } from '@/i18n';
import { getCurrentUserWithRole } from '@/lib/auth';
import TripPlannerDashboard from '@/components/dashboards/trip-planner-dashboard';
import AdminDashboard from '@/components/dashboards/admin-dashboard';

const HomePage = () => {
    const { t } = getTranslation();
    const [dashboardView, setDashboardView] = useState<'admin' | 'trip-planner'>('admin');
    const [isAdminUser, setIsAdminUser] = useState(false);
    const [loading, setLoading] = useState(true);

    // Check if user is admin
    useEffect(() => {
        const checkUserRole = async () => {
            try {
                const { user, error } = await getCurrentUserWithRole();

                if (error || !user) {
                    console.log('No user found or error:', error);
                    setLoading(false);
                    return;
                }

                console.log('User data:', user);
                console.log('User role:', user.user_roles);

                if (user.user_roles?.name === 'admin') {
                    console.log('User is admin!');
                    setIsAdminUser(true);
                } else {
                    console.log('User is NOT admin. Role:', user.user_roles?.name);
                }
            } catch (error) {
                console.error('Error checking user role:', error);
            } finally {
                setLoading(false);
            }
        };

        checkUserRole();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Dashboard Switcher - Only show for admin users */}
            {isAdminUser && (
                <div className="z-40 bg-white dark:bg-[#0e1726] border-b border-gray-200 dark:border-gray-700 mb-6 rounded-lg shadow-sm">
                    <div className="max-w-[1500px] mx-auto px-6 py-4">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{dashboardView === 'admin' ? t('admin_dashboard') : t('trip_planner_dashboard')}</h2>
                                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">{isAdminUser ? 'Admin' : 'User'}</span>
                            </div>

                            {/* Toggle Buttons */}
                            <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                                <button
                                    onClick={() => setDashboardView('admin')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                                        dashboardView === 'admin' ? 'bg-white dark:bg-gray-700 text-primary shadow-md' : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
                                    }`}
                                >
                                    {t('admin_dashboard')}
                                </button>
                                <button
                                    onClick={() => setDashboardView('trip-planner')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                                        dashboardView === 'trip-planner'
                                            ? 'bg-white dark:bg-gray-700 text-primary shadow-md'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
                                    }`}
                                >
                                    {t('trip_planner_dashboard')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Conditionally render dashboards */}
            {dashboardView === 'admin' && isAdminUser ? <AdminDashboard /> : <TripPlannerDashboard />}
        </div>
    );
};

export default HomePage;
