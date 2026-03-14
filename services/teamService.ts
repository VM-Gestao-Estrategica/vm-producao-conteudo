
import { supabaseFetch } from './supabaseClient';
import { TeamGroup, TeamMember } from '../types';
import { profileService } from './profileService';
import { authService } from './authService';

export const teamService = {
    async getAll(): Promise<TeamGroup[]> {
        const teamsData = await supabaseFetch('teams?select=*&deleted_at=is.null&order=name.asc');
        if (!teamsData || !Array.isArray(teamsData)) return [];

        const membersData = await supabaseFetch('team_members?select=id,invited_team_id,invitation,status&deleted_at=is.null');
        const members = Array.isArray(membersData) ? membersData : [];

        return teamsData.map((t: any) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            memberIds: members
                .filter((m: any) => m.invited_team_id === t.id)
                .map((m: any) => m.id),
            canView: t.can_view,
            canEdit: t.can_edit,
            canCreate: t.can_create,
            canDelete: t.can_delete,
            accessiblePages: t.accessible_pages || []
        }));
    },

    /**
     * Cria um time e vincula o usuário atual como ADM aceito automaticamente
     */
    async create(team: Partial<TeamGroup>, creatorAuthUserId: string): Promise<TeamGroup> {
        // 1. Criar o time na marketing.teams
        const teamPayload = {
            id: team.id,
            name: team.name,
            description: team.description,
            can_view: team.canView,
            can_edit: team.canEdit,
            can_create: team.canCreate,
            can_delete: team.canDelete,
            accessible_pages: team.accessiblePages
        };

        const resultTeam = await supabaseFetch('teams', {
            method: 'POST',
            body: JSON.stringify(teamPayload),
            headers: { 'Prefer': 'return=representation' }
        });
        const teamData = Array.isArray(resultTeam) ? resultTeam[0] : resultTeam;

        // 2. Buscar o perfil do criador para obter nome e email reais
        const userProfile = await authService.getUserProfile(creatorAuthUserId);
        
        if (userProfile) {
            // 3. Vincular o criador como membro ADM do novo time automaticamente
            // Utilizamos profileService.create que já possui a lógica de evitar conflitos (Upsert)
            await profileService.create({
                name: userProfile.nome,
                email: userProfile.email,
                role: 'ADM',
                status: 'Ativo',
                invitation: 'Aceito',
                invitedTeamId: teamData.id,
                userId: creatorAuthUserId,
                whatsapp: userProfile.whatsapp
            });
        }

        return {
            id: teamData.id,
            name: teamData.name,
            description: teamData.description,
            memberIds: [creatorAuthUserId], 
            canView: teamData.can_view,
            canEdit: teamData.can_edit,
            canCreate: teamData.can_create,
            canDelete: teamData.can_delete,
            accessiblePages: teamData.accessible_pages || []
        };
    },

    async update(id: string, team: Partial<TeamGroup>): Promise<TeamGroup> {
        const payload: any = {};
        if (team.name !== undefined) payload.name = team.name;
        if (team.description !== undefined) payload.description = team.description;
        if (team.canView !== undefined) payload.can_view = team.canView;
        if (team.canEdit !== undefined) payload.can_edit = team.canEdit;
        if (team.canCreate !== undefined) payload.can_create = team.canCreate;
        if (team.canDelete !== undefined) payload.can_delete = team.canDelete;
        if (team.accessiblePages !== undefined) payload.accessible_pages = team.accessiblePages;

        const result = await supabaseFetch(`teams?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
            headers: { 'Prefer': 'return=representation' }
        });

        const data = Array.isArray(result) ? result[0] : result;
        return {
            id: data.id,
            name: data.name,
            description: data.description,
            memberIds: team.memberIds || [],
            canView: data.can_view,
            canEdit: data.can_edit,
            canCreate: data.can_create,
            canDelete: data.can_delete,
            accessiblePages: data.accessible_pages || []
        };
    },

    async delete(id: string): Promise<void> {
        // Soft Delete
        await supabaseFetch(`teams?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ deleted_at: new Date().toISOString() }),
            headers: { 'Prefer': 'return=representation' }
        });
    }
};
