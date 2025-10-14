interface BookingPDFOptions {
    filename?: string;
    language?: 'en' | 'ae' | 'he';
    format?: 'A4' | 'Letter';
    orientation?: 'portrait' | 'landscape';
}

export class BookingPDFGenerator {
    /**
     * Generate PDF from booking data using server-side Puppeteer
     */
    static async generateFromBooking(bookingData: any, options: BookingPDFOptions = {}): Promise<void> {
        const { filename = `booking-${bookingData.booking_reference}-${new Date().toISOString().split('T')[0]}.pdf`, language = 'he', format = 'A4', orientation = 'portrait' } = options;

        try {
            // Call API to generate PDF
            const response = await fetch('/api/generate-booking-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    bookingData,
                    filename,
                    language,
                    options: {
                        format,
                        orientation,
                        printBackground: true,
                        margins: {
                            top: '8mm',
                            right: '8mm',
                            bottom: '8mm',
                            left: '8mm',
                        },
                    },
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                let userFriendlyMessage = 'Failed to generate PDF';

                try {
                    const errorData = JSON.parse(errorText);
                    if (errorData.details && errorData.details.includes('Could not find Chrome')) {
                        userFriendlyMessage = 'PDF generation service is not available. Chrome browser is not installed on the server. Please contact the administrator.';
                    } else if (errorData.details) {
                        userFriendlyMessage = `PDF generation failed: ${errorData.details}`;
                    }
                } catch (e) {
                    // Error text is not JSON, use as is
                    if (errorText.includes('Chrome')) {
                        userFriendlyMessage = 'PDF generation service is not available. Chrome browser is not installed on the server. Please contact the administrator.';
                    } else {
                        userFriendlyMessage = `PDF generation failed: ${errorText}`;
                    }
                }

                throw new Error(userFriendlyMessage);
            }

            // Download the generated PDF
            const pdfBlob = await response.blob();
            this.downloadPDF(pdfBlob, filename);
        } catch (error) {
            console.error('Booking PDF generation failed:', error);
            throw error;
        }
    }

    /**
     * Download PDF blob to user's device
     */
    private static downloadPDF(pdfBlob: Blob, filename: string): void {
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}
