'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Components
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconPlus from '@/components/icon/icon-plus';
import IconLock from '@/components/icon/icon-lock';
import IconPhone from '@/components/icon/icon-phone';
import IconMail from '@/components/icon/icon-mail';
import IconBuilding from '@/components/icon/icon-building';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import CustomSelect from '@/components/elements/custom-select';

import { getTranslation } from '@/i18n';

interface SelectOption {
    value: string;
    label: string;
}

interface SecurityCompanyForm {
    name: string;
    tax_number: string;
    phone: string;
    email: string;
    address: string;
    license_types: string;
    weapon_types: string;
    status: string;
    notes: string;
}

const AddSecurityCompany = () => {
    const { t } = getTranslation();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<SecurityCompanyForm>({
        name: '',
        tax_number: '',
        phone: '',
        email: '',
        address: '',
        license_types: '',
        weapon_types: '',
        status: 'active',
        notes: '',
    });
    const [alert, setAlert] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

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

    const supabase = createClientComponentClient();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setLoading(true);

            // Validate required fields
            if (!formData.name.trim()) {
                setAlert({ message: t('security_company_name_required'), type: 'danger' });
                return;
            }

            if (!formData.tax_number.trim()) {
                setAlert({ message: t('security_tax_number_required'), type: 'danger' });
                return;
            }

            const { error } = await supabase.from('security_companies').insert([formData]);

            if (error) {
                throw error;
            }

            setAlert({ message: t('security_company_added_successfully'), type: 'success' });

            // Reset form
            setFormData({
                name: '',
                tax_number: '',
                phone: '',
                email: '',
                address: '',
                license_types: '',
                weapon_types: '',
                status: 'active',
                notes: '',
            });

            // Redirect to security companies list after a short delay
            setTimeout(() => {
                router.push('/security-companies');
            }, 1500);
        } catch (error: any) {
            console.error('Error adding security company:', error);
            setAlert({ message: error.message || t('error_adding_security_company'), type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="panel border-white-light px-0 dark:border-[#1b2e4b]">
            {/* Header */}
            <div className="mb-5 flex flex-col gap-5 px-5 md:items-start">
                <div className="flex items-center gap-2">
                    <Link href="/security-companies" className="text-primary hover:text-primary/80">
                        <IconArrowLeft className="h-6 w-6" />
                    </Link>
                    <IconLock className="h-6 w-6 text-primary" />
                    <h2 className="text-xl font-bold dark:text-white">{t('add_new_security_company')}</h2>
                </div>

                {/* Breadcrumb */}
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Link href="/security-companies" className="text-primary hover:underline">
                        {t('security_companies')}
                    </Link>
                    <span className="mx-2">/</span>
                    <span>{t('add_security_company')}</span>
                </div>
            </div>

            {/* Form */}
            <div className="px-5 pb-5">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Company Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('security_company_name')} *
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="form-input ltr:pl-9 rtl:pr-9"
                                    placeholder={t('enter_security_company_name')}
                                    required
                                />
                                <IconBuilding className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 ltr:left-3 rtl:right-3" />
                            </div>
                        </div>

                        {/* Tax Number */}
                        <div>
                            <label htmlFor="tax_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('security_tax_number')} *
                            </label>
                            <input
                                type="text"
                                id="tax_number"
                                name="tax_number"
                                value={formData.tax_number}
                                onChange={handleInputChange}
                                className="form-input"
                                placeholder={t('enter_security_tax_number')}
                                required
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('phone')}
                            </label>
                            <div className="relative">
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="form-input ltr:pl-9 rtl:pr-9"
                                    placeholder={t('enter_phone_number')}
                                />
                                <IconPhone className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 ltr:left-3 rtl:right-3" />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('email')}
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="form-input ltr:pl-9 rtl:pr-9"
                                    placeholder={t('enter_email')}
                                />
                                <IconMail className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 ltr:left-3 rtl:right-3" />
                            </div>
                        </div>

                        {/* Address */}
                        <div className="lg:col-span-2">
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('address')}
                            </label>
                            <input type="text" id="address" name="address" value={formData.address} onChange={handleInputChange} className="form-input" placeholder={t('enter_address')} />
                        </div>

                        {/* License Types */}
                        <div>
                            <label htmlFor="license_types" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('license_types')}
                            </label>
                            <input
                                type="text"
                                id="license_types"
                                name="license_types"
                                value={formData.license_types}
                                onChange={handleInputChange}
                                className="form-input"
                                placeholder={t('enter_license_types')}
                            />
                        </div>

                        {/* Weapon Types */}
                        <div>
                            <label htmlFor="weapon_types" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('weapon_types')}
                            </label>
                            <input
                                type="text"
                                id="weapon_types"
                                name="weapon_types"
                                value={formData.weapon_types}
                                onChange={handleInputChange}
                                className="form-input"
                                placeholder={t('enter_weapon_types')}
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('status')}
                            </label>
                            <CustomSelect
                                options={statusOptions}
                                value={formData.status}
                                onChange={(value) => setFormData((prev) => ({ ...prev, status: typeof value === 'string' ? value : value[0] || 'active' }))}
                                placeholder={t('select_status')}
                            />
                        </div>

                        {/* Notes */}
                        <div className="lg:col-span-2">
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('notes')}
                            </label>
                            <textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} className="form-textarea" placeholder={t('enter_notes')} rows={4} />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-4">
                        <Link href="/security-companies" className="btn btn-outline-danger">
                            {t('cancel')}
                        </Link>
                        <button type="submit" className="btn btn-primary gap-2" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5"></span>
                                    {t('adding')}...
                                </>
                            ) : (
                                <>
                                    <IconPlus />
                                    {t('create_security_company')}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Alert */}
            {alert && (
                <div className="fixed top-4 right-4 z-50 min-w-80 max-w-md">
                    <Alert type={alert.type} title={alert.type === 'success' ? t('success') : t('error')} message={alert.message} onClose={() => setAlert(null)} />
                </div>
            )}
        </div>
    );
};

export default AddSecurityCompany;
