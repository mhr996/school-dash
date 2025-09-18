'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import supabase from '@/lib/supabase';
import CustomSelect from '@/components/elements/custom-select';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import { getTranslation } from '@/i18n';
import ImageUpload from '@/components/image-upload/image-upload';

interface EntertainmentCompanyForm {
    name: string;
    image: string;
    description: string;
    price: number;
    status: string;
}

export default function EditEntertainmentCompany() {
    const { t } = getTranslation();
    const router = useRouter();
    const params = useParams();
    const companyId = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<EntertainmentCompanyForm>({
        name: '',
        image: '',
        description: '',
        price: 0,
        status: 'active',
    });

    const [alert, setAlert] = useState<{ visible: boolean; message: string; type: 'success' | 'danger' }>({
        visible: false,
        message: '',
        type: 'success',
    });

    const statusOptions = [
        { value: 'active', label: t('active') },
        { value: 'inactive', label: t('inactive') },
    ];

    useEffect(() => {
        const fetchEntertainmentCompany = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase.from('external_entertainment_companies').select('*').eq('id', companyId).single();

                if (error) {
                    console.error('Error fetching entertainment company:', error);
                    setAlert({ visible: true, message: t('error_loading_entertainment_company'), type: 'danger' });
                    return;
                }

                if (data) {
                    setFormData({
                        name: data.name || '',
                        image: data.image || '',
                        description: data.description || '',
                        price: data.price || 0,
                        status: data.status || 'active',
                    });
                }
            } catch (error) {
                console.error('Error fetching entertainment company:', error);
                setAlert({ visible: true, message: t('error_loading_entertainment_company'), type: 'danger' });
            } finally {
                setLoading(false);
            }
        };

        if (companyId) {
            fetchEntertainmentCompany();
        }
    }, [companyId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'price' ? parseFloat(value) || 0 : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setAlert({ visible: true, message: t('entertainment_company_name_required'), type: 'danger' });
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.from('external_entertainment_companies').update(formData).eq('id', companyId);

            if (error) throw error;

            setAlert({ visible: true, message: t('entertainment_company_updated_successfully'), type: 'success' });

            // Redirect after a brief delay
            setTimeout(() => {
                router.push('/external-entertainment-companies');
            }, 700);
        } catch (error) {
            console.error('Error updating entertainment company:', error);
            setAlert({ visible: true, message: t('error_updating_entertainment_company'), type: 'danger' });
        } finally {
            setIsLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="panel border-white-light px-0 dark:border-[#1b2e4b]">
                <div className="px-5 py-10 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="mt-4 text-gray-500">{t('loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            {/* Header */}
            <div className="flex items-center gap-5 mb-6">
                <Link href="/external-entertainment-companies" className="text-primary hover:text-primary/80">
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
                        <Link href="/external-entertainment-companies" className="text-primary hover:underline">
                            {t('external_entertainment_companies')}
                        </Link>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <span>{t('edit_entertainment_company')}</span>
                    </li>
                </ul>
            </div>

            {/* Title */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold">{t('edit_entertainment_company')}</h1>
                <p className="text-gray-500 mt-2">{t('edit_entertainment_company_description')}</p>
            </div>

            {/* Alerts */}
            {alert.visible && (
                <div className="fixed top-4 right-4 z-50 min-w-80 max-w-md">
                    <Alert type={alert.type} title={alert.type === 'success' ? t('success') : t('error')} message={alert.message} onClose={() => setAlert({ ...alert, visible: false })} />
                </div>
            )}

            <div className="panel">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                {t('name')} *
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder={t('enter_entertainment_company_name')}
                                className="form-input"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="image" className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                {t('image_url')}
                            </label>
                            <div className="flex items-center gap-4">
                                <ImageUpload
                                    bucket="products"
                                    userId={companyId || 'entertainment-temp'}
                                    url={formData.image || null}
                                    onUploadComplete={(url) => setFormData((prev) => ({ ...prev, image: url }))}
                                    onError={(error) => setAlert({ visible: true, message: error, type: 'danger' })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                {t('price')} *
                            </label>
                            <input
                                id="price"
                                name="price"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.price}
                                onChange={handleInputChange}
                                placeholder={t('enter_price')}
                                className="form-input"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                {t('status')}
                            </label>
                            <CustomSelect
                                options={statusOptions}
                                value={formData.status}
                                onChange={(value: any) => setFormData((prev) => ({ ...prev, status: value as string }))}
                                placeholder={t('select_status')}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                            {t('description')}
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={4}
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder={t('enter_description')}
                            className="form-textarea"
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <Link href="/external-entertainment-companies" className="btn btn-outline-danger">
                            {t('cancel')}
                        </Link>
                        <button type="submit" disabled={isLoading} className="btn btn-primary">
                            {isLoading ? t('saving') : t('save_entertainment_company')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
