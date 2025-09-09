'use client';
import React, { useState, useEffect, useRef } from 'react';
import IconCaretDown from '@/components/icon/icon-caret-down';
import IconCheck from '@/components/icon/icon-check';
import IconX from '@/components/icon/icon-x';

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
    icon?: React.ReactNode;
}

interface CustomSelectProps {
    id?: string;
    name?: string;
    value?: string;
    defaultValue?: string;
    placeholder?: string;
    options: SelectOption[];
    className?: string;
    disabled?: boolean;
    required?: boolean;
    clearable?: boolean;
    searchable?: boolean;
    multiple?: boolean;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'filled' | 'outlined';
    onChange?: (value: string | string[]) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    renderOption?: (option: SelectOption) => React.ReactNode;
    renderValue?: (option: SelectOption) => React.ReactNode;
    error?: boolean;
    helperText?: string;
    label?: string;
    loading?: boolean;
    noOptionsMessage?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
    id,
    name,
    value,
    defaultValue,
    placeholder = 'Select an option...',
    options = [],
    className = '',
    disabled = false,
    required = false,
    clearable = false,
    searchable = false,
    multiple = false,
    size = 'md',
    variant = 'default',
    onChange,
    onFocus,
    onBlur,
    renderOption,
    renderValue,
    error = false,
    helperText,
    label,
    loading = false,
    noOptionsMessage = 'No options available',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState<string | string[]>(multiple ? [] : '');
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredOptions, setFilteredOptions] = useState(options);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Size classes
    const sizeClasses = {
        sm: 'px-2 py-1 text-sm min-h-[32px]',
        md: 'px-3 py-2 text-sm min-h-[40px]',
        lg: 'px-4 py-3 text-base min-h-[48px]',
    };

    // Variant classes
    const variantClasses = {
        default: 'bg-white dark:bg-transparent border border-gray-300 dark:border-gray-600',
        filled: 'bg-gray-50 dark:bg-transparent border border-transparent',
        outlined: 'bg-transparent border-2 border-gray-300 dark:border-gray-600',
    };

    // Initialize selected value
    useEffect(() => {
        const initialValue = value !== undefined ? value : defaultValue || '';
        setSelectedValue(multiple ? (Array.isArray(initialValue) ? initialValue : []) : initialValue);
    }, [value, defaultValue, multiple]);

    // Filter options based on search term
    useEffect(() => {
        if (searchable && searchTerm) {
            const filtered = options.filter((option) => option.label.toLowerCase().includes(searchTerm.toLowerCase()) || option.value.toLowerCase().includes(searchTerm.toLowerCase()));
            setFilteredOptions(filtered);
        } else {
            setFilteredOptions(options);
        }
    }, [searchTerm, options, searchable]);

    // Handle click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
                onBlur?.();
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onBlur]);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchable && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen, searchable]);

    const handleOptionSelect = (optionValue: string) => {
        if (disabled) return;

        let newValue: string | string[];

        if (multiple) {
            const currentArray = Array.isArray(selectedValue) ? selectedValue : [];
            if (currentArray.includes(optionValue)) {
                newValue = currentArray.filter((v) => v !== optionValue);
            } else {
                newValue = [...currentArray, optionValue];
            }
        } else {
            newValue = optionValue;
            setIsOpen(false);
            setSearchTerm('');
        }

        setSelectedValue(newValue);
        onChange?.(newValue);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newValue = multiple ? [] : '';
        setSelectedValue(newValue);
        onChange?.(newValue);
    };

    const handleToggleDropdown = () => {
        if (disabled) return;
        setIsOpen(!isOpen);
        if (!isOpen) {
            onFocus?.();
        }
    };

    const getSelectedOptions = (): SelectOption[] => {
        if (multiple && Array.isArray(selectedValue)) {
            return options.filter((option) => selectedValue.includes(option.value));
        } else if (!multiple && selectedValue) {
            const option = options.find((option) => option.value === selectedValue);
            return option ? [option] : [];
        }
        return [];
    };

    const getDisplayValue = (): React.ReactNode => {
        const selectedOptions = getSelectedOptions();

        if (selectedOptions.length === 0) {
            return <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>;
        }

        if (multiple) {
            if (selectedOptions.length === 1) {
                const option = selectedOptions[0];
                return renderValue ? (
                    renderValue(option)
                ) : (
                    <div className="flex items-center gap-2">
                        {option.icon}
                        <span>{option.label}</span>
                    </div>
                );
            } else {
                return <span>{selectedOptions.length} selected</span>;
            }
        } else {
            const option = selectedOptions[0];
            return renderValue ? (
                renderValue(option)
            ) : (
                <div className="flex items-center gap-2">
                    {option.icon}
                    <span>{option.label}</span>
                </div>
            );
        }
    };

    const isSelected = (optionValue: string): boolean => {
        if (multiple && Array.isArray(selectedValue)) {
            return selectedValue.includes(optionValue);
        }
        return selectedValue === optionValue;
    };

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <div ref={wrapperRef} className="relative">
                <div
                    className={`
                        ${sizeClasses[size]}
                        ${variantClasses[variant]}
                        ${error ? 'border-red-500 dark:border-red-500' : ''}
                        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        ${className}
                        rounded-lg transition-all duration-200
                        focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary
                        hover:border-gray-400 dark:hover:border-gray-500
                        flex items-center justify-between gap-2
                        text-gray-900 dark:text-gray-100
                    `}
                    onClick={handleToggleDropdown}
                >
                    <div className="flex-1 truncate">{getDisplayValue()}</div>

                    <div className="flex items-center gap-1">
                        {clearable && getSelectedOptions().length > 0 && !disabled && (
                            <button type="button" onClick={handleClear} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors">
                                <IconX className="w-3 h-3 text-gray-500" />
                            </button>
                        )}

                        <IconCaretDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                </div>

                {/* Dropdown */}
                {isOpen && (
                    <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg max-h-60 overflow-hidden">
                        {/* Search Input */}
                        {searchable && (
                            <div className="p-2 border-b border-gray-200 dark:border-gray-600">
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                        )}

                        {/* Options List */}
                        <div className="overflow-y-auto max-h-48">
                            {loading ? (
                                <div className="px-3 py-2 text-center text-gray-500 dark:text-gray-400">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
                                </div>
                            ) : filteredOptions.length === 0 ? (
                                <div className="px-3 py-2 text-center text-gray-500 dark:text-gray-400">{noOptionsMessage}</div>
                            ) : (
                                filteredOptions.map((option) => (
                                    <div
                                        key={option.value}
                                        className={`
                                            px-3 py-2 cursor-pointer transition-colors flex items-center justify-between
                                            ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                                            ${isSelected(option.value) ? 'bg-primary/10 text-primary' : 'text-gray-900 dark:text-gray-100'}
                                        `}
                                        onClick={() => !option.disabled && handleOptionSelect(option.value)}
                                    >
                                        <div className="flex items-center gap-2 flex-1">
                                            {renderOption ? (
                                                renderOption(option)
                                            ) : (
                                                <>
                                                    {option.icon}
                                                    <span>{option.label}</span>
                                                </>
                                            )}
                                        </div>

                                        {isSelected(option.value) && <IconCheck className="w-4 h-4 text-primary" />}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Helper Text */}
            {helperText && <p className={`mt-1 text-xs ${error ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>{helperText}</p>}
        </div>
    );
};

export default CustomSelect;
