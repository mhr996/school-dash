'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import supabase from '@/lib/supabase';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import { getTranslation } from '@/i18n';
import IconDollarSign from '@/components/icon/icon-dollar-sign';
import IconUser from '@/components/icon/icon-user';
import IconMenuWidgets from '@/components/icon/menu/icon-menu-widgets';

interface Deal {
    id: string;
    title: string;
    deal_type: string;
    amount: number;
    customer_id: string;
    customer?: {
        name: string;
        phone: string;
        identity_number: string;
    };
    car_id: string;
    car?: {
        title: string;
        brand: string;
        year: number;
    };
}

interface Bill {
    id: string;
    deal_id: string;
    bill_type: string;
    customer_name: string;
    amount: number;
    commission: number;
    tax_amount: number;
    total_amount: number;
    status: string;
    bill_data: any;
    deal?: Deal;
}

const EditBill = () => {
    const { t } = getTranslation();
    const router = useRouter();
    const params = useParams();
    const billId = params?.id as string;

    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [deals, setDeals] = useState<Deal[]>([]);
    const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
    const [bill, setBill] = useState<Bill | null>(null);
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
        fetchBillAndDeals();
    }, [billId]);

    const fetchBillAndDeals = async () => {
        try {
            // Fetch bill details
            const { data: billData, error: billError } = await supabase
                .from('bills')
                .select(
                    `
                    *,
                    deal:deals(
                        *,
                        customer:customers(*),
                        car:cars(*)
                    )
                `,
                )
                .eq('id', billId)
                .single();

            if (billError) throw billError;

            setBill(billData);
            setSelectedDeal(billData.deal);

            // Populate form with existing data
            const invoiceData = billData.bill_data?.invoice || {};
            const receiptData = billData.bill_data?.receipt || {};

            setBillForm({
                bill_type: billData.bill_type,
                status: billData.status,
                customer_name: invoiceData.customer_name || billData.customer_name,
                identity_number: invoiceData.identity_number || '',
                phone: invoiceData.phone || '',
                date: invoiceData.date || new Date().toISOString().split('T')[0],
                car_details: invoiceData.car_details || '',
                sale_price: invoiceData.sale_price || billData.amount?.toString() || '',
                commission: invoiceData.commission || billData.commission?.toString() || '',
                free_text: invoiceData.free_text || '',
                total: invoiceData.total || '',
                tax_amount: invoiceData.tax_amount || billData.tax_amount?.toString() || '',
                total_with_tax: invoiceData.total_with_tax || billData.total_amount?.toString() || '',
                payment_type: receiptData.payment_type || '',
                visa_amount: receiptData.visa_amount || '',
                visa_installments: receiptData.visa_installments || '',
                visa_card_type: receiptData.visa_card_type || '',
                visa_last_four: receiptData.visa_last_four || '',
                bank_amount: receiptData.bank_amount || '',
                bank_name: receiptData.bank_name || '',
                bank_branch: receiptData.bank_branch || '',
                account_number: receiptData.account_number || '',
                transfer_number: receiptData.transfer_number || '',
                transfer_holder_name: receiptData.transfer_holder_name || '',
                transfer_amount: receiptData.transfer_amount || '',
                transfer_bank_name: receiptData.transfer_bank_name || '',
                transfer_branch: receiptData.transfer_branch || '',
                transfer_account_number: receiptData.transfer_account_number || '',
                transfer_branch_number: receiptData.transfer_branch_number || '',
                check_amount: receiptData.check_amount || '',
                check_bank_name: receiptData.check_bank_name || '',
                check_branch_number: receiptData.check_branch_number || '',
                check_account_number: receiptData.check_account_number || '',
                check_number: receiptData.check_number || '',
                check_holder_name: receiptData.check_holder_name || '',
                check_branch: receiptData.check_branch || '',
            });

            // Fetch all deals for potential re-assignment
            const { data: dealsData, error: dealsError } = await supabase
                .from('deals')
                .select(
                    `
                    *,
                    customer:customers(*),
                    car:cars(*)
                `,
                )
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (dealsError) throw dealsError;
            setDeals(dealsData || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            setAlert({
                visible: true,
                message: t('error_loading_bill'),
                type: 'danger',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDealSelect = (dealId: string) => {
        const deal = deals.find((d) => d.id === dealId);
        if (deal) {
            setSelectedDeal(deal);
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

            const { error } = await supabase.from('bills').update(billData).eq('id', billId);

            if (error) throw error;

            setAlert({ visible: true, message: t('bill_updated_successfully'), type: 'success' });

            // Redirect to bills list after a short delay
            setTimeout(() => {
                router.push('/bills');
            }, 1500);
        } catch (error) {
            console.error(error);
            setAlert({
                visible: true,
                message: t('error_updating_bill'),
                type: 'danger',
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!bill) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600">{t('bill_not_found')}</h1>
                    <Link href="/bills" className="btn btn-primary mt-4">
                        {t('back_to_bills')}
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
                        <Link href="/bills" className="text-primary hover:underline">
                            {t('bills')}
                        </Link>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <span>{t('edit_bill')}</span>
                    </li>
                </ul>
            </div>

            <div className="mb-6">
                <h1 className="text-2xl font-bold">{t('edit_bill')}</h1>
                <p className="text-gray-500">{t('update_bill_description')}</p>
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
                        <h5 className="text-xl font-bold text-primary dark:text-white-light">{t('associated_deal')}</h5>
                    </div>
                    <div className="space-y-4">
                        <select value={selectedDeal?.id || ''} onChange={(e) => handleDealSelect(e.target.value)} className="form-select text-lg py-3" required>
                            <option value="">{t('select_deal')}</option>
                            {deals.map((deal) => (
                                <option key={deal.id} value={deal.id}>
                                    {deal.title} - {deal.customer?.name} - {t(`deal_type_${deal.deal_type}`)}
                                </option>
                            ))}
                        </select>
                        {selectedDeal && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('deal_title')}</label>
                                    <p className="text-sm text-gray-900 dark:text-white">{selectedDeal.title}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('customer_name')}</label>
                                    <p className="text-sm text-gray-900 dark:text-white">{selectedDeal.customer?.name}</p>
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
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('car')}</label>
                                    <p className="text-sm text-gray-900 dark:text-white">
                                        {selectedDeal.car?.brand} {selectedDeal.car?.title}
                                    </p>
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
                        </div>
                        <div className="space-y-4">
                            <select name="bill_type" value={billForm.bill_type} onChange={handleFormChange} className="form-select" required>
                                <option value="">{t('select_bill_type')}</option>
                                <option value="tax_invoice">{t('tax_invoice_only')}</option>
                                <option value="receipt_only">{t('receipt_only')}</option>
                                <option value="tax_invoice_receipt">{t('tax_invoice_and_receipt')}</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Include the same tax invoice and receipt sections as the add page */}
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

                {/* Status Selection */}
                {billForm.bill_type && (
                    <div className="panel">
                        <div className="mb-5 flex items-center gap-3">
                            <IconDollarSign className="w-5 h-5 text-primary" />
                            <h5 className="text-lg font-semibold dark:text-white-light">{t('bill_status')}</h5>
                        </div>
                        <div className="space-y-4">
                            <select name="status" value={billForm.status} onChange={handleFormChange} className="form-select">
                                <option value="pending">{t('bill_status_pending')}</option>
                                <option value="paid">{t('bill_status_paid')}</option>
                                <option value="overdue">{t('bill_status_overdue')}</option>
                            </select>
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
                            {saving ? t('updating') : t('update_bill')}
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
};

export default EditBill;
