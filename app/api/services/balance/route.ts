import { NextResponse } from 'next/server';
import { getCurrentUserWithRole } from '@/lib/auth';
import { getServiceBalance } from '@/utils/service-revenue-calculator';

export async function GET() {
    try {
        const result = await getCurrentUserWithRole();
        
        if (result.error || !result.user || !result.user.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const balance = await getServiceBalance(result.user.id);
        
        return NextResponse.json(balance);

    } catch (error) {
        console.error('Error fetching balance:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}