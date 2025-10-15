-- Migration: Add profile_picture_url to guides and paramedics tables
-- Date: 2025-10-15
-- Description: Adds profile picture URL field to guides and paramedics for storing service provider profile images

-- Add profile_picture_url to guides table
ALTER TABLE public.guides
ADD COLUMN IF NOT EXISTS profile_picture_url text;

-- Add profile_picture_url to paramedics table
ALTER TABLE public.paramedics
ADD COLUMN IF NOT EXISTS profile_picture_url text;

-- Add comments to document the columns
COMMENT ON COLUMN public.guides.profile_picture_url IS 'URL/path to the guide profile picture stored in services bucket';
COMMENT ON COLUMN public.paramedics.profile_picture_url IS 'URL/path to the paramedic profile picture stored in services bucket';
