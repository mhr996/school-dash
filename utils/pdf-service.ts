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
            console.log('Launching browser with regular puppeteer...');

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
                ],
            };

            // Try to find Chrome installation
            try {
                const chromePath = await ChromeChecker.getBestChromePath();
                if (chromePath) {
                    launchOptions.executablePath = chromePath;
                    console.log(`Using Chrome at: ${chromePath}`);
                }
            } catch (e) {
                console.log('Using Puppeteer bundled Chromium');
            }

            try {
                this.browser = await puppeteer.launch(launchOptions);
                console.log('Browser launched successfully');
            } catch (error) {
                console.error('Failed to launch browser:', error);

                // Fallback: try without executablePath
                try {
                    const fallbackOptions = { ...launchOptions };
                    delete fallbackOptions.executablePath;
                    this.browser = await puppeteer.launch(fallbackOptions);
                    console.log('Browser launched with fallback options');
                } catch (fallbackError) {
                    throw new Error(`Failed to launch browser: ${error}`);
                }
            }
        }

        return this.browser!;
    }

    async generateContractPDF(options: ContractPDFOptions): Promise<Uint8Array> {
        const {
            contractHtml,
            format = 'A4',
            orientation = 'portrait',
            margins = {
                top: '1cm',
                right: '1cm',
                bottom: '1cm',
                left: '1cm',
            },
            printBackground = true,
            scale = 1,
        } = options;

        const browser = await this.getBrowser();
        const page = await browser.newPage();

        try {
            // Set viewport for consistent rendering
            await page.setViewport({ width: 1200, height: 800 });

            // Load the HTML content
            await page.setContent(contractHtml, { waitUntil: 'networkidle0' });

            // Generate PDF
            const pdfBuffer = await page.pdf({
                format,
                landscape: orientation === 'landscape',
                margin: margins,
                printBackground,
                scale,
                preferCSSPageSize: true,
            });

            return new Uint8Array(pdfBuffer);
        } finally {
            await page.close();
        }
    }

    async generateFromContract(contractData: any): Promise<Uint8Array> {
        // This is a placeholder - you should implement the actual contract HTML generation
        const contractHtml = `
            <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; }
                        .contract { padding: 20px; }
                    </style>
                </head>
                <body>
                    <div class="contract">
                        <h1>Contract</h1>
                        <p>Contract details would go here...</p>
                    </div>
                </body>
            </html>
        `;

        return this.generateContractPDF({ contractHtml });
    }

    async cleanup(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}
