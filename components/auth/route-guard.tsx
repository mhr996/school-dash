'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentUserWithRole } from '@/lib/auth';
import Loading from '@/components/layouts/loading';
import AccountPendingPage from './account-pending';

interface RouteGuardProps {
    children: React.ReactNode;
}

export default function RouteGuard({ children }: RouteGuardProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();
    const pathname = usePathname();

    // Define route patterns for different user types
    const publicRoutes = ['/login', '/reset-password', '/update-password', '/signup'];
    const authRoutes = ['/login', '/signup', '/reset-password', '/update-password'];
    const serviceProviderRoutes = ['/service'];
    const adminRoutes = [
        '/users',
        '/guides',
        '/paramedics',
        '/security-companies',
        '/travel-companies',
        '/external-entertainment-companies',
        '/destinations',
        '/zones',
        '/schools',
        '/bookings',
        '/trip-plans',
        '/reports',
        '/analytics',
        '/bills',
        '/logs',
        '/company-settings',
        '/profile',
    ];

    useEffect(() => {
        const checkAuth = async () => {
            // Ensure pathname is available
            if (!pathname) {
                setIsLoading(false);
                return;
            }

            // Allow public routes without authentication
            if (publicRoutes.includes(pathname)) {
                setIsLoading(false);
                return;
            }

            try {
                const { user: userData, error } = await getCurrentUserWithRole();

                if (error || !userData) {
                    // Not authenticated - redirect to login
                    router.push('/login');
                    return;
                }

                setUser(userData);

                // Check if user is authenticated but on auth pages
                if (authRoutes.includes(pathname)) {
                    // Authenticated user accessing login/signup - redirect based on role
                    redirectBasedOnRole(userData);
                    return;
                }

                // Check route permissions based on user role and status
                if (!checkRoutePermissions(userData, pathname)) {
                    return; // Redirect handled in checkRoutePermissions
                }

                setIsLoading(false);
            } catch (error) {
                console.error('Auth check error:', error);
                router.push('/login');
            }
        };

        checkAuth();
    }, [pathname, router]);

    const redirectBasedOnRole = (userData: any) => {
        const role = userData.user_roles?.name;
        const isActive = userData.is_active;

        if (!isActive && role !== 'admin') {
            // Inactive service providers need approval
            router.push('/service/dashboard'); // Will be handled by account pending logic
            return;
        }

        if (role === 'admin') {
            router.push('/');
        } else if (role === 'trip_planner') {
            router.push('/');
        } else if (['guide', 'paramedic', 'security_company', 'travel_company', 'entertainment_company'].includes(role)) {
            router.push('/service/dashboard');
        } else {
            router.push('/');
        }
    };

    const checkRoutePermissions = (userData: any, currentPath: string): boolean => {
        const role = userData.user_roles?.name;
        const isActive = userData.is_active;

        // Handle inactive service providers
        if (!isActive && role !== 'admin') {
            if (!currentPath.startsWith('/service')) {
                router.push('/service/dashboard'); // Will show account pending
                return false;
            }
            // Allow access to service routes for pending page
            return true;
        }

        // Admin access
        if (role === 'admin') {
            // Admins can access everything except service provider routes
            if (currentPath.startsWith('/service')) {
                router.push('/');
                return false;
            }
            return true;
        }

        // Trip planner access
        if (role === 'trip_planner') {
            // Trip planners can access main dashboard routes but not service provider routes
            if (currentPath.startsWith('/service')) {
                router.push('/');
                return false;
            }
            return true;
        }

        // Service provider access
        if (['guide', 'paramedic', 'security_company', 'travel_company', 'entertainment_company'].includes(role)) {
            // Service providers can only access service routes
            if (!currentPath.startsWith('/service')) {
                router.push('/service/dashboard');
                return false;
            }
            return true;
        }

        // Unknown role - redirect to login
        router.push('/login');
        return false;
    };

    // Show loading while checking authentication
    if (isLoading) {
        return <Loading />;
    }

    // Show account pending for inactive service providers
    if (user && !user.is_active && user.user_roles?.name !== 'admin' && pathname?.startsWith('/service')) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-purple-800">
                <AccountPendingPage />
            </div>
        );
    }

    return <>{children}</>;
}
