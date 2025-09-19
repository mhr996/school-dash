'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getTranslation } from '@/i18n';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconSave from '@/components/icon/icon-save';
import IconMapPin from '@/components/icon/icon-map-pin';
import CustomSelect, { SelectOption } from '@/components/elements/custom-select';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';

interface Destination {
    id: string;
    name: string;
    address: string | null;
    description: string | null;
}

type RateType = 'hourly' | 'daily' | 'regional' | 'overnight';

const EditTripPlan = ({ params }: { params: { id: string } }) => {
    const { t } = getTranslation();
    const router = useRouter();
    const supabase = createClientComponentClient();

    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

    // Sources
    const [schools, setSchools] = useState<any[]>([]);
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [travelCompanies, setTravelCompanies] = useState<any[]>([]);
    const [paramedics, setParamedics] = useState<any[]>([]);
    const [guides, setGuides] = useState<any[]>([]);
    const [securityCompanies, setSecurityCompanies] = useState<any[]>([]);
    const [entertainments, setEntertainments] = useState<any[]>([]);

    // Form
    const [schoolId, setSchoolId] = useState('');
    const [schoolName, setSchoolName] = useState('');
    const [tripDate, setTripDate] = useState('');
    const [destinationId, setDestinationId] = useState<string>('');

    const [travelCompanyId, setTravelCompanyId] = useState('');

    const [selectedParamedics, setSelectedParamedics] = useState<string[]>([]);
    const [selectedGuides, setSelectedGuides] = useState<string[]>([]);
    const [securityCompanyId, setSecurityCompanyId] = useState('');
    const [selectedEntertainmentIds, setSelectedEntertainmentIds] = useState<string[]>([]);

    // Load data & existing record
    useEffect(() => {
        (async () => {
            try {
                const [schoolsRes, destinationsRes, travelRes, paramedicsRes, guidesRes, securityRes, entertainmentRes, tripRes] = await Promise.all([
                    supabase.from('schools').select('id, name').order('name'),
                    supabase.from('destinations').select('id, name, address, description').order('name'),
                    supabase.from('travel_companies').select('id, name, pricing_data').order('name'),
                    supabase.from('paramedics').select('id, name, hourly_rate, daily_rate, regional_rate, overnight_rate').order('name'),
                    supabase.from('guides').select('id, name, hourly_rate, daily_rate, regional_rate, overnight_rate').order('name'),
                    supabase.from('security_companies').select('id, name').order('name'),
                    supabase.from('external_entertainment_companies').select('id, name, price').order('name'),
                    supabase.from('trip_plans').select('*').eq('id', params.id).single(),
                ]);

                setSchools(schoolsRes.data || []);
                setDestinations((destinationsRes.data || []) as Destination[]);
                setTravelCompanies(travelRes.data || []);
                setParamedics(paramedicsRes.data || []);
                setGuides(guidesRes.data || []);
                setSecurityCompanies(securityRes.data || []);
                setEntertainments(entertainmentRes.data || []);

                const trip = tripRes.data;
                if (trip) {
                    setSchoolId(trip.school_id || '');
                    setSchoolName(trip.school_name || '');
                    setTripDate(trip.trip_date || '');

                    // Handle destination: prefer destination_id, fallback to old format
                    if (trip.destination_id) {
                        setDestinationId(trip.destination_id);
                    } else {
                        // For backward compatibility, if no destination_id but has destination_name,
                        // try to find matching destination
                        if (trip.destination_name && destinationsRes.data) {
                            const matchingDestination = destinationsRes.data.find((d: any) => d.name.toLowerCase() === trip.destination_name.toLowerCase());
                            if (matchingDestination) {
                                setDestinationId(matchingDestination.id);
                            }
                        }
                    }

                    setTravelCompanyId(trip.travel_company_id || '');

                    // Convert old complex structure to simple string arrays
                    setSelectedParamedics((trip.paramedics_selection || []).map((p: any) => p.id).filter(Boolean));
                    setSelectedGuides((trip.guides_selection || []).map((g: any) => g.id).filter(Boolean));
                    setSecurityCompanyId(trip.security_company_id || '');
                    setSelectedEntertainmentIds(trip.entertainment_ids || []);
                }
            } catch (e) {
                console.error('Error loading trip plan', e);
                setAlert({ message: t('error_loading_data'), type: 'danger' });
            }
        })();
    }, [params.id]);

    // Options builders
    const schoolOptions: SelectOption[] = useMemo(() => schools.map((s: any) => ({ value: s.id, label: s.name })), [schools]);
    const destinationOptions: SelectOption[] = useMemo(
        () =>
            destinations.map((d) => ({
                value: d.id,
                label: d.name,
                description: d.address || undefined,
            })),
        [destinations],
    );
    const travelOptions: SelectOption[] = useMemo(() => travelCompanies.map((c: any) => ({ value: c.id, label: c.name })), [travelCompanies]);

    useEffect(() => {
        const s = schools.find((x) => x.id === schoolId);
        setSchoolName(s?.name || '');
    }, [schoolId, schools]);

    const totalPrice = useMemo(() => 0, []); // Recalculation is handled server-side on save/update in this simple scaffold

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!destinationId) {
            setAlert({ message: t('destination_required'), type: 'danger' });
            return;
        }
        try {
            setLoading(true);
            const selectedDestination = destinations.find((d) => d.id === destinationId);
            const payload: any = {
                school_id: schoolId,
                school_name: schoolName,
                trip_date: tripDate || null,
                destination_id: destinationId,
                destination_name: selectedDestination?.name || null,
                destination_address: selectedDestination?.address || null,
                travel_company_id: travelCompanyId || null,
                travel_company_name: travelCompanies.find((c: any) => c.id === travelCompanyId)?.name || null,
                paramedic_ids: selectedParamedics.filter(Boolean),
                paramedics_selection: selectedParamedics.filter(Boolean).map((id) => ({ id, rate_type: 'daily', quantity: 1 })),
                guide_ids: selectedGuides.filter(Boolean),
                guides_selection: selectedGuides.filter(Boolean).map((id) => ({ id, rate_type: 'daily', quantity: 1 })),
                security_company_id: securityCompanyId || null,
                security_company_name: securityCompanies.find((s: any) => s.id === securityCompanyId)?.name || null,
                entertainment_ids: selectedEntertainmentIds,
            };

            const { error } = await supabase.from('trip_plans').update(payload).eq('id', params.id);
            if (error) throw error;
            setAlert({ message: t('trip_plan_updated_successfully'), type: 'success' });

            // Redirect to trip plans list after a short delay
            setTimeout(() => {
                router.push('/trip-plans');
            }, 700);
        } catch (e) {
            console.error(e);
            setAlert({ message: t('error_updating_trip_plan'), type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    // Minimal UI: allow editing core fields; reuse similar structure as Add page but reduced for brevity
    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center gap-5 mb-6">
                <Link href="/trip-plans" className="text-primary hover:text-primary/80">
                    <IconArrowLeft className="h-7 w-7" />
                </Link>
                <ul className="flex space-x-2 rtl:space-x-reverse">
                    <li>
                        <Link href="/" className="text-primary hover:underline">
                            {t('home')}
                        </Link>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <Link href="/trip-plans" className="text-primary hover:underline">
                            {t('trip_plans')}
                        </Link>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <span>{t('edit_trip_plan')}</span>
                    </li>
                </ul>
            </div>

            <div className="mb-6">
                <h1 className="text-3xl font-bold">{t('edit_trip_plan')}</h1>
                <p className="text-gray-500 mt-2">{t('edit_trip_plan_description')}</p>
            </div>

            {alert && (
                <div className="fixed top-4 right-4 z-50 min-w-80 max-w-md">
                    <Alert type={alert.type} title={alert.type === 'success' ? t('success') : t('error')} message={alert.message} onClose={() => setAlert(null)} />
                </div>
            )}

            <div className="panel">
                <form onSubmit={handleUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                        <div>
                            <label className="block text-sm font-bold mb-2">{t('school')}</label>
                            <CustomSelect
                                options={schools.map((s) => ({ value: s.id, label: s.name }))}
                                value={schoolId}
                                onChange={(v) => setSchoolId(v as string)}
                                placeholder={t('select_school')}
                                searchable
                                clearable
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2">{t('trip_date')}</label>
                            <input type="date" className="form-input" value={tripDate || ''} onChange={(e) => setTripDate(e.target.value)} />
                        </div>
                        <div className="md:col-span-2">
                            <div className="max-w-2xl">
                                <label className="block text-sm font-bold mb-2">{t('destination')}</label>
                                <CustomSelect
                                    options={destinationOptions}
                                    value={destinationId}
                                    onChange={(v) => setDestinationId(v as string)}
                                    placeholder={t('select_destination')}
                                    searchable
                                    clearable
                                />
                            </div>
                            {destinationId && (
                                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    {(() => {
                                        const selectedDestination = destinations.find((d) => d.id === destinationId);
                                        return selectedDestination ? (
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">{selectedDestination.name}</p>
                                                {selectedDestination.address && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                        <IconMapPin className="inline h-4 w-4 mr-1" />
                                                        {selectedDestination.address}
                                                    </p>
                                                )}
                                                {selectedDestination.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedDestination.description}</p>}
                                            </div>
                                        ) : null;
                                    })()}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-1 gap-6 max-w-2xl">
                        <div>
                            <label className="block text-sm font-bold mb-2">{t('travel_company')}</label>
                            <CustomSelect
                                options={travelCompanies.map((c) => ({ value: c.id, label: c.name }))}
                                value={travelCompanyId}
                                onChange={(v) => setTravelCompanyId(v as string)}
                                placeholder={t('select_travel_company')}
                                searchable
                                clearable
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-1 gap-6 max-w-2xl">
                        <div>
                            <label className="block text-sm font-bold mb-2">{t('security_company')}</label>
                            <CustomSelect
                                options={securityCompanies.map((s) => ({ value: s.id, label: s.name }))}
                                value={securityCompanyId}
                                onChange={(v) => setSecurityCompanyId(v as string)}
                                placeholder={t('select_security_company')}
                                searchable
                                clearable
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">{t('paramedics')}</h3>
                        <div className="space-y-3">
                            <button type="button" className="btn btn-outline-primary" onClick={() => setSelectedParamedics([...selectedParamedics, ''])}>
                                {t('add_paramedic')}
                            </button>
                            <div className="space-y-3 max-w-2xl">
                                {selectedParamedics.map((paramedic, idx) => (
                                    <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                                        <CustomSelect
                                            options={paramedics.map((p) => ({ value: p.id, label: p.name }))}
                                            value={paramedic}
                                            onChange={(v) => setSelectedParamedics(selectedParamedics.map((p, i) => (i === idx ? (v as string) : p)))}
                                            placeholder={t('select_paramedic')}
                                            searchable
                                            clearable
                                        />
                                        <button type="button" className="btn btn-secondary w-24" onClick={() => setSelectedParamedics(selectedParamedics.filter((_, i) => i !== idx))}>
                                            {t('delete')}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">{t('guides')}</h3>
                        <div className="space-y-3">
                            <button type="button" className="btn btn-outline-primary" onClick={() => setSelectedGuides([...selectedGuides, ''])}>
                                {t('add_guide')}
                            </button>
                            <div className="space-y-3 max-w-2xl">
                                {selectedGuides.map((guide, idx) => (
                                    <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                                        <CustomSelect
                                            options={guides.map((g) => ({ value: g.id, label: g.name }))}
                                            value={guide}
                                            onChange={(v) => setSelectedGuides(selectedGuides.map((g, i) => (i === idx ? (v as string) : g)))}
                                            placeholder={t('select_guide')}
                                            searchable
                                            clearable
                                        />
                                        <button type="button" className="btn btn-secondary w-24" onClick={() => setSelectedGuides(selectedGuides.filter((_, i) => i !== idx))}>
                                            {t('delete')}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">{t('entertainment')}</h3>
                        <div className="max-w-2xl">
                            <CustomSelect
                                options={entertainments.map((e) => ({ value: e.id, label: e.name }))}
                                value={selectedEntertainmentIds as any}
                                onChange={(v) => setSelectedEntertainmentIds(v as string[])}
                                placeholder={t('select_entertainment')}
                                searchable
                                clearable
                                multiple
                            />
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

export default EditTripPlan;
