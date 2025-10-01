'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getTranslation } from '@/i18n';
import supabase from '@/lib/supabase';
import { getCurrentUserWithRole } from '@/lib/auth';
import IconUser from '@/components/icon/icon-user';
import IconMail from '@/components/icon/icon-mail';
import IconPhone from '@/components/icon/icon-phone';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconCalendar from '@/components/icon/icon-calendar';
import IconSettings from '@/components/icon/icon-settings';
import IconEdit from '@/components/icon/icon-edit';
import IconSave from '@/components/icon/icon-save';
import IconEye from '@/components/icon/icon-eye';
import IconLock from '@/components/icon/icon-lock';
import IconHome from '@/components/icon/icon-home';
import IconChecks from '@/components/icon/icon-checks';
import IconDollarSign from '@/components/icon/icon-dollar-sign';

type UserProfile = {
    id: string;
    email: string;
    phone: string | null;
    full_name: string | null;
    birth_date: string | null;
    address: string | null;
    avatar_url: string | null;
    last_login_at: string | null;
    is_active: boolean;
    role_id: number;
    school_id: string | null;
    user_roles?: {
        name: string;
        description: string;
    };
    schools?: {
        name: string;
        address: string;
    };
};

type PasswordChange = {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
};

export default function ProfilePage() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [t, setT] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');
    const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
    const [passwordChange, setPasswordChange] = useState<PasswordChange>({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [preferences, setPreferences] = useState({
        language: 'en',
        theme: 'system',
        notifications: {
            email: true,
            sms: false,
            trip_updates: true,
            payment_reminders: true,
        },
    });

    useEffect(() => {
        const loadTranslations = async () => {
            const translations = await getTranslation();
            setT(translations);
        };
        loadTranslations();
    }, []);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const { user: userData, error } = await getCurrentUserWithRole();
                if (userData && !error) {
                    setUser(userData);
                    setEditedProfile(userData);
                }
            } catch (error) {
                console.error('Error loading user:', error);
            } finally {
                setLoading(false);
            }
        };
        loadUser();
    }, []);

    const handleSaveProfile = async () => {
        if (!user?.id) return;

        try {
            setSaving(true);
            const { error } = await supabase
                .from('users')
                .update({
                    full_name: editedProfile.full_name,
                    phone: editedProfile.phone,
                    birth_date: editedProfile.birth_date,
                    address: editedProfile.address,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (error) throw error;

            setUser({ ...user, ...editedProfile });
            setIsEditing(false);
            // TODO: Show success message
        } catch (error) {
            console.error('Error updating profile:', error);
            // TODO: Show error message
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordChange.newPassword !== passwordChange.confirmPassword) {
            // TODO: Show error message
            return;
        }

        try {
            setSaving(true);
            // Update password using Supabase auth
            const { error } = await supabase.auth.updateUser({
                password: passwordChange.newPassword,
            });

            if (error) throw error;

            setPasswordChange({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
            // TODO: Show success message
        } catch (error) {
            console.error('Error changing password:', error);
            // TODO: Show error message
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return t.not_set || 'Not set';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatLastLogin = (dateString: string | null) => {
        if (!dateString) return t.never || 'Never';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.3,
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.5 },
        },
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50 dark:from-slate-900 dark:via-purple-950 dark:to-slate-900">
                <div className="relative">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-t-4 border-purple-600"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <IconUser className="w-12 h-12 text-purple-600 animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50 dark:from-slate-900 dark:via-purple-950 dark:to-slate-900">
                <div className="text-center bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-purple-200/50 dark:border-purple-500/30">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t.profile_not_found || 'Profile Not Found'}</h2>
                    <p className="text-gray-600 dark:text-gray-400">{t.profile_not_found_description || 'Unable to load your profile information.'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50 dark:from-slate-900 dark:via-purple-950 dark:to-slate-900 p-6">
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <motion.div variants={itemVariants} className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 p-8 shadow-2xl">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="relative z-10 text-center">
                        <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-2">{t.my_profile || 'My Profile'}</h1>
                        <p className="text-white/90 text-lg drop-shadow-md">{t.profile_description || 'Manage your account settings and preferences'}</p>
                    </div>
                </motion.div>

                {/* Profile Header Card */}
                <motion.div variants={itemVariants} className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-purple-200/50 dark:border-purple-500/30 p-8 shadow-xl">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-28 h-28 bg-gradient-to-br from-purple-500 via-violet-500 to-fuchsia-600 rounded-3xl flex items-center justify-center shadow-lg">
                                {user.avatar_url ? (
                                    <img src={user.avatar_url} alt={user.full_name || user.email} className="w-full h-full rounded-3xl object-cover" />
                                ) : (
                                    <IconUser className="w-14 h-14 text-white" />
                                )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center shadow-lg">
                                <IconChecks className="w-4 h-4 text-white" />
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent mb-2">{user.full_name || user.email}</h2>
                            <div className="flex flex-col md:flex-row gap-4 text-sm">
                                <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600 dark:text-gray-400">
                                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                        <IconChecks className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <span className="font-medium">{user.user_roles?.name || t.no_role || 'No role'}</span>
                                </div>
                                {user.schools && (
                                    <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600 dark:text-gray-400">
                                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                            <IconHome className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <span className="font-medium">{user.schools.name}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg ${
                                user.is_active ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' : 'bg-gradient-to-r from-red-500 to-rose-600 text-white'
                            }`}
                        >
                            {user.is_active ? t.active || 'Active' : t.inactive || 'Inactive'}
                        </div>
                    </div>
                </motion.div>

                {/* Tab Navigation */}
                <motion.div variants={itemVariants} className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-purple-200/50 dark:border-purple-500/30 p-2 shadow-xl">
                    <div className="flex space-x-2">
                        {[
                            { id: 'profile', label: t.profile_info || 'Profile Info', icon: IconUser },
                            { id: 'security', label: t.security || 'Security', icon: IconLock },
                            { id: 'preferences', label: t.preferences || 'Preferences', icon: IconSettings },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-medium transition-all duration-300 ${
                                    activeTab === tab.id
                                        ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-500/50'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-900/20'
                                }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Tab Content */}
                <motion.div variants={itemVariants} className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-purple-200/50 dark:border-purple-500/30 p-8 shadow-xl">
                    {activeTab === 'profile' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                                    {t.personal_information || 'Personal Information'}
                                </h3>
                                <button
                                    onClick={() => (isEditing ? handleSaveProfile() : setIsEditing(true))}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                                >
                                    {saving ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : isEditing ? (
                                        <IconSave className="w-4 h-4" />
                                    ) : (
                                        <IconEdit className="w-4 h-4" />
                                    )}
                                    {saving ? t.saving || 'Saving...' : isEditing ? t.save || 'Save' : t.edit || 'Edit'}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Full Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.full_name || 'Full Name'}</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedProfile.full_name || ''}
                                            onChange={(e) => setEditedProfile({ ...editedProfile, full_name: e.target.value })}
                                            className="w-full px-4 py-3 bg-white/80 dark:bg-gray-700/80 border border-purple-200/50 dark:border-purple-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 text-gray-900 dark:text-white"
                                            placeholder={t.enter_full_name || 'Enter your full name'}
                                        />
                                    ) : (
                                        <div className="flex items-center gap-3 px-4 py-3 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl border border-purple-200/30 dark:border-purple-700/30">
                                            <IconUser className="w-4 h-4 text-purple-500" />
                                            <span className="text-gray-900 dark:text-white">{user.full_name || t.not_set || 'Not set'}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Email (read-only) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.email || 'Email'}</label>
                                    <div className="flex items-center gap-3 px-4 py-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-200/30 dark:border-blue-700/30">
                                        <IconMail className="w-4 h-4 text-blue-500" />
                                        <span className="text-gray-900 dark:text-white">{user.email}</span>
                                    </div>
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.phone || 'Phone'}</label>
                                    {isEditing ? (
                                        <input
                                            type="tel"
                                            value={editedProfile.phone || ''}
                                            onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                                            className="w-full px-4 py-3 bg-white/80 dark:bg-gray-700/80 border border-purple-200/50 dark:border-purple-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 text-gray-900 dark:text-white"
                                            placeholder={t.enter_phone || 'Enter your phone number'}
                                        />
                                    ) : (
                                        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200/30 dark:border-emerald-700/30">
                                            <IconPhone className="w-4 h-4 text-emerald-500" />
                                            <span className="text-gray-900 dark:text-white">{user.phone || t.not_set || 'Not set'}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Birth Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.birth_date || 'Birth Date'}</label>
                                    {isEditing ? (
                                        <input
                                            type="date"
                                            value={editedProfile.birth_date || ''}
                                            onChange={(e) => setEditedProfile({ ...editedProfile, birth_date: e.target.value })}
                                            className="w-full px-4 py-3 bg-white/80 dark:bg-gray-700/80 border border-purple-200/50 dark:border-purple-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 text-gray-900 dark:text-white"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-3 px-4 py-3 bg-violet-50/50 dark:bg-violet-900/20 rounded-xl border border-violet-200/30 dark:border-violet-700/30">
                                            <IconCalendar className="w-4 h-4 text-violet-500" />
                                            <span className="text-gray-900 dark:text-white">{formatDate(user.birth_date)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Address */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.address || 'Address'}</label>
                                    {isEditing ? (
                                        <textarea
                                            value={editedProfile.address || ''}
                                            onChange={(e) => setEditedProfile({ ...editedProfile, address: e.target.value })}
                                            rows={3}
                                            className="w-full px-4 py-3 bg-white/80 dark:bg-gray-700/80 border border-purple-200/50 dark:border-purple-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 text-gray-900 dark:text-white"
                                            placeholder={t.enter_address || 'Enter your address'}
                                        />
                                    ) : (
                                        <div className="flex items-start gap-3 px-4 py-3 bg-fuchsia-50/50 dark:bg-fuchsia-900/20 rounded-xl border border-fuchsia-200/30 dark:border-fuchsia-700/30">
                                            <IconMapPin className="w-4 h-4 text-fuchsia-500 mt-1" />
                                            <span className="text-gray-900 dark:text-white">{user.address || t.not_set || 'Not set'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
                                    <IconLock className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">{t.change_password || 'Change Password'}</h3>
                            </div>

                            <div className="space-y-4">
                                {/* Current Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.current_password || 'Current Password'}</label>
                                    <div className="relative group">
                                        <input
                                            type={showPasswords.current ? 'text' : 'password'}
                                            value={passwordChange.currentPassword}
                                            onChange={(e) => setPasswordChange({ ...passwordChange, currentPassword: e.target.value })}
                                            className="w-full px-4 py-3 pr-12 bg-white/80 dark:bg-gray-700/80 border border-purple-200/50 dark:border-purple-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 text-gray-900 dark:text-white"
                                            placeholder={t.enter_current_password || 'Enter your current password'}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                                        >
                                            <IconEye className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* New Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.new_password || 'New Password'}</label>
                                    <div className="relative group">
                                        <input
                                            type={showPasswords.new ? 'text' : 'password'}
                                            value={passwordChange.newPassword}
                                            onChange={(e) => setPasswordChange({ ...passwordChange, newPassword: e.target.value })}
                                            className="w-full px-4 py-3 pr-12 bg-white/80 dark:bg-gray-700/80 border border-purple-200/50 dark:border-purple-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 text-gray-900 dark:text-white"
                                            placeholder={t.enter_new_password || 'Enter your new password'}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                                        >
                                            <IconEye className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.confirm_password || 'Confirm Password'}</label>
                                    <div className="relative group">
                                        <input
                                            type={showPasswords.confirm ? 'text' : 'password'}
                                            value={passwordChange.confirmPassword}
                                            onChange={(e) => setPasswordChange({ ...passwordChange, confirmPassword: e.target.value })}
                                            className="w-full px-4 py-3 pr-12 bg-white/80 dark:bg-gray-700/80 border border-purple-200/50 dark:border-purple-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 text-gray-900 dark:text-white"
                                            placeholder={t.confirm_new_password || 'Confirm your new password'}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                                        >
                                            <IconEye className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Change Password Button */}
                                <button
                                    onClick={handleChangePassword}
                                    disabled={saving || !passwordChange.currentPassword || !passwordChange.newPassword || !passwordChange.confirmPassword}
                                    className="w-full px-6 py-3.5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? t.changing_password || 'Changing Password...' : t.change_password || 'Change Password'}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'preferences' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
                                    <IconSettings className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">{t.account_preferences || 'Account Preferences'}</h3>
                            </div>

                            <div className="space-y-6">
                                {/* Notification Preferences */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">{t.notification_preferences || 'Notification Preferences'}</label>
                                    <div className="space-y-3">
                                        {[
                                            { key: 'email', label: t.email_notifications || 'Email Notifications', icon: IconMail, color: 'blue' },
                                            { key: 'sms', label: t.sms_notifications || 'SMS Notifications', icon: IconPhone, color: 'emerald' },
                                            { key: 'trip_updates', label: t.trip_update_notifications || 'Trip Update Notifications', icon: IconCalendar, color: 'violet' },
                                            { key: 'payment_reminders', label: t.payment_reminder_notifications || 'Payment Reminder Notifications', icon: IconDollarSign, color: 'amber' },
                                        ].map((notification) => (
                                            <div
                                                key={notification.key}
                                                className={`flex items-center justify-between p-4 bg-gradient-to-br from-white/60 to-${notification.color}-50/60 dark:from-gray-800/60 dark:to-${notification.color}-900/20 backdrop-blur-xl rounded-xl border border-${notification.color}-200/50 dark:border-${notification.color}-500/30 shadow-lg hover:shadow-xl transition-all duration-200`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-10 h-10 bg-gradient-to-br from-${notification.color}-500 to-${notification.color}-600 rounded-xl flex items-center justify-center shadow-md`}
                                                    >
                                                        <notification.icon className="w-5 h-5 text-white" />
                                                    </div>
                                                    <span className="text-gray-900 dark:text-white font-medium">{notification.label}</span>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={preferences.notifications[notification.key as keyof typeof preferences.notifications]}
                                                        onChange={(e) =>
                                                            setPreferences({
                                                                ...preferences,
                                                                notifications: {
                                                                    ...preferences.notifications,
                                                                    [notification.key]: e.target.checked,
                                                                },
                                                            })
                                                        }
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-purple-600 peer-checked:to-violet-600"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Save Preferences Button */}
                                <button
                                    onClick={() => {
                                        // TODO: Save preferences
                                        console.log('Saving preferences:', preferences);
                                    }}
                                    className="w-full px-6 py-3.5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                    {t.save_preferences || 'Save Preferences'}
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </div>
    );
}
