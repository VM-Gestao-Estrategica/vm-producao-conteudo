import { supabaseFetch } from './supabaseClient';
import { PlannerItem } from '../types';
import { CURRENT_PROFILE_ID } from './authConfig';

export const plannerService = {
    async getAll(): Promise<PlannerItem[]> {
        const data = await supabaseFetch('planner_items?select=*&deleted_at=is.null&order=planned_date.asc');
        if (!data || !Array.isArray(data)) return [];

        return data.map((item: any) => ({
            id: item.id,
            theme: item.theme,
            date: item.planned_date,
            channels: item.channels || [],
            format: item.format,
            notes: item.notes || '',
            completed: item.completed || false
        }));
    },

    async create(item: Partial<PlannerItem>): Promise<PlannerItem> {
        const payload = {
            id: item.id,
            theme: item.theme,
            planned_date: item.date,
            channels: item.channels,
            format: item.format,
            notes: item.notes,
            completed: item.completed || false,
            created_by: CURRENT_PROFILE_ID
        };

        const result = await supabaseFetch('planner_items', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Prefer': 'return=representation' }
        });

        const data = Array.isArray(result) ? result[0] : result;

        return {
            id: data.id,
            theme: data.theme,
            date: data.planned_date,
            channels: data.channels || [],
            format: data.format,
            notes: data.notes || '',
            completed: data.completed
        };
    },

    async update(id: string, item: Partial<PlannerItem>): Promise<PlannerItem> {
        const payload: any = {};
        if (item.theme !== undefined) payload.theme = item.theme;
        if (item.date !== undefined) payload.planned_date = item.date;
        if (item.channels !== undefined) payload.channels = item.channels;
        if (item.format !== undefined) payload.format = item.format;
        if (item.notes !== undefined) payload.notes = item.notes;
        if (item.completed !== undefined) payload.completed = item.completed;

        // updated_at é gerido via trigger (Soft Change)

        const result = await supabaseFetch(`planner_items?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
            headers: { 'Prefer': 'return=representation' }
        });

        const data = Array.isArray(result) ? result[0] : result;

        return {
            id: data.id,
            theme: data.theme,
            date: data.planned_date,
            channels: data.channels || [],
            format: data.format,
            notes: data.notes || '',
            completed: data.completed
        };
    },

    async delete(id: string): Promise<void> {
        // Soft Delete: Atualiza deleted_at
        await supabaseFetch(`planner_items?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ deleted_at: new Date().toISOString() }),
            headers: { 'Prefer': 'return=representation' }
        });
    }
};