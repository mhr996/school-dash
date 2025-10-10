import { NextResponse } from 'next/server';
import { getCurrentUserWithRole } from '@/lib/auth';
import { calculateServiceRevenue } from '@/utils/service-revenue-calculator';

export async function GET() {
    try {
        const result = await getCurrentUserWithRole();
        
        if (result.error || !result.user || !result.user.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const revenueStats = await calculateServiceRevenue(result.user.id);
        
        return NextResponse.json(revenueStats);

    } catch (error) {
        console.error('Error fetching revenue stats:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
