'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Components
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconSave from '@/components/icon/icon-save';
import IconLock from '@/components/icon/icon-lock';
import IconPhone from '@/components/icon/icon-phone';
import IconMail from '@/components/icon/icon-mail';
import IconBuilding from '@/components/icon/icon-building';
import IconCreditCard from '@/components/icon/icon-credit-card';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconUser from '@/components/icon/icon-user';
import IconInfoCircle from '@/components/icon/icon-info-circle';
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
    hourly_rate: number;
    daily_rate: number;
    regional_rate: number;
    overnight_rate: number;
}

const EditSecurityCompany = () => {
    const { t } = getTranslation();
    const router = useRouter();
    const params = useParams();
    const companyId = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
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
        hourly_rate: 50,
        daily_rate: 400,
        regional_rate: 600,
        overnight_rate: 500,
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

    useEffect(() => {
        const fetchSecurityCompany = async () => {
            try {
                setLoading(true);

                const { data, error } = await supabase.from('security_companies').select('*').eq('id', companyId).single();

                if (error) {
                    console.error('Error fetching security company:', error);
                    setAlert({ message: t('error_loading_security_company'), type: 'danger' });
                    return;
                }

                if (data) {
                    setFormData({
                        name: data.name || '',
                        tax_number: data.tax_number || '',
                        phone: data.phone || '',
                        email: data.email || '',
                        address: data.address || '',
                        license_types: data.license_types || '',
                        weapon_types: data.weapon_types || '',
                        status: data.status || 'active',
                        notes: data.notes || '',
                        hourly_rate: data.hourly_rate || 50,
                        daily_rate: data.daily_rate || 400,
                        regional_rate: data.regional_rate || 600,
                        overnight_rate: data.overnight_rate || 500,
                    });
                }
            } catch (error) {
                console.error('Error fetching security company:', error);
                setAlert({ message: t('error_loading_security_company'), type: 'danger' });
            } finally {
                setLoading(false);
            }
        };

        if (companyId) {
            fetchSecurityCompany();
        }
    }, [companyId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setSaving(true);

            // Validate required fields
            if (!formData.name.trim()) {
                setAlert({ message: t('security_company_name_required'), type: 'danger' });
                return;
            }

            if (!formData.tax_number.trim()) {
                setAlert({ message: t('security_tax_number_required'), type: 'danger' });
                return;
            }

            const { error } = await supabase.from('security_companies').update(formData).eq('id', companyId);

            if (error) {
                throw error;
            }

            setAlert({ message: t('security_company_updated_successfully'), type: 'success' });

            // Redirect to security companies list after a short delay
            setTimeout(() => {
                router.push('/security-companies');
            }, 700);
        } catch (error: any) {
            console.error('Error updating security company:', error);
            setAlert({ message: error.message || t('error_updating_security_company'), type: 'danger' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex min-h-[400px] items-center justify-center">
                    <div className="animate-spin border-4 border-primary border-l-transparent rounded-full w-10 h-10"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            {/* Header */}
            <div className="flex items-center gap-5 mb-6">
                <Link href={`/security-companies/preview/${companyId}`} className="text-primary hover:text-primary/80">
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
                        <Link href="/security-companies" className="text-primary hover:underline">
                            {t('security_companies')}
                        </Link>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <Link href={`/security-companies/preview/${companyId}`} className="text-primary hover:underline">
                            {formData.name || t('security_company_details')}
                        </Link>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <span>{t('edit')}</span>
                    </li>
                </ul>
            </div>

            <div className="mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <IconLock className="w-8 h-8 text-primary" />
                    {t('edit_security_company')}
                </h1>
            </div>

            {alert && (
                <div className="fixed top-4 right-4 z-50 min-w-80 max-w-md">
                    <Alert type={alert.type} title={alert.type === 'success' ? t('success') : t('error')} message={alert.message} onClose={() => setAlert(null)} />
                </div>
            )}

            {/* Form Container */}
            <div className="panel">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Tab Navigation */}
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="flex gap-4 overflow-x-auto">
                            <button
                                type="button"
                                onClick={() => setActiveTab(0)}
                                className={`px-4 py-3 font-semibold transition-colors border-b-2 whitespace-nowrap ${
                                    activeTab === 0 ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <IconInfoCircle className="w-5 h-5" />
                                    {t('basic_information')}
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab(1)}
                                className={`px-4 py-3 font-semibold transition-colors border-b-2 whitespace-nowrap ${
                                    activeTab === 1 ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <IconPhone className="w-5 h-5" />
                                    {t('contact_information')}
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab(2)}
                                className={`px-4 py-3 font-semibold transition-colors border-b-2 whitespace-nowrap ${
                                    activeTab === 2 ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <IconLock className="w-5 h-5" />
                                    {t('security_pricing')}
                                </div>
                            </button>
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="py-6">
                        {/* Tab 0: Basic Information */}
                        {activeTab === 0 && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Company Name */}
                                    <div className="space-y-2">
                                        <label htmlFor="name" className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                            <IconBuilding className="w-5 h-5 text-primary" />
                                            {t('security_company_name')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="form-input"
                                            placeholder={t('enter_security_company_name')}
                                            required
                                        />
                                    </div>

                                    {/* Tax Number */}
                                    <div className="space-y-2">
                                        <label htmlFor="tax_number" className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                            <IconCreditCard className="w-5 h-5 text-primary" />
                                            {t('security_tax_number')} <span className="text-red-500">*</span>
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

                                    {/* Status */}
                                    <div className="space-y-2">
                                        <label htmlFor="status" className="block text-sm font-bold text-gray-700 dark:text-white">
                                            {t('status')}
                                        </label>
                                        <CustomSelect
                                            options={statusOptions}
                                            value={formData.status}
                                            onChange={(value: string | string[]) => setFormData({ ...formData, status: Array.isArray(value) ? value[0] : value })}
                                            placeholder={t('select_status')}
                                            clearable={false}
                                            searchable={false}
                                        />
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="space-y-2">
                                    <label htmlFor="notes" className="block text-sm font-bold text-gray-700 dark:text-white">
                                        {t('notes')}
                                    </label>
                                    <textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} className="form-textarea" placeholder={t('enter_notes')} rows={4} />
                                </div>
                            </div>
                        )}

                        {/* Tab 1: Contact Information */}
                        {activeTab === 1 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Phone */}
                                <div className="space-y-2">
                                    <label htmlFor="phone" className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                        <IconPhone className="w-5 h-5 text-primary" />
                                        {t('phone')}
                                    </label>
                                    <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} className="form-input" placeholder={t('enter_phone_number')} />
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                        <IconMail className="w-5 h-5 text-primary" />
                                        {t('email')}
                                    </label>
                                    <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} className="form-input" placeholder={t('enter_email')} />
                                </div>

                                {/* Address */}
                                <div className="space-y-2 md:col-span-2">
                                    <label htmlFor="address" className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                        <IconMapPin className="w-5 h-5 text-primary" />
                                        {t('address')}
                                    </label>
                                    <input type="text" id="address" name="address" value={formData.address} onChange={handleInputChange} className="form-input" placeholder={t('enter_address')} />
                                </div>
                            </div>
                        )}

                        {/* Tab 2: Security & Pricing */}
                        {activeTab === 2 && (
                            <div className="space-y-6">
                                {/* Security Information */}
                                <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                                    <h3 className="text-lg font-semibold mb-4">{t('security_information')}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* License Types */}
                                        <div className="space-y-2">
                                            <label htmlFor="license_types" className="block text-sm font-bold text-gray-700 dark:text-white">
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
                                        <div className="space-y-2">
                                            <label htmlFor="weapon_types" className="block text-sm font-bold text-gray-700 dark:text-white">
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
                                    </div>
                                </div>

                                {/* Pricing Information */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">{t('pricing_information')}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Hourly Rate */}
                                        <div className="space-y-2">
                                            <label htmlFor="hourly_rate" className="block text-sm font-bold text-gray-700 dark:text-white">
                                                {t('hourly_rate')} (₪)
                                            </label>
                                            <input
                                                type="number"
                                                id="hourly_rate"
                                                name="hourly_rate"
                                                value={formData.hourly_rate}
                                                onChange={handleInputChange}
                                                className="form-input"
                                                placeholder={t('enter_hourly_rate')}
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>

                                        {/* Daily Rate */}
                                        <div className="space-y-2">
                                            <label htmlFor="daily_rate" className="block text-sm font-bold text-gray-700 dark:text-white">
                                                {t('daily_rate')} (₪)
                                            </label>
                                            <input
                                                type="number"
                                                id="daily_rate"
                                                name="daily_rate"
                                                value={formData.daily_rate}
                                                onChange={handleInputChange}
                                                className="form-input"
                                                placeholder={t('enter_daily_rate')}
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>

                                        {/* Regional Rate */}
                                        <div className="space-y-2">
                                            <label htmlFor="regional_rate" className="block text-sm font-bold text-gray-700 dark:text-white">
                                                {t('regional_rate')} (₪)
                                            </label>
                                            <input
                                                type="number"
                                                id="regional_rate"
                                                name="regional_rate"
                                                value={formData.regional_rate}
                                                onChange={handleInputChange}
                                                className="form-input"
                                                placeholder={t('enter_regional_rate')}
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>

                                        {/* Overnight Rate */}
                                        <div className="space-y-2">
                                            <label htmlFor="overnight_rate" className="block text-sm font-bold text-gray-700 dark:text-white">
                                                {t('overnight_rate')} (₪)
                                            </label>
                                            <input
                                                type="number"
                                                id="overnight_rate"
                                                name="overnight_rate"
                                                value={formData.overnight_rate}
                                                onChange={handleInputChange}
                                                className="form-input"
                                                placeholder={t('enter_overnight_rate')}
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <Link href={`/security-companies/preview/${companyId}`} className="btn btn-outline-danger px-8 py-3">
                            {t('cancel')}
                        </Link>
                        <button type="submit" disabled={saving} className="btn btn-primary flex items-center gap-2 px-8 py-3">
                            {saving ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    {t('saving')}...
                                </>
                            ) : (
                                <>
                                    <IconSave className="w-5 h-5" />
                                    {t('update_security_company')}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditSecurityCompany;
