'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getTranslation } from '@/i18n';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import IconArrowLeft from '@/components/icon/icon-arrow-left';

const PreviewZone = ({ params }: { params: { id: string } }) => {
    const { t } = getTranslation();
    const supabase = createClientComponentClient();
    const [zone, setZone] = useState<any | null>(null);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        (async () => {
            const { data, error } = await supabase.from('zones').select('*').eq('id', params.id).single();
            if (error || !data) {
                setNotFound(true);
                return;
            }
            setZone(data);
        })();
    }, [params.id]);

    if (notFound) {
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
                            <span>{t('preview')}</span>
                        </li>
                    </ul>
                </div>
                <div className="panel">
                    <div className="p-6 text-center text-gray-500">{t('not_found')}</div>
                </div>
            </div>
        );
    }

    if (!zone) return null;

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
                        <span>{t('preview')}</span>
                    </li>
                </ul>
            </div>

            <div className="mb-6">
                <h1 className="text-3xl font-bold">{t('zone_details')}</h1>
                <p className="text-gray-500 mt-2">{t('zone_overview_description')}</p>
            </div>

            <div className="panel">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                    <div>
                        <div className="text-sm text-gray-500">{t('name')}</div>
                        <div className="font-semibold">{zone.name}</div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-500">{t('status')}</div>
                        <div className="font-semibold">{zone.is_active ? t('active') : t('inactive')}</div>
                    </div>
                    <div className="md:col-span-2">
                        <div className="text-sm text-gray-500">{t('address')}</div>
                        <div className="font-semibold">{zone.address || '-'}</div>
                    </div>
                    <div className="md:col-span-2">
                        <div className="text-sm text-gray-500">{t('description')}</div>
                        <div className="font-semibold whitespace-pre-wrap">{zone.description || '-'}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default PreviewZone;
