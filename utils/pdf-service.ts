import puppeteer, { Browser, Page } from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

// Function to get local Chrome path for development
async function getLocalChromePath(): Promise<string | undefined> {
    const { execSync } = require('child_process');

    try {
        // Windows paths
        const windowsPaths = [
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
        ];

        for (const path of windowsPaths) {
            const fs = require('fs');
            if (fs.existsSync(path)) {
                return path;
            }
        }

        // Try to find Chrome using where command on Windows
        if (process.platform === 'win32') {
            try {
                const result = execSync('where chrome', { encoding: 'utf8' });
                return result.trim().split('\n')[0];
            } catch (e) {
                // Chrome not found in PATH
            }
        }

        // macOS paths
        if (process.platform === 'darwin') {
            const macPaths = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium'];
            for (const path of macPaths) {
                const fs = require('fs');
                if (fs.existsSync(path)) {
                    return path;
                }
            }
        }

        // Linux paths
        if (process.platform === 'linux') {
            const linuxPaths = ['/usr/bin/google-chrome-stable', '/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium'];
            for (const path of linuxPaths) {
                const fs = require('fs');
                if (fs.existsSync(path)) {
                    return path;
                }
            }
        }
    } catch (error) {
        console.warn('Error finding local Chrome:', error);
    }

    return undefined;
}

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
            console.log('Launching browser with puppeteer-core...');

            const isServerless = !!(process.env.AWS_EXECUTION_ENV || process.env.VERCEL);
            let executablePath: string;

            if (isServerless) {
                try {
                    console.log('Configuring serverless Chromium...');
                    console.log('Environment variables:');
                    console.log('- VERCEL:', process.env.VERCEL);
                    console.log('- AWS_EXECUTION_ENV:', process.env.AWS_EXECUTION_ENV);
                    console.log('- process.cwd():', process.cwd());

                    // Debug: check if Chromium bin directory is present
                    const fs = require('fs');
                    const path = require('path');

                    // Check multiple possible locations
                    const possiblePaths = [
                        path.join(process.cwd(), 'node_modules', '@sparticuz', 'chromium', 'bin'),
                        path.join('/', 'var', 'task', 'node_modules', '@sparticuz', 'chromium', 'bin'),
                        path.join('/', 'vercel', 'path0', 'node_modules', '@sparticuz', 'chromium', 'bin'),
                        path.join('/', 'tmp', 'node_modules', '@sparticuz', 'chromium', 'bin'),
                    ];

                    for (const checkPath of possiblePaths) {
                        console.log(`Checking Chromium bin directory: ${checkPath} exists: ${fs.existsSync(checkPath)}`);
                        if (fs.existsSync(checkPath)) {
                            console.log(`Chromium bin files in ${checkPath}:`, fs.readdirSync(checkPath));
                        }
                    }

                    // Check if @sparticuz/chromium package is available
                    try {
                        const chromiumPath = require.resolve('@sparticuz/chromium');
                        console.log('@sparticuz/chromium resolved to:', chromiumPath);

                        // Check if bin directory exists relative to the package
                        const packageDir = path.dirname(chromiumPath);
                        const binDir = path.join(packageDir, 'bin');
                        console.log('Package bin directory:', binDir, 'exists:', fs.existsSync(binDir));
                        if (fs.existsSync(binDir)) {
                            console.log('Package bin files:', fs.readdirSync(binDir));
                        }
                    } catch (e) {
                        console.log('Failed to resolve @sparticuz/chromium:', e);
                    }

                    // Try to configure with custom path if we found bin directory
                    let foundBinPath = null;
                    for (const checkPath of possiblePaths) {
                        if (fs.existsSync(checkPath)) {
                            foundBinPath = checkPath;
                            break;
                        }
                    }

                    if (foundBinPath) {
                        console.log('Found Chromium bin directory at:', foundBinPath);
                        // Set the path for @sparticuz/chromium
                        process.env.CHROMIUM_BIN_PATH = foundBinPath;
                    }

                    // Use default path without specifying /tmp
                    executablePath = await chromium.executablePath();

                    console.log('Using serverless Chromium at:', executablePath);
                } catch (chromiumError) {
                    console.error('Failed to configure @sparticuz/chromium:', chromiumError);
                    throw new Error(`Serverless Chromium configuration failed: ${chromiumError instanceof Error ? chromiumError.message : String(chromiumError)}`);
                }
            } else {
                // Use local Chrome for development
                const localChrome = await getLocalChromePath();
                if (!localChrome) {
                    throw new Error('No Chrome installation found. Please install Google Chrome for development.');
                }
                executablePath = localChrome;
                console.log('Using local Chrome:', executablePath);
            }

            const launchOptions: any = {
                args: isServerless
                    ? chromium.args
                    : [
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
                executablePath,
                headless: true,
                defaultViewport: { width: 1280, height: 720 },
                ignoreHTTPSErrors: true,
            };

            console.log('Browser launch options:', {
                executablePath: launchOptions.executablePath,
                headless: launchOptions.headless,
                argsCount: launchOptions.args.length,
                isServerless,
            });

            try {
                this.browser = await puppeteer.launch(launchOptions);
                console.log('Browser launched successfully');
            } catch (error) {
                console.error('Failed to launch browser:', error);
                throw new Error(`Failed to launch browser: ${error instanceof Error ? error.message : String(error)}`);
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
