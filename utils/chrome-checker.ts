import { execSync } from 'child_process';
import * as fs from 'fs';

export class ChromeChecker {
    private static chromePaths = [
        // Linux paths
        '/usr/bin/google-chrome-stable',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/snap/bin/chromium',
        '/usr/local/bin/chrome',
        '/usr/local/bin/chromium',

        // macOS paths
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',

        // Windows paths
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Users\\%USERNAME%\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',
    ];

    static findChrome(): string | null {
        // First try to find Chrome using which/where command
        try {
            if (process.platform === 'win32') {
                const result = execSync('where chrome', { encoding: 'utf8' }).trim();
                if (result && fs.existsSync(result)) {
                    return result;
                }
            } else {
                const result = execSync('which google-chrome-stable || which google-chrome || which chromium-browser || which chromium', { encoding: 'utf8' }).trim();
                if (result && fs.existsSync(result)) {
                    return result;
                }
            }
        } catch (e) {
            // Command failed, continue with manual search
        }

        // Fallback to checking known paths
        for (const path of this.chromePaths) {
            try {
                const expandedPath = path.replace('%USERNAME%', process.env.USERNAME || '');
                if (fs.existsSync(expandedPath)) {
                    return expandedPath;
                }
            } catch (e) {
                continue;
            }
        }

        return null;
    }

    static async checkPuppeteerChrome(): Promise<string | null> {
        try {
            const puppeteer = require('puppeteer');
            // Try to get the bundled Chromium path
            if (puppeteer.executablePath) {
                const execPath = puppeteer.executablePath();
                if (fs.existsSync(execPath)) {
                    return execPath;
                }
            }
        } catch (e) {
            // Puppeteer not available or doesn't have bundled Chromium
        }
        return null;
    }

    static async getBestChromePath(): Promise<string | null> {
        // First check if there's an environment variable set
        if (process.env.PUPPETEER_EXECUTABLE_PATH) {
            const envPath = process.env.PUPPETEER_EXECUTABLE_PATH;
            if (fs.existsSync(envPath)) {
                return envPath;
            } else {
                console.warn(`PUPPETEER_EXECUTABLE_PATH is set but file doesn't exist: ${envPath}`);
            }
        }

        // Then try system Chrome
        const systemChrome = this.findChrome();
        if (systemChrome) {
            return systemChrome;
        }

        // Finally try Puppeteer's bundled Chromium
        const puppeteerChrome = await this.checkPuppeteerChrome();
        if (puppeteerChrome) {
            return puppeteerChrome;
        }

        return null;
    }
}
