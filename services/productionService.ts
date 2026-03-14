import { supabaseFetch } from './supabaseClient';
import { HistoryItem, HistoryVersion, GenerationConfig } from '../types';

export const productionService = {
    async getAll(): Promise<HistoryItem[]> {
        // Busca produções e suas versões usando o recurso de Select do PostgREST
        // Filtrando produções ativas (deleted_at IS NULL)
        // Nota: Filtramos as versões deletadas via JS pois o filtro na URL pode causar problemas de Inner Join ou erro de sintaxe
        const data = await supabaseFetch('productions?select=*,versions:production_versions(*)&deleted_at=is.null&order=last_updated.desc');

        if (!data || !Array.isArray(data)) return [];

        return data.map((prod: any) => ({
            id: prod.id,
            title: prod.title || 'Geração Sem Título',
            config: prod.config,
            versions: (prod.versions || [])
                .filter((v: any) => !v.deleted_at) // Filtrando versões deletadas aqui
                .map((v: any) => ({
                    id: v.id,
                    timestamp: v.timestamp ? new Date(v.timestamp).getTime() : Date.now(),
                    content: v.content,
                    prompt: v.prompt
                })).sort((a: any, b: any) => a.timestamp - b.timestamp),
            lastUpdated: prod.last_updated ? new Date(prod.last_updated).getTime() : Date.now()
        }));
    },

    async upsertProduction(production: Partial<HistoryItem>): Promise<string> {
        const payload = {
            id: production.id,
            title: production.title,
            config: production.config
            // last_updated removido pois é atualizado via Trigger (Soft Change)
        };

        const result = await supabaseFetch('productions', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Prefer': 'return=representation,resolution=merge-duplicates',
                'On-Conflict': 'id'
            }
        });

        const data = Array.isArray(result) ? result[0] : result;
        return data.id;
    },

    async addVersion(productionId: string, version: Partial<HistoryVersion>): Promise<HistoryVersion> {
        const payload = {
            production_id: productionId,
            content: version.content,
            prompt: version.prompt
        };

        const result = await supabaseFetch('production_versions', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Prefer': 'return=representation' }
        });

        const data = Array.isArray(result) ? result[0] : result;

        return {
            id: data.id,
            timestamp: data.timestamp ? new Date(data.timestamp).getTime() : Date.now(),
            content: data.content,
            prompt: data.prompt
        };
    },

    async delete(id: string): Promise<void> {
        // Soft Delete: Atualiza deleted_at ao invés de remover o registro
        await supabaseFetch(`productions?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ deleted_at: new Date().toISOString() }),
            headers: { 'Prefer': 'return=representation' }
        });
    },

    async clearAll(): Promise<void> {
        // Soft Delete em massa: Atualiza deleted_at para todas as produções ativas
        await supabaseFetch('productions?deleted_at=is.null', {
            method: 'PATCH',
            body: JSON.stringify({ deleted_at: new Date().toISOString() }),
            headers: { 'Prefer': 'return=representation' }
        });
    }
};