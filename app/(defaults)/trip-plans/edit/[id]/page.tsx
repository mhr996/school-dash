'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getTranslation } from '@/i18n';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconSave from '@/components/icon/icon-save';
import CustomSelect, { SelectOption } from '@/components/elements/custom-select';
import dynamic from 'next/dynamic';
const MapSelector = dynamic(() => import('@/components/map/map-selector'), { ssr: false });
import { Alert } from '@/components/elements/alerts/elements-alerts-default';

type RateType = 'hourly' | 'daily' | 'regional' | 'overnight';

const EditTripPlan = ({ params }: { params: { id: string } }) => {
    const { t } = getTranslation();
    const router = useRouter();
    const supabase = createClientComponentClient();

    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

    // Sources
    const [schools, setSchools] = useState<any[]>([]);
    const [travelCompanies, setTravelCompanies] = useState<any[]>([]);
    const [paramedics, setParamedics] = useState<any[]>([]);
    const [guides, setGuides] = useState<any[]>([]);
    const [securityCompanies, setSecurityCompanies] = useState<any[]>([]);
    const [entertainments, setEntertainments] = useState<any[]>([]);

    // Form
    const [schoolId, setSchoolId] = useState('');
    const [schoolName, setSchoolName] = useState('');
    const [tripDate, setTripDate] = useState('');
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

    // Load data & existing record
    useEffect(() => {
        (async () => {
            try {
                const [schoolsRes, travelRes, paramedicsRes, guidesRes, securityRes, entertainmentRes, tripRes] = await Promise.all([
                    supabase.from('schools').select('id, name').order('name'),
                    supabase.from('travel_companies').select('id, name, pricing_data').order('name'),
                    supabase.from('paramedics').select('id, name, hourly_rate, daily_rate, regional_rate, overnight_rate').order('name'),
                    supabase.from('guides').select('id, name, hourly_rate, daily_rate, regional_rate, overnight_rate').order('name'),
                    supabase.from('security_companies').select('id, name').order('name'),
                    supabase.from('external_entertainment_companies').select('id, name, price').order('name'),
                    supabase.from('trip_plans').select('*').eq('id', params.id).single(),
                ]);

                setSchools(schoolsRes.data || []);
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
                    setDestinationName(trip.destination_name || '');
                    setDestinationAddress(trip.destination_address || '');
                    setLatLng({ lat: trip.destination_lat || null, lng: trip.destination_lng || null });
                    setTravelCompanyId(trip.travel_company_id || '');
                    setTravelVehicleType(trip.travel_vehicle_type || '');
                    setTravelArea(trip.travel_area || '');
                    setTravelPrice(Number(trip.travel_price || 0));
                    setSelectedParamedics((trip.paramedics_selection || []).map((p: any) => ({ id: p.id, rateType: p.rate_type, quantity: p.quantity })));
                    setSelectedGuides((trip.guides_selection || []).map((g: any) => ({ id: g.id, rateType: g.rate_type, quantity: g.quantity })));
                    setSecurityCompanyId(trip.security_company_id || '');
                    setSecurityPrice(Number(trip.security_price || 0));
                    setSelectedEntertainmentIds(trip.entertainment_ids || []);
                }
            } catch (e) {
                console.error('Error loading trip plan', e);
                setAlert({ message: t('error_loading_data'), type: 'danger' });
            }
        })();
    }, [params.id]);

    useEffect(() => {
        const s = schools.find((x) => x.id === schoolId);
        setSchoolName(s?.name || '');
    }, [schoolId, schools]);

    const totalPrice = useMemo(() => 0, []); // Recalculation is handled server-side on save/update in this simple scaffold

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const payload: any = {
                school_id: schoolId,
                school_name: schoolName,
                trip_date: tripDate || null,
                destination_name: destinationName || null,
                destination_address: destinationAddress || null,
                destination_lat: latLng.lat,
                destination_lng: latLng.lng,
                travel_company_id: travelCompanyId || null,
                travel_company_name: travelCompanies.find((c: any) => c.id === travelCompanyId)?.name || null,
                travel_vehicle_type: travelVehicleType || null,
                travel_area: travelArea || null,
                travel_price: Number(travelPrice || 0),
                paramedic_ids: selectedParamedics.map((p) => p.id),
                paramedics_selection: selectedParamedics.map((s) => ({ id: s.id, rate_type: s.rateType, quantity: s.quantity })),
                guide_ids: selectedGuides.map((g) => g.id),
                guides_selection: selectedGuides.map((s) => ({ id: s.id, rate_type: s.rateType, quantity: s.quantity })),
                security_company_id: securityCompanyId || null,
                security_company_name: securityCompanies.find((s: any) => s.id === securityCompanyId)?.name || null,
                security_price: Number(securityPrice || 0),
                entertainment_ids: selectedEntertainmentIds,
            };

            const { error } = await supabase.from('trip_plans').update(payload).eq('id', params.id);
            if (error) throw error;
            setAlert({ message: t('trip_plan_updated_successfully'), type: 'success' });
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        <div>
                            <label className="block text-sm font-bold mb-2">{t('destination_name')}</label>
                            <input className="form-input" value={destinationName} onChange={(e) => setDestinationName(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2">{t('destination_address')}</label>
                            <input className="form-input" value={destinationAddress} onChange={(e) => setDestinationAddress(e.target.value)} />
                        </div>
                    </div>

                    <MapSelector
                        initialPosition={latLng.lat && latLng.lng ? [latLng.lat, latLng.lng] : (undefined as any)}
                        onChange={(lat, lng) => setLatLng({ lat, lng })}
                        height="300px"
                        showSearch
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                        <div>
                            <label className="block text-sm font-bold mb-2">{t('vehicle_type')}</label>
                            <input className="form-input" value={travelVehicleType} onChange={(e) => setTravelVehicleType(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2">{t('area')}</label>
                            <input className="form-input" value={travelArea} onChange={(e) => setTravelArea(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2">{t('travel_price')}</label>
                            <input type="number" min={0} className="form-input" value={travelPrice} onChange={(e) => setTravelPrice(parseFloat(e.target.value) || 0)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                        <div>
                            <label className="block text-sm font-bold mb-2">{t('security_price')}</label>
                            <input type="number" min={0} className="form-input" value={securityPrice} onChange={(e) => setSecurityPrice(parseFloat(e.target.value) || 0)} />
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
