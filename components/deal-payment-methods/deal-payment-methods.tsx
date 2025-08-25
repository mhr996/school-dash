import React, { useState, useEffect } from 'react';
import { getTranslation } from '@/i18n';
import IconDollarSign from '@/components/icon/icon-dollar-sign';
import IconCreditCard from '@/components/icon/icon-credit-card';
import IconBank from '@/components/icon/icon-bank';
import IconCheck from '@/components/icon/icon-check';
import IconCalendar from '@/components/icon/icon-calendar';

export interface PaymentMethod {
    type: 'cash' | 'visa' | 'bank_transfer' | 'check';
    selected: boolean;
}

interface PaymentMethodsProps {
    value: PaymentMethod[];
    onChange: (payments: PaymentMethod[]) => void;
    notes?: string;
    onNotesChange?: (notes: string) => void;
    className?: string;
}

const DealPaymentMethods: React.FC<PaymentMethodsProps> = ({ value = [], onChange, notes = '', onNotesChange, className = '' }) => {
    const { t } = getTranslation();
    const [selectedMethods, setSelectedMethods] = useState<PaymentMethod[]>(value);
    const [paymentNotes, setPaymentNotes] = useState<string>(notes);

    useEffect(() => {
        setSelectedMethods(value);
    }, [value]);

    useEffect(() => {
        setPaymentNotes(notes);
    }, [notes]);

    const paymentTypes = [
        {
            type: 'cash' as const,
            label: t('cash') || 'نقداً',
            icon: IconDollarSign,
            color: 'text-emerald-600 dark:text-emerald-400',
            bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
            borderColor: 'border-emerald-200 dark:border-emerald-800',
            description: t('cash_payment_desc') || 'دفع نقدي',
        },
        {
            type: 'visa' as const,
            label: t('visa_card') || 'فيزا',
            icon: IconCreditCard,
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
            borderColor: 'border-blue-200 dark:border-blue-800',
            description: t('visa_payment_desc') || 'دفع بالبطاقة الائتمانية',
        },
        {
            type: 'check' as const,
            label: t('check') || 'شيك',
            icon: IconCheck,
            color: 'text-amber-600 dark:text-amber-400',
            bgColor: 'bg-amber-50 dark:bg-amber-900/20',
            borderColor: 'border-amber-200 dark:border-amber-800',
            description: t('check_payment_desc') || 'دفع بالشيك',
        },
        {
            type: 'bank_transfer' as const,
            label: t('bank_transfer') || 'تحويل بنكي',
            icon: IconBank,
            color: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-50 dark:bg-green-900/20',
            borderColor: 'border-green-200 dark:border-green-800',
            description: t('bank_transfer_desc') || 'تحويل بنكي مباشر',
        },
    ];

    const handleMethodToggle = (type: PaymentMethod['type']) => {
        const existingMethod = selectedMethods.find((method) => method.type === type);

        if (existingMethod) {
            // Toggle the selected state
            const newMethods = selectedMethods.map((method) => (method.type === type ? { ...method, selected: !method.selected } : method));
            setSelectedMethods(newMethods);
            onChange(newMethods);
        } else {
            // Add new method
            const newMethod: PaymentMethod = {
                type,
                selected: true,
            };
            const newMethods = [...selectedMethods, newMethod];
            setSelectedMethods(newMethods);
            onChange(newMethods);
        }
    };

    const handleNotesChange = (newNotes: string) => {
        setPaymentNotes(newNotes);
        if (onNotesChange) {
            onNotesChange(newNotes);
        }
    };

    const isMethodSelected = (type: PaymentMethod['type']) => {
        const method = selectedMethods.find((m) => m.type === type);
        return method?.selected || false;
    };

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <IconDollarSign className="w-6 h-6 text-primary" />
                <div>
                    <h5 className="text-lg font-bold text-gray-900 dark:text-white-light">{t('payment_methods') || 'آلية الدفع'}</h5>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{t('select_payment_methods_desc') || 'اختر طرق الدفع المناسبة'}</p>
                </div>
            </div>

            {/* Payment Methods Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentTypes.map((paymentType) => {
                    const isSelected = isMethodSelected(paymentType.type);
                    const IconComponent = paymentType.icon;

                    return (
                        <label
                            key={paymentType.type}
                            className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                                isSelected ? `${paymentType.borderColor} ${paymentType.bgColor}` : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                        >
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleMethodToggle(paymentType.type)}
                                className="form-checkbox h-5 w-5 text-primary rounded focus:ring-primary/20"
                            />
                            <div className={`p-2 rounded-full ${isSelected ? paymentType.bgColor : 'bg-gray-100 dark:bg-gray-800'}`}>
                                <IconComponent className={`w-5 h-5 ${isSelected ? paymentType.color : 'text-gray-500 dark:text-gray-400'}`} />
                            </div>

                            <div className="flex-1">
                                <span className={`font-medium ${isSelected ? paymentType.color : 'text-gray-700 dark:text-gray-300'}`}>{paymentType.label}</span>
                            </div>
                        </label>
                    );
                })}
            </div>

            {/* Notes Field */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('payment_notes') || 'ملاحظات الدفع'}</label>
                <textarea
                    value={paymentNotes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    placeholder={t('payment_notes_placeholder') || 'أدخل أي ملاحظات حول آلية الدفع...'}
                    className="form-textarea w-full h-24 resize-none"
                    rows={3}
                />
            </div>
        </div>
    );
};

export default DealPaymentMethods;
