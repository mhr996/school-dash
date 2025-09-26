'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import supabase from '@/lib/supabase';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import { getTranslation } from '@/i18n';
import CustomSelect from '@/components/elements/custom-select';
import { getCurrentUserWithRole } from '@/lib/auth';
import PageBreadcrumb from '@/components/layouts/page-breadcrumb';

const EditUserPage = () => {
    const router = useRouter();
    const params = useParams();
    const { t } = getTranslation();
    const userId = params?.id as string;
    const [isAdminUser, setIsAdminUser] = useState(false);
    const [roles, setRoles] = useState<any[]>([]);
    const [schools, setSchools] = useState<any[]>([]);
    const [isServiceProviderUser, setIsServiceProviderUser] = useState(false);
    const [originalRoleId, setOriginalRoleId] = useState('');
    const [userRoleName, setUserRoleName] = useState('');

    const [form, setForm] = useState({
        full_name: '',
        email: '',
        phone: '',
        address: '',
        birth_date: '',
        role_id: '',
        school_id: '',
        is_active: true,
    });

    const [alert, setAlert] = useState<{ visible: boolean; message: string; type: 'success' | 'danger' }>({
        visible: false,
        message: '',
        type: 'success',
    });

    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);

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

    if (!userId) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center">
                    <p className="text-red-500">{t('invalid_user_id')}</p>
                    <Link href="/users" className="btn btn-primary mt-4">
                        {t('back_to_users')}
                    </Link>
                </div>
            </div>
        );
    }

    useEffect(() => {
        const fetchData = async () => {
            if (!isAdminUser || !userId) return;

            try {
                // Fetch user data with role information
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select(
                        `
                        full_name, email, phone, address, birth_date, 
                        role_id, school_id, is_active,
                        user_roles(name)
                    `,
                    )
                    .eq('id', userId)
                    .single();

                if (userError) throw userError;

                if (userData) {
                    const roleId = userData.role_id?.toString() || '';
                    setOriginalRoleId(roleId);

                    // Check if user has a service provider role
                    const roleNameFromData = (userData.user_roles as any)?.name;
                    setUserRoleName(roleNameFromData || '');
                    const serviceProviderRoles = ['guide', 'paramedic', 'security_company', 'entertainment_company', 'travel_company'];
                    const isServiceProvider = roleNameFromData && serviceProviderRoles.includes(roleNameFromData);
                    setIsServiceProviderUser(isServiceProvider);

                    setForm({
                        full_name: userData.full_name || '',
                        email: userData.email || '',
                        phone: userData.phone || '',
                        address: userData.address || '',
                        birth_date: userData.birth_date || '',
                        role_id: roleId,
                        school_id: userData.school_id || '',
                        is_active: userData.is_active ?? true,
                    });
                }

                // Fetch roles (exclude service provider roles)
                const { data: rolesData, error: rolesError } = await supabase
                    .from('user_roles')
                    .select('*')
                    .not('name', 'in', '(guide,paramedic,security_company,entertainment_company,travel_company)')
                    .order('name');

                if (rolesError) throw rolesError;
                setRoles(rolesData || []);

                // Fetch schools
                const { data: schoolsData, error: schoolsError } = await supabase.from('schools').select('*').order('name');

                if (schoolsError) throw schoolsError;
                setSchools(schoolsData || []);
            } catch (error) {
                console.error('Error fetching data:', error);
                setAlert({
                    visible: true,
                    message: t('error_fetching_user'),
                    type: 'danger',
                });
            } finally {
                setFetchLoading(false);
            }
        };

        fetchData();
    }, [userId, isAdminUser]); // Removed 't' from dependencies to prevent re-fetching

    // Clear school_id when role changes to non-school role
    useEffect(() => {
        if (form.role_id && roles.length > 0) {
            const selectedRole = roles.find((role) => role.id.toString() === form.role_id);
            if (selectedRole && selectedRole.name !== 'school_manager' && selectedRole.name !== 'trip_planner') {
                setForm((prev) => ({ ...prev, school_id: '' }));
            }
        }
    }, [form.role_id, roles]);

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

        // Basic validation: full name and email are required
        if (!form.full_name || !form.email) {
            setAlert({ visible: true, message: t('full_name_email_required'), type: 'danger' });
            setLoading(false);
            return;
        }

        // Role validation (skip for service provider users)
        if (!isServiceProviderUser && !form.role_id) {
            setAlert({ visible: true, message: t('role_required'), type: 'danger' });
            setLoading(false);
            return;
        }

        // School validation for school managers and trip planners (skip for service provider users)
        if (!isServiceProviderUser) {
            const selectedRole = roles.find((role) => role.id.toString() === form.role_id);
            if (selectedRole && (selectedRole.name === 'school_manager' || selectedRole.name === 'trip_planner')) {
                if (!form.school_id) {
                    setAlert({ visible: true, message: t('school_required_for_role'), type: 'danger' });
                    setLoading(false);
                    return;
                }
            }
        }

        try {
            // For service provider users, preserve their original role
            const roleIdToUpdate = isServiceProviderUser ? parseInt(originalRoleId) : parseInt(form.role_id);

            // Update user profile in database
            const { error: profileError } = await supabase
                .from('users')
                .update({
                    full_name: form.full_name,
                    email: form.email,
                    phone: form.phone || null,
                    address: form.address || null,
                    birth_date: form.birth_date || null,
                    role_id: roleIdToUpdate,
                    school_id: form.school_id || null,
                    is_active: form.is_active,
                })
                .eq('id', userId);

            if (profileError) throw profileError;

            // Update auth email if it changed
            const { data: authUser } = await supabase.auth.getUser();
            if (authUser.user && authUser.user.email !== form.email) {
                const { error: authError } = await supabase.auth.updateUser({
                    email: form.email,
                    data: { display_name: form.full_name },
                });

                if (authError) {
                    console.warn('Warning: Could not update auth email:', authError);
                }
            }

            setAlert({
                visible: true,
                message: t('user_updated_successfully'),
                type: 'success',
            });

            // Redirect back to users list after a delay
            setTimeout(() => {
                router.push('/users');
            }, 700);
        } catch (error: any) {
            console.error(error);
            setAlert({
                visible: true,
                message: error.message || t('error_updating_user'),
                type: 'danger',
            });
        } finally {
            setLoading(false);
        }
    };

    if (fetchLoading || !isAdminUser) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-gray-600">{t('loading')}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <PageBreadcrumb section="users" backUrl="/users" items={[{ label: t('home'), href: '/' }, { label: t('users'), href: '/users' }, { label: t('edit_user') }]} />

            {alert.visible && (
                <div className="mb-4">
                    <Alert type={alert.type} title={alert.type === 'success' ? t('success') : t('error')} message={alert.message} onClose={() => setAlert({ ...alert, visible: false })} />
                </div>
            )}

            {/* Form Container */}
            <div className="rounded-md border border-[#ebedf2] bg-white p-4 dark:border-[#191e3a] dark:bg-black">
                <h6 className="mb-5 text-lg font-bold">{t('edit_user')}</h6>

                {/* Service Provider Notice */}
                {isServiceProviderUser && (
                    <div className="mb-5 rounded-md bg-blue-50 border border-blue-200 p-4 dark:bg-blue-900/20 dark:border-blue-800">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path
                                        fillRule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">{t('service_provider_account')}</h3>
                                <div className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                                    <p>{t('service_provider_edit_notice')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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
                    {/* Role section - show selector for regular users, display-only for service providers */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-white">
                            {t('user_role')} {!isServiceProviderUser && '*'}
                        </label>
                        {!isServiceProviderUser ? (
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
                        ) : (
                            <div className="flex items-center space-x-2">
                                <div className="form-input bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed">
                                    {userRoleName ? t(`role_${userRoleName}`) : t('service_provider_role')}
                                </div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">({t('role_managed_by_service')})</span>
                            </div>
                        )}
                    </div>
                    {/* School selector - only show for non-service provider users with school-related roles */}
                    {(() => {
                        if (isServiceProviderUser) return null;

                        const selectedRole = roles.find((role) => role.id.toString() === form.role_id);
                        const shouldShowSchoolSelector = selectedRole && (selectedRole.name === 'school_manager' || selectedRole.name === 'trip_planner');

                        if (shouldShowSchoolSelector) {
                            return (
                                <div>
                                    <label htmlFor="school_id" className="block text-sm font-bold text-gray-700 dark:text-white">
                                        {t('school_assignment')} *
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
                            );
                        }
                        return null;
                    })()}
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
                    <div className="sm:col-span-2 flex gap-4">
                        <button type="button" onClick={() => router.back()} className="btn btn-outline-danger">
                            {t('cancel')}
                        </button>
                        <button type="submit" disabled={loading} className="btn btn-primary">
                            {loading ? t('saving') : t('save_changes')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUserPage;
