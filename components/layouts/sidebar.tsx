'use client';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { toggleSidebar } from '@/store/themeConfigSlice';
import AnimateHeight from 'react-animate-height';
import { IRootState } from '@/store';
import { useState, useEffect } from 'react';
import supabase from '@/lib/supabase';
import IconCaretsDown from '@/components/icon/icon-carets-down';
import IconMenuDashboard from '@/components/icon/menu/icon-menu-dashboard';
import IconCaretDown from '@/components/icon/icon-caret-down';
import IconMinus from '@/components/icon/icon-minus';
import IconMenuChat from '@/components/icon/menu/icon-menu-chat';
import IconMenuMailbox from '@/components/icon/menu/icon-menu-mailbox';
import IconMenuTodo from '@/components/icon/menu/icon-menu-todo';
import IconMenuNotes from '@/components/icon/menu/icon-menu-notes';
import IconMenuScrumboard from '@/components/icon/menu/icon-menu-scrumboard';
import IconMenuContacts from '@/components/icon/menu/icon-menu-contacts';
import IconMenuInvoice from '@/components/icon/menu/icon-menu-invoice';
import IconMenuCalendar from '@/components/icon/menu/icon-menu-calendar';
import IconMenuComponents from '@/components/icon/menu/icon-menu-components';
import IconMenuElements from '@/components/icon/menu/icon-menu-elements';
import IconMenuCharts from '@/components/icon/menu/icon-menu-charts';
import IconMenuWidgets from '@/components/icon/menu/icon-menu-widgets';
import IconMenuFontIcons from '@/components/icon/menu/icon-menu-font-icons';
import IconMenuDragAndDrop from '@/components/icon/menu/icon-menu-drag-and-drop';
import IconMenuTables from '@/components/icon/menu/icon-menu-tables';
import IconMenuDatatables from '@/components/icon/menu/icon-menu-datatables';
import IconMenuForms from '@/components/icon/menu/icon-menu-forms';
import IconMenuUsers from '@/components/icon/menu/icon-menu-users';
import IconUser from '@/components/icon/icon-user';
import IconBox from '@/components/icon/icon-box';
import IconSettings from '@/components/icon/icon-settings';
import IconBuilding from '@/components/icon/icon-building';
import IconListCheck from '@/components/icon/icon-list-check';
import IconCar from '@/components/icon/icon-car';
import IconLock from '@/components/icon/icon-lock';
import IconStar from '@/components/icon/icon-star';
import IconHeart from '@/components/icon/icon-heart';
import IconOpenBook from '@/components/icon/icon-open-book';
import IconMapPin from '@/components/icon/icon-map-pin';

import { usePathname } from 'next/navigation';
import { getTranslation } from '@/i18n';

const Sidebar = () => {
    const dispatch = useDispatch();
    const { t } = getTranslation();
    const pathname = usePathname();
    const [currentMenu, setCurrentMenu] = useState<string>('');
    const [companyInfo, setCompanyInfo] = useState<{ name: string; logo_url?: string }>({
        name: '',
        logo_url: '/assets/images/logo-placeholder.png',
    });
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const semidark = useSelector((state: IRootState) => state.themeConfig.semidark);
    const toggleMenu = (value: string) => {
        setCurrentMenu((oldValue) => {
            return oldValue === value ? '' : value;
        });
    };

    // Fetch company information
    useEffect(() => {
        const fetchCompanyInfo = async () => {
            try {
                const { data, error } = await supabase.from('company_settings').select('name, logo_url').limit(1).single();

                if (data && !error) {
                    setCompanyInfo({
                        name: data.name || '',
                        logo_url: data.logo_url || '/assets/images/logo-placeholder.png',
                    });
                }
            } catch (error) {
                console.log('Using default company info');
                // Keep default values if company_settings table doesn't exist yet
            }
        };

        fetchCompanyInfo();
    }, []);

    useEffect(() => {
        const selector = document.querySelector('.sidebar ul a[href="' + window.location.pathname + '"]');
        if (selector) {
            selector.classList.add('active');
            const ul: any = selector.closest('ul.sub-menu');
            if (ul) {
                let ele: any = ul.closest('li.menu').querySelectorAll('.nav-link') || [];
                if (ele.length) {
                    ele = ele[0];
                    setTimeout(() => {
                        ele.click();
                    });
                }
            }
        }
    }, []);

    useEffect(() => {
        setActiveRoute();
        if (window.innerWidth < 1024 && themeConfig.sidebar) {
            dispatch(toggleSidebar());
        }
    }, [pathname]);

    const setActiveRoute = () => {
        let allLinks = document.querySelectorAll('.sidebar ul a.active');
        for (let i = 0; i < allLinks.length; i++) {
            const element = allLinks[i];
            element?.classList.remove('active');
        }
        const selector = document.querySelector('.sidebar ul a[href="' + window.location.pathname + '"]');
        selector?.classList.add('active');
    };

    return (
        <div className={semidark ? 'dark' : ''}>
            <nav
                className={`sidebar fixed bottom-0 top-0 z-50 h-full min-h-screen w-[260px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] transition-all duration-300 ${semidark ? 'text-white-dark' : ''}`}
            >
                <div className="h-full bg-white dark:bg-black">
                    <div className="flex items-center justify-between px-4 py-3">
                        <Link href="/" className="main-logo flex shrink-0 items-center">
                            <img className="ml-[5px] w-16 flex-none" src={companyInfo.logo_url} alt="logo" />
                            <span className="align-middle text-2xl font-semibold ltr:ml-1.5 rtl:mr-1.5 dark:text-white-light lg:inline">{companyInfo.name}</span>
                        </Link>

                        <button
                            type="button"
                            className="collapse-icon flex h-8 w-8 items-center rounded-full transition duration-300 hover:bg-gray-500/10 rtl:rotate-180 dark:text-white-light dark:hover:bg-dark-light/10"
                            onClick={() => dispatch(toggleSidebar())}
                        >
                            <IconCaretsDown className="m-auto rotate-90" />
                        </button>
                    </div>
                    <PerfectScrollbar className="relative h-[calc(100vh-80px)]">
                        <ul className="relative space-y-0.5 p-4 py-0 font-semibold">
                            <h2 className="-mx-4 mb-1 flex items-center bg-white-light/30 px-7 py-3 font-extrabold uppercase dark:bg-dark dark:bg-opacity-[0.08]">
                                <IconMinus className="hidden h-5 w-4 flex-none" />
                                <span>{t('main')}</span>
                            </h2>

                            <li className="nav-item">
                                <ul>
                                    <li className="nav-item">
                                        <Link href="/" className="group">
                                            <div className="flex items-center">
                                                <IconMenuDashboard className="shrink-0 group-hover:!text-primary" />
                                                <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">{t('home')}</span>
                                            </div>
                                        </Link>
                                    </li>
                                </ul>
                            </li>

                            <h2 className="-mx-4 mb-1 flex items-center bg-white-light/30 px-7 py-3 font-extrabold uppercase dark:bg-dark dark:bg-opacity-[0.08]">
                                <IconMinus className="hidden h-5 w-4 flex-none" />
                                <span>{t('management')}</span>
                            </h2>

                            <li className="nav-item">
                                <ul>
                                    <li className="nav-item">
                                        <Link href="/schools" className="group">
                                            <div className="flex items-center">
                                                <IconBuilding className="shrink-0 group-hover:!text-primary" />
                                                <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">{t('schools')}</span>
                                            </div>
                                        </Link>
                                    </li>

                                    <li className="nav-item">
                                        <Link href="/users" className="group">
                                            <div className="flex items-center">
                                                <IconMenuUsers className="shrink-0 group-hover:!text-primary" />
                                                <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">{t('users_list')}</span>
                                            </div>
                                        </Link>
                                    </li>
                                </ul>
                            </li>

                            <h2 className="-mx-4 mb-1 flex items-center bg-white-light/30 px-7 py-3 font-extrabold uppercase dark:bg-dark dark:bg-opacity-[0.08]">
                                <IconMinus className="hidden h-5 w-4 flex-none" />
                                <span>{t('travel_services')}</span>
                            </h2>

                            <li className="nav-item">
                                <ul>
                                    <li className="nav-item">
                                        <Link href="/paramedics" className="group">
                                            <div className="flex items-center">
                                                <IconHeart className="shrink-0 group-hover:!text-primary" />
                                                <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">{t('paramedics')}</span>
                                            </div>
                                        </Link>
                                    </li>

                                    <li className="nav-item">
                                        <Link href="/guides" className="group">
                                            <div className="flex items-center">
                                                <IconOpenBook className="shrink-0 group-hover:!text-primary" />
                                                <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">{t('guides')}</span>
                                            </div>
                                        </Link>
                                    </li>

                                    <li className="nav-item">
                                        <Link href="/security-companies" className="group">
                                            <div className="flex items-center">
                                                <IconLock className="shrink-0 group-hover:!text-primary" />
                                                <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">{t('security_companies')}</span>
                                            </div>
                                        </Link>
                                    </li>

                                    <li className="nav-item">
                                        <Link href="/external-entertainment-companies" className="group">
                                            <div className="flex items-center">
                                                <IconStar className="shrink-0 group-hover:!text-primary" />
                                                <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">{t('external_entertainment_companies')}</span>
                                            </div>
                                        </Link>
                                    </li>

                                    <li className="nav-item">
                                        <Link href="/travel-companies" className="group">
                                            <div className="flex items-center">
                                                <IconCar className="shrink-0 group-hover:!text-primary" />
                                                <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">{t('travel_companies')}</span>
                                            </div>
                                        </Link>
                                    </li>
                                </ul>
                            </li>

                            <h2 className="-mx-4 mb-1 flex items-center bg-white-light/30 px-7 py-3 font-extrabold uppercase dark:bg-dark dark:bg-opacity-[0.08]">
                                <IconMinus className="hidden h-5 w-4 flex-none" />
                                <span>{t('trip_planning')}</span>
                            </h2>

                            <li className="nav-item">
                                <ul>
                                    <li className="nav-item">
                                        <Link href="/zones" className="group">
                                            <div className="flex items-center">
                                                <IconMapPin className="shrink-0 group-hover:!text-primary" />
                                                <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">{t('zones')}</span>
                                            </div>
                                        </Link>
                                    </li>

                                    <li className="nav-item">
                                        <Link href="/destinations" className="group">
                                            <div className="flex items-center">
                                                <IconMapPin className="shrink-0 group-hover:!text-primary" />
                                                <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">{t('destinations')}</span>
                                            </div>
                                        </Link>
                                    </li>

                                    <li className="nav-item">
                                        <Link href="/trip-plans" className="group">
                                            <div className="flex items-center">
                                                <IconMapPin className="shrink-0 group-hover:!text-primary" />
                                                <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">{t('trip_plans')}</span>
                                            </div>
                                        </Link>
                                    </li>

                                    <li className="nav-item">
                                        <Link href="/bookings" className="group">
                                            <div className="flex items-center">
                                                <IconListCheck className="shrink-0 group-hover:!text-primary" />
                                                <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">{t('bookings')}</span>
                                            </div>
                                        </Link>
                                    </li>

                                    <li className="nav-item">
                                        <Link href="/bills" className="group">
                                            <div className="flex items-center">
                                                <IconMenuInvoice className="shrink-0 group-hover:!text-primary" />
                                                <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">{t('bills')}</span>
                                            </div>
                                        </Link>
                                    </li>
                                </ul>
                            </li>

                            {/* Hidden old menu items - will be converted later
                            <li className="nav-item" style={{ display: 'none' }}>
                                <Link href="/cars" className="group">
                                    <div className="flex items-center">
                                        <IconMenuWidgets className="shrink-0 group-hover:!text-primary" />
                                        <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">{t('cars')}</span>
                                    </div>
                                </Link>
                            </li>
                            <li className="nav-item" style={{ display: 'none' }}>
                                <Link href="/providers" className="group">
                                    <div className="flex items-center">
                                        <IconBox fill={true} className="shrink-0 group-hover:!text-primary" />
                                        <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">{t('providers')}</span>
                                    </div>
                                </Link>
                            </li>
                            <li className="nav-item" style={{ display: 'none' }}>
                                <Link href="/customers" className="group">
                                    <div className="flex items-center">
                                        <IconMenuUsers className="shrink-0 group-hover:!text-primary" />
                                        <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">{t('customers')}</span>
                                    </div>
                                </Link>
                            </li>
                            */}

                            {/* Hidden - User and Pages section
                         

                            <h2 className="-mx-4 mb-1 flex items-center bg-white-light/30 px-7 py-3 font-extrabold uppercase dark:bg-dark dark:bg-opacity-[0.08]" style={{ display: 'none' }}>
                                <IconMinus className="hidden h-5 w-4 flex-none" />
                                <span>{t('accounting')}</span>
                            </h2>

                            <li className="nav-item" style={{ display: 'none' }}>
                                <Link href="/deals" className="group">
                                    <div className="flex items-center">
                                        <IconMenuInvoice className="shrink-0 group-hover:!text-primary" />
                                        <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">{t('deals')}</span>
                                    </div>
                                </Link>
                            </li>

                            <li className="nav-item" style={{ display: 'none' }}>
                                <Link href="/bills" className="group">
                                    <div className="flex items-center">
                                        <IconMenuInvoice className="shrink-0 group-hover:!text-primary" />
                                        <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">{t('bills')}</span>
                                    </div>
                                </Link>
                            </li>

                            <li className="nav-item" style={{ display: 'none' }}>
                                <Link href="/logs" className="group">
                                    <div className="flex items-center">
                                        <IconListCheck className="shrink-0 group-hover:!text-primary" />
                                        <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">{t('logs')}</span>
                                    </div>
                                </Link>
                            </li>
                            */}

                            <h2 className="-mx-4 mb-1 flex items-center bg-white-light/30 px-7 py-3 font-extrabold uppercase dark:bg-dark dark:bg-opacity-[0.08]">
                                <IconMinus className="hidden h-5 w-4 flex-none" />
                                <span>{t('general_settings')}</span>
                            </h2>

                            <li className="nav-item">
                                <Link href="/company-settings" className="group">
                                    <div className="flex items-center">
                                        <IconBuilding className="shrink-0 group-hover:!text-primary" />
                                        <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">{t('company_settings')}</span>
                                    </div>
                                </Link>
                            </li>
                        </ul>
                    </PerfectScrollbar>
                </div>
            </nav>
        </div>
    );
};

export default Sidebar;
