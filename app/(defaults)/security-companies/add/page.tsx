'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Components
import IconPlus from '@/components/icon/icon-plus';
import IconLock from '@/components/icon/icon-lock';
import IconPhone from '@/components/icon/icon-phone';
import IconMail from '@/components/icon/icon-mail';
import IconBuilding from '@/components/icon/icon-building';
import IconCreditCard from '@/components/icon/icon-credit-card';
import IconMapPin from '@/components/icon/icon-map-pin';
import PageBreadcrumb from '@/components/layouts/page-breadcrumb';
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

            // Redirect to security companies list after a short delay
            setTimeout(() => {
                router.push('/security-companies');
            }, 500);
        } catch (error: any) {
            console.error('Error adding security company:', error);
            setAlert({ message: error.message || t('error_adding_security_company'), type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6">
            {/* Header */}
            <PageBreadcrumb
                section="security-companies"
                backUrl="/security-companies"
                items={[{ label: t('home'), href: '/' }, { label: t('security_companies'), href: '/security-companies' }, { label: t('add_security_company') }]}
            />

            <div className="mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <IconLock className="w-8 h-8 text-primary" />
                    {t('add_new_security_company')}
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
                    {/* Basic Information */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                        <h3 className="text-lg font-semibold mb-4">{t('basic_information')}</h3>

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
                    </div>

                    {/* Contact Information */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                        <h3 className="text-lg font-semibold mb-4">{t('contact_information')}</h3>

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
                    </div>

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
                                    {t('add_security_company')}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddSecurityCompany;
