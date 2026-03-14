import { supabaseFetch } from './supabaseClient';
import { ChannelAccount } from '../types';

export const channelService = {
    async getAll(): Promise<ChannelAccount[]> {
        const data = await supabaseFetch('channel_accounts?select=*&deleted_at=is.null');
        if (!data || !Array.isArray(data)) return [];
        
        return data.map((c: any) => ({
            id: c.id,
            platform: c.platform,
            username: c.username,
            password: c.password,
            status: c.status,
            lastUpdated: c.last_updated ? new Date(c.last_updated).getTime() : Date.now()
        }));
    },

    async save(channel: Partial<ChannelAccount>): Promise<ChannelAccount> {
        const payload = {
            id: channel.id,
            platform: channel.platform,
            username: channel.username,
            password: channel.password,
            status: channel.status
            // last_updated removido (Soft Change)
        };

        const result = await supabaseFetch('channel_accounts', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Prefer': 'return=representation,resolution=merge-duplicates',
                'On-Conflict': 'id'
            }
        });

        const data = Array.isArray(result) ? result[0] : result;

        return {
            id: data.id,
            platform: data.platform,
            username: data.username,
            password: data.password,
            status: data.status,
            lastUpdated: data.last_updated ? new Date(data.last_updated).getTime() : Date.now()
        };
    },

    async delete(id: string): Promise<void> {
        // Soft Delete
        await supabaseFetch(`channel_accounts?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ deleted_at: new Date().toISOString() }),
            headers: { 'Prefer': 'return=representation' }
        });
    }
};