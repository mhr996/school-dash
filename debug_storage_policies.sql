-- Debug script: Check and fix destinations storage policies
-- Run this in your Supabase SQL Editor

-- 1. Check if destinations bucket exists
SELECT * FROM storage.buckets WHERE id = 'destinations';

-- 2. Check current policies on storage.objects for destinations bucket
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects' 
  AND policyname ILIKE '%destinations%';

-- 3. If policies are missing, create them manually:

-- Drop existing policies first (in case they exist but are incorrect)
DROP POLICY IF EXISTS "Allow public read access to destinations" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload to destinations" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update to destinations" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete from destinations" ON storage.objects;

-- Create correct policies
CREATE POLICY "Allow public read access to destinations"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'destinations');

CREATE POLICY "Allow authenticated upload to destinations"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'destinations');

CREATE POLICY "Allow authenticated update to destinations"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'destinations')
  WITH CHECK (bucket_id = 'destinations');

CREATE POLICY "Allow authenticated delete from destinations"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'destinations');

-- 4. Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects' 
  AND policyname ILIKE '%destinations%';