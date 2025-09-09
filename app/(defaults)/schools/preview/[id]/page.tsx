'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import IconBuilding from '@/components/icon/icon-building';
import IconEdit from '@/components/icon/icon-edit';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconUser from '@/components/icon/icon-user';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconPhone from '@/components/icon/icon-phone';
import IconMail from '@/components/icon/icon-mail';
import IconUsers from '@/components/icon/icon-users';
import IconUsersGroup from '@/components/icon/icon-users-group';
import IconCalendar from '@/components/icon/icon-calendar';
import IconClipboardText from '@/components/icon/icon-clipboard-text';
import supabase from '@/lib/supabase';
import { getTranslation } from '@/i18n';
import Link from 'next/link';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';

interface School {
    id: string;
    created_at: string;
    updated_at: string;
    name: string;
    code: string;
    type: string;
    director_name?: string;
    address?: string;
    email?: string;
    phone?: string;
    staff_count: number;
    student_count: number;
    class_count: number;
    status: string;
    notes?: string;
}

const SchoolPreview = () => {
    const { t } = getTranslation();
    const router = useRouter();
    const params = useParams();
    const schoolId = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [school, setSchool] = useState<School | null>(null);
    const [alert, setAlert] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

    useEffect(() => {
        const fetchSchool = async () => {
            try {
                const { data, error } = await supabase.from('schools').select('*').eq('id', schoolId).single();

                if (error) throw error;

                setSchool(data);
            } catch (error) {
                console.error('Error fetching school:', error);
                setAlert({ message: t('error_loading_school'), type: 'danger' });
            } finally {
                setLoading(false);
            }
        };

        if (schoolId) {
            fetchSchool();
        }
    }, [schoolId, t]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!school) {
        return (
            <div className="container mx-auto p-6">
                <div className="panel">
                    <div className="text-center py-12">
                        <IconBuilding className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <h2 className="text-xl font-semibold text-gray-600 mb-2">{t('school_not_found')}</h2>
                        <p className="text-gray-500 mb-6">{t('school_not_found_description')}</p>
                        <Link href="/schools" className="btn btn-primary">
                            {t('back_to_schools')}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            {/* Header */}
            <div className="flex items-center gap-5 mb-6">
                <Link href="/schools" className="text-primary hover:text-primary/80">
                    <IconArrowLeft className="h-7 w-7" />
                </Link>

                {/* Breadcrumb Navigation */}
                <ul className="flex space-x-2 rtl:space-x-reverse">
                    <li>
                        <Link href="/" className="text-primary hover:underline">
                            {t('home')}
                        </Link>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <Link href="/schools" className="text-primary hover:underline">
                            {t('schools')}
                        </Link>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <span>{school.name}</span>
                    </li>
                </ul>
            </div>

            {/* Title and Action */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <IconBuilding className="w-8 h-8 text-primary" />
                        {school.name}
                    </h1>
                    <p className="text-gray-500 mt-2">{t('school_details')}</p>
                </div>
                <Link href={`/schools/edit/${school.id}`} className="btn btn-primary flex items-center gap-2">
                    <IconEdit className="w-4 h-4" />
                    {t('edit_school')}
                </Link>
            </div>

            {alert && (
                <div className="fixed top-4 right-4 z-50 min-w-80 max-w-md">
                    <Alert type={alert.type} title={alert.type === 'success' ? t('success') : t('error')} message={alert.message} onClose={() => setAlert(null)} />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Information */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Information */}
                    <div className="panel">
                        <div className="mb-5">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <IconBuilding className="w-5 h-5 text-primary" />
                                {t('basic_information')}
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">{t('institution_name')}</label>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">{school.name}</div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">{t('institution_code')}</label>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">{school.code || t('not_specified')}</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">{t('institution_type')}</label>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <span
                                            className={`badge ${
                                                school.type === 'مجلس'
                                                    ? 'badge-outline-primary'
                                                    : school.type === 'كلية'
                                                      ? 'badge-outline-success'
                                                      : school.type === 'مدرسة'
                                                        ? 'badge-outline-info'
                                                        : 'badge-outline-warning'
                                            }`}
                                        >
                                            {school.type}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">{t('status')}</label>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <span className={`badge ${school.status === 'active' ? 'badge-outline-success' : 'badge-outline-danger'}`}>
                                            {school.status === 'active' ? t('active') : t('inactive')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="panel">
                        <div className="mb-5">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <IconUser className="w-5 h-5 text-primary" />
                                {t('contact_information')}
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-bold text-gray-700 dark:text-white mb-2 flex items-center gap-2">
                                        <IconUser className="w-4 h-4 text-primary" />
                                        {t('director_name')}
                                    </label>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">{school.director_name || t('not_specified')}</div>
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-gray-700 dark:text-white mb-2 flex items-center gap-2">
                                        <IconPhone className="w-4 h-4 text-primary" />
                                        {t('phone_number')}
                                    </label>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">{school.phone || t('not_specified')}</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-bold text-gray-700 dark:text-white mb-2 flex items-center gap-2">
                                        <IconMail className="w-4 h-4 text-primary" />
                                        {t('email')}
                                    </label>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">{school.email || t('not_specified')}</div>
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-gray-700 dark:text-white mb-2 flex items-center gap-2">
                                        <IconMapPin className="w-4 h-4 text-primary" />
                                        {t('address')}
                                    </label>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg min-h-[60px]">{school.address || t('not_specified')}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {school.notes && (
                        <div className="panel">
                            <div className="mb-5">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <IconClipboardText className="w-5 h-5 text-primary" />
                                    {t('notes')}
                                </h3>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">{school.notes}</div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Statistics */}
                    <div className="panel">
                        <div className="mb-5">
                            <h3 className="text-lg font-semibold">{t('statistics')}</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <IconUsers className="w-5 h-5 text-blue-600" />
                                    <span className="font-medium">{t('staff_count')}</span>
                                </div>
                                <span className="text-lg font-bold text-blue-600">{school.staff_count}</span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <IconUsersGroup className="w-5 h-5 text-green-600" />
                                    <span className="font-medium">{t('student_count')}</span>
                                </div>
                                <span className="text-lg font-bold text-green-600">{school.student_count}</span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <IconBuilding className="w-5 h-5 text-orange-600" />
                                    <span className="font-medium">{t('class_count')}</span>
                                </div>
                                <span className="text-lg font-bold text-orange-600">{school.class_count}</span>
                            </div>
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="panel">
                        <div className="mb-5">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <IconCalendar className="w-5 h-5 text-primary" />
                                {t('record_information')}
                            </h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('created_at')}</label>
                                <div className="text-sm font-semibold">{new Date(school.created_at).toLocaleDateString('ar-SA')}</div>
                                <div className="text-xs text-gray-500">{new Date(school.created_at).toLocaleTimeString('ar-SA')}</div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('last_updated')}</label>
                                <div className="text-sm font-semibold">{new Date(school.updated_at).toLocaleDateString('ar-SA')}</div>
                                <div className="text-xs text-gray-500">{new Date(school.updated_at).toLocaleTimeString('ar-SA')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SchoolPreview;
