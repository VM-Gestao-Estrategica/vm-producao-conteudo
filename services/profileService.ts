
import { supabaseFetch, supabase } from './supabaseClient';
import { TeamMember } from '../types';

export const profileService = {
    /**
     * Busca todos os perfis do schema 'identity' via função RPC.
     */
    async getGlobalProfiles(): Promise<any[]> {
        try {
            const { data, error } = await supabase.rpc('get_all_user_profiles');
            
            if (error) {
                console.error("Erro detalhado ao buscar perfis globais:", error.message, error.details, error.hint);
                return [];
            }
            return data || [];
        } catch (err) {
            console.error("Exceção ao chamar RPC get_all_user_profiles:", err);
            return [];
        }
    },

    async getAll(): Promise<TeamMember[]> {
        const data = await supabaseFetch('team_members?select=*&deleted_at=is.null&order=name.asc');
        if (!data || !Array.isArray(data)) return [];
        
        return data.map((p: any) => ({
            id: p.id,
            name: p.name,
            email: p.email,
            role: p.role,
            status: p.status,
            whatsapp: p.whatsapp,
            avatar: p.avatar_url,
            invitedTeamId: p.invited_team_id,
            invitation: p.invitation || 'Aguardando',
            userId: p.user_id
        }));
    },

    /**
     * Cria ou Atualiza um membro.
     * Agora verifica a combinação de EMAIL + TIME para permitir multi-times.
     */
    async create(member: Partial<TeamMember>): Promise<TeamMember> {
        // 1. Verificar se o membro já existe NESTE TIME específico pelo e-mail (e não está deletado)
        if (member.email && member.invitedTeamId) {
            const existing = await supabaseFetch(
                `team_members?email=eq.${member.email}&invited_team_id=eq.${member.invitedTeamId}&deleted_at=is.null&select=id`
            );
            
            if (existing && existing.length > 0) {
                // Se ele já é membro DESTE time, apenas atualizamos o cargo/status/etc
                return this.update(existing[0].id, member);
            }
        }

        // 2. Se não existe vínculo deste e-mail com este time, cria um novo registro
        const payload = {
            id: member.id,
            name: member.name,
            email: member.email,
            whatsapp: member.whatsapp,
            role: member.role,
            status: member.status,
            avatar_url: member.avatar,
            invited_team_id: member.invitedTeamId,
            invitation: member.invitation || 'Aguardando',
            user_id: member.userId
        };

        const result = await supabaseFetch('team_members', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 
                'Prefer': 'return=representation'
            }
        });

        const data = Array.isArray(result) ? result[0] : result;
        return {
            id: data.id,
            name: data.name,
            email: data.email,
            whatsapp: data.whatsapp,
            role: data.role,
            status: data.status,
            avatar: data.avatar_url,
            invitedTeamId: data.invited_team_id,
            invitation: data.invitation,
            userId: data.user_id
        };
    },

    async update(id: string, updates: Partial<TeamMember>): Promise<TeamMember> {
        const payload: any = {};
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.email !== undefined) payload.email = updates.email;
        if (updates.whatsapp !== undefined) payload.whatsapp = updates.whatsapp;
        if (updates.role !== undefined) payload.role = updates.role;
        if (updates.status !== undefined) payload.status = updates.status;
        if (updates.avatar !== undefined) payload.avatar_url = updates.avatar;
        if (updates.invitedTeamId !== undefined) payload.invited_team_id = updates.invitedTeamId;
        if (updates.invitation !== undefined) payload.invitation = updates.invitation;
        if (updates.userId !== undefined) payload.user_id = updates.userId;

        const result = await supabaseFetch(`team_members?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
            headers: { 'Prefer': 'return=representation' }
        });

        const data = Array.isArray(result) ? result[0] : result;
        return {
            id: data.id,
            name: data.name,
            email: data.email,
            whatsapp: data.whatsapp,
            role: data.role,
            status: data.status,
            avatar: data.avatar_url,
            invitedTeamId: data.invited_team_id,
            invitation: data.invitation,
            userId: data.user_id
        };
    },

    async delete(id: string): Promise<void> {
        // Soft Delete
        await supabaseFetch(`team_members?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ deleted_at: new Date().toISOString() }),
            headers: { 'Prefer': 'return=representation' }
        });
    }
};
