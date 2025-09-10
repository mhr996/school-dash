import ComponentsAuthSignupForm from '@/components/auth/components-auth-signup-form';
import LanguageDropdown from '@/components/language-dropdown';
import { getTranslation } from '@/i18n';
import { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';

export const metadata: Metadata = {
    title: 'Sign Up - School Dashboard',
};

const SignupPage = () => {
    const { t } = getTranslation();
    return (
        <div>
            <div className="absolute inset-0">
                <img src="/assets/images/auth/bg-gradient.png" alt="image" className="h-full w-full object-cover" />
            </div>
            <div className="relative flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat px-6 py-10 dark:bg-[#060818] sm:px-16">
                <div className="relative w-full max-w-[700px] flex-col justify-center overflow-hidden rounded-3xl bg-white/60 backdrop-blur-lg dark:bg-black/50 p-8">
                    <div className="flex w-full items-center gap-2 justify-between mb-8">
                        <Link href="/" className="block w-8">
                            <img src="/assets/images/logo.png" alt="Logo" className="w-28 max-w-none" />
                        </Link>
                        <LanguageDropdown className="w-max" />
                    </div>
                    <div className="w-full">
                        <div className="mb-10">
                            <h1 className="text-3xl font-extrabold uppercase !leading-snug text-primary md:text-4xl">{t('sign_up')}</h1>
                            <p className="text-base font-bold leading-normal text-white-dark">{t('create_your_account')}</p>
                        </div>
                        <ComponentsAuthSignupForm />
                        <div className="text-center dark:text-white mt-6 flex items-center justify-center gap-2">
                            <span>{t('already_have_account')}</span>
                            <Link href="/login" className="ml-2 uppercase text-primary underline transition hover:text-black dark:hover:text-white">
                                {t('sign_in')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
