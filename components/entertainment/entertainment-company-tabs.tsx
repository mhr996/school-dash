'use client';
import { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import supabase from '@/lib/supabase';
import { getTranslation } from '@/i18n';
import IconPlus from '@/components/icon/icon-plus';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconSave from '@/components/icon/icon-save';
import IconEdit from '@/components/icon/icon-edit';
import IconStar from '@/components/icon/icon-star';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import ImageUpload from '@/components/image-upload/image-upload';

interface EntertainmentCompanyService {
    id?: string;
    service_label: string;
    service_price: number;
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
    const [alert, setAlert] = useState<{ visible: boolean; message: string; type: 'success' | 'danger' }>({
        visible: false,
        message: '',
        type: 'success',
    });

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
            setAlert({
                visible: true,
                message: t('error_loading_services') || 'שגיאה בטעינת שירותים',
                type: 'danger',
            });
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

    const handleDeleteService = async (index: number) => {
        const service = services[index];

        if (service.id) {
            // Delete from database
            try {
                const { error } = await supabase.from('entertainment_company_services').delete().eq('id', service.id);

                if (error) throw error;

                setAlert({
                    visible: true,
                    message: t('service_deleted_successfully') || 'השירות נמחק בהצלחה',
                    type: 'success',
                });
            } catch (error) {
                console.error('Error deleting service:', error);
                setAlert({
                    visible: true,
                    message: t('error_deleting_service') || 'שגיאה במחיקת שירות',
                    type: 'danger',
                });
                return;
            }
        }

        // Remove from state
        const updatedServices = services.filter((_, i) => i !== index);
        setServices(updatedServices);
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

            setAlert({
                visible: true,
                message: t('basic_info_updated_successfully') || 'המידע הבסיסי עודכן בהצלחה',
                type: 'success',
            });

            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Error updating basic info:', error);
            setAlert({
                visible: true,
                message: t('error_updating_basic_info') || 'שגיאה בעדכון מידע בסיסי',
                type: 'danger',
            });
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
                setAlert({
                    visible: true,
                    message: t('please_fill_all_service_fields') || 'אנא מלא את כל שדות השירות',
                    type: 'danger',
                });
                setSaving(false);
                return;
            }

            // Separate new services from existing ones
            const newServices = services.filter((s) => !s.id);
            const existingServices = services.filter((s) => s.id);

            // Insert new services
            if (newServices.length > 0) {
                const { error: insertError } = await supabase.from('entertainment_company_services').insert(
                    newServices.map((s) => ({
                        entertainment_company_id: companyId,
                        service_label: s.service_label,
                        service_price: s.service_price,
                    })),
                );

                if (insertError) throw insertError;
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

            setAlert({
                visible: true,
                message: t('services_saved_successfully') || 'השירותים נשמרו בהצלחה',
                type: 'success',
            });

            // Refresh services
            await fetchServices();
        } catch (error) {
            console.error('Error saving services:', error);
            setAlert({
                visible: true,
                message: t('error_saving_services') || 'שגיאה בשמירת שירותים',
                type: 'danger',
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            {alert.visible && (
                <div className="mb-4">
                    <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ ...alert, visible: false })} />
                </div>
            )}

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
                                                        setAlert({
                                                            visible: true,
                                                            message: t('image_uploaded_successfully') || 'התמונה הועלתה בהצלחה',
                                                            type: 'success',
                                                        });
                                                    }}
                                                    onError={(error) => {
                                                        setAlert({
                                                            visible: true,
                                                            message: error,
                                                            type: 'danger',
                                                        });
                                                    }}
                                                    buttonLabel={t('upload_image') || 'העלה תמונה'}
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
        </div>
    );
}
