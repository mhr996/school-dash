'use client';
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabase';
import { getTranslation } from '@/i18n';
import IconPlus from '@/components/icon/icon-plus';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import SingleFileUpload from '@/components/file-upload/single-file-upload';
import FileUpload from '@/components/file-upload/file-upload';
import PageBreadcrumb from '@/components/layouts/page-breadcrumb';

type Zone = { id: string; name: string; is_active: boolean };

type KV = { label: string; value: string };

type Pricing = { child?: number; teen?: number; adult?: number; guide?: number };

const SUITABLE_OPTIONS = ['kindergarten', 'elementary', 'high_school', 'college', 'families', 'teachers'];

// Predefined property labels for destinations
const PROPERTY_OPTIONS = [
    'indoor_activities',
    'outdoor_activities',
    'educational_value',
    'entertainment_value',
    'historical_significance',
    'natural_beauty',
    'accessibility',
    'parking_available',
    'restroom_facilities',
    'food_services',
    'gift_shop',
    'guided_tours',
    'audio_guides',
    'wheelchair_accessible',
    'group_discounts',
];

// Service requirements based on existing services in the app
const SERVICE_REQUIREMENTS = ['paramedics', 'guides', 'travel_companies', 'security_companies', 'external_entertainment_companies'];

export default function AddDestinationPage() {
    const { t } = getTranslation();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

    const [zones, setZones] = useState<Zone[]>([]);
    const [zonesLoading, setZonesLoading] = useState(true);

    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [zoneId, setZoneId] = useState<string>('');
    const [description, setDescription] = useState('');
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
    // Local UI states to enable previews using our upload components
    const [thumbnailUI, setThumbnailUI] = useState<{ file: File; preview?: string; id: string } | null>(null);
    const [galleryUI, setGalleryUI] = useState<Array<{ file: File; preview?: string; id: string }>>([]);

    const [properties, setProperties] = useState<string[]>([]);
    const [requirements, setRequirements] = useState<string[]>([]);
    const [suitable, setSuitable] = useState<string[]>([]);
    const [pricing, setPricing] = useState<Pricing>({});

    useEffect(() => {
        (async () => {
            try {
                const { data, error } = await supabase.from('zones').select('id, name, is_active').eq('is_active', true).order('name', { ascending: true });
                if (error) throw error;
                setZones((data || []) as Zone[]);
            } catch (e) {
                console.error('Error fetching zones', e);
            } finally {
                setZonesLoading(false);
            }
        })();
    }, []);

    const isValid = useMemo(() => {
        return name.trim().length > 0;
    }, [name]);

    const toggleProperty = (property: string) => {
        setProperties((prev) => (prev.includes(property) ? prev.filter((p) => p !== property) : [...prev, property]));
    };

    const toggleRequirement = (requirement: string) => {
        setRequirements((prev) => (prev.includes(requirement) ? prev.filter((r) => r !== requirement) : [...prev, requirement]));
    };

    const toggleSuitable = (key: string) => {
        setSuitable((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAlert(null);
        if (!isValid) {
            setActiveTab(0);
            setAlert({ message: t('destination_name_required'), type: 'danger' });
            return;
        }

        try {
            setLoading(true);

            // 1) Create base record to get id
            const basePayload: any = {
                name: name.trim(),
                address: address.trim() || null,
                phone: phone.trim() || null,
                zone_id: zoneId || null,
                description: description.trim() || null,
                properties: properties,
                requirements: requirements,
                suitable_for: suitable,
                pricing: {
                    child: pricing.child || 0,
                    teen: pricing.teen || 0,
                    adult: pricing.adult || 0,
                    guide: pricing.guide || 0,
                },
            };

            const { data: created, error: insertError } = await supabase.from('destinations').insert([basePayload]).select().single();
            if (insertError) throw insertError;
            const id = created.id as string;

            // 2) Upload images if any, then update
            let thumbnail_path: string | null = null;
            const gallery_paths: string[] = [];

            if (thumbnailFile) {
                const ext = thumbnailFile.name.split('.').pop()?.toLowerCase() || 'jpg';
                const path = `${id}/thumbnail_${Date.now()}.${ext}`;
                const { error: upErr } = await supabase.storage.from('destinations').upload(path, thumbnailFile, { cacheControl: '3600', upsert: true });
                if (upErr) throw upErr;
                thumbnail_path = `/destinations/${path}`;
            }

            for (const file of galleryFiles) {
                const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
                const path = `${id}/gallery/${Date.now()}_${file.name}`;
                const { error: upErr } = await supabase.storage.from('destinations').upload(path, file, { cacheControl: '3600', upsert: true });
                if (upErr) throw upErr;
                gallery_paths.push(`/destinations/${path}`);
            }

            if (thumbnail_path || gallery_paths.length > 0) {
                const { error: updErr } = await supabase.from('destinations').update({ thumbnail_path, gallery_paths }).eq('id', id);
                if (updErr) throw updErr;
            }

            setAlert({ message: t('destination_created_successfully'), type: 'success' });
            setTimeout(() => router.push(`/destinations/preview/${id}`), 1200);
        } catch (error) {
            console.error('Error creating destination:', error);
            // Log more details about the error
            if (error && typeof error === 'object') {
                console.error('Error details:', JSON.stringify(error, null, 2));
            }
            setAlert({ message: t('error_creating_destination'), type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'basic', title: t('basic_info') },
        { id: 'properties', title: t('destination_properties') },
        { id: 'requirements', title: t('destination_requirements') },
        { id: 'suitable_for', title: t('suitable_for') },
        { id: 'pricing', title: t('pricing') },
    ];

    const renderBasic = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium mb-2">
                        {t('destination_name')} <span className="text-red-500">*</span>
                    </label>
                    <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('enter_destination_name')} />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">{t('phone')}</label>
                    <input className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('phone_number')} />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">{t('destination_address')}</label>
                    <input className="form-input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t('enter_destination_address')} />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">{t('zone')}</label>
                    <select className="form-select" value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
                        <option value="">{zonesLoading ? t('loading') : t('select_zone')}</option>
                        {zones.map((z) => (
                            <option key={z.id} value={z.id}>
                                {z.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">{t('description')}</label>
                    <textarea className="form-textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('description')} />
                </div>
                <div className="md:col-span-2">
                    <SingleFileUpload
                        title={t('upload_thumbnail')}
                        description={t('upload_thumbnail_desc') || ''}
                        accept="image/*"
                        file={thumbnailUI}
                        onFileChange={(fi) => {
                            setThumbnailUI(fi);
                            setThumbnailFile(fi?.file || null);
                        }}
                    />
                </div>
                <div className="md:col-span-2">
                    <FileUpload
                        title={t('upload_gallery_images')}
                        description={t('upload_gallery_desc') || ''}
                        accept="image/*"
                        maxFiles={10}
                        files={galleryUI}
                        onFilesChange={(fis) => {
                            setGalleryUI(fis);
                            setGalleryFiles(fis.map((x) => x.file));
                        }}
                    />
                </div>
            </div>
        </div>
    );

    const renderProperties = () => (
        <div className="space-y-3">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('select_property_features')}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PROPERTY_OPTIONS.map((property) => (
                    <div key={property} className="flex items-center gap-3 mb-2">
                        <input
                            type="checkbox"
                            id={`property-${property}`}
                            checked={properties.includes(property)}
                            onChange={() => toggleProperty(property)}
                            className="form-checkbox rounded h-5 w-5 text-primary flex-shrink-0"
                        />
                        <label htmlFor={`property-${property}`} className="cursor-pointer text-sm text-gray-700 dark:text-gray-300 leading-5 mb-0">
                            {t(`property_${property}`)}
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderRequirements = () => (
        <div className="space-y-3">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('select_required_services')}</div>
            <div className="grid grid-cols-1 gap-3">
                {SERVICE_REQUIREMENTS.map((service) => (
                    <div key={service} className="flex items-center gap-3 mb-2">
                        <input
                            type="checkbox"
                            id={`requirement-${service}`}
                            checked={requirements.includes(service)}
                            onChange={() => toggleRequirement(service)}
                            className="form-checkbox rounded h-5 w-5 text-primary flex-shrink-0"
                        />
                        <label htmlFor={`requirement-${service}`} className="cursor-pointer text-sm text-gray-700 dark:text-gray-300 leading-5 mb-0">
                            {t(`service_${service}`)}
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderSuitable = () => (
        <div className="space-y-3">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('select_suitable_audiences')}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SUITABLE_OPTIONS.map((key) => (
                    <div key={key} className="flex items-center gap-3 mb-2">
                        <input
                            type="checkbox"
                            id={`suitable-${key}`}
                            checked={suitable.includes(key)}
                            onChange={() => toggleSuitable(key)}
                            className="form-checkbox rounded h-5 w-5 text-primary flex-shrink-0"
                        />
                        <label htmlFor={`suitable-${key}`} className="cursor-pointer text-sm text-gray-700 dark:text-gray-300 leading-5 mb-0">
                            {t(`suitable_${key}`)}
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderPricing = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-2">{t('pricing_child')}</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="form-input"
                        value={pricing.child ?? ''}
                        onChange={(e) => setPricing((p) => ({ ...p, child: parseFloat(e.target.value) || 0 }))}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">{t('pricing_teen')}</label>
                    <input type="number" min="0" step="0.01" className="form-input" value={pricing.teen ?? ''} onChange={(e) => setPricing((p) => ({ ...p, teen: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">{t('pricing_adult')}</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="form-input"
                        value={pricing.adult ?? ''}
                        onChange={(e) => setPricing((p) => ({ ...p, adult: parseFloat(e.target.value) || 0 }))}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">{t('pricing_guide')}</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="form-input"
                        value={pricing.guide ?? ''}
                        onChange={(e) => setPricing((p) => ({ ...p, guide: parseFloat(e.target.value) || 0 }))}
                    />
                </div>
            </div>
        </div>
    );

    const renderTabContent = () => {
        if (activeTab === 0) return renderBasic();
        if (activeTab === 1) return renderProperties();
        if (activeTab === 2) return renderRequirements();
        if (activeTab === 3) return renderSuitable();
        if (activeTab === 4) return renderPricing();
        return null;
    };

    return (
        <div className="container mx-auto p-6">
            <PageBreadcrumb
                section="destinations"
                backUrl="/destinations"
                items={[{ label: t('home'), href: '/' }, { label: t('destinations'), href: '/destinations' }, { label: t('add_destination') }]}
            />

            {alert && (
                <div className="mb-4">
                    <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="panel">
                    <div className="flex border-b border-gray-200 dark:border-gray-600 mb-6">
                        {tabs.map((tab, idx) => (
                            <button
                                type="button"
                                key={tab.id}
                                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === idx ? 'border-primary text-primary bg-primary/10' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                                onClick={() => setActiveTab(idx)}
                            >
                                {tab.title}
                            </button>
                        ))}
                    </div>

                    <div className="min-h-[400px]">{renderTabContent()}</div>
                </div>

                <div className="flex justify-end gap-3">
                    <Link className="btn btn-outline-secondary" href="/destinations">
                        {t('cancel')}
                    </Link>
                    <button type="submit" className="btn btn-primary gap-2" disabled={loading || !isValid}>
                        {loading ? <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5"></span> : <IconPlus />}
                        {loading ? t('creating') : t('create_destination')}
                    </button>
                </div>
            </form>
        </div>
    );
}
