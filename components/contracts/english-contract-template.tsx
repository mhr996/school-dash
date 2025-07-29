import React from 'react';
import { CarContract } from '@/types/contract';

interface ContractProps {
    contract: CarContract;
}

const EnglishContractTemplate: React.FC<ContractProps> = ({ contract }) => {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'ILS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="bg-white p-6 max-w-4xl mx-auto text-sm" style={{ direction: 'ltr', fontFamily: 'Arial, sans-serif' }}>
            <div className="text-center mb-6">
                <h1 className="text-xl font-bold mb-1">Vehicle Purchase Agreement</h1>
                <p className="text-gray-600 text-sm">Contract #{contract.buyerId}</p>
                <p className="text-gray-600 text-sm">Date: {formatDate(contract.dealDate)}</p>
            </div>

            {/* Seller and Buyer Information */}
            <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="border rounded-lg p-4 bg-gray-50">
                    <h2 className="text-sm font-bold mb-3 border-b pb-1">Seller Information</h2>
                    <div className="space-y-1 text-sm">
                        <p className="grid grid-cols-3">
                            <span className="font-semibold">Company:</span>
                            <span className="col-span-2">{contract.sellerName}</span>
                        </p>
                        <p className="grid grid-cols-3">
                            <span className="font-semibold">Tax Number:</span>
                            <span className="col-span-2">{contract.sellerTaxNumber}</span>
                        </p>
                        <p className="grid grid-cols-3">
                            <span className="font-semibold">Address:</span>
                            <span className="col-span-2">{contract.sellerAddress}</span>
                        </p>
                        <p className="grid grid-cols-3">
                            <span className="font-semibold">Phone:</span>
                            <span className="col-span-2">{contract.sellerPhone}</span>
                        </p>
                    </div>
                </div>
                <div className="border rounded-lg p-4 bg-gray-50">
                    <h2 className="text-sm font-bold mb-3 border-b pb-1">Buyer Information</h2>
                    <div className="space-y-1 text-sm">
                        <p className="grid grid-cols-3">
                            <span className="font-semibold">Name:</span>
                            <span className="col-span-2">{contract.buyerName}</span>
                        </p>
                        <p className="grid grid-cols-3">
                            <span className="font-semibold">ID:</span>
                            <span className="col-span-2">{contract.buyerId}</span>
                        </p>
                        <p className="grid grid-cols-3">
                            <span className="font-semibold">Address:</span>
                            <span className="col-span-2">{contract.buyerAddress}</span>
                        </p>
                        <p className="grid grid-cols-3">
                            <span className="font-semibold">Phone:</span>
                            <span className="col-span-2">{contract.buyerPhone}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Vehicle Information */}
            <div className="mb-6 border rounded-lg p-4 bg-gray-50">
                <h2 className="text-sm font-bold mb-3 border-b pb-1">Vehicle Information</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <p className="grid grid-cols-2">
                        <span className="font-semibold">Make:</span>
                        {contract.carMake}
                    </p>
                    <p className="grid grid-cols-2">
                        <span className="font-semibold">Model:</span>
                        {contract.carModel}
                    </p>
                    <p className="grid grid-cols-2">
                        <span className="font-semibold">Year:</span>
                        {contract.carYear}
                    </p>
                    <p className="grid grid-cols-2">
                        <span className="font-semibold">Type:</span>
                        {contract.carType}
                    </p>
                    <p className="grid grid-cols-2">
                        <span className="font-semibold">Plate Number:</span>
                        {contract.carPlateNumber}
                    </p>
                    <p className="grid grid-cols-2">
                        <span className="font-semibold">Kilometers:</span>
                        {contract.carKilometers.toLocaleString()}
                    </p>
                    {contract.carVin && (
                        <p className="grid grid-cols-2">
                            <span className="font-semibold">VIN:</span>
                            {contract.carVin}
                        </p>
                    )}
                    {contract.carEngineNumber && (
                        <p className="grid grid-cols-2">
                            <span className="font-semibold">Engine Number:</span>
                            {contract.carEngineNumber}
                        </p>
                    )}
                </div>
            </div>

            {/* Trade-in Information (if applicable) */}
            {contract.tradeInCar && (
                <div className="mb-6 border rounded-lg p-4 bg-gray-50">
                    <h2 className="text-sm font-bold mb-3 border-b pb-1">Trade-in Vehicle Information</h2>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <p className="grid grid-cols-2">
                            <span className="font-semibold">Type:</span>
                            {contract.tradeInCar.type}
                        </p>
                        <p className="grid grid-cols-2">
                            <span className="font-semibold">Plate Number:</span>
                            {contract.tradeInCar.plateNumber}
                        </p>
                        <p className="grid grid-cols-2">
                            <span className="font-semibold">Year:</span>
                            {contract.tradeInCar.year}
                        </p>
                        <p className="grid grid-cols-2">
                            <span className="font-semibold">Estimated Value:</span>
                            {formatCurrency(contract.tradeInCar.estimatedValue)}
                        </p>
                    </div>
                </div>
            )}

            {/* Payment Information */}
            <div className="mb-6 border rounded-lg p-4 bg-gray-50">
                <h2 className="text-sm font-bold mb-3 border-b pb-1">Payment Details</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <p className="grid grid-cols-2">
                        <span className="font-semibold">Total Amount:</span>
                        {formatCurrency(contract.totalAmount)}
                    </p>
                    <p className="grid grid-cols-2">
                        <span className="font-semibold">Payment Method:</span>
                        {contract.paymentMethod}
                    </p>
                    <p className="grid grid-cols-2">
                        <span className="font-semibold">Amount Paid:</span>
                        {formatCurrency(contract.paidAmount)}
                    </p>
                    <p className="grid grid-cols-2">
                        <span className="font-semibold">Remaining Balance:</span>
                        {formatCurrency(contract.remainingAmount)}
                    </p>
                </div>
            </div>

            {/* Terms and Conditions */}
            <div className="mb-6 border rounded-lg p-4 bg-gray-50">
                <h2 className="text-sm font-bold mb-3 border-b pb-1">Terms and Conditions</h2>
                <ol className="list-decimal list-inside space-y-1 text-sm pl-2">
                    <li>The seller guarantees that the vehicle is free of any liens or encumbrances.</li>
                    <li>The vehicle is sold "as is" with no warranties expressed or implied.</li>
                    <li>The seller agrees to transfer ownership within {contract.ownershipTransferDays} days.</li>
                    <li>The buyer has inspected the vehicle and agrees to its current condition.</li>
                    <li>This agreement is binding upon both parties once signed.</li>
                </ol>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-6 mt-8">
                <div>
                    <div className="border-t border-gray-400 pt-2">
                        <p className="text-sm font-semibold">Seller's Signature</p>
                        <p className="text-xs text-gray-600">Date: {formatDate(contract.dealDate)}</p>
                    </div>
                </div>
                <div>
                    <div className="border-t border-gray-400 pt-2">
                        <p className="text-sm font-semibold">Buyer's Signature</p>
                        <p className="text-xs text-gray-600">Date: {formatDate(contract.dealDate)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnglishContractTemplate;
