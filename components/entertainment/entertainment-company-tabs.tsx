'use client';
import { useState, useEffect, Fragment } from 'react';
import { Tab, Transition } from '@headlessui/react';
import supabase from '@/lib/supabase';
import { getTranslation } from '@/i18n';
import IconPlus from '@/components/icon/icon-plus';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconSave from '@/components/icon/icon-save';
import IconEdit from '@/components/icon/icon-edit';
import IconStar from '@/components/icon/icon-star';
import IconX from '@/components/icon/icon-x';
import ImageUpload from '@/components/image-upload/image-upload';
import ConfirmModal from '@/components/modals/confirm-modal';
import { uploadSubServiceIcon, deleteSubServiceIcon, getSubServiceIconUrl } from '@/utils/sub-service-icon-upload';

interface EntertainmentCompanyService {
    id?: string;
    service_label: string;
    service_price: number;
    icon_path?: string | null;
    pendingIconFile?: File | null; // Temporary storage for new service icons
    pendingIconPreview?: string | null; // Preview URL for pending icons
}

interface EntertainmentCompanyTabsProps {
    companyId: string;
    companyData: {
        name: string;
        description?: string;
        price?: number;
        image?: string;
        status: string;
    };
    onUpdate?: () => void;
    isServiceProvider?: boolean; // true if viewed by the service, false if admin
}

export default function EntertainmentCompanyTabs({ companyId, companyData, onUpdate, isServiceProvider = false }: EntertainmentCompanyTabsProps) {
    const { t } = getTranslation();
    const [services, setServices] = useState<EntertainmentCompanyService[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Toast notification state
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error'>('success');

    // Confirm modal state
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState<number | null>(null);

    // Helper function to show alert
    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setAlertMessage(message);
        setAlertType(type);
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
    };

    // Basic info state
    const [basicInfo, setBasicInfo] = useState({
        name: companyData.name || '',
        description: companyData.description || '',
        price: companyData.price || 0,
        image: companyData.image || '',
        status: companyData.status || 'active',
    });

    useEffect(() => {
        fetchServices();
    }, [companyId]);

    const fetchServices = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.from('entertainment_company_services').select('*').eq('entertainment_company_id', companyId).order('created_at', { ascending: false });

            if (error) throw error;
            setServices(data || []);
        } catch (error) {
            console.error('Error fetching services:', error);
            showNotification(t('error_loading_services') || 'Error loading services', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddService = () => {
        setServices([
            ...services,
            {
                service_label: '',
                service_price: 0,
                icon_path: null,
            },
        ]);
    };

    const handleServiceChange = (index: number, field: keyof EntertainmentCompanyService, value: any) => {
        const updatedServices = [...services];
        updatedServices[index] = {
            ...updatedServices[index],
            [field]: value,
        };
        setServices(updatedServices);
    };

    const handleServiceIconUpload = async (index: number, file: File) => {
        const service = services[index];

        // If service is not yet saved, store the file temporarily
        if (!service.id) {
            const previewUrl = URL.createObjectURL(file);
            const updatedServices = [...services];
            updatedServices[index] = {
                ...updatedServices[index],
                pendingIconFile: file,
                pendingIconPreview: previewUrl,
            };
            setServices(updatedServices);

            showNotification(t('icon_will_be_uploaded_on_save') || 'Icon will be uploaded when you save the service', 'success');
            return;
        }

        // For existing services, upload immediately
        try {
            const result = await uploadSubServiceIcon({
                serviceType: 'entertainment_company_services',
                parentServiceId: companyId,
                subServiceId: service.id,
                file,
            });

            if (result.success && result.path) {
                // Update the service in state
                const updatedServices = [...services];
                updatedServices[index] = {
                    ...updatedServices[index],
                    icon_path: result.path,
                };
                setServices(updatedServices);

                showNotification(t('icon_uploaded_successfully') || 'Icon uploaded successfully', 'success');

                // Refresh services to get updated data
                await fetchServices();
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Error uploading icon:', error);
            showNotification(error instanceof Error ? error.message : t('error_uploading_icon') || 'Error uploading icon', 'error');
        }
    };

    const handleServiceIconDelete = async (index: number) => {
        const service = services[index];

        // If it's a pending icon (not yet saved), just remove it from state
        if (!service.id && service.pendingIconPreview) {
            URL.revokeObjectURL(service.pendingIconPreview);
            const updatedServices = [...services];
            updatedServices[index] = {
                ...updatedServices[index],
                pendingIconFile: null,
                pendingIconPreview: null,
            };
            setServices(updatedServices);
            return;
        }

        if (!service.id || !service.icon_path) return;

        try {
            const result = await deleteSubServiceIcon('entertainment_company_services', companyId, service.id);

            if (result.success) {
                // Update the service in state
                const updatedServices = [...services];
                updatedServices[index] = {
                    ...updatedServices[index],
                    icon_path: null,
                };
                setServices(updatedServices);

                showNotification(t('icon_deleted_successfully') || 'Icon deleted successfully', 'success');
            } else {
                throw new Error(result.error || 'Delete failed');
            }
        } catch (error) {
            console.error('Error deleting icon:', error);
            showNotification(error instanceof Error ? error.message : t('error_deleting_icon') || 'Error deleting icon', 'error');
        }
    };

    const handleDeleteService = async (index: number) => {
        setServiceToDelete(index);
        setShowConfirmModal(true);
    };

    const confirmDeleteService = async () => {
        if (serviceToDelete === null) return;

        const service = services[serviceToDelete];

        // Clean up preview URL if exists
        if (service.pendingIconPreview) {
            URL.revokeObjectURL(service.pendingIconPreview);
        }

        if (service.id) {
            // Delete icon from storage if exists
            if (service.icon_path) {
                try {
                    await deleteSubServiceIcon('entertainment_company_services', companyId, service.id);
                } catch (error) {
                    console.error('Error deleting service icon:', error);
                }
            }

            // Delete from database
            try {
                const { error } = await supabase.from('entertainment_company_services').delete().eq('id', service.id);

                if (error) throw error;

                showNotification(t('service_deleted_successfully') || 'Service deleted successfully', 'success');
            } catch (error) {
                console.error('Error deleting service:', error);
                showNotification(t('error_deleting_service') || 'Error deleting service', 'error');
                setShowConfirmModal(false);
                setServiceToDelete(null);
                return;
            }
        }

        // Remove from state
        const updatedServices = services.filter((_, i) => i !== serviceToDelete);
        setServices(updatedServices);

        setShowConfirmModal(false);
        setServiceToDelete(null);
    };

    const handleSaveBasicInfo = async () => {
        try {
            setSaving(true);
            const { error } = await supabase
                .from('external_entertainment_companies')
                .update({
                    name: basicInfo.name,
                    description: basicInfo.description,
                    price: basicInfo.price,
                    image: basicInfo.image,
                    status: basicInfo.status,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', companyId);

            if (error) throw error;

            showNotification(t('basic_info_updated_successfully') || 'Basic information updated successfully', 'success');

            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Error updating basic info:', error);
            showNotification(t('error_updating_basic_info') || 'Error updating basic information', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveServices = async () => {
        try {
            setSaving(true);

            // Validate services
            const invalidServices = services.filter((s) => !s.service_label || s.service_label.trim() === '' || s.service_price < 0);

            if (invalidServices.length > 0) {
                showNotification(t('please_fill_all_service_fields') || 'Please fill all service fields', 'error');
                setSaving(false);
                return;
            }

            // Separate new services from existing ones
            const newServices = services.filter((s) => !s.id);
            const existingServices = services.filter((s) => s.id);

            // Insert new services and get their IDs
            let insertedServices: any[] = [];
            if (newServices.length > 0) {
                const { data: inserted, error: insertError } = await supabase
                    .from('entertainment_company_services')
                    .insert(
                        newServices.map((s) => ({
                            entertainment_company_id: companyId,
                            service_label: s.service_label,
                            service_price: s.service_price,
                        })),
                    )
                    .select();

                if (insertError) throw insertError;
                insertedServices = inserted || [];

                // Upload pending icons for newly inserted services
                for (let i = 0; i < newServices.length; i++) {
                    const newService = newServices[i];
                    const insertedService = insertedServices[i];

                    if (newService.pendingIconFile && insertedService?.id) {
                        try {
                            await uploadSubServiceIcon({
                                serviceType: 'entertainment_company_services',
                                parentServiceId: companyId,
                                subServiceId: insertedService.id,
                                file: newService.pendingIconFile,
                            });

                            // Clean up preview URL
                            if (newService.pendingIconPreview) {
                                URL.revokeObjectURL(newService.pendingIconPreview);
                            }
                        } catch (iconError) {
                            console.error('Error uploading pending icon:', iconError);
                            // Continue with other icons even if one fails
                        }
                    }
                }
            }

            // Update existing services
            for (const service of existingServices) {
                const { error: updateError } = await supabase
                    .from('entertainment_company_services')
                    .update({
                        service_label: service.service_label,
                        service_price: service.service_price,
                    })
                    .eq('id', service.id);

                if (updateError) throw updateError;
            }

            showNotification(t('services_saved_successfully') || 'Services saved successfully', 'success');

            // Refresh services
            await fetchServices();
        } catch (error) {
            console.error('Error saving services:', error);
            showNotification(t('error_saving_services') || 'Error saving services', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            {' '}
            <Tab.Group>
                <Tab.List className="flex space-x-1 rtl:space-x-reverse rounded-xl bg-blue-900/20 p-1 mb-6">
                    <Tab
                        className={({ selected }) =>
                            `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all
                            ${
                                selected
                                    ? 'bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-400 shadow'
                                    : 'text-gray-700 dark:text-gray-400 hover:bg-white/[0.12] hover:text-gray-900 dark:hover:text-white'
                            }`
                        }
                    >
                        <div className="flex items-center justify-center gap-2">
                            <IconEdit className="w-4 h-4" />
                            {t('basic_information') || 'מידע בסיסי'}
                        </div>
                    </Tab>
                    <Tab
                        className={({ selected }) =>
                            `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all
                            ${
                                selected
                                    ? 'bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-400 shadow'
                                    : 'text-gray-700 dark:text-gray-400 hover:bg-white/[0.12] hover:text-gray-900 dark:hover:text-white'
                            }`
                        }
                    >
                        <div className="flex items-center justify-center gap-2">
                            <IconStar className="w-4 h-4" />
                            {t('services_provided') || 'שירותים'}
                            {services.length > 0 && (
                                <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">{services.length}</span>
                            )}
                        </div>
                    </Tab>
                </Tab.List>

                <Tab.Panels>
                    {/* Basic Information Tab */}
                    <Tab.Panel>
                        <div className="panel">
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium mb-1">
                                            {t('company_name') || 'שם החברה'} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="name"
                                            type="text"
                                            className="form-input"
                                            value={basicInfo.name}
                                            onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })}
                                            placeholder={t('enter_company_name') || 'הזן שם חברה'}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="price" className="block text-sm font-medium mb-1">
                                            {t('base_price') || 'מחיר בסיס'} (₪)
                                        </label>
                                        <input
                                            id="price"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="form-input"
                                            value={basicInfo.price}
                                            onChange={(e) => setBasicInfo({ ...basicInfo, price: parseFloat(e.target.value) || 0 })}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium mb-1">
                                        {t('description') || 'תיאור'}
                                    </label>
                                    <textarea
                                        id="description"
                                        rows={4}
                                        className="form-textarea"
                                        value={basicInfo.description}
                                        onChange={(e) => setBasicInfo({ ...basicInfo, description: e.target.value })}
                                        placeholder={t('enter_description') || 'הזן תיאור'}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label htmlFor="image" className="block text-sm font-medium mb-2">
                                            {t('company_image') || 'תמונת החברה'}
                                        </label>
                                        <div className="flex items-start gap-4">
                                            {/* Image Preview */}
                                            {basicInfo.image && (
                                                <div className="flex-shrink-0">
                                                    <img
                                                        src={basicInfo.image}
                                                        alt={t('current_image') || 'תמונה נוכחית'}
                                                        className="w-32 h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                                                        onError={(e) => {
                                                            e.currentTarget.src = '/assets/images/img-placeholder-fallback.webp';
                                                        }}
                                                    />
                                                </div>
                                            )}

                                            {/* Image Upload Component */}
                                            <div className="flex-1">
                                                <ImageUpload
                                                    bucket="entertainment-companies"
                                                    userId={companyId}
                                                    url={basicInfo.image || null}
                                                    onUploadComplete={(url) => {
                                                        setBasicInfo({ ...basicInfo, image: url });
                                                        showNotification(t('image_uploaded_successfully') || 'Image uploaded successfully', 'success');
                                                    }}
                                                    onError={(error) => {
                                                        showNotification(error, 'error');
                                                    }}
                                                    buttonLabel={t('upload_image') || 'Upload Image'}
                                                />
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{t('supported_formats') || 'פורמטים נתמכים'}: JPG, PNG, GIF</p>
                                            </div>
                                        </div>
                                    </div>

                                    {!isServiceProvider && (
                                        <div>
                                            <label htmlFor="status" className="block text-sm font-medium mb-1">
                                                {t('status') || 'סטטוס'}
                                            </label>
                                            <select id="status" className="form-select" value={basicInfo.status} onChange={(e) => setBasicInfo({ ...basicInfo, status: e.target.value })}>
                                                <option value="active">{t('active') || 'פעיל'}</option>
                                                <option value="inactive">{t('inactive') || 'לא פעיל'}</option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end">
                                    <button onClick={handleSaveBasicInfo} disabled={saving} className="btn btn-primary flex items-center gap-2">
                                        <IconSave className="w-4 h-4" />
                                        {saving ? t('saving') || 'שומר...' : t('save_changes') || 'שמור שינויים'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Tab.Panel>

                    {/* Services Tab */}
                    <Tab.Panel>
                        <div className="panel">
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold">{t('services_provided') || 'שירותים מוצעים'}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('manage_sub_services_pricing') || 'נהל שירותי משנה ותמחור'}</p>
                                </div>
                                <button onClick={handleAddService} className="btn btn-primary gap-2">
                                    <IconPlus className="w-5 h-5" />
                                    {t('add_service') || 'הוסף שירות'}
                                </button>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                                </div>
                            ) : services.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                                        <IconStar className="w-10 h-10 text-primary" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('no_services_yet') || 'אין שירותים עדיין'}</h3>
                                    <p className="text-gray-500 dark:text-gray-400 mb-6">{t('click_add_service_to_start') || 'לחץ על "הוסף שירות" כדי להתחיל'}</p>
                                    <button onClick={handleAddService} className="btn btn-outline-primary gap-2">
                                        <IconPlus className="w-4 h-4" />
                                        {t('add_first_service') || 'הוסף שירות ראשון'}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="overflow-x-auto">
                                        <table className="table-auto w-full">
                                            <thead>
                                                <tr className="bg-gray-50 dark:bg-gray-800">
                                                    <th className="px-4 py-3  text-sm font-semibold text-gray-700 dark:text-gray-300">#</th>
                                                    <th className="px-4 py-3  text-sm font-semibold text-gray-700 dark:text-gray-300">{t('icon') || 'אייקון'}</th>
                                                    <th className="px-4 py-3  text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                        {t('service_name') || 'שם השירות'} <span className="text-red-500">*</span>
                                                    </th>
                                                    <th className="px-4 py-3  text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                        {t('price') || 'מחיר'} (₪) <span className="text-red-500">*</span>
                                                    </th>
                                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">{t('actions') || 'פעולות'}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {services.map((service, index) => (
                                                    <tr key={service.id || `new-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{index + 1}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                {service.icon_path || service.pendingIconPreview ? (
                                                                    <div className="relative group">
                                                                        <img
                                                                            src={service.pendingIconPreview || getSubServiceIconUrl('entertainment_company_services', service.icon_path || null) || ''}
                                                                            alt={service.service_label}
                                                                            className="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                                                                            onError={(e) => {
                                                                                e.currentTarget.src = '/assets/images/img-placeholder-fallback.webp';
                                                                            }}
                                                                        />
                                                                        {service.pendingIconPreview && (
                                                                            <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full text-[10px]">
                                                                                {t('pending') || 'ממתין'}
                                                                            </div>
                                                                        )}
                                                                        <button
                                                                            onClick={() => handleServiceIconDelete(index)}
                                                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                                            title={t('delete_icon') || 'מחק אייקון'}
                                                                        >
                                                                            ×
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                                                                        <IconStar className="w-6 h-6 text-gray-400" />
                                                                    </div>
                                                                )}
                                                                <label className="cursor-pointer">
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        className="hidden"
                                                                        onChange={(e) => {
                                                                            const file = e.target.files?.[0];
                                                                            if (file) {
                                                                                handleServiceIconUpload(index, file);
                                                                            }
                                                                        }}
                                                                    />
                                                                    <span className="btn btn-sm btn-outline-primary">
                                                                        {service.icon_path || service.pendingIconPreview ? t('change') : t('upload')}
                                                                    </span>
                                                                </label>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="text"
                                                                className="form-input w-full"
                                                                value={service.service_label}
                                                                onChange={(e) => handleServiceChange(index, 'service_label', e.target.value)}
                                                                placeholder={t('label')}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                className="form-input w-full max-w-[150px]"
                                                                value={service.service_price}
                                                                onChange={(e) => handleServiceChange(index, 'service_price', parseFloat(e.target.value) || 0)}
                                                                placeholder="0.00"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <button onClick={() => handleDeleteService(index)} className="btn btn-sm btn-outline-danger" title={t('delete') || 'מחק'}>
                                                                <IconTrashLines className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {services.length} {services.length === 1 ? t('service') || 'שירות' : t('services') || 'שירותים'}
                                        </p>
                                        <button onClick={handleSaveServices} disabled={saving} className="btn btn-primary gap-2">
                                            <IconSave className="w-5 h-5" />
                                            {saving ? t('saving') || 'שומר...' : t('save_all_services') || 'שמור שירותים'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Tab.Panel>
                </Tab.Panels>
            </Tab.Group>
            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={showConfirmModal}
                title={t('confirm_delete') || 'Confirm Delete'}
                message={t('confirm_delete_service_message') || 'Are you sure you want to delete this service? This action cannot be undone.'}
                onCancel={() => {
                    setShowConfirmModal(false);
                    setServiceToDelete(null);
                }}
                onConfirm={confirmDeleteService}
                confirmLabel={t('delete') || 'Delete'}
                cancelLabel={t('cancel') || 'Cancel'}
            />
            {/* Toast Notification */}
            <Transition
                show={showAlert}
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4"
                enterTo="opacity-100 translate-y-0"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-4"
            >
                <div className="fixed top-20 right-5 z-[9999] max-w-md">
                    <div className={`rounded-lg p-4 shadow-lg ${alertType === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                        <div className="flex items-center gap-3">
                            <div className="flex-1">{alertMessage}</div>
                            <button type="button" onClick={() => setShowAlert(false)} className="hover:opacity-80">
                                <IconX className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>
        </div>
    );
}
