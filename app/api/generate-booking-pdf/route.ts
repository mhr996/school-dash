import { NextRequest, NextResponse } from 'next/server';
import { PDFService } from '@/utils/pdf-service';

export async function POST(request: NextRequest) {
    try {
        const { bookingData, language = 'he', filename = 'booking-summary.pdf', options = {} } = await request.json();

        if (!bookingData) {
            return NextResponse.json({ error: 'Booking data is required' }, { status: 400 });
        }

        // Generate HTML from booking data
        const htmlContent = await generateBookingHTML(bookingData, language);

        // Generate PDF using Puppeteer
        const pdfService = PDFService.getInstance();
        const pdfBuffer = await pdfService.generateContractPDF({
            contractHtml: htmlContent,
            filename,
            ...options,
        });

        // Return PDF as response
        return new NextResponse(Buffer.from(pdfBuffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': pdfBuffer.length.toString(),
            },
        });
    } catch (error) {
        console.error('Booking PDF generation error:', error);
        return NextResponse.json({ error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}

/**
 * Generate HTML from booking data
 */
async function generateBookingHTML(bookingData: any, language: string): Promise<string> {
    // Import company info function
    const { getCompanyInfo } = await import('@/lib/company-info');

    try {
        const companyInfo = await getCompanyInfo(true); // Use service role for API routes

        // Generate HTML based on language
        switch (language) {
            case 'en':
                return generateEnglishBookingHTML(bookingData, companyInfo);
            case 'ae':
                return generateArabicBookingHTML(bookingData, companyInfo);
            case 'he':
                return generateHebrewBookingHTML(bookingData, companyInfo);
            default:
                return generateEnglishBookingHTML(bookingData, companyInfo);
        }
    } catch (error) {
        console.warn('Failed to load company info, using defaults:', error);
        const defaultCompanyInfo = {
            name: 'School Trips Company',
            address: null,
            phone: null,
            tax_number: null,
            logo_url: null,
        };

        switch (language) {
            case 'en':
                return generateEnglishBookingHTML(bookingData, defaultCompanyInfo);
            case 'ae':
                return generateArabicBookingHTML(bookingData, defaultCompanyInfo);
            case 'he':
                return generateHebrewBookingHTML(bookingData, defaultCompanyInfo);
            default:
                return generateEnglishBookingHTML(bookingData, defaultCompanyInfo);
        }
    }
}

/**
 * Generate English booking HTML
 */
function generateEnglishBookingHTML(booking: any, companyInfo: any): string {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'ILS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getBookingTypeLabel = (bookingType: string): string => {
        const labels: { [key: string]: string } = {
            full_trip: 'Full Trip',
            guides_only: 'Guides Only',
            paramedics_only: 'Paramedics Only',
            security_only: 'Security Only',
            entertainment_only: 'Entertainment Only',
            education_only: 'Education Only',
            transportation_only: 'Transportation Only',
        };
        return labels[bookingType] || bookingType;
    };

    const getStatusLabel = (status: string): string => {
        const labels: { [key: string]: string } = {
            pending: 'Pending',
            confirmed: 'Confirmed',
            completed: 'Completed',
            cancelled: 'Cancelled',
            active: 'Active',
            inactive: 'Inactive',
        };
        return labels[status] || status;
    };

    const getPaymentStatusLabel = (status: string): string => {
        const labels: { [key: string]: string } = {
            pending: 'Pending',
            deposit_paid: 'Deposit Paid',
            fully_paid: 'Fully Paid',
            paid: 'Paid',
            cancelled: 'Cancelled',
        };
        return labels[status] || status;
    };

    const getServiceTypeLabel = (serviceType: string): string => {
        const labels: { [key: string]: string } = {
            guides: 'Guides',
            paramedics: 'Paramedics',
            security_companies: 'Security Companies',
            external_entertainment_companies: 'Entertainment Companies',
            travel_companies: 'Travel Companies',
            education_programs: 'Education Programs',
        };
        return labels[serviceType] || serviceType;
    };

    const getPaymentMethodLabel = (paymentMethod: string): string => {
        const labels: { [key: string]: string } = {
            bank_transfer: 'Bank Transfer',
            cash: 'Cash',
            credit_card: 'Credit Card',
            check: 'Check',
        };
        return labels[paymentMethod] || paymentMethod;
    };

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Summary - ${booking.booking_reference}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            @page { size: A4; margin: 8mm; }
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                font-size: 11px; 
                line-height: 1.4; 
            }
            .avoid-break-inside { page-break-inside: avoid; }
            .compact-section { margin-bottom: 8px; }
            .compact-header { padding: 12px 16px; }
            .compact-content { padding: 14px; }
        </style>
    </head>
    <body>
        <div class="bg-white w-full max-w-none" style="direction: ltr">
            <!-- Header -->
            <div class="relative overflow-hidden w-full avoid-break-inside">
                <div class="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                
                <div class="relative compact-header w-full">
                    <div class="flex items-center justify-between w-full">
                        <!-- Company Info -->
                        <div class="flex items-center gap-3 text-white">
                            ${
                                companyInfo?.logo_url
                                    ? `
                                <div class="bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20">
                                    <img src="${companyInfo.logo_url}" alt="Company Logo" class="w-10 h-10 object-contain" />
                                </div>
                            `
                                    : ''
                            }
                            <div class="text-left">
                                <h1 class="text-lg font-bold mb-0.5">${companyInfo?.name || 'School Trips Company'}</h1>
                                <div class="space-y-0.5 text-xs opacity-90">
                                    ${companyInfo?.phone ? `<p>📞 ${companyInfo.phone}</p>` : ''}
                                    ${companyInfo?.address ? `<p>📍 ${companyInfo.address}</p>` : ''}
                                </div>
                            </div>
                        </div>

                        <!-- Booking Title -->
                        <div class="text-white text-right">
                            <h2 class="text-base font-bold mb-1">Booking Summary</h2>
                            <div class="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/20">
                                <p class="text-xs font-medium">Reference #</p>
                                <p class="text-sm font-bold">${booking.booking_reference}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Content -->
            <div class="compact-content space-y-3 w-full">
                <!-- Booking Details -->
                <div class="grid grid-cols-2 gap-3 w-full compact-section avoid-break-inside">
                    <!-- Main Info -->
                    <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
                        <h3 class="font-bold mb-2 text-sm text-blue-700 flex items-center gap-2">
                            📋 Booking Information
                        </h3>
                        <div class="space-y-1 text-xs">
                            <p><span class="font-semibold text-blue-700">Type:</span> ${getBookingTypeLabel(booking.booking_type)}</p>
                            <p><span class="font-semibold text-blue-700">Trip Date:</span> ${formatDate(booking.trip_date)}</p>
                            <p><span class="font-semibold text-blue-700">Status:</span> ${getStatusLabel(booking.status)}</p>
                            <p><span class="font-semibold text-blue-700">Payment Status:</span> ${getPaymentStatusLabel(booking.payment_status)}</p>
                        </div>
                    </div>

                    <!-- Customer Info -->
                    <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                        <h3 class="font-bold mb-2 text-sm text-green-700 flex items-center gap-2">
                            👤 Customer Information
                        </h3>
                        <div class="space-y-1 text-xs">
                            <p><span class="font-semibold text-green-700">Name:</span> ${booking.customer?.full_name || 'N/A'}</p>
                            <p><span class="font-semibold text-green-700">Email:</span> ${booking.customer?.email || 'N/A'}</p>
                            <p><span class="font-semibold text-green-700">Phone:</span> ${booking.customer?.phone || 'N/A'}</p>
                            ${booking.school?.name ? `<p><span class="font-semibold text-green-700">School:</span> ${booking.school.name}</p>` : ''}
                        </div>
                    </div>
                </div>

                ${
                    booking.destination
                        ? `
                <!-- Destination -->
                <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200 compact-section avoid-break-inside">
                    <h3 class="font-bold mb-2 text-sm text-purple-700 flex items-center gap-2">
                        📍 Destination
                    </h3>
                    <div class="space-y-1 text-xs">
                        <p><span class="font-semibold text-purple-700">Name:</span> ${booking.destination.name}</p>
                        ${booking.destination.address ? `<p><span class="font-semibold text-purple-700">Address:</span> ${booking.destination.address}</p>` : ''}
                    </div>
                </div>
                `
                        : ''
                }

                ${
                    booking.number_of_students || booking.number_of_crew || booking.number_of_buses
                        ? `
                <!-- Trip Details -->
                <div class="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200 compact-section avoid-break-inside">
                    <h3 class="font-bold mb-2 text-sm text-yellow-700 flex items-center gap-2">
                        🚌 Trip Details
                    </h3>
                    <div class="grid grid-cols-3 gap-2 text-xs">
                        ${booking.number_of_students ? `<p><span class="font-semibold text-yellow-700">Students:</span> ${booking.number_of_students}</p>` : ''}
                        ${booking.number_of_crew ? `<p><span class="font-semibold text-yellow-700">Crew:</span> ${booking.number_of_crew}</p>` : ''}
                        ${booking.number_of_buses ? `<p><span class="font-semibold text-yellow-700">Buses:</span> ${booking.number_of_buses}</p>` : ''}
                    </div>
                </div>
                `
                        : ''
                }

                ${
                    booking.services && booking.services.length > 0
                        ? `
                <!-- Services -->
                <div class="bg-gray-50 rounded-lg p-3 border border-gray-200 compact-section avoid-break-inside">
                    <h3 class="font-bold mb-2 text-sm text-gray-700 flex items-center gap-2">
                        🎯 Booked Services
                    </h3>
                    <table class="w-full text-xs">
                        <thead>
                            <tr class="bg-gray-200 text-left">
                                <th class="p-1.5 font-semibold">Service</th>
                                <th class="p-1.5 font-semibold">Type</th>
                                <th class="p-1.5 font-semibold text-center">Qty</th>
                                <th class="p-1.5 font-semibold text-center">Days</th>
                                <th class="p-1.5 font-semibold text-right">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${booking.services
                                .map(
                                    (service: any, index: number) => `
                                <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
                                    <td class="p-1.5">${service.name || 'N/A'}</td>
                                    <td class="p-1.5">${getServiceTypeLabel(service.type)}</td>
                                    <td class="p-1.5 text-center">${service.quantity}</td>
                                    <td class="p-1.5 text-center">${service.days}</td>
                                    <td class="p-1.5 text-right font-semibold">${formatCurrency(service.cost)}</td>
                                </tr>
                            `,
                                )
                                .join('')}
                        </tbody>
                    </table>
                </div>
                `
                        : ''
                }

                <!-- Financial Summary -->
                <div class="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-3 border border-indigo-200 compact-section avoid-break-inside">
                    <h3 class="font-bold mb-2 text-sm text-indigo-700 flex items-center gap-2">
                        💰 Financial Summary
                    </h3>
                    <div class="space-y-1.5">
                        <div class="flex justify-between items-center text-xs">
                            <span class="font-semibold text-indigo-700">Total Amount:</span>
                            <span class="text-lg font-bold text-indigo-700">${formatCurrency(booking.total_amount)}</span>
                        </div>
                        <div class="flex justify-between items-center text-xs">
                            <span class="font-semibold text-indigo-700">Payment Method:</span>
                            <span>${getPaymentMethodLabel(booking.payment_method) || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                ${
                    booking.notes || booking.special_requests
                        ? `
                <!-- Notes -->
                <div class="bg-gray-50 rounded-lg p-3 border border-gray-200 compact-section avoid-break-inside">
                    <h3 class="font-bold mb-2 text-sm text-gray-700 flex items-center gap-2">
                        📝 Additional Information
                    </h3>
                    <div class="space-y-1.5 text-xs">
                        ${booking.notes ? `<p><span class="font-semibold text-gray-700">Notes:</span> ${booking.notes}</p>` : ''}
                        ${booking.special_requests ? `<p><span class="font-semibold text-gray-700">Special Requests:</span> ${booking.special_requests}</p>` : ''}
                    </div>
                </div>
                `
                        : ''
                }

                <!-- Footer -->
                <div class="text-center text-xs text-gray-500 pt-2 border-t border-gray-200">
                    <p>Generated on ${new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
}

/**
 * Generate Arabic booking HTML
 */
function generateArabicBookingHTML(booking: any, companyInfo: any): string {
    const formatCurrency = (value: number) => {
        // Use English numbers for Arabic
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'ILS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatDate = (dateString: string) => {
        // Use English numbers for dates
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getBookingTypeLabel = (bookingType: string): string => {
        const labels: { [key: string]: string } = {
            full_trip: 'رحلة كاملة',
            guides_only: 'مرشدين فقط',
            paramedics_only: 'مسعفين فقط',
            security_only: 'أمن فقط',
            entertainment_only: 'ترفيه فقط',
            education_only: 'برامج تعليمية فقط',
            transportation_only: 'نقل فقط',
        };
        return labels[bookingType] || bookingType;
    };

    const getStatusLabel = (status: string): string => {
        const labels: { [key: string]: string } = {
            pending: 'قيد الانتظار',
            confirmed: 'مؤكد',
            completed: 'مكتمل',
            cancelled: 'ملغي',
            active: 'نشط',
            inactive: 'غير نشط',
        };
        return labels[status] || status;
    };

    const getPaymentStatusLabel = (status: string): string => {
        const labels: { [key: string]: string } = {
            pending: 'قيد الانتظار',
            deposit_paid: 'تم دفع العربون',
            fully_paid: 'مدفوع بالكامل',
            paid: 'مدفوع',
            cancelled: 'ملغي',
        };
        return labels[status] || status;
    };

    const getServiceTypeLabel = (serviceType: string): string => {
        const labels: { [key: string]: string } = {
            guides: 'مرشدين',
            paramedics: 'مسعفين',
            security_companies: 'شركات أمن',
            external_entertainment_companies: 'شركات ترفيه',
            travel_companies: 'شركات سفر',
            education_programs: 'برامج تعليمية',
        };
        return labels[serviceType] || serviceType;
    };

    const getPaymentMethodLabel = (paymentMethod: string): string => {
        const labels: { [key: string]: string } = {
            bank_transfer: 'تحويل بنكي',
            cash: 'نقداً',
            credit_card: 'بطاقة ائتمان',
            check: 'شيك',
        };
        return labels[paymentMethod] || paymentMethod;
    };

    return `
    <!DOCTYPE html>
    <html lang="ar">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ملخص الحجز - ${booking.booking_reference}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
            @page { size: A4; margin: 8mm; }
            body { 
                font-family: 'Noto Kufi Arabic', 'Cairo', 'Segoe UI', sans-serif; 
                font-size: 11px; 
                line-height: 1.4; 
            }
            .avoid-break-inside { page-break-inside: avoid; }
            .compact-section { margin-bottom: 8px; }
            .compact-header { padding: 12px 16px; }
            .compact-content { padding: 14px; }
        </style>
    </head>
    <body>
        <div class="bg-white w-full max-w-none" style="direction: rtl">
            <!-- Header -->
            <div class="relative overflow-hidden w-full avoid-break-inside">
                <div class="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                
                <div class="relative compact-header w-full">
                    <div class="flex items-center justify-between w-full">
                        <!-- Company Info -->
                        <div class="flex items-center gap-3 text-white">
                            ${
                                companyInfo?.logo_url
                                    ? `
                                <div class="bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20">
                                    <img src="${companyInfo.logo_url}" alt="شعار الشركة" class="w-10 h-10 object-contain" />
                                </div>
                            `
                                    : ''
                            }
                            <div class="text-right">
                                <h1 class="text-lg font-bold mb-0.5">${companyInfo?.name || 'شركة رحلات مدرسية'}</h1>
                                <div class="space-y-0.5 text-xs opacity-90">
                                    ${companyInfo?.phone ? `<p>📞 ${companyInfo.phone}</p>` : ''}
                                    ${companyInfo?.address ? `<p>📍 ${companyInfo.address}</p>` : ''}
                                </div>
                            </div>
                        </div>

                        <!-- Booking Title -->
                        <div class="text-white text-left">
                            <h2 class="text-base font-bold mb-1">ملخص الحجز</h2>
                            <div class="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/20">
                                <p class="text-xs font-medium">رقم المرجع</p>
                                <p class="text-sm font-bold">${booking.booking_reference}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Content -->
            <div class="compact-content space-y-3 w-full">
                <!-- Booking Details -->
                <div class="grid grid-cols-2 gap-3 w-full compact-section avoid-break-inside">
                    <!-- Main Info -->
                    <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
                        <h3 class="font-bold mb-2 text-sm text-blue-700 flex items-center gap-2">
                            📋 معلومات الحجز
                        </h3>
                        <div class="space-y-1 text-xs">
                            <p><span class="font-semibold text-blue-700">النوع:</span> ${getBookingTypeLabel(booking.booking_type)}</p>
                            <p><span class="font-semibold text-blue-700">تاريخ الرحلة:</span> ${formatDate(booking.trip_date)}</p>
                            <p><span class="font-semibold text-blue-700">الحالة:</span> ${getStatusLabel(booking.status)}</p>
                            <p><span class="font-semibold text-blue-700">حالة الدفع:</span> ${getPaymentStatusLabel(booking.payment_status)}</p>
                        </div>
                    </div>

                    <!-- Customer Info -->
                    <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                        <h3 class="font-bold mb-2 text-sm text-green-700 flex items-center gap-2">
                            👤 معلومات العميل
                        </h3>
                        <div class="space-y-1 text-xs">
                            <p><span class="font-semibold text-green-700">الاسم:</span> ${booking.customer?.full_name || 'غير متوفر'}</p>
                            <p><span class="font-semibold text-green-700">البريد الإلكتروني:</span> ${booking.customer?.email || 'غير متوفر'}</p>
                            <p><span class="font-semibold text-green-700">الهاتف:</span> ${booking.customer?.phone || 'غير متوفر'}</p>
                            ${booking.school?.name ? `<p><span class="font-semibold text-green-700">المدرسة:</span> ${booking.school.name}</p>` : ''}
                        </div>
                    </div>
                </div>

                ${
                    booking.destination
                        ? `
                <!-- Destination -->
                <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200 compact-section avoid-break-inside">
                    <h3 class="font-bold mb-2 text-sm text-purple-700 flex items-center gap-2">
                        📍 الوجهة
                    </h3>
                    <div class="space-y-1 text-xs">
                        <p><span class="font-semibold text-purple-700">الاسم:</span> ${booking.destination.name}</p>
                        ${booking.destination.address ? `<p><span class="font-semibold text-purple-700">العنوان:</span> ${booking.destination.address}</p>` : ''}
                    </div>
                </div>
                `
                        : ''
                }

                ${
                    booking.number_of_students || booking.number_of_crew || booking.number_of_buses
                        ? `
                <!-- Trip Details -->
                <div class="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200 compact-section avoid-break-inside">
                    <h3 class="font-bold mb-2 text-sm text-yellow-700 flex items-center gap-2">
                        🚌 تفاصيل الرحلة
                    </h3>
                    <div class="grid grid-cols-3 gap-2 text-xs">
                        ${booking.number_of_students ? `<p><span class="font-semibold text-yellow-700">الطلاب:</span> ${booking.number_of_students}</p>` : ''}
                        ${booking.number_of_crew ? `<p><span class="font-semibold text-yellow-700">الطاقم:</span> ${booking.number_of_crew}</p>` : ''}
                        ${booking.number_of_buses ? `<p><span class="font-semibold text-yellow-700">الحافلات:</span> ${booking.number_of_buses}</p>` : ''}
                    </div>
                </div>
                `
                        : ''
                }

                ${
                    booking.services && booking.services.length > 0
                        ? `
                <!-- Services -->
                <div class="bg-gray-50 rounded-lg p-3 border border-gray-200 compact-section avoid-break-inside">
                    <h3 class="font-bold mb-2 text-sm text-gray-700 flex items-center gap-2">
                        🎯 الخدمات المحجوزة
                    </h3>
                    <table class="w-full text-xs">
                        <thead>
                            <tr class="bg-gray-200 text-right">
                                <th class="p-1.5 font-semibold">الخدمة</th>
                                <th class="p-1.5 font-semibold">النوع</th>
                                <th class="p-1.5 font-semibold text-center">الكمية</th>
                                <th class="p-1.5 font-semibold text-center">الأيام</th>
                                <th class="p-1.5 font-semibold text-left">السعر</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${booking.services
                                .map(
                                    (service: any, index: number) => `
                                <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
                                    <td class="p-1.5">${service.name || 'غير متوفر'}</td>
                                    <td class="p-1.5">${getServiceTypeLabel(service.type)}</td>
                                    <td class="p-1.5 text-center">${service.quantity}</td>
                                    <td class="p-1.5 text-center">${service.days}</td>
                                    <td class="p-1.5 text-left font-semibold">${formatCurrency(service.cost)}</td>
                                </tr>
                            `,
                                )
                                .join('')}
                        </tbody>
                    </table>
                </div>
                `
                        : ''
                }

                <!-- Financial Summary -->
                <div class="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-3 border border-indigo-200 compact-section avoid-break-inside">
                    <h3 class="font-bold mb-2 text-sm text-indigo-700 flex items-center gap-2">
                        💰 الملخص المالي
                    </h3>
                    <div class="space-y-1.5">
                        <div class="flex justify-between items-center text-xs">
                            <span class="font-semibold text-indigo-700">المبلغ الإجمالي:</span>
                            <span class="text-lg font-bold text-indigo-700">${formatCurrency(booking.total_amount)}</span>
                        </div>
                        <div class="flex justify-between items-center text-xs">
                            <span class="font-semibold text-indigo-700">طريقة الدفع:</span>
                            <span>${getPaymentMethodLabel(booking.payment_method) || 'غير متوفر'}</span>
                        </div>
                    </div>
                </div>

                ${
                    booking.notes || booking.special_requests
                        ? `
                <!-- Notes -->
                <div class="bg-gray-50 rounded-lg p-3 border border-gray-200 compact-section avoid-break-inside">
                    <h3 class="font-bold mb-2 text-sm text-gray-700 flex items-center gap-2">
                        📝 معلومات إضافية
                    </h3>
                    <div class="space-y-1.5 text-xs">
                        ${booking.notes ? `<p><span class="font-semibold text-gray-700">ملاحظات:</span> ${booking.notes}</p>` : ''}
                        ${booking.special_requests ? `<p><span class="font-semibold text-gray-700">طلبات خاصة:</span> ${booking.special_requests}</p>` : ''}
                    </div>
                </div>
                `
                        : ''
                }

                <!-- Footer -->
                <div class="text-center text-xs text-gray-500 pt-2 border-t border-gray-200">
                    <p>تم الإنشاء في ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
}

/**
 * Generate Hebrew booking HTML
 */
function generateHebrewBookingHTML(booking: any, companyInfo: any): string {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('he-IL', {
            style: 'currency',
            currency: 'ILS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('he-IL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getBookingTypeLabel = (bookingType: string): string => {
        const labels: { [key: string]: string } = {
            full_trip: 'טיול מלא',
            guides_only: 'מדריכים בלבד',
            paramedics_only: 'פרמדיקים בלבד',
            security_only: 'אבטחה בלבד',
            entertainment_only: 'בידור בלבד',
            education_only: 'תוכניות חינוכיות בלבד',
            transportation_only: 'הסעות בלבד',
        };
        return labels[bookingType] || bookingType;
    };

    const getStatusLabel = (status: string): string => {
        const labels: { [key: string]: string } = {
            pending: 'ממתין',
            confirmed: 'מאושר',
            completed: 'הושלם',
            cancelled: 'בוטל',
            active: 'פעיל',
            inactive: 'לא פעיל',
        };
        return labels[status] || status;
    };

    const getPaymentStatusLabel = (status: string): string => {
        const labels: { [key: string]: string } = {
            pending: 'ממתין',
            deposit_paid: 'מקדמה שולמה',
            fully_paid: 'שולם במלואו',
            paid: 'שולם',
            cancelled: 'בוטל',
        };
        return labels[status] || status;
    };

    const getServiceTypeLabel = (serviceType: string): string => {
        const labels: { [key: string]: string } = {
            guides: 'מדריכים',
            paramedics: 'פרמדיקים',
            security_companies: 'חברות אבטחה',
            external_entertainment_companies: 'חברות בידור',
            travel_companies: 'חברות הסעות',
            education_programs: 'תוכניות חינוכיות',
        };
        return labels[serviceType] || serviceType;
    };

    const getPaymentMethodLabel = (paymentMethod: string): string => {
        const labels: { [key: string]: string } = {
            bank_transfer: 'העברה בנקאית',
            cash: 'מזומן',
            credit_card: 'כרטיס אשראי',
            check: 'צ\'ק',
        };
        return labels[paymentMethod] || paymentMethod;
    };

    return `
    <!DOCTYPE html>
    <html lang="he">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>סיכום הזמנה - ${booking.booking_reference}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
            @page { size: A4; margin: 8mm; }
            body { 
                font-family: 'Heebo', 'Segoe UI', Arial, sans-serif; 
                font-size: 11px; 
                line-height: 1.4; 
            }
            .avoid-break-inside { page-break-inside: avoid; }
            .compact-section { margin-bottom: 8px; }
            .compact-header { padding: 12px 16px; }
            .compact-content { padding: 14px; }
        </style>
    </head>
    <body>
        <div class="bg-white w-full max-w-none" style="direction: rtl">
            <!-- Header -->
            <div class="relative overflow-hidden w-full avoid-break-inside">
                <div class="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                
                <div class="relative compact-header w-full">
                    <div class="flex items-center justify-between w-full">
                        <!-- Company Info -->
                        <div class="flex items-center gap-3 text-white">
                            ${
                                companyInfo?.logo_url
                                    ? `
                                <div class="bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20">
                                    <img src="${companyInfo.logo_url}" alt="לוגו החברה" class="w-10 h-10 object-contain" />
                                </div>
                            `
                                    : ''
                            }
                            <div class="text-right">
                                <h1 class="text-lg font-bold mb-0.5">${companyInfo?.name || 'חברת טיולים לבתי ספר'}</h1>
                                <div class="space-y-0.5 text-xs opacity-90">
                                    ${companyInfo?.phone ? `<p>📞 ${companyInfo.phone}</p>` : ''}
                                    ${companyInfo?.address ? `<p>📍 ${companyInfo.address}</p>` : ''}
                                </div>
                            </div>
                        </div>

                        <!-- Booking Title -->
                        <div class="text-white text-left">
                            <h2 class="text-base font-bold mb-1">סיכום הזמנה</h2>
                            <div class="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/20">
                                <p class="text-xs font-medium">מספר אסמכתא</p>
                                <p class="text-sm font-bold">${booking.booking_reference}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Content -->
            <div class="compact-content space-y-3 w-full">
                <!-- Booking Details -->
                <div class="grid grid-cols-2 gap-3 w-full compact-section avoid-break-inside">
                    <!-- Main Info -->
                    <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
                        <h3 class="font-bold mb-2 text-sm text-blue-700 flex items-center gap-2">
                            📋 פרטי ההזמנה
                        </h3>
                        <div class="space-y-1 text-xs">
                            <p><span class="font-semibold text-blue-700">סוג:</span> ${getBookingTypeLabel(booking.booking_type)}</p>
                            <p><span class="font-semibold text-blue-700">תאריך הטיול:</span> ${formatDate(booking.trip_date)}</p>
                            <p><span class="font-semibold text-blue-700">סטטוס:</span> ${getStatusLabel(booking.status)}</p>
                            <p><span class="font-semibold text-blue-700">סטטוס תשלום:</span> ${getPaymentStatusLabel(booking.payment_status)}</p>
                        </div>
                    </div>

                    <!-- Customer Info -->
                    <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                        <h3 class="font-bold mb-2 text-sm text-green-700 flex items-center gap-2">
                            👤 פרטי לקוח
                        </h3>
                        <div class="space-y-1 text-xs">
                            <p><span class="font-semibold text-green-700">שם:</span> ${booking.customer?.full_name || 'לא זמין'}</p>
                            <p><span class="font-semibold text-green-700">אימייל:</span> ${booking.customer?.email || 'לא זמין'}</p>
                            <p><span class="font-semibold text-green-700">טלפון:</span> ${booking.customer?.phone || 'לא זמין'}</p>
                            ${booking.school?.name ? `<p><span class="font-semibold text-green-700">בית ספר:</span> ${booking.school.name}</p>` : ''}
                        </div>
                    </div>
                </div>

                ${
                    booking.destination
                        ? `
                <!-- Destination -->
                <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200 compact-section avoid-break-inside">
                    <h3 class="font-bold mb-2 text-sm text-purple-700 flex items-center gap-2">
                        📍 יעד
                    </h3>
                    <div class="space-y-1 text-xs">
                        <p><span class="font-semibold text-purple-700">שם:</span> ${booking.destination.name}</p>
                        ${booking.destination.address ? `<p><span class="font-semibold text-purple-700">כתובת:</span> ${booking.destination.address}</p>` : ''}
                    </div>
                </div>
                `
                        : ''
                }

                ${
                    booking.number_of_students || booking.number_of_crew || booking.number_of_buses
                        ? `
                <!-- Trip Details -->
                <div class="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200 compact-section avoid-break-inside">
                    <h3 class="font-bold mb-2 text-sm text-yellow-700 flex items-center gap-2">
                        🚌 פרטי הטיול
                    </h3>
                    <div class="grid grid-cols-3 gap-2 text-xs">
                        ${booking.number_of_students ? `<p><span class="font-semibold text-yellow-700">תלמידים:</span> ${booking.number_of_students}</p>` : ''}
                        ${booking.number_of_crew ? `<p><span class="font-semibold text-yellow-700">צוות:</span> ${booking.number_of_crew}</p>` : ''}
                        ${booking.number_of_buses ? `<p><span class="font-semibold text-yellow-700">אוטובוסים:</span> ${booking.number_of_buses}</p>` : ''}
                    </div>
                </div>
                `
                        : ''
                }

                ${
                    booking.services && booking.services.length > 0
                        ? `
                <!-- Services -->
                <div class="bg-gray-50 rounded-lg p-3 border border-gray-200 compact-section avoid-break-inside">
                    <h3 class="font-bold mb-2 text-sm text-gray-700 flex items-center gap-2">
                        🎯 שירותים שהוזמנו
                    </h3>
                    <table class="w-full text-xs">
                        <thead>
                            <tr class="bg-gray-200 text-right">
                                <th class="p-1.5 font-semibold">שירות</th>
                                <th class="p-1.5 font-semibold">סוג</th>
                                <th class="p-1.5 font-semibold text-center">כמות</th>
                                <th class="p-1.5 font-semibold text-center">ימים</th>
                                <th class="p-1.5 font-semibold text-left">מחיר</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${booking.services
                                .map(
                                    (service: any, index: number) => `
                                <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
                                    <td class="p-1.5">${service.name || 'לא זמין'}</td>
                                    <td class="p-1.5">${getServiceTypeLabel(service.type)}</td>
                                    <td class="p-1.5 text-center">${service.quantity}</td>
                                    <td class="p-1.5 text-center">${service.days}</td>
                                    <td class="p-1.5 text-left font-semibold">${formatCurrency(service.cost)}</td>
                                </tr>
                            `,
                                )
                                .join('')}
                        </tbody>
                    </table>
                </div>
                `
                        : ''
                }

                <!-- Financial Summary -->
                <div class="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-3 border border-indigo-200 compact-section avoid-break-inside">
                    <h3 class="font-bold mb-2 text-sm text-indigo-700 flex items-center gap-2">
                        💰 סיכום כספי
                    </h3>
                    <div class="space-y-1.5">
                        <div class="flex justify-between items-center text-xs">
                            <span class="font-semibold text-indigo-700">סכום כולל:</span>
                            <span class="text-lg font-bold text-indigo-700">${formatCurrency(booking.total_amount)}</span>
                        </div>
                        <div class="flex justify-between items-center text-xs">
                            <span class="font-semibold text-indigo-700">אמצעי תשלום:</span>
                            <span>${getPaymentMethodLabel(booking.payment_method) || 'לא זמין'}</span>
                        </div>
                    </div>
                </div>

                ${
                    booking.notes || booking.special_requests
                        ? `
                <!-- Notes -->
                <div class="bg-gray-50 rounded-lg p-3 border border-gray-200 compact-section avoid-break-inside">
                    <h3 class="font-bold mb-2 text-sm text-gray-700 flex items-center gap-2">
                        📝 מידע נוסף
                    </h3>
                    <div class="space-y-1.5 text-xs">
                        ${booking.notes ? `<p><span class="font-semibold text-gray-700">הערות:</span> ${booking.notes}</p>` : ''}
                        ${booking.special_requests ? `<p><span class="font-semibold text-gray-700">בקשות מיוחדות:</span> ${booking.special_requests}</p>` : ''}
                    </div>
                </div>
                `
                        : ''
                }

                <!-- Footer -->
                <div class="text-center text-xs text-gray-500 pt-2 border-t border-gray-200">
                    <p>נוצר בתאריך ${new Date().toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
}
