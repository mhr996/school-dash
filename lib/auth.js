import supabase from './supabase';

// signUp functionality removed - this is an admin-only dashboard

export const signIn = async (email, password) => {
    const { user, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error('Error signing in:', error.message);
        return { error: error.message };
    }

    return { user };
};

export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error signing out:', error.message);
        return { error: error.message };
    }
    return { success: true };
};

export const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
        console.error('Error resetting password:', error.message);
        return { error: error.message };
    }
    return { success: true };
};

export const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({
        password: newPassword,
    });
    if (error) {
        console.error('Error updating password:', error.message);
        return { error: error.message };
    }
    return { success: true };
};

export const getCurrentUser = async () => {
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();
    if (error) {
        console.error('Error getting user:', error.message);
        return { error: error.message };
    }
    return { user };
};

export const getCurrentUserWithRole = async () => {
    try {
        const { user, error: authError } = await getCurrentUser();
        if (authError || !user) {
            return { error: authError || 'User not found' };
        }

        // Get user data with role information
        const { data: userData, error: dbError } = await supabase
            .from('users')
            .select(
                `
                *,
                user_roles(id, name, description)
            `,
            )
            .eq('auth_user_id', user.id)
            .single();

        if (dbError) {
            console.error('Error getting user data:', dbError.message);
            return { error: dbError.message };
        }

        return { user: userData };
    } catch (error) {
        console.error('Error getting user with role:', error.message);
        return { error: error.message };
    }
};

export const isAdmin = async () => {
    const { user, error } = await getCurrentUserWithRole();
    if (error || !user) return false;
    return user.user_roles?.name === 'admin';
};
