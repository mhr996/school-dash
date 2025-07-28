'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import supabase from '@/lib/supabase';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import { getTranslation } from '@/i18n';
import IconDollarSign from '@/components/icon/icon-dollar-sign';
import IconUser from '@/components/icon/icon-user';
import IconMenuWidgets from '@/components/icon/menu/icon-menu-widgets';
import IconCalendar from '@/components/icon/icon-calendar';
import DealSelect from '@/components/deal-select/deal-select';
import BillTypeSelect from '@/components/bill-type-select/bill-type-select';
import PaymentTypeSelect from '@/components/payment-type-select/payment-type-select';
import BillStatusSelect from '@/components/bill-status-select/bill-status-select';
import { logActivity } from '@/utils/activity-logger';

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
        buy_price: number;
        sale_price: number;
        car_number?: string; // Car number field
    };
}

const AddBill = () => {
    const { t } = getTranslation();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [saving, setSaving] = useState(false);
    const [deals, setDeals] = useState<Deal[]>([]);
    const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
    const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
    const [alert, setAlert] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

    // Billing form state matching database schema exactly
    const [billForm, setBillForm] = useState({
        bill_type: '',
        status: 'pending',
        customer_name: '',
        phone: '',
        date: new Date().toISOString().split('T')[0],
        car_details: '',
        sale_price: '',
        commission: '',
        free_text: '',
        total: '',
        tax_amount: '',
        total_with_tax: '',
        payment_type: '',
        // Visa payment fields
        visa_amount: '',
        visa_installments: '',
        visa_card_type: '',
        visa_last_four: '',
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
        // Cash fields
        cash_amount: '',
        // Approval number (common for various payment types)
        approval_number: '',
    });
    useEffect(() => {
        fetchDeals();
    }, []); // Effect to handle pre-selected deal from URL parameter
    useEffect(() => {
        const dealId = searchParams?.get('deal');
        if (dealId && deals.length > 0) {
            handleDealSelect(dealId);
        }
    }, [deals, searchParams]);
    // Auto-dismiss alert after 5 seconds
    useEffect(() => {
        if (alert) {
            const timer = setTimeout(() => {
                setAlert(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [alert]);
    const fetchDeals = async () => {
        try {
            const { data, error } = await supabase
                .from('deals')
                .select(
                    `
                    *,                    customer:customers!deals_customer_id_fkey(*),
                    car:cars!deals_car_id_fkey(*)
                `,
                )
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
            setAlert({ message: t('error_loading_deals'), type: 'danger' });
        }
    };
    const handleDealSelect = (dealId: string) => {
        const deal = deals.find((d) => d.id.toString() === dealId);
        if (deal) {
            setSelectedDeal(deal);
            // Auto-fill form with deal data and reset bill_type when deal changes
            setBillForm((prev) => ({
                ...prev,
                bill_type: '', // Reset bill type when deal changes as available options might change
                customer_name: deal.customer?.name || '',
                phone: deal.customer?.phone || '',
                car_details: deal.car ? `${deal.car.brand} ${deal.car.title} ${deal.car.year}` : '',
                sale_price: deal.amount?.toString() || '',
                // Calculate financials based on the deal amount (which already includes tax)
                total: (deal.amount / 1.18)?.toFixed(2) || '', // Price before tax
                tax_amount: ((deal.amount / 1.18) * 0.18)?.toFixed(2) || '', // Tax amount
                total_with_tax: deal.amount?.toFixed(2) || '', // Deal amount already includes tax
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
            setAlert({ message: t('deal_required'), type: 'danger' });
            return false;
        }
        if (!billForm.bill_type) {
            setAlert({ message: t('bill_type_required'), type: 'danger' });
            return false;
        }
        if (!billForm.customer_name) {
            setAlert({ message: t('customer_name_required'), type: 'danger' });
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
                status: billForm.status,
                customer_name: billForm.customer_name,
                phone: billForm.phone,
                date: billForm.date,
                car_details: billForm.car_details,
                sale_price: parseFloat(billForm.sale_price) || null,
                commission: parseFloat(billForm.commission) || null,
                free_text: billForm.free_text,
                total: parseFloat(billForm.total) || null,
                tax_amount: parseFloat(billForm.tax_amount) || null,
                total_with_tax: parseFloat(billForm.total_with_tax) || null,
                payment_type: billForm.payment_type || null,
                visa_amount: parseFloat(billForm.visa_amount) || null,
                visa_installments: parseInt(billForm.visa_installments) || null,
                visa_card_type: billForm.visa_card_type || null,
                visa_last_four: billForm.visa_last_four || null,
                bank_amount: parseFloat(billForm.bank_amount) || null,
                bank_name: billForm.bank_name || null,
                bank_branch: billForm.bank_branch || null,
                approval_number: billForm.approval_number || null,
                account_number: billForm.account_number || null,
                transfer_number: billForm.transfer_number || null,
                transfer_holder_name: billForm.transfer_holder_name || null,
                transfer_amount: parseFloat(billForm.transfer_amount) || null,
                transfer_bank_name: billForm.transfer_bank_name || null,
                transfer_branch: billForm.transfer_branch || null,
                transfer_account_number: billForm.transfer_account_number || null,
                transfer_branch_number: billForm.transfer_branch_number || null,
                check_amount: parseFloat(billForm.check_amount) || null,
                check_bank_name: billForm.check_bank_name || null,
                check_branch_number: billForm.check_branch_number || null,
                check_account_number: billForm.check_account_number || null,
                check_number: billForm.check_number || null,
                check_holder_name: billForm.check_holder_name || null,
                check_branch: billForm.check_branch || null,
                cash_amount: parseFloat(billForm.cash_amount) || null,
                created_at: billDate ? new Date(billDate + 'T00:00:00').toISOString() : new Date().toISOString(),
            };

            const { data: billResult, error } = await supabase.from('bills').insert([billData]).select('id').single();

            if (error) throw error;

            setAlert({ message: t('bill_created_successfully'), type: 'success' });

            // Log the activity with full bill data
            const billLogData = {
                ...billData,
                id: billResult.id,
                deal: selectedDeal,
            };

            await logActivity({
                type: 'bill_created',
                bill: billLogData,
            });

            // Redirect to bills list after a short delay
            setTimeout(() => {
                router.push('/bills');
            }, 1500);
        } catch (error) {
            console.error(error);
            setAlert({
                message: t('error_creating_bill'),
                type: 'danger',
            });
        } finally {
            setSaving(false);
        }
    };

    const populateFormFromDeal = (deal: Deal) => {
        if (!deal) return;

        setBillForm((prev) => ({
            ...prev,
            customer_name: deal.customer?.name || '',
            phone: deal.customer?.phone || '',
            car_details: deal.car ? `${deal.car.brand} ${deal.car.title} ${deal.car.year}` : '',
            sale_price: deal.amount?.toString() || '',
            // Calculate financials based on the deal amount (which already includes tax)
            total: (deal.amount / 1.18)?.toFixed(2) || '', // Price before tax
            tax_amount: ((deal.amount / 1.18) * 0.18)?.toFixed(2) || '', // Tax amount
            total_with_tax: deal.amount?.toFixed(2) || '', // Deal amount already includes tax
            // Set default date to today if not already set
            date: prev.date || new Date().toISOString().split('T')[0],
        }));
    };
    return (
        <div className="container mx-auto p-6 pb-24">
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

            {alert && (
                <div className="fixed top-4 right-4 z-50 min-w-80 max-w-md">
                    <Alert type={alert.type} title={alert.type === 'success' ? t('success') : t('error')} message={alert.message} onClose={() => setAlert(null)} />
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Deal Selection */}
                <div className="panel bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20">
                    <div className="mb-5 flex items-center gap-3">
                        <IconMenuWidgets className="w-5 h-5 text-primary" />
                        <h5 className="text-xl font-bold text-primary dark:text-white-light">{t('select_deal')}</h5>
                    </div>
                    <div className="space-y-4">
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
                                </div>
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
                                    <p className="text-sm text-gray-900 dark:text-white">{'$' + selectedDeal.amount}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('car')}</label>
                                    <p className="text-sm text-gray-900 dark:text-white">{selectedDeal.car ? `${selectedDeal.car.brand} ${selectedDeal.car.title}` : t('no_car')}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>{' '}
                {/* Bill Type Selection */}
                {selectedDeal && (
                    <div className="panel">
                        <div className="mb-5 flex items-center gap-3">
                            <IconDollarSign className="w-5 h-5 text-primary" />
                            <h5 className="text-lg font-semibold dark:text-white-light">{t('bill_type')}</h5>
                        </div>
                        <div className="space-y-4">
                            <BillTypeSelect
                                defaultValue={billForm.bill_type}
                                dealType={selectedDeal?.deal_type}
                                onChange={(billType) => handleFormChange({ target: { name: 'bill_type', value: billType } } as any)}
                                className="w-full"
                            />
                        </div>
                    </div>
                )}
                {/* Bill Date Selector */}
                {selectedDeal && (
                    <div className="panel">
                        <div className="mb-5 flex items-center gap-3">
                            <IconCalendar className="w-5 h-5 text-primary" />
                            <div>
                                <h5 className="text-lg font-semibold dark:text-white-light">{t('bill_date')}</h5>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">{t('select_bill_date_desc')}</p>
                            </div>
                        </div>
                        <div className="relative">
                            <input
                                type="date"
                                value={billDate}
                                onChange={(e) => setBillDate(e.target.value)}
                                className="form-input bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 text-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:w-5 [&::-webkit-calendar-picker-indicator]:h-5 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                style={{ colorScheme: 'light' }}
                            />
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                <IconCalendar className="w-5 h-5 text-gray-400" />
                            </div>
                        </div>
                    </div>
                )}
                {/* Tax Invoice Section */}
                {(billForm.bill_type === 'tax_invoice' || billForm.bill_type === 'tax_invoice_receipt') && selectedDeal && (
                    <>
                        {/* Customer Information Display */}
                        <div className="panel">
                            <div className="mb-5 flex items-center gap-3">
                                <IconUser className="w-5 h-5 text-primary" />
                                <h5 className="text-lg font-semibold dark:text-white-light">{t('customer_information')}</h5>
                            </div>
                            {selectedDeal.customer && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <h6 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">{t('customer_details')}</h6>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <span className="text-blue-600 dark:text-blue-300 font-medium">{t('customer_name')}:</span>
                                            <p className="text-blue-800 dark:text-blue-100">{selectedDeal.customer.name}</p>
                                        </div>
                                        <div>
                                            <span className="text-blue-600 dark:text-blue-300 font-medium">{t('phone')}:</span>
                                            <p className="text-blue-800 dark:text-blue-100">{selectedDeal.customer.phone}</p>
                                        </div>
                                        {selectedDeal.customer.email && (
                                            <div>
                                                <span className="text-blue-600 dark:text-blue-300 font-medium">{t('email')}:</span>
                                                <p className="text-blue-800 dark:text-blue-100">{selectedDeal.customer.email}</p>
                                            </div>
                                        )}
                                        {selectedDeal.customer.country && (
                                            <div>
                                                <span className="text-blue-600 dark:text-blue-300 font-medium">{t('country')}:</span>
                                                <p className="text-blue-800 dark:text-blue-100">{selectedDeal.customer.country}</p>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-blue-600 dark:text-blue-300 font-medium">{t('age')}:</span>
                                            <p className="text-blue-800 dark:text-blue-100">
                                                {selectedDeal.customer.age} {t('years_old')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>{' '}
                        {/* Tax Invoice Details Table */}
                        <div className="panel">
                            <div className="mb-5 flex items-center gap-3">
                                <IconDollarSign className="w-5 h-5 text-primary" />
                                <h5 className="text-lg font-semibold dark:text-white-light">تفاصيل الفاتورة الضريبية</h5>
                            </div>
                            {selectedDeal.car && (
                                <div className="bg-transparent rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                    {/* Table Header */}
                                    <div className="grid grid-cols-4 gap-4 mb-4 pb-2 border-b border-gray-300 dark:border-gray-600">
                                        <div className="text-sm font-bold text-gray-700 dark:text-white text-right">{t('deal_item')}</div>
                                        <div className="text-sm font-bold text-gray-700 dark:text-white text-center">{t('deal_price')}</div>
                                        <div className="text-sm font-bold text-gray-700 dark:text-white text-center">{t('deal_quantity')}</div>
                                        <div className="text-sm font-bold text-gray-700 dark:text-white text-center">{t('deal_total')}</div>
                                    </div>

                                    {/* Render table based on deal type */}
                                    {(selectedDeal.deal_type === 'new_used_sale' || selectedDeal.deal_type === 'new_used_sale_tax_inclusive') && (
                                        <>
                                            {/* Row 1: Car for Sale */}
                                            <div className="grid grid-cols-4 gap-4 mb-3 py-2">
                                                <div className="text-sm text-gray-700 dark:text-gray-300 text-right">
                                                    <div className="font-medium">{t('car_for_sale')}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {selectedDeal.car.brand} {selectedDeal.car.title} - {selectedDeal.car.year}
                                                        {selectedDeal.car.car_number && ` - ${selectedDeal.car.car_number}`} - #{selectedDeal.car.id}
                                                    </div>
                                                </div>
                                                <div className="text-center">-</div>
                                                <div className="text-center">-</div>
                                                <div className="text-center">-</div>
                                            </div>

                                            {/* Row 2: Buy Price */}
                                            <div className="grid grid-cols-4 gap-4 mb-3 py-2">
                                                <div className="text-sm text-gray-700 dark:text-gray-300 text-right">{t('buy_price_auto')}</div>
                                                <div className="text-center">
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">${selectedDeal.car.buy_price.toFixed(2)}</span>
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">1</span>
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">${selectedDeal.car.buy_price.toFixed(2)}</span>
                                                </div>
                                            </div>

                                            {/* Row 3: Selling Price */}
                                            <div className="grid grid-cols-4 gap-4 mb-3 py-2">
                                                <div className="text-sm text-gray-700 dark:text-gray-300 text-right">{t('selling_price_manual')}</div>
                                                <div className="text-center">
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">${selectedDeal.amount.toFixed(2)}</span>
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">1</span>
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">${selectedDeal.amount.toFixed(2)}</span>
                                                </div>
                                            </div>

                                            {/* Row 4: Loss */}
                                            <div className="grid grid-cols-4 gap-4 mb-3 py-2">
                                                <div className="text-sm text-gray-700 dark:text-gray-300 text-right">{t('loss_amount')}</div>
                                                <div className="text-center">-</div>
                                                <div className="text-center">-</div>
                                                <div className="text-center">
                                                    <span className="text-sm text-red-600 dark:text-red-400">${Math.max(0, selectedDeal.car.buy_price - selectedDeal.amount).toFixed(2)}</span>
                                                </div>
                                            </div>

                                            {/* Row 5: Profit Commission */}
                                            <div className="grid grid-cols-4 gap-4 mb-4 py-2">
                                                <div className="text-sm text-gray-700 dark:text-gray-300 text-right">{t('profit_commission')}</div>
                                                <div className="text-center">-</div>
                                                <div className="text-center">-</div>
                                                <div className="text-center">
                                                    <span className="text-sm text-green-600 dark:text-green-400">${Math.max(0, selectedDeal.amount - selectedDeal.car.buy_price).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {selectedDeal.deal_type === 'intermediary' && (
                                        <>
                                            {/* Row 1: Car Brokerage Commission */}
                                            <div className="grid grid-cols-4 gap-4 mb-3 py-2">
                                                <div className="text-sm text-gray-700 dark:text-gray-300 text-right">
                                                    <div className="font-medium">{t('intermediary_car_commission')}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {selectedDeal.car.brand} {selectedDeal.car.title} - {selectedDeal.car.year}
                                                        {selectedDeal.car.car_number && ` - ${selectedDeal.car.car_number}`} - #{selectedDeal.car.id}
                                                    </div>
                                                </div>
                                                <div className="text-center">-</div>
                                                <div className="text-center">-</div>
                                                <div className="text-center">-</div>
                                            </div>

                                            {/* Row 2: Profit Commission */}
                                            <div className="grid grid-cols-4 gap-4 mb-4 py-2">
                                                <div className="text-sm text-gray-700 dark:text-gray-300 text-right">{t('profit_commission')}</div>
                                                <div className="text-center">
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">${selectedDeal.amount.toFixed(2)}</span>
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">1</span>
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-sm text-green-600 dark:text-green-400">${selectedDeal.amount.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {selectedDeal.deal_type === 'financing_assistance_intermediary' && (
                                        <>
                                            {/* Row 1: Financing Assistance Commission */}
                                            <div className="grid grid-cols-4 gap-4 mb-3 py-2">
                                                <div className="text-sm text-gray-700 dark:text-gray-300 text-right">
                                                    <div className="font-medium">{t('financing_assistance_commission')}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {selectedDeal.car.brand} {selectedDeal.car.title} - {selectedDeal.car.year}
                                                        {selectedDeal.car.car_number && ` - ${selectedDeal.car.car_number}`} - #{selectedDeal.car.id}
                                                    </div>
                                                </div>
                                                <div className="text-center">-</div>
                                                <div className="text-center">-</div>
                                                <div className="text-center">-</div>
                                            </div>

                                            {/* Row 2: Commission */}
                                            <div className="grid grid-cols-4 gap-4 mb-4 py-2">
                                                <div className="text-sm text-gray-700 dark:text-gray-300 text-right">{t('commission_editable')}</div>
                                                <div className="text-center">
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">${selectedDeal.amount.toFixed(2)}</span>
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">1</span>
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-sm text-green-600 dark:text-green-400">${selectedDeal.amount.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {selectedDeal.deal_type === 'exchange' && (
                                        <>
                                            {/* Row 1: Car for Sale */}
                                            <div className="grid grid-cols-4 gap-4 mb-3 py-2">
                                                <div className="text-sm text-gray-700 dark:text-gray-300 text-right">
                                                    <div className="font-medium">{t('car_for_sale')}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {selectedDeal.car.brand} {selectedDeal.car.title} - {selectedDeal.car.year}
                                                        {selectedDeal.car.car_number && ` - ${selectedDeal.car.car_number}`} - #{selectedDeal.car.id}
                                                    </div>
                                                </div>
                                                <div className="text-center">-</div>
                                                <div className="text-center">-</div>
                                                <div className="text-center">-</div>
                                            </div>

                                            {/* Row 2: Buy Price */}
                                            <div className="grid grid-cols-4 gap-4 mb-3 py-2">
                                                <div className="text-sm text-gray-700 dark:text-gray-300 text-right">{t('buy_price_auto')}</div>
                                                <div className="text-center">
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">${selectedDeal.car.buy_price.toFixed(2)}</span>
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">1</span>
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">${selectedDeal.car.buy_price.toFixed(2)}</span>
                                                </div>
                                            </div>

                                            {/* Row 3: Selling Price */}
                                            <div className="grid grid-cols-4 gap-4 mb-3 py-2">
                                                <div className="text-sm text-gray-700 dark:text-gray-300 text-right">{t('selling_price_manual')}</div>
                                                <div className="text-center">
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">${selectedDeal.car.sale_price.toFixed(2)}</span>
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">1</span>
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">${selectedDeal.car.sale_price.toFixed(2)}</span>
                                                </div>
                                            </div>

                                            {/* Row 4: Customer Car Evaluation */}
                                            <div className="grid grid-cols-4 gap-4 mb-3 py-2">
                                                <div className="text-sm text-gray-700 dark:text-gray-300 text-right">
                                                    <div className="font-medium">{t('customer_car_evaluation')}</div>
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">${selectedDeal.amount.toFixed(2)}</span>
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">1</span>
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">${selectedDeal.amount.toFixed(2)}</span>
                                                </div>
                                            </div>

                                            {/* Row 5: Additional Customer Amount */}
                                            <div className="grid grid-cols-4 gap-4 mb-4 py-2">
                                                <div className="text-sm text-gray-700 dark:text-gray-300 text-right">{t('additional_customer_amount')}</div>
                                                <div className="text-center">-</div>
                                                <div className="text-center">-</div>
                                                <div className="text-center">
                                                    <span className="text-sm text-blue-600 dark:text-blue-400">${Math.max(0, selectedDeal.car.sale_price - selectedDeal.amount).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {selectedDeal.deal_type === 'company_commission' && (
                                        <>
                                            {/* Row 1: Company Commission */}
                                            <div className="grid grid-cols-4 gap-4 mb-4 py-2">
                                                <div className="text-sm text-gray-700 dark:text-gray-300 text-right">
                                                    <div className="font-medium">{t('company_commission')}</div>
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">${selectedDeal.amount.toFixed(2)}</span>
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">1</span>
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-sm text-green-600 dark:text-green-400">${selectedDeal.amount.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* Separator */}
                                    <div className="border-t border-gray-300 dark:border-gray-600 my-4"></div>

                                    {/* Tax Calculations */}
                                    <div className="space-y-3">
                                        {/* Price Before Tax - calculated by removing 18% tax from deal amount */}
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('price_before_tax')}</span>
                                            <span className="text-sm text-gray-700 dark:text-gray-300">${(selectedDeal.amount / 1.18).toFixed(2)}</span>
                                        </div>

                                        {/* Tax - calculated as 18% of the price before tax */}
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('deal_tax')} 18%</span>
                                            <span className="text-sm text-gray-700 dark:text-gray-300">${((selectedDeal.amount / 1.18) * 0.18).toFixed(2)}</span>{' '}
                                        </div>

                                        {/* Total Including Tax - this is the deal amount which already includes tax */}
                                        <div className="flex justify-between items-center pt-2 border-t border-gray-300 dark:border-gray-600">
                                            <span className="text-lg font-bold text-gray-700 dark:text-gray-300">{t('total_including_tax')}</span>
                                            <span className="text-lg font-bold text-primary">${selectedDeal.amount.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Notes Section */}
                        <div className="mt-6">
                            <label htmlFor="free_text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('notes')}
                            </label>
                            <textarea
                                id="free_text"
                                name="free_text"
                                rows={3}
                                value={billForm.free_text || ''}
                                onChange={handleFormChange}
                                className="form-textarea"
                                placeholder={t('enter_bill_notes')}
                            />
                        </div>
                    </>
                )}
                {/* Receipt Section */}
                {(billForm.bill_type === 'receipt_only' || billForm.bill_type === 'tax_invoice_receipt') && (
                    <div className="panel">
                        <div className="mb-5 flex items-center gap-3">
                            <IconDollarSign className="w-5 h-5 text-primary" />
                            <h5 className="text-lg font-semibold dark:text-white-light">{t('receipt_details')}</h5>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="md:col-span-2 lg:col-span-3">
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
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {t('bank_amount')}
                                        </label>
                                        <input
                                            name="bank_amount"
                                            type="number"
                                            step="0.01"
                                            value={billForm.bank_amount}
                                            onChange={handleFormChange}
                                            className="form-input"
                                            placeholder={t('bank_amount_placeholder')}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {t('transfer_bank_name')}
                                        </label>
                                        <input 
                                            name="transfer_bank_name"
                                            value={billForm.transfer_bank_name}
                                            onChange={handleFormChange}
                                            className="form-input"
                                            placeholder={t('transfer_bank_name_placeholder')}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {t('transfer_branch_number')}
                                        </label>
                                        <input
                                            name="transfer_branch_number"
                                            value={billForm.transfer_branch_number}
                                            onChange={handleFormChange}
                                            className="form-input"
                                            placeholder={t('transfer_branch_number_placeholder')}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {t('transfer_account_number')}
                                        </label>
                                        <input
                                            name="transfer_account_number"
                                            value={billForm.transfer_account_number}
                                            onChange={handleFormChange}
                                            className="form-input"
                                            placeholder={t('transfer_account_number_placeholder')}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {t('transfer_number')}
                                        </label>
                                        <input
                                            name="transfer_number"
                                            value={billForm.transfer_number}
                                            onChange={handleFormChange}
                                            className="form-input"
                                            placeholder={t('transfer_number_placeholder')}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {t('transfer_holder_name')}
                                        </label>
                                        <input
                                            name="transfer_holder_name"
                                            value={billForm.transfer_holder_name}
                                            onChange={handleFormChange}
                                            className="form-input"
                                            placeholder={t('transfer_holder_name_placeholder')}
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
                                    </div>{' '}
                                </>
                            )}
                            {billForm.payment_type === 'cash' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('cash_amount')}</label>
                                        <input
                                            name="cash_amount"
                                            type="number"
                                            step="0.01"
                                            value={billForm.cash_amount}
                                            onChange={handleFormChange}
                                            className="form-input"
                                            placeholder={t('cash_amount')}
                                        />
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
                        </div>
                        <div className="space-y-4">
                            <BillStatusSelect defaultValue={billForm.status} onChange={(status) => handleFormChange({ target: { name: 'status', value: status } } as any)} className="w-full" />
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
