// Shared types for the CRM application

export interface DealAttachment {
    type: 'car_license' | 'driver_license' | 'car_transfer_document' | 'document';
    name: string;
    url: string; // Relative path like "/deals/7/car_license.pdf"
    uploadedAt: string;
    size: number;
    mimeType: string;
}

export interface Deal {
    id: string;
    created_at: string;
    deal_type: string;
    title: string;
    description: string;
    amount: number;
    status: string;
    customer_id?: string;
    customer_name?: string;
    car_id?: string;
    car_taken_from_client?: string; // For exchange deals - links to the car received from client
    attachments?: DealAttachment[];

    // Joined customer data from the customers table
    customers?: {
        name: string;
        id_number?: string;
    };

    // Legacy individual URL columns (for backwards compatibility)
    car_license_url?: string;
    driver_license_url?: string;
    car_transfer_document_url?: string;
}

export interface Customer {
    id: string;
    name: string;
    phone: string;
    country: string;
    age: number;
    customer_type?: string;
    id_number?: string;
    birth_date?: string;
}

export interface Car {
    id: string;
    title: string;
    year: number;
    brand: string;
    status: string;
    type?: string;
    provider: string;
    kilometers: number;
    market_price: number;
    buy_price: number;
    sale_price: number;
    car_number?: string;
    images: string[] | string;
}

export interface FileItem {
    file: File;
    preview?: string;
    id: string;
}

export interface DealAttachments {
    carLicense: FileItem | null;
    driverLicense: FileItem | null;
    carTransferDocument: FileItem | null;
}
