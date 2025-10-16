'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTranslation } from '@/i18n';
import supabase from '@/lib/supabase';
import { getPublicUrlFromPath } from '@/utils/file-upload';
import IconX from '@/components/icon/icon-x';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconPhone from '@/components/icon/icon-phone';
import IconMail from '@/components/icon/icon-mail';
import IconShekelSign from '@/components/icon/icon-shekel-sign';
import IconClock from '@/components/icon/icon-clock';
import IconUser from '@/components/icon/icon-user';
import IconUsers from '@/components/icon/icon-users';
import IconUsersGroup from '@/components/icon/icon-users-group';
import IconHeart from '@/components/icon/icon-heart';
import IconSquareRotated from '@/components/icon/icon-square-rotated';
import IconStar from '@/components/icon/icon-star';
import IconCar from '@/components/icon/icon-car';
import IconBook from '@/components/icon/icon-book';
import IconPlayCircle from '@/components/icon/icon-play-circle';
import IconSearch from '@/components/icon/icon-search';

type ServiceCategory = 'all' | 'destinations' | 'guides' | 'paramedics' | 'security' | 'entertainment' | 'travel' | 'education';

interface ServiceItem {
    id: string;
    name: string;
    category: ServiceCategory;
    type: string;
    description?: string;
    image?: string;
    price?: number;
    hourlyRate?: number;
    dailyRate?: number;
    phone?: string;
    email?: string;
    address?: string;
    status?: string;
    zone?: string;
    properties?: Array<{ value: string; icon: string | null }>;
    suitableFor?: string[];
    rating?: number;
    [key: string]: any;
}

export default function ExplorePage() {
    const { t } = getTranslation();
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [filteredServices, setFilteredServices] = useState<ServiceItem[]>([]);
    const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
    const [tempPriceRange, setTempPriceRange] = useState<[number, number]>([0, 10000]);
    const [selectedZones, setSelectedZones] = useState<string[]>([]);
    const [availableZones, setAvailableZones] = useState<string[]>([]);
    const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
    const [availableProperties, setAvailableProperties] = useState<Array<{ value: string; icon: string | null }>>([]);
    const [selectedSuitableFor, setSelectedSuitableFor] = useState<string[]>([]);
    const [availableSuitableFor, setAvailableSuitableFor] = useState<string[]>([]);

    const categories = [
        { id: 'all' as ServiceCategory, label: t('all_services'), icon: IconStar, color: 'from-blue-500 to-blue-600', count: 0 },
        { id: 'destinations' as ServiceCategory, label: t('destinations'), icon: IconMapPin, color: 'from-purple-500 to-purple-600', count: 0 },
        { id: 'guides' as ServiceCategory, label: t('guides'), icon: IconUser, color: 'from-green-500 to-green-600', count: 0 },
        { id: 'paramedics' as ServiceCategory, label: t('paramedics'), icon: IconHeart, color: 'from-red-500 to-red-600', count: 0 },
        { id: 'security' as ServiceCategory, label: t('security'), icon: IconSquareRotated, color: 'from-yellow-500 to-yellow-600', count: 0 },
        { id: 'entertainment' as ServiceCategory, label: t('entertainment'), icon: IconPlayCircle, color: 'from-pink-500 to-pink-600', count: 0 },
        { id: 'travel' as ServiceCategory, label: t('travel_companies'), icon: IconCar, color: 'from-indigo-500 to-indigo-600', count: 0 },
        { id: 'education' as ServiceCategory, label: t('education_programs'), icon: IconBook, color: 'from-emerald-500 to-emerald-600', count: 0 },
    ];

    useEffect(() => {
        loadAllServices();
    }, []);

    useEffect(() => {
        filterServices();
    }, [selectedCategory, searchQuery, services, priceRange, selectedZones, selectedProperties, selectedSuitableFor]);

    useEffect(() => {
        // Extract unique zones, properties, and suitable_for from services
        const zones = Array.from(new Set(services.map((s) => s.zone).filter(Boolean) as string[]));
        setAvailableZones(zones);

        // Extract unique properties from destinations with icons
        const propertiesMap = new Map<string, string | null>();
        services
            .filter((s) => s.category === 'destinations' && s.properties)
            .forEach((s) => {
                s.properties?.forEach((prop) => {
                    if (!propertiesMap.has(prop.value)) {
                        propertiesMap.set(prop.value, prop.icon);
                    }
                });
            });
        const properties = Array.from(propertiesMap.entries()).map(([value, icon]) => ({ value, icon }));
        setAvailableProperties(properties);

        // Extract unique suitable_for from destinations (just values, no icons)
        const suitableFor = Array.from(
            new Set(
                services
                    .filter((s) => s.category === 'destinations' && s.suitableFor)
                    .flatMap((s) => s.suitableFor)
                    .filter(Boolean) as string[],
            ),
        );
        setAvailableSuitableFor(suitableFor);
    }, [services]);

    const loadAllServices = async () => {
        setLoading(true);
        try {
            const [{ data: destinations }, { data: guides }, { data: paramedics }, { data: security }, { data: entertainment }, { data: travel }, { data: education }, { data: zones }] =
                await Promise.all([
                    supabase.from('destinations_with_details').select('*').eq('is_active', true),
                    supabase.from('guides').select('*').eq('status', 'active'),
                    supabase.from('paramedics').select('*').eq('status', 'active'),
                    supabase.from('security_companies').select('*').eq('status', 'active'),
                    supabase.from('external_entertainment_companies').select('*').eq('status', 'active'),
                    supabase.from('travel_companies').select('*').eq('status', 'active'),
                    supabase.from('education_programs').select('*').eq('status', 'active'),
                    supabase.from('zones').select('id, name'),
                ]);

            const zoneMap = new Map(zones?.map((z) => [z.id, z.name]) || []);

            const allServices: ServiceItem[] = [
                ...(destinations?.map((d) => ({
                    id: d.id,
                    name: d.name,
                    category: 'destinations' as ServiceCategory,
                    type: t('destination'),
                    description: d.description,
                    image: d.thumbnail_path ? getPublicUrlFromPath(d.thumbnail_path) : undefined,
                    address: d.address,
                    phone: d.phone,
                    zone: d.zone_id ? zoneMap.get(d.zone_id) : undefined,
                    properties: Array.isArray(d.properties_details) ? d.properties_details.map((p: any) => ({ value: p.value, icon: p.icon })) : [],
                    suitableFor: Array.isArray(d.suitable_for_details) ? d.suitable_for_details.map((s: any) => s.value) : [],
                    pricing: d.pricing,
                })) || []),
                ...(guides?.map((g) => ({
                    id: g.id,
                    name: g.name,
                    category: 'guides' as ServiceCategory,
                    type: t('tour_guide'),
                    phone: g.phone,
                    email: g.email,
                    hourlyRate: g.hourly_rate,
                    dailyRate: g.daily_rate,
                    regionalRate: g.regional_rate,
                    overnightRate: g.overnight_rate,
                    identityNumber: g.identity_number,
                    notes: g.notes,
                })) || []),
                ...(paramedics?.map((p) => ({
                    id: p.id,
                    name: p.name,
                    category: 'paramedics' as ServiceCategory,
                    type: t('paramedic'),
                    phone: p.phone,
                    email: p.email,
                    hourlyRate: p.hourly_rate,
                    dailyRate: p.daily_rate,
                    regionalRate: p.regional_rate,
                    overnightRate: p.overnight_rate,
                    identityNumber: p.identity_number,
                    notes: p.notes,
                })) || []),
                ...(security?.map((s) => ({
                    id: s.id,
                    name: s.name,
                    category: 'security' as ServiceCategory,
                    type: t('security_company'),
                    phone: s.phone,
                    email: s.email,
                    address: s.address,
                    hourlyRate: s.hourly_rate,
                    dailyRate: s.daily_rate,
                    regionalRate: s.regional_rate,
                    overnightRate: s.overnight_rate,
                    taxNumber: s.tax_number,
                    licenseTypes: s.license_types,
                    weaponTypes: s.weapon_types,
                    notes: s.notes,
                })) || []),
                ...(entertainment?.map((e) => ({
                    id: e.id,
                    name: e.name,
                    category: 'entertainment' as ServiceCategory,
                    type: t('entertainment_company'),
                    description: e.description,
                    image: e.image,
                    price: e.price,
                })) || []),
                ...(travel?.map((tr) => ({
                    id: tr.id,
                    name: tr.name,
                    category: 'travel' as ServiceCategory,
                    type: t('travel_company'),
                    phone: tr.phone,
                    email: tr.email,
                    address: tr.address,
                    code: tr.code,
                    servicesOffered: tr.services_offered,
                    vehicleCount: tr.vehicle_count,
                    pricingData: tr.pricing_data,
                    notes: tr.notes,
                })) || []),
                ...(education?.map((ed) => ({
                    id: ed.id,
                    name: ed.name,
                    category: 'education' as ServiceCategory,
                    type: t('education_program'),
                    description: ed.description,
                    image: ed.image,
                    price: ed.price,
                })) || []),
            ];

            setServices(allServices);
        } catch (error) {
            console.error('Error loading services:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterServices = () => {
        let filtered = services;

        if (selectedCategory !== 'all') {
            filtered = filtered.filter((s) => s.category === selectedCategory);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (s) => s.name.toLowerCase().includes(query) || s.type.toLowerCase().includes(query) || s.description?.toLowerCase().includes(query) || s.address?.toLowerCase().includes(query),
            );
        }

        // Filter by price range
        filtered = filtered.filter((s) => {
            const price = s.price || s.dailyRate || 0;
            return price >= priceRange[0] && price <= priceRange[1];
        });

        // Filter by zones
        if (selectedZones.length > 0) {
            filtered = filtered.filter((s) => s.zone && selectedZones.includes(s.zone));
        }

        // Filter by properties (for destinations)
        if (selectedProperties.length > 0) {
            filtered = filtered.filter((s) => {
                if (s.category !== 'destinations' || !s.properties) return false;
                return selectedProperties.some((prop) => s.properties?.some((p) => p.value === prop));
            });
        }

        // Filter by suitable for (for destinations)
        if (selectedSuitableFor.length > 0) {
            filtered = filtered.filter((s) => {
                if (s.category !== 'destinations' || !s.suitableFor) return false;
                return selectedSuitableFor.some((suit) => s.suitableFor?.includes(suit));
            });
        }

        setFilteredServices(filtered);
    };

    const getCategoryCount = (categoryId: ServiceCategory) => {
        if (categoryId === 'all') return services.length;
        return services.filter((s) => s.category === categoryId).length;
    };

    const openServiceDetails = (service: ServiceItem) => {
        setSelectedService(service);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedService(null), 300);
    };

    const getCategoryIcon = (category: ServiceCategory) => {
        const cat = categories.find((c) => c.id === category);
        return cat?.icon || IconStar;
    };

    const getCategoryColor = (category: ServiceCategory) => {
        const cat = categories.find((c) => c.id === category);
        return cat?.color || 'from-gray-500 to-gray-600';
    };

    const getServiceIconPath = (category: ServiceCategory) => {
        const iconMap: { [key: string]: string } = {
            destinations: '/assets/services-icons/destination.png',
            guides: '/assets/services-icons/guide.png',
            paramedics: '/assets/services-icons/paramedic.png',
            security: '/assets/services-icons/security.png',
            entertainment: '/assets/services-icons/entertainment.png',
            travel: '/assets/services-icons/transportation.png',
            education: '/assets/services-icons/education.png',
        };
        return iconMap[category] || null;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20" dir={t('direction') || 'rtl'}>
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 py-12 px-6 shadow-2xl">
                <div className="absolute inset-0 bg-black/10"></div>
                <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative container mx-auto">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{t('explore_services')}</h1>
                    <p className="text-blue-100 text-lg max-w-2xl">{t('explore_services_description')}</p>
                </motion.div>
            </div>

            <div className="container mx-auto px-6 py-8">
                {/* Search Bar */}
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="mb-8">
                    <div className="relative max-w-full">
                        <input
                            type="text"
                            placeholder={t('search_services')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-6 py-4 pr-12 rounded-2xl bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-lg shadow-lg"
                        />
                        <IconSearch className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                    </div>
                </motion.div>

                {/* Main Layout: Sidebar + Content */}
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filters */}
                    <motion.aside initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="w-full lg:w-80 space-y-6">
                        {/* Category Filter */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <IconStar className="w-5 h-5" />
                                {t('categories')}
                            </h3>
                            <div className="space-y-2">
                                {categories.map((category) => {
                                    const Icon = category.icon;
                                    const count = getCategoryCount(category.id);
                                    return (
                                        <button
                                            key={category.id}
                                            onClick={() => setSelectedCategory(category.id)}
                                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 ${
                                                selectedCategory === category.id
                                                    ? `bg-gradient-to-r ${category.color} text-white shadow-md`
                                                    : 'bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon className="w-5 h-5" />
                                                <span className="font-medium">{category.label}</span>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${selectedCategory === category.id ? 'bg-white/20' : 'bg-white dark:bg-slate-800'}`}>
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Price Range Filter */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <IconShekelSign className="w-5 h-5" />
                                {t('price_range')}
                            </h3>
                            <div className="space-y-4">
                                {/* Range Display */}
                                <div className="flex justify-between items-center px-2">
                                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">₪{tempPriceRange[0].toLocaleString()}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">-</span>
                                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">₪{tempPriceRange[1].toLocaleString()}</span>
                                </div>

                                {/* Dual Range Slider */}
                                <div className="relative pt-2 pb-4">
                                    {/* Track - Inactive/Background */}
                                    <div className="absolute top-1/2 -translate-y-1/2 w-full h-2 bg-gray-300 dark:bg-slate-600 rounded-lg"></div>

                                    {/* Active Range - Blue Highlight */}
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 h-2 opacity-1 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 rounded-lg pointer-events-none shadow-md"
                                        style={{
                                            left: `${(tempPriceRange[0] / 10000) * 100}%`,
                                            right: `${100 - (tempPriceRange[1] / 10000) * 100}%`,
                                            zIndex: 4,
                                        }}
                                    ></div>

                                    {/* Min Slider */}
                                    <input
                                        type="range"
                                        min="0"
                                        max="10000"
                                        step="100"
                                        value={tempPriceRange[0]}
                                        onChange={(e) => {
                                            const newMin = parseInt(e.target.value);
                                            if (newMin < tempPriceRange[1] - 100) {
                                                setTempPriceRange([newMin, tempPriceRange[1]]);
                                            }
                                        }}
                                        onMouseUp={() => setPriceRange(tempPriceRange)}
                                        onTouchEnd={() => setPriceRange(tempPriceRange)}
                                        style={{ zIndex: 3 }}
                                        className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-moz-range-thumb]:relative [&::-moz-range-thumb]:z-50 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white"
                                    />

                                    {/* Max Slider */}
                                    <input
                                        type="range"
                                        min="0"
                                        max="10000"
                                        step="100"
                                        value={tempPriceRange[1]}
                                        onChange={(e) => {
                                            const newMax = parseInt(e.target.value);
                                            if (newMax > tempPriceRange[0] + 100) {
                                                setTempPriceRange([tempPriceRange[0], newMax]);
                                            }
                                        }}
                                        onMouseUp={() => setPriceRange(tempPriceRange)}
                                        onTouchEnd={() => setPriceRange(tempPriceRange)}
                                        //  style={{ zIndex: 4 }}
                                        className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-moz-range-thumb]:relative [&::-moz-range-thumb]:z-50 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Zone Filter */}
                        {availableZones.length > 0 && (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <IconMapPin className="w-5 h-5" />
                                    {t('zones')}
                                </h3>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {availableZones.map((zone) => (
                                        <label key={zone} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={selectedZones.includes(zone)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedZones([...selectedZones, zone]);
                                                    } else {
                                                        setSelectedZones(selectedZones.filter((z) => z !== zone));
                                                    }
                                                }}
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">{zone}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Properties Filter (for destinations) */}
                        {availableProperties.length > 0 && (selectedCategory === 'all' || selectedCategory === 'destinations') && (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <IconStar className="w-5 h-5" />
                                    {t('destination_properties')}
                                </h3>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {availableProperties.map((property) => (
                                        <label key={property.value} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={selectedProperties.includes(property.value)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedProperties([...selectedProperties, property.value]);
                                                    } else {
                                                        setSelectedProperties(selectedProperties.filter((p) => p !== property.value));
                                                    }
                                                }}
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            {property.icon ? (
                                                <img src={getPublicUrlFromPath(property.icon)} alt={property.value} className="w-5 h-5 object-contain" />
                                            ) : (
                                                <img src="/assets/images/img-placeholder-fallback.webp" alt={property.value} className="w-5 h-5 object-contain" />
                                            )}
                                            <span className="text-sm text-gray-700 dark:text-gray-300">{property.value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Suitable For Filter (for destinations) */}
                        {availableSuitableFor.length > 0 && (selectedCategory === 'all' || selectedCategory === 'destinations') && (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <IconUsers className="w-5 h-5" />
                                    {t('suitable_for')}
                                </h3>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {availableSuitableFor.map((suitable) => (
                                        <label key={suitable} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={selectedSuitableFor.includes(suitable)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedSuitableFor([...selectedSuitableFor, suitable]);
                                                    } else {
                                                        setSelectedSuitableFor(selectedSuitableFor.filter((s) => s !== suitable));
                                                    }
                                                }}
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <div className="w-5 h-5 bg-gray-200 dark:bg-slate-600 rounded flex items-center justify-center">
                                                <IconUsers className="w-3 h-3 text-gray-400" />
                                            </div>
                                            <span className="text-sm text-gray-700 dark:text-gray-300">{suitable.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Reset Filters Button */}
                        <button
                            onClick={() => {
                                setSelectedCategory('all');
                                setPriceRange([0, 10000]);
                                setTempPriceRange([0, 10000]);
                                setSelectedZones([]);
                                setSelectedProperties([]);
                                setSelectedSuitableFor([]);
                                setSearchQuery('');
                            }}
                            className="w-full px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-500 dark:hover:bg-red-500 transition-colors font-medium"
                        >
                            {t('reset_filters')}
                        </button>
                    </motion.aside>

                    {/* Services Grid */}
                    <div className="flex-1">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
                            </div>
                        ) : filteredServices.length === 0 ? (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl shadow-xl">
                                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                                    <IconSearch className="w-12 h-12 text-gray-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('no_services_found')}</h3>
                                <p className="text-gray-500 dark:text-gray-400">{t('try_different_search')}</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 1 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                            >
                                {filteredServices.map((service, index) => {
                                    const Icon = getCategoryIcon(service.category);
                                    const colorClass = getCategoryColor(service.category);
                                    return (
                                        <motion.div
                                            key={service.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            whileHover={{ y: -10, scale: 1.02 }}
                                            onClick={() => openServiceDetails(service)}
                                            className="group cursor-pointer bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-slate-700"
                                        >
                                            {/* Service Image or Icon */}
                                            <div className={`relative h-48 bg-gradient-to-br ${colorClass} flex items-center justify-center overflow-hidden`}>
                                                {service.image ? (
                                                    <img src={service.image} alt={service.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                ) : getServiceIconPath(service.category) ? (
                                                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
                                                        <img src={getServiceIconPath(service.category)!} alt={service.category} className="w-16 h-16 object-contain" />
                                                    </div>
                                                ) : (
                                                    <Icon className="w-20 h-20 text-white opacity-80" />
                                                )}
                                                <div className="absolute top-3 right-3">
                                                    <span className="px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                        {service.type}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Service Details */}
                                            <div className="p-5">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">{service.name}</h3>

                                                {service.description && <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">{service.description}</p>}

                                                <div className="space-y-2">
                                                    {service.zone && (
                                                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                            <IconMapPin className="w-4 h-4" />
                                                            <span className="line-clamp-1">{service.zone}</span>
                                                        </div>
                                                    )}

                                                    {service.address && (
                                                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                            <IconMapPin className="w-4 h-4" />
                                                            <span className="line-clamp-1">{service.address}</span>
                                                        </div>
                                                    )}

                                                    {(service.price || service.dailyRate) && (
                                                        <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
                                                            <span>{service.price ? `₪${service.price}` : service.dailyRate ? `₪${service.dailyRate}/${t('day')}` : ''}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <button className="mt-4 w-full py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform group-hover:scale-105">
                                                    {t('view_details')}
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* Service Details Modal */}
            <AnimatePresence>
                {isModalOpen && selectedService && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={closeModal}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 50 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-3xl shadow-2xl"
                        >
                            {/* Close Button */}
                            <button
                                onClick={closeModal}
                                className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <IconX className="w-5 h-5" />
                            </button>

                            {/* Modal Header with Image */}
                            <div className={`relative h-64 bg-gradient-to-br ${getCategoryColor(selectedService.category)} flex items-center justify-center overflow-hidden`}>
                                {selectedService.image ? (
                                    <img src={selectedService.image} alt={selectedService.name} className="w-full h-full object-cover" />
                                ) : getServiceIconPath(selectedService.category) ? (
                                    <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl">
                                        <img src={getServiceIconPath(selectedService.category)!} alt={selectedService.category} className="w-20 h-20 object-contain" />
                                    </div>
                                ) : (
                                    (() => {
                                        const Icon = getCategoryIcon(selectedService.category);
                                        return <Icon className="w-32 h-32 text-white opacity-80" />;
                                    })()
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                <div className="absolute bottom-6 left-6">
                                    <span className="px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-full text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 inline-block">
                                        {selectedService.type}
                                    </span>
                                    <h2 className="text-3xl font-bold text-white">{selectedService.name}</h2>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Left Column */}
                                    <div className="space-y-4">
                                        {selectedService.description && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('description')}</h3>
                                                <p className="text-gray-600 dark:text-gray-400">{selectedService.description}</p>
                                            </div>
                                        )}

                                        {selectedService.zone && (
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                                                <IconMapPin className="w-5 h-5 text-purple-500" />
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('zone')}</p>
                                                    <p className="font-semibold text-gray-900 dark:text-white">{selectedService.zone}</p>
                                                </div>
                                            </div>
                                        )}

                                        {selectedService.address && (
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                                                <IconMapPin className="w-5 h-5 text-purple-500" />
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('address')}</p>
                                                    <p className="font-semibold text-gray-900 dark:text-white">{selectedService.address}</p>
                                                </div>
                                            </div>
                                        )}

                                        {selectedService.email && (
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                                                <IconMail className="w-5 h-5 text-green-500" />
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('email')}</p>
                                                    <p className="font-semibold text-gray-900 dark:text-white">{selectedService.email}</p>
                                                </div>
                                            </div>
                                        )}

                                        {selectedService.code && (
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                                                <IconStar className="w-5 h-5 text-yellow-500" />
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('company_code')}</p>
                                                    <p className="font-semibold text-gray-900 dark:text-white">{selectedService.code}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Column */}
                                    <div className="space-y-4">
                                        {/* Pricing Information */}
                                        {(selectedService.price || selectedService.hourlyRate || selectedService.dailyRate) && (
                                            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-5 rounded-2xl border border-blue-200 dark:border-blue-800">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                    <IconShekelSign className="w-5 h-5 text-blue-500" />
                                                    {t('pricing')}
                                                </h3>
                                                <div className="space-y-2">
                                                    {selectedService.price && (
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-gray-600 dark:text-gray-400">{t('price')}</span>
                                                            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">₪{selectedService.price}</span>
                                                        </div>
                                                    )}
                                                    {selectedService.hourlyRate && (
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-gray-600 dark:text-gray-400">{t('hourly_rate')}</span>
                                                            <span className="text-lg font-semibold text-gray-900 dark:text-white">₪{selectedService.hourlyRate}</span>
                                                        </div>
                                                    )}
                                                    {selectedService.dailyRate && (
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-gray-600 dark:text-gray-400">{t('daily_rate')}</span>
                                                            <span className="text-lg font-semibold text-gray-900 dark:text-white">₪{selectedService.dailyRate}</span>
                                                        </div>
                                                    )}
                                                    {selectedService.regionalRate && (
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-gray-600 dark:text-gray-400">{t('regional_rate')}</span>
                                                            <span className="text-lg font-semibold text-gray-900 dark:text-white">₪{selectedService.regionalRate}</span>
                                                        </div>
                                                    )}
                                                    {selectedService.overnightRate && (
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-gray-600 dark:text-gray-400">{t('overnight_rate')}</span>
                                                            <span className="text-lg font-semibold text-gray-900 dark:text-white">₪{selectedService.overnightRate}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Properties */}
                                        {selectedService.properties && selectedService.properties.length > 0 && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('properties')}</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedService.properties.map((prop: { value: string; icon: string | null }) => (
                                                        <span
                                                            key={prop.value}
                                                            className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium flex items-center gap-2"
                                                        >
                                                            {prop.icon ? (
                                                                <img src={getPublicUrlFromPath(prop.icon)} alt={prop.value} className="w-4 h-4 object-contain" />
                                                            ) : (
                                                                <img src="/assets/images/img-placeholder-fallback.webp" alt={prop.value} className="w-4 h-4 object-contain" />
                                                            )}
                                                            {prop.value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Suitable For */}
                                        {selectedService.suitableFor && selectedService.suitableFor.length > 0 && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('suitable_for')}</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedService.suitableFor.map((suitable: string) => (
                                                        <span
                                                            key={suitable}
                                                            className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium flex items-center gap-2"
                                                        >
                                                            <div className="w-4 h-4 bg-green-200 dark:bg-green-800 rounded flex items-center justify-center">
                                                                <IconUsers className="w-2.5 h-2.5 text-green-600 dark:text-green-400" />
                                                            </div>
                                                            {suitable.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Additional Info */}
                                        {selectedService.vehicleCount && (
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                                                <IconCar className="w-5 h-5 text-indigo-500" />
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('vehicle_count')}</p>
                                                    <p className="font-semibold text-gray-900 dark:text-white">{selectedService.vehicleCount}</p>
                                                </div>
                                            </div>
                                        )}

                                        {selectedService.notes && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('notes')}</h3>
                                                <p className="text-gray-600 dark:text-gray-400 text-sm">{selectedService.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
