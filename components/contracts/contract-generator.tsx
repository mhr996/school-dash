import React, { useCallback, useState } from 'react';
import { CarContract, ContractTemplateProps } from '@/types/contract';
import ArabicContractTemplate from './arabic-contract-template';
import HebrewContractTemplate from './hebrew-contract-template';
import { generatePDFFromElement } from '@/utils/pdf-generator';
import { getTranslation } from '@/i18n';

interface ContractGeneratorProps extends ContractTemplateProps {
    onGenerateStart?: () => void;
    onGenerateEnd?: () => void;
    onError?: (error: Error) => void;
}

const ContractGenerator: React.FC<ContractGeneratorProps> = ({ contract, language: initialLanguage = 'ar', onGenerateStart, onGenerateEnd, onError }) => {
    const { t } = getTranslation();
    const [language, setLanguage] = useState(initialLanguage);

    const generateContract = useCallback(async () => {
        try {
            onGenerateStart?.();

            // Generate filename based on deal information
            const filename = `car-contract-${contract.carPlateNumber}-${new Date().toISOString().split('T')[0]}.pdf`;

            // Generate PDF
            await generatePDFFromElement('contract-template', {
                filename,
                orientation: 'portrait',
                format: 'a4',
            });

            onGenerateEnd?.();
        } catch (error) {
            console.error('Error generating contract:', error);
            onError?.(error as Error);
        }
    }, [contract, onGenerateStart, onGenerateEnd, onError]);

    // Render the appropriate template based on language
    const renderTemplate = () => {
        switch (language) {
            case 'ar':
                return <ArabicContractTemplate contract={contract} />;
            case 'he':
                return <HebrewContractTemplate contract={contract} />;
            default:
                return <ArabicContractTemplate contract={contract} />;
        }
    };

    return (
        <div className="contract-generator">
            <div className="mb-4 flex items-center justify-between">
                <button type="button" onClick={generateContract} className="btn btn-primary">
                    {t('download_contract')}
                </button>
                <div className="flex items-center gap-4">
                    <button onClick={() => setLanguage('ar')} className={`px-3 py-1 rounded ${language === 'ar' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}>
                        العربية
                    </button>
                    <button onClick={() => setLanguage('he')} className={`px-3 py-1 rounded ${language === 'he' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}>
                        עברית
                    </button>
                </div>
            </div>

            {/* Template Container */}
            <div className="contract-template-container bg-white">{renderTemplate()}</div>
        </div>
    );
};

export default ContractGenerator;
