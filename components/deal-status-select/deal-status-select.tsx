import React, { useState, useEffect, useRef } from 'react';
import IconCaretDown from '@/components/icon/icon-caret-down';
import IconClock from '@/components/icon/icon-clock';
import IconPlayCircle from '@/components/icon/icon-play-circle';
import IconCircleCheck from '@/components/icon/icon-circle-check';
import IconXCircle from '@/components/icon/icon-x-circle';
import { getTranslation } from '@/i18n';

interface DealStatusSelectProps {
    id?: string;
    name?: string;
    defaultValue?: string;
    className?: string;
    onChange?: (status: string) => void;
}

const DealStatusSelect = ({ defaultValue = '', className = 'form-select text-white-dark', onChange, name = 'status', id }: DealStatusSelectProps) => {
    const { t } = getTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState(defaultValue);
    const wrapperRef = useRef<HTMLDivElement>(null); // Update selectedStatus when defaultValue changes
    useEffect(() => {
        setSelectedStatus(defaultValue);
    }, [defaultValue]);

    const statuses = [
        {
            value: 'pending',
            label: t('deal_status_pending'),
            icon: IconClock,
            color: 'text-amber-600 dark:text-amber-400',
            bgColor: 'bg-amber-50 dark:bg-amber-900/20',
            borderColor: 'border-amber-200 dark:border-amber-800',
        },
        {
            value: 'active',
            label: t('deal_status_active'),
            icon: IconPlayCircle,
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
            borderColor: 'border-blue-200 dark:border-blue-800',
        },
        {
            value: 'completed',
            label: t('deal_status_completed'),
            icon: IconCircleCheck,
            color: 'text-emerald-600 dark:text-emerald-400',
            bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
            borderColor: 'border-emerald-200 dark:border-emerald-800',
        },
        {
            value: 'cancelled',
            label: t('deal_status_cancelled'),
            icon: IconXCircle,
            color: 'text-red-600 dark:text-red-400',
            bgColor: 'bg-red-50 dark:bg-red-900/20',
            borderColor: 'border-red-200 dark:border-red-800',
        },
    ];

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleStatusSelect = (status: string) => {
        setSelectedStatus(status);
        setIsOpen(false);
        if (onChange) {
            onChange(status);
        }
    };

    const getSelectedLabel = () => {
        const selected = statuses.find((status) => status.value === selectedStatus);
        if (selected) {
            const IconComponent = selected.icon;
            return (
                <div className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${selected.bgColor} ${selected.borderColor} border`}>
                    <IconComponent className={`w-5 h-5 ${selected.color}`} />
                    <span className={`font-medium ${selected.color}`}>{selected.label}</span>
                </div>
            );
        }
        return (
            <div className="flex items-center gap-3 px-3 py-2 text-gray-500 dark:text-gray-400">
                <span>{t('select_deal_status')}</span>
            </div>
        );
    };

    return (
        <div ref={wrapperRef} className="relative">
            <div
                className={`${className} cursor-pointer rounded-lg border border-gray-300 dark:border-[#191e3a] bg-white dark:bg-black hover:border-primary dark:hover:border-primary transition-all duration-200 min-h-[50px] flex items-center justify-between px-4`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {getSelectedLabel()}
                <IconCaretDown className={`w-4 h-4 transition-transform duration-200 text-gray-500 dark:text-gray-400 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            {isOpen && (
                <div className="absolute z-50 mt-2 w-full rounded-lg border border-gray-200 dark:border-[#191e3a] bg-white dark:bg-black shadow-lg shadow-black/10 dark:shadow-black/50">
                    <div className="max-h-60 overflow-y-auto p-2">
                        {statuses.map((status) => {
                            const IconComponent = status.icon;
                            return (
                                <div
                                    key={status.value}
                                    className={`cursor-pointer rounded-lg p-3 mb-1 last:mb-0 hover:bg-gray-50 dark:hover:bg-[#1a2238] transition-all duration-200 ${
                                        selectedStatus === status.value ? `${status.bgColor} ${status.borderColor} border` : 'border border-transparent'
                                    }`}
                                    onClick={() => handleStatusSelect(status.value)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${status.bgColor}`}>
                                            <IconComponent className={`w-4 h-4 ${status.color}`} />
                                        </div>
                                        <div>
                                            <div className={`font-medium text-gray-900 dark:text-white ${selectedStatus === status.value ? status.color : ''}`}>{status.label}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DealStatusSelect;
