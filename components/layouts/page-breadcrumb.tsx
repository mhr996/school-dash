'use client';
import Link from 'next/link';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import { getTranslation } from '@/i18n';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface PageBreadcrumbProps {
    /**
     * The main section/module this page belongs to (e.g., 'schools', 'users', 'destinations')
     */
    section: string;
    /**
     * The back link URL (usually to the main listing page)
     */
    backUrl: string;
    /**
     * Array of breadcrumb items from home to current page
     */
    items: BreadcrumbItem[];
    /**
     * Additional CSS classes for the container
     */
    className?: string;
}

const PageBreadcrumb = ({ section, backUrl, items, className = '' }: PageBreadcrumbProps) => {
    const { t } = getTranslation();

    return (
        <div className={`flex items-center gap-5 mb-6 ${className}`}>
            <Link href={backUrl} className="text-primary hover:text-primary/80">
                <IconArrowLeft className="h-7 w-7 ltr:rotate-180" />
            </Link>

            {/* Breadcrumb Navigation */}
            <ul className="flex space-x-2 rtl:space-x-reverse">
                {items.map((item, index) => (
                    <li key={index} className={index > 0 ? "before:content-['/'] ltr:before:mr-2 rtl:before:ml-2" : ''}>
                        {item.href ? (
                            <Link href={item.href} className="text-primary hover:underline">
                                {item.label}
                            </Link>
                        ) : (
                            <span>{item.label}</span>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default PageBreadcrumb;
