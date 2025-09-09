'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import IconBuilding from '@/components/icon/icon-building';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconUser from '@/components/icon/icon-user';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconPhone from '@/components/icon/icon-phone';
import IconMail from '@/components/icon/icon-mail';
import IconUsers from '@/components/icon/icon-users';
import IconUsersGroup from '@/components/icon/icon-users-group';
import supabase from '@/lib/supabase';
import { getTranslation } from '@/i18n';
import Link from 'next/link';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import CustomSelect, { SelectOption } from '@/components/elements/custom-select';
import IconPlus from '@/components/icon/icon-plus';

interface SchoolForm {
    name: string;
    code: string;
    type: string;
    director_name: string;
    address: string;
    email: string;
    phone: string;
    staff_count: number;
    student_count: number;
    class_count: number;
    status: string;
    notes: string;
}

const AddSchool = () => {
    const { t } = getTranslation();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<SchoolForm>({
        name: '',
        code: '',
        type: 'مدرسة',
        director_name: '',
        address: '',
        email: '',
        phone: '',
        staff_count: 0,
        student_count: 0,
        class_count: 0,
        status: 'active',
        notes: '',
    });
    const [alert, setAlert] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

    const schoolTypeOptions: SelectOption[] = [
        {
            value: 'مجلس',
            label: 'مجلس',
        },
        {
            value: 'كلية',
            label: 'كلية',
        },
        {
            value: 'مدرسة',
            label: 'مدرسة',
        },
        {
            value: 'روضه',
            label: 'روضه',
        },
    ];

    const statusOptions: SelectOption[] = [
        {
            value: 'active',
            label: t('active'),
        },
        {
            value: 'inactive',
            label: t('inactive'),
        },
    ];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value) || 0 : value,
        }));
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            setAlert({ message: t('school_name_required'), type: 'danger' });
            return false;
        }
        if (!formData.code.trim()) {
            setAlert({ message: t('school_code_required'), type: 'danger' });
            return false;
        }
        if (!formData.type) {
            setAlert({ message: t('institution_type_required'), type: 'danger' });
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('schools')
                .insert([
                    {
                        ...formData,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    },
                ])
                .select()
                .single();

            if (error) {
                if (error.code === '23505') {
                    // Unique constraint violation
                    throw new Error(t('school_code_already_exists'));
                }
                throw error;
            }

            setAlert({ message: t('school_added_successfully'), type: 'success' });

            // Redirect to schools list after a short delay
            setTimeout(() => {
                router.push('/schools');
            }, 1500);
        } catch (error) {
            console.error('Error adding school:', error);
            setAlert({
                message: error instanceof Error ? error.message : t('error_adding_school'),
                type: 'danger',
            });
        } finally {
            setLoading(false);
        }
    };

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
                        <span>{t('add_school')}</span>
                    </li>
                </ul>
            </div>

            <div className="mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <IconBuilding className="w-8 h-8 text-primary" />
                    {t('add_new_school')}
                </h1>
                <p className="text-gray-500 mt-2">{t('add_school_description')}</p>
            </div>

            {alert && (
                <div className="fixed top-4 right-4 z-50 min-w-80 max-w-md">
                    <Alert type={alert.type} title={alert.type === 'success' ? t('success') : t('error')} message={alert.message} onClose={() => setAlert(null)} />
                </div>
            )}

            <div className="panel">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                        <h3 className="text-lg font-semibold mb-4">{t('basic_information')}</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* School Name */}
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                    <IconBuilding className="w-4 h-4 text-primary" />
                                    {t('institution_name')} <span className="text-red-500">*</span>
                                </label>
                                <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className="form-input" placeholder={t('enter_institution_name')} required />
                            </div>

                            {/* School Code */}
                            <div className="space-y-2">
                                <label htmlFor="code" className="block text-sm font-bold text-gray-700 dark:text-white">
                                    {t('institution_code')} <span className="text-red-500">*</span>
                                </label>
                                <input type="text" id="code" name="code" value={formData.code} onChange={handleInputChange} className="form-input" placeholder={t('enter_institution_code')} required />
                            </div>

                            {/* Institution Type */}
                            <div className="space-y-2">
                                <label htmlFor="type" className="block text-sm font-bold text-gray-700 dark:text-white">
                                    {t('institution_type')} <span className="text-red-500">*</span>
                                </label>
                                <CustomSelect
                                    options={schoolTypeOptions}
                                    value={formData.type}
                                    onChange={(value) => setFormData({ ...formData, type: value as string })}
                                    placeholder={t('Select Type')}
                                    clearable={false}
                                    searchable={false}
                                    required
                                />
                            </div>

                            {/* Status */}
                            <div className="space-y-2">
                                <label htmlFor="status" className="block text-sm font-bold text-gray-700 dark:text-white">
                                    {t('status')}
                                </label>
                                <CustomSelect
                                    options={statusOptions}
                                    value={formData.status}
                                    onChange={(value) => setFormData({ ...formData, status: value as string })}
                                    placeholder={t('Select Status')}
                                    clearable={false}
                                    searchable={false}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                        <h3 className="text-lg font-semibold mb-4">{t('contact_information')}</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Director Name */}
                            <div className="space-y-2">
                                <label htmlFor="director_name" className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                    <IconUser className="w-4 h-4 text-primary" />
                                    {t('director_name')}
                                </label>
                                <input
                                    type="text"
                                    id="director_name"
                                    name="director_name"
                                    value={formData.director_name}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    placeholder={t('enter_director_name')}
                                />
                            </div>

                            {/* Phone */}
                            <div className="space-y-2">
                                <label htmlFor="phone" className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                    <IconPhone className="w-4 h-4 text-primary" />
                                    {t('phone_number')}
                                </label>
                                <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} className="form-input" placeholder={t('enter_phone_number')} />
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                    <IconMail className="w-4 h-4 text-primary" />
                                    {t('email')}
                                </label>
                                <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} className="form-input" placeholder={t('enter_email')} />
                            </div>

                            {/* Address */}
                            <div className="space-y-2">
                                <label htmlFor="address" className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                    <IconMapPin className="w-4 h-4 text-primary" />
                                    {t('address')}
                                </label>
                                <textarea id="address" name="address" value={formData.address} onChange={handleInputChange} className="form-textarea" placeholder={t('enter_address')} rows={3} />
                            </div>
                        </div>
                    </div>

                    {/* Statistics */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                        <h3 className="text-lg font-semibold mb-4">{t('statistics')}</h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Staff Count */}
                            <div className="space-y-2">
                                <label htmlFor="staff_count" className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                    <IconUsers className="w-4 h-4 text-primary" />
                                    {t('staff_count')}
                                </label>
                                <input type="number" id="staff_count" name="staff_count" value={formData.staff_count} onChange={handleInputChange} className="form-input" min="0" placeholder="0" />
                            </div>

                            {/* Student Count */}
                            <div className="space-y-2">
                                <label htmlFor="student_count" className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                    <IconUsersGroup className="w-4 h-4 text-primary" />
                                    {t('student_count')}
                                </label>
                                <input
                                    type="number"
                                    id="student_count"
                                    name="student_count"
                                    value={formData.student_count}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    min="0"
                                    placeholder="0"
                                />
                            </div>

                            {/* Class Count */}
                            <div className="space-y-2">
                                <label htmlFor="class_count" className="block text-sm font-bold text-gray-700 dark:text-white">
                                    {t('class_count')}
                                </label>
                                <input type="number" id="class_count" name="class_count" value={formData.class_count} onChange={handleInputChange} className="form-input" min="0" placeholder="0" />
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label htmlFor="notes" className="block text-sm font-bold text-gray-700 dark:text-white">
                            {t('notes')}
                        </label>
                        <textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} className="form-textarea" placeholder={t('enter_notes')} rows={4} />
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                        <button type="submit" disabled={loading} className="btn btn-primary flex items-center gap-2 px-8 py-3">
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    {t('saving')}...
                                </>
                            ) : (
                                <>
                                    <IconPlus className="w-5 h-5" />
                                    {t('add_school')}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddSchool;
