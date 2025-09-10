'use client';
import IconUser from '@/components/icon/icon-user';
import IconMail from '@/components/icon/icon-mail';
import IconLockDots from '@/components/icon/icon-lock-dots';
import IconUserPlus from '@/components/icon/icon-user-plus';
import IconBuilding from '@/components/icon/icon-building';
import CustomSelect from '@/components/elements/custom-select';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { getTranslation } from '@/i18n';
import supabase from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface FormErrors {
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    role?: string;
    school?: string;
    general?: string;
}

interface UserRole {
    id: number;
    name: string;
    description: string;
}

interface School {
    id: string;
    name: string;
    code: string;
    type: string;
}

const ComponentsAuthSignupForm = () => {
    const { t } = getTranslation();
    const router = useRouter();

    // Form state
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedSchool, setSelectedSchool] = useState('');
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Data state
    const [userRoles, setUserRoles] = useState<UserRole[]>([]);
    const [schools, setSchools] = useState<School[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(false);
    const [loadingSchools, setLoadingSchools] = useState(false);

    // Determine if school selection is required
    const requiresSchool = selectedRole === 'school_manager' || selectedRole === 'trip_planner';

    useEffect(() => {
        fetchUserRoles();
    }, []);

    useEffect(() => {
        if (requiresSchool) {
            fetchSchools();
        } else {
            setSelectedSchool('');
        }
    }, [requiresSchool]);

    const fetchUserRoles = async () => {
        setLoadingRoles(true);
        try {
            const { data, error } = await supabase.from('user_roles').select('*').in('name', ['employee', 'school_manager', 'trip_planner']).order('name');

            if (error) throw error;
            setUserRoles(data || []);
        } catch (error) {
            console.error('Error fetching user roles:', error);
        } finally {
            setLoadingRoles(false);
        }
    };

    const fetchSchools = async () => {
        setLoadingSchools(true);
        try {
            const { data, error } = await supabase.from('schools').select('id, name, code, type').eq('status', 'active').order('name');

            if (error) throw error;
            setSchools(data || []);
        } catch (error) {
            console.error('Error fetching schools:', error);
        } finally {
            setLoadingSchools(false);
        }
    };

    const validateForm = () => {
        const newErrors: FormErrors = {};

        // Full name validation
        if (!fullName.trim()) {
            newErrors.fullName = t('full_name_required');
        } else if (fullName.trim().length < 2) {
            newErrors.fullName = t('full_name_too_short');
        }

        // Email validation - enhanced
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const sanitizedEmail = email.trim().toLowerCase();
        if (!email.trim()) {
            newErrors.email = t('email_required');
        } else if (!emailRegex.test(sanitizedEmail)) {
            newErrors.email = t('invalid_email');
        } else if (sanitizedEmail.length > 254) {
            // RFC 5321 limit
            newErrors.email = t('invalid_email_format');
        }

        // Password validation
        if (!password) {
            newErrors.password = t('password_required');
        } else if (password.length < 6) {
            newErrors.password = t('password_too_short');
        }

        // Confirm password validation
        if (!confirmPassword) {
            newErrors.confirmPassword = t('confirm_password_required');
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = t('passwords_dont_match');
        }

        // Role validation
        if (!selectedRole) {
            newErrors.role = t('role_required');
        }

        // School validation (if required)
        if (requiresSchool && !selectedSchool) {
            newErrors.school = t('school_required');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Parse and localize error messages
    const parseSignupError = (error: any): string => {
        const errorMessage = error?.message || '';
        const errorCode = error?.code || '';

        // Supabase Auth error codes
        if (errorCode === 'email_address_invalid') {
            return t('invalid_email_format');
        }

        if (errorCode === 'weak_password') {
            return t('weak_password');
        }

        if (errorCode === 'signup_disabled') {
            return t('signup_rate_limit');
        }

        // Supabase Auth error messages
        if (errorMessage.includes('User already registered')) {
            return t('email_already_registered');
        }

        if (errorMessage.includes('Password should be at least 6 characters')) {
            return t('weak_password');
        }

        if (errorMessage.includes('Invalid email') || (errorMessage.includes('email address') && errorMessage.includes('invalid'))) {
            return t('invalid_email_format');
        }

        if (errorMessage.includes('Too many requests')) {
            return t('signup_rate_limit');
        }

        // Database constraint errors
        if (errorMessage.includes('duplicate key value violates unique constraint')) {
            if (errorMessage.includes('users_pkey') || errorMessage.includes('users_email_key')) {
                return t('email_already_registered');
            }
        }

        // Network errors
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
            return t('network_signup_error');
        }

        // Default fallback - show the actual error for debugging if it's not recognized
        console.error('Unhandled signup error:', { code: errorCode, message: errorMessage });
        return t('signup_failed');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setErrors({});

        try {
            // Sanitize and validate email
            const sanitizedEmail = email.trim().toLowerCase();
            console.log('Attempting signup with email:', sanitizedEmail);

            // 1. Create Supabase auth user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: sanitizedEmail,
                password: password,
                options: {
                    data: {
                        full_name: fullName.trim(),
                    },
                },
            });

            if (authError) {
                console.error('Supabase auth error:', authError);
                throw authError; // Pass the full error object with code
            }

            if (!authData.user) {
                throw new Error(t('signup_failed'));
            }

            // 2. Get role_id
            const selectedRoleData = userRoles.find((role) => role.name === selectedRole);
            if (!selectedRoleData) {
                throw new Error(t('invalid_role'));
            }

            // 3. Create user record in users table
            const userData = {
                id: authData.user.id,
                email: sanitizedEmail,
                full_name: fullName.trim(),
                role_id: selectedRoleData.id,
                school_id: requiresSchool ? selectedSchool : null,
                is_active: true,
                auth_user_id: authData.user.id,
            };

            const { error: userError } = await supabase.from('users').insert([userData]);

            if (userError) {
                // If user creation fails, we should clean up the auth user
                await supabase.auth.signOut();
                console.error('User creation error:', userError);
                throw new Error(userError.message);
            }

            // Success! Account created - redirect to login with success message
            router.push('/login?message=account_created_successfully');
        } catch (error: any) {
            console.error('Signup error:', error);
            const localizedError = parseSignupError(error);
            setErrors({ general: localizedError });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 dark:text-white">
            {/* General Error Alert */}
            {errors.general && <div className="text-red-500 bg-red-100 dark:bg-red-900/30 dark:text-red-400 p-3 rounded-md mb-4">{errors.general}</div>}

            {/* Name and Email Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name Field */}
                <div>
                    <label htmlFor="fullName">{t('full_name')}</label>
                    <div className="relative text-white-dark">
                        <input
                            id="fullName"
                            type="text"
                            placeholder={t('enter_full_name')}
                            className={`form-input rounded-3xl py-3 ps-10 placeholder:text-white-dark ${errors.fullName ? 'border-red-500' : ''}`}
                            value={fullName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                        />
                        <span className="absolute start-4 top-1/2 -translate-y-1/2">
                            <IconUser fill={true} />
                        </span>
                    </div>
                    {errors.fullName && <span className="text-red-500 text-sm mt-1">{errors.fullName}</span>}
                </div>

                {/* Email Field */}
                <div>
                    <label htmlFor="email">{t('email')}</label>
                    <div className="relative text-white-dark">
                        <input
                            id="email"
                            type="email"
                            placeholder={t('enter_email')}
                            className={`form-input rounded-3xl py-3 ps-10 placeholder:text-white-dark ${errors.email ? 'border-red-500' : ''}`}
                            value={email}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                        />
                        <span className="absolute start-4 top-1/2 -translate-y-1/2">
                            <IconMail fill={true} />
                        </span>
                    </div>
                    {errors.email && <span className="text-red-500 text-sm mt-1">{errors.email}</span>}
                </div>
            </div>

            {/* Password Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Password Field */}
                <div>
                    <label htmlFor="password">{t('password')}</label>
                    <div className="relative text-white-dark">
                        <input
                            id="password"
                            type="password"
                            placeholder={t('enter_password')}
                            className={`form-input rounded-3xl py-3 ps-10 placeholder:text-white-dark ${errors.password ? 'border-red-500' : ''}`}
                            value={password}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        />
                        <span className="absolute start-4 top-1/2 -translate-y-1/2">
                            <IconLockDots fill={true} />
                        </span>
                    </div>
                    {errors.password && <span className="text-red-500 text-sm mt-1">{errors.password}</span>}
                </div>

                {/* Confirm Password Field */}
                <div>
                    <label htmlFor="confirmPassword">{t('confirm_password')}</label>
                    <div className="relative text-white-dark">
                        <input
                            id="confirmPassword"
                            type="password"
                            placeholder={t('confirm_your_password')}
                            className={`form-input rounded-3xl py-3 ps-10 placeholder:text-white-dark ${errors.confirmPassword ? 'border-red-500' : ''}`}
                            value={confirmPassword}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                        />
                        <span className="absolute start-4 top-1/2 -translate-y-1/2">
                            <IconLockDots fill={true} />
                        </span>
                    </div>
                    {errors.confirmPassword && <span className="text-red-500 text-sm mt-1">{errors.confirmPassword}</span>}
                </div>
            </div>

            {/* Role Selection */}
            <div>
                <label className="block mb-2">{t('select_your_role')}</label>
                <div className="grid gap-2">
                    {loadingRoles ? (
                        <div className="text-center text-white-dark py-4">{t('loading_roles')}</div>
                    ) : (
                        userRoles.map((role) => (
                            <label
                                key={role.id}
                                className={`block cursor-pointer rounded-2xl border-2 p-3 transition-all duration-200 ${
                                    selectedRole === role.name
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-white-light bg-white/10 hover:border-primary/50 dark:border-white-dark dark:bg-dark/20'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="role"
                                    value={role.name}
                                    checked={selectedRole === role.name}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedRole(e.target.value)}
                                    className="sr-only"
                                />
                                <div className="flex items-center gap-2">
                                    <IconUserPlus className="mr-3 h-4 w-4 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <div className="font-semibold text-sm">{t(`role_${role.name}`)}</div>
                                    </div>
                                </div>
                            </label>
                        ))
                    )}
                </div>
                {errors.role && <span className="text-red-500 text-sm mt-1">{errors.role}</span>}
            </div>

            {/* School Selection (conditional) */}
            <AnimatePresence>
                {requiresSchool && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <label htmlFor="school">{t('select_school')}</label>
                        <CustomSelect
                            id="school"
                            placeholder={loadingSchools ? t('loading_schools') : t('choose_school')}
                            value={selectedSchool}
                            disabled={loadingSchools}
                            error={!!errors.school}
                            className={`rounded-3xl ${errors.school ? 'border-red-500' : ''}`}
                            options={schools.map((school) => ({
                                value: school.id,
                                label: school.code ? `${school.code} - ${school.name} (${school.type})` : `${school.name} (${school.type})`,
                                icon: <IconBuilding className="h-4 w-4" />,
                            }))}
                            onChange={(value) => setSelectedSchool(value as string)}
                        />
                        {errors.school && <span className="text-red-500 text-sm mt-1">{errors.school}</span>}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Submit Button */}
            <button type="submit" className="btn btn-gradient rounded-3xl py-3 !mt-6 w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)]" disabled={isSubmitting}>
                {isSubmitting ? (
                    <span className="flex items-center justify-center">
                        <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t('creating_account')}
                    </span>
                ) : (
                    t('sign_up')
                )}
            </button>
        </form>
    );
};

export default ComponentsAuthSignupForm;
