import { supabaseFetch } from './supabaseClient';
import { CreativeItem } from '../types';

export const creativeService = {
    async getAll(): Promise<CreativeItem[]> {
        const data = await supabaseFetch('creatives?select=*&deleted_at=is.null&order=created_at.desc');
        if (!data || !Array.isArray(data)) return [];

        return data.map((item: any) => ({
            id: item.id,
            title: item.title,
            source: item.source,
            mediaType: item.media_type,
            url: item.url,
            timestamp: new Date(item.created_at).getTime(),
            plannerItemId: item.planner_item_id,
            postId: item.post_id
        }));
    },

    async create(item: Partial<CreativeItem>): Promise<CreativeItem> {
        const payload = {
            id: item.id, // Gerado pelo generateUUID no componente
            title: item.title,
            source: item.source,
            media_type: item.mediaType,
            url: item.url,
            planner_item_id: item.plannerItemId,
            post_id: item.postId
        };

        const result = await supabaseFetch('creatives', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Prefer': 'return=representation' }
        });

        const data = Array.isArray(result) ? result[0] : result;

        return {
            id: data.id,
            title: data.title,
            source: data.source,
            mediaType: data.media_type,
            url: data.url,
            timestamp: new Date(data.created_at).getTime(),
            plannerItemId: data.planner_item_id,
            postId: data.post_id
        };
    },

    async update(id: string, item: Partial<CreativeItem>): Promise<CreativeItem> {
        const payload: any = {};
        if (item.title !== undefined) payload.title = item.title;
        if (item.source !== undefined) payload.source = item.source;
        if (item.mediaType !== undefined) payload.media_type = item.mediaType;
        if (item.url !== undefined) payload.url = item.url;
        if (item.plannerItemId !== undefined) payload.planner_item_id = item.plannerItemId;
        if (item.postId !== undefined) payload.post_id = item.postId;

        const result = await supabaseFetch(`creatives?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
            headers: { 'Prefer': 'return=representation' }
        });

        const data = Array.isArray(result) ? result[0] : result;

        return {
            id: data.id,
            title: data.title,
            source: data.source,
            mediaType: data.media_type,
            url: data.url,
            timestamp: new Date(data.created_at).getTime(),
            plannerItemId: data.planner_item_id,
            postId: data.post_id
        };
    },

    async delete(id: string): Promise<void> {
        // Soft Delete
        await supabaseFetch(`creatives?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ deleted_at: new Date().toISOString() }),
            headers: { 'Prefer': 'return=representation' }
        });
    }
};
