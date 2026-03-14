
import { supabaseFetch } from './supabaseClient';
import { AiModel } from '../types';

export const aiModelService = {
    async getAll(): Promise<AiModel[]> {
        const data = await supabaseFetch('ai_models?select=*&order=created_at.asc');
        if (!data || !Array.isArray(data)) return [];
        
        return data.map((m: any) => ({
            id: m.id,
            name: m.name,
            modelId: m.model_id,
            provider: m.provider,
            temperature: m.temperature,
            systemInstruction: m.system_instruction,
            status: m.status,
            isDefault: m.is_default
        }));
    },

    async create(model: Omit<AiModel, 'id'>): Promise<AiModel> {
        const payload = {
            name: model.name,
            model_id: model.modelId,
            provider: model.provider,
            temperature: model.temperature,
            system_instruction: model.systemInstruction,
            status: model.status,
            is_default: model.isDefault
        };

        const result = await supabaseFetch('ai_models', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Prefer': 'return=representation' }
        });

        const data = Array.isArray(result) ? result[0] : result;

        return {
            id: data.id,
            name: data.name,
            modelId: data.model_id,
            provider: data.provider,
            temperature: data.temperature,
            systemInstruction: data.system_instruction,
            status: data.status,
            isDefault: data.is_default
        };
    },

    async update(id: string, updates: Partial<AiModel>): Promise<AiModel> {
        const payload: any = {};
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.modelId !== undefined) payload.model_id = updates.modelId;
        if (updates.provider !== undefined) payload.provider = updates.provider;
        if (updates.temperature !== undefined) payload.temperature = updates.temperature;
        if (updates.systemInstruction !== undefined) payload.system_instruction = updates.systemInstruction;
        if (updates.status !== undefined) payload.status = updates.status;
        if (updates.isDefault !== undefined) payload.is_default = updates.isDefault;

        const result = await supabaseFetch(`ai_models?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
            headers: { 'Prefer': 'return=representation' }
        });

        const data = Array.isArray(result) ? result[0] : result;

        return {
            id: data.id,
            name: data.name,
            modelId: data.model_id,
            provider: data.provider,
            temperature: data.temperature,
            systemInstruction: data.system_instruction,
            status: data.status,
            isDefault: data.is_default
        };
    },

    async delete(id: string): Promise<void> {
        await supabaseFetch(`ai_models?id=eq.${id}`, {
            method: 'DELETE'
        });
    },

    /**
     * Define um modelo como padrão e desativa o padrão dos outros
     */
    async setAsDefault(id: string): Promise<void> {
        // Correção: Adicionado ?id=not.is.null para satisfazer a exigência de uma cláusula WHERE do Supabase
        await supabaseFetch('ai_models?id=not.is.null', {
            method: 'PATCH',
            body: JSON.stringify({ is_default: false }),
            headers: { 'Content-Type': 'application/json' }
        });

        // Depois definimos o novo padrão
        await this.update(id, { isDefault: true });
    }
};
