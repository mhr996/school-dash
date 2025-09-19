-- Using existing zones from your database
-- Available zones:
-- '0dc55a08-a7a6-428f-9cca-45772fb208eb' - الجنوب
-- '3125ce4d-71c8-49d0-9e49-6fa2d38f0571' - حيفا وضواحيها  
-- '49da5aed-5a4b-499e-9bc5-f78f3903b3e2' - العربة
-- '5e97fabc-ca22-404b-aa18-77274e2a2386' - ايلات
-- '6c89e4d4-d39b-4a8a-8bcc-c0cf40a3ddd5' - المركز
-- 'b1ea113d-81ea-4560-b1e3-258f9b42bd25' - الجولان وضواحيها
-- 'bd96e54b-aca2-42dd-8bfd-0d7b8e83d52f' - المثلث
-- 'ce9df9a7-fbdd-40ed-83d8-50556e1afdf4' - الناصره وضواحيها
-- 'f8be4e86-9b8a-450a-9bce-07a90dfe8e67' - البحر الميت

-- Now let's add comprehensive dummy destinations
WITH zone_data AS (
    SELECT id, name FROM zones WHERE is_active = true
),
dummy_destinations AS (
    SELECT * FROM (VALUES
        -- Museum of Science & Technology
        (
            'Science & Technology Museum',
            '123 Innovation Street, Tech District',
            '+1-555-MUSEUM',
            'An interactive museum featuring cutting-edge technology exhibits, hands-on science experiments, and educational programs for all ages.',
            ARRAY['indoor_activities', 'educational_value', 'accessibility', 'parking_available', 'restroom_facilities', 'gift_shop', 'guided_tours', 'audio_guides', 'wheelchair_accessible', 'group_discounts'],
            ARRAY['guides', 'external_entertainment_companies'],
            ARRAY['elementary', 'high_school', 'college', 'families', 'teachers'],
            '{"child": 15, "teen": 18, "adult": 25, "guide": 40}',
            'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop'
        ),
        -- Adventure Park
        (
            'Adventure Park & Outdoor Center',
            '456 Forest Road, Green Valley',
            '+1-555-ADVENTURE',
            'Thrilling outdoor adventure park with zip lines, rock climbing, hiking trails, and team-building activities surrounded by beautiful nature.',
            ARRAY['outdoor_activities', 'entertainment_value', 'natural_beauty', 'parking_available', 'restroom_facilities', 'food_services'],
            ARRAY['paramedics', 'guides', 'security_companies'],
            ARRAY['high_school', 'college', 'families'],
            '{"child": 30, "teen": 35, "adult": 40, "guide": 50}',
            'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=400&fit=crop'
        ),
        -- Historical Castle
        (
            'Royal Heritage Castle',
            '789 Castle Hill, Old Town',
            '+1-555-CASTLE',
            'A magnificent medieval castle with rich history, royal artifacts, beautiful gardens, and guided tours through ancient halls and chambers.',
            ARRAY['indoor_activities', 'educational_value', 'historical_significance', 'accessibility', 'parking_available', 'restroom_facilities', 'gift_shop', 'guided_tours', 'wheelchair_accessible'],
            ARRAY['guides'],
            ARRAY['kindergarten', 'elementary', 'high_school', 'college', 'families', 'teachers'],
            '{"child": 12, "teen": 15, "adult": 20, "guide": 35}',
            'https://images.unsplash.com/photo-1520637836862-4d197d17c35a?w=400&h=400&fit=crop'
        ),
        -- Beach Resort
        (
            'Sunny Beach Resort & Water Park',
            '321 Ocean Drive, Coastal City',
            '+1-555-BEACH',
            'Beautiful beachfront resort featuring water slides, swimming pools, beach activities, restaurants, and accommodation facilities.',
            ARRAY['outdoor_activities', 'entertainment_value', 'natural_beauty', 'parking_available', 'restroom_facilities', 'food_services', 'wheelchair_accessible'],
            ARRAY['paramedics', 'security_companies'],
            ARRAY['kindergarten', 'elementary', 'high_school', 'families'],
            '{"child": 25, "teen": 30, "adult": 35, "guide": 45}',
            'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop'
        ),
        -- Nature Reserve
        (
            'Mountain Wildlife Reserve',
            '654 Mountain Trail, Highland Area',
            '+1-555-NATURE',
            'Protected wildlife reserve with diverse ecosystems, hiking trails, bird watching opportunities, and educational nature programs.',
            ARRAY['outdoor_activities', 'educational_value', 'natural_beauty', 'parking_available', 'restroom_facilities', 'guided_tours', 'group_discounts'],
            ARRAY['guides'],
            ARRAY['elementary', 'high_school', 'college', 'families', 'teachers'],
            '{"child": 10, "teen": 12, "adult": 15, "guide": 30}',
            'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=400&fit=crop'
        ),
        -- Art Gallery
        (
            'Contemporary Arts Gallery',
            '987 Arts Boulevard, Cultural District',
            '+1-555-GALLERY',
            'Modern art gallery showcasing contemporary works, interactive installations, and rotating exhibitions from local and international artists.',
            ARRAY['indoor_activities', 'educational_value', 'accessibility', 'parking_available', 'restroom_facilities', 'gift_shop', 'guided_tours', 'audio_guides', 'wheelchair_accessible'],
            ARRAY['guides'],
            ARRAY['high_school', 'college', 'families', 'teachers'],
            '{"child": 8, "teen": 12, "adult": 18, "guide": 25}',
            'https://images.unsplash.com/photo-1536924430914-91f9e2041b83?w=400&h=400&fit=crop'
        ),
        -- Theme Park
        (
            'Fantasy World Theme Park',
            '147 Magic Lane, Entertainment City',
            '+1-555-FANTASY',
            'Magical theme park with thrilling rides, live shows, character meet-and-greets, themed restaurants, and family entertainment.',
            ARRAY['outdoor_activities', 'entertainment_value', 'parking_available', 'restroom_facilities', 'food_services', 'gift_shop', 'wheelchair_accessible', 'group_discounts'],
            ARRAY['paramedics', 'security_companies', 'external_entertainment_companies'],
            ARRAY['kindergarten', 'elementary', 'families'],
            '{"child": 45, "teen": 50, "adult": 55, "guide": 65}',
            'https://images.unsplash.com/photo-1594736797933-d0401ba2bdf9?w=400&h=400&fit=crop'
        ),
        -- Botanical Garden
        (
            'Royal Botanical Gardens',
            '258 Garden Avenue, Green District',
            '+1-555-GARDEN',
            'Expansive botanical gardens featuring rare plants, themed garden sections, greenhouse tours, and peaceful walking paths.',
            ARRAY['outdoor_activities', 'educational_value', 'natural_beauty', 'accessibility', 'parking_available', 'restroom_facilities', 'food_services', 'guided_tours', 'wheelchair_accessible'],
            ARRAY['guides'],
            ARRAY['kindergarten', 'elementary', 'high_school', 'college', 'families', 'teachers'],
            '{"child": 8, "teen": 10, "adult": 14, "guide": 20}',
            'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop'
        ),
        -- Aquarium
        (
            'Ocean Life Aquarium',
            '369 Marine Street, Harbor District',
            '+1-555-AQUARIUM',
            'State-of-the-art aquarium with diverse marine life exhibits, interactive touch pools, educational programs, and underwater tunnel experience.',
            ARRAY['indoor_activities', 'educational_value', 'entertainment_value', 'accessibility', 'parking_available', 'restroom_facilities', 'food_services', 'gift_shop', 'guided_tours', 'wheelchair_accessible'],
            ARRAY['guides', 'external_entertainment_companies'],
            ARRAY['kindergarten', 'elementary', 'high_school', 'families', 'teachers'],
            '{"child": 20, "teen": 24, "adult": 28, "guide": 40}',
            'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=400&h=400&fit=crop'
        ),
        -- Industrial Museum
        (
            'Heritage Industrial Museum',
            '741 Factory Row, Industrial Quarter',
            '+1-555-INDUSTRY',
            'Educational museum showcasing industrial heritage, vintage machinery, manufacturing processes, and the evolution of technology.',
            ARRAY['indoor_activities', 'educational_value', 'historical_significance', 'accessibility', 'parking_available', 'restroom_facilities', 'gift_shop', 'guided_tours', 'wheelchair_accessible', 'group_discounts'],
            ARRAY['guides'],
            ARRAY['high_school', 'college', 'teachers'],
            '{"child": 12, "teen": 15, "adult": 18, "guide": 30}',
            'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=400&fit=crop'
        )
    ) AS t(name, address, phone, description, properties, requirements, suitable_for, pricing_json, thumbnail_path)
)
INSERT INTO destinations (
    id, 
    name, 
    address, 
    phone, 
    zone_id, 
    description, 
    properties, 
    requirements, 
    suitable_for, 
    pricing,
    thumbnail_path,
    gallery_paths,
    is_active,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    dd.name,
    dd.address,
    dd.phone,
    (SELECT id FROM zone_data ORDER BY RANDOM() LIMIT 1),
    dd.description,
    to_jsonb(dd.properties),
    to_jsonb(dd.requirements),
    dd.suitable_for,
    dd.pricing_json::jsonb,
    dd.thumbnail_path,
    CASE 
        WHEN dd.name = 'Science & Technology Museum' THEN ARRAY[
            'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop'
        ]
        WHEN dd.name = 'Adventure Park & Outdoor Center' THEN ARRAY[
            'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop'
        ]
        WHEN dd.name = 'Royal Heritage Castle' THEN ARRAY[
            'https://images.unsplash.com/photo-1520637836862-4d197d17c35a?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1571847140471-1d7766e825ea?w=600&h=400&fit=crop'
        ]
        WHEN dd.name = 'Sunny Beach Resort & Water Park' THEN ARRAY[
            'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=600&h=400&fit=crop'
        ]
        WHEN dd.name = 'Mountain Wildlife Reserve' THEN ARRAY[
            'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=600&h=400&fit=crop'
        ]
        WHEN dd.name = 'Contemporary Arts Gallery' THEN ARRAY[
            'https://images.unsplash.com/photo-1536924430914-91f9e2041b83?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&h=400&fit=crop'
        ]
        WHEN dd.name = 'Fantasy World Theme Park' THEN ARRAY[
            'https://images.unsplash.com/photo-1594736797933-d0401ba2bdf9?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop'
        ]
        WHEN dd.name = 'Royal Botanical Gardens' THEN ARRAY[
            'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&h=400&fit=crop'
        ]
        WHEN dd.name = 'Ocean Life Aquarium' THEN ARRAY[
            'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop'
        ]
        ELSE ARRAY[
            'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1568667256549-094345857637?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=600&h=400&fit=crop'
        ]
    END,
    true,
    NOW(),
    NOW()
FROM dummy_destinations dd;

-- Display summary of inserted destinations
SELECT 
    'Destinations inserted:' as info, 
    count(*) as count
FROM destinations 
WHERE created_at >= NOW() - INTERVAL '1 minute';