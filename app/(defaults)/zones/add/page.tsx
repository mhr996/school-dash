'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getTranslation } from '@/i18n';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';

const AddZone = () => {
    const { t } = getTranslation();
    const router = useRouter();
    const supabase = createClientComponentClient();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [address, setAddress] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setAlert({ message: t('zone_name_required'), type: 'danger' });
            return;
        }
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('zones')
                .insert([{ name: name.trim(), description: description || null, address: address || null, is_active: isActive }])
                .select()
                .single();
            if (error) throw error;
            setAlert({ message: t('zone_created_successfully'), type: 'success' });
            setTimeout(() => router.push(`/zones/preview/${data.id}`), 600);
        } catch (e) {
            console.error(e);
            setAlert({ message: t('error_creating_zone'), type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center gap-5 mb-6">
                <Link href="/zones" className="text-primary hover:text-primary/80">
                    <IconArrowLeft className="h-7 w-7" />
                </Link>
                <ul className="flex space-x-2 rtl:space-x-reverse">
                    <li>
                        <Link href="/" className="text-primary hover:underline">
                            {t('home')}
                        </Link>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <Link href="/zones" className="text-primary hover:underline">
                            {t('zones')}
                        </Link>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <span>{t('add_zone')}</span>
                    </li>
                </ul>
            </div>

            <div className="mb-6">
                <h1 className="text-3xl font-bold">{t('create_new_zone')}</h1>
                <p className="text-gray-500 mt-2">{t('create_zone_description')}</p>
            </div>

            {alert && (
                <div className="fixed top-4 right-4 z-50 min-w-80 max-w-md">
                    <Alert type={alert.type} title={alert.type === 'success' ? t('success') : t('error')} message={alert.message} onClose={() => setAlert(null)} />
                </div>
            )}

            <div className="panel">
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold mb-2">{t('name')}</label>
                            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('enter_zone_name')} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2">{t('status')}</label>
                            <select className="form-select" value={isActive ? 'active' : 'inactive'} onChange={(e) => setIsActive(e.target.value === 'active')}>
                                <option value="active">{t('active')}</option>
                                <option value="inactive">{t('inactive')}</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold mb-2">{t('address')}</label>
                            <input className="form-input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t('enter_zone_address')} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold mb-2">{t('description')}</label>
                            <textarea className="form-textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('enter_zone_description')} rows={4} />
                        </div>
                    </div>
                    <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                        <button type="submit" disabled={loading} className="btn btn-primary px-8 py-3">
                            {loading ? t('saving') : t('create_zone')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default AddZone;
