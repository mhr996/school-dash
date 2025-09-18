'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getTranslation } from '@/i18n';
import IconSave from '@/components/icon/icon-save';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import CustomSelect, { SelectOption } from '@/components/elements/custom-select';
import PageBreadcrumb from '@/components/layouts/page-breadcrumb';

const EditZone = ({ params }: { params: { id: string } }) => {
    const { t } = getTranslation();
    const router = useRouter();
    const supabase = createClientComponentClient();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [address, setAddress] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [loading, setLoading] = useState(false);
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

    useEffect(() => {
        (async () => {
            try {
                const { data, error } = await supabase.from('zones').select('*').eq('id', params.id).single();
                if (error) throw error;
                if (!data) return;
                setName(data.name || '');
                setDescription(data.description || '');
                setAddress(data.address || '');
                setIsActive(!!data.is_active);
            } catch (e) {
                console.error(e);
                setAlert({ message: t('error_loading_data'), type: 'danger' });
            }
        })();
    }, [params.id]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const { error } = await supabase
                .from('zones')
                .update({ name: name.trim(), description: description || null, address: address || null, is_active: isActive })
                .eq('id', params.id);
            if (error) throw error;
            setAlert({ message: t('zone_updated_successfully'), type: 'success' });

            // Redirect to zones list after a short delay
            setTimeout(() => {
                router.push('/zones');
            }, 700);
        } catch (e) {
            console.error(e);
            setAlert({ message: t('error_updating_zone'), type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <PageBreadcrumb section="zones" backUrl="/zones" items={[{ label: t('home'), href: '/' }, { label: t('zones'), href: '/zones' }, { label: t('edit_zone') }]} />

            <div className="mb-6">
                <h1 className="text-3xl font-bold">{t('edit_zone')}</h1>
                <p className="text-gray-500 mt-2">{t('edit_zone_description')}</p>
            </div>

            {alert && (
                <div className="fixed top-4 right-4 z-50 min-w-80 max-w-md">
                    <Alert type={alert.type} title={alert.type === 'success' ? t('success') : t('error')} message={alert.message} onClose={() => setAlert(null)} />
                </div>
            )}

            <div className="panel">
                <form onSubmit={handleUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold mb-2">{t('name')}</label>
                            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('enter_zone_name')} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2">{t('status')}</label>
                            <CustomSelect
                                options={statusOptions}
                                value={isActive ? 'active' : 'inactive'}
                                onChange={(value) => setIsActive(value === 'active')}
                                placeholder={t('select_status')}
                                clearable={false}
                                searchable={false}
                            />
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
                        <button type="submit" disabled={loading} className="btn btn-primary flex items-center gap-2 px-8 py-3">
                            <IconSave className="w-5 h-5" />
                            {t('save_changes')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default EditZone;
