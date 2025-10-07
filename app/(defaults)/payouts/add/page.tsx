'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import supabase from '@/lib/supabase';
import { getCurrentUserWithRole } from '@/lib/auth';
import { getAllServiceProvidersWithBalance, ServiceType, ServiceProviderBalance, calculateServiceProviderBalance } from '@/utils/service-balance-manager';
import CustomSelect from '@/components/elements/custom-select';
import IconDollarSign from '@/components/icon/icon-dollar-sign';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconCreditCard from '@/components/icon/icon-credit-card';
import IconCheck from '@/components/icon/icon-check';
import IconUser from '@/components/icon/icon-user';
import IconBuilding from '@/components/icon/icon-building';
import { getTranslation } from '@/i18n';

const SERVICE_TYPES: ServiceType[] = ['guides', 'paramedics', 'security_companies', 'external_entertainment_companies', 'travel_companies'];

const PAYMENT_METHODS = ['cash', 'bank_transfer', 'credit_card', 'check'];

export default function CreatePayoutPage() {
    const router = useRouter();
    const { t } = getTranslation();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Service Type, 2: Provider Selection, 3: Payment Details

    // Step 1: Service Type Selection
    const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null);

    // Step 2: Provider Selection
    const [providers, setProviders] = useState<ServiceProviderBalance[]>([]);
    const [loadingProviders, setLoadingProviders] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<ServiceProviderBalance | null>(null);

    // Step 3: Payment Details
    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        payment_method: 'bank_transfer',
        payment_date: new Date().toISOString().split('T')[0],
        reference_number: '',
        description: '',
        notes: '',
        // Bank Transfer Fields
        account_number: '',
        account_holder_name: '',
        bank_name: '',
        transaction_number: '',
        // Check Fields
        check_number: '',
        check_bank_name: '',
    });

    useEffect(() => {
        const loadUser = async () => {
            try {
                const { user: userData, error } = await getCurrentUserWithRole();
                if (userData && !error) {
                    setUser(userData);
                }
            } catch (error) {
                console.error('Error loading user:', error);
            }
        };
        loadUser();
    }, []);

    const handleServiceTypeSelect = async (serviceType: ServiceType) => {
        setSelectedServiceType(serviceType);
        setLoadingProviders(true);

        try {
            const providersData = await getAllServiceProvidersWithBalance(serviceType);
            setProviders(providersData);
            setStep(2);
        } catch (error) {
            console.error('Error loading providers:', error);
        } finally {
            setLoadingProviders(false);
        }
    };

    const handleProviderSelect = (provider: ServiceProviderBalance) => {
        setSelectedProvider(provider);
        // Set amount to net balance by default
        setPaymentForm((prev) => ({
            ...prev,
            amount: provider.netBalance > 0 ? provider.netBalance.toString() : '',
        }));
        setStep(3);
    };

    const handlePayFullBalance = () => {
        if (selectedProvider && selectedProvider.netBalance > 0) {
            setPaymentForm((prev) => ({
                ...prev,
                amount: selectedProvider.netBalance.toString(),
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedProvider || !selectedServiceType || !user) {
            return;
        }

        const amount = parseFloat(paymentForm.amount);
        if (isNaN(amount) || amount <= 0) {
            alert(t('amount_must_be_greater_than_zero'));
            return;
        }

        setLoading(true);

        try {
            const payoutData = {
                service_type: selectedServiceType,
                service_id: selectedProvider.serviceId,
                user_id: selectedProvider.userId,
                service_provider_name: selectedProvider.providerName,
                amount,
                payment_method: paymentForm.payment_method,
                payment_date: paymentForm.payment_date,
                reference_number: paymentForm.reference_number || null,
                description: paymentForm.description || null,
                notes: paymentForm.notes || null,
                account_number: paymentForm.payment_method === 'bank_transfer' ? paymentForm.account_number : null,
                account_holder_name: paymentForm.payment_method === 'bank_transfer' ? paymentForm.account_holder_name : null,
                bank_name: paymentForm.payment_method === 'bank_transfer' ? paymentForm.bank_name : null,
                transaction_number: paymentForm.payment_method === 'bank_transfer' ? paymentForm.transaction_number : null,
                check_number: paymentForm.payment_method === 'check' ? paymentForm.check_number : null,
                check_bank_name: paymentForm.payment_method === 'check' ? paymentForm.check_bank_name : null,
                created_by: user.id,
            };

            const { error } = await supabase.from('payouts').insert([payoutData]);

            if (error) {
                console.error('Error creating payout:', error);
                alert(t('error_creating_payout'));
            } else {
                alert(t('payout_created_successfully'));
                router.push('/payouts');
            }
        } catch (error) {
            console.error('Error creating payout:', error);
            alert(t('error_creating_payout'));
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('he-IL', {
            style: 'currency',
            currency: 'ILS',
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50 dark:from-slate-900 dark:via-purple-950 dark:to-slate-900 p-6">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 p-8 shadow-2xl"
                >
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="relative z-10">
                        <button onClick={() => router.back()} className="flex items-center gap-2 text-white/90 hover:text-white mb-4 transition-colors">
                            <IconArrowLeft className="w-5 h-5" />
                            <span>{t('back')}</span>
                        </button>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/30">
                                <IconDollarSign className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-4xl font-bold text-white drop-shadow-lg">{t('create_payout')}</h1>
                        </div>
                        <p className="text-white/90 text-lg drop-shadow-md">{t('payouts_description')}</p>
                    </div>
                </motion.div>

                {/* Progress Steps */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex items-center justify-center gap-4">
                    {[1, 2, 3].map((stepNum) => (
                        <div key={stepNum} className="flex items-center gap-4">
                            <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${step >= stepNum ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}
                            >
                                {step > stepNum ? <IconCheck className="w-6 h-6" /> : stepNum}
                            </div>
                            {stepNum < 3 && <div className={`w-16 h-1 rounded ${step > stepNum ? 'bg-gradient-to-r from-purple-600 to-violet-600' : 'bg-gray-200 dark:bg-gray-700'}`}></div>}
                        </div>
                    ))}
                </motion.div>

                {/* Step 1: Service Type Selection */}
                {step === 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-8 border border-purple-200/50 dark:border-purple-500/30 shadow-xl"
                    >
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('select_service_type')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {SERVICE_TYPES.map((serviceType) => (
                                <button
                                    key={serviceType}
                                    onClick={() => handleServiceTypeSelect(serviceType)}
                                    disabled={loadingProviders}
                                    className="group relative p-6 bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-900/20 rounded-2xl border-2 border-purple-200/50 dark:border-purple-500/30 hover:border-purple-500 hover:shadow-2xl transition-all duration-300 hover:scale-105"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                            <IconBuilding className="w-7 h-7 text-white" />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t(serviceType)}</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{t('select_type')}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Step 2: Provider Selection */}
                {step === 2 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-8 border border-purple-200/50 dark:border-purple-500/30 shadow-xl"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('select_provider')}</h2>
                            <button onClick={() => setStep(1)} className="text-purple-600 hover:text-purple-700 font-semibold">
                                {t('change')}
                            </button>
                        </div>

                        {loadingProviders ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-purple-600"></div>
                            </div>
                        ) : providers.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-600 dark:text-gray-400">{t('no_providers_found')}</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[500px] overflow-y-auto">
                                {providers.map((provider) => (
                                    <button
                                        key={provider.serviceId}
                                        onClick={() => handleProviderSelect(provider)}
                                        className="w-full group relative p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border-2 border-gray-200/50 dark:border-gray-700/50 hover:border-purple-500 hover:shadow-xl transition-all duration-300"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center shadow-lg">
                                                    <IconUser className="w-6 h-6 text-white" />
                                                </div>
                                                <div className="text-left">
                                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{provider.providerName}</h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {provider.email} | {provider.phone}
                                                    </p>
                                                    <div className="flex items-center gap-4 mt-2 text-sm">
                                                        <span className="text-gray-600 dark:text-gray-400">
                                                            {provider.bookingCount} {t('bookings')}
                                                        </span>
                                                        <span className="text-gray-600 dark:text-gray-400">
                                                            {provider.payoutCount} {t('payouts')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('balance')}</p>
                                                <p className={`text-2xl font-bold ${provider.netBalance > 0 ? 'text-red-600' : provider.netBalance < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                                                    {formatCurrency(provider.netBalance)}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {t('earned')}: {formatCurrency(provider.totalEarned)}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {t('paid_out')}: {formatCurrency(provider.totalPaidOut)}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Step 3: Payment Details */}
                {step === 3 && selectedProvider && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Provider Summary */}
                            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-blue-200/50 dark:border-blue-500/30 shadow-xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('paying_to')}</p>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedProvider.providerName}</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            {t(selectedServiceType!)} | {selectedProvider.email}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('current_balance')}</p>
                                        <p className="text-3xl font-bold text-red-600">{formatCurrency(selectedProvider.netBalance)}</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setStep(2)} className="mt-4 text-purple-600 hover:text-purple-700 font-semibold text-sm">
                                    {t('change_provider')}
                                </button>
                            </div>

                            {/* Payment Form */}
                            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-8 border border-purple-200/50 dark:border-purple-500/30 shadow-xl">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('payment_details')}</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Amount */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            {t('amount')} <span className="text-red-500">*</span>
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={paymentForm.amount}
                                                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                                required
                                                className="flex-1 px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                                                placeholder="0.00"
                                            />
                                            <button
                                                type="button"
                                                onClick={handlePayFullBalance}
                                                className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl font-semibold transition-all duration-200 hover:scale-105 shadow-lg whitespace-nowrap"
                                            >
                                                {t('pay_full_balance')}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Payment Method */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            {t('payment_method')} <span className="text-red-500">*</span>
                                        </label>
                                        <CustomSelect
                                            value={paymentForm.payment_method}
                                            onChange={(val) => setPaymentForm({ ...paymentForm, payment_method: val as string })}
                                            required
                                            options={PAYMENT_METHODS.map((method) => ({
                                                value: method,
                                                label: t(method),
                                            }))}
                                        />
                                    </div>

                                    {/* Payment Date */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            {t('payment_date')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={paymentForm.payment_date}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                                            required
                                            className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                                        />
                                    </div>

                                    {/* Reference Number */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('reference_number')}</label>
                                        <input
                                            type="text"
                                            value={paymentForm.reference_number}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
                                            className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                                            placeholder={t('reference_number_placeholder')}
                                        />
                                    </div>

                                    {/* Bank Transfer Fields */}
                                    {paymentForm.payment_method === 'bank_transfer' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('bank_name')}</label>
                                                <input
                                                    type="text"
                                                    value={paymentForm.bank_name}
                                                    onChange={(e) => setPaymentForm({ ...paymentForm, bank_name: e.target.value })}
                                                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('account_number')}</label>
                                                <input
                                                    type="text"
                                                    value={paymentForm.account_number}
                                                    onChange={(e) => setPaymentForm({ ...paymentForm, account_number: e.target.value })}
                                                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('account_holder_name')}</label>
                                                <input
                                                    type="text"
                                                    value={paymentForm.account_holder_name}
                                                    onChange={(e) => setPaymentForm({ ...paymentForm, account_holder_name: e.target.value })}
                                                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('transaction_number')}</label>
                                                <input
                                                    type="text"
                                                    value={paymentForm.transaction_number}
                                                    onChange={(e) => setPaymentForm({ ...paymentForm, transaction_number: e.target.value })}
                                                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* Check Fields */}
                                    {paymentForm.payment_method === 'check' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('check_number')}</label>
                                                <input
                                                    type="text"
                                                    value={paymentForm.check_number}
                                                    onChange={(e) => setPaymentForm({ ...paymentForm, check_number: e.target.value })}
                                                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('check_bank_name')}</label>
                                                <input
                                                    type="text"
                                                    value={paymentForm.check_bank_name}
                                                    onChange={(e) => setPaymentForm({ ...paymentForm, check_bank_name: e.target.value })}
                                                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* Description */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('description')}</label>
                                        <input
                                            type="text"
                                            value={paymentForm.description}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                                            className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                                            placeholder={t('description_placeholder')}
                                        />
                                    </div>

                                    {/* Notes */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('notes')}</label>
                                        <textarea
                                            value={paymentForm.notes}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                                            rows={3}
                                            className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white resize-none"
                                            placeholder={t('notes_placeholder')}
                                        />
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="flex gap-4 mt-8">
                                    <button
                                        type="button"
                                        onClick={() => router.back()}
                                        className="flex-1 px-6 py-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-semibold transition-all duration-200"
                                    >
                                        {t('cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-xl font-semibold transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                {t('processing')}
                                            </>
                                        ) : (
                                            <>
                                                <IconCreditCard className="w-5 h-5" />
                                                {t('create_payout')}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
