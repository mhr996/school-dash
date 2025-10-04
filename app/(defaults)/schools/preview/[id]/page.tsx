'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import IconBuilding from '@/components/icon/icon-building';
import IconEdit from '@/components/icon/icon-edit';
import IconUser from '@/components/icon/icon-user';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconPhone from '@/components/icon/icon-phone';
import IconMail from '@/components/icon/icon-mail';
import IconUsers from '@/components/icon/icon-users';
import IconUsersGroup from '@/components/icon/icon-users-group';
import IconCalendar from '@/components/icon/icon-calendar';
import IconClipboardText from '@/components/icon/icon-clipboard-text';
import IconCashBanknotes from '@/components/icon/icon-cash-banknotes';
import IconEye from '@/components/icon/icon-eye';
import supabase from '@/lib/supabase';
import { getTranslation } from '@/i18n';
import Link from 'next/link';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import PageBreadcrumb from '@/components/layouts/page-breadcrumb';
import { calculateSchoolBalance, SchoolBalanceDetails, SchoolBill } from '@/utils/balance-manager';
import { DataTable } from 'mantine-datatable';

interface School {
    id: string;
    created_at: string;
    updated_at: string;
    name: string;
    code: string;
    type: string;
    director_name?: string;
    address?: string;
    email?: string;
    phone?: string;
    staff_count: number;
    student_count: number;
    class_count: number;
    status: string;
    notes?: string;
}

const SchoolPreview = () => {
    const { t } = getTranslation();
    const router = useRouter();
    const params = useParams();
    const schoolId = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [school, setSchool] = useState<School | null>(null);
    const [alert, setAlert] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'balance'>('details');
    const [balanceData, setBalanceData] = useState<SchoolBalanceDetails | null>(null);
    const [loadingBalance, setLoadingBalance] = useState(false);

    // Helper function to get localized institution type
    const getLocalizedType = (type: string) => {
        switch (type) {
            case 'council':
                return t('institution_type_council');
            case 'college':
                return t('institution_type_college');
            case 'school':
                return t('institution_type_school');
            case 'kindergarten':
                return t('institution_type_kindergarten');
            // Handle legacy Arabic values that might still be in the database
            case 'مجلس':
                return t('institution_type_council');
            case 'كلية':
                return t('institution_type_college');
            case 'مدرسة':
                return t('institution_type_school');
            case 'روضه':
                return t('institution_type_kindergarten');
            default:
                return type;
        }
    };

    useEffect(() => {
        const fetchSchool = async () => {
            try {
                const { data, error } = await supabase.from('schools').select('*').eq('id', schoolId).single();

                if (error) throw error;

                setSchool(data);
            } catch (error) {
                console.error('Error fetching school:', error);
                setAlert({ message: t('error_loading_school'), type: 'danger' });
            } finally {
                setLoading(false);
            }
        };

        if (schoolId) {
            fetchSchool();
        }
    }, [schoolId]);

    // Fetch balance data when Balance tab is activated
    useEffect(() => {
        const fetchBalance = async () => {
            if (activeTab !== 'balance' || !schoolId) return;

            setLoadingBalance(true);
            try {
                const balance = await calculateSchoolBalance(schoolId);
                setBalanceData(balance);
            } catch (error) {
                console.error('Error fetching school balance:', error);
                setAlert({ message: t('error_loading_balance'), type: 'danger' });
            } finally {
                setLoadingBalance(false);
            }
        };

        fetchBalance();
    }, [activeTab, schoolId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!school) {
        return (
            <div className="container mx-auto p-6">
                <div className="panel">
                    <div className="text-center py-12">
                        <IconBuilding className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <h2 className="text-xl font-semibold text-gray-600 mb-2">{t('school_not_found')}</h2>
                        <p className="text-gray-500 mb-6">{t('school_not_found_description')}</p>
                        <Link href="/schools" className="btn btn-primary">
                            {t('back_to_schools')}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            {/* Header */}
            <PageBreadcrumb section="schools" backUrl="/schools" items={[{ label: t('home'), href: '/' }, { label: t('schools'), href: '/schools' }, { label: school.name }]} />

            {/* Title and Action */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <IconBuilding className="w-8 h-8 text-primary" />
                        {school.name}
                    </h1>
                    <p className="text-gray-500 mt-2">{t('school_details')}</p>
                </div>
                <Link href={`/schools/edit/${school.id}`} className="btn btn-primary flex items-center gap-2">
                    <IconEdit className="w-4 h-4" />
                    {t('edit_school')}
                </Link>
            </div>

            {alert && (
                <div className="fixed top-4 right-4 z-50 min-w-80 max-w-md">
                    <Alert type={alert.type} title={alert.type === 'success' ? t('success') : t('error')} message={alert.message} onClose={() => setAlert(null)} />
                </div>
            )}

            {/* Tabs */}
            <div className="mb-6">
                <ul className="flex flex-wrap border-b border-gray-200 dark:border-gray-700">
                    <li className="mr-2">
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`inline-flex items-center gap-2 p-4 border-b-2 rounded-t-lg ${
                                activeTab === 'details' ? 'text-primary border-primary' : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                            }`}
                        >
                            <IconBuilding className="w-5 h-5" />
                            {t('details')}
                        </button>
                    </li>
                    <li className="mr-2">
                        <button
                            onClick={() => setActiveTab('balance')}
                            className={`inline-flex items-center gap-2 p-4 border-b-2 rounded-t-lg ${
                                activeTab === 'balance' ? 'text-primary border-primary' : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                            }`}
                        >
                            <IconCashBanknotes className="w-5 h-5" />
                            {t('balance')}
                        </button>
                    </li>
                </ul>
            </div>

            {/* Tab Content */}
            {activeTab === 'details' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Information */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Information */}
                        <div className="panel">
                            <div className="mb-5">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <IconBuilding className="w-5 h-5 text-primary" />
                                    {t('basic_information')}
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">{t('institution_name')}</label>
                                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">{school?.name}</div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">{t('institution_code')}</label>
                                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">{school?.code || t('not_specified')}</div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">{t('institution_type')}</label>
                                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                            <span
                                                className={`badge ${
                                                    school?.type === 'council' || school?.type === 'مجلس'
                                                        ? 'badge-outline-primary'
                                                        : school?.type === 'college' || school?.type === 'كلية'
                                                          ? 'badge-outline-success'
                                                          : school?.type === 'school' || school?.type === 'مدرسة'
                                                            ? 'badge-outline-info'
                                                            : 'badge-outline-warning'
                                                }`}
                                            >
                                                {school && getLocalizedType(school.type)}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">{t('status')}</label>
                                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                            <span className={`badge ${school?.status === 'active' ? 'badge-outline-success' : 'badge-outline-danger'}`}>
                                                {school?.status === 'active' ? t('active') : t('inactive')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="panel">
                            <div className="mb-5">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <IconUser className="w-5 h-5 text-primary" />
                                    {t('contact_information')}
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-bold text-gray-700 dark:text-white mb-2 flex items-center gap-2">
                                            <IconUser className="w-4 h-4 text-primary" />
                                            {t('director_name')}
                                        </label>
                                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">{school?.director_name || t('not_specified')}</div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-bold text-gray-700 dark:text-white mb-2 flex items-center gap-2">
                                            <IconPhone className="w-4 h-4 text-primary" />
                                            {t('phone_number')}
                                        </label>
                                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">{school?.phone || t('not_specified')}</div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-bold text-gray-700 dark:text-white mb-2 flex items-center gap-2">
                                            <IconMail className="w-4 h-4 text-primary" />
                                            {t('email')}
                                        </label>
                                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">{school?.email || t('not_specified')}</div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-bold text-gray-700 dark:text-white mb-2 flex items-center gap-2">
                                            <IconMapPin className="w-4 h-4 text-primary" />
                                            {t('address')}
                                        </label>
                                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg min-h-[60px]">{school?.address || t('not_specified')}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        {school?.notes && (
                            <div className="panel">
                                <div className="mb-5">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <IconClipboardText className="w-5 h-5 text-primary" />
                                        {t('notes')}
                                    </h3>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">{school.notes}</div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Statistics */}
                        <div className="panel">
                            <div className="mb-5">
                                <h3 className="text-lg font-semibold">{t('statistics')}</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <IconUsers className="w-5 h-5 text-blue-600" />
                                        <span className="font-medium">{t('staff_count')}</span>
                                    </div>
                                    <span className="text-lg font-bold text-blue-600">{school?.staff_count}</span>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <IconUsersGroup className="w-5 h-5 text-green-600" />
                                        <span className="font-medium">{t('student_count')}</span>
                                    </div>
                                    <span className="text-lg font-bold text-green-600">{school?.student_count}</span>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <IconBuilding className="w-5 h-5 text-orange-600" />
                                        <span className="font-medium">{t('class_count')}</span>
                                    </div>
                                    <span className="text-lg font-bold text-orange-600">{school?.class_count}</span>
                                </div>
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="panel">
                            <div className="mb-5">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <IconCalendar className="w-5 h-5 text-primary" />
                                    {t('record_information')}
                                </h3>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('created_at')}</label>
                                    <div className="text-sm font-semibold">{school && new Date(school.created_at).toLocaleDateString('tr-TR')}</div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('last_updated')}</label>
                                    <div className="text-sm font-semibold">{school && new Date(school.updated_at).toLocaleDateString('tr-TR')}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'balance' && (
                <div>
                    {loadingBalance ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
                        </div>
                    ) : balanceData ? (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Total Tax Invoices Card */}
                                <div className="panel bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                                    <div className="mb-5">
                                        <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">{t('total_tax_invoices')}</h3>
                                    </div>
                                    <div className="text-3xl font-bold text-red-600 dark:text-red-500">
                                        {balanceData.totalTaxInvoices.toLocaleString('en-US', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}{' '}
                                        ₪
                                    </div>
                                    <div className="text-sm text-red-600/70 dark:text-red-400/70 mt-2">
                                        {balanceData.taxInvoiceCount} {t('invoices')}
                                    </div>
                                </div>

                                {/* Total Receipts Card */}
                                <div className="panel bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                                    <div className="mb-5">
                                        <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">{t('total_receipts')}</h3>
                                    </div>
                                    <div className="text-3xl font-bold text-green-600 dark:text-green-500">
                                        {balanceData.totalReceipts.toLocaleString('en-US', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}{' '}
                                        ₪
                                    </div>
                                    <div className="text-sm text-green-600/70 dark:text-green-400/70 mt-2">
                                        {balanceData.receiptCount} {t('receipts')}
                                    </div>
                                </div>

                                {/* Net Balance Card */}
                                <div
                                    className={`panel ${
                                        balanceData.netBalance < 0
                                            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                            : balanceData.netBalance > 0
                                              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                    }`}
                                >
                                    <div className="mb-5">
                                        <h3
                                            className={`text-lg font-semibold ${
                                                balanceData.netBalance < 0
                                                    ? 'text-red-700 dark:text-red-400'
                                                    : balanceData.netBalance > 0
                                                      ? 'text-green-700 dark:text-green-400'
                                                      : 'text-gray-700 dark:text-gray-400'
                                            }`}
                                        >
                                            {t('net_balance')}
                                        </h3>
                                    </div>
                                    <div
                                        className={`text-3xl font-bold ${
                                            balanceData.netBalance < 0
                                                ? 'text-red-600 dark:text-red-500'
                                                : balanceData.netBalance > 0
                                                  ? 'text-green-600 dark:text-green-500'
                                                  : 'text-gray-600 dark:text-gray-500'
                                        }`}
                                    >
                                        {balanceData.netBalance.toLocaleString('en-US', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}{' '}
                                        ₪
                                    </div>
                                    <div
                                        className={`text-sm mt-2 ${
                                            balanceData.netBalance < 0
                                                ? 'text-red-600/70 dark:text-red-400/70'
                                                : balanceData.netBalance > 0
                                                  ? 'text-green-600/70 dark:text-green-400/70'
                                                  : 'text-gray-600/70 dark:text-gray-400/70'
                                        }`}
                                    >
                                        {balanceData.netBalance < 0 ? t('amount_owed') : balanceData.netBalance > 0 ? t('credit_balance') : t('balanced')}
                                    </div>
                                </div>
                            </div>

                            {/* Bills Table */}
                            <div className="panel">
                                <div className="mb-5">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <IconCashBanknotes className="w-5 h-5 text-primary" />
                                        {t('bills_history')}
                                    </h3>
                                </div>

                                <div className="datatables">
                                    <DataTable
                                        className="table-hover whitespace-nowrap rtl-table-headers"
                                        records={balanceData.bills}
                                        columns={[
                                            {
                                                accessor: 'bill_number',
                                                title: t('bill_number'),
                                                render: ({ bill_number, bill_type }) => (
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${bill_type === 'tax_invoice' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                                        <span className="font-semibold">{bill_number}</span>
                                                    </div>
                                                ),
                                            },
                                            {
                                                accessor: 'bill_type',
                                                title: t('type'),
                                                render: ({ bill_type }) => (
                                                    <span className={`badge ${bill_type === 'tax_invoice' ? 'badge-outline-danger' : 'badge-outline-success'}`}>
                                                        {bill_type === 'tax_invoice' ? t('tax_invoice') : t('receipt')}
                                                    </span>
                                                ),
                                            },
                                            {
                                                accessor: 'total_amount',
                                                title: t('amount'),
                                                render: ({ total_amount, bill_type, payments }) => {
                                                    const displayAmount = bill_type === 'receipt' && payments?.length ? payments.reduce((sum, p) => sum + p.amount, 0) : total_amount;

                                                    return (
                                                        <span className={`font-semibold ${bill_type === 'tax_invoice' ? 'text-red-600' : 'text-green-600'}`}>
                                                            {displayAmount.toLocaleString('en-US', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}{' '}
                                                            ₪
                                                        </span>
                                                    );
                                                },
                                            },
                                            {
                                                accessor: 'status',
                                                title: t('status'),
                                                render: ({ status }) => (
                                                    <span
                                                        className={`badge ${
                                                            status === 'paid' ? 'badge-outline-success' : status === 'partially_paid' ? 'badge-outline-warning' : 'badge-outline-danger'
                                                        }`}
                                                    >
                                                        {t(status)}
                                                    </span>
                                                ),
                                            },
                                            {
                                                accessor: 'issue_date',
                                                title: t('date'),
                                                render: ({ issue_date }) => new Date(issue_date).toLocaleDateString('tr-TR'),
                                            },
                                            {
                                                accessor: 'booking_reference',
                                                title: t('booking'),
                                                render: ({ booking_reference }) => <span className="text-sm text-gray-600 dark:text-gray-400">{booking_reference || t('n/a')}</span>,
                                            },
                                            {
                                                accessor: 'actions',
                                                title: t('actions'),
                                                titleClassName: '!text-center',
                                                render: (bill) => (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Link href={`/bills/preview/${bill.id}`} className="hover:text-info">
                                                            <IconEye />
                                                        </Link>
                                                    </div>
                                                ),
                                            },
                                        ]}
                                        minHeight={200}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="panel">
                            <div className="text-center py-12">
                                <IconCashBanknotes className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                                <h2 className="text-xl font-semibold text-gray-600 mb-2">{t('no_balance_data')}</h2>
                                <p className="text-gray-500">{t('no_bills_found_for_school')}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SchoolPreview;
