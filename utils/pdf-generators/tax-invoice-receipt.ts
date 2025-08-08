import { generatePDFFromElement } from '../pdf-generator';
import { BillData, PDFOptions } from './types';
import { getTranslationFunction, formatCurrency, formatDate, createTempContainer, getBaseHTML, generateDocumentInfoSection, generateSignatureSection } from './shared';

export const generateTaxInvoiceReceiptPDF = async (billData: BillData, options: PDFOptions = {}): Promise<void> => {
    const { filename = `tax-invoice-receipt-${billData.id}.pdf`, language = 'he' } = options;

    console.log('=== Tax Invoice & Receipt PDF Generation ===');
    console.log('Bill ID:', billData.id);

    try {
        const tempContainer = createTempContainer('temp-tax-invoice-receipt-container');
        const t = getTranslationFunction(language);

        // Calculate financial data
        const carBuyPrice = billData.deal?.car?.buy_price || 0;
        const carSalePrice = billData.deal?.car?.sale_price || 0;
        const commission = billData.commission || 0;
        const loss = carBuyPrice > carSalePrice ? carBuyPrice - carSalePrice : 0;
        const preTaxTotal = billData.total || 0;
        const taxAmount = billData.tax_amount || 0;
        const totalWithTax = billData.total_with_tax || 0;

        // Payment data
        const paidAmount = (billData.cash_amount || 0) + (billData.visa_amount || 0) + (billData.bank_amount || 0) + (billData.check_amount || 0);
        const remainingAmount = totalWithTax - paidAmount;

        // Car details
        const carInfo = billData.deal?.car ? `${billData.deal.car.make || ''} ${billData.deal.car.model || ''} ${billData.deal.car.year || ''}`.trim() : billData.car_details || t('notAvailable');

        const documentInfoSection = generateDocumentInfoSection(t, billData);

        const carDetailsTable = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>${t('carDetails')}</th>
                            <th>${t('buyPrice')}</th>
                            <th>${t('salePrice')}</th>
                            <th>${t('commission')}</th>
                            ${loss > 0 ? `<th>${t('loss')}</th>` : ''}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${carInfo}</td>
                            <td>${formatCurrency(carBuyPrice)}</td>
                            <td>${formatCurrency(carSalePrice)}</td>
                            <td>${formatCurrency(commission)}</td>
                            ${loss > 0 ? `<td>${formatCurrency(loss)}</td>` : ''}
                        </tr>
                    </tbody>
                </table>
            </div>
        `;

        const financialSummary = `
            <div class="financial-summary">
                <h3>${t('financialSummary')}</h3>
                <div class="summary-content">
                    <div class="summary-item">
                        <span>${t('preTaxTotal')}:</span>
                        <span>${formatCurrency(preTaxTotal)}</span>
                    </div>
                    <div class="summary-item">
                        <span>${t('taxAmount')} (18%):</span>
                        <span>${formatCurrency(taxAmount)}</span>
                    </div>
                    <div class="summary-item">
                        <span>${t('totalWithTax')}:</span>
                        <span>${formatCurrency(totalWithTax)}</span>
                    </div>
                </div>
            </div>
        `;

        const paymentDetailsSection = `
            <div class="financial-summary">
                <h3>${t('paymentDetails')}</h3>
                <div class="summary-content">
                    ${
                        billData.cash_amount
                            ? `
                    <div class="summary-item">
                        <span>${t('payment_cash')}:</span>
                        <span>${formatCurrency(billData.cash_amount)}</span>
                    </div>`
                            : ''
                    }
                    ${
                        billData.visa_amount
                            ? `
                    <div class="summary-item">
                        <span>${t('payment_visa')}:</span>
                        <span>${formatCurrency(billData.visa_amount)}</span>
                    </div>`
                            : ''
                    }
                    ${
                        billData.bank_amount
                            ? `
                    <div class="summary-item">
                        <span>${t('payment_bank_transfer')}:</span>
                        <span>${formatCurrency(billData.bank_amount)}</span>
                    </div>`
                            : ''
                    }
                    ${
                        billData.check_amount
                            ? `
                    <div class="summary-item">
                        <span>${t('payment_check')}:</span>
                        <span>${formatCurrency(billData.check_amount)}</span>
                    </div>`
                            : ''
                    }
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
                    </div>`
                            : ''
                    }
                </div>
            </div>
        `;

        const signatureSection = generateSignatureSection(t);

        const content = `
            ${documentInfoSection}
            ${carDetailsTable}
            ${financialSummary}
            ${paymentDetailsSection}
            ${signatureSection}
        `;

        const billHTML = await getBaseHTML(language).then((html) => html.replace('{{DOCUMENT_TITLE}}', 'فاتورة ضريبية وإيصال - Tax Invoice & Receipt').replace('{{CONTENT}}', content));

        tempContainer.innerHTML = billHTML;
        document.body.appendChild(tempContainer);

        console.log('Generating PDF for tax invoice & receipt...');
        await generatePDFFromElement('temp-tax-invoice-receipt-container', {
            filename,
            orientation: 'portrait',
            ...options,
        });

        document.body.removeChild(tempContainer);
        console.log(`Tax invoice & receipt PDF generated: ${filename}`);
    } catch (error) {
        console.error('Error generating tax invoice & receipt PDF:', error);
        throw error;
    }
};
