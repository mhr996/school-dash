'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getTranslation } from '@/i18n';
import IconPlus from '@/components/icon/icon-plus';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconCheck from '@/components/icon/icon-checks';
import CustomSelect, { SelectOption } from '@/components/elements/custom-select';
import dynamic from 'next/dynamic';
const MapSelector = dynamic(() => import('@/components/map/map-selector'), { ssr: false });
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import PageBreadcrumb from '@/components/layouts/page-breadcrumb';

interface School {
    id: string;
    name: string;
}
interface TravelCompany {
    id: string;
    name: string;
    pricing_data?: Record<string, Record<string, number>>;
}
interface PersonRate {
    id: string;
    name: string;
    hourly_rate?: number;
    daily_rate?: number;
    regional_rate?: number;
    overnight_rate?: number;
}
interface Entertainment {
    id: string;
    name: string;
    price?: number;
}

type RateType = 'hourly' | 'daily' | 'regional' | 'overnight';

const AddTripPlan = () => {
    const { t } = getTranslation();
    const router = useRouter();
    const supabase = createClientComponentClient();

    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

    // Data sources
    const [schools, setSchools] = useState<School[]>([]);
    const [travelCompanies, setTravelCompanies] = useState<TravelCompany[]>([]);
    const [paramedics, setParamedics] = useState<PersonRate[]>([]);
    const [guides, setGuides] = useState<PersonRate[]>([]);
    const [securityCompanies, setSecurityCompanies] = useState<{ id: string; name: string }[]>([]);
    const [entertainments, setEntertainments] = useState<Entertainment[]>([]);

    // Form state
    const [schoolId, setSchoolId] = useState<string>('');
    const [schoolName, setSchoolName] = useState<string>('');
    const [tripDate, setTripDate] = useState<string>('');
    const [destinationName, setDestinationName] = useState('');
    const [destinationAddress, setDestinationAddress] = useState('');
    const [latLng, setLatLng] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });

    const [travelCompanyId, setTravelCompanyId] = useState('');
    const [travelVehicleType, setTravelVehicleType] = useState('');
    const [travelArea, setTravelArea] = useState('');
    const [travelPrice, setTravelPrice] = useState(0);

    const [selectedParamedics, setSelectedParamedics] = useState<Array<{ id: string; rateType: RateType; quantity: number }>>([]);
    const [selectedGuides, setSelectedGuides] = useState<Array<{ id: string; rateType: RateType; quantity: number }>>([]);
    const [securityCompanyId, setSecurityCompanyId] = useState('');
    const [securityPrice, setSecurityPrice] = useState(0);
    const [selectedEntertainmentIds, setSelectedEntertainmentIds] = useState<string[]>([]);

    // Fetch data
    useEffect(() => {
        (async () => {
            try {
                const [schoolsRes, travelRes, paramedicsRes, guidesRes, securityRes, entertainmentRes] = await Promise.all([
                    supabase.from('schools').select('id, name').order('name'),
                    supabase.from('travel_companies').select('id, name, pricing_data').order('name'),
                    supabase.from('paramedics').select('id, name, hourly_rate, daily_rate, regional_rate, overnight_rate').order('name'),
                    supabase.from('guides').select('id, name, hourly_rate, daily_rate, regional_rate, overnight_rate').order('name'),
                    supabase.from('security_companies').select('id, name').order('name'),
                    supabase.from('external_entertainment_companies').select('id, name, price').order('name'),
                ]);

                setSchools((schoolsRes.data || []) as School[]);
                setTravelCompanies((travelRes.data || []) as TravelCompany[]);
                setParamedics((paramedicsRes.data || []) as PersonRate[]);
                setGuides((guidesRes.data || []) as PersonRate[]);
                setSecurityCompanies((securityRes.data || []) as any[]);
                setEntertainments((entertainmentRes.data || []) as Entertainment[]);
            } catch (e) {
                console.error('Error loading sources', e);
                setAlert({ message: t('error_loading_data'), type: 'danger' });
            }
        })();
    }, []);

    // Options builders
    const schoolOptions: SelectOption[] = useMemo(() => schools.map((s) => ({ value: s.id, label: s.name })), [schools]);
    const travelOptions: SelectOption[] = useMemo(() => travelCompanies.map((c) => ({ value: c.id, label: c.name })), [travelCompanies]);
    const personRateOptions = (list: PersonRate[]): SelectOption[] => list.map((p) => ({ value: p.id, label: p.name }));
    const securityOptions: SelectOption[] = useMemo(() => securityCompanies.map((c) => ({ value: c.id, label: c.name })), [securityCompanies]);
    const entertainmentOptions: SelectOption[] = useMemo(() => entertainments.map((e) => ({ value: e.id, label: `${e.name} — ${Number(e.price || 0).toFixed(2)}` })), [entertainments]);

    // Compute pricing
    const paramedicsTotal = useMemo(() => {
        return selectedParamedics.reduce((sum, sel) => {
            const p = paramedics.find((x) => x.id === sel.id);
            if (!p) return sum;
            const unit = sel.rateType === 'hourly' ? p.hourly_rate : sel.rateType === 'daily' ? p.daily_rate : sel.rateType === 'regional' ? p.regional_rate : p.overnight_rate;
            return sum + Number(unit || 0) * sel.quantity;
        }, 0);
    }, [selectedParamedics, paramedics]);

    const guidesTotal = useMemo(() => {
        return selectedGuides.reduce((sum, sel) => {
            const g = guides.find((x) => x.id === sel.id);
            if (!g) return sum;
            const unit = sel.rateType === 'hourly' ? g.hourly_rate : sel.rateType === 'daily' ? g.daily_rate : sel.rateType === 'regional' ? g.regional_rate : g.overnight_rate;
            return sum + Number(unit || 0) * sel.quantity;
        }, 0);
    }, [selectedGuides, guides]);

    const entertainmentTotal = useMemo(() => {
        return selectedEntertainmentIds.reduce((sum, id) => {
            const e = entertainments.find((x) => x.id === id);
            return sum + Number(e?.price || 0);
        }, 0);
    }, [selectedEntertainmentIds, entertainments]);

    const totalPrice = useMemo(
        () => Number(travelPrice || 0) + Number(securityPrice || 0) + paramedicsTotal + guidesTotal + entertainmentTotal,
        [travelPrice, securityPrice, paramedicsTotal, guidesTotal, entertainmentTotal],
    );

    // Update derived school name when chosen
    useEffect(() => {
        const school = schools.find((s) => s.id === schoolId);
        setSchoolName(school?.name || '');
    }, [schoolId, schools]);

    // Derive travel price from pricing matrix if possible
    useEffect(() => {
        if (!travelCompanyId || !travelVehicleType || !travelArea) return;
        const comp = travelCompanies.find((c) => c.id === travelCompanyId);
        const price = comp?.pricing_data?.[travelVehicleType]?.[travelArea];
        if (price !== undefined) setTravelPrice(price);
    }, [travelCompanyId, travelVehicleType, travelArea, travelCompanies]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!schoolId) return setAlert({ message: t('school_required'), type: 'danger' });
        try {
            setLoading(true);
            const payload = {
                school_id: schoolId,
                school_name: schoolName,
                trip_date: tripDate || null,
                destination_name: destinationName || null,
                destination_address: destinationAddress || null,
                destination_lat: latLng.lat,
                destination_lng: latLng.lng,
                travel_company_id: travelCompanyId || null,
                travel_company_name: travelCompanies.find((c) => c.id === travelCompanyId)?.name || null,
                travel_vehicle_type: travelVehicleType || null,
                travel_area: travelArea || null,
                travel_price: Number(travelPrice || 0),
                paramedic_ids: selectedParamedics.map((p) => p.id),
                paramedics_selection: selectedParamedics.map((s) => ({
                    id: s.id,
                    name: paramedics.find((p) => p.id === s.id)?.name,
                    rate_type: s.rateType,
                    quantity: s.quantity,
                    unit_price: (() => {
                        const p = paramedics.find((x) => x.id === s.id);
                        return s.rateType === 'hourly' ? p?.hourly_rate : s.rateType === 'daily' ? p?.daily_rate : s.rateType === 'regional' ? p?.regional_rate : p?.overnight_rate;
                    })(),
                    total: (() => {
                        const p = paramedics.find((x) => x.id === s.id);
                        const unit = s.rateType === 'hourly' ? p?.hourly_rate : s.rateType === 'daily' ? p?.daily_rate : s.rateType === 'regional' ? p?.regional_rate : p?.overnight_rate;
                        return Number(unit || 0) * s.quantity;
                    })(),
                })),
                paramedics_total: paramedicsTotal,
                guide_ids: selectedGuides.map((g) => g.id),
                guides_selection: selectedGuides.map((s) => ({
                    id: s.id,
                    name: guides.find((g) => g.id === s.id)?.name,
                    rate_type: s.rateType,
                    quantity: s.quantity,
                    unit_price: (() => {
                        const g = guides.find((x) => x.id === s.id);
                        return s.rateType === 'hourly' ? g?.hourly_rate : s.rateType === 'daily' ? g?.daily_rate : s.rateType === 'regional' ? g?.regional_rate : g?.overnight_rate;
                    })(),
                    total: (() => {
                        const g = guides.find((x) => x.id === s.id);
                        const unit = s.rateType === 'hourly' ? g?.hourly_rate : s.rateType === 'daily' ? g?.daily_rate : s.rateType === 'regional' ? g?.regional_rate : g?.overnight_rate;
                        return Number(unit || 0) * s.quantity;
                    })(),
                })),
                guides_total: guidesTotal,
                security_company_id: securityCompanyId || null,
                security_company_name: securityCompanies.find((s) => s.id === securityCompanyId)?.name || null,
                security_price: Number(securityPrice || 0),
                entertainment_ids: selectedEntertainmentIds,
                entertainment_selection: selectedEntertainmentIds.map((id) => ({
                    id,
                    name: entertainments.find((e) => e.id === id)?.name,
                    price: entertainments.find((e) => e.id === id)?.price || 0,
                })),
                entertainment_total: entertainmentTotal,
                total_price: totalPrice,
                pricing_breakdown: {
                    travel: Number(travelPrice || 0),
                    paramedics: paramedicsTotal,
                    guides: guidesTotal,
                    security: Number(securityPrice || 0),
                    entertainment: entertainmentTotal,
                },
            };

            const { data, error } = await supabase.from('trip_plans').insert([payload]).select().single();
            if (error) throw error;
            setAlert({ message: t('trip_plan_created_successfully'), type: 'success' });
            setTimeout(() => router.push(`/trip-plans/preview/${data.id}`), 600);
        } catch (e: any) {
            console.error(e);
            setAlert({ message: t('error_creating_trip_plan'), type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    // Animated stepper state
    const [step, setStep] = useState(0);
    const steps = [t('step_school'), t('step_destination'), t('step_travel'), t('step_paramedics'), t('step_guides'), t('step_security'), t('step_entertainment'), t('step_review')];
    const progressPercent = useMemo(() => (steps.length > 1 ? (step / (steps.length - 1)) * 94 : 0), [step, steps.length]);

    return (
        <div className="container mx-auto p-6">
            <PageBreadcrumb section="trip-plans" backUrl="/trip-plans" items={[{ label: t('home'), href: '/' }, { label: t('trip_plans'), href: '/trip-plans' }, { label: t('add_trip_plan') }]} />

            <div className="mb-6">
                <h1 className="text-3xl font-bold">{t('create_new_trip_plan')}</h1>
                <p className="text-gray-500 mt-2">{t('create_trip_plan_description')}</p>
            </div>

            {alert && (
                <div className="fixed top-4 right-4 z-50 min-w-80 max-w-md">
                    <Alert type={alert.type} title={alert.type === 'success' ? t('success') : t('error')} message={alert.message} onClose={() => setAlert(null)} />
                </div>
            )}

            {/* Stepper */}
            <div className="panel overflow-hidden">
                <div className="mb-6">
                    <div className="relative px-5">
                        {/* Background track aligned to circle centers (left/right padding = circle radius 20px) */}
                        <div className="absolute left-5 right-5 top-5 h-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true"></div>
                        {/* Animated progress bar */}
                        <div
                            className="absolute ltr:left-5 rtl:right-5 top-5 h-0.5 bg-primary transition-all duration-500 ease-in-out"
                            style={{ width: `${progressPercent}%` }}
                            aria-hidden="true"
                        ></div>
                        {/* Step markers */}
                        <div className="relative z-10 flex items-center justify-between">
                            {steps.map((s, i) => (
                                <div key={i} className="flex flex-col items-center">
                                    <div
                                        className={`h-10 w-10 bg-black rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                            i <= step ? 'border-primary bg-primary text-white' : 'border-gray-300 text-gray-400'
                                        }`}
                                    >
                                        {i < step ? <IconCheck className="w-5 h-5" /> : i === step ? <IconMapPin className="w-5 h-5" /> : <span className="text-sm">{i + 1}</span>}
                                    </div>
                                    <div className={`mt-2 text-center text-xs transition-colors duration-300 ${i <= step ? 'text-primary' : 'text-gray-400'}`}>{s}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    {/* Step 1: School & Date */}
                    {step === 0 && (
                        <div className="animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold mb-2">{t('school')}</label>
                                    <CustomSelect options={schoolOptions} value={schoolId} onChange={(v) => setSchoolId(v as string)} placeholder={t('select_school')} searchable clearable />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2">{t('trip_date')}</label>
                                    <input type="date" className="form-input" value={tripDate} onChange={(e) => setTripDate(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Destination */}
                    {step === 1 && (
                        <div className="animate-fade-in space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold mb-2">{t('destination_name')}</label>
                                    <input className="form-input" value={destinationName} onChange={(e) => setDestinationName(e.target.value)} placeholder={t('enter_destination_name')} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2">{t('destination_address')}</label>
                                    <input className="form-input" value={destinationAddress} onChange={(e) => setDestinationAddress(e.target.value)} placeholder={t('enter_destination_address')} />
                                </div>
                            </div>
                            <MapSelector onChange={(lat, lng) => setLatLng({ lat, lng })} height="350px" showSearch useCurrentLocationByDefault />
                            {latLng.lat && latLng.lng && (
                                <p className="text-xs text-gray-500">
                                    {t('selected_coordinates')}: {latLng.lat.toFixed(5)}, {latLng.lng.toFixed(5)}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Step 3: Travel */}
                    {step === 2 && (
                        <div className="animate-fade-in space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-bold mb-2">{t('travel_company')}</label>
                                    <CustomSelect
                                        options={travelOptions}
                                        value={travelCompanyId}
                                        onChange={(v) => setTravelCompanyId(v as string)}
                                        placeholder={t('select_travel_company')}
                                        searchable
                                        clearable
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2">{t('vehicle_type')}</label>
                                    <input className="form-input" value={travelVehicleType} onChange={(e) => setTravelVehicleType(e.target.value)} placeholder={t('vehicle_type')} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2">{t('area')}</label>
                                    <input className="form-input" value={travelArea} onChange={(e) => setTravelArea(e.target.value)} placeholder={t('area')} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-bold mb-2">{t('travel_price')}</label>
                                    <input type="number" min={0} className="form-input" value={travelPrice} onChange={(e) => setTravelPrice(parseFloat(e.target.value) || 0)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Paramedics */}
                    {step === 3 && (
                        <div className="animate-fade-in space-y-4">
                            <div className="space-y-3">
                                <button type="button" className="btn btn-outline-primary" onClick={() => setSelectedParamedics([...selectedParamedics, { id: '', rateType: 'daily', quantity: 1 }])}>
                                    {t('add_paramedic')}
                                </button>
                                <div className="space-y-3">
                                    {selectedParamedics.map((row, idx) => (
                                        <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                                            <CustomSelect
                                                options={personRateOptions(paramedics)}
                                                value={row.id}
                                                onChange={(v) => setSelectedParamedics(selectedParamedics.map((r, i) => (i === idx ? { ...r, id: v as string } : r)))}
                                                placeholder={t('select_paramedic')}
                                                searchable
                                                clearable
                                            />
                                            <CustomSelect
                                                options={[
                                                    { value: 'hourly', label: t('hourly_rate') },
                                                    { value: 'daily', label: t('daily_rate') },
                                                    { value: 'regional', label: t('regional_rate') },
                                                    { value: 'overnight', label: t('overnight_rate') },
                                                ]}
                                                value={row.rateType}
                                                onChange={(v) => setSelectedParamedics(selectedParamedics.map((r, i) => (i === idx ? { ...r, rateType: v as RateType } : r)))}
                                            />
                                            <input
                                                type="number"
                                                min={1}
                                                className="form-input"
                                                value={row.quantity}
                                                onChange={(e) => setSelectedParamedics(selectedParamedics.map((r, i) => (i === idx ? { ...r, quantity: parseInt(e.target.value) || 1 } : r)))}
                                            />
                                            <button type="button" className="btn btn-secondary" onClick={() => setSelectedParamedics(selectedParamedics.filter((_, i) => i !== idx))}>
                                                {t('delete')}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="text-sm text-gray-600">
                                    {t('section_total')}: <span className="font-semibold text-green-600">{paramedicsTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Guides */}
                    {step === 4 && (
                        <div className="animate-fade-in space-y-4">
                            <div className="space-y-3">
                                <button type="button" className="btn btn-outline-primary" onClick={() => setSelectedGuides([...selectedGuides, { id: '', rateType: 'daily', quantity: 1 }])}>
                                    {t('add_guide')}
                                </button>
                                <div className="space-y-3">
                                    {selectedGuides.map((row, idx) => (
                                        <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                                            <CustomSelect
                                                options={personRateOptions(guides)}
                                                value={row.id}
                                                onChange={(v) => setSelectedGuides(selectedGuides.map((r, i) => (i === idx ? { ...r, id: v as string } : r)))}
                                                placeholder={t('select_guide')}
                                                searchable
                                                clearable
                                            />
                                            <CustomSelect
                                                options={[
                                                    { value: 'hourly', label: t('hourly_rate') },
                                                    { value: 'daily', label: t('daily_rate') },
                                                    { value: 'regional', label: t('regional_rate') },
                                                    { value: 'overnight', label: t('overnight_rate') },
                                                ]}
                                                value={row.rateType}
                                                onChange={(v) => setSelectedGuides(selectedGuides.map((r, i) => (i === idx ? { ...r, rateType: v as RateType } : r)))}
                                            />
                                            <input
                                                type="number"
                                                min={1}
                                                className="form-input"
                                                value={row.quantity}
                                                onChange={(e) => setSelectedGuides(selectedGuides.map((r, i) => (i === idx ? { ...r, quantity: parseInt(e.target.value) || 1 } : r)))}
                                            />
                                            <button type="button" className="btn btn-secondary" onClick={() => setSelectedGuides(selectedGuides.filter((_, i) => i !== idx))}>
                                                {t('delete')}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="text-sm text-gray-600">
                                    {t('section_total')}: <span className="font-semibold text-green-600">{guidesTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 6: Security */}
                    {step === 5 && (
                        <div className="animate-fade-in space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-bold mb-2">{t('security_company')}</label>
                                    <CustomSelect
                                        options={securityOptions}
                                        value={securityCompanyId}
                                        onChange={(v) => setSecurityCompanyId(v as string)}
                                        placeholder={t('select_security_company')}
                                        searchable
                                        clearable
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2">{t('security_price')}</label>
                                    <input type="number" min={0} className="form-input" value={securityPrice} onChange={(e) => setSecurityPrice(parseFloat(e.target.value) || 0)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 7: Entertainment */}
                    {step === 6 && (
                        <div className="animate-fade-in space-y-4">
                            <CustomSelect
                                options={entertainmentOptions}
                                value={selectedEntertainmentIds as any}
                                onChange={(v) => setSelectedEntertainmentIds(v as string[])}
                                placeholder={t('select_entertainment')}
                                searchable
                                clearable
                                multiple
                            />
                            <div className="text-sm text-gray-600">
                                {t('section_total')}: <span className="font-semibold text-green-600">{entertainmentTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    )}

                    {/* Step 8: Review */}
                    {step === 7 && (
                        <div className="animate-fade-in space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded border border-gray-200 dark:border-gray-700">
                                    <h4 className="font-semibold mb-2">{t('trip_summary')}</h4>
                                    <ul className="space-y-1 text-sm">
                                        <li>
                                            <strong>{t('school')}:</strong> {schoolName || '-'}
                                        </li>
                                        <li>
                                            <strong>{t('trip_date')}:</strong> {tripDate || '-'}
                                        </li>
                                        <li>
                                            <strong>{t('destination')}:</strong> {destinationName || '-'}
                                        </li>
                                        <li>
                                            <strong>{t('travel_company')}:</strong> {travelCompanies.find((c) => c.id === travelCompanyId)?.name || '-'} ({travelVehicleType || '-'},{' '}
                                            {travelArea || '-'})
                                        </li>
                                    </ul>
                                </div>
                                <div className="p-4 rounded border border-gray-200 dark:border-gray-700">
                                    <h4 className="font-semibold mb-2">{t('pricing_summary')}</h4>
                                    <ul className="space-y-1 text-sm">
                                        <li>
                                            {t('travel')}: <span className="font-semibold">{Number(travelPrice || 0).toFixed(2)}</span>
                                        </li>
                                        <li>
                                            {t('paramedics')}: <span className="font-semibold">{paramedicsTotal.toFixed(2)}</span>
                                        </li>
                                        <li>
                                            {t('guides')}: <span className="font-semibold">{guidesTotal.toFixed(2)}</span>
                                        </li>
                                        <li>
                                            {t('security')}: <span className="font-semibold">{Number(securityPrice || 0).toFixed(2)}</span>
                                        </li>
                                        <li>
                                            {t('entertainment')}: <span className="font-semibold">{entertainmentTotal.toFixed(2)}</span>
                                        </li>
                                    </ul>
                                    <div className="mt-3 text-lg">
                                        {t('total_price')}: <span className="font-bold text-green-600">{totalPrice.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Wizard navigation */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex gap-2">
                            {step > 0 && (
                                <button type="button" className="btn btn-secondary" onClick={() => setStep((s) => s - 1)}>
                                    {t('back')}
                                </button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {step < steps.length - 1 && (
                                <button type="button" className="btn btn-primary" onClick={() => setStep((s) => s + 1)}>
                                    {t('next')}
                                </button>
                            )}
                            {step === steps.length - 1 && (
                                <button type="submit" disabled={loading} className="btn btn-primary flex items-center gap-2 px-8 py-3">
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            {t('saving')}
                                        </>
                                    ) : (
                                        <>
                                            <IconPlus className="w-5 h-5" />
                                            {t('create_trip_plan')}
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTripPlan;
