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
    market_price: number;
    value_price: number;
    sale_price: number;
    kilometers: number;
    provider: string;
    brand: string;
    images: string[];
}

const CarPreview = () => {
    const { t } = getTranslation();
    const params = useParams();
    const router = useRouter();
    const [car, setCar] = useState<Car | null>(null);
    const [loading, setLoading] = useState(true);
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    useEffect(() => {
        const fetchCar = async () => {
            if (!params?.id) return;

            try {
                const { data, error } = await supabase.from('cars').select('*').eq('id', params.id).single();

                if (error) {
                    console.error('Error fetching car:', error);
                    return;
                }

                setCar(data);

                // Get image URLs from Supabase storage
                if (data.images && data.images.length > 0) {
                    const urls = await Promise.all(
                        data.images.map(async (imagePath: string) => {
                            const { data: urlData } = supabase.storage.from('cars').getPublicUrl(imagePath);
                            return urlData.publicUrl;
                        }),
                    );
                    setImageUrls(urls);
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
            currency: 'USD',
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

                                    <div className="flex items-center">
                                        <IconMapPin className="w-5 h-5 text-gray-400 ltr:mr-3 rtl:ml-3" />
                                        <span className="text-sm text-gray-600 ltr:mr-2 rtl:ml-2">{t('kilometers')}:</span>
                                        <span className="font-medium">{formatKilometers(car.kilometers)}</span>
                                    </div>

                                    <div className="flex items-center">
                                        <IconUser className="w-5 h-5 text-gray-400 ltr:mr-3 rtl:ml-3" />
                                        <span className="text-sm text-gray-600 ltr:mr-2 rtl:ml-2">{t('provider')}:</span>
                                        <span className="font-medium">{car.provider}</span>
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
                                        <IconTrendingUp className="w-5 h-5 text-gray-400 ltr:mr-2 rtl:ml-2" />
                                        <span className="text-sm text-gray-600">{t('value_price')}:</span>
                                    </div>
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(car.value_price)}</span>
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

                        {/* Additional Information */}
                        <div className="panel">
                            <div className="mb-5">
                                <h3 className="text-lg font-semibold">{t('additional_information')}</h3>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">{t('car_id')}:</span>
                                    <span className="font-medium font-mono">{car.id}</span>
                                </div>{' '}
                                <div className="flex justify-between">
                                    <span className="text-gray-600">{t('created_at')}:</span>
                                    <span className="font-medium">{new Date(car.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">{t('total_images')}:</span>
                                    <span className="font-medium">{imageUrls.length}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CarPreview;
