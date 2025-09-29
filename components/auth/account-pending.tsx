'use client';
import { getTranslation } from '@/i18n';
import Link from 'next/link';
import IconMail from '@/components/icon/icon-mail';
import IconClock from '@/components/icon/icon-clock';
import IconLogout from '@/components/icon/icon-logout';
import { signOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';

const AccountPendingPage = () => {
    const { t } = getTranslation();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            <div className="max-w-lg w-full">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 text-center">
                    {/* Icon */}
                    <div className="w-24 h-24 mx-auto mb-6 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                        <IconClock className="w-12 h-12 text-orange-500" />
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{t('account_pending')}</h1>

                    {/* Message */}
                    <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">{t('account_inactive_message')}</p>

                    {/* Contact Information */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 mb-8">
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <IconMail className="w-5 h-5 text-blue-500" />
                            <span className="font-medium text-blue-700 dark:text-blue-300">{t('contact_admin_email')}</span>
                        </div>
                        <a href="mailto:admin@schooldash.com" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium transition-colors">
                            admin@schooldash.com
                        </a>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={handleSignOut}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
                    >
                        <IconLogout className="w-4 h-4" />
                        {t('sign_out')}
                    </button>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-500">{t('contact_admin_for_access')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountPendingPage;
