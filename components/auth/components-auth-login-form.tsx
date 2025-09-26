'use client';
import IconLockDots from '@/components/icon/icon-lock-dots';
import IconMail from '@/components/icon/icon-mail';
import IconEye from '@/components/icon/icon-eye';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { signIn } from '@/lib/auth';
import Link from 'next/link';
import { getTranslation } from '@/i18n';

interface FormErrors {
    email?: string;
    password?: string;
    general?: string;
}

const ComponentsAuthLoginForm = () => {
    const { t } = getTranslation();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const validateForm = () => {
        const newErrors: FormErrors = {};

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            newErrors.email = t('email_required');
        } else if (!emailRegex.test(email)) {
            newErrors.email = t('email_invalid');
        }

        // Password validation
        if (!password) {
            newErrors.password = t('password_required');
        }

        return newErrors;
    };

    const submitForm = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setIsSubmitting(false);
            return;
        }

        try {
            const { error } = await signIn(email, password);
            if (error) {
                setErrors({ general: t('invalid_credentials') });
            } else {
                router.push('/');
            }
        } catch (error) {
            setErrors({ general: t('unexpected_error') });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className="space-y-5 dark:text-white" onSubmit={submitForm}>
            {errors.general && <div className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{errors.general}</div>}
            <div>
                <label htmlFor="Email">{t('email')}</label>
                <div className="relative text-white-dark">
                    <input
                        id="Email"
                        type="email"
                        placeholder={t('enter_email')}
                        className={`form-input rounded-3xl py-3 ps-10 placeholder:text-white-dark ${errors.email ? 'border-red-500' : ''}`}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <span className="absolute start-4 top-1/2 -translate-y-1/2">
                        <IconMail fill={true} />
                    </span>
                </div>
                {errors.email && <span className="text-red-500 text-sm mt-1">{errors.email}</span>}
            </div>
            <div>
                <label htmlFor="Password">{t('password')}</label>
                <div className="relative text-white-dark">
                    <input
                        id="Password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('enter_password')}
                        className={`form-input rounded-3xl py-3 ps-10 pe-12 placeholder:text-white-dark ${errors.password ? 'border-red-500' : ''}`}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <span className="absolute start-4 top-1/2 -translate-y-1/2">
                        <IconLockDots fill={true} />
                    </span>
                    <button type="button" className="absolute end-4 top-1/2 -translate-y-1/2 text-white-dark hover:text-primary transition-colors" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M2 2L22 22M6.71277 6.7226C3.66479 8.79527 2 12 2 12C2 12 5.63636 19 12 19C14.0503 19 15.8174 18.2734 17.2711 17.2711M11 5.05822C11.3254 5.02013 11.6588 5 12 5C18.3636 5 22 12 22 12C22 12 21.3082 13.3317 20 14.8335"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M14 14.2362C13.4692 14.7112 12.7684 15.0000 12 15.0000C10.3431 15.0000 9 13.6569 9 12.0000C9 11.1573 9.33193 10.3931 9.86932 9.8407"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        ) : (
                            <IconEye />
                        )}
                    </button>
                </div>
                {errors.password && <span className="text-red-500 text-sm mt-1">{errors.password}</span>}
            </div>
            <div className="flex justify-between">
                <label className="flex cursor-pointer items-center">
                    <input type="checkbox" className="form-checkbox bg-white dark:bg-black" />
                    <span className="text-white-dark">{t('remember_me')}</span>
                </label>
                <Link href="/reset-password" className="text-primary hover:underline">
                    {t('forgot_password')}
                </Link>
            </div>
            <button type="submit" className="btn btn-gradient rounded-3xl py-3 !mt-6 w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)]" disabled={isSubmitting}>
                {isSubmitting ? t('signing_in') : t('sign_in')}
            </button>
        </form>
    );
};

export default ComponentsAuthLoginForm;
