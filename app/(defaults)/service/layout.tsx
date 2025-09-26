import RouteGuard from '@/components/auth/route-guard';

export default function ServiceLayout({ children }: { children: React.ReactNode }) {
    return <RouteGuard>{children}</RouteGuard>;
}
