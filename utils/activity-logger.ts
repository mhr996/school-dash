import supabase from '@/lib/supabase';

export type ActivityType =
    | 'car_added'
    | 'car_updated'
    | 'car_deleted'
    | 'deal_created'
    | 'deal_updated'
    | 'deal_deleted'
    | 'bill_created'
    | 'bill_updated'
    | 'bill_deleted'
    | 'customer_added'
    | 'customer_updated'
    | 'customer_deleted'
    | 'provider_added'
    | 'provider_updated'
    | 'provider_deleted';

interface LogActivityParams {
    type: ActivityType;
    deal?: any; // The actual deal object/data
    car?: any; // The actual car object/data
    bill?: any; // The actual bill object/data
}

export const logActivity = async ({ type, deal, car, bill }: LogActivityParams) => {
    try {
        const logData = {
            type,
            deal: deal || null,
            car: car || null,
            bill: bill || null,
        };

        const { error } = await supabase.from('logs').insert([logData]);

        if (error) {
            console.error('Error logging activity:', error);
        }
    } catch (error) {
        console.error('Error in logActivity:', error);
    }
};
