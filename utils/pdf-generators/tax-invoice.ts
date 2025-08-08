import { generatePDFFromElement } from '../pdf-generator';
import { BillData, PDFOptions } from './types';
import { getTranslationFunction, formatCurrency, formatDate, createTempContainer, getBaseHTML, generateDocumentInfoSection, generateSignatureSection } from './shared';

export const generateTaxInvoicePDF = async (billData: BillData, options: PDFOptions = {}): Promise<void> => {
    const { filename = `tax-invoice-${billData.id}.pdf`, language = 'he' } = options;

    console.log('=== Tax Invoice PDF Generation ===');
    console.log('Bill ID:', billData.id);

    try {
        const tempContainer = createTempContainer('temp-tax-invoice-container');
        const t = getTranslationFunction(language);

        // Calculate financial data
        const carBuyPrice = billData.deal?.car?.buy_price || 0;
        const carSalePrice = billData.deal?.car?.sale_price || 0;
        const commission = billData.commission || 0;
        const loss = carBuyPrice > carSalePrice ? carBuyPrice - carSalePrice : 0;
        const preTaxTotal = billData.total || 0;
        const taxAmount = billData.tax_amount || 0;
        const totalWithTax = billData.total_with_tax || 0;

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
                            <td style="direction: ltr;">${carInfo}</td>
                            <td>${formatCurrency(carBuyPrice)}</td>
                            <td>${formatCurrency(carSalePrice)}</td>
                            <td>${formatCurrency(totalWithTax)}</td>
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

        const signatureSection = generateSignatureSection(t);

        const content = `
            ${documentInfoSection}
            ${carDetailsTable}
            ${financialSummary}
            ${signatureSection}
        `;

        const billHTML = await getBaseHTML(language).then((html) => html.replace('{{DOCUMENT_TITLE}}', 'فاتورة ضريبية - Tax Invoice').replace('{{CONTENT}}', content));

        tempContainer.innerHTML = billHTML;
        document.body.appendChild(tempContainer);

        console.log('Generating PDF for tax invoice...');
        await generatePDFFromElement('temp-tax-invoice-container', {
            filename,
            orientation: 'portrait',
            ...options,
        });

        document.body.removeChild(tempContainer);
        console.log(`Tax invoice PDF generated: ${filename}`);
    } catch (error) {
        console.error('Error generating tax invoice PDF:', error);
        throw error;
    }
};
