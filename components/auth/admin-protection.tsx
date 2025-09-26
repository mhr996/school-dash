'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUserWithRole } from '@/lib/auth';
import { getTranslation } from '@/i18n';
import Link from 'next/link';
import IconHome from '@/components/icon/icon-home';
import IconLockDots from '@/components/icon/icon-lock-dots';

interface AdminProtectionProps {
    children: React.ReactNode;
}

const AdminProtection: React.FC<AdminProtectionProps> = ({ children }) => {
    const { t } = getTranslation();
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAdminAccess = async () => {
            try {
                const { user, error } = await getCurrentUserWithRole();

                if (error || !user) {
                    // No user logged in, redirect to login
                    router.push('/auth/signin');
                    return;
                }

                const adminRole = user.user_roles?.name === 'admin';
                setIsAdmin(adminRole);

                // If not admin but logged in, they stay on the page but see access denied
                if (!adminRole) {
                    setIsLoading(false);
                }
            } catch (error) {
                console.error('Error checking admin access:', error);
                setIsAdmin(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAdminAccess();
    }, [router]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (isAdmin === false) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
                        {/* Icon */}
                        <div className="w-20 h-20 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                            <IconLockDots className="w-10 h-10 text-red-500" />
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{t('access_denied')}</h1>

                        {/* Message */}
                        <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">{t('admin_access_required')}</p>

                        {/* Action Button */}
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
                        >
                            <IconHome className="w-4 h-4" />
                            {t('return_to_dashboard')}
                        </Link>

                        {/* Footer */}
                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-500 dark:text-gray-500">{t('contact_admin_for_access')}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // User is admin, render the protected content
    return <>{children}</>;
};

export default AdminProtection;
