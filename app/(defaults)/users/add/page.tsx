'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import supabase from '@/lib/supabase';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import { getTranslation } from '@/i18n';
import IconEye from '@/components/icon/icon-eye';
import CustomSelect from '@/components/elements/custom-select';
import { getCurrentUserWithRole } from '@/lib/auth';

const AddUserPage = () => {
    const router = useRouter();
    const { t } = getTranslation();
    const [isAdminUser, setIsAdminUser] = useState(false);
    const [roles, setRoles] = useState<any[]>([]);
    const [schools, setSchools] = useState<any[]>([]);
    const [form, setForm] = useState({
        full_name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        birth_date: '',
        role_id: '',
        school_id: '',
        is_active: true,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [alert, setAlert] = useState<{ visible: boolean; message: string; type: 'success' | 'danger' }>({
        visible: false,
        message: '',
        type: 'success',
    });
    const [loading, setLoading] = useState(false);

    // Check if user is admin and redirect if not
    useEffect(() => {
        const checkAdminAccess = async () => {
            const { user, error } = await getCurrentUserWithRole();
            if (error || !user || user.user_roles?.name !== 'admin') {
                router.push('/users');
                return;
            }
            setIsAdminUser(true);
        };
        checkAdminAccess();
    }, [router]);

    // Fetch roles and schools
    useEffect(() => {
        const fetchData = async () => {
            if (!isAdminUser) return;

            try {
                // Fetch roles
                const { data: rolesData, error: rolesError } = await supabase.from('user_roles').select('*').order('name');

                if (rolesError) throw rolesError;
                setRoles(rolesData || []);

                // Fetch schools
                const { data: schoolsData, error: schoolsError } = await supabase.from('schools').select('*').order('name');

                if (schoolsError) throw schoolsError;
                setSchools(schoolsData || []);
            } catch (error) {
                console.error('Error fetching data:', error);
                setAlert({ visible: true, message: t('error_loading_data'), type: 'danger' });
            }
        };
        fetchData();
    }, [isAdminUser]); // Removed 't' from dependencies to prevent re-fetching

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Basic validation: full name, email and password are required
        if (!form.full_name || !form.email) {
            setAlert({ visible: true, message: t('full_name_email_required'), type: 'danger' });
            setLoading(false);
            return;
        }

        // Password validation
        if (!form.password || form.password.length < 6) {
            setAlert({ visible: true, message: t('password_required_min_6'), type: 'danger' });
            setLoading(false);
            return;
        }

        // Role validation
        if (!form.role_id) {
            setAlert({ visible: true, message: t('role_required'), type: 'danger' });
            setLoading(false);
            return;
        }

        try {
            // Create user with regular signup
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: form.email,
                password: form.password,
            });

            if (authError) throw authError;

            if (!authData.user) {
                throw new Error('User creation failed - no user data returned');
            }

            // Create user profile in database
            const { error: profileError } = await supabase.from('users').insert({
                email: form.email,
                full_name: form.full_name,
                phone: form.phone || null,
                address: form.address || null,
                birth_date: form.birth_date || null,
                role_id: parseInt(form.role_id),
                school_id: form.school_id || null,
                is_active: form.is_active,
                auth_user_id: authData.user.id,
            });

            if (profileError) throw profileError;

            setAlert({
                visible: true,
                message: t('user_created_successfully'),
                type: 'success',
            });

            // Redirect back to the users list page after successful creation
            setTimeout(() => {
                router.push('/users');
            }, 2000);
        } catch (error: any) {
            console.error(error);
            setAlert({ visible: true, message: error.message || t('error_adding_user'), type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    if (!isAdminUser) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div>Loading...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center gap-5 mb-6">
                <div onClick={() => router.back()}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mb-4 cursor-pointer text-primary rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </div>
                {/* Breadcrumb Navigation */}
                <ul className="flex space-x-2 rtl:space-x-reverse mb-4">
                    <li>
                        <Link href="/" className="text-primary hover:underline">
                            {t('home')}
                        </Link>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <Link href="/users" className="text-primary hover:underline">
                            {t('users')}
                        </Link>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <span>{t('add_new_user')}</span>
                    </li>
                </ul>
            </div>
            {alert.visible && (
                <div className="mb-4">
                    <Alert type={alert.type} title={alert.type === 'success' ? t('success') : t('error')} message={alert.message} onClose={() => setAlert({ ...alert, visible: false })} />
                </div>
            )}
            {/* Form Container */}
            <div className="rounded-md border border-[#ebedf2] bg-white p-4 dark:border-[#191e3a] dark:bg-black">
                <h6 className="mb-5 text-lg font-bold">{t('add_new_user')}</h6>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                        <label htmlFor="full_name" className="block text-sm font-bold text-gray-700 dark:text-white">
                            {t('full_name')} *
                        </label>
                        <input type="text" id="full_name" name="full_name" value={form.full_name} onChange={handleInputChange} className="form-input" placeholder={t('enter_full_name')} required />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-bold text-gray-700 dark:text-white">
                            {t('email')} *
                        </label>
                        <input type="email" id="email" name="email" value={form.email} onChange={handleInputChange} className="form-input" placeholder={t('enter_email')} required />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-bold text-gray-700 dark:text-white">
                            {t('password')} *
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                name="password"
                                value={form.password}
                                onChange={handleInputChange}
                                className="form-input pr-12"
                                placeholder={t('enter_password')}
                                minLength={6}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                            >
                                {showPassword ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M2 2L22 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        <path
                                            d="M6.71 6.71C4.33 8.26 2.67 10.94 2 12C2.67 13.06 4.33 15.74 6.71 17.29"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M10.59 10.59C10.21 11.37 10.21 12.63 10.59 13.41C10.97 14.19 11.81 14.81 12.59 14.59"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M17.29 17.29C19.67 15.74 21.33 13.06 22 12C21.33 10.94 19.67 8.26 17.29 6.71"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                ) : (
                                    <IconEye className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">{t('password_min_6_chars')}</p>
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-bold text-gray-700 dark:text-white">
                            {t('phone')}
                        </label>
                        <input type="text" id="phone" name="phone" value={form.phone} onChange={handleInputChange} className="form-input" placeholder={t('enter_phone')} />
                    </div>
                    <div>
                        <label htmlFor="birth_date" className="block text-sm font-bold text-gray-700 dark:text-white">
                            {t('birth_date')}
                        </label>
                        <input type="date" id="birth_date" name="birth_date" value={form.birth_date} onChange={handleInputChange} className="form-input" />
                    </div>
                    <div>
                        <label htmlFor="role_id" className="block text-sm font-bold text-gray-700 dark:text-white">
                            {t('user_role')} *
                        </label>
                        <CustomSelect
                            value={form.role_id}
                            onChange={(value: string | string[]) => setForm((prev) => ({ ...prev, role_id: Array.isArray(value) ? value[0] : value }))}
                            options={roles.map((role) => ({
                                value: role.id.toString(),
                                label: t(`role_${role.name}`),
                            }))}
                            placeholder={t('select_role')}
                            className="form-input"
                        />
                    </div>
                    <div>
                        <label htmlFor="school_id" className="block text-sm font-bold text-gray-700 dark:text-white">
                            {t('school_assignment')}
                        </label>
                        <CustomSelect
                            value={form.school_id}
                            onChange={(value: string | string[]) => setForm((prev) => ({ ...prev, school_id: Array.isArray(value) ? value[0] : value }))}
                            options={schools.map((school) => ({
                                value: school.id,
                                label: school.name,
                            }))}
                            placeholder={t('select_school')}
                            className="form-input"
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label htmlFor="address" className="block text-sm font-bold text-gray-700 dark:text-white">
                            {t('address')}
                        </label>
                        <input type="text" id="address" name="address" value={form.address} onChange={handleInputChange} className="form-input" placeholder={t('enter_address')} />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))} className="form-checkbox" />
                            <span className="text-white-dark ml-2">{t('user_is_active')}</span>
                        </label>
                    </div>
                    <div className="sm:col-span-2">
                        <button type="submit" disabled={loading} className="btn btn-primary">
                            {loading ? t('creating_user') : t('create_active_user')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddUserPage;
