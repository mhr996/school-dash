'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Components
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconSave from '@/components/icon/icon-save';
import IconUser from '@/components/icon/icon-user';
import IconPhone from '@/components/icon/icon-phone';
import IconMail from '@/components/icon/icon-mail';
import IconCreditCard from '@/components/icon/icon-credit-card';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import CustomSelect from '@/components/elements/custom-select';

import { getTranslation } from '@/i18n';

interface SelectOption {
    value: string;
    label: string;
}

interface ParamedicForm {
    name: string;
    identity_number: string;
    phone: string;
    email: string;
    hourly_rate: number;
    daily_rate: number;
    regional_rate: number;
    overnight_rate: number;
    status: string;
    notes: string;
}

const EditParamedic = () => {
    const { t } = getTranslation();
    const router = useRouter();
    const params = useParams();
    const paramedicId = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<ParamedicForm>({
        name: '',
        identity_number: '',
        phone: '',
        email: '',
        hourly_rate: 0,
        daily_rate: 0,
        regional_rate: 0,
        overnight_rate: 0,
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

    useEffect(() => {
        const fetchParamedic = async () => {
            try {
                setLoading(true);

                const { data, error } = await supabase.from('paramedics').select('*').eq('id', paramedicId).single();

                if (error) {
                    console.error('Error fetching paramedic:', error);
                    setAlert({ message: t('error_loading_paramedic'), type: 'danger' });
                    return;
                }

                if (data) {
                    setFormData({
                        name: data.name || '',
                        identity_number: data.identity_number || '',
                        phone: data.phone || '',
                        email: data.email || '',
                        hourly_rate: data.hourly_rate || 0,
                        daily_rate: data.daily_rate || 0,
                        regional_rate: data.regional_rate || 0,
                        overnight_rate: data.overnight_rate || 0,
                        status: data.status || 'active',
                        notes: data.notes || '',
                    });
                }
            } catch (error) {
                console.error('Error fetching paramedic:', error);
                setAlert({ message: t('error_loading_paramedic'), type: 'danger' });
            } finally {
                setLoading(false);
            }
        };

        if (paramedicId) {
            fetchParamedic();
        }
    }, [paramedicId]);

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
                setAlert({ message: t('paramedic_name_required'), type: 'danger' });
                return;
            }

            if (!formData.identity_number.trim()) {
                setAlert({ message: t('identity_number_required'), type: 'danger' });
                return;
            }

            if (!formData.phone.trim()) {
                setAlert({ message: t('phone_required'), type: 'danger' });
                return;
            }

            const { error } = await supabase.from('paramedics').update(formData).eq('id', paramedicId).select().single();

            if (error) {
                if (error.code === '23505') {
                    // Unique constraint violation
                    throw new Error(t('identity_number_already_exists'));
                }
                throw error;
            }

            setAlert({ message: t('paramedic_updated_successfully'), type: 'success' });

            // Redirect to paramedics list after a short delay
            setTimeout(() => {
                router.push('/paramedics');
            }, 1500);
        } catch (error) {
            console.error('Error updating paramedic:', error);
            setAlert({
                message: error instanceof Error ? error.message : t('error_updating_paramedic'),
                type: 'danger',
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            {/* Header */}
            <div className="flex items-center gap-5 mb-6">
                <Link href="/paramedics" className="text-primary hover:text-primary/80">
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
                        <Link href="/paramedics" className="text-primary hover:underline">
                            {t('paramedics')}
                        </Link>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <span>{t('edit_paramedic')}</span>
                    </li>
                </ul>
            </div>

            <div className="mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <IconUser className="w-8 h-8 text-primary" />
                    {t('edit_paramedic')}
                </h1>
                <p className="text-gray-500 mt-2">{t('edit_paramedic_description')}</p>
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
                            {/* Paramedic Name */}
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                    <IconUser className="w-4 h-4 text-primary" />
                                    {t('paramedic_name')} <span className="text-red-500">*</span>
                                </label>
                                <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className="form-input" placeholder={t('enter_paramedic_name')} required />
                            </div>

                            {/* ID Number */}
                            <div className="space-y-2">
                                <label htmlFor="identity_number" className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                    <IconCreditCard className="w-4 h-4 text-primary" />
                                    {t('identity_number')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="identity_number"
                                    name="identity_number"
                                    value={formData.identity_number}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    placeholder={t('enter_identity_number')}
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
                            {/* Phone */}
                            <div className="space-y-2">
                                <label htmlFor="phone" className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                    <IconPhone className="w-4 h-4 text-primary" />
                                    {t('phone')} <span className="text-red-500">*</span>
                                </label>
                                <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} className="form-input" placeholder={t('enter_phone')} required />
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                    <IconMail className="w-4 h-4 text-primary" />
                                    {t('email')}
                                </label>
                                <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} className="form-input" placeholder={t('enter_email')} />
                            </div>
                        </div>
                    </div>

                    {/* Pricing Information */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                        <h3 className="text-lg font-semibold mb-4">{t('pricing_information')}</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Hourly Rate */}
                            <div className="space-y-2">
                                <label htmlFor="hourly_rate" className="block text-sm font-bold text-gray-700 dark:text-white">
                                    {t('hourly_rate')} ({t('sar')})
                                </label>
                                <input
                                    type="number"
                                    id="hourly_rate"
                                    name="hourly_rate"
                                    value={formData.hourly_rate}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    min="0"
                                    step="0.01"
                                    placeholder="0"
                                />
                            </div>

                            {/* Daily Rate */}
                            <div className="space-y-2">
                                <label htmlFor="daily_rate" className="block text-sm font-bold text-gray-700 dark:text-white">
                                    {t('daily_rate')} ({t('sar')})
                                </label>
                                <input
                                    type="number"
                                    id="daily_rate"
                                    name="daily_rate"
                                    value={formData.daily_rate}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    min="0"
                                    step="0.01"
                                    placeholder="0"
                                />
                            </div>

                            {/* Regional Rate */}
                            <div className="space-y-2">
                                <label htmlFor="regional_rate" className="block text-sm font-bold text-gray-700 dark:text-white">
                                    {t('regional_rate')} ({t('sar')})
                                </label>
                                <input
                                    type="number"
                                    id="regional_rate"
                                    name="regional_rate"
                                    value={formData.regional_rate}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    min="0"
                                    step="0.01"
                                    placeholder="0"
                                />
                            </div>

                            {/* Overnight Rate */}
                            <div className="space-y-2">
                                <label htmlFor="overnight_rate" className="block text-sm font-bold text-gray-700 dark:text-white">
                                    {t('overnight_rate')} ({t('sar')})
                                </label>
                                <input
                                    type="number"
                                    id="overnight_rate"
                                    name="overnight_rate"
                                    value={formData.overnight_rate}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    min="0"
                                    step="0.01"
                                    placeholder="0"
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
                        <button type="submit" disabled={saving} className="btn btn-primary flex items-center gap-2 px-8 py-3">
                            {saving ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    {t('saving')}...
                                </>
                            ) : (
                                <>
                                    <IconSave className="w-5 h-5" />
                                    {t('update_paramedic')}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditParamedic;
