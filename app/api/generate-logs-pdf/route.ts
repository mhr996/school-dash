import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(request: NextRequest) {
    try {
        const { html } = await request.json();

        if (!html) {
            return NextResponse.json({ error: 'No HTML provided' }, { status: 400 });
        }

        console.log('Launching browser...');

        // Minimal Puppeteer config
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        // Wait for fonts and any external resources to load
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const pdf = await page.pdf({
            format: 'A4',
            landscape: true,
            margin: { top: '15mm', right: '10mm', bottom: '15mm', left: '10mm' },
            printBackground: true, // This ensures background colors/gradients are included
            preferCSSPageSize: false,
        });

        await browser.close();

        return new NextResponse(pdf as BodyInit, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="logs.pdf"',
            },
        });
    } catch (error) {
        console.error('PDF generation error:', error);
        return NextResponse.json({ error: 'PDF generation failed', details: error }, { status: 500 });
    }
}
