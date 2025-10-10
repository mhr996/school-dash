import { NextResponse } from 'next/server';
import { getCurrentUserWithRole } from '@/lib/auth';
import { getRevenueTrend } from '@/utils/service-revenue-calculator';

export async function GET() {
    try {
        const result = await getCurrentUserWithRole();
        
        if (result.error || !result.user || !result.user.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const trend = await getRevenueTrend(result.user.id);
        
        return NextResponse.json(trend);

    } catch (error) {
        console.error('Error fetching revenue trend:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
