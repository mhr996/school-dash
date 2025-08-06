import puppeteer, { Browser, Page } from 'puppeteer';
import { ChromeChecker } from './chrome-checker';

interface PDFGenerationOptions {
    filename?: string;
    format?: 'A4' | 'Letter';
    orientation?: 'portrait' | 'landscape';
    margins?: {
        top?: string;
        right?: string;
        bottom?: string;
        left?: string;
    };
    displayHeaderFooter?: boolean;
    headerTemplate?: string;
    footerTemplate?: string;
    printBackground?: boolean;
    scale?: number;
}

interface ContractPDFOptions extends PDFGenerationOptions {
    contractHtml: string;
    baseUrl?: string;
}

export class PDFService {
    private static instance: PDFService;
    private browser: Browser | null = null;

    private constructor() {}

    static getInstance(): PDFService {
        if (!PDFService.instance) {
            PDFService.instance = new PDFService();
        }
        return PDFService.instance;
    }

    private async getBrowser(): Promise<Browser> {
        if (!this.browser) {
            // Enhanced configuration for production environments
            const launchOptions: any = {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                    '--run-all-compositor-stages-before-draw',
                    '--memory-pressure-off',
                ],
            };

            // Try to find the best Chrome installation
            try {
                const chromePath = await ChromeChecker.getBestChromePath();
                if (chromePath) {
                    launchOptions.executablePath = chromePath;
                    console.log(`Using Chrome at: ${chromePath}`);
                } else {
                    console.warn('No Chrome installation found, using Puppeteer default');
                }
            } catch (e) {
                console.warn('Error finding Chrome, using Puppeteer default:', e);
            }

            try {
                this.browser = await puppeteer.launch(launchOptions);
            } catch (error) {
                console.error('Failed to launch browser with custom path, trying default Puppeteer:', error);

                // Fallback: try without custom executable path
                const fallbackOptions = { ...launchOptions };
                delete fallbackOptions.executablePath;

                try {
                    this.browser = await puppeteer.launch(fallbackOptions);
                } catch (fallbackError) {
                    console.error('Failed to launch browser with fallback options:', fallbackError);
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    const fallbackErrorMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
                    throw new Error(`Failed to launch browser. Original error: ${errorMsg}. Fallback error: ${fallbackErrorMsg}`);
                }
            }
        }
        return this.browser;
    }

    async generateContractPDF(options: ContractPDFOptions): Promise<Uint8Array> {
        const {
            contractHtml,
            baseUrl = 'http://localhost:3000',
            filename = 'contract.pdf',
            format = 'A4',
            orientation = 'portrait',
            margins = { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
            printBackground = true,
            scale = 1,
        } = options;

        const browser = await this.getBrowser();
        const page = await browser.newPage();

        try {
            // Set viewport for consistent rendering
            await page.setViewport({
                width: 1200,
                height: 1600,
                deviceScaleFactor: 2,
            });

            // Create complete HTML document with proper CSS
            const fullHtml = this.createFullHtmlDocument(contractHtml, baseUrl);

            // Set content and wait for everything to load
            await page.setContent(fullHtml, {
                waitUntil: ['networkidle0', 'domcontentloaded'],
            });

            // Wait for fonts and images to load
            await page.evaluateHandle('document.fonts.ready');
            await this.waitForImages(page);

            // Generate PDF with optimal settings
            const pdfBuffer = await page.pdf({
                format,
                landscape: orientation === 'landscape',
                margin: margins,
                printBackground,
                scale,
                preferCSSPageSize: true,
                displayHeaderFooter: false,
            });

            return pdfBuffer;
        } finally {
            await page.close();
        }
    }

    private createFullHtmlDocument(contractHtml: string, baseUrl: string): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contract</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @page {
            size: A4;
            margin: 20mm;
        }
        
        * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        
        body {
            font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background: white;
        }
        
        .contract-container {
            max-width: 210mm;
            margin: 0 auto;
            background: white;
            box-shadow: none;
        }
        
        /* Ensure gradients and colors print correctly */
        .bg-gradient-to-r,
        .bg-gradient-to-br {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        
        /* Fix for responsive grid in PDF */
        .grid-cols-1.md\\:grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
        
        /* Ensure proper spacing and layout */
        .space-y-6 > * + * {
            margin-top: 1.5rem !important;
        }
        
        .space-y-3 > * + * {
            margin-top: 0.75rem !important;
        }
        
        .space-y-2 > * + * {
            margin-top: 0.5rem !important;
        }
        
        /* Fix flex layouts for PDF */
        .flex {
            display: flex !important;
        }
        
        .items-center {
            align-items: center !important;
        }
        
        .justify-between {
            justify-content: space-between !important;
        }
        
        /* Ensure borders and rounded corners work */
        .rounded-lg {
            border-radius: 0.5rem !important;
        }
        
        .border {
            border-width: 1px !important;
        }
        
        /* Typography fixes */
        .text-xl {
            font-size: 1.25rem !important;
            line-height: 1.75rem !important;
        }
        
        .text-lg {
            font-size: 1.125rem !important;
            line-height: 1.75rem !important;
        }
        
        .text-sm {
            font-size: 0.875rem !important;
            line-height: 1.25rem !important;
        }
        
        .font-bold {
            font-weight: 700 !important;
        }
        
        .font-semibold {
            font-weight: 600 !important;
        }
        
        /* Page break controls */
        .page-break-before {
            page-break-before: always;
        }
        
        .page-break-after {
            page-break-after: always;
        }
        
        .avoid-break-inside {
            page-break-inside: avoid;
        }
    </style>
</head>
<body>
    <div class="contract-container">
        ${contractHtml}
    </div>
</body>
</html>`;
    }

    private async waitForImages(page: Page): Promise<void> {
        await page.evaluate(() => {
            return Promise.all(
                Array.from(document.images, (img) => {
                    if (img.complete) return Promise.resolve();
                    return new Promise((resolve, reject) => {
                        img.addEventListener('load', resolve);
                        img.addEventListener('error', reject);
                    });
                }),
            );
        });
    }

    async cleanup(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}

// Export singleton instance
export const pdfService = PDFService.getInstance();
