const cookieObj = typeof window === 'undefined' ? require('next/headers') : require('universal-cookie');

import en from './public/locales/en.json';
import ae from './public/locales/ae.json';
import he from './public/locales/he.json';

const langObj: any = { en, ae, he };

// Get language - returns default on server during SSR
const getLang = () => {
    if (typeof window !== 'undefined') {
        const cookies = new cookieObj(null, { path: '/' });
        let lang = cookies.get('i18nextLng');

        // If no language cookie is set, set Hebrew as default
        if (!lang) {
            cookies.set('i18nextLng', 'he');
            lang = 'he';
        }
        return lang;
    }
    // Return default for server-side (will be hydrated on client)
    return 'he';
};

// Synchronous version for client components
export const getTranslation = () => {
    const lang = getLang();
    const defaultLang = 'he'; // Set Hebrew as default
    const currentLang = lang || defaultLang;
    const data: any = langObj[currentLang];

    const t = (key: string) => {
        return data[key] ? data[key] : key;
    };

    const initLocale = (themeLocale: string) => {
        const lang = getLang();
        i18n.changeLanguage(lang || themeLocale || defaultLang);
    };

    const i18n = {
        language: currentLang,
        changeLanguage: (lang: string) => {
            if (typeof window !== 'undefined') {
                const cookies = new cookieObj(null, { path: '/' });
                cookies.set('i18nextLng', lang);
            }
        },
    };

    return { t, i18n, initLocale };
};
