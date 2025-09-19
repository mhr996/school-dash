'use client';
import { useEffect, useState } from 'react';
import TripPlannerDashboard from '@/components/dashboards/trip-planner-dashboard';
import { getTranslation } from '@/i18n';

// This is an example of how to use the TripPlannerDashboard component
// You can integrate this in your main home page or create a dedicated route

export default function HomePage() {
    const { t } = getTranslation();
    const [userType, setUserType] = useState<string>('');

    useEffect(() => {
        // TODO: Replace this with actual user type detection from your auth system
        // For demo purposes, we're setting it to 'trip-planner'
        // You could get this from supabase auth user metadata, context, or props
        setUserType('trip-planner');
    }, []);

    const renderDashboardContent = () => {
        switch (userType) {
            case 'trip-planner':
                return (
                    <>
                        <p>dcjnsdkjcnsdkjcns</p>
                    </>
                );
            case 'admin':
                // TODO: Create AdminDashboard component
                return <div className="text-center p-8">Admin Dashboard Coming Soon</div>;
            case 'student':
                // TODO: Create StudentDashboard component
                return <div className="text-center p-8">Student Dashboard Coming Soon</div>;
            default:
                return (
                    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <p className="text-gray-600 dark:text-gray-300">{t('loading')}</p>
                        </div>
                    </div>
                );
        }
    };

    return renderDashboardContent();
}

/* 
Integration Notes:

1. To use this in your main app, you can:
   - Replace the content of your existing home page with this component
   - Or create a new route specifically for this dashboard

2. User type detection:
   - Replace the hardcoded 'trip-planner' with actual user type from your auth system
   - You can get this from Supabase Auth user metadata or from your user profile table

3. Example integration in app/page.tsx:
   ```typescript
   import HomePage from '@/components/pages/home-page';
   
   export default function Page() {
     return <HomePage />;
   }
   ```

4. Example with auth context:
   ```typescript
   const { user } = useAuth(); // Your auth hook
   const userType = user?.user_metadata?.role || user?.role;
   ```
*/
