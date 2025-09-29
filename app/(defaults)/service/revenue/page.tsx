import { Metadata } from 'next';
import RevenuePage from '@/components/revenue/revenue-page';

export const metadata: Metadata = {
    title: 'Revenue Dashboard | Service Provider',
    description: 'Track your earnings, manage transactions, and analyze service performance',
};

const ServiceRevenuePage = () => {
    return <RevenuePage />;
};

export default ServiceRevenuePage;
