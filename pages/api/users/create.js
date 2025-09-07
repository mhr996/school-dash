import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client with service role key
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get the token from the Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing or invalid authorization header' });
        }

        const token = authHeader.split(' ')[1];

        // Verify the user's token with admin client
        const {
            data: { user },
            error: authError,
        } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            console.error('Auth error:', authError);
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get user data from request body
        const { email, password, userData, profileData } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Validate password strength
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // Create a new user with admin API
        const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // Set account as fully active
            user_metadata: userData || {},
        });

        if (createError) {
            console.error('Error creating user:', createError);
            return res.status(400).json({ error: createError.message });
        }

        const userId = newUserData.user?.id;
        if (!userId) {
            return res.status(500).json({ error: 'Failed to get user ID after creation' });
        }

        // Check if profile exists already (shouldn't for new users)
        const { data: existingProfile } = await supabaseAdmin.from('users').select('*').eq('id', userId).single();

        // Prepare profile data with all fields matching the users table structure
        const profilePayload = {
            id: userId,
            email: email,
            full_name: profileData.full_name || '',
            country: profileData.country || null,
            address: profileData.address || null,
            phone: profileData.phone || null,
            status: profileData.status || 'Active',
            avatar_url: null,
        };

        let profileOperation;
        // If profile already exists, update it - otherwise insert new one
        if (existingProfile) {
            profileOperation = await supabaseAdmin.from('users').update(profilePayload).eq('id', userId);
        } else {
            profileOperation = await supabaseAdmin.from('users').insert([profilePayload]);
        }

        if (profileOperation.error) {
            console.error('Error with profile:', profileOperation.error);
            // If profile creation fails, we should delete the auth user to maintain consistency
            await supabaseAdmin.auth.admin.deleteUser(userId);
            return res.status(400).json({ error: profileOperation.error.message });
        }

        return res.status(200).json({
            success: true,
            message: 'User created successfully with active account',
            user: newUserData.user,
        });
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}
