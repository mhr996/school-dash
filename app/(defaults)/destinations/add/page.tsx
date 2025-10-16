'use client';
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabase';
import { getTranslation } from '@/i18n';
import IconPlus from '@/components/icon/icon-plus';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import SingleFileUpload from '@/components/file-upload/single-file-upload';
import FileUpload from '@/components/file-upload/file-upload';
import PageBreadcrumb from '@/components/layouts/page-breadcrumb';

type Zone = { id: string; name: string; is_active: boolean };

type KV = { label: string; value: string };

type Pricing = { child?: number; teen?: number; adult?: number; guide?: number };

type DestinationProperty = {
    id: string;
    value: string;
    icon: string | null;
    is_active: boolean;
    display_order: number;
};

type SuitableForOption = {
    id: string;
    value: string;
    is_active: boolean;
    display_order: number;
};

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

    const [availableProperties, setAvailableProperties] = useState<DestinationProperty[]>([]);
    const [availableSuitableFor, setAvailableSuitableFor] = useState<SuitableForOption[]>([]);
    const [propertiesLoading, setPropertiesLoading] = useState(true);
    const [suitableForLoading, setSuitableForLoading] = useState(true);

    const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
    const [showAddSuitableForModal, setShowAddSuitableForModal] = useState(false);
    const [newPropertyValue, setNewPropertyValue] = useState('');
    const [newPropertyIcon, setNewPropertyIcon] = useState<File | null>(null);
    const [newPropertyIconUI, setNewPropertyIconUI] = useState<{ file: File; preview?: string; id: string } | null>(null);
    const [newSuitableForValue, setNewSuitableForValue] = useState('');
    const [savingNewOption, setSavingNewOption] = useState(false);
    const [deletingProperty, setDeletingProperty] = useState<string | null>(null);
    const [deletingSuitableFor, setDeleteingSuitableFor] = useState<string | null>(null);
    const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ type: 'property' | 'suitable'; id: string; name: string } | null>(null);

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

    useEffect(() => {
        (async () => {
            try {
                const { data, error } = await supabase.from('destination_properties').select('*').eq('is_active', true).order('display_order', { ascending: true });
                if (error) throw error;
                setAvailableProperties((data || []) as DestinationProperty[]);
            } catch (e) {
                console.error('Error fetching destination properties', e);
            } finally {
                setPropertiesLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const { data, error } = await supabase.from('suitable_for_options').select('*').eq('is_active', true).order('display_order', { ascending: true });
                if (error) throw error;
                setAvailableSuitableFor((data || []) as SuitableForOption[]);
            } catch (e) {
                console.error('Error fetching suitable-for options', e);
            } finally {
                setSuitableForLoading(false);
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

    const handleAddNewProperty = async () => {
        if (!newPropertyValue.trim()) {
            setAlert({ message: t('property_value_required'), type: 'danger' });
            return;
        }

        try {
            setSavingNewOption(true);

            // Check if property value already exists
            const { data: existingProperty, error: checkError } = await supabase.from('destination_properties').select('id, value').eq('value', newPropertyValue.trim().toLowerCase()).maybeSingle();

            if (checkError) throw checkError;

            if (existingProperty) {
                setAlert({
                    message: t('property_already_exists') || `Property "${newPropertyValue.trim()}" already exists. Please use a different value.`,
                    type: 'danger',
                });
                setSavingNewOption(false);
                return;
            }

            // Create the property first to get the ID
            const maxOrder = availableProperties.length > 0 ? Math.max(...availableProperties.map((p) => p.display_order)) : 0;
            const { data: newProp, error: insertError } = await supabase
                .from('destination_properties')
                .insert([{ value: newPropertyValue.trim().toLowerCase(), display_order: maxOrder + 1 }])
                .select()
                .single();

            if (insertError) {
                // Handle duplicate key error specifically
                if (insertError.code === '23505') {
                    setAlert({
                        message: t('property_already_exists') || `Property "${newPropertyValue.trim()}" already exists. Please use a different value.`,
                        type: 'danger',
                    });
                    setSavingNewOption(false);
                    return;
                }
                throw insertError;
            }

            // Upload icon if provided
            let iconPath: string | null = null;
            if (newPropertyIcon && newProp) {
                const ext = newPropertyIcon.name.split('.').pop()?.toLowerCase() || 'png';
                const path = `${newProp.id}/icon.${ext}`;
                const { error: uploadError } = await supabase.storage.from('destinations-properties').upload(path, newPropertyIcon, { cacheControl: '3600', upsert: true });

                if (uploadError) throw uploadError;
                iconPath = path;

                // Update the property with the icon path
                const { error: updateError } = await supabase.from('destination_properties').update({ icon: iconPath }).eq('id', newProp.id);
                if (updateError) throw updateError;
            }

            // Add to local state
            const propertyToAdd: DestinationProperty = {
                id: newProp.id,
                value: newProp.value,
                icon: iconPath,
                is_active: true,
                display_order: newProp.display_order,
            };
            setAvailableProperties((prev) => [...prev, propertyToAdd].sort((a, b) => a.display_order - b.display_order));

            // Reset and close modal
            setNewPropertyValue('');
            setNewPropertyIcon(null);
            setNewPropertyIconUI(null);
            setShowAddPropertyModal(false);
            setAlert({ message: t('property_added_successfully'), type: 'success' });
        } catch (error) {
            console.error('Error adding property:', error);
            setAlert({ message: t('error_adding_property'), type: 'danger' });
        } finally {
            setSavingNewOption(false);
        }
    };

    const handleAddNewSuitableFor = async () => {
        if (!newSuitableForValue.trim()) {
            setAlert({ message: t('suitable_for_value_required'), type: 'danger' });
            return;
        }

        try {
            setSavingNewOption(true);

            // Check if suitable-for value already exists
            const { data: existingOption, error: checkError } = await supabase.from('suitable_for_options').select('id, value').eq('value', newSuitableForValue.trim().toLowerCase()).maybeSingle();

            if (checkError) throw checkError;

            if (existingOption) {
                setAlert({
                    message: t('suitable_for_already_exists') || `Suitable-for option "${newSuitableForValue.trim()}" already exists. Please use a different value.`,
                    type: 'danger',
                });
                setSavingNewOption(false);
                return;
            }

            // Create the option
            const maxOrder = availableSuitableFor.length > 0 ? Math.max(...availableSuitableFor.map((s) => s.display_order)) : 0;
            const { data: newOption, error: insertError } = await supabase
                .from('suitable_for_options')
                .insert([{ value: newSuitableForValue.trim().toLowerCase(), display_order: maxOrder + 1 }])
                .select()
                .single();

            if (insertError) {
                // Handle duplicate key error specifically
                if (insertError.code === '23505') {
                    setAlert({
                        message: t('suitable_for_already_exists') || `Suitable-for option "${newSuitableForValue.trim()}" already exists. Please use a different value.`,
                        type: 'danger',
                    });
                    setSavingNewOption(false);
                    return;
                }
                throw insertError;
            }

            // Add to local state
            const optionToAdd: SuitableForOption = {
                id: newOption.id,
                value: newOption.value,
                is_active: true,
                display_order: newOption.display_order,
            };
            setAvailableSuitableFor((prev) => [...prev, optionToAdd].sort((a, b) => a.display_order - b.display_order));

            // Reset and close modal
            setNewSuitableForValue('');
            setShowAddSuitableForModal(false);
            setAlert({ message: t('suitable_for_added_successfully'), type: 'success' });
        } catch (error) {
            console.error('Error adding suitable-for option:', error);
            setAlert({ message: t('error_adding_suitable_for'), type: 'danger' });
        } finally {
            setSavingNewOption(false);
        }
    };

    const handleDeleteProperty = async (propertyId: string) => {
        const property = availableProperties.find((p) => p.id === propertyId);
        if (!property) return;
        setDeleteConfirmModal({ type: 'property', id: propertyId, name: property.value });
    };

    const handleDeleteSuitableFor = async (optionId: string) => {
        const option = availableSuitableFor.find((s) => s.id === optionId);
        if (!option) return;
        setDeleteConfirmModal({ type: 'suitable', id: optionId, name: option.value });
    };

    const confirmDelete = async () => {
        if (!deleteConfirmModal) return;

        const { type, id } = deleteConfirmModal;

        try {
            if (type === 'property') {
                setDeletingProperty(id);

                // Check if property is linked to any destination
                const { data: usageCheck, error: checkError } = await supabase.from('destination_properties_link').select('destination_id').eq('property_id', id).limit(1);

                if (checkError) throw checkError;

                if (usageCheck && usageCheck.length > 0) {
                    // Property is in use - cannot delete
                    setAlert({
                        message:
                            t('cannot_delete_property_in_use') ||
                            'Cannot delete this property because it is currently linked to one or more destinations. Please remove it from all destinations first.',
                        type: 'danger',
                    });
                    setDeletingProperty(null);
                    setDeleteConfirmModal(null);
                    return;
                }

                // Get property details for storage cleanup
                const property = availableProperties.find((p) => p.id === id);

                // Safe to delete - not in use
                const { error: deleteError } = await supabase.from('destination_properties').delete().eq('id', id);

                if (deleteError) throw deleteError;

                // Delete storage folder if property has an icon
                if (property?.icon) {
                    // Delete the entire folder for this property
                    const folderPath = `${id}/`;
                    await supabase.storage.from('destinations-properties').remove([property.icon]);
                }

                setAvailableProperties((prev) => prev.filter((p) => p.id !== id));
                setProperties((prev) => prev.filter((propId) => propId !== id));
                setAlert({ message: t('property_deleted_successfully'), type: 'success' });
            } else {
                setDeleteingSuitableFor(id);

                // Check if suitable-for is linked to any destination
                const { data: usageCheck, error: checkError } = await supabase.from('destination_suitable_for_link').select('destination_id').eq('suitable_for_id', id).limit(1);

                if (checkError) throw checkError;

                if (usageCheck && usageCheck.length > 0) {
                    // Suitable-for is in use - cannot delete
                    setAlert({
                        message:
                            t('cannot_delete_suitable_in_use') || 'Cannot delete this option because it is currently linked to one or more destinations. Please remove it from all destinations first.',
                        type: 'danger',
                    });
                    setDeleteingSuitableFor(null);
                    setDeleteConfirmModal(null);
                    return;
                }

                // Safe to delete - not in use
                const { error: deleteError } = await supabase.from('suitable_for_options').delete().eq('id', id);

                if (deleteError) throw deleteError;

                setAvailableSuitableFor((prev) => prev.filter((s) => s.id !== id));
                setSuitable((prev) => prev.filter((suitId) => suitId !== id));
                setAlert({ message: t('suitable_for_deleted_successfully'), type: 'success' });
            }
        } catch (error) {
            console.error(`Error deleting ${type}:`, error);
            setAlert({ message: t(type === 'property' ? 'error_deleting_property' : 'error_deleting_suitable_for'), type: 'danger' });
        } finally {
            setDeletingProperty(null);
            setDeleteingSuitableFor(null);
            setDeleteConfirmModal(null);
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

            // 1) Create base record to get id
            const basePayload: any = {
                name: name.trim(),
                address: address.trim() || null,
                phone: phone.trim() || null,
                zone_id: zoneId || null,
                description: description.trim() || null,
                requirements: requirements,
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

            // 2) Insert junction table records for properties
            if (properties.length > 0) {
                const propertyLinks = properties.map((propertyId) => ({
                    destination_id: id,
                    property_id: propertyId,
                }));
                const { error: propLinkError } = await supabase.from('destination_properties_link').insert(propertyLinks);
                if (propLinkError) throw propLinkError;
            }

            // 3) Insert junction table records for suitable-for
            if (suitable.length > 0) {
                const suitableLinks = suitable.map((suitableId) => ({
                    destination_id: id,
                    suitable_for_id: suitableId,
                }));
                const { error: suitableLinkError } = await supabase.from('destination_suitable_for_link').insert(suitableLinks);
                if (suitableLinkError) throw suitableLinkError;
            }

            // 4) Upload images if any, then update
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
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-primary rounded-full"></div>
                    <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200">{t('select_property_features')}</h4>
                </div>
                <button type="button" onClick={() => setShowAddPropertyModal(true)} className="btn btn-sm btn-primary flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow">
                    <IconPlus className="w-4 h-4" />
                    {t('add_new_property')}
                </button>
            </div>
            {propertiesLoading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
            ) : availableProperties.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <p className="text-gray-500 dark:text-gray-400">{t('no_properties_available')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableProperties.map((property) => (
                        <div
                            key={property.id}
                            className={`group relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 ${
                                properties.includes(property.id)
                                    ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-sm'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                            }`}
                        >
                            <input
                                type="checkbox"
                                id={`property-${property.id}`}
                                checked={properties.includes(property.id)}
                                onChange={() => toggleProperty(property.id)}
                                className="form-checkbox rounded h-5 w-5 text-primary flex-shrink-0 cursor-pointer"
                            />
                            <label htmlFor={`property-${property.id}`} className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 leading-5 mb-0 flex items-center gap-3 flex-1">
                                <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                    <img
                                        src={
                                            property.icon
                                                ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/destinations-properties/${property.icon}`
                                                : '/assets/images/img-placeholder-fallback.webp'
                                        }
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <span className="truncate">{property.value}</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => handleDeleteProperty(property.id)}
                                disabled={deletingProperty === property.id}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                title={t('delete')}
                            >
                                {deletingProperty === property.id ? (
                                    <span className="animate-spin border-2 border-red-500 border-l-transparent rounded-full w-4 h-4 inline-block"></span>
                                ) : (
                                    <IconTrashLines className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            )}
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
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
                    <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200">{t('select_suitable_audiences')}</h4>
                </div>
                <button type="button" onClick={() => setShowAddSuitableForModal(true)} className="btn btn-sm btn-success flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow">
                    <IconPlus className="w-4 h-4" />
                    {t('add_new_suitable_for')}
                </button>
            </div>
            {suitableForLoading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
                </div>
            ) : availableSuitableFor.length === 0 ? (
                <div className="text-center py-8 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border-2 border-dashed border-emerald-300 dark:border-emerald-700">
                    <p className="text-emerald-600 dark:text-emerald-400">{t('no_suitable_options_available')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableSuitableFor.map((option) => (
                        <div
                            key={option.id}
                            className={`group relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 ${
                                suitable.includes(option.id)
                                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-sm'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                            }`}
                        >
                            <input
                                type="checkbox"
                                id={`suitable-${option.id}`}
                                checked={suitable.includes(option.id)}
                                onChange={() => toggleSuitable(option.id)}
                                className="form-checkbox rounded h-5 w-5 text-emerald-500 flex-shrink-0 cursor-pointer"
                            />
                            <label htmlFor={`suitable-${option.id}`} className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 leading-5 mb-0 flex-1">
                                {option.value}
                            </label>
                            <button
                                type="button"
                                onClick={() => handleDeleteSuitableFor(option.id)}
                                disabled={deletingSuitableFor === option.id}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                title={t('delete')}
                            >
                                {deletingSuitableFor === option.id ? (
                                    <span className="animate-spin border-2 border-red-500 border-l-transparent rounded-full w-4 h-4 inline-block"></span>
                                ) : (
                                    <IconTrashLines className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            )}
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
                <div className="fixed top-4 right-4 z-50 min-w-80 max-w-md">
                    <Alert type={alert.type} title={alert.type === 'success' ? t('success') : t('error')} message={alert.message} onClose={() => setAlert(null)} />
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

            {/* Add New Property Modal */}
            {showAddPropertyModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !savingNewOption && setShowAddPropertyModal(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('add_new_property')}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    {t('property_value')} <span className="text-red-500">*</span>
                                    <span className="text-xs text-gray-500 ml-2">({t('translation_key_format')})</span>
                                </label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newPropertyValue}
                                    onChange={(e) => setNewPropertyValue(e.target.value)}
                                    placeholder="e.g., swimming_pool"
                                    disabled={savingNewOption}
                                />
                            </div>
                            <div>
                                <SingleFileUpload
                                    title={t('property_icon')}
                                    description={t('upload_property_icon_desc') || ''}
                                    accept="image/*"
                                    file={newPropertyIconUI}
                                    onFileChange={(fi) => {
                                        setNewPropertyIconUI(fi);
                                        setNewPropertyIcon(fi?.file || null);
                                    }}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowAddPropertyModal(false)} className="btn btn-outline-secondary" disabled={savingNewOption}>
                                    {t('cancel')}
                                </button>
                                <button type="button" onClick={handleAddNewProperty} className="btn btn-primary gap-2" disabled={savingNewOption || !newPropertyValue.trim()}>
                                    {savingNewOption ? <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5"></span> : <IconPlus />}
                                    {savingNewOption ? t('saving') : t('save')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add New Suitable For Modal */}
            {showAddSuitableForModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !savingNewOption && setShowAddSuitableForModal(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('add_new_suitable_for')}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    {t('suitable_for_value')} <span className="text-red-500">*</span>
                                    <span className="text-xs text-gray-500 ml-2">({t('translation_key_format')})</span>
                                </label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newSuitableForValue}
                                    onChange={(e) => setNewSuitableForValue(e.target.value)}
                                    placeholder="e.g., preschool"
                                    disabled={savingNewOption}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowAddSuitableForModal(false)} className="btn btn-outline-secondary" disabled={savingNewOption}>
                                    {t('cancel')}
                                </button>
                                <button type="button" onClick={handleAddNewSuitableFor} className="btn btn-primary gap-2" disabled={savingNewOption || !newSuitableForValue.trim()}>
                                    {savingNewOption ? <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5"></span> : <IconPlus />}
                                    {savingNewOption ? t('saving') : t('save')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmModal && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => !deletingProperty && !deletingSuitableFor && setDeleteConfirmModal(null)}
                >
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <IconTrashLines className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('confirm_delete')}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{deleteConfirmModal.type === 'property' ? t('delete_property_warning') : t('delete_suitable_warning')}</p>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('you_are_deleting')}:</p>
                            <p className="text-base font-semibold text-gray-900 dark:text-white">{deleteConfirmModal.name}</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setDeleteConfirmModal(null)}
                                className="flex-1 btn btn-outline-secondary"
                                disabled={deletingProperty !== null || deletingSuitableFor !== null}
                            >
                                {t('cancel')}
                            </button>
                            <button type="button" onClick={confirmDelete} className="flex-1 btn btn-danger gap-2" disabled={deletingProperty !== null || deletingSuitableFor !== null}>
                                {deletingProperty !== null || deletingSuitableFor !== null ? (
                                    <>
                                        <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5"></span>
                                        {t('deleting')}
                                    </>
                                ) : (
                                    <>
                                        <IconTrashLines className="w-5 h-5" />
                                        {t('delete')}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
