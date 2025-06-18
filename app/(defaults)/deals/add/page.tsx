'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import supabase from '@/lib/supabase';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import { getTranslation } from '@/i18n';
import DealTypeSelect from '@/components/deal-type-select/deal-type-select';
import DealStatusSelect from '@/components/deal-status-select/deal-status-select';
import CustomerSelect from '@/components/customer-select/customer-select';
import CarSelect from '@/components/car-select/car-select';
import FileUpload from '@/components/file-upload/file-upload';
import CreateCustomerModal from '@/components/modals/create-customer-modal';
import IconUser from '@/components/icon/icon-user';
import IconMenuWidgets from '@/components/icon/menu/icon-menu-widgets';
import IconDollarSign from '@/components/icon/icon-dollar-sign';
import IconNotes from '@/components/icon/icon-notes';

interface Customer {
    id: string;
    name: string;
    phone: string;
    country: string;
    age: number;
    customer_type?: string;
    identity_number?: string;
    birth_date?: string;
}

interface Car {
    id: string;
    title: string;
    year: number;
    brand: string;
    status: string;
    type?: string;
    provider: string;
    kilometers: number;
    market_price: number;
    value_price: number;
    sale_price: number;
    images: string[] | string;
}

interface FileItem {
    file: File;
    preview?: string;
    id: string;
}

const AddDeal = () => {
    const { t } = getTranslation();
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false);
    const [dealType, setDealType] = useState('');
    const [dealStatus, setDealStatus] = useState('pending'); // Default to pending
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [selectedCar, setSelectedCar] = useState<Car | null>(null);

    // Form state for new/used sale deal
    const [saleForm, setSaleForm] = useState({
        title: '',
        notes: '',
        selling_price: '',
    }); // Form state for exchange deal
    const [exchangeForm, setExchangeForm] = useState({
        title: '',
        notes: '',
        // Customer old car details
        old_car_manufacturer: '',
        old_car_name: '',
        old_car_year: '',
        old_car_kilometers: '',
        old_car_condition: '', // يد
        old_car_market_price: '',
        old_car_purchase_price: '',
    });

    // Form state for company commission deal
    const [companyCommissionForm, setCompanyCommissionForm] = useState({
        title: '',
        company_name: '', // اسم الشركة المقدمه للعموله
        commission_date: '', // التاريخ
        amount: '', // المبلغ
        description: '', // حول (تفاصيل العموله)
    }); // File uploads - unified for all document types
    const [dealFiles, setDealFiles] = useState<FileItem[]>([]);

    const [alert, setAlert] = useState<{ visible: boolean; message: string; type: 'success' | 'danger' }>({
        visible: false,
        message: '',
        type: 'success',
    });

    // Auto-fill form when car is selected
    useEffect(() => {
        if (selectedCar && selectedCustomer) {
            if (dealType === 'new_used_sale') {
                setSaleForm((prev) => ({
                    ...prev,
                    title: `${t('sale_deal_for')} ${selectedCar.title} - ${selectedCustomer.name}`,
                    selling_price: selectedCar.sale_price.toString(),
                }));
            } else if (dealType === 'exchange') {
                setExchangeForm((prev) => ({
                    ...prev,
                    title: `${t('exchange_deal_for')} ${selectedCar.title} - ${selectedCustomer.name}`,
                }));
            }
        }
    }, [selectedCar, selectedCustomer, t, dealType]);

    const handleSaleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSaleForm((prev) => ({ ...prev, [name]: value }));
    };
    const handleExchangeFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setExchangeForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleCompanyCommissionFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCompanyCommissionForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleDealStatusChange = (status: string) => {
        setDealStatus(status);
    };

    const handleDealTypeChange = (type: string) => {
        setDealType(type);
        // Reset form when deal type changes
        setSelectedCustomer(null);
        setSelectedCar(null);
        setSaleForm({
            title: '',
            notes: '',
            selling_price: '',
        });
        setExchangeForm({
            title: '',
            notes: '',
            old_car_manufacturer: '',
            old_car_name: '',
            old_car_year: '',
            old_car_kilometers: '',
            old_car_condition: '',
            old_car_market_price: '',
            old_car_purchase_price: '',
        });
        setCompanyCommissionForm({
            title: '',
            company_name: '',
            commission_date: '',
            amount: '',
            description: '',
        });
        setDealFiles([]);
    };

    const handleCustomerCreated = (customer: Customer) => {
        setSelectedCustomer(customer);
        setAlert({ visible: true, message: t('customer_created_successfully'), type: 'success' });
    };

    const validateNewUsedSaleForm = () => {
        if (!selectedCustomer) {
            setAlert({ visible: true, message: t('customer_required'), type: 'danger' });
            return false;
        }
        if (!selectedCar) {
            setAlert({ visible: true, message: t('car_required'), type: 'danger' });
            return false;
        }
        if (!saleForm.title.trim()) {
            setAlert({ visible: true, message: t('deal_title_required'), type: 'danger' });
            return false;
        }
        if (!saleForm.selling_price || parseFloat(saleForm.selling_price) <= 0) {
            setAlert({ visible: true, message: t('selling_price_required'), type: 'danger' });
            return false;
        }
        return true;
    };
    const validateExchangeForm = () => {
        if (!selectedCustomer) {
            setAlert({ visible: true, message: t('customer_required'), type: 'danger' });
            return false;
        }
        if (!selectedCar) {
            setAlert({ visible: true, message: t('car_required'), type: 'danger' });
            return false;
        }
        if (!exchangeForm.old_car_manufacturer || !exchangeForm.old_car_name || !exchangeForm.old_car_year) {
            setAlert({ visible: true, message: t('old_car_details_required'), type: 'danger' });
            return false;
        }
        if (!exchangeForm.old_car_purchase_price || parseFloat(exchangeForm.old_car_purchase_price) <= 0) {
            setAlert({ visible: true, message: t('old_car_purchase_price_required'), type: 'danger' });
            return false;
        }
        return true;
    };

    const validateCompanyCommissionForm = () => {
        if (!companyCommissionForm.title.trim()) {
            setAlert({ visible: true, message: t('deal_title_required'), type: 'danger' });
            return false;
        }
        if (!companyCommissionForm.company_name.trim()) {
            setAlert({ visible: true, message: t('company_name_required'), type: 'danger' });
            return false;
        }
        if (!companyCommissionForm.commission_date) {
            setAlert({ visible: true, message: t('commission_date_required'), type: 'danger' });
            return false;
        }
        if (!companyCommissionForm.amount || parseFloat(companyCommissionForm.amount) <= 0) {
            setAlert({ visible: true, message: t('company_commission_amount_required'), type: 'danger' });
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!dealType) {
            setAlert({ visible: true, message: t('deal_type_required'), type: 'danger' });
            return;
        } // Validate based on deal type
        if (dealType === 'new_used_sale' && !validateNewUsedSaleForm()) {
            return;
        }
        if (dealType === 'exchange' && !validateExchangeForm()) {
            return;
        }
        if (dealType === 'company_commission' && !validateCompanyCommissionForm()) {
            return;
        }

        setSaving(true);
        try {
            let dealData: any = {
                deal_type: dealType,
                status: dealStatus,
                customer_id: selectedCustomer?.id || null,
            };

            if (dealType === 'new_used_sale') {
                dealData = {
                    ...dealData,
                    title: saleForm.title.trim(),
                    description: saleForm.notes.trim() || `${t('sale_deal_description')} ${selectedCar?.title}`,
                    amount: parseFloat(saleForm.selling_price),
                    car_id: selectedCar?.id,
                    deal_data: {
                        car_details: {
                            name: selectedCar?.title,
                            brand: selectedCar?.brand,
                            year: selectedCar?.year,
                            kilometers: selectedCar?.kilometers,
                            status: selectedCar?.status,
                            type: selectedCar?.type,
                            provider: selectedCar?.provider,
                            market_price: selectedCar?.market_price,
                            value_price: selectedCar?.value_price,
                            sale_price: selectedCar?.sale_price,
                            selling_price: parseFloat(saleForm.selling_price),
                        },
                        customer_details: {
                            name: selectedCustomer?.name,
                            phone: selectedCustomer?.phone,
                            country: selectedCustomer?.country,
                            age: selectedCustomer?.age,
                            identity_number: selectedCustomer?.identity_number,
                            birth_date: selectedCustomer?.birth_date,
                        },
                        attachments: {
                            total_files: dealFiles.length,
                        },
                    },
                    notes: saleForm.notes.trim(),
                };
            }
            if (dealType === 'exchange') {
                const exchangeAmount = selectedCar ? selectedCar.sale_price - parseFloat(exchangeForm.old_car_purchase_price || '0') : 0;
                dealData = {
                    ...dealData,
                    title: exchangeForm.title.trim(),
                    description: exchangeForm.notes.trim() || `${t('exchange_deal_description')} ${selectedCar?.title}`,
                    amount: exchangeAmount,
                    car_id: selectedCar?.id,
                    deal_data: {
                        new_car_details: {
                            name: selectedCar?.title,
                            brand: selectedCar?.brand,
                            year: selectedCar?.year,
                            kilometers: selectedCar?.kilometers,
                            status: selectedCar?.status,
                            type: selectedCar?.type,
                            provider: selectedCar?.provider,
                            market_price: selectedCar?.market_price,
                            value_price: selectedCar?.value_price,
                            sale_price: selectedCar?.sale_price,
                        },
                        old_car_details: {
                            manufacturer: exchangeForm.old_car_manufacturer,
                            name: exchangeForm.old_car_name,
                            year: parseInt(exchangeForm.old_car_year),
                            kilometers: parseInt(exchangeForm.old_car_kilometers || '0'),
                            condition: exchangeForm.old_car_condition,
                            market_price: parseFloat(exchangeForm.old_car_market_price || '0'),
                            purchase_price: parseFloat(exchangeForm.old_car_purchase_price || '0'),
                        },
                        customer_details: {
                            name: selectedCustomer?.name,
                            phone: selectedCustomer?.phone,
                            country: selectedCustomer?.country,
                            age: selectedCustomer?.age,
                            identity_number: selectedCustomer?.identity_number,
                            birth_date: selectedCustomer?.birth_date,
                        },
                        exchange_calculation: {
                            new_car_price: selectedCar?.sale_price || 0,
                            old_car_value: parseFloat(exchangeForm.old_car_purchase_price || '0'),
                            difference: exchangeAmount,
                        },

                        attachments: {
                            total_files: dealFiles.length,
                        },
                    },
                    notes: exchangeForm.notes.trim(),
                };
            }

            if (dealType === 'company_commission') {
                dealData = {
                    ...dealData,
                    title: companyCommissionForm.title.trim(),
                    description: companyCommissionForm.description.trim() || `${t('company_commission_deal_description')} ${companyCommissionForm.company_name}`,
                    amount: parseFloat(companyCommissionForm.amount),
                    deal_data: {
                        company_commission_details: {
                            company_name: companyCommissionForm.company_name.trim(),
                            commission_date: companyCommissionForm.commission_date,
                            amount: parseFloat(companyCommissionForm.amount),
                            description: companyCommissionForm.description.trim(),
                        },
                        attachments: {
                            total_files: dealFiles.length,
                        },
                    },
                    notes: companyCommissionForm.description.trim(),
                };
            }

            const { error } = await supabase.from('deals').insert([dealData]);

            if (error) throw error;

            setAlert({ visible: true, message: t('deal_added_successfully'), type: 'success' });

            // Redirect to deals list after a short delay
            setTimeout(() => {
                router.push('/deals');
            }, 1500);
        } catch (error) {
            console.error(error);
            setAlert({
                visible: true,
                message: error instanceof Error ? error.message : t('error_adding_deal'),
                type: 'danger',
            });
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const renderNewUsedSaleForm = () => (
        <div className="space-y-8">
            {/* Customer Selection */}
            <div className="panel">
                <div className="mb-5 flex items-center gap-3">
                    <IconUser className="w-5 h-5 text-primary" />
                    <h5 className="text-lg font-semibold dark:text-white-light">{t('customer_information')}</h5>
                </div>
                <div className="space-y-4">
                    <CustomerSelect selectedCustomer={selectedCustomer} onCustomerSelect={setSelectedCustomer} onCreateNew={() => setShowCreateCustomerModal(true)} className="form-input" />
                    <div className="flex justify-end">
                        <button type="button" onClick={() => setShowCreateCustomerModal(true)} className="btn btn-outline-primary">
                            {t('create_new_customer')}
                        </button>
                    </div>

                    {/* Customer Details Display */}
                    {selectedCustomer && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                            <h6 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">{t('customer_details')}</h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <span className="text-blue-600 dark:text-blue-300 font-medium">{t('customer_name')}:</span>
                                    <p className="text-blue-800 dark:text-blue-100">{selectedCustomer.name}</p>
                                </div>
                                <div>
                                    <span className="text-blue-600 dark:text-blue-300 font-medium">{t('phone')}:</span>
                                    <p className="text-blue-800 dark:text-blue-100">{selectedCustomer.phone}</p>
                                </div>
                                {selectedCustomer.identity_number && (
                                    <div>
                                        <span className="text-blue-600 dark:text-blue-300 font-medium">{t('identity_number')}:</span>
                                        <p className="text-blue-800 dark:text-blue-100">{selectedCustomer.identity_number}</p>
                                    </div>
                                )}
                                {selectedCustomer.birth_date && (
                                    <div>
                                        <span className="text-blue-600 dark:text-blue-300 font-medium">{t('birth_date')}:</span>
                                        <p className="text-blue-800 dark:text-blue-100">{new Date(selectedCustomer.birth_date).toLocaleDateString()}</p>
                                    </div>
                                )}
                                {selectedCustomer.country && (
                                    <div>
                                        <span className="text-blue-600 dark:text-blue-300 font-medium">{t('country')}:</span>
                                        <p className="text-blue-800 dark:text-blue-100">{selectedCustomer.country}</p>
                                    </div>
                                )}
                                <div>
                                    <span className="text-blue-600 dark:text-blue-300 font-medium">{t('age')}:</span>
                                    <p className="text-blue-800 dark:text-blue-100">
                                        {selectedCustomer.age} {t('years_old')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* Car Selection */}
            <div className="panel">
                <div className="mb-5 flex items-center gap-3">
                    <IconMenuWidgets className="w-5 h-5 text-primary" />
                    <h5 className="text-lg font-semibold dark:text-white-light">{t('car_information')}</h5>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                            {t('select_car')} <span className="text-red-500">*</span>
                        </label>
                        <CarSelect selectedCar={selectedCar} onCarSelect={setSelectedCar} className="form-input" />
                    </div>

                    {/* Car Details Display */}
                    {selectedCar && (
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                            <h6 className="font-semibold text-green-800 dark:text-green-200 mb-3">{t('car_details')}</h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <span className="text-green-600 dark:text-green-300 font-medium">{t('manufacturer')}:</span>
                                    <p className="text-green-800 dark:text-green-100">{selectedCar.brand}</p>
                                </div>
                                <div>
                                    <span className="text-green-600 dark:text-green-300 font-medium">{t('car_name')}:</span>
                                    <p className="text-green-800 dark:text-green-100">{selectedCar.title}</p>
                                </div>
                                <div>
                                    <span className="text-green-600 dark:text-green-300 font-medium">{t('provider')}:</span>
                                    <p className="text-green-800 dark:text-green-100">{selectedCar.provider}</p>
                                </div>
                                <div>
                                    <span className="text-green-600 dark:text-green-300 font-medium">{t('year')}:</span>
                                    <p className="text-green-800 dark:text-green-100">{selectedCar.year}</p>
                                </div>
                                <div>
                                    <span className="text-green-600 dark:text-green-300 font-medium">{t('kilometers')}:</span>
                                    <p className="text-green-800 dark:text-green-100">
                                        {selectedCar.kilometers.toLocaleString()} {t('km')}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-green-600 dark:text-green-300 font-medium">{t('status')}:</span>
                                    <p className="text-green-800 dark:text-green-100">{selectedCar.status}</p>
                                </div>
                                <div>
                                    <span className="text-green-600 dark:text-green-300 font-medium">{t('value_price')}:</span>
                                    <p className="text-green-800 dark:text-green-100">{formatCurrency(selectedCar.value_price)}</p>
                                </div>
                                <div>
                                    <span className="text-green-600 dark:text-green-300 font-medium">{t('market_price')}:</span>
                                    <p className="text-green-800 dark:text-green-100">{formatCurrency(selectedCar.market_price)}</p>
                                </div>
                                <div>
                                    <span className="text-green-600 dark:text-green-300 font-medium">{t('suggested_selling_price')}:</span>
                                    <p className="text-green-800 dark:text-green-100">{formatCurrency(selectedCar.sale_price)}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* Deal Details */}
            <div className="panel">
                <div className="mb-5 flex items-center gap-3">
                    <IconDollarSign className="w-5 h-5 text-primary" />
                    <h5 className="text-lg font-semibold dark:text-white-light">{t('deal_details')}</h5>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Deal Title */}
                    <div className="md:col-span-2">
                        <label htmlFor="title" className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                            {t('deal_title')} <span className="text-red-500">*</span>
                        </label>
                        <input type="text" id="title" name="title" value={saleForm.title} onChange={handleSaleFormChange} className="form-input" placeholder={t('enter_deal_title')} />
                    </div>
                    {/* Selling Price */}
                    <div>
                        <label htmlFor="selling_price" className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                            {t('selling_price')} <span className="text-red-500">*</span>
                        </label>
                        <div className="flex">
                            <span className="inline-flex items-center px-3 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 border ltr:border-r-0 rtl:border-l-0 border-gray-300 dark:border-gray-600 ltr:rounded-l-md rtl:rounded-r-md">
                                $
                            </span>
                            <input
                                type="number"
                                id="selling_price"
                                name="selling_price"
                                step="0.01"
                                min="0"
                                value={saleForm.selling_price}
                                onChange={handleSaleFormChange}
                                className="form-input ltr:rounded-l-none rtl:rounded-r-none"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    {/* Profit Calculation */}
                    {selectedCar && saleForm.selling_price && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">{t('estimated_profit')}</label>
                            <div className="flex">
                                <span className="inline-flex items-center px-3 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 border ltr:border-r-0 rtl:border-l-0 border-gray-300 dark:border-gray-600 ltr:rounded-l-md rtl:rounded-r-md">
                                    $
                                </span>
                                <input
                                    type="text"
                                    value={(parseFloat(saleForm.selling_price) - selectedCar.value_price).toFixed(2)}
                                    className="form-input ltr:rounded-l-none rtl:rounded-r-none bg-gray-50 dark:bg-gray-800"
                                    readOnly
                                />
                            </div>
                        </div>
                    )}
                    {/* Notes */}
                    <div className="md:col-span-2">
                        <label htmlFor="notes" className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                            {t('notes')}
                        </label>
                        <textarea id="notes" name="notes" value={saleForm.notes} onChange={handleSaleFormChange} className="form-textarea min-h-[120px]" placeholder={t('enter_deal_notes')} />
                    </div>
                </div>
            </div>
            {/* File Attachments */}
            <div className="panel">
                <div className="mb-5 flex items-center gap-3">
                    <IconNotes className="w-5 h-5 text-primary" />
                    <h5 className="text-lg font-semibold dark:text-white-light">{t('attachments')}</h5>
                </div>
                <div className="space-y-6">
                    <FileUpload
                        files={dealFiles}
                        onFilesChange={setDealFiles}
                        title={t('deal_documents')}
                        description={t('upload_deal_documents_desc')}
                        maxFiles={20}
                        accept="image/*,.pdf,.doc,.docx"
                    />
                </div>
            </div>
        </div>
    );

    const renderExchangeForm = () => (
        <div className="space-y-6">
            {/* Customer Selection */}
            <div className="panel">
                <div className="mb-5 flex items-center gap-3">
                    <IconUser className="w-5 h-5 text-primary" />
                    <h5 className="text-lg font-semibold dark:text-white-light">{t('customer_information')}</h5>
                </div>
                <div className="space-y-4">
                    <CustomerSelect selectedCustomer={selectedCustomer} onCustomerSelect={setSelectedCustomer} onCreateNew={() => setShowCreateCustomerModal(true)} className="form-input" />
                    <div className="flex justify-end">
                        <button type="button" onClick={() => setShowCreateCustomerModal(true)} className="btn btn-outline-primary">
                            {t('create_new_customer')}
                        </button>
                    </div>
                    {/* Customer Details Display */}
                    {selectedCustomer && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                            <h6 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">{t('customer_details')}</h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <span className="text-blue-600 dark:text-blue-300 font-medium">{t('customer_name')}:</span>
                                    <p className="text-blue-800 dark:text-blue-100">{selectedCustomer.name}</p>
                                </div>
                                <div>
                                    <span className="text-blue-600 dark:text-blue-300 font-medium">{t('phone')}:</span>
                                    <p className="text-blue-800 dark:text-blue-100">{selectedCustomer.phone}</p>
                                </div>
                                {selectedCustomer.identity_number && (
                                    <div>
                                        <span className="text-blue-600 dark:text-blue-300 font-medium">{t('identity_number')}:</span>
                                        <p className="text-blue-800 dark:text-blue-100">{selectedCustomer.identity_number}</p>
                                    </div>
                                )}
                                {selectedCustomer.birth_date && (
                                    <div>
                                        <span className="text-blue-600 dark:text-blue-300 font-medium">{t('birth_date')}:</span>
                                        <p className="text-blue-800 dark:text-blue-100">{new Date(selectedCustomer.birth_date).toLocaleDateString()}</p>
                                    </div>
                                )}
                                {selectedCustomer.country && (
                                    <div>
                                        <span className="text-blue-600 dark:text-blue-300 font-medium">{t('country')}:</span>
                                        <p className="text-blue-800 dark:text-blue-100">{selectedCustomer.country}</p>
                                    </div>
                                )}
                                <div>
                                    <span className="text-blue-600 dark:text-blue-300 font-medium">{t('age')}:</span>
                                    <p className="text-blue-800 dark:text-blue-100">
                                        {selectedCustomer.age} {t('years_old')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* New Car Selection from Showroom */}
            <div className="panel">
                <div className="mb-5 flex items-center gap-3">
                    <IconMenuWidgets className="w-5 h-5 text-primary" />
                    <h5 className="text-lg font-semibold dark:text-white-light">{t('new_car_from_showroom')}</h5>
                </div>
                <div className="space-y-4">
                    <CarSelect selectedCar={selectedCar} onCarSelect={setSelectedCar} className="form-input" />

                    {/* Car Details Display */}
                    {selectedCar && (
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                            <h6 className="font-semibold text-green-800 dark:text-green-200 mb-3">{t('new_car_details')}</h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <span className="text-green-600 dark:text-green-300 font-medium">{t('manufacturer')}:</span>
                                    <p className="text-green-800 dark:text-green-100">{selectedCar.brand}</p>
                                </div>
                                <div>
                                    <span className="text-green-600 dark:text-green-300 font-medium">{t('car_name')}:</span>
                                    <p className="text-green-800 dark:text-green-100">{selectedCar.title}</p>
                                </div>
                                <div>
                                    <span className="text-green-600 dark:text-green-300 font-medium">{t('year')}:</span>
                                    <p className="text-green-800 dark:text-green-100">{selectedCar.year}</p>
                                </div>
                                <div>
                                    <span className="text-green-600 dark:text-green-300 font-medium">{t('kilometers')}:</span>
                                    <p className="text-green-800 dark:text-green-100">
                                        {selectedCar.kilometers.toLocaleString()} {t('km')}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-green-600 dark:text-green-300 font-medium">{t('condition')}:</span>
                                    <p className="text-green-800 dark:text-green-100">{selectedCar.status}</p>
                                </div>
                                <div>
                                    <span className="text-green-600 dark:text-green-300 font-medium">{t('market_price')}:</span>
                                    <p className="text-green-800 dark:text-green-100">{formatCurrency(selectedCar.market_price)}</p>
                                </div>
                                <div>
                                    <span className="text-green-600 dark:text-green-300 font-medium">{t('sale_price')}:</span>
                                    <p className="text-green-800 dark:text-green-100">{formatCurrency(selectedCar.sale_price)}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* Customer's Old Car Details */}
            <div className="panel">
                <div className="mb-5 flex items-center gap-3">
                    <IconMenuWidgets className="w-5 h-5 text-warning" />
                    <h5 className="text-lg font-semibold dark:text-white-light">{t('customer_old_car_details')}</h5>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="old_car_manufacturer" className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                            {t('manufacturer')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="old_car_manufacturer"
                            name="old_car_manufacturer"
                            value={exchangeForm.old_car_manufacturer}
                            onChange={handleExchangeFormChange}
                            className="form-input"
                            placeholder={t('enter_manufacturer')}
                        />
                    </div>

                    <div>
                        <label htmlFor="old_car_name" className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                            {t('car_name')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="old_car_name"
                            name="old_car_name"
                            value={exchangeForm.old_car_name}
                            onChange={handleExchangeFormChange}
                            className="form-input"
                            placeholder={t('enter_car_name')}
                        />
                    </div>

                    <div>
                        <label htmlFor="old_car_year" className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                            {t('year')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            id="old_car_year"
                            name="old_car_year"
                            value={exchangeForm.old_car_year}
                            onChange={handleExchangeFormChange}
                            className="form-input"
                            placeholder={t('enter_year')}
                            min="1900"
                            max="2030"
                        />
                    </div>

                    <div>
                        <label htmlFor="old_car_kilometers" className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                            {t('kilometers')}
                        </label>
                        <input
                            type="number"
                            id="old_car_kilometers"
                            name="old_car_kilometers"
                            value={exchangeForm.old_car_kilometers}
                            onChange={handleExchangeFormChange}
                            className="form-input"
                            placeholder={t('enter_kilometers')}
                        />
                    </div>

                    <div>
                        <label htmlFor="old_car_condition" className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                            {t('condition')} ({t('hand')})
                        </label>
                        <input
                            type="text"
                            id="old_car_condition"
                            name="old_car_condition"
                            value={exchangeForm.old_car_condition}
                            onChange={handleExchangeFormChange}
                            className="form-input"
                            placeholder={t('enter_condition')}
                        />
                    </div>

                    <div>
                        <label htmlFor="old_car_market_price" className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                            {t('market_price')}
                        </label>
                        <input
                            type="number"
                            id="old_car_market_price"
                            name="old_car_market_price"
                            value={exchangeForm.old_car_market_price}
                            onChange={handleExchangeFormChange}
                            className="form-input"
                            placeholder="0.00"
                            step="0.01"
                        />
                    </div>

                    <div>
                        <label htmlFor="old_car_purchase_price" className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                            {t('purchase_price_from_customer')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            id="old_car_purchase_price"
                            name="old_car_purchase_price"
                            value={exchangeForm.old_car_purchase_price}
                            onChange={handleExchangeFormChange}
                            className="form-input"
                            placeholder="0.00"
                            step="0.01"
                        />
                    </div>
                </div>

                {/* Exchange Calculation Display */}
                {selectedCar && exchangeForm.old_car_purchase_price && (
                    <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <h6 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-3">{t('exchange_calculation')}</h6>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <span className="text-yellow-600 dark:text-yellow-300 font-medium">{t('new_car_price')}:</span>
                                <p className="text-yellow-800 dark:text-yellow-100">{formatCurrency(selectedCar.sale_price)}</p>
                            </div>
                            <div>
                                <span className="text-yellow-600 dark:text-yellow-300 font-medium">{t('old_car_value')}:</span>
                                <p className="text-yellow-800 dark:text-yellow-100">{formatCurrency(parseFloat(exchangeForm.old_car_purchase_price))}</p>
                            </div>
                            <div>
                                <span className="text-yellow-600 dark:text-yellow-300 font-medium">{t('difference_to_pay')}:</span>
                                <p className="text-yellow-800 dark:text-yellow-100 font-bold">{formatCurrency(selectedCar.sale_price - parseFloat(exchangeForm.old_car_purchase_price))}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {/* Deal Details */}
            <div className="panel">
                <div className="mb-5 flex items-center gap-3">
                    <IconDollarSign className="w-5 h-5 text-primary" />
                    <h5 className="text-lg font-semibold dark:text-white-light">{t('deal_details')}</h5>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                            {t('deal_title')}
                        </label>
                        <input type="text" id="title" name="title" value={exchangeForm.title} onChange={handleExchangeFormChange} className="form-input" placeholder={t('enter_deal_title')} />
                    </div>

                    <div>
                        <label htmlFor="notes" className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                            {t('notes')}
                        </label>
                        <textarea id="notes" name="notes" value={exchangeForm.notes} onChange={handleExchangeFormChange} className="form-textarea min-h-[120px]" placeholder={t('enter_deal_notes')} />
                    </div>
                </div>
            </div>
            {/* File Attachments */}
            <div className="panel">
                <div className="mb-5 flex items-center gap-3">
                    <IconNotes className="w-5 h-5 text-primary" />
                    <h5 className="text-lg font-semibold dark:text-white-light">{t('attachments')}</h5>
                </div>
                <div className="space-y-6">
                    <FileUpload
                        files={dealFiles}
                        onFilesChange={setDealFiles}
                        title={t('deal_documents')}
                        description={t('upload_deal_documents_desc')}
                        maxFiles={20}
                        accept="image/*,.pdf,.doc,.docx"
                    />
                </div>
            </div>{' '}
        </div>
    );

    const renderCompanyCommissionForm = () => (
        <div className="space-y-8">
            {/* Company Commission Details */}
            <div className="panel">
                <div className="mb-5 flex items-center gap-3">
                    <IconDollarSign className="w-5 h-5 text-primary" />
                    <h5 className="text-lg font-semibold dark:text-white-light">{t('company_commission_details')}</h5>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Deal Title */}
                    <div className="md:col-span-2">
                        <label htmlFor="title" className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                            {t('deal_title')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={companyCommissionForm.title}
                            onChange={handleCompanyCommissionFormChange}
                            className="form-input"
                            placeholder={t('enter_deal_title')}
                        />
                    </div>
                    {/* Company Name */}
                    <div>
                        <label htmlFor="company_name" className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                            {t('company_name')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="company_name"
                            name="company_name"
                            value={companyCommissionForm.company_name}
                            onChange={handleCompanyCommissionFormChange}
                            className="form-input"
                            placeholder={t('enter_company_name')}
                        />
                    </div>
                    {/* Commission Date */}
                    <div>
                        <label htmlFor="commission_date" className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                            {t('commission_date')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            id="commission_date"
                            name="commission_date"
                            value={companyCommissionForm.commission_date}
                            onChange={handleCompanyCommissionFormChange}
                            className="form-input"
                        />
                    </div>{' '}
                    {/* Commission Amount */}
                    <div>
                        <label htmlFor="amount" className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                            {t('company_commission_amount')} <span className="text-red-500">*</span>
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
                                value={companyCommissionForm.amount}
                                onChange={handleCompanyCommissionFormChange}
                                className="form-input ltr:rounded-l-none rtl:rounded-r-none"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    {/* Commission Description */}
                    <div className="md:col-span-2">
                        <label htmlFor="description" className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                            {t('commission_description')}
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={companyCommissionForm.description}
                            onChange={handleCompanyCommissionFormChange}
                            className="form-textarea min-h-[120px]"
                            placeholder={t('enter_commission_description')}
                        />
                    </div>
                </div>
            </div>

            {/* File Attachments */}
            <div className="panel">
                <div className="mb-5 flex items-center gap-3">
                    <IconNotes className="w-5 h-5 text-primary" />
                    <h5 className="text-lg font-semibold dark:text-white-light">{t('attachments')}</h5>
                </div>
                <div className="space-y-6">
                    <FileUpload
                        files={dealFiles}
                        onFilesChange={setDealFiles}
                        title={t('deal_documents')}
                        description={t('upload_deal_documents_desc')}
                        maxFiles={20}
                        accept="image/*,.pdf,.doc,.docx"
                    />
                </div>
            </div>
        </div>
    );

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
                        <span>{t('add_new_deal')}</span>
                    </li>
                </ul>
            </div>

            <div className="mb-6">
                <h1 className="text-2xl font-bold">{t('add_new_deal')}</h1>
                <p className="text-gray-500">{t('create_deal_description')}</p>
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

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Deal Type Selector - Prominent at the top */}{' '}
                <div className="panel bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20">
                    <div className="mb-5">
                        <h5 className="text-xl font-bold text-primary dark:text-white-light">{t('select_deal_type')}</h5>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">{t('select_deal_type_desc')}</p>
                    </div>
                    <DealTypeSelect defaultValue={dealType} className="form-input text-lg py-3 bg-white dark:bg-black" name="deal_type" onChange={handleDealTypeChange} />
                </div>
                {/* Deal Status Selector */}
                {dealType && (
                    <div className="panel">
                        <div className="mb-5">
                            <h5 className="text-lg font-bold text-gray-900 dark:text-white-light">{t('deal_status')}</h5>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">{t('select_deal_status_desc')}</p>
                        </div>
                        <DealStatusSelect defaultValue={dealStatus} className="form-input" name="deal_status" onChange={handleDealStatusChange} />
                    </div>
                )}{' '}
                {/* Render form based on deal type */}
                {dealType === 'new_used_sale' && renderNewUsedSaleForm()}
                {dealType === 'exchange' && renderExchangeForm()}
                {dealType === 'company_commission' && renderCompanyCommissionForm()}
                {/* Other deal types placeholder */}
                {dealType && dealType !== 'new_used_sale' && dealType !== 'exchange' && dealType !== 'company_commission' && (
                    <div className="panel">
                        <div className="text-center py-12">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t(`deal_type_${dealType}`)}</h3>
                            <p className="text-gray-600 dark:text-gray-400">{t('form_coming_soon')}</p>
                        </div>
                    </div>
                )}
                {/* Submit Button */}
                {dealType && (
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={() => router.back()} className="btn btn-outline-danger">
                            {t('cancel')}
                        </button>
                        <button type="submit" className="btn btn-primary px-8" disabled={saving || !dealType}>
                            {saving ? t('creating') : t('create_deal')}
                        </button>
                    </div>
                )}
            </form>

            {/* Create Customer Modal */}
            <CreateCustomerModal isOpen={showCreateCustomerModal} onClose={() => setShowCreateCustomerModal(false)} onCustomerCreated={handleCustomerCreated} />
        </div>
    );
};

export default AddDeal;
