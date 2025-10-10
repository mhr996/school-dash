import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export interface BookingNotificationData {
    bookingId: string;
    bookingReference: string;
    serviceType: string;
    serviceName: string;
    serviceEmail: string;
    tripDate: string;
    destination: string;
    bookedPrice: number;
    quantity: number;
    days: number;
    bookingServiceId: string;
}

/**
 * Sends booking notification email to service provider in Hebrew and Arabic
 */
export async function sendBookingNotificationToService(data: BookingNotificationData) {
    try {
        const acceptLink = `${process.env.NEXT_PUBLIC_APP_URL}/service/bookings/${data.bookingServiceId}?action=accept`;
        const rejectLink = `${process.env.NEXT_PUBLIC_APP_URL}/service/bookings/${data.bookingServiceId}?action=reject`;
        const viewLink = `${process.env.NEXT_PUBLIC_APP_URL}/service/bookings/${data.bookingServiceId}`;

        const emailHtml = generateBilingualBookingEmail({
            ...data,
            acceptLink,
            rejectLink,
            viewLink,
        });

        const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.serviceEmail, {
            data: {
                booking_notification: true,
                booking_id: data.bookingId,
            },
            redirectTo: viewLink,
        });

        // Alternative: Use Supabase's built-in email if invite doesn't work
        // We'll need to configure SMTP settings in Supabase dashboard
        const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
                to: data.serviceEmail,
                subject: `הזמנה חדשה | حجز جديد - ${data.bookingReference}`,
                html: emailHtml,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to send email');
        }

        return { success: true };
    } catch (error) {
        console.error('Error sending booking notification:', error);
        return { success: false, error };
    }
}

/**
 * Sends confirmation email to customer when all services accept
 */
export async function sendBookingConfirmationToCustomer(bookingId: string, customerEmail: string) {
    try {
        const { data: booking } = await supabaseAdmin
            .from('bookings')
            .select('booking_reference, trip_date, destination:destinations(name)')
            .eq('id', bookingId)
            .single();

        if (!booking) {
            throw new Error('Booking not found');
        }

        const viewLink = `${process.env.NEXT_PUBLIC_APP_URL}/bookings/preview/${bookingId}`;

        const emailHtml = generateCustomerConfirmationEmail({
            bookingReference: booking.booking_reference,
            tripDate: booking.trip_date,
            destinationName: (booking.destination as any)?.name || '',
            viewLink,
        });

        const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
                to: customerEmail,
                subject: `הזמנתך אושרה | تم تأكيد حجزך - ${booking.booking_reference}`,
                html: emailHtml,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to send confirmation email');
        }

        return { success: true };
    } catch (error) {
        console.error('Error sending confirmation email:', error);
        return { success: false, error };
    }
}

function generateBilingualBookingEmail(data: {
    bookingReference: string;
    serviceType: string;
    serviceName: string;
    tripDate: string;
    destination: string;
    bookedPrice: number;
    quantity: number;
    days: number;
    acceptLink: string;
    rejectLink: string;
    viewLink: string;
}) {
    return `
<!DOCTYPE html>
<html dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .section { margin-bottom: 25px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
        .section:last-child { border-bottom: none; }
        .label { font-weight: bold; color: #555; margin-bottom: 5px; }
        .value { color: #333; font-size: 16px; }
        .buttons { display: flex; gap: 15px; margin-top: 30px; }
        .button { flex: 1; padding: 15px 25px; text-align: center; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; transition: all 0.3s; }
        .accept { background-color: #10b981; color: white; }
        .accept:hover { background-color: #059669; }
        .reject { background-color: #ef4444; color: white; }
        .reject:hover { background-color: #dc2626; }
        .view { background-color: #3b82f6; color: white; }
        .view:hover { background-color: #2563eb; }
        .footer { background-color: #f9fafb; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .bilingual { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .hebrew { text-align: right; }
        .arabic { text-align: right; direction: rtl; }
        @media (max-width: 600px) {
            .bilingual { grid-template-columns: 1fr; }
            .buttons { flex-direction: column; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">🎉 הזמנה חדשה | حجز جديد</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">מספר הזמנה | رقم الحجز: ${data.bookingReference}</p>
        </div>
        
        <div class="content">
            <div class="bilingual">
                <!-- Hebrew -->
                <div class="hebrew">
                    <h2 style="color: #667eea; margin-top: 0;">שלום ${data.serviceName},</h2>
                    <p>קיבלת הזמנה חדשה לשירותיך. אנא עיין בפרטים ואשר או דחה את ההזמנה.</p>
                </div>
                
                <!-- Arabic -->
                <div class="arabic">
                    <h2 style="color: #667eea; margin-top: 0;">مرحباً ${data.serviceName}،</h2>
                    <p>لقد تلقيت حجزاً جديداً لخدماتك. يرجى مراجعة التفاصيل وقبول أو رفض الحجز.</p>
                </div>
            </div>

            <div class="section">
                <div class="bilingual">
                    <div class="hebrew">
                        <div class="label">📅 תאריך הטיול</div>
                        <div class="value">${data.tripDate}</div>
                    </div>
                    <div class="arabic">
                        <div class="label">📅 تاريخ الرحلة</div>
                        <div class="value">${data.tripDate}</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="bilingual">
                    <div class="hebrew">
                        <div class="label">📍 יעד</div>
                        <div class="value">${data.destination}</div>
                    </div>
                    <div class="arabic">
                        <div class="label">📍 الوجهة</div>
                        <div class="value">${data.destination}</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="bilingual">
                    <div class="hebrew">
                        <div class="label">💰 מחיר מוסכם</div>
                        <div class="value">₪${data.bookedPrice.toLocaleString()}</div>
                        <div class="label" style="margin-top: 10px;">📊 כמות / ימים</div>
                        <div class="value">${data.quantity} × ${data.days} ימים</div>
                    </div>
                    <div class="arabic">
                        <div class="label">💰 السعر المتفق عليه</div>
                        <div class="value">₪${data.bookedPrice.toLocaleString()}</div>
                        <div class="label" style="margin-top: 10px;">📊 الكمية / الأيام</div>
                        <div class="value">${data.quantity} × ${data.days} أيام</div>
                    </div>
                </div>
            </div>

            <div class="buttons">
                <a href="${data.acceptLink}" class="button accept">
                    ✓ אישור | قبول
                </a>
                <a href="${data.rejectLink}" class="button reject">
                    ✗ דחייה | رفض
                </a>
            </div>

            <div style="text-align: center; margin-top: 20px;">
                <a href="${data.viewLink}" class="button view" style="display: inline-block;">
                    👁 צפייה בפרטים המלאים | عرض التفاصيل الكاملة
                </a>
            </div>
        </div>

        <div class="footer">
            <p style="margin: 0;">
                <strong>עברית:</strong> מערכת ניהול טיולים | 
                <strong>العربية:</strong> نظام إدارة الرحلات
            </p>
        </div>
    </div>
</body>
</html>
    `;
}

function generateCustomerConfirmationEmail(data: {
    bookingReference: string;
    tripDate: string;
    destinationName: string;
    viewLink: string;
}) {
    return `
<!DOCTYPE html>
<html dir="rtl">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .success-icon { font-size: 64px; margin-bottom: 10px; }
        .button { display: inline-block; padding: 15px 30px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
        .bilingual { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="success-icon">✅</div>
            <h1 style="margin: 0;">הזמנתך אושרה!</h1>
            <h1 style="margin: 5px 0 0 0;">تم تأكيد حجزك!</h1>
        </div>
        
        <div class="content">
            <div class="bilingual">
                <div style="text-align: right;">
                    <p>שמחים לעדכן כי כל הספקים אישרו את ההזמנה שלך.</p>
                    <p><strong>מספר הזמנה:</strong> ${data.bookingReference}</p>
                    <p><strong>תאריך:</strong> ${data.tripDate}</p>
                    <p><strong>יעד:</strong> ${data.destinationName}</p>
                </div>
                <div style="text-align: right;">
                    <p>يسعدنا إبلاغك بأن جميع مقدمي الخدمات قد أكدوا حجزك.</p>
                    <p><strong>رقم الحجز:</strong> ${data.bookingReference}</p>
                    <p><strong>التاريخ:</strong> ${data.tripDate}</p>
                    <p><strong>الوجهة:</strong> ${data.destinationName}</p>
                </div>
            </div>
            
            <div style="text-align: center;">
                <a href="${data.viewLink}" class="button">
                    צפייה בהזמנה | عرض الحجز
                </a>
            </div>
        </div>
    </div>
</body>
</html>
    `;
}
