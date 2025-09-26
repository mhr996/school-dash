'use client';
import IconUser from '@/components/icon/icon-user';
import IconMail from '@/components/icon/icon-mail';
import IconLockDots from '@/components/icon/icon-lock-dots';
import IconUserPlus from '@/components/icon/icon-user-plus';
import IconBuilding from '@/components/icon/icon-building';
import IconEye from '@/components/icon/icon-eye';
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
    // Service provider error fields
    guideYearsOfExperience?: string;
    guideIdentityNumber?: string;
    paramedicPhone?: string;
    paramedicIdentityNumber?: string;
    securityCompanyPhone?: string;
    securityCompanyTaxNumber?: string;
    securityCompanyAddress?: string;
    entertainmentCompanyPhone?: string;
    entertainmentCompanyAddress?: string;
    entertainmentCompanyDescription?: string;
    travelCompanyCode?: string;
    travelCompanyPhone?: string;
    travelCompanyEmail?: string;
    travelCompanyAddress?: string;
    travelCompanyDescription?: string;
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

    // Password visibility toggles
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Service provider form fields
    const [serviceData, setServiceData] = useState({
        // Guide fields
        guideYearsOfExperience: '',
        guideIdentityNumber: '',

        // Paramedic fields
        paramedicPhone: '',
        paramedicIdentityNumber: '',

        // Security company fields
        securityCompanyPhone: '',
        securityCompanyTaxNumber: '',
        securityCompanyAddress: '',

        // Entertainment company fields
        entertainmentCompanyPhone: '',
        entertainmentCompanyAddress: '',
        entertainmentCompanyDescription: '',

        // Travel company fields
        travelCompanyCode: '',
        travelCompanyPhone: '',
        travelCompanyEmail: '',
        travelCompanyAddress: '',
        travelCompanyDescription: '',
    });

    // Data state
    const [userRoles, setUserRoles] = useState<UserRole[]>([]);
    const [schools, setSchools] = useState<School[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(false);
    const [loadingSchools, setLoadingSchools] = useState(false);

    // Determine if school selection is required
    const requiresSchool = selectedRole === 'school_manager' || selectedRole === 'trip_planner';

    // Determine if service provider fields are required
    const serviceProviderRoles = ['guide', 'paramedic', 'security_company', 'entertainment_company', 'travel_company'];
    const isServiceProvider = serviceProviderRoles.includes(selectedRole);

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
            const { data, error } = await supabase
                .from('user_roles')
                .select('*')
                .in('name', ['employee', 'school_manager', 'trip_planner', 'guide', 'paramedic', 'security_company', 'entertainment_company', 'travel_company'])
                .order('name');

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

        // Service provider field validation
        if (isServiceProvider) {
            switch (selectedRole) {
                case 'guide':
                    if (!serviceData.guideIdentityNumber.trim()) {
                        newErrors.guideIdentityNumber = t('identity_number_required');
                    }
                    if (!serviceData.guideYearsOfExperience) {
                        newErrors.guideYearsOfExperience = t('years_of_experience_required');
                    } else if (parseInt(serviceData.guideYearsOfExperience) < 0) {
                        newErrors.guideYearsOfExperience = t('years_of_experience_invalid');
                    }
                    break;

                case 'paramedic':
                    if (!serviceData.paramedicIdentityNumber.trim()) {
                        newErrors.paramedicIdentityNumber = t('identity_number_required');
                    }
                    if (!serviceData.paramedicPhone.trim()) {
                        newErrors.paramedicPhone = t('phone_number_required');
                    } else if (!/^\+?[\d\s\-\(\)]+$/.test(serviceData.paramedicPhone)) {
                        newErrors.paramedicPhone = t('invalid_phone_number');
                    }
                    break;

                case 'security_company':
                    if (!serviceData.securityCompanyPhone.trim()) {
                        newErrors.securityCompanyPhone = t('phone_number_required');
                    } else if (!/^\+?[\d\s\-\(\)]+$/.test(serviceData.securityCompanyPhone)) {
                        newErrors.securityCompanyPhone = t('invalid_phone_number');
                    }
                    break;

                case 'entertainment_company':
                    if (!serviceData.entertainmentCompanyPhone.trim()) {
                        newErrors.entertainmentCompanyPhone = t('phone_number_required');
                    } else if (!/^\+?[\d\s\-\(\)]+$/.test(serviceData.entertainmentCompanyPhone)) {
                        newErrors.entertainmentCompanyPhone = t('invalid_phone_number');
                    }
                    break;

                case 'travel_company':
                    if (!serviceData.travelCompanyCode.trim()) {
                        newErrors.travelCompanyCode = t('company_code_required');
                    }
                    if (!serviceData.travelCompanyPhone.trim()) {
                        newErrors.travelCompanyPhone = t('phone_number_required');
                    } else if (!/^\+?[\d\s\-\(\)]+$/.test(serviceData.travelCompanyPhone)) {
                        newErrors.travelCompanyPhone = t('invalid_phone_number');
                    }
                    if (serviceData.travelCompanyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(serviceData.travelCompanyEmail)) {
                        newErrors.travelCompanyEmail = t('invalid_email');
                    }
                    break;
            }
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
                is_active: !isServiceProvider, // Service providers start inactive and need admin approval
                auth_user_id: authData.user.id,
            };

            const { error: userError } = await supabase.from('users').insert([userData]);

            if (userError) {
                // If user creation fails, we should clean up the auth user
                await supabase.auth.signOut();
                console.error('User creation error:', userError);
                throw new Error(userError.message);
            }

            // 4. Create service provider record if applicable
            if (isServiceProvider) {
                let serviceError = null;

                try {
                    switch (selectedRole) {
                        case 'guide':
                            const { error: guideError } = await supabase.from('guides').insert([
                                {
                                    user_id: authData.user.id,
                                    name: fullName.trim(),
                                    identity_number: serviceData.guideIdentityNumber,
                                },
                            ]);
                            serviceError = guideError;
                            break;

                        case 'paramedic':
                            const { error: paramedicError } = await supabase.from('paramedics').insert([
                                {
                                    user_id: authData.user.id,
                                    name: fullName.trim(),
                                    phone: serviceData.paramedicPhone,
                                    identity_number: serviceData.paramedicIdentityNumber,
                                },
                            ]);
                            serviceError = paramedicError;
                            break;

                        case 'security_company':
                            const { error: securityError } = await supabase.from('security_companies').insert([
                                {
                                    user_id: authData.user.id,
                                    name: fullName.trim(),
                                    phone: serviceData.securityCompanyPhone,
                                    tax_number: serviceData.securityCompanyTaxNumber || null,
                                    address: serviceData.securityCompanyAddress || null,
                                },
                            ]);
                            serviceError = securityError;
                            break;

                        case 'entertainment_company':
                            const { error: entertainmentError } = await supabase.from('external_entertainment_companies').insert([
                                {
                                    user_id: authData.user.id,
                                    name: fullName.trim(),
                                    description: serviceData.entertainmentCompanyDescription || null,
                                },
                            ]);
                            serviceError = entertainmentError;
                            break;

                        case 'travel_company':
                            const { error: travelError } = await supabase.from('travel_companies').insert([
                                {
                                    user_id: authData.user.id,
                                    name: fullName.trim(),
                                    code: serviceData.travelCompanyCode,
                                    phone: serviceData.travelCompanyPhone,
                                    email: serviceData.travelCompanyEmail,
                                    address: serviceData.travelCompanyAddress,
                                    services_offered: serviceData.travelCompanyDescription || null,
                                },
                            ]);
                            serviceError = travelError;
                            break;
                    }

                    if (serviceError) {
                        console.error('Service provider creation error:', serviceError);
                        // Rollback user creation if service provider creation fails
                        await supabase.from('users').delete().eq('id', authData.user.id);
                        await supabase.auth.signOut();
                        throw new Error(`Failed to create ${selectedRole} profile: ${serviceError.message}`);
                    }
                } catch (rollbackError) {
                    console.error('Error during service provider creation:', rollbackError);
                    throw rollbackError;
                }
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
        <form onSubmit={handleSubmit} className="space-y-6 dark:text-white">
            {/* Progress Steps */}
            <div className="mb-8">
                <div className="flex items-center justify-center space-x-4">
                    <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                        <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t('signup_step_basic')}</span>
                    </div>
                    <div className={`h-1 w-12 ${selectedRole ? 'bg-primary' : 'bg-gray-300'} transition-colors duration-300`}></div>
                    <div className="flex items-center">
                        <div
                            className={`w-8 h-8 ${selectedRole ? 'bg-primary text-white' : 'bg-gray-300 text-gray-600'} rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300`}
                        >
                            2
                        </div>
                        <span className={`ml-2 text-sm font-medium ${selectedRole ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'} transition-colors duration-300`}>
                            {t('signup_step_role')}
                        </span>
                    </div>
                    <div className={`h-1 w-12 ${isServiceProvider || requiresSchool ? 'bg-primary' : 'bg-gray-300'} transition-colors duration-300`}></div>
                    <div className="flex items-center">
                        <div
                            className={`w-8 h-8 ${isServiceProvider || requiresSchool ? 'bg-primary text-white' : 'bg-gray-300 text-gray-600'} rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300`}
                        >
                            3
                        </div>
                        <span className={`ml-2 text-sm font-medium ${isServiceProvider || requiresSchool ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'} transition-colors duration-300`}>
                            {t('signup_step_additional')}
                        </span>
                    </div>
                </div>
            </div>

            {/* General Error Alert */}
            {errors.general && <div className="text-red-500 bg-red-100 dark:bg-red-900/30 dark:text-red-400 p-3 rounded-md mb-4">{errors.general}</div>}

            {/* Name and Email Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name Field */}
                <div>
                    <label htmlFor="fullName">
                        {t('full_name')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative text-white-dark">
                        <motion.input
                            id="fullName"
                            type="text"
                            placeholder={t('enter_full_name')}
                            className={`form-input rounded-3xl py-3 ps-10 placeholder:text-white-dark transition-all duration-300 focus:scale-[1.02] ${errors.fullName ? 'border-red-500' : 'focus:border-primary focus:shadow-lg focus:shadow-primary/10'}`}
                            value={fullName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                            whileFocus={{ scale: 1.02 }}
                        />
                        <span className="absolute start-4 top-1/2 -translate-y-1/2">
                            <IconUser fill={true} />
                        </span>
                    </div>
                    {errors.fullName && <span className="text-red-500 text-sm mt-1">{errors.fullName}</span>}
                </div>

                {/* Email Field */}
                <div>
                    <label htmlFor="email">
                        {t('email')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative text-white-dark">
                        <motion.input
                            id="email"
                            type="email"
                            placeholder={t('enter_email')}
                            className={`form-input rounded-3xl py-3 ps-10 placeholder:text-white-dark transition-all duration-300 ${errors.email ? 'border-red-500' : 'focus:border-primary focus:shadow-lg focus:shadow-primary/10'}`}
                            value={email}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                            whileFocus={{ scale: 1.02 }}
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
                    <label htmlFor="password">
                        {t('password')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative text-white-dark">
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder={t('enter_password')}
                            className={`form-input rounded-3xl py-3 ps-10 pe-12 placeholder:text-white-dark ${errors.password ? 'border-red-500' : ''}`}
                            value={password}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        />
                        <span className="absolute start-4 top-1/2 -translate-y-1/2">
                            <IconLockDots fill={true} />
                        </span>
                        <button type="button" className="absolute end-4 top-1/2 -translate-y-1/2 text-white-dark hover:text-primary transition-colors" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M2 2L22 22M6.71277 6.7226C3.66479 8.79527 2 12 2 12C2 12 5.63636 19 12 19C14.0503 19 15.8174 18.2734 17.2711 17.2711M11 5.05822C11.3254 5.02013 11.6588 5 12 5C18.3636 5 22 12 22 12C22 12 21.3082 13.3317 20 14.8335"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        d="M14 14.2362C13.4692 14.7112 12.7684 15.0000 12 15.0000C10.3431 15.0000 9 13.6569 9 12.0000C9 11.1573 9.33193 10.3931 9.86932 9.8407"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            ) : (
                                <IconEye />
                            )}
                        </button>
                    </div>
                    {errors.password && <span className="text-red-500 text-sm mt-1">{errors.password}</span>}
                </div>

                {/* Confirm Password Field */}
                <div>
                    <label htmlFor="confirmPassword">
                        {t('confirm_password')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative text-white-dark">
                        <input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder={t('confirm_your_password')}
                            className={`form-input rounded-3xl py-3 ps-10 pe-12 placeholder:text-white-dark ${errors.confirmPassword ? 'border-red-500' : ''}`}
                            value={confirmPassword}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                        />
                        <span className="absolute start-4 top-1/2 -translate-y-1/2">
                            <IconLockDots fill={true} />
                        </span>
                        <button
                            type="button"
                            className="absolute end-4 top-1/2 -translate-y-1/2 text-white-dark hover:text-primary transition-colors"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            {showConfirmPassword ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M2 2L22 22M6.71277 6.7226C3.66479 8.79527 2 12 2 12C2 12 5.63636 19 12 19C14.0503 19 15.8174 18.2734 17.2711 17.2711M11 5.05822C11.3254 5.02013 11.6588 5 12 5C18.3636 5 22 12 22 12C22 12 21.3082 13.3317 20 14.8335"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        d="M14 14.2362C13.4692 14.7112 12.7684 15.0000 12 15.0000C10.3431 15.0000 9 13.6569 9 12.0000C9 11.1573 9.33193 10.3931 9.86932 9.8407"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            ) : (
                                <IconEye />
                            )}
                        </button>
                    </div>
                    {errors.confirmPassword && <span className="text-red-500 text-sm mt-1">{errors.confirmPassword}</span>}
                </div>
            </div>

            {/* Role Selection */}
            <div>
                <label className="block mb-2">
                    {t('select_your_role')} <span className="text-red-500">*</span>
                </label>
                <div className="grid gap-2">
                    {loadingRoles ? (
                        <div className="text-center text-white-dark py-4">{t('loading_roles')}</div>
                    ) : (
                        userRoles.map((role) => (
                            <motion.label
                                key={role.id}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className={`block cursor-pointer rounded-2xl border-2 p-4 transition-all duration-300 shadow-sm ${
                                    selectedRole === role.name
                                        ? 'border-primary bg-gradient-to-r from-primary/10 to-secondary/10 text-primary shadow-lg shadow-primary/20'
                                        : 'border-white-light bg-white/10 hover:border-primary/50 hover:shadow-md hover:shadow-primary/10 dark:border-white-dark dark:bg-dark/20'
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
                            </motion.label>
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
                        <label htmlFor="school">
                            {t('select_school')} <span className="text-red-500">*</span>
                        </label>
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

            {/* Service Provider Fields (conditional) */}
            <AnimatePresence>
                {isServiceProvider && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-6 border border-primary/20">
                            <h3 className="text-lg font-semibold mb-4 text-primary dark:text-white flex items-center">
                                <IconUserPlus className="mr-2 h-5 w-5" />
                                {t(`service_provider_info_${selectedRole}`)}
                            </h3>

                            {/* Guide Form */}
                            {selectedRole === 'guide' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="guideYearsOfExperience">
                                            {t('years_of_experience')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="guideYearsOfExperience"
                                            type="number"
                                            min="0"
                                            placeholder={t('enter_years_of_experience')}
                                            className={`form-input rounded-xl py-2 ${errors.guideYearsOfExperience ? 'border-red-500' : ''}`}
                                            value={serviceData.guideYearsOfExperience}
                                            onChange={(e) => setServiceData((prev) => ({ ...prev, guideYearsOfExperience: e.target.value }))}
                                        />
                                        {errors.guideYearsOfExperience && <span className="text-red-500 text-sm mt-1">{errors.guideYearsOfExperience}</span>}
                                    </div>
                                    <div>
                                        <label htmlFor="guideIdentityNumber">
                                            {t('identity_number')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="guideIdentityNumber"
                                            type="text"
                                            placeholder={t('enter_identity_number')}
                                            className={`form-input rounded-xl py-2 ${errors.guideIdentityNumber ? 'border-red-500' : ''}`}
                                            value={serviceData.guideIdentityNumber}
                                            onChange={(e) => setServiceData((prev) => ({ ...prev, guideIdentityNumber: e.target.value }))}
                                        />
                                        {errors.guideIdentityNumber && <span className="text-red-500 text-sm mt-1">{errors.guideIdentityNumber}</span>}
                                    </div>
                                </div>
                            )}

                            {/* Paramedic Form */}
                            {selectedRole === 'paramedic' && (
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="paramedicPhone">
                                            {t('phone_number')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="paramedicPhone"
                                            type="tel"
                                            placeholder={t('enter_phone_number')}
                                            className={`form-input rounded-xl py-2 ${errors.paramedicPhone ? 'border-red-500' : ''}`}
                                            value={serviceData.paramedicPhone}
                                            onChange={(e) => setServiceData((prev) => ({ ...prev, paramedicPhone: e.target.value }))}
                                        />
                                        {errors.paramedicPhone && <span className="text-red-500 text-sm mt-1">{errors.paramedicPhone}</span>}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label htmlFor="paramedicIdentityNumber">
                                            {t('identity_number')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="paramedicIdentityNumber"
                                            type="text"
                                            placeholder={t('enter_identity_number')}
                                            className={`form-input rounded-xl py-2 ${errors.paramedicIdentityNumber ? 'border-red-500' : ''}`}
                                            value={serviceData.paramedicIdentityNumber}
                                            onChange={(e) => setServiceData((prev) => ({ ...prev, paramedicIdentityNumber: e.target.value }))}
                                        />
                                        {errors.paramedicIdentityNumber && <span className="text-red-500 text-sm mt-1">{errors.paramedicIdentityNumber}</span>}
                                    </div>
                                </div>
                            )}

                            {/* Security Company Form */}
                            {selectedRole === 'security_company' && (
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="securityCompanyPhone">
                                            {t('phone_number')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="securityCompanyPhone"
                                            type="tel"
                                            placeholder={t('enter_phone_number')}
                                            className={`form-input rounded-xl py-2 ${errors.securityCompanyPhone ? 'border-red-500' : ''}`}
                                            value={serviceData.securityCompanyPhone}
                                            onChange={(e) => setServiceData((prev) => ({ ...prev, securityCompanyPhone: e.target.value }))}
                                        />
                                        {errors.securityCompanyPhone && <span className="text-red-500 text-sm mt-1">{errors.securityCompanyPhone}</span>}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="securityCompanyTaxNumber">{t('tax_number')}</label>
                                            <input
                                                id="securityCompanyTaxNumber"
                                                type="text"
                                                placeholder={t('enter_tax_number')}
                                                className="form-input rounded-xl py-2"
                                                value={serviceData.securityCompanyTaxNumber}
                                                onChange={(e) => setServiceData((prev) => ({ ...prev, securityCompanyTaxNumber: e.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="securityCompanyAddress">{t('address')}</label>
                                            <input
                                                id="securityCompanyAddress"
                                                type="text"
                                                placeholder={t('enter_address')}
                                                className="form-input rounded-xl py-2"
                                                value={serviceData.securityCompanyAddress}
                                                onChange={(e) => setServiceData((prev) => ({ ...prev, securityCompanyAddress: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Entertainment Company Form */}
                            {selectedRole === 'entertainment_company' && (
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="entertainmentCompanyPhone">
                                            {t('phone_number')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="entertainmentCompanyPhone"
                                            type="tel"
                                            placeholder={t('enter_phone_number')}
                                            className={`form-input rounded-xl py-2 ${errors.entertainmentCompanyPhone ? 'border-red-500' : ''}`}
                                            value={serviceData.entertainmentCompanyPhone}
                                            onChange={(e) => setServiceData((prev) => ({ ...prev, entertainmentCompanyPhone: e.target.value }))}
                                        />
                                        {errors.entertainmentCompanyPhone && <span className="text-red-500 text-sm mt-1">{errors.entertainmentCompanyPhone}</span>}
                                    </div>
                                    <div>
                                        <label htmlFor="entertainmentCompanyAddress">{t('address')}</label>
                                        <input
                                            id="entertainmentCompanyAddress"
                                            type="text"
                                            placeholder={t('enter_address')}
                                            className="form-input rounded-xl py-2"
                                            value={serviceData.entertainmentCompanyAddress}
                                            onChange={(e) => setServiceData((prev) => ({ ...prev, entertainmentCompanyAddress: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="entertainmentCompanyDescription">{t('description')}</label>
                                        <textarea
                                            id="entertainmentCompanyDescription"
                                            rows={3}
                                            placeholder={t('enter_company_description')}
                                            className="form-textarea rounded-xl"
                                            value={serviceData.entertainmentCompanyDescription}
                                            onChange={(e) => setServiceData((prev) => ({ ...prev, entertainmentCompanyDescription: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Travel Company Form */}
                            {selectedRole === 'travel_company' && (
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="travelCompanyPhone">
                                            {t('phone_number')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="travelCompanyPhone"
                                            type="tel"
                                            placeholder={t('enter_phone_number')}
                                            className={`form-input rounded-xl py-2 ${errors.travelCompanyPhone ? 'border-red-500' : ''}`}
                                            value={serviceData.travelCompanyPhone}
                                            onChange={(e) => setServiceData((prev) => ({ ...prev, travelCompanyPhone: e.target.value }))}
                                        />
                                        {errors.travelCompanyPhone && <span className="text-red-500 text-sm mt-1">{errors.travelCompanyPhone}</span>}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="travelCompanyEmail">{t('company_email')}</label>
                                            <input
                                                id="travelCompanyEmail"
                                                type="email"
                                                placeholder={t('enter_company_email')}
                                                className="form-input rounded-xl py-2"
                                                value={serviceData.travelCompanyEmail}
                                                onChange={(e) => setServiceData((prev) => ({ ...prev, travelCompanyEmail: e.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="travelCompanyCode">
                                                {t('company_code')} <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                id="travelCompanyCode"
                                                type="text"
                                                placeholder={t('enter_company_code')}
                                                className="form-input rounded-xl py-2"
                                                value={serviceData.travelCompanyCode}
                                                onChange={(e) => setServiceData((prev) => ({ ...prev, travelCompanyCode: e.target.value }))}
                                                required
                                            />
                                            {errors.travelCompanyCode && <span className="text-red-500 text-sm mt-1">{errors.travelCompanyCode}</span>}
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="travelCompanyAddress">{t('address')}</label>
                                        <input
                                            id="travelCompanyAddress"
                                            type="text"
                                            placeholder={t('enter_address')}
                                            className="form-input rounded-xl py-2"
                                            value={serviceData.travelCompanyAddress}
                                            onChange={(e) => setServiceData((prev) => ({ ...prev, travelCompanyAddress: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="travelCompanyDescription">{t('description')}</label>
                                        <textarea
                                            id="travelCompanyDescription"
                                            rows={3}
                                            placeholder={t('enter_company_description')}
                                            className="form-textarea rounded-xl"
                                            value={serviceData.travelCompanyDescription}
                                            onChange={(e) => setServiceData((prev) => ({ ...prev, travelCompanyDescription: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.button
                type="submit"
                className={`btn btn-gradient rounded-3xl py-4 !mt-8 w-full border-0 uppercase shadow-lg transition-all duration-300 ${
                    isSubmitting ? 'cursor-not-allowed opacity-80' : 'hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)]'
                }`}
                disabled={isSubmitting}
                whileHover={!isSubmitting ? { scale: 1.02, y: -2 } : {}}
                whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                animate={
                    isSubmitting
                        ? {
                              background: ['linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'],
                          }
                        : {}
                }
                transition={{
                    background: { repeat: Infinity, duration: 1.5, ease: 'easeInOut' },
                    scale: { type: 'spring', stiffness: 400, damping: 17 },
                }}
            >
                <AnimatePresence mode="wait">
                    {isSubmitting ? (
                        <motion.span key="loading" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center justify-center">
                            <motion.svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </motion.svg>
                            {t('creating_account')}
                        </motion.span>
                    ) : (
                        <motion.span key="signup" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="font-semibold">
                            {t('sign_up')}
                        </motion.span>
                    )}
                </AnimatePresence>
            </motion.button>
        </form>
    );
};

export default ComponentsAuthSignupForm;
