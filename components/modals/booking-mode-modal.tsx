'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import IconX from '@/components/icon/icon-x';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconShekelSign from '@/components/icon/icon-shekel-sign';
import IconUser from '@/components/icon/icon-user';
import IconUsers from '@/components/icon/icon-users';
import IconHeart from '@/components/icon/icon-heart';
import IconSquareRotated from '@/components/icon/icon-square-rotated';
import IconPlayCircle from '@/components/icon/icon-play-circle';
import IconBook from '@/components/icon/icon-book';
import IconCar from '@/components/icon/icon-car';

interface BookingModeModalProps {
    isOpen: boolean;
    onClose: () => void;
    destinationName: string;
    basePrice: { student?: number; crew?: number } | null;
    requirements: string[];
    onSelectMode: (mode: 'destination_only' | 'with_services') => void;
    t: (key: string) => string;
}

const requirementIcons: Record<string, any> = {
    guides: IconUser,
    paramedics: IconHeart,
    security: IconSquareRotated,
    entertainment: IconPlayCircle,
    education: IconBook,
    transportation: IconCar,
};

export default function BookingModeModal({ isOpen, onClose, destinationName, basePrice, requirements, onSelectMode, t }: BookingModeModalProps) {
    const handleModeSelect = (mode: 'destination_only' | 'with_services') => {
        onSelectMode(mode);
        onClose();
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-xl transition-all">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                                            <IconMapPin className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">{t('select_booking_mode')}</Dialog.Title>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{destinationName}</p>
                                        </div>
                                    </div>
                                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                        <IconX className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Base Price Info */}
                                {basePrice && (
                                    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <div className="flex items-center gap-2 mb-2">
                                            <IconShekelSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            <span className="font-semibold text-blue-900 dark:text-blue-100">{t('base_pricing')}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            {basePrice.student !== undefined && (
                                                <div className="flex items-center gap-2">
                                                    <IconUser className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                                    <span className="text-gray-700 dark:text-gray-300">
                                                        {t('per_student')}: ₪{basePrice.student}
                                                    </span>
                                                </div>
                                            )}
                                            {basePrice.crew !== undefined && (
                                                <div className="flex items-center gap-2">
                                                    <IconUsers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                                    <span className="text-gray-700 dark:text-gray-300">
                                                        {t('per_crew')}: ₪{basePrice.crew}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Booking Mode Options */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    {/* Basic Access */}
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleModeSelect('destination_only')}
                                        className="relative overflow-hidden rounded-xl border-2 border-gray-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300 p-6 text-left group bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-700"
                                    >
                                        <div className="relative z-10">
                                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                <IconMapPin className="w-6 h-6 text-white" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('basic_access')}</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{t('basic_access_description')}</p>
                                            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
                                                <IconShekelSign className="w-4 h-4" />
                                                <span>{t('base_price_only')}</span>
                                            </div>
                                        </div>
                                    </motion.button>

                                    {/* With Services */}
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleModeSelect('with_services')}
                                        className="relative overflow-hidden rounded-xl border-2 border-gray-200 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 transition-all duration-300 p-6 text-left group bg-gradient-to-br from-purple-50 to-purple-100 dark:from-slate-800 dark:to-slate-700"
                                    >
                                        <div className="relative z-10">
                                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                <IconUsers className="w-6 h-6 text-white" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('with_services')}</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{t('with_services_description')}</p>

                                            {/* Required Services */}
                                            {requirements.length > 0 && (
                                                <div className="space-y-2">
                                                    <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase">{t('required_services')}:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {requirements.map((req) => {
                                                            const Icon = requirementIcons[req] || IconUser;
                                                            return (
                                                                <div
                                                                    key={req}
                                                                    className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-600 rounded-md text-xs font-medium text-gray-700 dark:text-gray-200"
                                                                >
                                                                    <Icon className="w-3 h-3" />
                                                                    <span>{t(req)}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.button>
                                </div>

                                {/* Footer Note */}
                                <div className="mt-6 p-4 bg-gray-50 dark:bg-slate-900/50 rounded-lg">
                                    <p className="text-xs text-gray-600 dark:text-gray-400 text-center">💡 {t('booking_mode_note')}</p>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
