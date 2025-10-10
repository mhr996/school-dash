import { NextResponse } from 'next/server';
import { getCurrentUserWithRole } from '@/lib/auth';
import { getServiceTransactions } from '@/utils/service-revenue-calculator';

export async function GET(request: Request) {
    try {
        const result = await getCurrentUserWithRole();
        
        if (result.error || !result.user || !result.user.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit') || '50');

        const transactions = await getServiceTransactions(result.user.id, limit);
        
        return NextResponse.json(transactions);

    } catch (error) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
