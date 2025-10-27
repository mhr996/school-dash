// Shared types for the CRM application


export interface FileItem {
    file: File;
    preview?: string;
    id: string;
}


export interface Paramedic {
    id: string;
    name: string;
    identity_number: string;
    phone?: string;
    email?: string;
    hourly_rate?: number;
    daily_rate?: number;
    regional_rate?: number;
    overnight_rate?: number;
    status?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    profile_picture_url?: string | null;
}

export interface Log {
    id: string;
    created_at: string;
    type:
        | 'car_added'
        | 'car_updated'
        | 'car_deleted'
        | 'car_received_from_client'
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
        | 'provider_deleted'
        | 'paramedic_added'
        | 'paramedic_updated'
        | 'paramedic_deleted';

    // JSONB data columns storing the actual data at time of log
    deal?: any; // The actual deal data as JSONB
    car?: any; // The actual car data as JSONB
    bill?: any; // The actual bill data as JSONB
    paramedic?: any; // The actual paramedic data as JSONB
}
