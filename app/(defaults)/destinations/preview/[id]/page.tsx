'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import supabase from '@/lib/supabase';
import { getTranslation } from '@/i18n';
import PageBreadcrumb from '@/components/layouts/page-breadcrumb';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconEdit from '@/components/icon/icon-edit';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconPhone from '@/components/icon/icon-phone';
import IconUser from '@/components/icon/icon-user';
import IconEye from '@/components/icon/icon-eye';
import IconX from '@/components/icon/icon-x';
import { getPublicUrlFromPath } from '@/utils/file-upload';

type Destination = {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    description: string | null;
    zone_id: string | null;
    thumbnail_path: string | null;
    gallery_paths: string[] | null;
    requirements: string[] | { label: string; value: string }[] | null; // Support both old and new format
    pricing: { student?: number; crew?: number } | null;
};

type DestinationProperty = {
    id: string;
    value: string;
    icon: string | null;
};

type SuitableForOption = {
    id: string;
    value: string;
};

export default function PreviewDestinationPage({ params }: { params: { id: string } }) {
    const { t } = getTranslation();
    const [loading, setLoading] = useState(true);
    const [item, setItem] = useState<Destination | null>(null);
    const [zoneName, setZoneName] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [properties, setProperties] = useState<DestinationProperty[]>([]);
    const [suitableFor, setSuitableFor] = useState<SuitableForOption[]>([]);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase.from('destinations').select('*').eq('id', params.id).single();
                if (error) throw error;
                setItem(data as Destination);
                if (data.zone_id) {
                    const { data: z } = await supabase.from('zones').select('name').eq('id', data.zone_id).single();
                    setZoneName(z?.name || null);
                }

                // Load properties from junction table
                const { data: propData, error: propError } = await supabase
                    .from('destination_properties_link')
                    .select(
                        `
                        destination_properties (
                            id,
                            value,
                            icon
                        )
                    `,
                    )
                    .eq('destination_id', params.id);

                if (!propError && propData) {
                    setProperties(propData.map((item: any) => item.destination_properties).filter(Boolean));
                }

                // Load suitable-for from junction table
                const { data: suitableData, error: suitableError } = await supabase
                    .from('destination_suitable_for_link')
                    .select(
                        `
                        suitable_for_options (
                            id,
                            value,
                            icon
                        )
                    `,
                    )
                    .eq('destination_id', params.id);

                if (!suitableError && suitableData) {
                    setSuitableFor(suitableData.map((item: any) => item.suitable_for_options).filter(Boolean));
                }
            } catch (e) {
                console.error('Error loading destination', e);
            } finally {
                setLoading(false);
            }
        })();
    }, [params.id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!item) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">{t('not_found')}</h2>
                    <Link href="/destinations" className="btn btn-primary">
                        {t('back')}
                    </Link>
                </div>
            </div>
        );
    }

    const pricing = item.pricing || {};
    const allImages = [...(item.thumbnail_path ? [item.thumbnail_path] : []), ...(item.gallery_paths || [])];

    return (
        <div className="container mx-auto p-6">
            <PageBreadcrumb section="destinations" backUrl="/destinations" items={[{ label: t('home'), href: '/' }, { label: t('destinations'), href: '/destinations' }, { label: item.name }]} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <IconMapPin className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{item.name}</h1>
                            <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                                <IconMapPin className="h-4 w-4" />
                                {zoneName || t('no_zone_assigned')}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Link href={`/destinations/edit/${item.id}`} className="btn btn-warning gap-2 shadow-lg hover:shadow-xl transition-shadow">
                            <IconEdit className="h-4 w-4" />
                            {t('edit')}
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Hero Section with Images */}
                        {allImages.length > 0 && (
                            <div className="panel p-0 overflow-hidden">
                                <div className="relative">
                                    <div className="aspect-square max-w-[400px] bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                                        <img src={getPublicUrlFromPath(allImages[0])} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                                        <div className="absolute inset-0 bg-black/20"></div>
                                        <div className="absolute bottom-4 left-4 text-white">
                                            <h2 className="text-xl font-semibold">{item.name}</h2>
                                            {item.address && (
                                                <p className="text-white/90 flex items-center gap-2 mt-1">
                                                    <IconMapPin className="h-4 w-4" />
                                                    {item.address}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Basic Information */}
                        <div className="panel">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <IconUser className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('basic_information')}</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                        <IconPhone className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('phone')}</div>
                                            <div className="font-semibold text-gray-900 dark:text-white">
                                                {item.phone ? (
                                                    <a href={`tel:${item.phone}`} className="hover:text-primary transition-colors">
                                                        {item.phone}
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                        <IconMapPin className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('destination_address')}</div>
                                            <div className="font-semibold text-gray-900 dark:text-white">{item.address || <span className="text-gray-400">-</span>}</div>
                                        </div>
                                    </div>
                                </div>

                                {item.description && (
                                    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">{t('description')}</div>
                                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{item.description}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Suitable For */}
                        {suitableFor.length > 0 && (
                            <div className="panel">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                        <IconUser className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('suitable_for')}</h3>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {suitableFor.map((option) => (
                                        <span
                                            key={option.id}
                                            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-sm font-medium shadow-lg hover:shadow-xl transition-shadow"
                                        >
                                            {option.value}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Properties */}
                        {properties.length > 0 && (
                            <div className="panel">
                                <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">{t('destination_properties')}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {properties.map((property) => (
                                        <div
                                            key={property.id}
                                            className="group p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary/50 hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800 flex items-center gap-3"
                                        >
                                            {property.icon && (
                                                <img
                                                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/destinations-properties/${property.icon}`}
                                                    alt=""
                                                    className="w-8 h-8 object-cover rounded"
                                                />
                                            )}
                                            <div className="text-sm font-medium text-primary">{property.value}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Requirements */}
                        {(item.requirements?.length || 0) > 0 && (
                            <div className="panel">
                                <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">{t('destination_requirements')}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {item.requirements!.map((requirement, idx) => {
                                        // Handle both old format {label, value} and new format (string)
                                        const isOldFormat = typeof requirement === 'object' && 'label' in requirement;
                                        const label = isOldFormat ? requirement.label : requirement;
                                        const displayLabel = isOldFormat ? requirement.label : t(`service_${requirement}`);
                                        const value = isOldFormat ? requirement.value : '';

                                        return (
                                            <div
                                                key={idx}
                                                className="group p-4 border border-orange-200 dark:border-orange-700 rounded-lg hover:border-orange-400 hover:shadow-md transition-all duration-200 bg-orange-50 dark:bg-orange-900/20"
                                            >
                                                <div className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">{displayLabel}</div>
                                                {isOldFormat && value && <div className="font-semibold text-gray-900 dark:text-white">{value}</div>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Gallery Section */}
                        {allImages.length > 1 && (
                            <div className="panel">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                        <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('gallery')}</h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {allImages.slice(1).map((imagePath, index) => (
                                        <div
                                            key={index}
                                            className="relative group cursor-pointer aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
                                            onClick={() => setSelectedImage(imagePath)}
                                        >
                                            <img
                                                src={getPublicUrlFromPath(imagePath)}
                                                alt={`Gallery ${index + 2}`}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                                                <div className="bg-white/90 dark:bg-gray-800/90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                    <IconEye className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Pricing Card */}
                        <div className="panel bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('pricing')}</h3>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { key: 'student', label: t('pricing_student'), value: pricing.student, color: 'from-blue-500 to-cyan-500' },
                                    { key: 'crew', label: t('pricing_crew'), value: pricing.crew, color: 'from-purple-500 to-pink-500' },
                                ].map((price) => (
                                    <div key={price.key} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${price.color}`}></div>
                                            <span className="font-medium text-gray-700 dark:text-gray-300">{price.label}</span>
                                        </div>
                                        <span className="font-bold text-gray-900 dark:text-white">{price.value ? `₪${price.value}` : '-'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Suitable For Quick Info */}
                        {suitableFor.length > 0 && (
                            <div className="panel bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                        <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('suitable_for')}</h3>
                                </div>
                                <div className="space-y-2">
                                    {suitableFor.map((option) => (
                                        <div key={option.id} className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{option.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Image Modal */}
                {selectedImage && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
                        <div className="relative max-w-4xl max-h-full">
                            <button onClick={() => setSelectedImage(null)} className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors">
                                <IconX className="h-8 w-8" />
                            </button>
                            <img src={getPublicUrlFromPath(selectedImage)} alt="Full size" className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
                            <div className="flex justify-center mt-4 gap-2">
                                {allImages.map((imagePath, index) => (
                                    <button
                                        key={index}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedImage(imagePath);
                                        }}
                                        className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                                            imagePath === selectedImage ? 'border-primary' : 'border-transparent hover:border-white/50'
                                        }`}
                                    >
                                        <img src={getPublicUrlFromPath(imagePath)} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
