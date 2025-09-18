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
    properties: string[] | { label: string; value: string }[] | null; // Support both old and new format
    requirements: string[] | { label: string; value: string }[] | null; // Support both old and new format
    suitable_for: string[] | null;
    pricing: { child?: number; teen?: number; adult?: number; guide?: number } | null;
};

export default function PreviewDestinationPage({ params }: { params: { id: string } }) {
    const { t } = getTranslation();
    const [loading, setLoading] = useState(true);
    const [item, setItem] = useState<Destination | null>(null);
    const [zoneName, setZoneName] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

                {/* Hero Section with Images */}
                {allImages.length > 0 && (
                    <div className="panel p-0 overflow-hidden">
                        <div className="relative">
                            <div className="aspect-video bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                                <img src={getPublicUrlFromPath(allImages[0])} alt={item.name} className="w-full h-full object-cover" />
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
                            {allImages.length > 1 && (
                                <div className="absolute bottom-4 right-4">
                                    <button
                                        onClick={() => setSelectedImage(allImages[0])}
                                        className="bg-black/50 text-white px-3 py-1 rounded-full text-sm hover:bg-black/70 transition-colors flex items-center gap-2"
                                    >
                                        <IconEye className="h-4 w-4" />+{allImages.length - 1} {t('more')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
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
                        {(item.suitable_for?.length || 0) > 0 && (
                            <div className="panel">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                        <IconUser className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('suitable_for')}</h3>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {item.suitable_for!.map((key) => (
                                        <span
                                            key={key}
                                            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-sm font-medium shadow-lg hover:shadow-xl transition-shadow"
                                        >
                                            {t(`suitable_${key}`)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Properties */}
                        {(item.properties?.length || 0) > 0 && (
                            <div className="panel">
                                <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">{t('destination_properties')}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {item.properties!.map((property, idx) => {
                                        // Handle both old format {label, value} and new format (string)
                                        const isOldFormat = typeof property === 'object' && 'label' in property;
                                        const label = isOldFormat ? property.label : property;
                                        const displayLabel = isOldFormat ? property.label : t(`property_${property}`);
                                        const value = isOldFormat ? property.value : '';

                                        return (
                                            <div
                                                key={idx}
                                                className="group p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary/50 hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800"
                                            >
                                                <div className="text-sm font-medium text-primary mb-1">{displayLabel}</div>
                                                {isOldFormat && value && <div className="font-semibold text-gray-900 dark:text-white">{value}</div>}
                                            </div>
                                        );
                                    })}
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
                                    { key: 'child', label: t('pricing_child'), value: pricing.child, color: 'from-blue-500 to-cyan-500' },
                                    { key: 'teen', label: t('pricing_teen'), value: pricing.teen, color: 'from-green-500 to-emerald-500' },
                                    { key: 'adult', label: t('pricing_adult'), value: pricing.adult, color: 'from-orange-500 to-red-500' },
                                    { key: 'guide', label: t('pricing_guide'), value: pricing.guide, color: 'from-purple-500 to-pink-500' },
                                ].map((price) => (
                                    <div key={price.key} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${price.color}`}></div>
                                            <span className="font-medium text-gray-700 dark:text-gray-300">{price.label}</span>
                                        </div>
                                        <span className="font-bold text-gray-900 dark:text-white">{price.value ? `$${price.value}` : '-'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Gallery Thumbnails */}
                        {allImages.length > 1 && (
                            <div className="panel">
                                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('gallery')}</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {allImages.slice(1, 5).map((imagePath, index) => (
                                        <div key={index} className="relative group cursor-pointer" onClick={() => setSelectedImage(imagePath)}>
                                            <img
                                                src={getPublicUrlFromPath(imagePath)}
                                                alt={`Gallery ${index + 1}`}
                                                className="w-full h-20 object-cover rounded-lg group-hover:opacity-80 transition-opacity"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                                                <IconEye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {allImages.length > 5 && (
                                    <button onClick={() => setSelectedImage(allImages[4])} className="w-full mt-3 py-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors">
                                        {t('view_all')} ({allImages.length} {t('images')})
                                    </button>
                                )}
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
