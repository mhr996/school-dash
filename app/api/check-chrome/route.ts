import { NextRequest, NextResponse } from 'next/server';
import { ChromeChecker } from '@/utils/chrome-checker';

export async function GET(request: NextRequest) {
    try {
        const chromePath = await ChromeChecker.getBestChromePath();

        if (chromePath) {
            return NextResponse.json({
                available: true,
                path: chromePath,
                message: 'Chrome/Chromium found and available for PDF generation',
            });
        } else {
            return NextResponse.json(
                {
                    available: false,
                    path: null,
                    message: 'No Chrome/Chromium installation found. PDF generation may fail.',
                    suggestions: ['Install Google Chrome or Chromium on the server', 'Run: npx puppeteer browsers install chrome', 'Set PUPPETEER_EXECUTABLE_PATH environment variable'],
                },
                { status: 404 },
            );
        }
    } catch (error) {
        console.error('Chrome check error:', error);
        return NextResponse.json(
            {
                available: false,
                path: null,
                error: error instanceof Error ? error.message : String(error),
                message: 'Error checking Chrome availability',
            },
            { status: 500 },
        );
    }
}
