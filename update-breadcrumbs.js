#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration for different page types and their breadcrumb settings
const pageConfigs = [
    // Add pages
    { pattern: /app\/\(defaults\)\/([^\/]+)\/add\/page\.tsx$/, type: 'add', action: 'add_' },
    // Edit pages
    { pattern: /app\/\(defaults\)\/([^\/]+)\/edit\/\[id\]\/page\.tsx$/, type: 'edit', action: 'edit_' },
    // Preview pages
    { pattern: /app\/\(defaults\)\/([^\/]+)\/preview\/\[id\]\/page\.tsx$/, type: 'preview', action: 'view_' },
];

// Section name mappings for translation keys
const sectionMappings = {
    users: 'users',
    schools: 'schools',
    destinations: 'destinations',
    zones: 'zones',
    guides: 'guides',
    paramedics: 'paramedics',
    'security-companies': 'security_companies',
    'travel-companies': 'travel_companies',
    'external-entertainment-companies': 'external_entertainment_companies',
    'education-programs': 'education_programs',
    'trip-plans': 'trip_plans',
};

function getActionLabel(section, type) {
    const baseSection = sectionMappings[section] || section;

    switch (type) {
        case 'add':
            return `add_new_${baseSection.replace(/-/g, '_').slice(0, -1)}`; // remove 's' and add 'add_new_'
        case 'edit':
            return `edit_${baseSection.replace(/-/g, '_').slice(0, -1)}`;
        case 'preview':
            return `view_${baseSection.replace(/-/g, '_').slice(0, -1)}`;
        default:
            return `${type}_${baseSection.replace(/-/g, '_')}`;
    }
}

function updatePageBreadcrumb(filePath, section, type) {
    console.log(`Updating ${filePath}...`);

    let content = fs.readFileSync(filePath, 'utf8');

    // Add PageBreadcrumb import if not present
    if (!content.includes("import PageBreadcrumb from '@/components/layouts/page-breadcrumb'")) {
        // Find a good place to insert the import
        const importLines = content.split('\n');
        let insertIndex = -1;

        for (let i = 0; i < importLines.length; i++) {
            if (importLines[i].includes('import') && importLines[i].includes('@/')) {
                insertIndex = i + 1;
            }
        }

        if (insertIndex !== -1) {
            importLines.splice(insertIndex, 0, "import PageBreadcrumb from '@/components/layouts/page-breadcrumb';");
            content = importLines.join('\n');
        }
    }

    // Generate breadcrumb configuration
    const backUrl = `/${section}`;
    const sectionLabel = `t('${sectionMappings[section] || section}')`;
    const actionLabel = `t('${getActionLabel(section, type)}')`;

    const breadcrumbCode = `            <PageBreadcrumb 
                section="${section}"
                backUrl="${backUrl}"
                items={[
                    { label: t('home'), href: '/' },
                    { label: ${sectionLabel}, href: '${backUrl}' },
                    { label: ${actionLabel} }
                ]}
            />`;

    console.log(`Generated breadcrumb for ${section}/${type}:`);
    console.log(breadcrumbCode);

    return content;
}

// Find all relevant page files
function findPageFiles() {
    const basePath = 'c:\\Users\\Maher\\Desktop\\tcps\\school-dash';
    const files = [];

    function walkDir(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                walkDir(fullPath);
            } else if (entry.name === 'page.tsx') {
                const relativePath = path.relative(basePath, fullPath);

                // Check if this matches any of our patterns
                for (const config of pageConfigs) {
                    const match = relativePath.match(config.pattern);
                    if (match) {
                        files.push({
                            filePath: fullPath,
                            section: match[1],
                            type: config.type,
                            relativePath,
                        });
                        break;
                    }
                }
            }
        }
    }

    try {
        walkDir(path.join(basePath, 'app', '(defaults)'));
    } catch (error) {
        console.error('Error walking directory:', error);
    }

    return files;
}

// Main execution
console.log('Finding all page files...');
const pageFiles = findPageFiles();

console.log(`Found ${pageFiles.length} page files to update:`);
pageFiles.forEach((file) => {
    console.log(`- ${file.relativePath} (${file.section}/${file.type})`);
});

console.log('\nThis script would update these files. Run manually for now.');

module.exports = { pageConfigs, updatePageBreadcrumb, findPageFiles };
