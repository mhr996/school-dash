-- Migration: Unify Service Profile Pictures
-- Date: 2025-10-21
-- Description: Standardize profile picture field names across all service tables
-- All services will use 'profile_picture_path' for consistency

-- =========================================
-- STEP 1: Add missing profile_picture_path columns
-- =========================================

-- Security Companies (missing entirely)
ALTER TABLE public.security_companies
ADD COLUMN IF NOT EXISTS profile_picture_path TEXT;

-- Travel Companies (missing entirely)
ALTER TABLE public.travel_companies
ADD COLUMN IF NOT EXISTS profile_picture_path TEXT;

-- =========================================
-- STEP 2: Rename existing inconsistent columns
-- =========================================

-- Education Programs: image -> profile_picture_path
ALTER TABLE public.education_programs
RENAME COLUMN image TO profile_picture_path;

-- External Entertainment Companies: image -> profile_picture_path
ALTER TABLE public.external_entertainment_companies
RENAME COLUMN image TO profile_picture_path;

-- Guides: profile_picture_url -> profile_picture_path
ALTER TABLE public.guides
RENAME COLUMN profile_picture_url TO profile_picture_path;

-- Paramedics: profile_picture_url -> profile_picture_path
ALTER TABLE public.paramedics
RENAME COLUMN profile_picture_url TO profile_picture_path;

-- Destinations: Keep thumbnail_path as is (destinations have multiple images via gallery)
-- No change needed for destinations

-- =========================================
-- STEP 3: Add comments for documentation
-- =========================================

COMMENT ON COLUMN public.guides.profile_picture_path IS 'Storage path: services/guides/{id}/profile.{ext}';
COMMENT ON COLUMN public.paramedics.profile_picture_path IS 'Storage path: services/paramedics/{id}/profile.{ext}';
COMMENT ON COLUMN public.security_companies.profile_picture_path IS 'Storage path: services/security_companies/{id}/profile.{ext}';
COMMENT ON COLUMN public.external_entertainment_companies.profile_picture_path IS 'Storage path: services/entertainment/{id}/profile.{ext}';
COMMENT ON COLUMN public.travel_companies.profile_picture_path IS 'Storage path: services/travel_companies/{id}/profile.{ext}';
COMMENT ON COLUMN public.education_programs.profile_picture_path IS 'Storage path: services/education_programs/{id}/profile.{ext}';

-- =========================================
-- SUMMARY OF CHANGES
-- =========================================
-- All service tables now have a consistent 'profile_picture_path' column:
-- ✓ guides.profile_picture_path
-- ✓ paramedics.profile_picture_path
-- ✓ security_companies.profile_picture_path
-- ✓ external_entertainment_companies.profile_picture_path
-- ✓ travel_companies.profile_picture_path
-- ✓ education_programs.profile_picture_path
-- 
-- Storage structure: services/{service_type}/{service_id}/profile.{ext}
-- Examples:
-- - services/guides/123e4567-e89b-12d3-a456-426614174000/profile.png
-- - services/paramedics/123e4567-e89b-12d3-a456-426614174001/profile.jpg
-- - services/security_companies/123e4567-e89b-12d3-a456-426614174002/profile.webp
