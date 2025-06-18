'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import supabase from '@/lib/supabase';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import { getTranslation } from '@/i18n';
import IconDollarSign from '@/components/icon/icon-dollar-sign';
import IconUser from '@/components/icon/icon-user';
import IconMenuWidgets from '@/components/icon/menu/icon-menu-widgets';
import DealSelect from '@/components/deal-select/deal-select';
import BillTypeSelect from '@/components/bill-type-select/bill-type-select';
import PaymentTypeSelect from '@/components/payment-type-select/payment-type-select';
import BillStatusSelect from '@/components/bill-status-select/bill-status-select';

interface Deal {
    id: number;
    title: string;
    deal_type: string;
    amount: number;
    status: string;
    customer_id?: number;
    customer_name?: string;
    car_id?: number;
    customer?: {
        id: number;
        name: string;
        phone: string;
        email?: string;
        country?: string;
        age?: number;
    };
    car?: {
        id: number;
        title: string;
        brand: string;
        year: number;
        status: string;
        type?: string;
        provider: string;
        kilometers: number;
        market_price: number;
        value_price: number;
        sale_price: number;
    };
}

const AddBill = () => {
    const { t } = getTranslation();
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [deals, setDeals] = useState<Deal[]>([]);
    const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
    const [alert, setAlert] = useState<{ visible: boolean; message: string; type: 'success' | 'danger' }>({
        visible: false,
        message: '',
        type: 'success',
    });

    // Billing form state
    const [billForm, setBillForm] = useState({
        bill_type: '',
        status: 'pending',
        // Invoice fields
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
        // Receipt fields
        payment_type: '',
        visa_amount: '',
        visa_installments: '',
        visa_card_type: '',
        visa_last_four: '',
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
        check_amount: '',
        check_bank_name: '',
        check_branch_number: '',
        check_account_number: '',
        check_number: '',
        check_holder_name: '',
        check_branch: '',
    });

    useEffect(() => {
        fetchDeals();
    }, []);
    const fetchDeals = async () => {
        try {
            const { data, error } = await supabase
                .from('deals')
                .select(
                    `
                    *,
                    customer:customers!deals_customer_id_fkey(*),
                    car:cars(*)
                `,
                )
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Process the data to ensure we have proper fallbacks
            const processedDeals = (data || []).map((deal) => ({
                ...deal,
                customer: deal.customer || null,
                car: deal.car || null,
            }));

            setDeals(processedDeals);
            console.log('Fetched deals:', processedDeals);
        } catch (error) {
            console.error('Error fetching deals:', error);
            setAlert({ visible: true, message: t('error_loading_deals'), type: 'danger' });
        }
    };
    const handleDealSelect = (dealId: string) => {
        const deal = deals.find((d) => d.id.toString() === dealId);
        if (deal) {
            setSelectedDeal(deal);
            // Auto-fill form with deal data
            setBillForm((prev) => ({
                ...prev,
                customer_name: deal.customer?.name || '',
                identity_number: '', // This field doesn't exist in the customer interface
                phone: deal.customer?.phone || '',
                car_details: deal.car ? `${deal.car.brand} ${deal.car.title} ${deal.car.year}` : '',
                sale_price: deal.amount?.toString() || '',
            }));
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setBillForm((prev) => {
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

    const validateForm = () => {
        if (!selectedDeal) {
            setAlert({ visible: true, message: t('deal_required'), type: 'danger' });
            return false;
        }
        if (!billForm.bill_type) {
            setAlert({ visible: true, message: t('bill_type_required'), type: 'danger' });
            return false;
        }
        if (!billForm.customer_name) {
            setAlert({ visible: true, message: t('customer_name_required'), type: 'danger' });
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setSaving(true);
        try {
            const billData = {
                deal_id: selectedDeal?.id,
                bill_type: billForm.bill_type,
                customer_name: billForm.customer_name,
                amount: parseFloat(billForm.sale_price) || 0,
                commission: parseFloat(billForm.commission) || 0,
                tax_amount: parseFloat(billForm.tax_amount) || 0,
                total_amount: parseFloat(billForm.total_with_tax) || 0,
                status: billForm.status,
                bill_data: {
                    invoice:
                        billForm.bill_type === 'tax_invoice' || billForm.bill_type === 'tax_invoice_receipt'
                            ? {
                                  customer_name: billForm.customer_name,
                                  identity_number: billForm.identity_number,
                                  phone: billForm.phone,
                                  date: billForm.date,
                                  car_details: billForm.car_details,
                                  sale_price: billForm.sale_price,
                                  commission: billForm.commission,
                                  free_text: billForm.free_text,
                                  total: billForm.total,
                                  tax_amount: billForm.tax_amount,
                                  total_with_tax: billForm.total_with_tax,
                              }
                            : null,
                    receipt:
                        billForm.bill_type === 'receipt_only' || billForm.bill_type === 'tax_invoice_receipt'
                            ? {
                                  customer_name: billForm.customer_name,
                                  identity_number: billForm.identity_number,
                                  phone: billForm.phone,
                                  date: billForm.date,
                                  payment_type: billForm.payment_type,
                                  visa_amount: billForm.visa_amount,
                                  visa_installments: billForm.visa_installments,
                                  visa_card_type: billForm.visa_card_type,
                                  visa_last_four: billForm.visa_last_four,
                                  bank_amount: billForm.bank_amount,
                                  bank_name: billForm.bank_name,
                                  bank_branch: billForm.bank_branch,
                                  account_number: billForm.account_number,
                                  transfer_number: billForm.transfer_number,
                                  transfer_holder_name: billForm.transfer_holder_name,
                                  transfer_amount: billForm.transfer_amount,
                                  transfer_bank_name: billForm.transfer_bank_name,
                                  transfer_branch: billForm.transfer_branch,
                                  transfer_account_number: billForm.transfer_account_number,
                                  transfer_branch_number: billForm.transfer_branch_number,
                                  check_amount: billForm.check_amount,
                                  check_bank_name: billForm.check_bank_name,
                                  check_branch_number: billForm.check_branch_number,
                                  check_account_number: billForm.check_account_number,
                                  check_number: billForm.check_number,
                                  check_holder_name: billForm.check_holder_name,
                                  check_branch: billForm.check_branch,
                              }
                            : null,
                },
            };

            const { error } = await supabase.from('bills').insert([billData]);

            if (error) throw error;

            setAlert({ visible: true, message: t('bill_created_successfully'), type: 'success' });

            // Redirect to bills list after a short delay
            setTimeout(() => {
                router.push('/bills');
            }, 1500);
        } catch (error) {
            console.error(error);
            setAlert({
                visible: true,
                message: t('error_creating_bill'),
                type: 'danger',
            });
        } finally {
            setSaving(false);
        }
    };

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
                        <Link href="/bills" className="text-primary hover:underline">
                            {t('bills')}
                        </Link>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <span>{t('add_new_bill')}</span>
                    </li>
                </ul>
            </div>

            <div className="mb-6">
                <h1 className="text-2xl font-bold">{t('add_new_bill')}</h1>
                <p className="text-gray-500">{t('create_bill_description')}</p>
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
                {/* Deal Selection */}
                <div className="panel bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20">
                    <div className="mb-5 flex items-center gap-3">
                        <IconMenuWidgets className="w-5 h-5 text-primary" />
                        <h5 className="text-xl font-bold text-primary dark:text-white-light">{t('select_deal')}</h5>
                    </div>                    <div className="space-y-4">
                        <DealSelect
                            deals={deals}
                            selectedDeal={selectedDeal}
                            onChange={(deal) => {
                                setSelectedDeal(deal);
                                if (deal) {
                                    populateFormFromDeal(deal);
                                }
                            }}
                            className="w-full"
                        />
                        {selectedDeal && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('deal_title')}</label>
                                    <p className="text-sm text-gray-900 dark:text-white">{selectedDeal.title}</p>
                                </div>{' '}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('customer_name')}</label>
                                    <p className="text-sm text-gray-900 dark:text-white">{selectedDeal.customer?.name || t('no_customer')}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('deal_type')}</label>
                                    <p className="text-sm text-gray-900 dark:text-white">{t(`deal_type_${selectedDeal.deal_type}`)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('amount')}</label>
                                    <p className="text-sm text-gray-900 dark:text-white">
                                        {new Intl.NumberFormat('ar-AE', {
                                            style: 'currency',
                                            currency: 'AED',
                                        }).format(selectedDeal.amount)}
                                    </p>
                                </div>{' '}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('car')}</label>
                                    <p className="text-sm text-gray-900 dark:text-white">{selectedDeal.car ? `${selectedDeal.car.brand} ${selectedDeal.car.title}` : t('no_car')}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bill Type Selection */}
                {selectedDeal && (
                    <div className="panel">
                        <div className="mb-5 flex items-center gap-3">
                            <IconDollarSign className="w-5 h-5 text-primary" />
                            <h5 className="text-lg font-semibold dark:text-white-light">{t('bill_type')}</h5>
                        </div>                        <div className="space-y-4">
                            <BillTypeSelect
                                defaultValue={billForm.bill_type}
                                onChange={(billType) => handleFormChange({ target: { name: 'bill_type', value: billType } } as any)}
                                className="w-full"
                            />
                        </div>
                    </div>
                )}

                {/* Tax Invoice Section */}
                {(billForm.bill_type === 'tax_invoice' || billForm.bill_type === 'tax_invoice_receipt') && (
                    <div className="panel">
                        <div className="mb-5 flex items-center gap-3">
                            <IconUser className="w-5 h-5 text-primary" />
                            <h5 className="text-lg font-semibold dark:text-white-light">{t('tax_invoice_details')}</h5>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('customer_name')}</label>
                                <input name="customer_name" value={billForm.customer_name} onChange={handleFormChange} className="form-input" placeholder={t('customer_name')} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('identity_number')}</label>
                                <input name="identity_number" value={billForm.identity_number} onChange={handleFormChange} className="form-input" placeholder={t('identity_number')} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('phone')}</label>
                                <input name="phone" value={billForm.phone} onChange={handleFormChange} className="form-input" placeholder={t('phone')} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('date')}</label>
                                <input name="date" type="date" value={billForm.date} onChange={handleFormChange} className="form-input" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('car_details')}</label>
                                <input name="car_details" value={billForm.car_details} onChange={handleFormChange} className="form-input" placeholder={t('car_details')} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('sale_price')}</label>
                                <input name="sale_price" type="number" step="0.01" value={billForm.sale_price} onChange={handleFormChange} className="form-input" placeholder={t('sale_price')} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('commission')}</label>
                                <input name="commission" type="number" step="0.01" value={billForm.commission} onChange={handleFormChange} className="form-input" placeholder={t('commission')} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('total')}</label>
                                <input name="total" value={billForm.total} className="form-input bg-gray-100 dark:bg-gray-700" placeholder={t('total')} readOnly />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('tax_amount')}</label>
                                <input name="tax_amount" value={billForm.tax_amount} className="form-input bg-gray-100 dark:bg-gray-700" placeholder={t('tax_amount')} readOnly />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('total_with_tax')}</label>
                                <input name="total_with_tax" value={billForm.total_with_tax} className="form-input bg-gray-100 dark:bg-gray-700" placeholder={t('total_with_tax')} readOnly />
                            </div>
                            <div className="md:col-span-2 lg:col-span-3">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('free_text')}</label>
                                <textarea name="free_text" rows={3} value={billForm.free_text} onChange={handleFormChange} className="form-textarea" placeholder={t('free_text')} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Receipt Section */}
                {(billForm.bill_type === 'receipt_only' || billForm.bill_type === 'tax_invoice_receipt') && (
                    <div className="panel">
                        <div className="mb-5 flex items-center gap-3">
                            <IconDollarSign className="w-5 h-5 text-primary" />
                            <h5 className="text-lg font-semibold dark:text-white-light">{t('receipt_details')}</h5>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">                            <div className="md:col-span-2 lg:col-span-3">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('payment_type')}</label>
                                <PaymentTypeSelect
                                    defaultValue={billForm.payment_type}
                                    onChange={(paymentType) => handleFormChange({ target: { name: 'payment_type', value: paymentType } } as any)}
                                    className="w-full"
                                />
                            </div>

                            {/* Payment Type Specific Fields */}
                            {billForm.payment_type === 'visa' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('visa_amount')}</label>
                                        <input
                                            name="visa_amount"
                                            type="number"
                                            step="0.01"
                                            value={billForm.visa_amount}
                                            onChange={handleFormChange}
                                            className="form-input"
                                            placeholder={t('visa_amount')}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('visa_installments')}</label>
                                        <input
                                            name="visa_installments"
                                            type="number"
                                            value={billForm.visa_installments}
                                            onChange={handleFormChange}
                                            className="form-input"
                                            placeholder={t('visa_installments')}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('visa_card_type')}</label>
                                        <input name="visa_card_type" value={billForm.visa_card_type} onChange={handleFormChange} className="form-input" placeholder={t('visa_card_type')} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('visa_last_four')}</label>
                                        <input name="visa_last_four" value={billForm.visa_last_four} onChange={handleFormChange} className="form-input" placeholder={t('visa_last_four')} />
                                    </div>
                                </>
                            )}

                            {billForm.payment_type === 'bank_transfer' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('bank_amount')}</label>
                                        <input
                                            name="bank_amount"
                                            type="number"
                                            step="0.01"
                                            value={billForm.bank_amount}
                                            onChange={handleFormChange}
                                            className="form-input"
                                            placeholder={t('bank_amount')}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('bank_name')}</label>
                                        <input name="bank_name" value={billForm.bank_name} onChange={handleFormChange} className="form-input" placeholder={t('bank_name')} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('bank_branch')}</label>
                                        <input name="bank_branch" value={billForm.bank_branch} onChange={handleFormChange} className="form-input" placeholder={t('bank_branch')} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('account_number')}</label>
                                        <input name="account_number" value={billForm.account_number} onChange={handleFormChange} className="form-input" placeholder={t('account_number')} />
                                    </div>
                                </>
                            )}

                            {billForm.payment_type === 'transfer' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('transfer_number')}</label>
                                        <input name="transfer_number" value={billForm.transfer_number} onChange={handleFormChange} className="form-input" placeholder={t('transfer_number')} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('transfer_holder_name')}</label>
                                        <input
                                            name="transfer_holder_name"
                                            value={billForm.transfer_holder_name}
                                            onChange={handleFormChange}
                                            className="form-input"
                                            placeholder={t('transfer_holder_name')}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('transfer_amount')}</label>
                                        <input
                                            name="transfer_amount"
                                            type="number"
                                            step="0.01"
                                            value={billForm.transfer_amount}
                                            onChange={handleFormChange}
                                            className="form-input"
                                            placeholder={t('transfer_amount')}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('transfer_bank_name')}</label>
                                        <input name="transfer_bank_name" value={billForm.transfer_bank_name} onChange={handleFormChange} className="form-input" placeholder={t('transfer_bank_name')} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('transfer_branch')}</label>
                                        <input name="transfer_branch" value={billForm.transfer_branch} onChange={handleFormChange} className="form-input" placeholder={t('transfer_branch')} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('transfer_account_number')}</label>
                                        <input
                                            name="transfer_account_number"
                                            value={billForm.transfer_account_number}
                                            onChange={handleFormChange}
                                            className="form-input"
                                            placeholder={t('transfer_account_number')}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('transfer_branch_number')}</label>
                                        <input
                                            name="transfer_branch_number"
                                            value={billForm.transfer_branch_number}
                                            onChange={handleFormChange}
                                            className="form-input"
                                            placeholder={t('transfer_branch_number')}
                                        />
                                    </div>
                                </>
                            )}

                            {billForm.payment_type === 'check' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('check_amount')}</label>
                                        <input
                                            name="check_amount"
                                            type="number"
                                            step="0.01"
                                            value={billForm.check_amount}
                                            onChange={handleFormChange}
                                            className="form-input"
                                            placeholder={t('check_amount')}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('check_bank_name')}</label>
                                        <input name="check_bank_name" value={billForm.check_bank_name} onChange={handleFormChange} className="form-input" placeholder={t('check_bank_name')} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('check_branch_number')}</label>
                                        <input
                                            name="check_branch_number"
                                            value={billForm.check_branch_number}
                                            onChange={handleFormChange}
                                            className="form-input"
                                            placeholder={t('check_branch_number')}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('check_account_number')}</label>
                                        <input
                                            name="check_account_number"
                                            value={billForm.check_account_number}
                                            onChange={handleFormChange}
                                            className="form-input"
                                            placeholder={t('check_account_number')}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('check_number')}</label>
                                        <input name="check_number" value={billForm.check_number} onChange={handleFormChange} className="form-input" placeholder={t('check_number')} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('check_holder_name')}</label>
                                        <input name="check_holder_name" value={billForm.check_holder_name} onChange={handleFormChange} className="form-input" placeholder={t('check_holder_name')} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('check_branch')}</label>
                                        <input name="check_branch" value={billForm.check_branch} onChange={handleFormChange} className="form-input" placeholder={t('check_branch')} />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Status Selection */}
                {billForm.bill_type && (
                    <div className="panel">
                        <div className="mb-5 flex items-center gap-3">
                            <IconDollarSign className="w-5 h-5 text-primary" />
                            <h5 className="text-lg font-semibold dark:text-white-light">{t('bill_status')}</h5>
                        </div>                        <div className="space-y-4">
                            <BillStatusSelect
                                defaultValue={billForm.status}
                                onChange={(status) => handleFormChange({ target: { name: 'status', value: status } } as any)}
                                className="w-full"
                            />
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                {selectedDeal && billForm.bill_type && (
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={() => router.back()} className="btn btn-outline-danger">
                            {t('cancel')}
                        </button>
                        <button type="submit" className="btn btn-primary px-8" disabled={saving}>
                            {saving ? t('creating') : t('create_bill')}
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
};

export default AddBill;
