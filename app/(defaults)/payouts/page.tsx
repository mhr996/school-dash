'use client';

import { useState, useEffect } from 'react';
import supabase from '@/lib/supabase';
import { getTranslation } from '@/i18n';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { sortBy } from 'lodash';
import Link from 'next/link';
import IconPlus from '@/components/icon/icon-plus';
import IconDownload from '@/components/icon/icon-download';
import IconSearch from '@/components/icon/icon-search';
import IconCashBanknotes from '@/components/icon/icon-cash-banknotes';
import CustomSelect from '@/components/elements/custom-select';
import { getAllServicesBalanceSummary, ServiceType } from '@/utils/service-balance-manager';
import { createPaymentFromBookingRecord } from '@/utils/payout-manager';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import IconX from '@/components/icon/icon-x';

interface Payout {
    id: string;
    type: 'booking' | 'payment';
    service_type: ServiceType;
    service_id: string;
    user_id: string;
    service_provider_name: string;
    amount: number;
    payment_method: string;
    payment_date: string;
    booking_service_id: string | null;
    booking_record_id: string | null;
    status: 'pending' | 'paid' | 'cancelled';
    reference_number: string | null;
    description: string | null;
    notes: string | null;
    created_by: string;
    created_at: string;
    created_by_user?: {
        full_name: string;
    };
}

const PayoutsList = () => {
    const { t } = getTranslation();
    const [items, setItems] = useState<Payout[]>([]);
    const [loading, setLoading] = useState(true);
    const [creatingPayment, setCreatingPayment] = useState<string | null>(null);

    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<Payout[]>([]);
    const [records, setRecords] = useState<Payout[]>([]);

    const [search, setSearch] = useState('');
    const [serviceTypeFilter, setServiceTypeFilter] = useState('');
    const [serviceIdFilter, setServiceIdFilter] = useState('');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Service options for secondary filter
    const [serviceOptions, setServiceOptions] = useState<Array<{ value: string; label: string }>>([]);
    const [loadingServices, setLoadingServices] = useState(false);

    // Service balance calculation
    const [serviceBalance, setServiceBalance] = useState<{
        totalBookings: number;
        totalPayments: number;
        balance: number;
        serviceName: string;
    } | null>(null);
    const [loadingBalance, setLoadingBalance] = useState(false);

    // Alert state for better UX
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error'>('success');

    // Payment modal state
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedBookingRecord, setSelectedBookingRecord] = useState<Payout | null>(null);
    const [paymentForm, setPaymentForm] = useState({
        payment_method: 'bank_transfer',
        payment_date: new Date().toISOString().split('T')[0],
        account_number: '',
        account_holder_name: '',
        bank_name: '',
        transaction_number: '',
        reference_number: '',
        check_number: '',
        check_bank_name: '',
        notes: '',
    });

    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'payment_date',
        direction: 'desc',
    });

    // Balance summary
    const [balanceSummary, setBalanceSummary] = useState({
        totalOwed: 0,
        totalPaidOut: 0,
        payoutCount: 0,
    });

    useEffect(() => {
        fetchPayouts();
    }, []);

    useEffect(() => {
        if (items.length > 0 || !loading) {
            fetchBalanceSummary();
        }
    }, [items]);

    const fetchPayouts = async () => {
        try {
            const { data, error } = await supabase
                .from('payouts')
                .select(
                    `
                    *,
                    created_by_user:users!payouts_created_by_fkey(full_name)
                `,
                )
                .order('payment_date', { ascending: false });

            if (error) throw error;

            const payoutsData = (data || []).map((payout) => ({
                ...payout,
                created_by_user: Array.isArray(payout.created_by_user) ? payout.created_by_user[0] : payout.created_by_user,
            })) as Payout[];

            setItems(payoutsData);
            setInitialRecords(payoutsData);
        } catch (error) {
            console.error('Error fetching payouts:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBalanceSummary = async () => {
        try {
            const summary = await getAllServicesBalanceSummary();

            // Calculate total paid out and payout count from items
            const totalPaidOut = items.reduce((sum, payout) => sum + payout.amount, 0);
            const payoutCount = items.length;

            setBalanceSummary({
                totalOwed: summary.totalOwed,
                totalPaidOut,
                payoutCount,
            });
        } catch (error) {
            console.error('Error fetching balance summary:', error);
        }
    };

    // Fetch services based on selected service type
    const fetchServicesByType = async (serviceType: string) => {
        if (!serviceType) {
            setServiceOptions([]);
            setServiceIdFilter('');
            return;
        }

        setLoadingServices(true);
        try {
            const tableMap: Record<string, string> = {
                guides: 'guides',
                paramedics: 'paramedics',
                security_companies: 'security_companies',
                external_entertainment_companies: 'external_entertainment_companies',
                travel_companies: 'travel_companies',
                education_programs: 'education_programs',
            };

            const table = tableMap[serviceType];
            if (!table) {
                setServiceOptions([]);
                return;
            }

            const { data, error } = await supabase.from(table).select('id, name').order('name');

            if (error) throw error;

            const options = (data || []).map((service: any) => ({
                value: service.id,
                label: service.name,
            }));

            setServiceOptions(options);
            setServiceIdFilter(''); // Reset service selection when type changes
        } catch (error) {
            console.error('Error fetching services:', error);
            setServiceOptions([]);
        } finally {
            setLoadingServices(false);
        }
    };

    // Watch for service type changes
    useEffect(() => {
        fetchServicesByType(serviceTypeFilter);
    }, [serviceTypeFilter]);

    // Calculate service balance when specific service is selected
    const calculateServiceBalance = async (serviceType: string, serviceId: string) => {
        if (!serviceType || !serviceId) {
            setServiceBalance(null);
            return;
        }

        setLoadingBalance(true);
        try {
            // Fetch all payouts for this specific service
            const { data: payouts, error } = await supabase.from('payouts').select('*').eq('service_type', serviceType).eq('service_id', serviceId);

            if (error) throw error;

            // Calculate totals
            const totalBookings = payouts?.filter((p) => p.type === 'booking').reduce((sum, p) => sum + p.amount, 0) || 0;

            const totalPayments = payouts?.filter((p) => p.type === 'payment').reduce((sum, p) => sum + p.amount, 0) || 0;

            const balance = totalBookings - totalPayments;

            // Get service name
            const serviceName = serviceOptions.find((s) => s.value === serviceId)?.label || 'Unknown Service';

            setServiceBalance({
                totalBookings,
                totalPayments,
                balance,
                serviceName,
            });
        } catch (error) {
            console.error('Error calculating service balance:', error);
            setServiceBalance(null);
        } finally {
            setLoadingBalance(false);
        }
    };

    // Watch for service selection changes
    useEffect(() => {
        calculateServiceBalance(serviceTypeFilter, serviceIdFilter);
    }, [serviceTypeFilter, serviceIdFilter, serviceOptions, items]);

    const clearFilters = () => {
        setSearch('');
        setServiceTypeFilter('');
        setServiceIdFilter('');
        setPaymentMethodFilter('');
        setTypeFilter('');
        setStatusFilter('');
        setServiceBalance(null);
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        setAlertMessage(message);
        setAlertType(type);
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
    };

    const handleOpenPaymentModal = (record: Payout) => {
        setSelectedBookingRecord(record);
        setPaymentForm({
            payment_method: 'bank_transfer',
            payment_date: new Date().toISOString().split('T')[0],
            account_number: '',
            account_holder_name: '',
            bank_name: '',
            transaction_number: '',
            reference_number: '',
            check_number: '',
            check_bank_name: '',
            notes: '',
        });
        setShowPaymentModal(true);
    };

    const handleClosePaymentModal = () => {
        setShowPaymentModal(false);
        setSelectedBookingRecord(null);
    };

    const handleCreatePayment = async () => {
        if (!selectedBookingRecord) return;

        setCreatingPayment(selectedBookingRecord.id);

        try {
            // Get current user
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
                showToast('User not authenticated', 'error');
                return;
            }

            const { data: userData } = await supabase.from('users').select('id').eq('auth_user_id', user.id).single();

            if (!userData) {
                showToast('User not found', 'error');
                return;
            }

            const result = await createPaymentFromBookingRecord(selectedBookingRecord.id, paymentForm, userData.id);

            if (result.success) {
                showToast('Payment created successfully!', 'success');
                handleClosePaymentModal();
                fetchPayouts(); // Refresh the list
            } else {
                showToast(`Error: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Error creating payment:', error);
            showToast('An error occurred while creating the payment', 'error');
        } finally {
            setCreatingPayment(null);
        }
    };

    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecords(initialRecords.slice(from, to));
    }, [page, pageSize, initialRecords]);

    useEffect(() => {
        setInitialRecords(() => {
            return items.filter((item) => {
                const searchTerm = search.toLowerCase();
                const matchesSearch =
                    item.service_provider_name?.toLowerCase().includes(searchTerm) ||
                    item.reference_number?.toLowerCase().includes(searchTerm) ||
                    item.payment_method?.toLowerCase().includes(searchTerm) ||
                    item.service_type?.toLowerCase().includes(searchTerm);

                const matchesServiceType = !serviceTypeFilter || item.service_type === serviceTypeFilter;
                const matchesServiceId = !serviceIdFilter || item.service_id === serviceIdFilter;
                const matchesPaymentMethod = !paymentMethodFilter || item.payment_method === paymentMethodFilter;
                const matchesType = !typeFilter || item.type === typeFilter;
                const matchesStatus = !statusFilter || item.status === statusFilter;

                return matchesSearch && matchesServiceType && matchesServiceId && matchesPaymentMethod && matchesType && matchesStatus;
            });
        });
    }, [items, search, serviceTypeFilter, serviceIdFilter, paymentMethodFilter, typeFilter, statusFilter]);

    useEffect(() => {
        const data2 = sortBy(initialRecords, sortStatus.columnAccessor);
        setInitialRecords(sortStatus.direction === 'desc' ? data2.reverse() : data2);
        setPage(1);
    }, [sortStatus]);

    const exportToCSV = () => {
        const headers = ['Payment Date', 'Service Type', 'Provider', 'Amount', 'Payment Method', 'Reference Number', 'Created By'];

        const rows = initialRecords.map((payout) => [
            new Date(payout.payment_date).toLocaleDateString(),
            payout.service_type.replace(/_/g, ' '),
            payout.service_provider_name,
            `₪${payout.amount.toLocaleString()}`,
            payout.payment_method,
            payout.reference_number || '',
            payout.created_by_user?.full_name || '',
        ]);

        const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payouts-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const getServiceTypeBadgeClass = (type: ServiceType) => {
        switch (type) {
            case 'guides':
                return 'badge-outline-primary';
            case 'paramedics':
                return 'badge-outline-success';
            case 'security_companies':
                return 'badge-outline-info';
            case 'external_entertainment_companies':
                return 'badge-outline-warning';
            case 'travel_companies':
                return 'badge-outline-danger';
            case 'education_programs':
                return 'badge-outline-secondary';
            default:
                return 'badge-outline-secondary';
        }
    };

    const getPaymentMethodBadgeClass = (method: string) => {
        switch (method) {
            case 'cash':
                return 'badge-outline-success';
            case 'bank_transfer':
                return 'badge-outline-primary';
            case 'credit_card':
                return 'badge-outline-info';
            case 'check':
                return 'badge-outline-warning';
            default:
                return 'badge-outline-secondary';
        }
    };

    const getTypeBadgeClass = (type: 'booking' | 'payment') => {
        switch (type) {
            case 'booking':
                return 'badge-outline-warning';
            case 'payment':
                return 'badge-outline-success';
            default:
                return 'badge-outline-secondary';
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'pending':
                return 'badge-outline-warning';
            case 'paid':
                return 'badge-outline-success';
            case 'cancelled':
                return 'badge-outline-danger';
            default:
                return 'badge-outline-secondary';
        }
    };

    return (
        <div className="panel border-white-light px-0 dark:border-[#1b2e4b]">
            {/* Header */}
            <div className="mb-5 flex flex-col gap-5 px-5 md:items-start">
                <div className="flex items-center gap-2">
                    <IconCashBanknotes className="h-6 w-6 text-primary" />
                    <h2 className="text-xl font-bold dark:text-white">{t('payouts')}</h2>
                </div>

                {/* Summary Stats */}
                <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border border-white-light bg-white p-4 dark:border-[#1b2e4b] dark:bg-[#0e1726]">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{t('total_owed_to_providers')}</div>
                                <div className="mt-1 text-xl font-bold text-danger">₪{balanceSummary.totalOwed.toLocaleString()}</div>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-danger-light dark:bg-danger">
                                <IconCashBanknotes className="h-6 w-6 text-danger dark:text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-white-light bg-white p-4 dark:border-[#1b2e4b] dark:bg-[#0e1726]">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{t('total_payouts')}</div>
                                <div className="mt-1 text-xl font-bold text-info">{balanceSummary.payoutCount}</div>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-info-light dark:bg-info">
                                <IconCashBanknotes className="h-6 w-6 text-info dark:text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-white-light bg-white p-4 dark:border-[#1b2e4b] dark:bg-[#0e1726]">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{t('total_paid_out')}</div>
                                <div className="mt-1 text-xl font-bold text-success">₪{balanceSummary.totalPaidOut.toLocaleString()}</div>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-success-light dark:bg-success">
                                <IconCashBanknotes className="h-6 w-6 text-success dark:text-white" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Actions */}
            <div className="mb-4.5 flex flex-col gap-4 px-5">
                {/* First Row: Search and Action Buttons */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="relative flex-1 max-w-[400px]">
                        <input type="text" className="form-input ltr:pl-9 rtl:pr-9" placeholder={t('search')} value={search} onChange={(e) => setSearch(e.target.value)} />
                        <IconSearch className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 ltr:left-3 rtl:right-3" />
                    </div>

                    <div className="flex items-center gap-2">
                        {(search || serviceTypeFilter || serviceIdFilter || paymentMethodFilter || typeFilter || statusFilter) && (
                            <button type="button" className="btn btn-outline-danger gap-2" onClick={clearFilters}>
                                <IconX className='w-4 h-4' />
                                {t('clear_filters')}
                            </button>
                        )}
                        <button type="button" className="btn btn-outline-primary gap-2" onClick={exportToCSV}>
                            <IconDownload />
                            {t('export')}
                        </button>
                        <Link href="/payouts/add" className="btn btn-primary gap-2">
                            <IconPlus />
                            {t('create_payout')}
                        </Link>
                    </div>
                </div>

                {/* Second Row: Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-[250px]">
                        <CustomSelect
                            value={serviceTypeFilter}
                            onChange={(val) => setServiceTypeFilter(val as string)}
                            placeholder={`${t('all')} ${t('service_type')}`}
                            options={[
                                { value: '', label: `${t('all')} ${t('service_type')}` },
                                { value: 'guides', label: t('guides') },
                                { value: 'paramedics', label: t('paramedics') },
                                { value: 'security_companies', label: t('security_companies') },
                                { value: 'external_entertainment_companies', label: t('external_entertainment_companies') },
                                { value: 'travel_companies', label: t('travel_companies') },
                                { value: 'education_programs', label: t('education_programs') },
                            ]}
                        />
                    </div>

                    {serviceTypeFilter && (
                        <div className="min-w-[250px]">
                            <CustomSelect
                                value={serviceIdFilter}
                                onChange={(val) => setServiceIdFilter(val as string)}
                                placeholder={loadingServices ? t('loading') : `${t('select')} ${t(serviceTypeFilter)}`}
                                options={[{ value: '', label: `${t('all')} ${t(serviceTypeFilter)}` }, ...serviceOptions]}
                                disabled={loadingServices}
                            />
                        </div>
                    )}

                    <div className="min-w-[250px]">
                        <CustomSelect
                            value={paymentMethodFilter}
                            onChange={(val) => setPaymentMethodFilter(val as string)}
                            placeholder={`${t('all')} ${t('payment_method')}`}
                            options={[
                                { value: '', label: `${t('all')} ${t('payment_method')}` },
                                { value: 'cash', label: t('cash') },
                                { value: 'bank_transfer', label: t('bank_transfer') },
                                { value: 'credit_card', label: t('credit_card') },
                                { value: 'check', label: t('check') },
                            ]}
                        />
                    </div>

                    <div className="min-w-[250px]">
                        <CustomSelect
                            value={typeFilter}
                            onChange={(val) => setTypeFilter(val as string)}
                            placeholder={`${t('all')} ${t('type')}`}
                            options={[
                                { value: '', label: `${t('all')} ${t('type')}` },
                                { value: 'booking', label: t('booking') },
                                { value: 'payment', label: t('payment') },
                            ]}
                        />
                    </div>

                    <div className="min-w-[250px]">
                        <CustomSelect
                            value={statusFilter}
                            onChange={(val) => setStatusFilter(val as string)}
                            placeholder={`${t('all')} ${t('status')}`}
                            options={[
                                { value: '', label: `${t('all')} ${t('status')}` },
                                { value: 'pending', label: t('pending') },
                                { value: 'paid', label: t('paid') },
                                { value: 'cancelled', label: t('cancelled') },
                            ]}
                        />
                    </div>
                </div>

                {/* Service Balance Display */}
                {serviceBalance && serviceIdFilter && (
                    <div className="rounded-lg border-2 border-primary bg-gradient-to-r from-primary-light to-blue-50 p-4 dark:from-primary/20 dark:to-blue-900/20 dark:border-primary/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
                                    {t('balance_for')}: <span className="text-primary">{serviceBalance.serviceName}</span>
                                </h4>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{t('total_bookings')}</div>
                                        <div className="text-lg font-bold text-warning">₪{serviceBalance.totalBookings.toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{t('total_payments')}</div>
                                        <div className="text-lg font-bold text-success">₪{serviceBalance.totalPayments.toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{t('balance')}</div>
                                        <div
                                            className={`text-lg font-bold ${serviceBalance.balance > 0 ? 'text-danger' : serviceBalance.balance < 0 ? 'text-info' : 'text-gray-600 dark:text-gray-300'}`}
                                        >
                                            ₪{serviceBalance.balance.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {loadingBalance && (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                    {t('calculating')}...
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="datatables pagination-padding relative">
                <DataTable
                    className={`${loading ? 'filter blur-sm pointer-events-none' : 'table-hover whitespace-nowrap'} rtl-table-headers`}
                    records={records}
                    columns={[
                        {
                            accessor: 'payment_date',
                            title: t('payment_date'),
                            sortable: true,
                            render: ({ payment_date }) => <div className="font-medium">{new Date(payment_date).toLocaleDateString()}</div>,
                        },
                        {
                            accessor: 'type',
                            title: t('type'),
                            sortable: true,
                            render: ({ type }) => <span className={`badge ${getTypeBadgeClass(type)}`}>{t(type)}</span>,
                        },
                        {
                            accessor: 'status',
                            title: t('status'),
                            sortable: true,
                            render: ({ status }) => <span className={`badge ${getStatusBadgeClass(status)}`}>{t(status)}</span>,
                        },
                        {
                            accessor: 'service_type',
                            title: t('service_type'),
                            sortable: true,
                            render: ({ service_type }) => <span className={`badge ${getServiceTypeBadgeClass(service_type)}`}>{t(service_type)}</span>,
                        },
                        {
                            accessor: 'service_provider_name',
                            title: t('service_provider'),
                            sortable: true,
                            render: ({ service_provider_name }) => <div className="font-medium">{service_provider_name}</div>,
                        },
                        {
                            accessor: 'amount',
                            title: t('amount'),
                            sortable: true,
                            render: ({ amount }) => <div className="font-bold text-success">₪{amount.toLocaleString()}</div>,
                        },
                        {
                            accessor: 'payment_method',
                            title: t('payment_method'),
                            sortable: true,
                            render: ({ payment_method }) => <span className={`badge ${getPaymentMethodBadgeClass(payment_method)}`}>{t(payment_method)}</span>,
                        },
                        {
                            accessor: 'actions',
                            title: t('actions'),
                            render: (payout) => (
                                <div className="flex items-center gap-2">
                                    {payout.type === 'booking' && payout.status === 'pending' && (
                                        <button type="button" className="btn btn-sm btn-success gap-1" onClick={() => handleOpenPaymentModal(payout)} disabled={creatingPayment === payout.id}>
                                            <IconCashBanknotes className="h-4 w-4" />
                                            {creatingPayment === payout.id ? t('processing') : t('create_payment')}
                                        </button>
                                    )}
                                    {payout.type === 'booking' && payout.status === 'paid' && <span className="text-xs text-gray-500 dark:text-gray-400">{t('payment_completed')}</span>}
                                </div>
                            ),
                        },
                    ]}
                    highlightOnHover
                    totalRecords={initialRecords.length}
                    recordsPerPage={pageSize}
                    page={page}
                    onPageChange={(p) => setPage(p)}
                    recordsPerPageOptions={PAGE_SIZES}
                    onRecordsPerPageChange={setPageSize}
                    sortStatus={sortStatus}
                    onSortStatusChange={setSortStatus}
                    minHeight={300}
                    paginationText={({ from, to, totalRecords }) => `${t('showing')} ${from} ${t('to')} ${to} ${t('of')} ${totalRecords} ${t('entries')}`}
                />
            </div>

            {/* Payment Modal */}
            <Transition appear show={showPaymentModal} as={Fragment}>
                <Dialog as="div" open={showPaymentModal} onClose={() => setShowPaymentModal(false)}>
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-[black]/60" />
                    </Transition.Child>
                    <div className="fixed inset-0 z-[999] overflow-y-auto">
                        <div className="flex min-h-screen items-center justify-center px-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="panel w-full max-w-2xl overflow-hidden rounded-lg border-0 p-0 text-black dark:text-white-dark">
                                    <div className="flex items-center justify-between bg-[#fbfbfb] px-5 py-3 dark:bg-[#121c2c]">
                                        <h5 className="text-lg font-bold">{t('create_payment')}</h5>
                                        <button type="button" onClick={() => setShowPaymentModal(false)} className="text-white-dark hover:text-dark">
                                            <IconX className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <div className="p-5">
                                        {selectedBookingRecord && (
                                            <div className="mb-5 rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
                                                <h6 className="mb-2 font-semibold">{t('booking_details')}</h6>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div>
                                                        <span className="text-gray-600 dark:text-gray-400">{t('service_provider')}:</span>
                                                        <span className="ml-2 font-medium">{selectedBookingRecord.service_provider_name}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600 dark:text-gray-400">{t('service_type')}:</span>
                                                        <span className="ml-2">{t(selectedBookingRecord.service_type)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600 dark:text-gray-400">{t('amount')}:</span>
                                                        <span className="ml-2 font-bold text-success">₪{selectedBookingRecord.amount.toLocaleString()}</span>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <span className="text-gray-600 dark:text-gray-400">{t('description')}:</span>
                                                        <span className="ml-2">{selectedBookingRecord.description}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <form className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label htmlFor="payment_method" className="mb-1 block font-semibold">
                                                        {t('payment_method')} <span className="text-danger">*</span>
                                                    </label>
                                                    <CustomSelect
                                                        value={paymentForm.payment_method}
                                                        onChange={(val) => setPaymentForm({ ...paymentForm, payment_method: val as string })}
                                                        placeholder={t('payment_method')}
                                                        options={[
                                                            { value: 'bank_transfer', label: t('bank_transfer') },
                                                            { value: 'cash', label: t('cash') },
                                                            { value: 'credit_card', label: t('credit_card') },
                                                            { value: 'check', label: t('check') },
                                                        ]}
                                                    />
                                                </div>

                                                <div>
                                                    <label htmlFor="payment_date" className="mb-1 block font-semibold">
                                                        {t('payment_date')} <span className="text-danger">*</span>
                                                    </label>
                                                    <input
                                                        id="payment_date"
                                                        type="date"
                                                        className="form-input"
                                                        value={paymentForm.payment_date}
                                                        onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            {paymentForm.payment_method === 'bank_transfer' && (
                                                <>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label htmlFor="account_number" className="mb-1 block font-semibold">
                                                                {t('account_number')}
                                                            </label>
                                                            <input
                                                                id="account_number"
                                                                type="text"
                                                                className="form-input"
                                                                value={paymentForm.account_number}
                                                                onChange={(e) => setPaymentForm({ ...paymentForm, account_number: e.target.value })}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label htmlFor="account_holder_name" className="mb-1 block font-semibold">
                                                                {t('account_holder_name')}
                                                            </label>
                                                            <input
                                                                id="account_holder_name"
                                                                type="text"
                                                                className="form-input"
                                                                value={paymentForm.account_holder_name}
                                                                onChange={(e) => setPaymentForm({ ...paymentForm, account_holder_name: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label htmlFor="bank_name" className="mb-1 block font-semibold">
                                                                {t('bank_name')}
                                                            </label>
                                                            <input
                                                                id="bank_name"
                                                                type="text"
                                                                className="form-input"
                                                                value={paymentForm.bank_name}
                                                                onChange={(e) => setPaymentForm({ ...paymentForm, bank_name: e.target.value })}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label htmlFor="transaction_number" className="mb-1 block font-semibold">
                                                                {t('transaction_number')}
                                                            </label>
                                                            <input
                                                                id="transaction_number"
                                                                type="text"
                                                                className="form-input"
                                                                value={paymentForm.transaction_number}
                                                                onChange={(e) => setPaymentForm({ ...paymentForm, transaction_number: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            {paymentForm.payment_method === 'check' && (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label htmlFor="check_number" className="mb-1 block font-semibold">
                                                            {t('check_number')}
                                                        </label>
                                                        <input
                                                            id="check_number"
                                                            type="text"
                                                            className="form-input"
                                                            value={paymentForm.check_number}
                                                            onChange={(e) => setPaymentForm({ ...paymentForm, check_number: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label htmlFor="check_bank_name" className="mb-1 block font-semibold">
                                                            {t('bank_name')}
                                                        </label>
                                                        <input
                                                            id="check_bank_name"
                                                            type="text"
                                                            className="form-input"
                                                            value={paymentForm.check_bank_name}
                                                            onChange={(e) => setPaymentForm({ ...paymentForm, check_bank_name: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <div>
                                                <label htmlFor="reference_number" className="mb-1 block font-semibold">
                                                    {t('reference_number')}
                                                </label>
                                                <input
                                                    id="reference_number"
                                                    type="text"
                                                    className="form-input"
                                                    value={paymentForm.reference_number}
                                                    onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="notes" className="mb-1 block font-semibold">
                                                    {t('notes')}
                                                </label>
                                                <textarea
                                                    id="notes"
                                                    rows={3}
                                                    className="form-textarea"
                                                    value={paymentForm.notes}
                                                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                                                />
                                            </div>

                                            <div className="mt-8 flex items-center justify-end gap-3">
                                                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn btn-outline-danger">
                                                    {t('cancel')}
                                                </button>
                                                <button type="button" onClick={handleCreatePayment} className="btn btn-primary" disabled={creatingPayment !== null}>
                                                    {creatingPayment !== null ? t('processing') : t('create_payment')}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

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
};

export default PayoutsList;
