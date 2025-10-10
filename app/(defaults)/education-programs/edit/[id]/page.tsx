'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import supabase from '@/lib/supabase';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import { getTranslation } from '@/i18n';
import EducationProgramTabs from '@/components/education/education-program-tabs';

interface EducationProgramForm {
    name: string;
    image: string;
    description: string;
    price: number;
    status: string;
}

export default function EditEducationProgram() {
    const { t } = getTranslation();
    const router = useRouter();
    const params = useParams();
    const programId = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [programData, setProgramData] = useState<EducationProgramForm>({
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

    useEffect(() => {
        const fetchEducationProgram = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase.from('education_programs').select('*').eq('id', programId).single();

                if (error) {
                    console.error('Error fetching education program:', error);
                    setAlert({ visible: true, message: t('error_loading_education_program') || 'Error loading education program', type: 'danger' });
                    return;
                }

                if (data) {
                    setProgramData({
                        name: data.name || '',
                        image: data.image || '',
                        description: data.description || '',
                        price: data.price || 0,
                        status: data.status || 'active',
                    });
                }
            } catch (error) {
                console.error('Error fetching education program:', error);
                setAlert({ visible: true, message: t('error_loading_education_program') || 'Error loading education program', type: 'danger' });
            } finally {
                setLoading(false);
            }
        };

        if (programId) {
            fetchEducationProgram();
        }
    }, [programId]);

    const handleProgramUpdate = async () => {
        // Re-fetch the program data when tabs update it
        try {
            const { data, error } = await supabase.from('education_programs').select('*').eq('id', programId).single();

            if (error) {
                console.error('Error fetching education program:', error);
                return;
            }

            if (data) {
                setProgramData({
                    name: data.name || '',
                    image: data.image || '',
                    description: data.description || '',
                    price: data.price || 0,
                    status: data.status || 'active',
                });
            }
        } catch (error) {
            console.error('Error fetching education program:', error);
        }
    };

    if (loading) {
        return (
            <div className="panel border-white-light px-0 dark:border-[#1b2e4b]">
                <div className="px-5 py-10 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="mt-4 text-gray-500">{t('loading') || 'Loading...'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            {/* Header */}
            <div className="flex items-center gap-5 mb-6">
                <Link href="/education-programs" className="text-primary hover:text-primary/80">
                    <IconArrowLeft className="h-7 w-7" />
                </Link>

                {/* Breadcrumb Navigation */}
                <ul className="flex space-x-2 rtl:space-x-reverse">
                    <li>
                        <Link href="/" className="text-primary hover:underline">
                            {t('home') || 'Home'}
                        </Link>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <Link href="/education-programs" className="text-primary hover:underline">
                            {t('education_programs') || 'Education Programs'}
                        </Link>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <span>{t('edit_education_program') || 'Edit Education Program'}</span>
                    </li>
                </ul>
            </div>

            {/* Title */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold">{t('edit_education_program') || 'Edit Education Program'}</h1>
                <p className="text-gray-500 mt-2">{t('edit_education_program_description') || 'Update education program information and services'}</p>
            </div>

            {/* Alerts */}
            {alert.visible && (
                <div className="fixed top-4 right-4 z-50 min-w-80 max-w-md">
                    <Alert
                        type={alert.type}
                        title={alert.type === 'success' ? t('success') || 'Success' : t('error') || 'Error'}
                        message={alert.message}
                        onClose={() => setAlert({ ...alert, visible: false })}
                    />
                </div>
            )}

            {/* Tabbed Interface */}
            <EducationProgramTabs programId={programId} programData={programData} onUpdate={handleProgramUpdate} isServiceProvider={false} />
        </div>
    );
}
