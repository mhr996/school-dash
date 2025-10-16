'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabase';
import { getTranslation } from '@/i18n';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconEye from '@/components/icon/icon-eye';
import { getPublicUrlFromPath } from '@/utils/file-upload';

interface Destination {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    description: string | null;
    zone_id: string | null;
    thumbnail_path: string | null;
    gallery_paths: string[] | null;
    properties: string[] | null;
    requirements: string[] | null;
    suitable_for: string[] | null;
    pricing: { child?: number; teen?: number; adult?: number; guide?: number } | null;
}

interface TripPlan {
    id: string;
    created_at: string;
    school_name: string;
    destination_id?: string;
    destination_name?: string;
    destination_address?: string;
    trip_date?: string;
    travel_company_name?: string;
    travel_vehicle_type?: string;
    travel_area?: string;
    travel_price?: number;
    paramedics_selection?: any[];
    guides_selection?: any[];
    security_company_name?: string;
    security_price?: number;
    entertainment_selection?: any[];
    total_price: number;
    pricing_breakdown?: Record<string, number>;
}

const TripPlanPreview = ({ params }: { params: { id: string } }) => {
    const { t } = getTranslation();
    const router = useRouter();
    const [item, setItem] = useState<TripPlan | null>(null);
    const [destination, setDestination] = useState<Destination | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const { data, error } = await supabase.from('trip_plans').select('*').eq('id', params.id).single();
                if (error) throw error;
                setItem(data as TripPlan);

                // Fetch destination details if destination_id exists
                if (data.destination_id) {
                    const { data: destinationData, error: destinationError } = await supabase.from('destinations_with_details').select('*').eq('id', data.destination_id).single();

                    if (!destinationError && destinationData) {
                        setDestination(destinationData as Destination);
                    }
                }
            } catch (e) {
                console.error('Error loading trip plan', e);
            } finally {
                setLoading(false);
            }
        })();
    }, [params.id]);

    if (loading) return <div className="p-6">{t('loading')}</div>;
    if (!item)
        return (
            <div className="p-6">
                <div className="mb-4">
                    <Link href="/trip-plans" className="text-primary hover:text-primary/80">
                        <IconArrowLeft className="h-7 w-7" />
                    </Link>
                </div>
                <div className="panel">
                    <h1 className="text-2xl font-bold">{t('trip_plan_not_found')}</h1>
                    <p className="text-gray-500 mt-2">{t('trip_plan_not_found_description')}</p>
                    <div className="mt-4">
                        <Link href="/trip-plans" className="btn btn-primary">
                            {t('back_to_trip_plans')}
                        </Link>
                    </div>
                </div>
            </div>
        );

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
                        <span>{t('trip_plan_details')}</span>
                    </li>
                </ul>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="panel">
                        <h2 className="text-xl font-bold mb-4">{t('trip_information')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <div className="text-gray-500">{t('school')}</div>
                                <div className="font-semibold">{item.school_name}</div>
                            </div>
                            <div>
                                <div className="text-gray-500">{t('trip_date')}</div>
                                <div className="font-semibold">{item.trip_date ? new Date(item.trip_date).toLocaleDateString('tr-TR') : '-'}</div>
                            </div>
                            <div>
                                <div className="text-gray-500">{t('travel_company')}</div>
                                <div className="font-semibold">{item.travel_company_name || '-'}</div>
                                <div className="text-gray-500 text-xs">{[item.travel_vehicle_type, item.travel_area].filter(Boolean).join(' • ')}</div>
                            </div>
                        </div>
                    </div>

                    {/* Destination Details Panel */}
                    {destination ? (
                        <div className="panel">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <IconMapPin className="h-5 w-5 text-primary" />
                                {t('destination_details')}
                            </h2>

                            {/* Destination Header */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{destination.name}</h3>
                                {destination.address && (
                                    <p className="text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1">
                                        <IconMapPin className="h-4 w-4" />
                                        {destination.address}
                                    </p>
                                )}
                                {destination.phone && (
                                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                                        {t('phone')}: {destination.phone}
                                    </p>
                                )}
                            </div>

                            {/* Destination Image */}
                            {destination.thumbnail_path && (
                                <div className="mb-6">
                                    <img src={getPublicUrlFromPath(destination.thumbnail_path)} alt={destination.name} className="w-full h-48 object-cover rounded-lg" />
                                </div>
                            )}

                            {/* Description */}
                            {destination.description && (
                                <div className="mb-6">
                                    <h4 className="font-semibold mb-2">{t('description')}</h4>
                                    <p className="text-gray-600 dark:text-gray-400">{destination.description}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Properties */}
                                {destination.properties && destination.properties.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-3">{t('properties')}</h4>
                                        <div className="space-y-2">
                                            {destination.properties.map((property, index) => (
                                                <div key={index} className="flex items-center gap-2 text-sm">
                                                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                                                    <span>{property}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Requirements */}
                                {destination.requirements && destination.requirements.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-3">{t('requirements')}</h4>
                                        <div className="space-y-2">
                                            {destination.requirements.map((requirement, index) => (
                                                <div key={index} className="flex items-center gap-2 text-sm">
                                                    <div className="w-2 h-2 bg-warning rounded-full flex-shrink-0"></div>
                                                    <span>{t(`service_${requirement}`)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Suitable For */}
                                {destination.suitable_for && destination.suitable_for.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-3">{t('suitable_for')}</h4>
                                        <div className="space-y-2">
                                            {destination.suitable_for.map((suitable, index) => (
                                                <div key={index} className="flex items-center gap-2 text-sm">
                                                    <div className="w-2 h-2 bg-success rounded-full flex-shrink-0"></div>
                                                    <span>{t(suitable)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Pricing */}
                            {destination.pricing && Object.keys(destination.pricing).length > 0 && (
                                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <h4 className="font-semibold mb-3">{t('destination_pricing')}</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        {destination.pricing.child && (
                                            <div>
                                                <span className="text-gray-500">{t('child')}: </span>
                                                <span className="font-semibold">{destination.pricing.child.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {destination.pricing.teen && (
                                            <div>
                                                <span className="text-gray-500">{t('teen')}: </span>
                                                <span className="font-semibold">{destination.pricing.teen.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {destination.pricing.adult && (
                                            <div>
                                                <span className="text-gray-500">{t('adult')}: </span>
                                                <span className="font-semibold">{destination.pricing.adult.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {destination.pricing.guide && (
                                            <div>
                                                <span className="text-gray-500">{t('guide')}: </span>
                                                <span className="font-semibold">{destination.pricing.guide.toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Gallery */}
                            {destination.gallery_paths && destination.gallery_paths.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="font-semibold mb-3">{t('gallery')}</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {destination.gallery_paths.map((imagePath, index) => (
                                            <div key={index} className="aspect-square">
                                                <img
                                                    src={getPublicUrlFromPath(imagePath)}
                                                    alt={`${destination.name} ${index + 1}`}
                                                    className="w-full h-full object-cover rounded-lg hover:opacity-75 transition-opacity cursor-pointer"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        // Fallback for trip plans without linked destinations (backward compatibility)
                        item.destination_name && (
                            <div className="panel">
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <IconMapPin className="h-5 w-5 text-primary" />
                                    {t('destination')}
                                </h2>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.destination_name}</h3>
                                    {item.destination_address && (
                                        <p className="text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1">
                                            <IconMapPin className="h-4 w-4" />
                                            {item.destination_address}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )
                    )}

                    <div className="panel">
                        <h2 className="text-xl font-bold mb-4">{t('services_and_staff')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <div className="text-gray-500 mb-1">{t('paramedics')}</div>
                                <ul className="space-y-1">
                                    {(item.paramedics_selection || []).length === 0 && <li className="text-gray-400">{t('none')}</li>}
                                    {(item.paramedics_selection || []).map((p: any, idx: number) => (
                                        <li key={idx}>
                                            <span className="font-semibold">{p.name}</span> — {t(p.rate_type + '_rate')} × {p.quantity} = {Number(p.total || 0).toFixed(2)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <div className="text-gray-500 mb-1">{t('guides')}</div>
                                <ul className="space-y-1">
                                    {(item.guides_selection || []).length === 0 && <li className="text-gray-400">{t('none')}</li>}
                                    {(item.guides_selection || []).map((g: any, idx: number) => (
                                        <li key={idx}>
                                            <span className="font-semibold">{g.name}</span> — {t(g.rate_type + '_rate')} × {g.quantity} = {Number(g.total || 0).toFixed(2)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <div className="text-gray-500 mb-1">{t('security')}</div>
                                <div>{item.security_company_name || t('none')}</div>
                            </div>
                            <div>
                                <div className="text-gray-500 mb-1">{t('entertainment')}</div>
                                <ul className="space-y-1">
                                    {(item.entertainment_selection || []).length === 0 && <li className="text-gray-400">{t('none')}</li>}
                                    {(item.entertainment_selection || []).map((e: any, idx: number) => (
                                        <li key={idx}>
                                            <span className="font-semibold">{e.name}</span> — {Number(e.price || 0).toFixed(2)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="panel">
                        <h2 className="text-xl font-bold mb-4">{t('pricing_summary')}</h2>
                        <ul className="space-y-1 text-sm">
                            <li>
                                {t('travel')}: <span className="font-semibold">{Number(item.travel_price || 0).toFixed(2)}</span>
                            </li>
                            <li>
                                {t('paramedics')}: <span className="font-semibold">{Number(item.pricing_breakdown?.paramedics || 0).toFixed(2)}</span>
                            </li>
                            <li>
                                {t('guides')}: <span className="font-semibold">{Number(item.pricing_breakdown?.guides || 0).toFixed(2)}</span>
                            </li>
                            <li>
                                {t('security')}: <span className="font-semibold">{Number(item.security_price || 0).toFixed(2)}</span>
                            </li>
                            <li>
                                {t('entertainment')}: <span className="font-semibold">{Number(item.pricing_breakdown?.entertainment || 0).toFixed(2)}</span>
                            </li>
                        </ul>
                        <div className="mt-3 text-lg">
                            {t('total_price')}: <span className="font-bold text-green-600">{Number(item.total_price || 0).toFixed(2)}</span>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <Link href={`/trip-plans/edit/${item.id}`} className="btn btn-primary">
                                {t('edit')}
                            </Link>
                            <Link href="/trip-plans" className="btn btn-secondary">
                                {t('back_to_trip_plans')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TripPlanPreview;
