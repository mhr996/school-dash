'use client';
import IconEdit from '@/components/icon/icon-edit';
import IconEye from '@/components/icon/icon-eye';
import IconPlus from '@/components/icon/icon-plus';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconUser from '@/components/icon/icon-user';
import IconSearch from '@/components/icon/icon-search';
import { sortBy } from 'lodash';
import { DataTableSortStatus, DataTable } from 'mantine-datatable';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import ConfirmModal from '@/components/modals/confirm-modal';
import { getTranslation } from '@/i18n';
import { useRouter } from 'next/navigation';
import { getCurrentUserWithRole } from '@/lib/auth';

interface UserRole {
    id: number;
    name: string;
    description: string;
}

interface School {
    id: string;
    name: string;
    code: string;
}

interface User {
    id: string;
    created_at: string;
    updated_at: string;
    full_name: string;
    email: string;
    phone?: string;
    birth_date?: string;
    address?: string;
    role_id: number;
    school_id?: string;
    is_active: boolean;
    user_roles?: UserRole;
    schools?: School;
}

const UsersList = () => {
    const { t } = getTranslation();
    const router = useRouter();
    const [items, setItems] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isAdminUser, setIsAdminUser] = useState(false);

    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<User[]>([]);
    const [records, setRecords] = useState<User[]>([]);
    const [selectedRecords, setSelectedRecords] = useState<User[]>([]);

    const [search, setSearch] = useState('');

    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'created_at',
        direction: 'desc',
    });

    // Modal and alert states
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [alert, setAlert] = useState<{ visible: boolean; message: string; type: 'success' | 'danger' }>({
        visible: false,
        message: '',
        type: 'success',
    });

    // Check current user role
    useEffect(() => {
        const checkUserRole = async () => {
            const { user, error } = await getCurrentUserWithRole();
            if (!error && user) {
                setCurrentUser(user);
                setIsAdminUser(user.user_roles?.name === 'admin');
            }
        };
        checkUserRole();
    }, []);

    // Fetch users
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select(
                        `
                        *,
                        user_roles(id, name, description),
                        schools(id, name, code)
                    `,
                    )
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setItems(data as User[]);
            } catch (error) {
                console.error('Error fetching users:', error);
                setAlert({ visible: true, message: t('error_loading_data'), type: 'danger' });
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecords([...initialRecords.slice(from, to)]);
    }, [page, pageSize, initialRecords]);

    useEffect(() => {
        setInitialRecords(
            items.filter((item) => {
                const matchesSearch =
                    !search ||
                    item.full_name?.toLowerCase().includes(search.toLowerCase()) ||
                    item.email?.toLowerCase().includes(search.toLowerCase()) ||
                    item.phone?.toLowerCase().includes(search.toLowerCase()) ||
                    item.user_roles?.name?.toLowerCase().includes(search.toLowerCase());

                return matchesSearch;
            }),
        );
    }, [items, search]);

    useEffect(() => {
        const sorted = sortBy(initialRecords, sortStatus.columnAccessor);
        setRecords(sortStatus.direction === 'desc' ? sorted.reverse() : sorted);
        setPage(1);
    }, [sortStatus, initialRecords]);

    const confirmDelete = (user: User) => {
        setUserToDelete(user);
        setShowConfirmModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!userToDelete) return;

        try {
            // First get the user's auth_user_id for deleting from auth
            const { data: userData, error: fetchError } = await supabase.from('users').select('auth_user_id').eq('id', userToDelete.id).single();

            if (fetchError) throw fetchError;

            // Delete from database first
            const { error: dbError } = await supabase.from('users').delete().eq('id', userToDelete.id);
            if (dbError) throw dbError;

            // If user has auth_user_id, delete from auth system
            if (userData?.auth_user_id) {
                const { data: sessionData } = await supabase.auth.getSession();
                const token = sessionData?.session?.access_token;

                if (token) {
                    const response = await fetch('/api/users/delete', {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            userId: userData.auth_user_id,
                        }),
                    });

                    if (!response.ok) {
                        console.warn('Failed to delete from auth system, but user removed from database');
                    }
                }
            }

            setItems(items.filter((u) => u.id !== userToDelete.id));
            setAlert({ visible: true, message: t('user_deleted_successfully'), type: 'success' });
        } catch (error) {
            console.error('Error deleting user:', error);
            setAlert({ visible: true, message: t('error_deleting_user'), type: 'danger' });
        } finally {
            setShowConfirmModal(false);
            setUserToDelete(null);
        }
    };

    const handleBulkDeleteConfirm = async () => {
        const ids = selectedRecords.map((u) => u.id);
        try {
            // Get auth_user_ids for all selected users
            const { data: usersData, error: fetchError } = await supabase.from('users').select('id, auth_user_id').in('id', ids);

            if (fetchError) throw fetchError;

            // Delete from database first
            const { error: dbError } = await supabase.from('users').delete().in('id', ids);
            if (dbError) throw dbError;

            // Delete from auth system for users that have auth_user_id
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData?.session?.access_token;

            if (token && usersData) {
                const authUserIds = usersData.filter((u) => u.auth_user_id).map((u) => u.auth_user_id);

                // Delete each user from auth (could be optimized with batch delete if API supports it)
                for (const authUserId of authUserIds) {
                    try {
                        await fetch('/api/users/delete', {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                                userId: authUserId,
                            }),
                        });
                    } catch (error) {
                        console.warn('Failed to delete user from auth system:', error);
                    }
                }
            }

            setItems(items.filter((u) => !ids.includes(u.id)));
            setSelectedRecords([]);
            setAlert({ visible: true, message: t('users_deleted_successfully'), type: 'success' });
        } catch (error) {
            console.error('Error deleting users:', error);
            setAlert({ visible: true, message: t('error_deleting_users'), type: 'danger' });
        } finally {
            setShowBulkDeleteModal(false);
        }
    };

    const toggleUserStatus = async (user: User) => {
        try {
            const newStatus = !user.is_active;
            const { error } = await supabase.from('users').update({ is_active: newStatus }).eq('id', user.id);

            if (error) throw error;

            setItems((prevItems) => prevItems.map((item) => (item.id === user.id ? { ...item, is_active: newStatus } : item)));

            setAlert({
                visible: true,
                message: newStatus ? t('user_activated_successfully') : t('user_deactivated_successfully'),
                type: 'success',
            });
        } catch (error) {
            console.error('Error updating user status:', error);
            setAlert({
                visible: true,
                message: t('error_updating_user_status'),
                type: 'danger',
            });
        }
    };

    return (
        <div className="panel border-white-light px-0 dark:border-[#1b2e4b]">
            {/* Header */}
            <div className="mb-5 flex flex-col gap-5 px-5 md:items-start">
                <div className="flex items-center gap-2">
                    <IconUser className="shrink-0 text-primary" />
                    <h5 className="text-lg font-semibold dark:text-white">{t('users_management')}</h5>
                </div>
            </div>

            {/* Search and Actions */}
            <div className="mb-4.5 flex flex-col gap-4 px-5 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 items-center">
                    <div className="relative flex-1 max-w-[400px]">
                        <input type="text" className="form-input ltr:pl-9 rtl:pr-9" placeholder={t('search')} value={search} onChange={(e) => setSearch(e.target.value)} />
                        <IconSearch className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 ltr:left-3 rtl:right-3" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isAdminUser && selectedRecords.length > 0 && (
                        <button type="button" className="btn btn-danger gap-2" onClick={() => setShowBulkDeleteModal(true)}>
                            <IconTrashLines />
                            {t('delete_selected')} ({selectedRecords.length})
                        </button>
                    )}
                    {isAdminUser && (
                        <Link href="/users/add" className="btn btn-primary gap-2">
                            <IconPlus />
                            {t('add_user')}
                        </Link>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="datatables pagination-padding relative">
                <DataTable
                    className={`${loading ? 'filter blur-sm pointer-events-none' : 'table-hover whitespace-nowrap'}`}
                    records={records}
                    columns={[
                        {
                            accessor: 'full_name',
                            title: t('full_name'),
                            sortable: true,
                            render: ({ full_name, email }) => (
                                <div>
                                    <div className="font-semibold">{full_name || t('not_specified')}</div>
                                    <div className="text-xs text-gray-500">{email}</div>
                                </div>
                            ),
                        },
                        {
                            accessor: 'user_roles.name',
                            title: t('user_role'),
                            sortable: true,
                            render: ({ user_roles }) => <span className="badge badge-outline-info">{user_roles?.name ? t(`role_${user_roles.name}`) : t('not_specified')}</span>,
                        },
                        {
                            accessor: 'schools.name',
                            title: t('school_assignment'),
                            sortable: true,
                            render: ({ schools }) => schools?.name || t('not_applicable'),
                        },
                        {
                            accessor: 'phone',
                            title: t('phone'),
                            sortable: true,
                            render: ({ phone }) => phone || t('not_specified'),
                        },
                        {
                            accessor: 'created_at',
                            title: t('created_date'),
                            sortable: true,
                            render: ({ created_at }) => (
                                <span>
                                    {new Date(created_at).toLocaleDateString('en-GB', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                    })}
                                </span>
                            ),
                        },
                     
                        {
                            accessor: 'action',
                            title: t('actions'),
                            sortable: false,
                            textAlignment: 'center' as const,
                            render: (user: User) => (
                                <div className="mx-auto flex w-max items-center gap-4">
                                    <Link href={`/users/preview/${user.id}`} className="hover:text-info">
                                        <IconEye />
                                    </Link>
                                    {isAdminUser && (
                                        <>
                                            <Link href={`/users/edit/${user.id}`} className="hover:text-primary">
                                                <IconEdit />
                                            </Link>
                                            <button type="button" className="hover:text-danger" onClick={() => confirmDelete(user)}>
                                                <IconTrashLines />
                                            </button>
                                        </>
                                    )}
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
                    selectedRecords={isAdminUser ? selectedRecords : []}
                    onSelectedRecordsChange={isAdminUser ? setSelectedRecords : () => {}}
                    minHeight={300}
                    paginationText={({ from, to, totalRecords }) => `${t('showing')} ${from} ${t('to')} ${to} ${t('of')} ${totalRecords} ${t('entries')}`}
                    noRecordsText={t('no_users_found')}
                    loadingText={t('loading')}
                />

                {loading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-white dark:bg-black-dark-light bg-opacity-60 backdrop-blur-sm" />}
            </div>

            {/* Alerts */}
            {alert.visible && (
                <div className="fixed top-4 right-4 z-50 min-w-80 max-w-md">
                    <Alert type={alert.type} title={alert.type === 'success' ? t('success') : t('error')} message={alert.message} onClose={() => setAlert({ ...alert, visible: false })} />
                </div>
            )}

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={showConfirmModal}
                title={t('confirm_delete')}
                message={t('confirm_delete_user_message')}
                onConfirm={handleDeleteConfirm}
                onCancel={() => {
                    setShowConfirmModal(false);
                    setUserToDelete(null);
                }}
                confirmLabel={t('delete')}
                cancelLabel={t('cancel')}
            />

            {/* Bulk Delete Modal */}
            <ConfirmModal
                isOpen={showBulkDeleteModal}
                title={t('confirm_bulk_delete')}
                message={`${t('confirm_bulk_delete_users_message')} (${selectedRecords.length})`}
                onConfirm={handleBulkDeleteConfirm}
                onCancel={() => setShowBulkDeleteModal(false)}
                confirmLabel={t('delete_all')}
                cancelLabel={t('cancel')}
            />
        </div>
    );
};

export default UsersList;
