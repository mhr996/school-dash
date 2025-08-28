import { NextRequest, NextResponse } from 'next/server';
import { PDFService } from '@/utils/pdf-service';

export async function POST(request: NextRequest) {
    try {
        const { html, filename = 'activity-logs.pdf', options = {} } = await request.json();

        if (!html) {
            return NextResponse.json({ error: 'HTML content is required' }, { status: 400 });
        }

        // Generate PDF using the same PDFService as contract generation
        const pdfService = PDFService.getInstance();
        const pdfBuffer = await pdfService.generateLogsPDF({
            html,
            filename,
            format: 'A4',
            orientation: 'landscape',
            margins: {
                top: '15mm',
                right: '10mm',
                bottom: '15mm',
                left: '10mm',
            },
            printBackground: true,
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
        console.error('PDF generation error:', error);
        return NextResponse.json(
            {
                error: 'Failed to generate PDF',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}
