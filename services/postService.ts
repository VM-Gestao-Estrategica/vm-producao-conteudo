import { supabaseFetch } from './supabaseClient';
import { Post } from '../types';

export const postService = {
    async getAll(): Promise<Post[]> {
        // author_id REABILITADO
        const columns = 'id,production_id,content_index,planner_id,channels,creative_ids,status,author_id,created_at,scheduled_date,categoria_id';
        const data = await supabaseFetch(`posts?select=${columns}&deleted_at=is.null&order=created_at.desc`);
        if (!data || !Array.isArray(data)) return [];
        
        return data.map((p: any) => ({
            id: p.id,
            historyId: p.production_id,
            contentIndex: p.content_index,
            plannerId: p.planner_id,
            channels: p.channels || [],
            creativeIds: p.creative_ids || [],
            status: p.status,
            authorId: p.author_id || '', // Agora recebe o valor real do banco
            timestamp: p.created_at ? new Date(p.created_at).getTime() : Date.now(),
            scheduledDate: p.scheduled_date,
            categoryId: p.categoria_id
        }));
    },

    async save(post: Partial<Post>): Promise<Post> {
        const payload: any = { id: post.id };

        if ('historyId' in post) payload.production_id = post.historyId;
        if ('contentIndex' in post) payload.content_index = post.contentIndex;
        if ('plannerId' in post) payload.planner_id = post.plannerId || null;
        if ('channels' in post) payload.channels = post.channels;
        if ('creativeIds' in post) payload.creative_ids = post.creativeIds;
        if ('status' in post) payload.status = post.status;
        if ('scheduledDate' in post) payload.scheduled_date = post.scheduledDate || null;
        if ('categoryId' in post) payload.categoria_id = post.categoryId || null;
        
        // Lógica de segurança para o autor:
        if ('authorId' in post) {
            payload.author_id = (post.authorId && post.authorId.trim() !== '') ? post.authorId : null;
        }

        const columns = 'id,production_id,content_index,planner_id,channels,creative_ids,status,author_id,created_at,scheduled_date,categoria_id';
        const result = await supabaseFetch(`posts?select=${columns}`, {
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
            historyId: data.production_id,
            contentIndex: data.content_index,
            plannerId: data.planner_id,
            channels: data.channels || [],
            creativeIds: data.creative_ids || [],
            status: data.status,
            authorId: data.author_id || '', 
            timestamp: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
            scheduledDate: data.scheduled_date,
            categoryId: data.categoria_id
        };
    },

    async delete(id: string): Promise<void> {
        // Soft Delete
        await supabaseFetch(`posts?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ deleted_at: new Date().toISOString() }),
            headers: { 'Prefer': 'return=representation' }
        });
    }
};