'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import supabase from '@/lib/supabase';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import { getTranslation } from '@/i18n';
import DealTypeSelect from '@/components/deal-type-select/deal-type-select';
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
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [selectedCar, setSelectedCar] = useState<Car | null>(null);

    // Form state for new/used sale deal
    const [saleForm, setSaleForm] = useState({
        title: '',
        notes: '',
        selling_price: '',
    });

    // Form state for exchange deal
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

    // File uploads - unified for all document types
    const [dealFiles, setDealFiles] = useState<FileItem[]>([]);

    // Billing states
    const [billingType, setBillingType] = useState(''); // 'tax_invoice', 'tax_invoice_receipt', 'receipt_only'
    const [invoiceForm, setInvoiceForm] = useState({
        customer_name: '',
        identity_number: '',
        phone: '',
        date: new Date().toISOString().split('T')[0],
        car_details: '',
        sale_price: '',
        commission: '',
        free_text: '',
        total: '',
        tax_amount: '',
        total_with_tax: '',
    });
    const [receiptForm, setReceiptForm] = useState({
        customer_name: '',
        identity_number: '',
        phone: '',
        date: new Date().toISOString().split('T')[0],
        payment_type: '', // 'visa', 'cash', 'bank_transfer', 'check'
        // Visa fields
        visa_amount: '',
        visa_installments: '',
        visa_card_type: '',
        visa_last_four: '',
        visa_last_digits: '',
        // Bank transfer fields
        bank_amount: '',
        bank_name: '',
        bank_branch: '',
        account_number: '',
        transfer_number: '',
        transfer_holder_name: '',
        transfer_amount: '',
        transfer_bank_name: '',
        transfer_branch: '',
        transfer_account_number: '',
        transfer_branch_number: '',
        // Check fields
        check_amount: '',
        check_bank_name: '',
        check_branch_number: '',
        check_account_number: '',
        check_number: '',
        check_holder_name: '',
        check_branch: '',
    });

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

            // Auto-fill billing forms
            const carDetails = `${selectedCar.brand} ${selectedCar.title} ${selectedCar.year} - ${selectedCar.kilometers.toLocaleString()} ${t('km')}`;

            setInvoiceForm((prev) => ({
                ...prev,
                customer_name: selectedCustomer.name,
                identity_number: selectedCustomer.identity_number || '',
                phone: selectedCustomer.phone,
                car_details: carDetails,
                sale_price: selectedCar.sale_price.toString(),
            }));

            setReceiptForm((prev) => ({
                ...prev,
                customer_name: selectedCustomer.name,
                identity_number: selectedCustomer.identity_number || '',
                phone: selectedCustomer.phone,
            }));
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

    const handleInvoiceFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setInvoiceForm((prev) => {
            const updated = { ...prev, [name]: value };

            // Auto-calculate tax when sale_price or commission changes
            if (name === 'sale_price' || name === 'commission') {
                const salePrice = parseFloat(name === 'sale_price' ? value : updated.sale_price) || 0;
                const commission = parseFloat(name === 'commission' ? value : updated.commission) || 0;
                const total = salePrice + commission;
                const taxAmount = total * 0.18; // 18% tax
                const totalWithTax = total + taxAmount;

                updated.total = total.toFixed(2);
                updated.tax_amount = taxAmount.toFixed(2);
                updated.total_with_tax = totalWithTax.toFixed(2);
            }

            return updated;
        });
    };

    const handleReceiptFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setReceiptForm((prev) => ({ ...prev, [name]: value }));
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
        setBillingType('');
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

        setSaving(true);
        try {
            let dealData: any = {
                deal_type: dealType,
                status: 'active',
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
                        billing: billingType
                            ? {
                                  type: billingType,
                                  invoice: billingType === 'tax_invoice' || billingType === 'tax_invoice_receipt' ? invoiceForm : null,
                                  receipt: billingType === 'receipt_only' || billingType === 'tax_invoice_receipt' ? receiptForm : null,
                              }
                            : null,
                        attachments: {
                            total_files: dealFiles.length,
                        },
                    },
                    notes: exchangeForm.notes.trim(),
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
                </div>{' '}
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
                            <h6 className="font-semibold text-green-800 dark:text-green-200 mb-3">{t('car_details')}</h6>{' '}
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
                    </div>{' '}
                </div>
            </div>

            {/* Billing Section */}
            <div className="panel">
                <div className="mb-5 flex items-center gap-3">
                    <IconDollarSign className="w-5 h-5 text-primary" />
                    <h5 className="text-lg font-semibold dark:text-white-light">{t('billing_section')}</h5>
                </div>

                {/* Billing Type Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 dark:text-white mb-3">{t('billing_type')}</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div
                            className={`p-4 border rounded-lg cursor-pointer transition-all ${billingType === 'tax_invoice' ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary/50'}`}
                            onClick={() => setBillingType('tax_invoice')}
                        >
                            <div className="font-medium">{t('tax_invoice')}</div>
                            <div className="text-sm text-gray-500 mt-1">{t('tax_invoice_desc')}</div>
                        </div>
                        <div
                            className={`p-4 border rounded-lg cursor-pointer transition-all ${billingType === 'tax_invoice_receipt' ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary/50'}`}
                            onClick={() => setBillingType('tax_invoice_receipt')}
                        >
                            <div className="font-medium">{t('tax_invoice_with_receipt')}</div>
                            <div className="text-sm text-gray-500 mt-1">{t('tax_invoice_receipt_desc')}</div>
                        </div>
                        <div
                            className={`p-4 border rounded-lg cursor-pointer transition-all ${billingType === 'receipt_only' ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary/50'}`}
                            onClick={() => setBillingType('receipt_only')}
                        >
                            <div className="font-medium">{t('receipt_only')}</div>
                            <div className="text-sm text-gray-500 mt-1">{t('receipt_only_desc')}</div>
                        </div>
                    </div>
                </div>

                {/* Invoice Form */}
                {(billingType === 'tax_invoice' || billingType === 'tax_invoice_receipt') && (
                    <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h6 className="font-semibold text-blue-800 dark:text-blue-200 mb-4">{t('invoice_details')}</h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                    {t('customer_name')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="customer_name"
                                    value={invoiceForm.customer_name}
                                    onChange={handleInvoiceFormChange}
                                    className="form-input"
                                    placeholder={t('enter_customer_name')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('identity_number')}</label>
                                <input
                                    type="text"
                                    name="identity_number"
                                    value={invoiceForm.identity_number}
                                    onChange={handleInvoiceFormChange}
                                    className="form-input"
                                    placeholder={t('enter_identity_number')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('phone')}</label>
                                <input type="text" name="phone" value={invoiceForm.phone} onChange={handleInvoiceFormChange} className="form-input" placeholder={t('enter_phone')} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('date')}</label>
                                <input type="date" name="date" value={invoiceForm.date} onChange={handleInvoiceFormChange} className="form-input" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('car_details')}</label>
                                <input type="text" name="car_details" value={invoiceForm.car_details} onChange={handleInvoiceFormChange} className="form-input" placeholder={t('enter_car_details')} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                    {t('sale_price')} <span className="text-red-500">*</span>
                                </label>
                                <input type="number" name="sale_price" value={invoiceForm.sale_price} onChange={handleInvoiceFormChange} className="form-input" placeholder="0.00" step="0.01" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('commission')}</label>
                                <input type="number" name="commission" value={invoiceForm.commission} onChange={handleInvoiceFormChange} className="form-input" placeholder="0.00" step="0.01" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('total')}</label>
                                <input type="text" name="total" value={invoiceForm.total} className="form-input bg-gray-100 dark:bg-gray-800" readOnly />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('free_text')}</label>
                            <textarea name="free_text" value={invoiceForm.free_text} onChange={handleInvoiceFormChange} className="form-textarea" placeholder={t('enter_additional_notes')} rows={3} />
                        </div>

                        {/* Tax Calculation */}
                        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('subtotal')}</label>
                                    <input type="text" value={formatCurrency(parseFloat(invoiceForm.total) || 0)} className="form-input bg-gray-100 dark:bg-gray-800" readOnly />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('tax_18_percent')}</label>
                                    <input type="text" value={formatCurrency(parseFloat(invoiceForm.tax_amount) || 0)} className="form-input bg-gray-100 dark:bg-gray-800" readOnly />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                        <strong>{t('total_with_tax')}</strong>
                                    </label>
                                    <input type="text" value={formatCurrency(parseFloat(invoiceForm.total_with_tax) || 0)} className="form-input bg-primary/10 border-primary font-semibold" readOnly />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Receipt Form */}
                {(billingType === 'receipt_only' || billingType === 'tax_invoice_receipt') && (
                    <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <h6 className="font-semibold text-green-800 dark:text-green-200 mb-4">{t('receipt_details')}</h6>

                        {/* Customer Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                    {t('customer_name')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="customer_name"
                                    value={receiptForm.customer_name}
                                    onChange={handleReceiptFormChange}
                                    className="form-input"
                                    placeholder={t('enter_customer_name')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('identity_number')}</label>
                                <input
                                    type="text"
                                    name="identity_number"
                                    value={receiptForm.identity_number}
                                    onChange={handleReceiptFormChange}
                                    className="form-input"
                                    placeholder={t('enter_identity_number')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('phone')}</label>
                                <input type="text" name="phone" value={receiptForm.phone} onChange={handleReceiptFormChange} className="form-input" placeholder={t('enter_phone')} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('date')}</label>
                                <input type="date" name="date" value={receiptForm.date} onChange={handleReceiptFormChange} className="form-input" />
                            </div>
                        </div>

                        {/* Payment Type Selection */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-3">
                                {t('payment_type')} <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {['visa', 'cash', 'bank_transfer', 'check'].map((type) => (
                                    <div
                                        key={type}
                                        className={`p-3 border rounded-lg cursor-pointer text-center transition-all ${receiptForm.payment_type === type ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary/50'}`}
                                        onClick={() => setReceiptForm((prev) => ({ ...prev, payment_type: type }))}
                                    >
                                        <div className="font-medium">{t(type)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Payment Details based on type */}
                        {receiptForm.payment_type === 'visa' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                        {t('amount')} <span className="text-red-500">*</span>
                                    </label>
                                    <input type="number" name="visa_amount" value={receiptForm.visa_amount} onChange={handleReceiptFormChange} className="form-input" placeholder="0.00" step="0.01" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('installments')}</label>
                                    <input type="number" name="visa_installments" value={receiptForm.visa_installments} onChange={handleReceiptFormChange} className="form-input" placeholder="1" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('card_type')}</label>
                                    <input
                                        type="text"
                                        name="visa_card_type"
                                        value={receiptForm.visa_card_type}
                                        onChange={handleReceiptFormChange}
                                        className="form-input"
                                        placeholder={t('enter_card_type')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('last_four_digits')}</label>
                                    <input
                                        type="text"
                                        name="visa_last_four"
                                        value={receiptForm.visa_last_four}
                                        onChange={handleReceiptFormChange}
                                        className="form-input"
                                        placeholder="****"
                                        maxLength={4}
                                    />
                                </div>
                            </div>
                        )}

                        {receiptForm.payment_type === 'bank_transfer' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                        {t('amount')} <span className="text-red-500">*</span>
                                    </label>
                                    <input type="number" name="bank_amount" value={receiptForm.bank_amount} onChange={handleReceiptFormChange} className="form-input" placeholder="0.00" step="0.01" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('bank_name')}</label>
                                    <input type="text" name="bank_name" value={receiptForm.bank_name} onChange={handleReceiptFormChange} className="form-input" placeholder={t('enter_bank_name')} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('branch')}</label>
                                    <input type="text" name="bank_branch" value={receiptForm.bank_branch} onChange={handleReceiptFormChange} className="form-input" placeholder={t('enter_branch')} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('account_number')}</label>
                                    <input
                                        type="text"
                                        name="account_number"
                                        value={receiptForm.account_number}
                                        onChange={handleReceiptFormChange}
                                        className="form-input"
                                        placeholder={t('enter_account_number')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('transfer_number')}</label>
                                    <input
                                        type="text"
                                        name="transfer_number"
                                        value={receiptForm.transfer_number}
                                        onChange={handleReceiptFormChange}
                                        className="form-input"
                                        placeholder={t('enter_transfer_number')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('transfer_holder_name')}</label>
                                    <input
                                        type="text"
                                        name="transfer_holder_name"
                                        value={receiptForm.transfer_holder_name}
                                        onChange={handleReceiptFormChange}
                                        className="form-input"
                                        placeholder={t('enter_transfer_holder_name')}
                                    />
                                </div>
                            </div>
                        )}

                        {receiptForm.payment_type === 'check' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                        {t('amount')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="check_amount"
                                        value={receiptForm.check_amount}
                                        onChange={handleReceiptFormChange}
                                        className="form-input"
                                        placeholder="0.00"
                                        step="0.01"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('bank_name')}</label>
                                    <input
                                        type="text"
                                        name="check_bank_name"
                                        value={receiptForm.check_bank_name}
                                        onChange={handleReceiptFormChange}
                                        className="form-input"
                                        placeholder={t('enter_bank_name')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('branch_number')}</label>
                                    <input
                                        type="text"
                                        name="check_branch_number"
                                        value={receiptForm.check_branch_number}
                                        onChange={handleReceiptFormChange}
                                        className="form-input"
                                        placeholder={t('enter_branch_number')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('account_number')}</label>
                                    <input
                                        type="text"
                                        name="check_account_number"
                                        value={receiptForm.check_account_number}
                                        onChange={handleReceiptFormChange}
                                        className="form-input"
                                        placeholder={t('enter_account_number')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('check_number')}</label>
                                    <input
                                        type="text"
                                        name="check_number"
                                        value={receiptForm.check_number}
                                        onChange={handleReceiptFormChange}
                                        className="form-input"
                                        placeholder={t('enter_check_number')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('check_holder_name')}</label>
                                    <input
                                        type="text"
                                        name="check_holder_name"
                                        value={receiptForm.check_holder_name}
                                        onChange={handleReceiptFormChange}
                                        className="form-input"
                                        placeholder={t('enter_check_holder_name')}
                                    />
                                </div>
                            </div>
                        )}

                        {receiptForm.payment_type === 'cash' && (
                            <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg text-center">
                                <div className="text-green-800 dark:text-green-200 font-medium">{t('cash_payment_selected')}</div>
                                <div className="text-sm text-green-600 dark:text-green-300 mt-1">{t('no_additional_details_required')}</div>
                            </div>
                        )}
                    </div>
                )}
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
                </div>{' '}
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
                                </div>{' '}
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
            </div>{' '}
            {/* Billing Section */}
            <div className="panel">
                <div className="mb-5 flex items-center gap-3">
                    <IconDollarSign className="w-5 h-5 text-primary" />
                    <h5 className="text-lg font-semibold dark:text-white-light">{t('billing_section')}</h5>
                </div>

                {/* Billing Type Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-3">{t('billing_type')}</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { value: 'tax_invoice', title: t('tax_invoice'), desc: t('tax_invoice_desc') },
                            { value: 'tax_invoice_receipt', title: t('tax_invoice_with_receipt'), desc: t('tax_invoice_receipt_desc') },
                            { value: 'receipt_only', title: t('receipt_only'), desc: t('receipt_only_desc') },
                        ].map((type) => (
                            <div
                                key={type.value}
                                className={`p-4 border rounded-lg cursor-pointer transition-all ${billingType === type.value ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary/50'}`}
                                onClick={() => setBillingType(type.value)}
                            >
                                <div className="font-medium mb-1">{type.title}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">{type.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Invoice Form */}
                {(billingType === 'tax_invoice' || billingType === 'tax_invoice_receipt') && (
                    <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
                        <h6 className="font-semibold text-blue-800 dark:text-blue-200 mb-4">{t('invoice_details')}</h6>

                        {/* Customer Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                    {t('customer_name')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="customer_name"
                                    value={invoiceForm.customer_name}
                                    onChange={handleInvoiceFormChange}
                                    className="form-input"
                                    placeholder={t('enter_customer_name')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('identity_number')}</label>
                                <input
                                    type="text"
                                    name="identity_number"
                                    value={invoiceForm.identity_number}
                                    onChange={handleInvoiceFormChange}
                                    className="form-input"
                                    placeholder={t('enter_identity_number')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('phone')}</label>
                                <input type="text" name="phone" value={invoiceForm.phone} onChange={handleInvoiceFormChange} className="form-input" placeholder={t('enter_phone')} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('date')}</label>
                                <input type="date" name="date" value={invoiceForm.date} onChange={handleInvoiceFormChange} className="form-input" />
                            </div>
                        </div>

                        {/* Car Details */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('car_details')}</label>
                            <textarea name="car_details" value={invoiceForm.car_details} onChange={handleInvoiceFormChange} className="form-textarea" placeholder={t('enter_car_details')} rows={2} />
                        </div>

                        {/* Pricing */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                    {t('selling_price')} <span className="text-red-500">*</span>
                                </label>
                                <input type="number" name="sale_price" value={invoiceForm.sale_price} onChange={handleInvoiceFormChange} className="form-input" placeholder="0.00" step="0.01" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('commission')}</label>
                                <input type="number" name="commission" value={invoiceForm.commission} onChange={handleInvoiceFormChange} className="form-input" placeholder="0.00" step="0.01" />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('free_text')}</label>
                            <textarea name="free_text" value={invoiceForm.free_text} onChange={handleInvoiceFormChange} className="form-textarea" placeholder={t('enter_additional_notes')} rows={3} />
                        </div>

                        {/* Tax Calculation */}
                        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('subtotal')}</label>
                                    <input type="text" value={formatCurrency(parseFloat(invoiceForm.total) || 0)} className="form-input bg-gray-100 dark:bg-gray-800" readOnly />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('tax_18_percent')}</label>
                                    <input type="text" value={formatCurrency(parseFloat(invoiceForm.tax_amount) || 0)} className="form-input bg-gray-100 dark:bg-gray-800" readOnly />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                        <strong>{t('total_with_tax')}</strong>
                                    </label>
                                    <input type="text" value={formatCurrency(parseFloat(invoiceForm.total_with_tax) || 0)} className="form-input bg-primary/10 border-primary font-semibold" readOnly />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Receipt Form */}
                {(billingType === 'receipt_only' || billingType === 'tax_invoice_receipt') && (
                    <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 mb-6">
                        <h6 className="font-semibold text-green-800 dark:text-green-200 mb-4">{t('receipt_details')}</h6>

                        {/* Customer Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                    {t('customer_name')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="customer_name"
                                    value={receiptForm.customer_name}
                                    onChange={handleReceiptFormChange}
                                    className="form-input"
                                    placeholder={t('enter_customer_name')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('identity_number')}</label>
                                <input
                                    type="text"
                                    name="identity_number"
                                    value={receiptForm.identity_number}
                                    onChange={handleReceiptFormChange}
                                    className="form-input"
                                    placeholder={t('enter_identity_number')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('phone')}</label>
                                <input type="text" name="phone" value={receiptForm.phone} onChange={handleReceiptFormChange} className="form-input" placeholder={t('enter_phone')} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('date')}</label>
                                <input type="date" name="date" value={receiptForm.date} onChange={handleReceiptFormChange} className="form-input" />
                            </div>
                        </div>

                        {/* Payment Type Selection */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-3">
                                {t('payment_type')} <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {['visa', 'cash', 'bank_transfer', 'check'].map((type) => (
                                    <div
                                        key={type}
                                        className={`p-3 border rounded-lg cursor-pointer text-center transition-all ${receiptForm.payment_type === type ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary/50'}`}
                                        onClick={() => setReceiptForm((prev) => ({ ...prev, payment_type: type }))}
                                    >
                                        <div className="font-medium">{t(type)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Payment Details based on type */}
                        {receiptForm.payment_type === 'visa' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                        {t('amount')} <span className="text-red-500">*</span>
                                    </label>
                                    <input type="number" name="visa_amount" value={receiptForm.visa_amount} onChange={handleReceiptFormChange} className="form-input" placeholder="0.00" step="0.01" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('installments')}</label>
                                    <input type="number" name="visa_installments" value={receiptForm.visa_installments} onChange={handleReceiptFormChange} className="form-input" placeholder="1" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('card_type')}</label>
                                    <input
                                        type="text"
                                        name="visa_card_type"
                                        value={receiptForm.visa_card_type}
                                        onChange={handleReceiptFormChange}
                                        className="form-input"
                                        placeholder={t('enter_card_type')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('last_four_digits')}</label>
                                    <input
                                        type="text"
                                        name="visa_last_digits"
                                        value={receiptForm.visa_last_digits}
                                        onChange={handleReceiptFormChange}
                                        className="form-input"
                                        placeholder="****"
                                        maxLength={4}
                                    />
                                </div>
                            </div>
                        )}

                        {receiptForm.payment_type === 'cash' && (
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                <p className="text-yellow-800 dark:text-yellow-200 font-medium">{t('cash_payment_selected')}</p>
                                <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-1">{t('no_additional_details_required')}</p>
                            </div>
                        )}

                        {receiptForm.payment_type === 'bank_transfer' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                        {t('amount')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="transfer_amount"
                                        value={receiptForm.transfer_amount}
                                        onChange={handleReceiptFormChange}
                                        className="form-input"
                                        placeholder="0.00"
                                        step="0.01"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('bank_name')}</label>
                                    <input
                                        type="text"
                                        name="transfer_bank_name"
                                        value={receiptForm.transfer_bank_name}
                                        onChange={handleReceiptFormChange}
                                        className="form-input"
                                        placeholder={t('enter_bank_name')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('branch')}</label>
                                    <input
                                        type="text"
                                        name="transfer_branch"
                                        value={receiptForm.transfer_branch}
                                        onChange={handleReceiptFormChange}
                                        className="form-input"
                                        placeholder={t('enter_branch')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('account_number')}</label>
                                    <input
                                        type="text"
                                        name="transfer_account_number"
                                        value={receiptForm.transfer_account_number}
                                        onChange={handleReceiptFormChange}
                                        className="form-input"
                                        placeholder={t('enter_account_number')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('transfer_number')}</label>
                                    <input
                                        type="text"
                                        name="transfer_number"
                                        value={receiptForm.transfer_number}
                                        onChange={handleReceiptFormChange}
                                        className="form-input"
                                        placeholder={t('enter_transfer_number')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('transfer_holder_name')}</label>
                                    <input
                                        type="text"
                                        name="transfer_holder_name"
                                        value={receiptForm.transfer_holder_name}
                                        onChange={handleReceiptFormChange}
                                        className="form-input"
                                        placeholder={t('enter_transfer_holder_name')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('branch_number')}</label>
                                    <input
                                        type="text"
                                        name="transfer_branch_number"
                                        value={receiptForm.transfer_branch_number}
                                        onChange={handleReceiptFormChange}
                                        className="form-input"
                                        placeholder={t('enter_branch_number')}
                                    />
                                </div>
                            </div>
                        )}

                        {receiptForm.payment_type === 'check' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                        {t('amount')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="check_amount"
                                        value={receiptForm.check_amount}
                                        onChange={handleReceiptFormChange}
                                        className="form-input"
                                        placeholder="0.00"
                                        step="0.01"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('check_number')}</label>
                                    <input
                                        type="text"
                                        name="check_number"
                                        value={receiptForm.check_number}
                                        onChange={handleReceiptFormChange}
                                        className="form-input"
                                        placeholder={t('enter_check_number')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('bank_name')}</label>
                                    <input
                                        type="text"
                                        name="check_bank_name"
                                        value={receiptForm.check_bank_name}
                                        onChange={handleReceiptFormChange}
                                        className="form-input"
                                        placeholder={t('enter_bank_name')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('branch')}</label>
                                    <input type="text" name="check_branch" value={receiptForm.check_branch} onChange={handleReceiptFormChange} className="form-input" placeholder={t('enter_branch')} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('check_holder_name')}</label>
                                    <input
                                        type="text"
                                        name="check_holder_name"
                                        value={receiptForm.check_holder_name}
                                        onChange={handleReceiptFormChange}
                                        className="form-input"
                                        placeholder={t('enter_check_holder_name')}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
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
                {/* Deal Type Selector - Prominent at the top */}
                <div className="panel bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20">
                    <div className="mb-5">
                        <h5 className="text-xl font-bold text-primary dark:text-white-light">{t('select_deal_type')}</h5>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">{t('select_deal_type_desc')}</p>
                    </div>
                    <DealTypeSelect defaultValue={dealType} className="form-input text-lg py-3 bg-white dark:bg-black" name="deal_type" onChange={handleDealTypeChange} />
                </div>{' '}
                {/* Render form based on deal type */}
                {dealType === 'new_used_sale' && renderNewUsedSaleForm()}
                {dealType === 'exchange' && renderExchangeForm()}
                {/* Other deal types placeholder */}
                {dealType && dealType !== 'new_used_sale' && dealType !== 'exchange' && (
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
