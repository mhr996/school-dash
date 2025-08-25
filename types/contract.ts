export interface CarContract {
    // Deal Info
    dealType: 'normal' | 'trade-in' | 'intermediary' | 'financing_assistance_intermediary';
    dealDate: string;

    // Company Info (Always the intermediary/dealer)
    companyName: string;
    companyTaxNumber: string;
    companyAddress: string;
    companyPhone: string;

    // Seller Info (Provider for regular deals, or actual seller for intermediary)
    sellerName: string;
    sellerTaxNumber: string;
    sellerAddress: string;
    sellerPhone: string;

    // Buyer Info (Customer)
    buyerName: string;
    buyerId: string;
    buyerAddress: string;
    buyerPhone: string;

    // For intermediary deals - additional seller/buyer info
    isIntermediaryDeal?: boolean;
    actualSeller?: {
        name: string;
        id: string;
        address: string;
        phone: string;
    };
    actualBuyer?: {
        name: string;
        id: string;
        address: string;
        phone: string;
    };

    // Car Info
    carType: string;
    carMake: string;
    carModel: string;
    carYear: number;
    carBuyPrice?: number; // Optional - only used in car purchase contracts
    carPlateNumber: string;
    carVin: string;
    carEngineNumber: string;
    carKilometers: number;

    // Trade-in Car Info (optional)
    tradeInCar?: {
        type: string;
        make: string;
        model: string;
        plateNumber: string;
        year: number;
        kilometers: number;
        estimatedValue: number;
    };

    // Deal Amount (from deal.amount - always available)
    dealAmount: number;

    // Payment Info (optional - for deals with bills)
    totalAmount?: number;
    paymentMethod?: 'cash' | 'bank_transfer' | 'check' | 'other';
    paymentMethods?: Array<{
        type: 'cash' | 'visa' | 'bank_transfer' | 'check';
        selected: boolean;
    }>;
    paymentNotes?: string;
    paymentDetails?: string; // For check numbers or other details
    paidAmount?: number;
    remainingAmount?: number;
    remainingPaymentDate?: string;

    // Additional Terms
    ownershipTransferDays: number;
}

export interface ContractTemplateProps {
    contract: CarContract;
    onGenerate?: () => void;
    language?: string;
}
