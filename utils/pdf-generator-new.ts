import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PDFOptions {
    filename?: string;
    orientation?: 'portrait' | 'landscape';
    format?: 'a4' | 'letter';
}

/**
 * Generate PDF from HTML element
 * @param elementId - The ID of the HTML element to convert to PDF
 * @param options - PDF generation options
 * @returns Promise<void>
 */
export const generatePDFFromElement = async (elementId: string, options: PDFOptions = {}): Promise<void> => {
    const { filename = 'document.pdf', orientation = 'portrait', format = 'a4' } = options;

    try {
        const element = document.getElementById(elementId);
        if (!element) {
            throw new Error(`Element with ID '${elementId}' not found`);
        }

        // Show element temporarily if hidden
        const originalDisplay = element.style.display;
        const originalVisibility = element.style.visibility;
        element.style.display = 'block';
        element.style.visibility = 'visible';

        // Generate canvas from HTML element
        const canvas = await html2canvas(element, {
            scale: 2, // Higher scale for better quality
            useCORS: true,
            allowTaint: false,
            backgroundColor: '#ffffff',
            removeContainer: true,
            imageTimeout: 0,
            logging: false,
        });

        // Restore original display properties
        element.style.display = originalDisplay;
        element.style.visibility = originalVisibility;

        // Create PDF
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation,
            unit: 'mm',
            format,
        });

        // Calculate dimensions to fit page
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;

        // Calculate scaling to fit page
        const widthRatio = pdfWidth / imgWidth;
        const heightRatio = pdfHeight / imgHeight;
        const ratio = Math.min(widthRatio, heightRatio);

        const scaledWidth = imgWidth * ratio;
        const scaledHeight = imgHeight * ratio;

        // Center the image on the page
        const xOffset = (pdfWidth - scaledWidth) / 2;
        const yOffset = (pdfHeight - scaledHeight) / 2;

        pdf.addImage(imgData, 'PNG', xOffset, yOffset, scaledWidth, scaledHeight);
        pdf.save(filename);
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
};

/**
 * Generate PDF from order data using a receipt template
 * @param orderData - The order data to generate PDF for
 * @param options - PDF generation options
 * @returns Promise<void>
 */
export const generateOrderReceiptPDF = async (orderData: any, options: PDFOptions = {}): Promise<void> => {
    const { filename = `order-${orderData.id}-receipt.pdf` } = options;

    try {
        // Create a temporary container for the receipt
        const tempContainer = document.createElement('div');
        tempContainer.id = 'temp-receipt-container';
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '-9999px';
        tempContainer.style.width = '800px';
        tempContainer.style.backgroundColor = '#ffffff';
        tempContainer.style.padding = '20px';
        tempContainer.style.fontFamily = 'Arial, sans-serif';

        // Create receipt HTML
        const receiptHTML = `
            <div style="max-width: 800px; margin: 0 auto; padding: 20px; background: white;">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4f46e5; padding-bottom: 20px;">
                    <h1 style="color: #4f46e5; margin: 0; font-size: 28px; font-weight: bold;">VRISTO</h1>
                    <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Order Receipt</p>
                </div>

                <!-- Order Info -->
                <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                    <div>
                        <h3 style="color: #333; margin: 0 0 10px 0; font-size: 18px;">Order Details</h3>
                        <p style="margin: 5px 0; color: #666;"><strong>Order ID:</strong> #${orderData.id}</p>
                        <p style="margin: 5px 0; color: #666;"><strong>Date:</strong> ${new Date(orderData.date).toLocaleDateString()}</p>
                        <p style="margin: 5px 0; color: #666;"><strong>Status:</strong> ${orderData.status.charAt(0).toUpperCase() + orderData.status.slice(1)}</p>
                    </div>
                    <div style="text-align: right;">
                        <h3 style="color: #333; margin: 0 0 10px 0; font-size: 18px;">Customer Information</h3>
                        <p style="margin: 5px 0; color: #666;"><strong>Name:</strong> ${orderData.buyer}</p>
                        <p style="margin: 5px 0; color: #666;"><strong>Email:</strong> ${orderData.email}</p>
                        <p style="margin: 5px 0; color: #666;"><strong>Phone:</strong> ${orderData.phone}</p>
                    </div>
                </div>

                <!-- Items Table -->
                <div style="margin-bottom: 30px;">
                    <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Order Items</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <thead>
                            <tr style="background-color: #4f46e5;">
                                <th style="padding: 12px; text-align: left; border: 1px solid #ddd; font-weight: bold; color: #fff; margin-bottom: 8px">Item</th>
                                <th style="padding: 12px; text-align: center; border: 1px solid #ddd; font-weight: bold; color: #fff; margin-bottom: 8px">Quantity</th>
                                <th style="padding: 12px; text-align: center; border: 1px solid #ddd; font-weight: bold; color: #fff; margin-bottom: 8px">Price</th>
                                <th style="padding: 12px; text-align: center; border: 1px solid #ddd; font-weight: bold; color: #fff; margin-bottom: 8px">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orderData.items
                                .map(
                                    (item: any) => `
                                <tr>
                                    <td style="padding: 12px; border: 1px solid #ddd;">${item.name}</td>
                                    <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">${item.quantity}</td>
                                    <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">$${item.price.toFixed(2)}</td>
                                    <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">$${(item.price * item.quantity).toFixed(2)}</td>
                                </tr>
                            `,
                                )
                                .join('')}
                        </tbody>
                    </table>
                </div>

                <!-- Totals -->
                <div style="margin-left: auto; width: 300px;">
                    <div style="border: 1px solid #ddd; padding: 20px; background-color: #f8f9fa;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span style="color: #666;">Subtotal:</span>
                            <span style="color: #666;">$${orderData.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0).toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span style="color: #666;">Tax (10%):</span>
                            <span style="color: #666;">$${(orderData.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0) * 0.1).toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 1px solid #ddd; font-weight: bold; font-size: 18px;">
                            <span style="color: #333;">Total:</span>
                            <span style="color: #4f46e5;">$${(orderData.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0) * 1.1).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;">
                    <p style="color: #666; margin: 0; font-size: 14px;">Thank you for your business!</p>
                    <p style="color: #666; margin: 5px 0 0 0; font-size: 12px;">For questions about this order, please contact our support team.</p>
                </div>
            </div>
        `;

        tempContainer.innerHTML = receiptHTML;
        document.body.appendChild(tempContainer);

        // Generate PDF
        await generatePDFFromElement('temp-receipt-container', {
            filename,
            orientation: 'portrait',
            format: 'a4',
        });

        // Clean up
        document.body.removeChild(tempContainer);
    } catch (error) {
        console.error('Error generating order receipt PDF:', error);
        throw error;
    }
};

/**
 * Generate a clean and professional PDF for bill data
 * @param billData - The bill data to generate PDF for
 * @param options - PDF generation options
 * @returns Promise<void>
 */
export const generateBillPDF = async (billData: any, options: PDFOptions = {}): Promise<void> => {
    const { filename = `bill-${billData.id}.pdf` } = options;

    try {
        // Create a temporary container for the bill
        const tempContainer = document.createElement('div');
        tempContainer.id = 'temp-bill-container';
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '-9999px';
        tempContainer.style.width = '800px';
        tempContainer.style.backgroundColor = '#ffffff';
        tempContainer.style.padding = '0';
        tempContainer.style.fontFamily = 'Inter, system-ui, -apple-system, sans-serif';
        tempContainer.style.fontSize = '14px';
        tempContainer.style.lineHeight = '1.6';
        tempContainer.style.color = '#1f2937';

        // Helper functions
        const formatDate = (dateString: string) => {
            if (!dateString) return 'N/A';
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        };

        const formatCurrency = (amount: number) => {
            if (!amount) return '$0.00';
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
            }).format(amount);
        };

        const getBillTypeLabel = (type: string) => {
            switch (type) {
                case 'tax_invoice':
                    return 'Tax Invoice';
                case 'receipt_only':
                    return 'Receipt';
                case 'tax_invoice_receipt':
                    return 'Tax Invoice & Receipt';
                default:
                    return type;
            }
        };

        // Generate clean, professional HTML
        const billHTML = `
            <div style="max-width: 800px; margin: 0 auto; padding: 48px; background: #ffffff;">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 48px; padding-bottom: 24px; border-bottom: 2px solid #e5e7eb;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #111827; letter-spacing: -0.025em;">
                        Cars CRM
                    </h1>
                    <p style="margin: 8px 0 0 0; font-size: 16px; color: #6b7280; font-weight: 500;">
                        ${getBillTypeLabel(billData.bill_type)}
                    </p>
                </div>

                <!-- Document Info -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-bottom: 48px;">
                    <div>
                        <h2 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em;">
                            Document Information
                        </h2>
                        <div style="space-y: 8px;">
                            <div style="margin-bottom: 8px;">
                                <span style="display: inline-block; width: 80px; color: #6b7280; font-size: 13px;">ID:</span>
                                <span style="color: #111827; font-weight: 500;">#${billData.id}</span>
                            </div>
                            <div style="margin-bottom: 8px;">
                                <span style="display: inline-block; width: 80px; color: #6b7280; font-size: 13px;">Date:</span>
                                <span style="color: #111827; font-weight: 500;">${formatDate(billData.date || billData.created_at)}</span>
                            </div>
                            <div style="margin-bottom: 8px;">
                                <span style="display: inline-block; width: 80px; color: #6b7280; font-size: 13px;">Status:</span>
                                <span style="color: #111827; font-weight: 500; text-transform: capitalize;">${billData.status}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h2 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em;">
                            Customer Details
                        </h2>
                        <div style="space-y: 8px;">
                            <div style="margin-bottom: 8px;">
                                <span style="display: inline-block; width: 80px; color: #6b7280; font-size: 13px;">Name:</span>
                                <span style="color: #111827; font-weight: 500;">${billData.customer_name || 'N/A'}</span>
                            </div>
                            <div style="margin-bottom: 8px;">
                                <span style="display: inline-block; width: 80px; color: #6b7280; font-size: 13px;">Phone:</span>
                                <span style="color: #111827; font-weight: 500;">${billData.phone || 'N/A'}</span>
                            </div>
                            <div style="margin-bottom: 8px;">
                                <span style="display: inline-block; width: 80px; color: #6b7280; font-size: 13px;">ID:</span>
                                <span style="color: #111827; font-weight: 500;">${billData.identity_number || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Deal Information -->
                ${
                    billData.deal
                        ? `
                <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
                    <h2 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em;">
                        Associated Deal
                    </h2>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                        <div>
                            <div style="margin-bottom: 12px;">
                                <span style="display: block; color: #6b7280; font-size: 13px; margin-bottom: 2px;">Deal Title</span>
                                <span style="color: #111827; font-weight: 500;">${billData.deal.title || 'N/A'}</span>
                            </div>
                            <div style="margin-bottom: 12px;">
                                <span style="display: block; color: #6b7280; font-size: 13px; margin-bottom: 2px;">Customer</span>
                                <span style="color: #111827; font-weight: 500;">${billData.deal.customer?.name || 'N/A'}</span>
                            </div>
                        </div>
                        <div>
                            <div style="margin-bottom: 12px;">
                                <span style="display: block; color: #6b7280; font-size: 13px; margin-bottom: 2px;">Deal Type</span>
                                <span style="color: #111827; font-weight: 500; text-transform: capitalize;">${billData.deal.deal_type?.replace('_', ' ') || 'N/A'}</span>
                            </div>
                            <div style="margin-bottom: 12px;">
                                <span style="display: block; color: #6b7280; font-size: 13px; margin-bottom: 2px;">Vehicle</span>
                                <span style="color: #111827; font-weight: 500;">${billData.deal.car ? `${billData.deal.car.brand} ${billData.deal.car.title}` : 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                `
                        : ''
                }

                <!-- Financial Summary -->
                <div style="margin-bottom: 40px;">
                    <h2 style="margin: 0 0 24px 0; font-size: 18px; font-weight: 600; color: #111827;">
                        Financial Summary
                    </h2>
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                        <thead>
                            <tr style="background: #f9fafb;">
                                <th style="padding: 16px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Description</th>
                                <th style="padding: 16px; text-align: right; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${
                                billData.sale_price
                                    ? `
                            <tr>
                                <td style="padding: 12px 16px; color: #374151; border-bottom: 1px solid #f3f4f6;">Sale Price</td>
                                <td style="padding: 12px 16px; text-align: right; color: #111827; font-weight: 500; border-bottom: 1px solid #f3f4f6;">${formatCurrency(billData.sale_price)}</td>
                            </tr>
                            `
                                    : ''
                            }
                            ${
                                billData.commission
                                    ? `
                            <tr>
                                <td style="padding: 12px 16px; color: #374151; border-bottom: 1px solid #f3f4f6;">Commission</td>
                                <td style="padding: 12px 16px; text-align: right; color: #111827; font-weight: 500; border-bottom: 1px solid #f3f4f6;">${formatCurrency(billData.commission)}</td>
                            </tr>
                            `
                                    : ''
                            }
                            ${
                                billData.total
                                    ? `
                            <tr>
                                <td style="padding: 12px 16px; color: #374151; border-bottom: 1px solid #f3f4f6;">Subtotal</td>
                                <td style="padding: 12px 16px; text-align: right; color: #111827; font-weight: 500; border-bottom: 1px solid #f3f4f6;">${formatCurrency(billData.total)}</td>
                            </tr>
                            `
                                    : ''
                            }
                            ${
                                billData.tax_amount
                                    ? `
                            <tr>
                                <td style="padding: 12px 16px; color: #374151; border-bottom: 1px solid #f3f4f6;">Tax (18%)</td>
                                <td style="padding: 12px 16px; text-align: right; color: #111827; font-weight: 500; border-bottom: 1px solid #f3f4f6;">${formatCurrency(billData.tax_amount)}</td>
                            </tr>
                            `
                                    : ''
                            }
                            ${
                                billData.total_with_tax
                                    ? `
                            <tr style="background: #f9fafb;">
                                <td style="padding: 16px; font-weight: 600; color: #111827;">Total Amount</td>
                                <td style="padding: 16px; text-align: right; font-weight: 700; color: #111827; font-size: 16px;">${formatCurrency(billData.total_with_tax)}</td>
                            </tr>
                            `
                                    : ''
                            }
                        </tbody>
                    </table>
                </div>

                <!-- Additional Information -->
                ${
                    billData.car_details
                        ? `
                <div style="margin-bottom: 32px;">
                    <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em;">
                        Vehicle Details
                    </h3>
                    <p style="margin: 0; color: #6b7280; line-height: 1.6;">${billData.car_details}</p>
                </div>
                `
                        : ''
                }

                ${
                    billData.payment_type
                        ? `
                <div style="margin-bottom: 32px;">
                    <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em;">
                        Payment Information
                    </h3>
                    <div style="color: #6b7280;">
                        <span>Payment Method: </span>
                        <span style="color: #111827; font-weight: 500; text-transform: capitalize;">${billData.payment_type.replace('_', ' ')}</span>
                    </div>
                </div>
                `
                        : ''
                }

                ${
                    billData.free_text
                        ? `
                <div style="margin-bottom: 32px;">
                    <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em;">
                        Notes
                    </h3>
                    <p style="margin: 0; color: #6b7280; line-height: 1.6;">${billData.free_text}</p>
                </div>
                `
                        : ''
                }

                <!-- Footer -->
                <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 48px; text-align: center;">
                    <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 13px;">
                        Thank you for your business
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                        Generated on ${formatDate(new Date().toISOString())} • Cars CRM System
                    </p>
                </div>
            </div>
        `;

        tempContainer.innerHTML = billHTML;
        document.body.appendChild(tempContainer);

        // Generate PDF
        await generatePDFFromElement('temp-bill-container', {
            filename,
            orientation: 'portrait',
            format: 'a4',
        });

        // Clean up
        document.body.removeChild(tempContainer);
    } catch (error) {
        console.error('Error generating bill PDF:', error);
        throw error;
    }
};

/**
 * Print element directly (browser print dialog)
 * @param elementId - The ID of the HTML element to print
 */
export const printElement = (elementId: string): void => {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element with ID '${elementId}' not found`);
        return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        console.error('Could not open print window');
        return;
    }

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Print</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                @media print {
                    body { margin: 0; }
                }
            </style>
        </head>
        <body>
            ${element.outerHTML}
        </body>
        </html>
    `);

    printWindow.document.close();
    printWindow.print();
    printWindow.close();
};
