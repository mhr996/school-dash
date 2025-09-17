'use client';
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabase';
import { getTranslation } from '@/i18n';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconSave from '@/components/icon/icon-save';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import SingleFileUpload from '@/components/file-upload/single-file-upload';
import FileUpload from '@/components/file-upload/file-upload';
import IconTrashLines from '@/components/icon/icon-trash-lines';

type Zone = { id: string; name: string; is_active: boolean };
type KV = { label: string; value: string };
type Pricing = { child?: number; teen?: number; adult?: number; guide?: number };

export default function EditDestinationPage({ params }: { params: { id: string } }) {
    const { t } = getTranslation();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [alert, setAlert] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

    const [zones, setZones] = useState<Zone[]>([]);
    const [zonesLoading, setZonesLoading] = useState(true);

    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [zoneId, setZoneId] = useState<string>('');
    const [description, setDescription] = useState('');
    const [thumbnailPath, setThumbnailPath] = useState<string | null>(null);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailUI, setThumbnailUI] = useState<{ file: File; preview?: string; id: string } | null>(null);
    const [galleryPaths, setGalleryPaths] = useState<string[]>([]);
    const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
    const [newGalleryUI, setNewGalleryUI] = useState<Array<{ file: File; preview?: string; id: string }>>([]);

    const [properties, setProperties] = useState<KV[]>([]);
    const [requirements, setRequirements] = useState<KV[]>([]);
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

    useEffect(() => {
        (async () => {
            try {
                setFetching(true);
                const { data, error } = await supabase.from('destinations').select('*').eq('id', params.id).single();
                if (error) throw error;
                setName(data.name || '');
                setAddress(data.address || '');
                setPhone(data.phone || '');
                setZoneId(data.zone_id || '');
                setDescription(data.description || '');
                setThumbnailPath(data.thumbnail_path || null);
                setGalleryPaths(data.gallery_paths || []);
                setProperties(data.properties || []);
                setRequirements(data.requirements || []);
                setSuitable(data.suitable_for || []);
                setPricing(data.pricing || {});
            } catch (e) {
                console.error('Error loading destination', e);
                setAlert({ message: t('error_loading_destination'), type: 'danger' });
            } finally {
                setFetching(false);
            }
        })();
    }, [params.id]);

    const isValid = useMemo(() => name.trim().length > 0, [name]);

    const handleAddKV = (setFn: Dispatch<SetStateAction<KV[]>>) => setFn((prev) => [...prev, { label: '', value: '' }]);
    const handleRemoveKV = (setFn: Dispatch<SetStateAction<KV[]>>, idx: number) => setFn((prev) => prev.filter((_, i) => i !== idx));
    const handleChangeKV = (setFn: Dispatch<SetStateAction<KV[]>>, idx: number, key: 'label' | 'value', value: string) =>
        setFn((prev) => prev.map((it, i) => (i === idx ? { ...it, [key]: value } : it)));
    const toggleSuitable = (key: string) => setSuitable((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

    const handleRemoveGallery = async (path: string) => {
        try {
            const cleanPath = path.startsWith('/destinations/') ? path.replace('/destinations/', '') : path;
            const { error } = await supabase.storage.from('destinations').remove([cleanPath]);
            if (error) throw error;
            setGalleryPaths((prev) => prev.filter((p) => p !== path));
        } catch (e) {
            console.error('Error removing image', e);
        }
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
            const basePayload: any = {
                name: name.trim(),
                address: address.trim() || null,
                phone: phone.trim() || null,
                zone_id: zoneId || null,
                description: description.trim() || null,
                properties: properties.filter((x) => x.label || x.value),
                requirements: requirements.filter((x) => x.label || x.value),
                suitable_for: suitable,
                pricing: {
                    child: pricing.child || 0,
                    teen: pricing.teen || 0,
                    adult: pricing.adult || 0,
                    guide: pricing.guide || 0,
                },
                updated_at: new Date().toISOString(),
            };

            // Upload new thumbnail if any
            if (thumbnailFile) {
                const ext = thumbnailFile.name.split('.').pop()?.toLowerCase() || 'jpg';
                const path = `${params.id}/thumbnail_${Date.now()}.${ext}`;
                const { error: upErr } = await supabase.storage.from('destinations').upload(path, thumbnailFile, { cacheControl: '3600', upsert: true });
                if (upErr) throw upErr;
                basePayload.thumbnail_path = `/destinations/${path}`;
            }

            // Upload new gallery files
            for (const file of newGalleryFiles) {
                const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
                const path = `${params.id}/gallery/${Date.now()}_${file.name}`;
                const { error: upErr } = await supabase.storage.from('destinations').upload(path, file, { cacheControl: '3600', upsert: true });
                if (upErr) throw upErr;
                setGalleryPaths((prev) => [...prev, `/destinations/${path}`]);
            }

            basePayload.gallery_paths = galleryPaths;

            const { error } = await supabase.from('destinations').update(basePayload).eq('id', params.id);
            if (error) throw error;

            setAlert({ message: t('destination_updated_successfully'), type: 'success' });
            setTimeout(() => router.push('/destinations'), 1200);
        } catch (e) {
            console.error('Error updating destination', e);
            setAlert({ message: t('error_updating_destination'), type: 'danger' });
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
                        description={thumbnailPath ? `${t('current')}: ${thumbnailPath.split('/').pop()}` : t('upload_thumbnail_desc') || ''}
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
                        files={newGalleryUI}
                        onFilesChange={(fis) => {
                            setNewGalleryUI(fis);
                            setNewGalleryFiles(fis.map((x) => x.file));
                        }}
                    />
                    {galleryPaths.length > 0 && (
                        <div className="mt-4">
                            <h6 className="text-sm font-semibold mb-2">{t('existing_gallery')}</h6>
                            <div className="space-y-2">
                                {galleryPaths.map((p) => (
                                    <div key={p} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded px-3 py-2">
                                        <span className="text-xs truncate">{p.split('/').slice(-1)[0]}</span>
                                        <button type="button" onClick={() => handleRemoveGallery(p)} className="hover:text-danger" title={t('delete')}>
                                            <IconTrashLines />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderKVRows = (items: KV[], setFn: Dispatch<SetStateAction<KV[]>>, addLabelKey: string) => (
        <div className="space-y-3">
            {items.length === 0 && <div className="text-gray-500 text-sm">{t('no_items_added')}</div>}
            {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                    <div className="relative md:col-span-3 flex items-center gap-3">
                        <input className="form-input md:flex-1" placeholder={t('label')} value={item.label} onChange={(e) => handleChangeKV(setFn, idx, 'label', e.target.value)} />
                        <input className="form-input md:flex-[2]" placeholder={t('value')} value={item.value} onChange={(e) => handleChangeKV(setFn, idx, 'value', e.target.value)} />
                        <button type="button" className="hover:text-danger" title={t('delete')} onClick={() => handleRemoveKV(setFn, idx)}>
                            <IconTrashLines />
                        </button>
                    </div>
                </div>
            ))}
            <button type="button" className="btn btn-outline-primary" onClick={() => handleAddKV(setFn)}>
                {t(addLabelKey)}
            </button>
        </div>
    );

    const renderSuitable = () => (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
                {['kindergarten', 'elementary', 'high_school', 'college', 'families', 'teachers'].map((key) => {
                    const active = suitable.includes(key);
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => toggleSuitable(key)}
                            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                                active
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-primary'
                            }`}
                            aria-pressed={active}
                        >
                            {t(`suitable_${key}`)}
                        </button>
                    );
                })}
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
        if (activeTab === 1) return renderKVRows(properties, setProperties, 'add_property');
        if (activeTab === 2) return renderKVRows(requirements, setRequirements, 'add_requirement');
        if (activeTab === 3) return renderSuitable();
        if (activeTab === 4) return renderPricing();
        return null;
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-semibold dark:text-white-light">{t('edit_destination')}</h1>
                </div>
                <Link href="/destinations" className="btn btn-outline-primary gap-2">
                    <IconArrowLeft />
                    {t('back')}
                </Link>
            </div>

            {alert && (
                <div className="mb-4">
                    <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="panel">
                    <div className="flex border-b border-gray-200 dark:border-gray-600 mb-6">
                        {[
                            { id: 'basic', title: t('basic_info') },
                            { id: 'properties', title: t('destination_properties') },
                            { id: 'requirements', title: t('destination_requirements') },
                            { id: 'suitable_for', title: t('suitable_for') },
                            { id: 'pricing', title: t('pricing') },
                        ].map((tab, idx) => (
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
                        {loading ? <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5"></span> : <IconSave />}
                        {loading ? t('updating') : t('update_destination')}
                    </button>
                </div>
            </form>
        </div>
    );
}
