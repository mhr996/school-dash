import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PDFOptions {
    filename?: string;
    orientation?: 'portrait' | 'landscape';
    format?: 'a4' | 'letter';
    language?: 'en' | 'he' | 'ar';
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

        // Apply print styles before generating canvas
        const printStyle = document.createElement('style');
        printStyle.textContent = `
            #${elementId} input[type="checkbox"] {
                margin-top: 25px !important;
            }
            .pdf-header {
                width: 100%;
                padding: 32px 40px;
                margin-bottom: 40px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid #eaeaea;
            }
            .pdf-header-left {
                display: flex;
                align-items: center;
                gap: 24px;
            }
            .pdf-header img {
                width: 150px;
                height: auto;
                object-fit: contain;
                margin-top: 14px;
            }
            .pdf-header-content {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .pdf-header-title {
                font-size: 28px;
                font-weight: bold;
                margin: 0;
                color: #1a1a1a;
            }
            .pdf-header-subtitle {
                font-size: 14px;
                color: #666666;
                margin: 0;
            }
            .pdf-header-date {
                font-size: 14px;
                color: #666666;
                text-align: right;
            }
        `;
        element.appendChild(printStyle);

        // Add logo and title to the header if it doesn't exist
        if (!element.querySelector('.pdf-header')) {
            const header = document.createElement('div');
            header.className = 'pdf-header';

            // Left section with logo and titles
            const leftSection = document.createElement('div');
            leftSection.className = 'pdf-header-left';

            const logo = document.createElement('img');
            logo.src = '/assets/images/logo.png';
            logo.alt = 'Company Logo';
            leftSection.appendChild(logo);

            const contentSection = document.createElement('div');
            contentSection.className = 'pdf-header-content';

            const title = document.createElement('h1');
            title.className = 'pdf-header-title';
            title.textContent = element.querySelector('h1')?.textContent || 'Invoice';
            contentSection.appendChild(title);

            const subtitle = document.createElement('p');
            subtitle.className = 'pdf-header-subtitle';
            subtitle.textContent = 'Car Dealership Management';
            contentSection.appendChild(subtitle);

            leftSection.appendChild(contentSection);
            header.appendChild(leftSection);

            // Right section with date
            const dateSection = document.createElement('div');
            dateSection.className = 'pdf-header-date';
            const currentDate = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
            dateSection.textContent = currentDate;
            header.appendChild(dateSection);

            element.insertBefore(header, element.firstChild);

            // Remove the original title if it exists
            const originalTitle = element.querySelector('h1:not(.pdf-header-title)');
            if (originalTitle) {
                originalTitle.remove();
            }
        }

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

        // Remove the temporary style
        element.removeChild(printStyle);

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
                        <p style="margin: 5px 0; color: #666;"><strong>Date:</strong> ${new Date(orderData.date).toLocaleDateString('en-GB', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                        })}</p>
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
                                    <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">₪${item.price.toFixed(2)}</td>
                                    <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">₪${(item.price * item.quantity).toFixed(2)}</td>
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
                            <span style="color: #666;">₪${orderData.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0).toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span style="color: #666;">Tax (10%):</span>
                            <span style="color: #666;">₪${(orderData.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0) * 0.1).toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 1px solid #ddd; font-weight: bold; font-size: 18px;">
                            <span style="color: #333;">Total:</span>
                            <span style="color: #4f46e5;">₪${(orderData.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0) * 1.1).toFixed(2)}</span>
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
    const {
        filename = `bill-${billData.id}.pdf`,
        language = 'he', // Default to Hebrew if not specified
    } = options;

    // Debug logging to understand the bill data structure
    console.log('=== PDF Generation Debug Info ===');
    console.log('Bill ID:', billData.id);
    console.log('Bill type:', billData.bill_type);
    console.log('Bill data:', billData);
    console.log('Available fields:', Object.keys(billData));

    // Log different bill type specific fields
    if (billData.bill_type === 'general') {
        console.log('General Bill - Amount:', billData.bill_amount);
        console.log('General Bill - Description:', billData.bill_description);
    } else if (billData.bill_type === 'tax_invoice') {
        console.log('Tax Invoice - Deal data:', billData.deal);
        console.log('Tax Invoice - Car from deal:', billData.deal?.car);
        console.log('Tax Invoice - Car buy_price:', billData.deal?.car?.buy_price);
        console.log('Tax Invoice - Car sale_price:', billData.deal?.car?.sale_price);
        console.log('Tax Invoice - Total (pre-tax):', billData.total);
        console.log('Tax Invoice - Tax amount:', billData.tax_amount);
        console.log('Tax Invoice - Total with tax:', billData.total_with_tax);
        console.log('Tax Invoice - Commission:', billData.commission);
        console.log('Tax Invoice - Car details string:', billData.car_details);
    } else if (billData.bill_type === 'tax_invoice_receipt') {
        console.log('Tax Invoice Receipt - Deal data:', billData.deal);
        console.log('Tax Invoice Receipt - Car from deal:', billData.deal?.car);
        console.log('Tax Invoice Receipt - Car buy_price:', billData.deal?.car?.buy_price);
        console.log('Tax Invoice Receipt - Car sale_price:', billData.deal?.car?.sale_price);
        console.log('Tax Invoice Receipt - Total (pre-tax):', billData.total);
        console.log('Tax Invoice Receipt - Tax amount:', billData.tax_amount);
        console.log('Tax Invoice Receipt - Total with tax:', billData.total_with_tax);
        console.log('Tax Invoice Receipt - Commission:', billData.commission);
        console.log('Tax Invoice Receipt - Payment type:', billData.payment_type);
        console.log('Tax Invoice Receipt - Bank amount:', billData.bank_amount);
        console.log('Tax Invoice Receipt - Bank name:', billData.bank_name);
        console.log('Tax Invoice Receipt - Bank branch:', billData.bank_branch);
        console.log('Tax Invoice Receipt - Account number:', billData.account_number);
        console.log('Tax Invoice Receipt - Transfer number:', billData.transfer_number);
        console.log('Tax Invoice Receipt - Visa amount:', billData.visa_amount);
        console.log('Tax Invoice Receipt - Check amount:', billData.check_amount);
        console.log('Tax Invoice Receipt - Cash amount:', billData.cash_amount);
    }

    console.log('Customer name:', billData.customer_name);
    console.log('=== End Debug Info ===');

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

        // Helper functions and translations
        type TranslationMap = {
            [key: string]: string;
        };

        const translations: { ar: TranslationMap; he: TranslationMap; en: TranslationMap } = {
            ar: {
                documentInfo: 'معلومات المستند',
                customerDetails: 'تفاصيل العميل',
                dealDetails: 'تفاصيل الصفقة',
                paymentDetails: 'تفاصيل الدفع',
                financialSummary: 'ملخص مالي',
                paymentDate: 'تاريخ الدفع',
                invoiceDetails: 'تفاصيل الفاتورة',
                receiptDetails: 'تفاصيل الإيصال',
                id: 'رقم',
                date: 'التاريخ',
                status: 'الحالة',
                customerName: 'اسم العميل',
                customerId: 'رقم الهوية',
                phone: 'رقم الهاتف',
                dealTitle: 'عنوان الصفقة',
                dealType: 'نوع الصفقة',
                vehicle: 'المركبة',
                amount: 'المبلغ',
                subTotal: 'السعر قبل الضريبة',
                tax: 'الضريبة 18%',
                totalAmount: 'الاجمالي شامل الضريبة',
                paymentMethod: 'طريقة الدفع',
                paidAmount: 'المبلغ المدفوع',
                remainingAmount: 'المبلغ المتبقي',
                paymentDueDate: 'تاريخ استحقاق الدفع',
                generatedBy: 'تم إنشاؤها بواسطة',
                signatureLine: 'التوقيع: _________________',
                dateLabel: 'التاريخ',
                notAvailable: 'غير متوفر',
                status_paid: 'مدفوع',
                status_pending: 'قيد الانتظار',
                status_cancelled: 'ملغي',
                payment_cash: 'نقداً',
                payment_bank_transfer: 'تحويل بنكي',
                payment_check: 'شيك',
                payment_visa: 'فيزا',
                payment_other: 'أخرى',
            },
            he: {
                documentInfo: 'פרטי המסמך',
                customerDetails: 'פרטי הלקוח',
                dealDetails: 'פרטי העסקה',
                paymentDetails: 'פרטי התשלום',
                financialSummary: 'סיכום פיננסי',
                paymentDate: 'תאריך תשלום',
                invoiceDetails: 'פרטי חשבונית',
                receiptDetails: 'פרטי קבלה',
                id: 'מספר',
                date: 'תאריך',
                status: 'סטטוס',
                customerName: 'שם הלקוח',
                customerId: 'ת.ז',
                phone: 'טלפון',
                dealTitle: 'כותרת העסקה',
                dealType: 'סוג העסקה',
                vehicle: 'רכב',
                amount: 'סכום',
                subTotal: 'סה"כ לפני מע"מ',
                tax: 'מע"מ',
                totalAmount: 'סה"כ כולל מע"מ',
                paymentMethod: 'אמצעי תשלום',
                paidAmount: 'שולם',
                remainingAmount: 'יתרה לתשלום',
                paymentDueDate: 'תאריך פירעון',
                generatedBy: 'הופק ע"י',
                signatureLine: 'חתימה: _________________',
                dateLabel: 'תאריך',
                notAvailable: 'לא זמין',
                status_paid: 'שולם',
                status_pending: 'ממתין',
                status_cancelled: 'מבוטל',
                payment_cash: 'מזומן',
                payment_bank_transfer: 'העברה בנקאית',
                payment_check: "צ'ק",
                payment_visa: 'ויזה',
                payment_other: 'אחר',
            },
            en: {
                documentInfo: 'Document Information',
                customerDetails: 'Customer Details',
                dealDetails: 'Deal Details',
                paymentDetails: 'Payment Details',
                financialSummary: 'Financial Summary',
                paymentDate: 'Payment Date',
                invoiceDetails: 'Invoice Details',
                receiptDetails: 'Receipt Details',
                id: 'ID',
                date: 'Date',
                status: 'Status',
                customerName: 'Customer Name',
                customerId: 'ID Number',
                phone: 'Phone',
                dealTitle: 'Deal Title',
                dealType: 'Deal Type',
                vehicle: 'Vehicle',
                amount: 'Amount',
                subTotal: 'Subtotal',
                tax: 'Tax',
                totalAmount: 'Total Amount',
                paymentMethod: 'Payment Method',
                paidAmount: 'Paid Amount',
                remainingAmount: 'Remaining Amount',
                paymentDueDate: 'Payment Due Date',
                generatedBy: 'Generated by',
                signatureLine: 'Signature: _________________',
                dateLabel: 'Date',
                notAvailable: 'N/A',
                status_paid: 'Paid',
                status_pending: 'Pending',
                status_cancelled: 'Cancelled',
                payment_cash: 'Cash',
                payment_bank_transfer: 'Bank Transfer',
                payment_check: 'Check',
                payment_visa: 'Visa',
                payment_other: 'Other',
            },
        };

        const t = (key: string) => translations[language]?.[key] || translations.en[key];

        const formatDate = (dateString: string) => {
            if (!dateString) return t('notAvailable');
            const locale = language === 'ar' ? 'ar-EG' : language === 'he' ? 'he-IL' : 'en-US';
            const date = new Date(dateString).toLocaleDateString(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
            return language === 'ar' ? `${date} م` : date;
        };

        const formatCurrency = (amount: number | string) => {
            const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
            if (!numAmount || isNaN(numAmount)) {
                return '₪0';
            }
            return new Intl.NumberFormat('he-IL', {
                style: 'currency',
                currency: 'ILS',
                maximumFractionDigits: 0,
                currencyDisplay: 'symbol',
            }).format(numAmount);
        };

        const getPaymentAmount = (billData: any) => {
            // Return the appropriate payment amount based on payment type
            switch (billData.payment_type?.toLowerCase()) {
                case 'bank_transfer':
                    return billData.bank_amount || billData.transfer_amount;
                case 'check':
                    return billData.check_amount;
                case 'visa':
                    return billData.visa_amount;
                case 'cash':
                    return billData.cash_amount;
                default:
                    return billData.total_with_tax; // Fallback to total amount if payment type is not specified
            }
        };

        const getBillTypeLabel = (type: string) => {
            switch (type) {
                case 'tax_invoice':
                    return language === 'ar' ? 'فاتورة ضريبية' : language === 'he' ? 'חשבונית מס' : 'Tax Invoice';
                case 'receipt_only':
                    return language === 'ar' ? 'إيصال' : language === 'he' ? 'קבלה' : 'Receipt';
                case 'tax_invoice_receipt':
                    return language === 'ar' ? 'فاتورة ضريبية وإيصال' : language === 'he' ? 'חשבונית מס וקבלה' : 'Tax Invoice & Receipt';
                default:
                    return type;
            }
        };

        const getDealTypeLabel = (type: string) => {
            switch (type) {
                case 'sale':
                    return language === 'ar' ? 'بيع' : language === 'he' ? 'מכירה' : 'Sale';
                case 'purchase':
                    return language === 'ar' ? 'شراء' : language === 'he' ? 'קנייה' : 'Purchase';
                case 'lease':
                    return language === 'ar' ? 'تأجير' : language === 'he' ? 'השכרה' : 'Lease';
                case 'trade_in':
                    return language === 'ar' ? 'استبدال' : language === 'he' ? 'טרייד אין' : 'Trade-in';
                default:
                    return type;
            }
        };

        const getPaymentMethodLabel = (method: string) => {
            return t(`payment_${method}`) || method;
        };

        // Generate clean, professional HTML
        const billHTML = `
            <div style="max-width: 800px; margin: 0 auto; padding: 48px; background: #ffffff; direction: ${language === 'en' ? 'ltr' : 'rtl'};">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 8px; padding-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <div style="flex: 1;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #1e3a8a;">
                                My Dream Car
                            </h1>
                       
                          
                        </div>
                        <div style="text-align: ${language === 'en' ? 'right' : 'left'};">
                          
                        </div>
                    </div>
                   
                </div>

                <!-- Document Info -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-bottom: 48px;">
                    <div>
                        <h2 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #374151; text-transform: uppercase; ${language !== 'en' ? 'direction: rtl;' : ''}">
                            ${language === 'ar' ? 'معلومات المستند' : language === 'he' ? 'פרטי המסמך' : 'Document Information'}
                        </h2>
                        <div style="space-y: 8px;">
                            <div style="margin-bottom: 8px; ${language !== 'en' ? 'direction: rtl;' : ''}">
                                <span style="display: inline-block; width: 80px; color: #6b7280; font-size: 13px;">
                                    ${language === 'ar' ? 'رقم:' : language === 'he' ? 'מספר:' : 'ID:'}
                                </span>
                                <span style="color: #111827; font-weight: 500;">#${billData.id}</span>
                            </div>
                            <div style="margin-bottom: 8px; ${language !== 'en' ? 'direction: rtl;' : ''}">
                                <span style="display: inline-block; width: 80px; color: #6b7280; font-size: 13px;">
                                    ${language === 'ar' ? 'التاريخ:' : language === 'he' ? 'תאריך:' : 'Date:'}
                                </span>
                                <span style="color: #111827; font-weight: 500;">${formatDate(billData.date || billData.created_at)}</span>
                            </div>
                            <div style="margin-bottom: 8px; ${language !== 'en' ? 'direction: rtl;' : ''}">
                                <span style="display: inline-block; width: 80px; color: #6b7280; font-size: 13px;">
                                    ${language === 'ar' ? 'النوع:' : language === 'he' ? 'סוג:' : 'Type:'}
                                </span>
                                <span style="color: #111827; font-weight: 500;">${getBillTypeLabel(billData.bill_type)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h2 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #374151; text-transform: uppercase; ${language !== 'en' ? 'direction: rtl;' : ''}">
                            ${language === 'ar' ? 'تفاصيل العميل' : language === 'he' ? 'פרטי הלקוח' : 'Customer Details'}
                        </h2>
                        <div style="space-y: 8px;">
                            <div style="margin-bottom: 8px; ${language !== 'en' ? 'direction: rtl;' : ''}">
                                <span style="display: inline-block; width: 80px; color: #6b7280; font-size: 13px;">
                                    ${language === 'ar' ? 'الاسم:' : language === 'he' ? 'שם:' : 'Name:'}
                                </span>
                                <span style="color: #111827; font-weight: 500;">${billData.customer_name || (language === 'ar' ? 'غير متوفر' : language === 'he' ? 'לא זמין' : 'N/A')}</span>
                            </div>
                            <div style="margin-bottom: 8px; ${language !== 'en' ? 'direction: rtl;' : ''}">
                                <span style="display: inline-block; width: 80px; color: #6b7280; font-size: 13px;">
                                    ${language === 'ar' ? 'الهاتف:' : language === 'he' ? 'טלפון:' : 'Phone:'}
                                </span>
                                <span style="color: #111827; font-weight: 500;">${billData.phone || (language === 'ar' ? 'غير متوفر' : language === 'he' ? 'לא זמין' : 'N/A')}</span>
                            </div>
                            <div style="margin-bottom: 8px;">
                                <span style="display: inline-block; width: 80px; color: #6b7280; font-size: 13px;">ID:</span>
                              
                            </div>
                        </div>
                    </div>
                </div>


                <!-- Financial Summary -->
                <div style="margin-bottom: ${billData.bill_type === 'tax_invoice_receipt' ? '24px' : '40px'};">
                    <h2 style="margin: 0 0 24px 0; font-size: 18px; font-weight: 600; color: #111827; ${language !== 'en' ? 'direction: rtl;' : ''}">
                        ${billData.bill_type === 'receipt_only' ? t('paymentDetails') : billData.bill_type === 'tax_invoice_receipt' ? t('invoiceDetails') : t('financialSummary')}
                    </h2>
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; ${language !== 'en' ? 'direction: rtl;' : ''}">
                        <thead>
                            <tr style="background: #374151;">
                                <th style="padding: 16px; text-align: ${language === 'en' ? 'left' : 'right'}; font-weight: 600; color: #ffffff; border-bottom: 1px solid #e5e7eb;">
                                    ${language === 'ar' ? 'البيان' : language === 'he' ? 'תיאור' : 'Description'}
                                </th>
                                <th style="padding: 16px; text-align: ${language === 'en' ? 'right' : 'left'}; font-weight: 600; color: #ffffff; border-bottom: 1px solid #e5e7eb;">
                                    ${t('amount')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            ${
                                // For GENERAL BILLS - Only show description and amount
                                billData.bill_type === 'general'
                                    ? `
                                        ${
                                            billData.bill_description && billData.bill_description.trim()
                                                ? `
                                        <tr>
                                            <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                                ${language === 'ar' ? 'الوصف' : language === 'he' ? 'תיאור' : 'Description'}
                                            </td>
                                            <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${billData.bill_description}</td>
                                        </tr>`
                                                : ''
                                        }
                                        ${
                                            billData.bill_amount && parseFloat(billData.bill_amount) > 0
                                                ? `
                                        <tr>
                                            <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                                ${language === 'ar' ? 'المبلغ' : language === 'he' ? 'סכום' : 'Amount'}
                                            </td>
                                            <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${formatCurrency(parseFloat(billData.bill_amount))}</td>
                                        </tr>`
                                                : ''
                                        }
                                    `
                                    : // For TAX INVOICES - Show structured order: car details, buy price, sale price, commission, loss, then spacer, then totals
                                      billData.bill_type === 'tax_invoice' || billData.bill_type === 'tax_invoice_receipt'
                                      ? `
                                            <!-- Car and Deal Details Section -->
                                            <tr>
                                                <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                                    ${language === 'ar' ? 'تفاصيل السيارة' : language === 'he' ? 'פרטי הרכב' : 'Car Details'}
                                                </td>
                                                <td style="padding: 12px 16px; direction: ltr; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${billData.deal?.car ? `${billData.deal.car.title || ''} ${billData.deal.car.brand || ''} ${billData.deal.car.model || ''} ${billData.deal.car.year || ''}`.trim() || '-' : billData.car_details || '-'}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                                    ${language === 'ar' ? 'سعر الشراء' : language === 'he' ? 'מחיר קנייה' : 'Buy Price'}
                                                </td>
                                                <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${billData.deal?.car?.buy_price && parseFloat(billData.deal.car.buy_price) > 0 ? formatCurrency(parseFloat(billData.deal.car.buy_price)) : '-'}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                                    ${language === 'ar' ? 'سعر البيع' : language === 'he' ? 'מחיר מכירה' : 'Sale Price'}
                                                </td>
                                                <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${billData.deal?.car?.sale_price && parseFloat(billData.deal.car.sale_price) > 0 ? formatCurrency(parseFloat(billData.deal.car.sale_price)) : '-'}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                                    ${language === 'ar' ? 'العمولة' : language === 'he' ? 'עמלה' : 'Commission'}
                                                </td>
                                                <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${billData.deal?.amount && parseFloat(billData.deal.amount) > 0 ? formatCurrency(parseFloat(billData.deal.amount)) : '-'}</td>
                                            </tr>
                                            ${
                                                // Only show loss row if it has a value
                                                billData.loss_amount && parseFloat(billData.loss_amount) > 0
                                                    ? `
                                            <tr>
                                                <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                                    ${language === 'ar' ? 'مبلغ الخسارة' : language === 'he' ? 'סכום הפסד' : 'Loss'}
                                                </td>
                                                <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #dc2626; font-weight: 500; border-bottom: 1px solid #ddd;">${formatCurrency(parseFloat(billData.loss_amount))}</td>
                                            </tr>`
                                                    : ''
                                            }
                                        `
                                      : // For OTHER BILL TYPES (receipt_only, etc.) - Show payment details
                                        `
                                            ${
                                                billData.car_details
                                                    ? `
                                            <tr>
                                                <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                                    ${language === 'ar' ? 'تفاصيل السيارة' : language === 'he' ? 'פרטי הרכב' : 'Car Details'}
                                                </td>
                                                <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${billData.car_details}</td>
                                            </tr>`
                                                    : ''
                                            }
                                        `
                            }
                            
                            <!-- Receipt Payment Details (Inside Invoice Table) -->
                            ${
                                billData.bill_type === 'receipt_only'
                                    ? `
                                
                                ${
                                    billData.payment_type
                                        ? `
                                <tr>
                                    <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                        ${t('paymentMethod')}
                                    </td>
                                    <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${getPaymentMethodLabel(billData.payment_type)}</td>
                                </tr>`
                                        : ''
                                }
                                ${
                                    billData.payment_date
                                        ? `
                                <tr>
                                    <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                        ${t('paymentDate')}
                                    </td>
                                    <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${formatDate(billData.payment_date)}</td>
                                </tr>`
                                        : ''
                                }
                                
                                <!-- Visa Payment Details -->
                                ${
                                    billData.payment_type === 'visa'
                                        ? `
                                    ${
                                        billData.visa_amount
                                            ? `
                                    <tr>
                                        <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                            ${language === 'ar' ? 'مبلغ البطاقة' : language === 'he' ? 'סכום כרטיס' : 'Card Amount'}
                                        </td>
                                        <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${formatCurrency(billData.visa_amount)}</td>
                                    </tr>`
                                            : ''
                                    }
                                    ${
                                        billData.visa_card_type
                                            ? `
                                    <tr>
                                        <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                            ${language === 'ar' ? 'نوع البطاقة' : language === 'he' ? 'סוג כרטיס' : 'Card Type'}
                                        </td>
                                        <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${billData.visa_card_type || '-'}</td>
                                    </tr>`
                                            : ''
                                    }
                                    ${
                                        billData.visa_last_four
                                            ? `
                                    <tr>
                                        <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                            ${language === 'ar' ? '4 أرقام الأخيرة' : language === 'he' ? '4 ספרות אחרונות' : 'Last 4 Digits'}
                                        </td>
                                        <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${billData.visa_last_four || '-'}</td>
                                    </tr>`
                                            : ''
                                    }
                                    ${
                                        billData.visa_installments
                                            ? `
                                    <tr>
                                        <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                            ${language === 'ar' ? 'عدد الأقساط' : language === 'he' ? 'מספר תשלומים' : 'Installments'}
                                        </td>
                                        <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${billData.visa_installments || '-'}</td>
                                    </tr>`
                                            : ''
                                    }
                                    ${
                                        billData.approval_number
                                            ? `
                                    <tr>
                                        <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                            ${language === 'ar' ? 'رقم الموافقة' : language === 'he' ? 'מספר אישור' : 'Approval Number'}
                                        </td>
                                        <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${billData.approval_number || '-'}</td>
                                    </tr>`
                                            : ''
                                    }
                                `
                                        : ''
                                }

                                <!-- Bank Transfer Details -->
                                ${
                                    billData.payment_type === 'bank_transfer'
                                        ? `
                                    ${
                                        billData.bank_amount || billData.transfer_amount
                                            ? `
                                    <tr>
                                        <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                            ${language === 'ar' ? 'مبلغ التحويل' : language === 'he' ? 'סכום העברה' : 'Transfer Amount'}
                                        </td>
                                        <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${formatCurrency(billData.bank_amount || billData.transfer_amount)}</td>
                                    </tr>`
                                            : ''
                                    }
                                    ${
                                        billData.bank_name || billData.transfer_bank_name
                                            ? `
                                    <tr>
                                        <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                            ${language === 'ar' ? 'اسم البنك' : language === 'he' ? 'שם הבנק' : 'Bank Name'}
                                        </td>
                                        <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${billData.bank_name || billData.transfer_bank_name || '-'}</td>
                                    </tr>`
                                            : ''
                                    }
                                    ${
                                        billData.bank_branch || billData.transfer_branch
                                            ? `
                                    <tr>
                                        <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                            ${language === 'ar' ? 'فرع البنك' : language === 'he' ? 'סניף' : 'Branch'}
                                        </td>
                                        <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${billData.bank_branch || billData.transfer_branch || '-'}</td>
                                    </tr>`
                                            : ''
                                    }
                                    ${
                                        billData.transfer_branch_number
                                            ? `
                                    <tr>
                                        <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                            ${language === 'ar' ? 'رقم الفرع' : language === 'he' ? 'מספר סניף' : 'Branch Number'}
                                        </td>
                                        <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${billData.transfer_branch_number || '-'}</td>
                                    </tr>`
                                            : ''
                                    }
                                    ${
                                        billData.account_number || billData.transfer_account_number
                                            ? `
                                    <tr>
                                        <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                            ${language === 'ar' ? 'رقم الحساب' : language === 'he' ? 'מספר חשבון' : 'Account Number'}
                                        </td>
                                        <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${billData.account_number || billData.transfer_account_number || '-'}</td>
                                    </tr>`
                                            : ''
                                    }
                                    ${
                                        billData.transfer_number
                                            ? `
                                    <tr>
                                        <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                            ${language === 'ar' ? 'رقم التحويل' : language === 'he' ? 'מספר העברה' : 'Transfer Number'}
                                        </td>
                                        <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${billData.transfer_number || '-'}</td>
                                    </tr>`
                                            : ''
                                    }
                                    ${
                                        billData.transfer_holder_name
                                            ? `
                                    <tr>
                                        <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                            ${language === 'ar' ? 'اسم صاحب الحساب' : language === 'he' ? 'שם בעל החשבון' : 'Account Holder'}
                                        </td>
                                        <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${billData.transfer_holder_name || '-'}</td>
                                    </tr>`
                                            : ''
                                    }
                                `
                                        : ''
                                }

                                <!-- Check Details -->
                                ${
                                    billData.payment_type === 'check'
                                        ? `
                                    ${
                                        billData.check_amount
                                            ? `
                                    <tr>
                                        <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                            ${language === 'ar' ? 'مبلغ الشيك' : language === 'he' ? "סכום הצ'ק" : 'Check Amount'}
                                        </td>
                                        <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${formatCurrency(billData.check_amount)}</td>
                                    </tr>`
                                            : ''
                                    }
                                    ${
                                        billData.check_bank_name
                                            ? `
                                    <tr>
                                        <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                            ${language === 'ar' ? 'اسم البنك' : language === 'he' ? 'שם הבנק' : 'Bank Name'}
                                        </td>
                                        <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${billData.check_bank_name || '-'}</td>
                                    </tr>`
                                            : ''
                                    }
                                    ${
                                        billData.check_branch
                                            ? `
                                    <tr>
                                        <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                            ${language === 'ar' ? 'فرع البنك' : language === 'he' ? 'סניף' : 'Branch'}
                                        </td>
                                        <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${billData.check_branch || '-'}</td>
                                    </tr>`
                                            : ''
                                    }
                                    ${
                                        billData.check_branch_number
                                            ? `
                                    <tr>
                                        <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                            ${language === 'ar' ? 'رقم الفرع' : language === 'he' ? 'מספר סניף' : 'Branch Number'}
                                        </td>
                                        <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${billData.check_branch_number || '-'}</td>
                                    </tr>`
                                            : ''
                                    }
                                    ${
                                        billData.check_account_number
                                            ? `
                                    <tr>
                                        <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                            ${language === 'ar' ? 'رقم الحساب' : language === 'he' ? 'מספר חשבון' : 'Account Number'}
                                        </td>
                                        <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${billData.check_account_number || '-'}</td>
                                    </tr>`
                                            : ''
                                    }
                                    ${
                                        billData.check_number
                                            ? `
                                    <tr>
                                        <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                            ${language === 'ar' ? 'رقم الشيك' : language === 'he' ? "מספר צ'ק" : 'Check Number'}
                                        </td>
                                        <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${billData.check_number || '-'}</td>
                                    </tr>`
                                            : ''
                                    }
                                    ${
                                        billData.check_holder_name
                                            ? `
                                    <tr>
                                        <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                            ${language === 'ar' ? 'اسم صاحب الشيك' : language === 'he' ? "שם בעל הצ'ק" : 'Check Holder'}
                                        </td>
                                        <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${billData.check_holder_name || '-'}</td>
                                    </tr>`
                                            : ''
                                    }
                                `
                                        : ''
                                }

                                <!-- Cash Amount -->
                                ${
                                    billData.payment_type === 'cash' && billData.cash_amount
                                        ? `
                                    <tr>
                                        <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                            ${language === 'ar' ? 'المبلغ النقدي' : language === 'he' ? 'סכום במזומן' : 'Cash Amount'}
                                        </td>
                                        <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${formatCurrency(billData.cash_amount)}</td>
                                    </tr>
                                `
                                        : ''
                                }
                            `
                                    : ''
                            }
                        </tbody>
                    </table>
                </div>

                <!-- Tax Totals Section (Separate Table for Tax Invoices) -->
                ${
                    billData.bill_type === 'tax_invoice' || billData.bill_type === 'tax_invoice_receipt'
                        ? `
                <div style="margin-bottom: ${billData.bill_type === 'tax_invoice_receipt' ? '24px' : '40px'};">
                  
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; ${language !== 'en' ? 'direction: rtl;' : ''}">
                      
                        <tbody>
                            ${
                                billData.total && parseFloat(billData.total) > 0
                                    ? `
                            <tr>
                                <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                    ${language === 'ar' ? 'الإجمالي قبل الضريبة' : language === 'he' ? 'סה"כ לפני מע"מ' : 'Total Pre Tax'}
                                </td>
                                <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${formatCurrency(parseFloat(billData.total))}</td>
                            </tr>`
                                    : ''
                            }
                            ${
                                billData.tax_amount && parseFloat(billData.tax_amount) > 0
                                    ? `
                            <tr>
                                <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                    ${language === 'ar' ? 'الضريبة (18%)' : language === 'he' ? 'מע"מ (18%)' : 'Tax Amount'}
                                </td>
                                <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${formatCurrency(parseFloat(billData.tax_amount))}</td>
                            </tr>`
                                    : ''
                            }
                            ${
                                billData.total_with_tax && parseFloat(billData.total_with_tax) > 0
                                    ? `
                            <tr style="background: #f9fafb;">
                                <td style="padding: 16px; font-weight: 600; color: #111827; text-align: ${language === 'en' ? 'left' : 'right'};">
                                    ${language === 'ar' ? 'الإجمالي مع الضريبة' : language === 'he' ? 'סה"כ כולל מע"מ' : 'Total With Tax'}
                                </td>
                                <td style="padding: 16px; text-align: ${language === 'en' ? 'right' : 'left'}; font-weight: 700; color: #111827; font-size: 16px;">${formatCurrency(parseFloat(billData.total_with_tax))}</td>
                            </tr>`
                                    : ''
                            }
                        </tbody>
                    </table>
                </div>
                        `
                        : ''
                }

                ${
                    billData.bill_type === 'tax_invoice_receipt'
                        ? `
                <!-- Receipt Details for Combined Invoice+Receipt -->
                <div style="margin-bottom: 40px;">
                    <h2 style="margin: 24px 0; font-size: 18px; font-weight: 600; color: #111827; ${language !== 'en' ? 'direction: rtl;' : ''}">
                        ${t('receiptDetails')}
                    </h2>
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; ${language !== 'en' ? 'direction: rtl;' : ''}">
                        <thead>
                            <tr style="background: #374151;">
                                <th style="padding: 16px; text-align: ${language === 'en' ? 'left' : 'right'}; font-weight: 600; color: #ffffff; border-bottom: 1px solid #e5e7eb;">
                                    ${language === 'ar' ? 'البيان' : language === 'he' ? 'תיאור' : 'Description'}
                                </th>
                                <th style="padding: 16px; text-align: ${language === 'en' ? 'right' : 'left'}; font-weight: 600; color: #ffffff; border-bottom: 1px solid #e5e7eb;">
                                    ${t('amount')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                    ${t('paidAmount')}
                                </td>
                                <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${formatCurrency(getPaymentAmount(billData))}</td>
                            </tr>
                            ${
                                billData.payment_type
                                    ? `
                            <tr>
                                <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                    ${t('paymentMethod')}
                                </td>
                                <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${getPaymentMethodLabel(billData.payment_type)}</td>
                            </tr>`
                                    : ''
                            }
                            ${
                                billData.payment_date
                                    ? `
                            <tr>
                                <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                    ${t('paymentDate')}
                                </td>
                                <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${formatDate(billData.payment_date)}</td>
                            </tr>`
                                    : ''
                            }
                            
                            <!-- Visa Payment Details -->
                            ${
                                billData.payment_type === 'visa'
                                    ? `
                                ${
                                    billData.visa_amount
                                        ? `
                                <tr>
                                    <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                        ${language === 'ar' ? 'مبلغ البطاقة' : language === 'he' ? 'סכום כרטיס' : 'Card Amount'}
                                    </td>
                                    <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${formatCurrency(billData.visa_amount)}</td>
                                </tr>`
                                        : ''
                                }
                                ${
                                    billData.visa_card_type
                                        ? `
                                <tr>
                                    <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                        ${language === 'ar' ? 'نوع البطاقة' : language === 'he' ? 'סוג כרטיס' : 'Card Type'}
                                    </td>
                                    <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${billData.visa_card_type || '-'}</td>
                                </tr>`
                                        : ''
                                }
                                ${
                                    billData.visa_last_four
                                        ? `
                                <tr>
                                    <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                        ${language === 'ar' ? '4 أرقام الأخيرة' : language === 'he' ? '4 ספרות אחרונות' : 'Last 4 Digits'}
                                    </td>
                                    <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${billData.visa_last_four || '-'}</td>
                                </tr>`
                                        : ''
                                }
                                ${
                                    billData.visa_installments
                                        ? `
                                <tr>
                                    <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                        ${language === 'ar' ? 'عدد الأقساط' : language === 'he' ? 'מספר תשלומים' : 'Installments'}
                                    </td>
                                    <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${billData.visa_installments || '-'}</td>
                                </tr>`
                                        : ''
                                }
                                ${
                                    billData.approval_number
                                        ? `
                                <tr>
                                    <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                        ${language === 'ar' ? 'رقم الموافقة' : language === 'he' ? 'מספר אישור' : 'Approval Number'}
                                    </td>
                                    <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${billData.approval_number || '-'}</td>
                                </tr>`
                                        : ''
                                }
                            `
                                    : ''
                            }

                            <!-- Bank Transfer Details -->
                            ${
                                billData.payment_type === 'bank_transfer'
                                    ? `
                                ${
                                    billData.bank_amount || billData.transfer_amount
                                        ? `
                                <tr>
                                    <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                        ${language === 'ar' ? 'مبلغ التحويل' : language === 'he' ? 'סכום העברה' : 'Transfer Amount'}
                                    </td>
                                    <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${formatCurrency(billData.bank_amount || billData.transfer_amount)}</td>
                                </tr>`
                                        : ''
                                }
                                ${
                                    billData.bank_name || billData.transfer_bank_name
                                        ? `
                                <tr>
                                    <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                        ${language === 'ar' ? 'اسم البنك' : language === 'he' ? 'שם הבנק' : 'Bank Name'}
                                    </td>
                                    <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${billData.bank_name || billData.transfer_bank_name || '-'}</td>
                                </tr>`
                                        : ''
                                }
                                ${
                                    billData.bank_branch || billData.transfer_branch
                                        ? `
                                <tr>
                                    <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                        ${language === 'ar' ? 'فرع البنك' : language === 'he' ? 'סניף' : 'Branch'}
                                    </td>
                                    <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${billData.bank_branch || billData.transfer_branch || '-'}</td>
                                </tr>`
                                        : ''
                                }
                                ${
                                    billData.transfer_branch_number
                                        ? `
                                <tr>
                                    <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                        ${language === 'ar' ? 'رقم الفرع' : language === 'he' ? 'מספר סניף' : 'Branch Number'}
                                    </td>
                                    <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${billData.transfer_branch_number || '-'}</td>
                                </tr>`
                                        : ''
                                }
                                ${
                                    billData.account_number || billData.transfer_account_number
                                        ? `
                                <tr>
                                    <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                        ${language === 'ar' ? 'رقم الحساب' : language === 'he' ? 'מספר חשבון' : 'Account Number'}
                                    </td>
                                    <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${billData.account_number || billData.transfer_account_number || '-'}</td>
                                </tr>`
                                        : ''
                                }
                                ${
                                    billData.transfer_number
                                        ? `
                                <tr>
                                    <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                        ${language === 'ar' ? 'رقم التحويل' : language === 'he' ? 'מספר העברה' : 'Transfer Number'}
                                    </td>
                                    <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${billData.transfer_number || '-'}</td>
                                </tr>`
                                        : ''
                                }
                                ${
                                    billData.transfer_holder_name
                                        ? `
                                <tr>
                                    <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                        ${language === 'ar' ? 'اسم صاحب الحساب' : language === 'he' ? 'שם בעל החשבון' : 'Account Holder'}
                                    </td>
                                    <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${billData.transfer_holder_name || '-'}</td>
                                </tr>`
                                        : ''
                                }
                            `
                                    : ''
                            }

                            <!-- Check Details -->
                            ${
                                billData.payment_type === 'check'
                                    ? `
                                ${
                                    billData.check_amount
                                        ? `
                                <tr>
                                    <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                        ${language === 'ar' ? 'مبلغ الشيك' : language === 'he' ? "סכום הצ'ק" : 'Check Amount'}
                                    </td>
                                    <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${formatCurrency(billData.check_amount)}</td>
                                </tr>`
                                        : ''
                                }
                                ${
                                    billData.check_bank_name
                                        ? `
                                <tr>
                                    <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                        ${language === 'ar' ? 'اسم البنك' : language === 'he' ? 'שם הבנק' : 'Bank Name'}
                                    </td>
                                    <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${billData.check_bank_name || '-'}</td>
                                </tr>`
                                        : ''
                                }
                                ${
                                    billData.check_branch
                                        ? `
                                <tr>
                                    <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                        ${language === 'ar' ? 'فرع البنك' : language === 'he' ? 'סניף' : 'Branch'}
                                    </td>
                                    <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${billData.check_branch || '-'}</td>
                                </tr>`
                                        : ''
                                }
                                ${
                                    billData.check_branch_number
                                        ? `
                                <tr>
                                    <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                        ${language === 'ar' ? 'رقم الفرع' : language === 'he' ? 'מספר סניף' : 'Branch Number'}
                                    </td>
                                    <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${billData.check_branch_number || '-'}</td>
                                </tr>`
                                        : ''
                                }
                                ${
                                    billData.check_account_number
                                        ? `
                                <tr>
                                    <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                        ${language === 'ar' ? 'رقم الحساب' : language === 'he' ? 'מספר חשבון' : 'Account Number'}
                                    </td>
                                    <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${billData.check_account_number || '-'}</td>
                                </tr>`
                                        : ''
                                }
                                ${
                                    billData.check_number
                                        ? `
                                <tr>
                                    <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                        ${language === 'ar' ? 'رقم الشيك' : language === 'he' ? "מספר צ'ק" : 'Check Number'}
                                    </td>
                                    <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${billData.check_number || '-'}</td>
                                </tr>`
                                        : ''
                                }
                                ${
                                    billData.check_holder_name
                                        ? `
                                <tr>
                                    <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                        ${language === 'ar' ? 'اسم صاحب الشيك' : language === 'he' ? "שם בעל הצ'ק" : 'Check Holder'}
                                    </td>
                                    <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${billData.check_holder_name || '-'}</td>
                                </tr>`
                                        : ''
                                }
                            `
                                    : ''
                            }

                            <!-- Cash Amount -->
                            ${
                                billData.payment_type === 'cash' && billData.cash_amount
                                    ? `
                                <tr>
                                    <td style="padding: 12px 16px; color: #374151; text-align: ${language === 'en' ? 'left' : 'right'}; border-bottom: 1px solid #ddd;">
                                        ${language === 'ar' ? 'المبلغ النقدي' : language === 'he' ? 'סכום במזומן' : 'Cash Amount'}
                                    </td>
                                    <td style="padding: 12px 16px; text-align: ${language === 'en' ? 'right' : 'left'}; color: #111827; font-weight: 500; border-bottom: 1px solid #ddd;">${formatCurrency(billData.cash_amount)}</td>
                                </tr>
                            `
                                    : ''
                            }
                        </tbody>
                    </table>
                </div>
                `
                        : ''
                }

                <!-- Additional Information -->

                ${
                    billData.free_text
                        ? `
                <div style="margin-bottom: 32px;">
                    <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; ${language !== 'en' ? 'direction: rtl;' : ''}">
                        ${language === 'ar' ? 'ملاحظات' : language === 'he' ? 'הערות' : 'Notes'}
                    </h3>
                    <p style="margin: 0; color: #6b7280; line-height: 1.6; ${language !== 'en' ? 'direction: rtl;' : ''}">${billData.free_text}</p>
                </div>
                `
                        : ''
                }

                <!-- Signature Section for Receipts -->
                ${
                    billData.bill_type === 'receipt_only' || billData.bill_type === 'tax_invoice_receipt'
                        ? `
                <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                    <div style="display: flex; justify-content: space-between; ${language !== 'en' ? 'direction: rtl;' : ''}">
                        <div style="flex: 1;">
                            <p style="margin: 0 0 24px 0; color: #374151;">
                                ${language === 'ar' ? 'توقيع المستلم' : language === 'he' ? 'חתימת המקבל' : 'Recipient Signature'}
                            </p>
                            <div style="border-bottom: 1px solid #9ca3af; width: 200px;"></div>
                        </div>
                        <div style="flex: 1; text-align: ${language === 'en' ? 'right' : 'left'};">
                            <p style="margin: 0 0 24px 0; color: #374151;">
                                ${language === 'ar' ? 'توقيع المصدر' : language === 'he' ? 'חתימת המוציא' : 'Issuer Signature'}
                            </p>
                            <div style="border-bottom: 1px solid #9ca3af; width: 200px; margin-${language === 'en' ? 'left' : 'right'}: auto;"></div>
                        </div>
                    </div>
                </div>
                `
                        : ''
                }

                <!-- Footer -->
                <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 48px; text-align: center;">
                    <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 13px;">
                        ${language === 'ar' ? 'شكراً لتعاملكم معنا' : language === 'he' ? 'תודה על העסקים' : 'Thank you for your business'}
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                        ${t('generatedBy')} • My Dream Car
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
