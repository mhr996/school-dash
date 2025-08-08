import { generatePDFFromElement } from '../pdf-generator';
import { BillData, PDFOptions } from './types';
import { getTranslationFunction, formatCurrency, formatDate, createTempContainer, getBaseHTML, generateDocumentInfoSection, generateSignatureSection } from './shared';

export const generateReceiptOnlyPDF = async (billData: BillData, options: PDFOptions = {}): Promise<void> => {
    const { filename = `receipt-${billData.id}.pdf`, language = 'he' } = options;

    console.log('=== Receipt Only PDF Generation ===');
    console.log('Bill ID:', billData.id);

    try {
        const tempContainer = createTempContainer('temp-receipt-container');
        const t = getTranslationFunction(language);

        // Calculate basic data
        const paidAmount = (billData.cash_amount || 0) + (billData.visa_amount || 0) + (billData.bank_amount || 0) + (billData.check_amount || 0);
        const totalAmount = billData.total_with_tax || billData.total || billData.bill_amount || 0;
        const remainingAmount = totalAmount - paidAmount;

        // Car details
        const carInfo = billData.deal?.car ? `${billData.deal.car.make || ''} ${billData.deal.car.model || ''} ${billData.deal.car.year || ''}`.trim() : billData.car_details || t('notAvailable');

        const documentInfoSection = generateDocumentInfoSection(t, billData);

        const receiptDetailsTable = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>${t('vehicle')}</th>
                            <th>${t('totalAmount')}</th>
                            <th>${t('paidAmount')}</th>
                            <th>${t('remainingAmount')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${carInfo}</td>
                            <td>${formatCurrency(totalAmount)}</td>
                            <td>${formatCurrency(paidAmount)}</td>
                            <td>${formatCurrency(remainingAmount)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;

        const paymentDetailsSection = `
            <div class="financial-summary">
                <h3>${t('paymentDetails')}</h3>
                <div class="summary-content">
                    <div class="summary-item">
                        <span>${t('paymentMethod')}:</span>
                        <span>${t(`payment_${billData.payment_type}`) || billData.payment_type || t('notAvailable')}</span>
                    </div>
                    <div class="summary-item">
                        <span>${t('paymentDate')}:</span>
                        <span>${formatDate(billData.created_at)}</span>
                    </div>
                    <div class="summary-item">
                        <span>${t('paidAmount')}:</span>
                        <span>${formatCurrency(paidAmount)}</span>
                    </div>
                    ${
                        remainingAmount > 0
                            ? `
                    <div class="summary-item">
                        <span>${t('remainingAmount')}:</span>
                        <span>${formatCurrency(remainingAmount)}</span>
                    </div>
                    `
                            : ''
                    }
                </div>
            </div>
        `;

        const signatureSection = generateSignatureSection(t);

        const content = `
            ${documentInfoSection}
            ${receiptDetailsTable}
            ${paymentDetailsSection}
            ${signatureSection}
        `;

        const billHTML = await getBaseHTML(language).then((html) => html.replace('{{DOCUMENT_TITLE}}', 'إيصال - Receipt').replace('{{CONTENT}}', content));

        tempContainer.innerHTML = billHTML;
        document.body.appendChild(tempContainer);

        console.log('Generating PDF for receipt...');
        await generatePDFFromElement('temp-receipt-container', {
            filename,
            orientation: 'portrait',
            ...options,
        });

        document.body.removeChild(tempContainer);
        console.log(`Receipt PDF generated: ${filename}`);
    } catch (error) {
        console.error('Error generating receipt PDF:', error);
        throw error;
    }
};
