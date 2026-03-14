
import { supabase } from './supabaseClient';

export const authService = {
    async signUp(email: string, password: string) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: email.split('@')[0].toLowerCase()
                },
            },
        });

        if (error) throw error;
        return data;
    },

    async signIn(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data;
    },

    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    async getSession() {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        return data.session;
    },

    async getUserProfile(userId: string) {
        const { data, error } = await supabase
            .schema('identity')
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) return null;
        return data;
    },

    async getTeamMemberProfile(userId: string) {
        const { data, error } = await supabase
            .schema('marketing')
            .from('team_members')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) return null;
        return data;
    },

    async resetPasswordForEmail(email: string) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '?type=recovery',
        });
        if (error) throw error;
    },

    async updatePassword(password: string) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
    }
};
