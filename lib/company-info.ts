import supabase from './supabase';

export interface CompanyInfo {
    id?: string;
    name: string;
    logo_url?: string;
    address?: string;
    phone?: string;
    tax_number?: string;
    created_at?: string;
    updated_at?: string;
}

/**
 * Fetch company information from the database
 * @returns Promise<CompanyInfo> - Company information with fallback defaults
 */
export const getCompanyInfo = async (): Promise<CompanyInfo> => {
    try {
        const { data, error } = await supabase.from('company_settings').select('*').limit(1).single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching company info:', error);
            // Return default company info if error
            return getDefaultCompanyInfo();
        }

        if (data) {
            return data;
        }

        return getDefaultCompanyInfo();
    } catch (error) {
        console.error('Error fetching company info:', error);
        return getDefaultCompanyInfo();
    }
};

/**
 * Get default company information when database is not available
 * @returns CompanyInfo - Default company information
 */
export const getDefaultCompanyInfo = (): CompanyInfo => {
    return {
        name: 'Car Dealership',
        logo_url: '/assets/images/logo.png',
        address: '',
        phone: '',
        tax_number: '',
    };
};

/**
 * Get company info specifically for PDF contracts with proper formatting
 * @returns Promise<CompanyInfo> - Formatted company information for contracts
 */
export const getCompanyInfoForContract = async (): Promise<CompanyInfo> => {
    const companyInfo = await getCompanyInfo();

    // Ensure we have fallback values for contract generation
    return {
        ...companyInfo,
        name: companyInfo.name || 'Car Dealership',
        logo_url: companyInfo.logo_url || '/assets/images/logo.png',
        address: companyInfo.address || '',
        phone: companyInfo.phone || '',
        tax_number: companyInfo.tax_number || '',
    };
};
