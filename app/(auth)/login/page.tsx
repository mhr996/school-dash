'use client';
import ComponentsAuthLoginForm from '@/components/auth/components-auth-login-form';
import IconFacebookCircle from '@/components/icon/icon-facebook-circle';
import IconGoogle from '@/components/icon/icon-google';
import IconInstagram from '@/components/icon/icon-instagram';
import IconTwitter from '@/components/icon/icon-twitter';
import LanguageDropdown from '@/components/language-dropdown';
import { getTranslation } from '@/i18n';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const CoverLogin = () => {
    const { t } = getTranslation();
    const searchParams = useSearchParams();
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        if (searchParams) {
            const message = searchParams.get('message');
            if (message === 'account_created_successfully') {
                setSuccessMessage(t('account_created_successfully'));
                // Clear the message after 10 seconds
                setTimeout(() => setSuccessMessage(null), 10000);
            }
        }
    }, [searchParams]);
    return (
        <div>
            <div className="absolute inset-0">
                <img src="/assets/images/auth/bg-gradient.png" alt="image" className="h-full w-full object-cover" />
            </div>
            <div className="relative flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat px-6 py-10 dark:bg-[#060818] sm:px-16">
                <div className="relative flex w-full max-w-[1500px] max-h-[650px] flex-col justify-between overflow-hidden rounded-3xl bg-white/60 backdrop-blur-lg dark:bg-black/50 lg:min-h-[758px] lg:flex-row lg:gap-10 xl:gap-0">
                    <div className="relative overflow-hidden hidden w-full items-center justify-center bg-[linear-gradient(225deg,#03113b_0%,rgba(67,97,238,1)_100%)] p-5 lg:inline-flex lg:max-w-[835px] xl:-ms-28 ltr:xl:skew-x-[14deg] rtl:xl:skew-x-[-14deg]">
                        <div className="absolute inset-y-0 w-8 from-primary/10 via-transparent to-transparent ltr:-right-10 ltr:bg-gradient-to-r rtl:-left-10 rtl:bg-gradient-to-l xl:w-16 ltr:xl:-right-20 rtl:xl:-left-20"></div>
                        <div className="ltr:xl:-skew-x-[14deg] rtl:xl:skew-x-[14deg]">
                            <div className=" hidden lg:block rtl:ml-[-160px] ltr:mr-[-120px]">
                                <img src="/assets/images/login-img.webp" alt="Cover Image" className="mt-[-305px]" />
                            </div>
                        </div>
                    </div>
                    <div className="relative flex w-full flex-col items-center justify-center gap-6 px-4 pb-16 pt-6 sm:px-6 lg:max-w-[667px]">
                        <div className="flex w-full max-w-[440px] items-center gap-2 lg:absolute lg:end-6 lg:top-6 lg:max-w-full">
                            <Link href="/" className="block w-8 lg:hidden">
                                <img src="/assets/images/logo.png" alt="Logo" className="mx-auto w-28 max-w-none" />
                            </Link>
                            <LanguageDropdown className="ms-auto w-max" />
                        </div>
                        <div className="w-full max-w-[440px] lg:mt-16">
                            <div className="mb-10">
                                <h1 className="text-3xl font-extrabold uppercase !leading-snug text-primary md:text-4xl">{t('sign_in')}</h1>
                                <p className="text-base font-bold leading-normal text-white-dark">{t('enter_email_password_login')}</p>
                            </div>

                            {/* Success Message */}
                            {successMessage && (
                                <div className="mb-6 text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 p-4 rounded-md border border-green-300 dark:border-green-600">
                                    <div className="flex items-center">
                                        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        {successMessage}
                                    </div>
                                </div>
                            )}

                            <ComponentsAuthLoginForm />
                            {/* <div className="relative my-7 text-center md:mb-9">
                                <span className="absolute inset-x-0 top-1/2 h-px w-full -translate-y-1/2 bg-white-light dark:bg-white-dark"></span>
                                <span className="relative bg-white px-2 font-bold uppercase text-white-dark dark:bg-dark dark:text-white-light">or</span>
                            </div>
                            <div className="mb-10 md:mb-[60px]">
                                <ul className="flex justify-center gap-3.5 text-white">
                                    <li>
                                        <Link
                                            href="#"
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full p-0 transition hover:scale-110"
                                            style={{ background: 'linear-gradient(135deg, rgba(239, 18, 98, 1) 0%, rgba(67, 97, 238, 1) 100%)' }}
                                        >
                                            <IconInstagram />
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="#"
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full p-0 transition hover:scale-110"
                                            style={{ background: 'linear-gradient(135deg, rgba(239, 18, 98, 1) 0%, rgba(67, 97, 238, 1) 100%)' }}
                                        >
                                            <IconFacebookCircle />
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="#"
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full p-0 transition hover:scale-110"
                                            style={{ background: 'linear-gradient(135deg, rgba(239, 18, 98, 1) 0%, rgba(67, 97, 238, 1) 100%)' }}
                                        >
                                            <IconTwitter fill={true} />
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="#"
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full p-0 transition hover:scale-110"
                                            style={{ background: 'linear-gradient(135deg, rgba(239, 18, 98, 1) 0%, rgba(67, 97, 238, 1) 100%)' }}
                                        >
                                            <IconGoogle />
                                        </Link>
                                    </li>
                                </ul>
                            </div> */}
                            <div className="text-center dark:text-white mt-4 flex items-center justify-center gap-2">
                                {t('dont_have_account')}&nbsp;
                                <Link href="/signup" className="uppercase text-primary underline transition hover:text-black dark:hover:text-white">
                                    {t('create_account')}
                                </Link>
                            </div>
                        </div>
                        <p className="absolute bottom-6 w-full text-center dark:text-white">
                            {t('copyright_text')} © {new Date().getFullYear()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoverLogin;
