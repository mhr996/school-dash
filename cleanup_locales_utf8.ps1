# UTF-8 Safe Locale Cleanup Script
# This script removes car and deal related strings while preserving UTF-8 encoding

$files = @(
    ".\public\locales\en.json",
    ".\public\locales\ae.json", 
    ".\public\locales\he.json"
)

# Regex patterns for car/deal strings
$regexPatterns = @(
    '"car_[^"]*"\s*:\s*"[^"]*"[,]?',
    '"deal_[^"]*"\s*:\s*"[^"]*"[,]?'
)

# Specific strings to remove
$stringsToRemove = @(
    'selling_price_from',
    'selling_price_to',
    'sales',
    'car',
    'cars',
    'deal', 
    'deals',
    'create_deal',
    'edit_deal',
    'delete_deal',
    'select_deal',
    'loading_deals',
    'no_deals_available', 
    'associated_deal',
    'new_cars',
    'used_cars', 
    'luxury_cars',
    'add_cars_to_category_description',
    'error_removing_car',
    'error_loading_cars',
    'remove_car',
    'error_creating_car',
    'total_cars',
    'total_deals',
    'sales_deals_chart',
    'deals_by_type',
    'manage_cars',
    'add_edit_cars', 
    'cars_added',
    'select_car',
    'Dream Car',
    'search_cars',
    'add_car',
    'confirm_delete_selected_deals',
    'confirm_delete_selected_cars',
    'error_adding_deal',
    'error_updating_deal', 
    'error_deleting_deal',
    'confirm_delete_deal',
    'sale_deal_for',
    'edit_deal',
    'purchase',
    'select_deal_type',
    'enter_deal_title',
    'enter_deal_description',
    'create_deal_description',
    'update_deal_description',
    'select_deal_date_desc',
    'suggested_selling_price',
    'enter_deal_notes',
    'sale_deal_description',
    'select_deal_type_desc',
    'upload_car_license_desc',
    'top_selling',
    'select_car_status', 
    'upload_car_images_info',
    'add_car_to',
    'enter_car_description',
    'add_car_features_description',
    'select_deal_status',
    'select_deal_status_desc',
    # Additional strings found in verification
    'no_car',
    'intermediary_car_commission',
    'error_loading_deals',
    'error_updating_car_visibility',
    'add_new_car',
    'edit_car',
    'enter_car_title',
    'enter_car_status',
    'error_adding_car',
    'error_updating_car',
    'error_deleting_car',
    'confirm_delete_car',
    'create_car',
    'update_car',
    'back_to_cars',
    'create_car_listing',
    'update_car_information',
    'enter_car_number',
    'add_new_deal',
    'company_commission_deal_description',
    'intermediary_deal_description',
    'intermediary_deal_for',
    'no_cars_in_category',
    'upload_deal_documents_desc',
    'customer_car_evaluation',
    'customer_car_eval_value',
    'new_car_price',
    'old_car_value',
    'automate_bill_for_deal',
    'update_deal',
    'available_cars',
    'archived_cars',
    'create_new_deal',
    'manage_deals'
)

foreach ($filePath in $files) {
    if (Test-Path $filePath) {
        Write-Host "Cleaning $filePath..." -ForegroundColor Yellow
        
        # Read file with UTF-8 encoding
        $content = Get-Content -Path $filePath -Encoding UTF8 -Raw
        $originalLineCount = ($content -split "`n").Count
        $removedLines = 0
        
        # Remove regex patterns
        foreach ($pattern in $regexPatterns) {
            $matches = [regex]::Matches($content, $pattern, [System.Text.RegularExpressions.RegexOptions]::Multiline)
            foreach ($match in $matches) {
                Write-Host "Removing line (regex): $($match.Value.Trim())" -ForegroundColor Red
                $removedLines++
            }
            $content = [regex]::Replace($content, $pattern, '', [System.Text.RegularExpressions.RegexOptions]::Multiline)
        }
        
        # Remove specific strings
        foreach ($stringKey in $stringsToRemove) {
            $pattern = '^\s*"' + [regex]::Escape($stringKey) + '"\s*:\s*"[^"]*"[,]?\s*$'
            $matches = [regex]::Matches($content, $pattern, [System.Text.RegularExpressions.RegexOptions]::Multiline)
            foreach ($match in $matches) {
                Write-Host "Removing line (specific): $($match.Value.Trim())" -ForegroundColor Red
                $removedLines++
            }
            $content = [regex]::Replace($content, $pattern, '', [System.Text.RegularExpressions.RegexOptions]::Multiline)
        }
        
        # Clean up extra commas and empty lines
        $content = $content -replace ',(\s*[}\]])', '$1'  # Remove trailing commas
        $content = $content -replace '\n\s*\n', "`n"      # Remove extra empty lines
        
        # Write file back with UTF-8 encoding (no BOM)
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($filePath, $content, $utf8NoBom)
        
        $newLineCount = ($content -split "`n").Count
        Write-Host "Cleaned $filePath - Removed $removedLines lines" -ForegroundColor Green
    }
}

Write-Host "Cleanup completed!" -ForegroundColor Green
