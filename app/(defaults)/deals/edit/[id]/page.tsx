'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import supabase from '@/lib/supabase';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import { getTranslation } from '@/i18n';
import DealTypeSelect from '@/components/deal-type-select/deal-type-select';
import DealStatusSelect from '@/components/deal-status-select/deal-status-select';
import CustomerSelect from '@/components/customer-select/customer-select';
import CarSelect from '@/components/car-select/car-select';
import SingleFileUpload from '@/components/file-upload/single-file-upload';
import { Deal, Customer, Car, FileItem, DealAttachments, DealAttachment } from '@/types';
import { uploadMultipleFiles, deleteFile, uploadFile } from '@/utils/file-upload';
import AttachmentsDisplay from '@/components/attachments/attachments-display';
import IconNotes from '@/components/icon/icon-notes';
import IconCar from '@/components/icon/icon-car';

const EditDeal = ({ params }: { params: { id: string } }) => {
    const { t } = getTranslation();
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [deal, setDeal] = useState<Deal | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [selectedCar, setSelectedCar] = useState<Car | null>(null);
    const [carTakenFromClient, setCarTakenFromClient] = useState<Car | null>(null);
    const dealId = params.id;

    // Helper function to format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const [dealType, setDealType] = useState('');
    const [form, setForm] = useState({
        title: '',
        description: '',
        amount: '',
        status: '',
        customer_id: '',
        car_id: '',
    }); // State for file attachments
    const [dealAttachments, setDealAttachments] = useState<DealAttachments>({
        carLicense: null,
        driverLicense: null,
        carTransferDocument: null,
    });
    const [existingAttachments, setExistingAttachments] = useState<DealAttachment[]>([]);
    const [newAttachments, setNewAttachments] = useState<{ [key: string]: FileItem }>({});

    const [alert, setAlert] = useState<{ visible: boolean; message: string; type: 'success' | 'danger' }>({
        visible: false,
        message: '',
        type: 'success',
    });

    useEffect(() => {
        const fetchDeal = async () => {
            try {
                const { data, error } = await supabase.from('deals').select('*').eq('id', dealId).single();

                if (error) throw error;
                if (data) {
                    setDeal(data);
                    setDealType(data.deal_type || '');
                    setForm({
                        title: data.title || '',
                        description: data.description || '',
                        amount: data.amount?.toString() || '0',
                        status: data.status || 'active',
                        customer_id: data.customer_id || '',
                        car_id: data.car_id || '',
                    });

                    // Set existing attachments
                    if (data.attachments && Array.isArray(data.attachments)) {
                        setExistingAttachments(data.attachments);
                    }

                    // Fetch customer details if customer_id exists
                    if (data.customer_id) {
                        const { data: customerData } = await supabase.from('customers').select('*').eq('id', data.customer_id).single();
                        if (customerData) {
                            setSelectedCustomer(customerData);
                        }
                    } // Fetch car details if car_id exists
                    if (data.car_id) {
                        const { data: carData } = await supabase.from('cars').select('*').eq('id', data.car_id).single();
                        if (carData) {
                            setSelectedCar(carData);
                        }
                    }

                    // Fetch car taken from client details if car_taken_from_client exists (for exchange deals)
                    if (data.car_taken_from_client) {
                        const { data: carTakenData } = await supabase.from('cars').select('*').eq('id', data.car_taken_from_client).single();
                        if (carTakenData) {
                            setCarTakenFromClient(carTakenData);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching deal:', error);
                setAlert({ visible: true, message: t('error_loading_data'), type: 'danger' });
            } finally {
                setLoading(false);
            }
        };

        if (dealId) {
            fetchDeal();
        }
    }, [dealId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };
    const handleDealTypeChange = (type: string) => {
        setDealType(type);
    };
    const handleStatusChange = (status: string) => {
        setForm((prev) => ({ ...prev, status }));
    };

    const handleCustomerSelect = (customer: Customer | null) => {
        setSelectedCustomer(customer);
        setForm((prev) => ({ ...prev, customer_id: customer?.id || '' }));
    };

    const handleCarSelect = (car: Car | null) => {
        setSelectedCar(car);
        setForm((prev) => ({ ...prev, car_id: car?.id || '' }));
    };
    const handleCreateNewCustomer = () => {
        // Navigate to create customer page
        // This can be implemented later
        console.log('Create new customer');
    }; // Handle file upload for new attachments
    const handleFileUpload = (type: string, fileItem: FileItem | null) => {
        if (fileItem) {
            setNewAttachments((prev) => ({ ...prev, [type]: fileItem }));
        } else {
            // Remove the file if null
            handleRemoveNewAttachment(type);
        }
    };

    // Remove existing attachment
    const handleRemoveExistingAttachment = async (attachment: DealAttachment) => {
        try {
            // Extract bucket and file path from the attachment URL
            const bucket = 'deals';
            const filePath = attachment.url.replace(`/${bucket}/`, '');

            // Delete from storage
            const deleteSuccess = await deleteFile(bucket, filePath);
            if (!deleteSuccess) {
                throw new Error('Failed to delete file from storage');
            }

            // Update database
            const updatedAttachments = existingAttachments.filter((a) => a.url !== attachment.url);
            const { error } = await supabase.from('deals').update({ attachments: updatedAttachments }).eq('id', dealId);

            if (error) throw error;

            setExistingAttachments(updatedAttachments);
            setAlert({ visible: true, message: t('attachment_removed_successfully'), type: 'success' });
        } catch (error) {
            console.error('Error removing attachment:', error);
            setAlert({
                visible: true,
                message: t('error_removing_attachment'),
                type: 'danger',
            });
        }
    };

    // Remove new attachment (not yet saved)
    const handleRemoveNewAttachment = (type: string) => {
        const fileItem = newAttachments[type];
        if (fileItem?.preview) {
            URL.revokeObjectURL(fileItem.preview);
        }
        setNewAttachments((prev) => {
            const updated = { ...prev };
            delete updated[type];
            return updated;
        });
    };

    const validateForm = () => {
        if (!dealType.trim()) {
            setAlert({ visible: true, message: t('deal_type_required'), type: 'danger' });
            return false;
        }
        if (!form.title.trim()) {
            setAlert({ visible: true, message: t('deal_title_required'), type: 'danger' });
            return false;
        }
        if (!form.description.trim()) {
            setAlert({ visible: true, message: t('description_required'), type: 'danger' });
            return false;
        }
        if (form.amount && parseFloat(form.amount) < 0) {
            setAlert({ visible: true, message: t('amount_cannot_be_negative'), type: 'danger' });
            return false;
        }
        return true;
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setSaving(true);
        try {
            const dealData = {
                deal_type: dealType,
                title: form.title.trim(),
                description: form.description.trim(),
                amount: form.amount ? parseFloat(form.amount) : 0,
                status: form.status,
                customer_id: form.customer_id || null,
                car_id: form.car_id || null,
            };

            // Handle new file uploads
            let updatedAttachments = [...existingAttachments];

            // Upload new attachments
            for (const [type, fileItem] of Object.entries(newAttachments)) {
                if (fileItem) {
                    const uploadResult = await uploadFile(fileItem.file, 'deals', dealId, `${type}.${fileItem.file.name.split('.').pop()}`);

                    if (uploadResult.success && uploadResult.url) {
                        const newAttachment: DealAttachment = {
                            type: type as DealAttachment['type'],
                            name: fileItem.file.name,
                            url: uploadResult.url,
                            size: fileItem.file.size,
                            mimeType: fileItem.file.type,
                            uploadedAt: new Date().toISOString(),
                        };
                        updatedAttachments.push(newAttachment);
                    }
                }
            }

            // Include attachments in deal data
            const finalDealData = {
                ...dealData,
                attachments: updatedAttachments,
            };

            const { error } = await supabase.from('deals').update(finalDealData).eq('id', dealId);

            if (error) throw error;

            setAlert({ visible: true, message: t('deal_updated_successfully'), type: 'success' });

            // Redirect to deals list after a short delay
            setTimeout(() => {
                router.push('/deals');
            }, 1500);
        } catch (error) {
            console.error(error);
            setAlert({
                visible: true,
                message: error instanceof Error ? error.message : t('error_updating_deal'),
                type: 'danger',
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!deal) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('deal_not_found')}</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">{t('deal_not_found_description')}</p>
                    <Link href="/deals" className="btn btn-primary mt-4">
                        {t('back_to_deals')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
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
                        <Link href="/deals" className="text-primary hover:underline">
                            {t('deals')}
                        </Link>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <span>{t('edit_deal')}</span>
                    </li>
                </ul>
            </div>

            <div className="mb-6">
                <h1 className="text-2xl font-bold">{t('edit_deal')}</h1>
                <p className="text-gray-500">{t('update_deal_description')}</p>
            </div>

            {alert.visible && (
                <div className="mb-6">
                    <Alert
                        type={alert.type}
                        title={alert.type === 'success' ? t('success') : t('error')}
                        message={alert.message}
                        onClose={() => setAlert({ visible: false, message: '', type: 'success' })}
                    />
                </div>
            )}

            <div className="panel">
                <div className="mb-5">
                    <h5 className="text-lg font-semibold dark:text-white-light">{t('deal_information')}</h5>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Deal Type Selector */}
                    <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-lg border-2 border-primary/20">
                        <label className="block text-lg font-bold text-gray-700 dark:text-white mb-4">
                            {t('deal_type')} <span className="text-red-500">*</span>
                        </label>
                        <DealTypeSelect defaultValue={dealType} className="form-input text-lg py-3" name="deal_type" onChange={handleDealTypeChange} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Deal Title */}
                        <div className="md:col-span-2">
                            <label htmlFor="title" className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                                {t('deal_title')} <span className="text-red-500">*</span>
                            </label>
                            <input type="text" id="title" name="title" value={form.title} onChange={handleInputChange} className="form-input" placeholder={t('enter_deal_title')} required />
                        </div>
                        {/* Description */}
                        <div className="md:col-span-2">
                            <label htmlFor="description" className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                                {t('description')} <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={form.description}
                                onChange={handleInputChange}
                                className="form-textarea min-h-[120px]"
                                placeholder={t('enter_deal_description')}
                                required
                            />
                        </div>{' '}
                        {/* Amount */}
                        <div className="md:col-span-2">
                            <label htmlFor="amount" className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                                {t('amount')}
                            </label>
                            <div className="flex">
                                <span className="inline-flex items-center px-3 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 border ltr:border-r-0 rtl:border-l-0 border-gray-300 dark:border-gray-600 ltr:rounded-l-md rtl:rounded-r-md">
                                    $
                                </span>
                                <input
                                    type="number"
                                    id="amount"
                                    name="amount"
                                    step="0.01"
                                    min="0"
                                    value={form.amount}
                                    onChange={handleInputChange}
                                    className="form-input ltr:rounded-l-none rtl:rounded-r-none"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Deal Status Selector - Full Width */}
                    <div className="panel">
                        <div className="mb-5">
                            <h5 className="text-lg font-bold text-gray-900 dark:text-white-light">{t('deal_status')}</h5>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">{t('select_deal_status_desc')}</p>
                        </div>
                        <DealStatusSelect defaultValue={form.status} className="form-input" name="status" onChange={handleStatusChange} />
                    </div>

                    {/* Deal Summary Table */}
                    {selectedCar && (
                        <div className="panel">
                            <div className="mb-5">
                                <h5 className="text-lg font-bold text-gray-900 dark:text-white-light">{t('deal_summary')}</h5>
                            </div>
                            <div className="bg-transparent rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                {/* Table Header */}
                                <div className="grid grid-cols-3 gap-4 mb-4 pb-2 border-b border-gray-300 dark:border-gray-600">
                                    <div className="text-sm font-bold text-gray-700 dark:text-white text-right">{t('deal_item')}</div>
                                    <div className="text-sm font-bold text-gray-700 dark:text-white text-center">{t('deal_price')}</div>
                                </div>

                                {/* Row 1: Car */}
                                <div className="grid grid-cols-3 gap-4 mb-3 py-2">
                                    <div className="text-sm text-gray-700 dark:text-gray-300 text-right">
                                        <div className="font-medium">{t('car')}</div>
                                        <div className="text-xs mt-1 text-gray-500">
                                            {selectedCar.brand} {selectedCar.title} - {selectedCar.year}
                                        </div>
                                    </div>
                                    <div className="text-center">-</div>
                                </div>

                                {/* Row 2: Buy Price */}
                                <div className="grid grid-cols-3 gap-4 mb-3 py-2">
                                    <div className="text-sm text-gray-700 dark:text-gray-300 text-right">{t('buy_price')}</div>
                                    <div className="text-center">
                                        <span className="text-sm text-gray-700 dark:text-gray-300">${selectedCar.buy_price?.toFixed(2) || '0.00'}</span>
                                    </div>
                                </div>

                                {/* Row 3: Deal Amount */}
                                <div className="grid grid-cols-3 gap-4 mb-3 py-2">
                                    <div className="text-sm text-gray-700 dark:text-gray-300 text-right">{t('deal_amount')}</div>
                                    <div className="text-center">
                                        <span className="text-sm text-gray-700 dark:text-gray-300">${parseFloat(form.amount || '0').toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Row 4: Profit/Loss */}
                                <div className="grid grid-cols-3 gap-4 mb-3 py-2 border-t border-gray-200 dark:border-gray-600 pt-2">
                                    <div className="text-sm font-bold text-gray-700 dark:text-white text-right">{t('profit_loss')}</div>
                                    <div className="text-center">
                                        <span className={`text-sm font-bold ${parseFloat(form.amount || '0') - (selectedCar.buy_price || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            ${(parseFloat(form.amount || '0') - (selectedCar.buy_price || 0)).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Customer Selector */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">{t('customer')}</label>
                            <CustomerSelect selectedCustomer={selectedCustomer} onCustomerSelect={handleCustomerSelect} onCreateNew={handleCreateNewCustomer} className="form-input" />
                        </div>
                        {/* Car Selector */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">{t('car')}</label>
                            <CarSelect selectedCar={selectedCar} onCarSelect={handleCarSelect} className="form-input" />{' '}
                        </div>{' '}
                    </div>

                    {/* Car Taken From Client (Exchange Deals) */}
                    {carTakenFromClient && deal && deal.deal_type === 'exchange' && (
                        <div className="panel">
                            <div className="mb-5 flex items-center gap-3">
                                <IconCar className="w-5 h-5 text-orange-500" />
                                <h5 className="text-lg font-semibold dark:text-white-light">{t('car_taken_from_client')}</h5>
                            </div>
                            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm text-orange-600 dark:text-orange-400 font-medium">{t('car_name')}</label>
                                        <p className="font-bold text-gray-900 dark:text-white">{carTakenFromClient.title}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-orange-600 dark:text-orange-400 font-medium">{t('brand')}</label>
                                        <p className="font-bold text-gray-900 dark:text-white">{carTakenFromClient.brand}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-orange-600 dark:text-orange-400 font-medium">{t('year')}</label>
                                        <p className="font-bold text-gray-900 dark:text-white">{carTakenFromClient.year}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-orange-600 dark:text-orange-400 font-medium">{t('kilometers')}</label>
                                        <p className="font-bold text-gray-900 dark:text-white">
                                            {carTakenFromClient.kilometers.toLocaleString()} {t('km')}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-orange-600 dark:text-orange-400 font-medium">{t('received_value')}</label>
                                        <p className="font-bold text-orange-700 dark:text-orange-300">{formatCurrency(carTakenFromClient.buy_price)}</p>
                                    </div>
                                    {carTakenFromClient.car_number && (
                                        <div>
                                            <label className="block text-sm text-orange-600 dark:text-orange-400 font-medium">{t('car_number')}</label>
                                            <p className="font-bold text-gray-900 dark:text-white">{carTakenFromClient.car_number}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Deal Attachments */}
                    {deal.attachments && deal.attachments.length > 0 && (
                        <div className="panel">
                            <div className="mb-5 flex items-center gap-3">
                                <IconNotes className="w-5 h-5 text-primary" />
                                <h5 className="text-lg font-semibold dark:text-white-light">{t('existing_attachments')}</h5>
                            </div>
                            <AttachmentsDisplay attachments={deal.attachments} compact={false} />
                        </div>
                    )}
                    {/* Add New Attachments */}
                    <div className="panel">
                        <div className="mb-5 flex items-center gap-3">
                            <IconNotes className="w-5 h-5 text-primary" />
                            <h5 className="text-lg font-semibold dark:text-white-light">{t('deal_attachments')}</h5>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <SingleFileUpload
                                file={dealAttachments.carLicense}
                                onFileChange={(file) => setDealAttachments((prev) => ({ ...prev, carLicense: file }))}
                                title={t('car_license')}
                                description={t('car_license_desc')}
                                accept="image/*,.pdf"
                                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                            />
                            <SingleFileUpload
                                file={dealAttachments.driverLicense}
                                onFileChange={(file) => setDealAttachments((prev) => ({ ...prev, driverLicense: file }))}
                                title={t('driver_license')}
                                description={t('driver_license_desc')}
                                accept="image/*,.pdf"
                                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                            />
                            <SingleFileUpload
                                file={dealAttachments.carTransferDocument}
                                onFileChange={(file) => setDealAttachments((prev) => ({ ...prev, carTransferDocument: file }))}
                                title={t('car_transfer_document')}
                                description={t('car_transfer_document_desc')}
                                accept="image/*,.pdf"
                                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                            />
                        </div>
                    </div>
                    {/* Submit Button */}
                    <div className="flex justify-end gap-4 mt-8">
                        <button type="button" onClick={() => router.back()} className="btn btn-outline-danger">
                            {t('cancel')}
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? t('updating') : t('update_deal')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditDeal;
