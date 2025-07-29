'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconEdit from '@/components/icon/icon-edit';
import IconCalendar from '@/components/icon/icon-calendar';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconDollarSign from '@/components/icon/icon-dollar-sign';
import IconUser from '@/components/icon/icon-user';
import IconTrendingUp from '@/components/icon/icon-trending-up';
import IconBox from '@/components/icon/icon-box';
import supabase from '@/lib/supabase';
import { getTranslation } from '@/i18n';
import Link from 'next/link';
import Image from 'next/image';

interface Car {
    id: string;
    created_at: string;
    title: string;
    year: number;
    status: string;
    type?: string;
    market_price: number;
    buy_price: number;
    sale_price: number;
    kilometers: number;
    provider: string;
    brand: string;
    desc?: string; // New description field
    features?: Array<{ label: string; value: string }>; // New features field
    images: string[];
    colors?: Array<{
        color: string;
        images: string[];
    }>;
    providers?: {
        id: string;
        name: string;
        address: string;
        phone: string;
    };
}

const CarPreview = () => {
    const { t } = getTranslation();
    const params = useParams();
    const router = useRouter();
    const [car, setCar] = useState<Car | null>(null);
    const [loading, setLoading] = useState(true);
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [selectedColorIndex, setSelectedColorIndex] = useState(0);
    const [colorImageUrls, setColorImageUrls] = useState<Record<number, string[]>>({});

    useEffect(() => {
        const fetchCar = async () => {
            if (!params?.id) return;

            try {
                const { data, error } = await supabase.from('cars').select('*, providers(id, name, address, phone)').eq('id', params.id).single();

                if (error) {
                    console.error('Error fetching car:', error);
                    return;
                }

                setCar(data); // Get image URLs from Supabase storage
                if (data.images && data.images.length > 0) {
                    const urls = await Promise.all(
                        data.images.map(async (imagePath: string) => {
                            const { data: urlData } = supabase.storage.from('cars').getPublicUrl(imagePath);
                            return urlData.publicUrl;
                        }),
                    );
                    setImageUrls(urls);
                }

                // Get color image URLs from Supabase storage
                if (data.colors && data.colors.length > 0) {
                    const colorUrls: Record<number, string[]> = {};

                    await Promise.all(
                        data.colors.map(async (colorData: any, colorIndex: number) => {
                            if (colorData.images && colorData.images.length > 0) {
                                const urls = await Promise.all(
                                    colorData.images.map(async (imagePath: string) => {
                                        const { data: urlData } = supabase.storage.from('cars').getPublicUrl(imagePath);
                                        return urlData.publicUrl;
                                    }),
                                );
                                colorUrls[colorIndex] = urls;
                            }
                        }),
                    );

                    setColorImageUrls(colorUrls);
                }
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };

        if (params?.id) {
            fetchCar();
        }
    }, [params?.id]);

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'available':
                return 'badge-outline-success';
            case 'sold':
                return 'badge-outline-danger';
            case 'reserved':
                return 'badge-outline-warning';
            case 'maintenance':
                return 'badge-outline-info';
            default:
                return 'badge-outline-primary';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'ILS',
        }).format(amount);
    };

    const formatKilometers = (km: number) => {
        return new Intl.NumberFormat().format(km) + ' km';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!car) {
        return (
            <div className="panel">
                <div className="text-center py-10">
                    <h3 className="text-lg font-semibold text-danger">{t('car_not_found')}</h3>
                    <Link href="/cars" className="btn btn-primary mt-4">
                        <IconArrowLeft className="ltr:mr-2 rtl:ml-2" />
                        {t('back_to_cars')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="container mx-auto p-6">
                <div className="flex items-center gap-5 mb-6">
                    <div onClick={() => router.back()}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mb-4 cursor-pointer text-primary rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </div>
                    {/* Breadcrumb Navigation */}
                    <ul className="flex space-x-2 rtl:space-x-reverse mb-4">
                        <li>
                            <Link href="/" className="text-primary hover:underline">
                                {t('home')}
                            </Link>
                        </li>
                        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                            <Link href="/cars" className="text-primary hover:underline">
                                {t('cars')}
                            </Link>
                        </li>
                        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                            <span>{t('car_details')}</span>
                        </li>
                    </ul>
                </div>

                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('car_details')}</h1>
                        <p className="text-gray-500">{car ? car.title : t('loading')}</p>
                    </div>
                    {car && (
                        <Link href={`/cars/edit/${car.id}`} className="btn btn-primary">
                            <IconEdit className="ltr:mr-2 rtl:ml-2" />
                            {t('edit_car')}
                        </Link>
                    )}
                </div>
            </div>

            <div className="container mx-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Images Gallery */}
                    <div className="lg:col-span-2">
                        <div className="panel h-full">
                            <div className="mb-5">
                                <h3 className="text-lg font-semibold">{t('car_images')}</h3>
                            </div>

                            {imageUrls.length > 0 ? (
                                <div>
                                    {/* Main Image */}
                                    <div className="mb-4">
                                        <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                                            <Image src={imageUrls[selectedImageIndex]} alt={car.title} fill className="object-cover" />
                                        </div>
                                    </div>

                                    {/* Thumbnail Grid */}
                                    {imageUrls.length > 1 && (
                                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                            {imageUrls.map((url, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setSelectedImageIndex(index)}
                                                    className={`relative aspect-square rounded-lg overflow-hidden transition-all ${
                                                        selectedImageIndex === index ? 'ring-2 ring-primary' : 'opacity-70 hover:opacity-100'
                                                    }`}
                                                >
                                                    <Image src={url} alt={`${car.title} ${index + 1}`} fill className="object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <IconBox className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                                    <p className="text-gray-500">{t('no_images_available')}</p>
                                </div>
                            )}
                        </div>

                        {/* Color Variants */}
                        {car && car.colors && car.colors.length > 0 && (
                            <div className="panel mt-6">
                                <div className="mb-5">
                                    <h3 className="text-lg font-semibold">{t('color_variants')}</h3>
                                </div>

                                <div className="space-y-6">
                                    {/* Color Selector */}
                                    <div className="flex gap-3 flex-wrap">
                                        {car.colors.map((colorData, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setSelectedColorIndex(index)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                                                    selectedColorIndex === index ? 'border-primary bg-primary/10 text-primary' : 'border-gray-300 hover:border-primary/50'
                                                }`}
                                            >
                                                <div className="w-6 h-6 rounded-full border-2 border-white shadow-md" style={{ backgroundColor: colorData.color }}></div>
                                                <span className="text-sm font-medium">{colorData.color.toUpperCase()}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Selected Color Images */}
                                    {colorImageUrls[selectedColorIndex] && colorImageUrls[selectedColorIndex].length > 0 && (
                                        <div>
                                            <h4 className="text-md font-medium mb-3">
                                                {t('color_images')} - {car.colors[selectedColorIndex].color.toUpperCase()}
                                            </h4>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                                {colorImageUrls[selectedColorIndex].map((url, imageIndex) => (
                                                    <div key={imageIndex} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                                                        <Image
                                                            src={url}
                                                            alt={`${car.title} ${car.colors![selectedColorIndex].color} ${imageIndex + 1}`}
                                                            fill
                                                            className="object-cover hover:scale-105 transition-transform cursor-pointer"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* No Images for Selected Color */}
                                    {(!colorImageUrls[selectedColorIndex] || colorImageUrls[selectedColorIndex].length === 0) && (
                                        <div className="text-center py-8">
                                            <IconBox className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                                            <p className="text-gray-500 text-sm">
                                                {t('no_images_available')} {t('for')} {car.colors[selectedColorIndex].color.toUpperCase()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Car Information */}
                    <div className="space-y-6">
                        {/* Basic Info */}
                        <div className="panel">
                            <div className="mb-5">
                                <h3 className="text-lg font-semibold">{t('basic_information')}</h3>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-primary mb-2">{car.title}</h2>
                                    <span className={`badge ${getStatusBadgeClass(car.status)}`}>{t(`status_${car.status}`)}</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center">
                                        <IconBox className="w-5 h-5 text-gray-400 ltr:mr-3 rtl:ml-3" />
                                        <span className="text-sm text-gray-600 ltr:mr-2 rtl:ml-2">{t('brand')}:</span>
                                        <span className="font-medium">{car.brand}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <IconCalendar className="w-5 h-5 text-gray-400 ltr:mr-3 rtl:ml-3" />
                                        <span className="text-sm text-gray-600 ltr:mr-2 rtl:ml-2">{t('year')}:</span>
                                        <span className="font-medium">{car.year}</span>
                                    </div>
                                    {car.type && (
                                        <div className="flex items-center">
                                            <IconBox className="w-5 h-5 text-gray-400 ltr:mr-3 rtl:ml-3" />
                                            <span className="text-sm text-gray-600 ltr:mr-2 rtl:ml-2">{t('car_type')}:</span>
                                            <span className="font-medium">{car.type}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center">
                                        <IconMapPin className="w-5 h-5 text-gray-400 ltr:mr-3 rtl:ml-3" />
                                        <span className="text-sm text-gray-600 ltr:mr-2 rtl:ml-2">{t('kilometers')}:</span>
                                        <span className="font-medium">{formatKilometers(car.kilometers)}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <IconUser className="w-5 h-5 text-gray-400 ltr:mr-3 rtl:ml-3" />
                                        <span className="text-sm text-gray-600 ltr:mr-2 rtl:ml-2">{t('provider')}:</span>
                                        <div className="font-medium">
                                            {car.providers ? (
                                                <div>
                                                    <div>{car.providers.name}</div>
                                                    <div className="text-xs text-gray-500">{car.providers.address}</div>
                                                    <div className="text-xs text-gray-500">{car.providers.phone}</div>
                                                </div>
                                            ) : (
                                                <span>{car.provider || '-'}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pricing Information */}
                        <div className="panel">
                            <div className="mb-5">
                                <h3 className="text-lg font-semibold">{t('pricing_information')}</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="flex items-center">
                                        <IconDollarSign className="w-5 h-5 text-gray-400 ltr:mr-2 rtl:ml-2" />
                                        <span className="text-sm text-gray-600">{t('market_price')}:</span>
                                    </div>
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(car.market_price)}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="flex items-center">
                                        <IconTrendingUp className="w-5 h-5 text-gray-400 ltr:mr-2 rtl:ml-2" /> <span className="text-sm text-gray-600">{t('buy_price')}:</span>
                                    </div>
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(car.buy_price)}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-primary/10 dark:bg-primary/20 rounded-lg border border-primary/20">
                                    <div className="flex items-center">
                                        <IconDollarSign className="w-5 h-5 text-primary ltr:mr-2 rtl:ml-2" />
                                        <span className="text-sm font-medium text-primary">{t('sale_price')}:</span>
                                    </div>
                                    <span className="font-bold text-lg text-primary">{formatCurrency(car.sale_price)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Car Description */}
                        {car.desc && (
                            <div className="panel">
                                <div className="mb-5">
                                    <h3 className="text-lg font-semibold">{t('car_description')}</h3>
                                </div>
                                <div className="text-gray-700 dark:text-gray-300 leading-relaxed">{car.desc}</div>
                            </div>
                        )}

                        {/* Car Features */}
                        {car.features && car.features.length > 0 && (
                            <div className="panel">
                                <div className="mb-5">
                                    <h3 className="text-lg font-semibold">خصائص السيارة</h3>
                                </div>
                                <div className="space-y-3">
                                    {car.features.map((feature, index) => (
                                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{feature.label}:</span>
                                            <span className="font-semibold text-gray-700 dark:text-gray-300">{feature.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Additional Information */}
                        <div className="panel">
                            <div className="mb-5">
                                <h3 className="text-lg font-semibold">{t('additional_information')}</h3>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">{t('car_id')}:</span>
                                    <span className="font-medium font-mono">{car.id}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">{t('created_at')}:</span>
                                    <span className="font-medium">{new Date(car.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">{t('total_images')}:</span>
                                    <span className="font-medium">{imageUrls.length}</span>
                                </div>
                                {car.colors && car.colors.length > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">{t('available_colors')}:</span>
                                        <span className="font-medium">{car.colors.length}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CarPreview;
