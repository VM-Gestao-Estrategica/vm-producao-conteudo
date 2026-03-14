
import React, { useState, useEffect, useRef } from 'react';
import { UserRole, TeamMember, TeamGroup, InvitationStatus } from '../types';
import { generateUUID } from '../services/supabaseClient';
import { profileService } from '../services/profileService';
import { 
  Plus, Search, MoreVertical, Edit2, Trash2, X, Save, User, Mail, Shield, 
  AlertTriangle, Check, LayoutGrid, UserPlus, CheckCircle2, Circle, Users, 
  Eye, Filter, ChevronDown, Tag, Layout, Loader2, Hourglass, XCircle, Phone,
  UserCheck, SearchCode
} from 'lucide-react';

interface TeamProps {
  members: TeamMember[];
  groups: TeamGroup[];
  onSaveMember: (member: TeamMember) => Promise<void>;
  onDeleteMember: (id: string) => Promise<void>;
  onSaveGroup: (group: TeamGroup) => Promise<void>;
  onDeleteGroup: (id: string) => Promise<void>;
}

const PAGES = ['dashboard', 'generator', 'history', 'planner', 'creatives', 'team', 'posts', 'channels', 'settings'];

const Team: React.FC<TeamProps> = ({ members, groups, onSaveMember, onDeleteMember, onSaveGroup, onDeleteGroup }) => {
  const [activeSubTab, setActiveSubTab] = useState<'times' | 'membros'>('times');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTeamId, setFilterTeamId] = useState<string>('all');
  const [isSaving, setIsSaving] = useState(false);
  
  // Perfil Global State
  const [globalProfiles, setGlobalProfiles] = useState<any[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [profileSearch, setProfileSearch] = useState('');
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // States para Member
  const [showMemberDrawer, setShowMemberDrawer] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [viewingMember, setViewingMember] = useState<TeamMember | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const [memberMenuOpenId, setMemberMenuOpenId] = useState<string | null>(null);
  
  // Member Form State
  const [memberForm, setMemberForm] = useState({
    name: '',
    email: '',
    whatsapp: '',
    role: 'Colaborador' as UserRole,
    status: 'Ativo' as 'Ativo' | 'Inativo',
    invitedTeamId: '',
    invitation: 'Aguardando' as InvitationStatus,
    userId: ''
  });

  // Team Selector State
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
  const teamDropdownRef = useRef<HTMLDivElement>(null);

  // Group Form State
  const [showGroupDrawer, setShowGroupDrawer] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TeamGroup | null>(null);
  const [viewingGroup, setViewingGroup] = useState<TeamGroup | null>(null);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [groupMenuOpenId, setGroupMenuOpenId] = useState<string | null>(null);
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    memberIds: [] as string[],
    canView: true,
    canEdit: true,
    canCreate: true,
    canDelete: false,
    accessiblePages: ['dashboard', 'generator'] as string[]
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (teamDropdownRef.current && !teamDropdownRef.current.contains(event.target as Node)) {
        setIsTeamDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Carregar perfis globais ao abrir o drawer
  useEffect(() => {
    if (showMemberDrawer && !editingMember) {
      loadGlobalProfiles();
    }
  }, [showMemberDrawer, editingMember]);

  const loadGlobalProfiles = async () => {
    setIsLoadingProfiles(true);
    try {
      const profiles = await profileService.getGlobalProfiles();
      setGlobalProfiles(profiles);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  useEffect(() => {
    if (editingMember) {
      setMemberForm({
        name: editingMember.name,
        email: editingMember.email,
        whatsapp: editingMember.whatsapp || '',
        role: editingMember.role,
        status: editingMember.status,
        invitedTeamId: editingMember.invitedTeamId || '',
        invitation: editingMember.invitation,
        userId: editingMember.userId || ''
      });
      setShowMemberDrawer(true);
    }
  }, [editingMember]);

  useEffect(() => {
    if (editingGroup) {
      setGroupForm({
        name: editingGroup.name,
        description: editingGroup.description,
        memberIds: editingGroup.memberIds || [],
        canView: editingGroup.canView,
        canEdit: editingGroup.canEdit,
        canCreate: editingGroup.canCreate,
        canDelete: editingGroup.canDelete,
        accessiblePages: editingGroup.accessiblePages || ['dashboard', 'generator']
      });
      setShowGroupDrawer(true);
    }
  }, [editingGroup]);

  const closeMemberDrawer = () => {
    setShowMemberDrawer(false);
    setEditingMember(null);
    setIsSaving(false);
    setProfileSearch('');
    setMemberForm({ name: '', email: '', whatsapp: '', role: 'Colaborador', status: 'Ativo', invitedTeamId: '', invitation: 'Aguardando', userId: '' });
  };

  const closeGroupDrawer = () => {
    setShowGroupDrawer(false);
    setEditingGroup(null);
    setIsSaving(false);
    setGroupForm({
      name: '',
      description: '',
      memberIds: [],
      canView: true,
      canEdit: true,
      canCreate: true,
      canDelete: false,
      accessiblePages: ['dashboard', 'generator']
    });
  };

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.userId || isSaving) return;

    setIsSaving(true);
    try {
      await onSaveMember({
        id: editingMember ? editingMember.id : generateUUID(),
        name: memberForm.name,
        email: memberForm.email,
        whatsapp: memberForm.whatsapp || undefined,
        role: memberForm.role,
        status: memberForm.status,
        invitedTeamId: memberForm.invitedTeamId || undefined,
        invitation: memberForm.invitation,
        userId: memberForm.userId
      });
      closeMemberDrawer();
    } catch (error) {
      console.error("Erro ao salvar membro:", error);
      alert("Falha ao salvar dados do membro.");
    } finally {
      setIsSaving(false);
    }
  };

  const selectProfile = (p: any) => {
    setMemberForm({
      ...memberForm,
      userId: p.user_id,
      name: p.nome,
      email: p.email,
      whatsapp: p.whatsapp || ''
    });
    setProfileSearch(p.nome);
    setIsProfileDropdownOpen(false);
  };

  const selectTeamInMemberForm = (teamId: string) => {
    setMemberForm({ ...memberForm, invitedTeamId: teamId });
    setIsTeamDropdownOpen(false);
  };

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupForm.name || isSaving) return;

    setIsSaving(true);
    try {
      await onSaveGroup({
        id: editingGroup ? editingGroup.id : generateUUID(),
        ...groupForm
      });
      closeGroupDrawer();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar time.");
    } finally {
      setIsSaving(false);
    }
  };

  const togglePageInGroup = (page: string) => {
    const next = groupForm.accessiblePages.includes(page)
      ? groupForm.accessiblePages.filter(p => p !== page)
      : [...groupForm.accessiblePages, page];
    setGroupForm({ ...groupForm, accessiblePages: next });
  };

  const inputClasses = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-[#fafafa] focus:ring-2 focus:ring-[#7ba1ee] focus:bg-white outline-none text-slate-900 font-medium transition-all placeholder:text-slate-600";

  const filteredMembers = members.filter(m => {
    const name = m.name || "";
    const email = m.email || "";
    const search = searchTerm || "";
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) || 
                         email.toLowerCase().includes(search.toLowerCase());
    
    if (filterTeamId === 'all') return matchesSearch;
    return matchesSearch && m.invitedTeamId === filterTeamId;
  });

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProfiles = globalProfiles.filter(p => {
    const name = p.nome || "";
    const email = p.email || "";
    return name.toLowerCase().includes(profileSearch.toLowerCase()) || 
           email.toLowerCase().includes(profileSearch.toLowerCase());
  });

  const getTeamName = (id?: string) => {
    if (!id) return null;
    return groups.find(g => g.id === id)?.name;
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 pb-20 w-full px-4 relative">
      
      {/* HEADER DE NAVEGAÇÃO INTERNA */}
      <div className="flex flex-col xl:flex-row justify-between items-center gap-6 px-2 bg-white/40 p-4 rounded-3xl border border-white/60 backdrop-blur-sm shadow-sm">
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 w-full sm:w-fit shadow-sm">
          <button onClick={() => setActiveSubTab('times')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeSubTab === 'times' ? 'bg-[#7ba1ee] text-white shadow-lg' : 'text-slate-700 hover:bg-slate-50'}`}><LayoutGrid size={18} /> Times</button>
          <button onClick={() => setActiveSubTab('membros')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeSubTab === 'membros' ? 'bg-[#7ba1ee] text-white shadow-lg' : 'text-slate-700 hover:bg-slate-50'}`}><Users size={18} /> Membros</button>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 flex-1 w-full justify-end">
          <div className="flex flex-col md:flex-row gap-4 flex-1 w-full max-w-2xl justify-end">
            <div className="relative flex-1 w-full max-w-md">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"><Search size={18} /></div>
              <input type="text" placeholder={`Pesquisar ${activeSubTab === 'times' ? 'times' : 'membros'}...`} className={`${inputClasses} pl-11 !py-2.5 text-sm shadow-sm`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            {activeSubTab === 'membros' && (
              <div className="relative w-full md:w-56">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"><Filter size={14} /></div>
                <select className={`${inputClasses} pl-10 !py-2.5 text-xs font-bold uppercase cursor-pointer appearance-none shadow-sm pr-8`} value={filterTeamId} onChange={e => setFilterTeamId(e.target.value)}>
                  <option value="all">Todos os Times</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"><ChevronDown size={14} /></div>
              </div>
            )}
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            {activeSubTab === 'times' ? (
              <button onClick={() => setShowGroupDrawer(true)} className="bg-[#7ba1ee] text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[#00152b] transition-all shadow-lg w-full md:w-auto justify-center"><Plus size={18} /> Novo Time</button>
            ) : (
              <button onClick={() => setShowMemberDrawer(true)} className="bg-[#7ba1ee] text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[#00152b] transition-all shadow-lg w-full md:w-auto justify-center"><Plus size={18} /> Novo Membro</button>
            )}
          </div>
        </div>
      </div>

      {/* LISTAGEM PRINCIPAL */}
      <div className="animate-in fade-in duration-500">
        {activeSubTab === 'times' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.length > 0 ? filteredGroups.map(group => (
              <div key={group.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 shadow-inner"><LayoutGrid size={24} /></div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">{group.name}</h4>
                      <p className="text-slate-600 text-xs font-medium">{members.filter(m => m.invitedTeamId === group.id).length} membros</p>
                    </div>
                  </div>
                  <div className="relative">
                    <button 
                      onClick={() => setGroupMenuOpenId(groupMenuOpenId === group.id ? null : group.id)} 
                      className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
                    >
                      <MoreVertical size={20} />
                    </button>
                    {groupMenuOpenId === group.id && (
                      <>
                        <div className="fixed inset-0 z-[100]" onClick={() => setGroupMenuOpenId(null)} />
                        <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 z-[110] py-2 animate-in fade-in zoom-in-95 duration-100 text-left">
                          <button onClick={() => { setViewingGroup(group); setGroupMenuOpenId(null); }} className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-bold transition-colors"><Eye size={14} className="text-blue-500" /> Ver Detalhes</button>
                          <button onClick={() => { setEditingGroup(group); setGroupMenuOpenId(null); }} className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-bold transition-colors"><Edit2 size={14} className="text-[#4c6eb3]" /> Editar</button>
                          <div className="h-px bg-slate-100 my-1 mx-2" />
                          <button onClick={() => { setDeletingGroupId(group.id); setGroupMenuOpenId(null); }} className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 flex items-center gap-2 font-bold transition-colors"><Trash2 size={14} /> Excluir</button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-slate-700 text-sm mb-6 line-clamp-2 italic leading-relaxed">{group.description || "Sem descrição definida."}</p>
                <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                   <div className="flex -space-x-2">
                    {members.filter(m => m.invitedTeamId === group.id).slice(0, 4).map(m => (
                      <div key={m.id} className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-900" title={m.name}>{m.name.charAt(0)}</div>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    {group.canView && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" title="Pode Visualizar" />}
                    {group.canCreate && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Pode Criar" />}
                    {group.canEdit && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Pode Editar" />}
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                <LayoutGrid size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-600 font-medium italic">Nenhum time estratégico encontrado.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMembers.length > 0 ? filteredMembers.map(member => (
              <MemberCard 
                key={member.id} 
                member={member} 
                teamName={getTeamName(member.invitedTeamId)}
                onView={() => setViewingMember(member)}
                onEdit={() => { setEditingMember(member); setShowMemberDrawer(true); }} 
                onDelete={() => setDeletingMemberId(member.id)}
                menuOpenId={memberMenuOpenId}
                onToggleMenu={setMemberMenuOpenId}
              />
            )) : (
              <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                <Users size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-600 font-medium italic">Nenhum membro encontrado.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* GROUP DRAWER (Novo Time) */}
      {showGroupDrawer && (
        <div className="fixed inset-0 z-[2000]">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={closeGroupDrawer} />
          <div className="fixed top-0 right-0 h-full w-full md:w-[600px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#7ba1ee] text-white flex-shrink-0">
              <h3 className="font-bold text-xl">{editingGroup ? 'Editar Time' : 'Novo Time Estratégico'}</h3>
              <button onClick={closeGroupDrawer} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleGroupSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/20 h-full">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <LayoutGrid size={16} className="text-blue-500" /> Nome do Time
                  </label>
                  <input 
                    required 
                    className={inputClasses} 
                    placeholder="Ex: Equipe de Social Media" 
                    value={groupForm.name} 
                    onChange={e => setGroupForm({...groupForm, name: e.target.value})} 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    Descrição do Objetivo
                  </label>
                  <textarea 
                    rows={3} 
                    className={`${inputClasses} resize-none`} 
                    placeholder="Descreva as responsabilidades deste time..." 
                    value={groupForm.description} 
                    onChange={e => setGroupForm({...groupForm, description: e.target.value})} 
                  />
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <label className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Shield size={16} className="text-purple-500" /> Permissões do Grupo
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 cursor-pointer">
                      <span className="text-sm font-bold text-slate-900">Pode Visualizar</span>
                      <input type="checkbox" checked={groupForm.canView} onChange={e => setGroupForm({...groupForm, canView: e.target.checked})} className="w-5 h-5 accent-[#7ba1ee]" />
                    </label>
                    <label className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 cursor-pointer">
                      <span className="text-sm font-bold text-slate-900">Pode Criar</span>
                      <input type="checkbox" checked={groupForm.canCreate} onChange={e => setGroupForm({...groupForm, canCreate: e.target.checked})} className="w-5 h-5 accent-[#7ba1ee]" />
                    </label>
                    <label className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 cursor-pointer">
                      <span className="text-sm font-bold text-slate-900">Pode Editar</span>
                      <input type="checkbox" checked={groupForm.canEdit} onChange={e => setGroupForm({...groupForm, canEdit: e.target.checked})} className="w-5 h-5 accent-[#7ba1ee]" />
                    </label>
                    <label className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 cursor-pointer">
                      <span className="text-sm font-bold text-slate-900">Pode Excluir</span>
                      <input type="checkbox" checked={groupForm.canDelete} onChange={e => setGroupForm({...groupForm, canDelete: e.target.checked})} className="w-5 h-5 accent-[#7ba1ee]" />
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Layout size={16} className="text-indigo-500" /> Acesso a Páginas
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PAGES.map(page => (
                      <button 
                        key={page} 
                        type="button" 
                        onClick={() => togglePageInGroup(page)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${groupForm.accessiblePages.includes(page) ? 'bg-[#7ba1ee] text-white border-[#7ba1ee] shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </form>

            <div className="p-6 border-t border-slate-100 bg-white flex gap-4 shadow-xl flex-shrink-0">
              <button type="button" disabled={isSaving} onClick={closeGroupDrawer} className="flex-1 py-4 rounded-xl font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all">Cancelar</button>
              <button 
                onClick={handleGroupSubmit} 
                disabled={isSaving || !groupForm.name} 
                className="flex-[2] bg-[#7ba1ee] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#00152b] transition-all shadow-lg disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                {isSaving ? 'Salvando...' : (editingGroup ? 'Atualizar Time' : 'Salvar Time')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MEMBER DRAWER (Novo/Editar) */}
      {showMemberDrawer && (
        <div className="fixed inset-0 z-[2000]">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={closeMemberDrawer} />
          <div className="fixed top-0 right-0 h-full w-full md:w-[500px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#7ba1ee] text-white flex-shrink-0">
              <h3 className="font-bold text-xl">{editingMember ? 'Editar Vínculo' : 'Vincular Novo Estrategista'}</h3>
              <button onClick={closeMemberDrawer} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleMemberSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/20 h-full">
               
               {!editingMember && (
                 <div className="space-y-2 relative" ref={profileDropdownRef}>
                    <label className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                       <SearchCode size={16} className="text-blue-500" /> 1. Selecionar Estrategista
                    </label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-slate-900 transition-colors"><Search size={18} /></div>
                      <input 
                        className={`${inputClasses} pl-12 shadow-sm`} 
                        placeholder="Buscar por nome ou email..."
                        value={profileSearch}
                        onFocus={() => setIsProfileDropdownOpen(true)}
                        onChange={e => { setProfileSearch(e.target.value); setIsProfileDropdownOpen(true); }}
                      />
                      {isLoadingProfiles && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-blue-500" size={18} />}
                    </div>

                    {isProfileDropdownOpen && (
                      <div className="absolute z-[100] left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                        {filteredProfiles.length > 0 ? filteredProfiles.map(p => (
                          <button key={p.user_id} type="button" onClick={() => selectProfile(p)} className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-none">
                            <div className="w-10 h-10 rounded-xl bg-[#7ba1ee]/5 text-slate-900 flex items-center justify-center font-black">{p.nome.charAt(0)}</div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate">{p.nome}</p>
                              <p className="text-[10px] text-slate-600 truncate">{p.email}</p>
                            </div>
                          </button>
                        )) : (
                          <div className="p-8 text-center"><p className="text-xs text-slate-600 font-medium">Nenhum estrategista encontrado.</p></div>
                        )}
                      </div>
                    )}
                 </div>
               )}

               {memberForm.userId && (
                 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                       <div className="flex items-center gap-4 border-b border-slate-50 pb-4">
                          <div className="w-16 h-16 rounded-2xl bg-[#7ba1ee] text-white flex items-center justify-center text-2xl font-black shadow-lg">{memberForm.name.charAt(0)}</div>
                          <div>
                            <p className="text-[10px] font-black text-[#4c6eb3] uppercase tracking-widest">Perfil Confirmado</p>
                            <h4 className="text-lg font-black text-slate-900 leading-tight">{memberForm.name}</h4>
                          </div>
                       </div>
                       <div className="grid grid-cols-1 gap-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Mail size={14} /></div>
                            <span className="text-xs font-bold text-slate-900">{memberForm.email}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Phone size={14} /></div>
                            <span className="text-xs font-bold text-slate-900">{memberForm.whatsapp || '(Sem WhatsApp)'}</span>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                       <label className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                          <LayoutGrid size={16} className="text-purple-500" /> 2. Escopo de Trabalho
                       </label>
                       
                       <div className="space-y-2 relative" ref={teamDropdownRef}>
                          <p className="text-[10px] font-bold text-slate-600 uppercase ml-1">Vínculo com Time</p>
                          <div className="relative">
                            <input 
                              type="text" 
                              className={`${inputClasses} pl-11 shadow-sm`} 
                              placeholder="Pesquisar time estrategico..." 
                              value={memberForm.invitedTeamId ? getTeamName(memberForm.invitedTeamId) || '' : teamSearchQuery}
                              onFocus={() => setIsTeamDropdownOpen(true)}
                              onChange={e => { setTeamSearchQuery(e.target.value); setIsTeamDropdownOpen(true); if(memberForm.invitedTeamId) setMemberForm({...memberForm, invitedTeamId: ''}); }}
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"><Layout size={18} /></div>
                          </div>
                          {isTeamDropdownOpen && (
                            <div className="absolute z-[100] left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                              <button type="button" onClick={() => selectTeamInMemberForm('')} className="w-full text-left px-4 py-3 text-xs text-slate-600 italic hover:bg-slate-50 border-b border-slate-50">Sem Time (Avulso)</button>
                              {groups.filter(g => g.name.toLowerCase().includes(teamSearchQuery.toLowerCase())).map(team => (
                                <button key={team.id} type="button" onClick={() => selectTeamInMemberForm(team.id)} className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-none">
                                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center"><LayoutGrid size={14} /></div>
                                  <span className="text-sm font-bold text-slate-900">{team.name}</span>
                                </button>
                              ))}
                            </div>
                          )}
                       </div>

                       <div className="space-y-2">
                          <p className="text-[10px] font-bold text-slate-600 uppercase ml-1">Nível de Acesso</p>
                          <div className="relative">
                            <select className={`${inputClasses} pl-11 shadow-sm appearance-none cursor-pointer`} value={memberForm.role} onChange={e => setMemberForm({...memberForm, role: e.target.value as UserRole})}>
                              <option value="ADM">Administrador (Total)</option>
                              <option value="Supervisor">Supervisor (Gerencial)</option>
                              <option value="Colaborador">Colaborador (Produção)</option>
                              <option value="Cliente">Cliente (Visualização)</option>
                            </select>
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"><Shield size={18} /></div>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"><ChevronDown size={14} /></div>
                          </div>
                       </div>

                       <div className="space-y-2">
                          <p className="text-[10px] font-bold text-slate-600 uppercase ml-1">Disponibilidade</p>
                          <div className="flex bg-slate-200/50 p-1.5 rounded-2xl border border-slate-100 shadow-inner">
                            <button type="button" onClick={() => setMemberForm({...memberForm, status: 'Ativo'})} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${memberForm.status === 'Ativo' ? 'bg-[#7ba1ee] text-white shadow-md' : 'text-slate-700'}`}>ATIVO</button>
                            <button type="button" onClick={() => setMemberForm({...memberForm, status: 'Inativo'})} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${memberForm.status === 'Inativo' ? 'bg-red-500 text-white shadow-md' : 'text-slate-700'}`}>INATIVO</button>
                          </div>
                       </div>
                    </div>
                 </div>
               )}

               {!memberForm.userId && !editingMember && (
                 <div className="h-64 flex flex-col items-center justify-center text-center p-8 bg-blue-50/50 rounded-[2rem] border border-dashed border-blue-200">
                    <div className="p-4 bg-white rounded-2xl shadow-sm text-blue-500 mb-4 animate-bounce"><UserCheck size={32} /></div>
                    <p className="text-sm font-bold text-blue-900 leading-tight">Selecione um estrategista acima para configurar o acesso dele à área de marketing.</p>
                 </div>
               )}
            </form>

            <div className="p-6 border-t border-slate-100 bg-white flex gap-4 shadow-xl flex-shrink-0">
              <button type="button" disabled={isSaving} onClick={closeMemberDrawer} className="flex-1 py-4 rounded-xl font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all">Cancelar</button>
              <button 
                onClick={handleMemberSubmit} 
                disabled={isSaving || !memberForm.userId} 
                className="flex-[2] bg-[#7ba1ee] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#00152b] transition-all shadow-lg disabled:opacity-50 disabled:grayscale"
              >
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                {isSaving ? 'Salvando...' : (editingMember ? 'Atualizar Dados' : 'Vincular ao Marketing')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VISUALIZAÇÃO FICHA MEMBRO */}
      {viewingMember && (
        <div className="fixed inset-0 z-[2000]">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setViewingMember(null)} />
          <div className="fixed top-0 right-0 h-full w-full md:w-[500px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#7ba1ee] text-white flex-shrink-0">
              <h3 className="font-bold text-xl">Ficha do Estrategista</h3>
              <button onClick={() => setViewingMember(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="flex-1 p-8 space-y-10 overflow-y-auto bg-slate-50/20 h-full">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-28 h-28 rounded-[2rem] bg-[#7ba1ee] text-white flex items-center justify-center text-4xl font-black shadow-2xl border-4 border-white relative">
                  {viewingMember.name.charAt(0)}
                  <div className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-4 border-white ${viewingMember.status === 'Ativo' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{viewingMember.name}</h2>
                  <p className="text-slate-700 font-bold text-xs uppercase tracking-widest mt-1">{viewingMember.email}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                 <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <span className="text-[10px] text-slate-600 uppercase font-black tracking-widest block mb-1">Cargo / Escopo</span>
                    <p className="font-bold text-slate-900 text-lg">{viewingMember.role}</p>
                 </div>
                 <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <span className="text-[10px] text-slate-600 uppercase font-black tracking-widest block mb-1">Vínculo de Identidade</span>
                    <p className="font-mono text-[10px] text-slate-600 bg-slate-50 p-2 rounded-lg truncate">{viewingMember.userId || 'N/A'}</p>
                 </div>
                 <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <span className="text-[10px] text-slate-600 uppercase font-black tracking-widest block mb-1">Time</span>
                    <p className="font-bold text-slate-900">{getTeamName(viewingMember.invitedTeamId) || 'Sem Time Fixo'}</p>
                 </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-white">
               <button onClick={() => setViewingMember(null)} className="w-full py-4 rounded-xl font-bold bg-[#7ba1ee] text-white shadow-lg">Fechar Ficha</button>
            </div>
          </div>
        </div>
      )}

      {/* VISUALIZAÇÃO FICHA TIME */}
      {viewingGroup && (
        <div className="fixed inset-0 z-[2000]">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setViewingGroup(null)} />
          <div className="fixed top-0 right-0 h-full w-full md:w-[500px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#7ba1ee] text-white flex-shrink-0">
              <h3 className="font-bold text-xl">Detalhes do Time</h3>
              <button onClick={() => setViewingGroup(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="flex-1 p-8 space-y-8 overflow-y-auto bg-slate-50/20 h-full">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center border border-blue-100 shadow-inner">
                  <LayoutGrid size={40} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{viewingGroup.name}</h2>
                  <p className="text-slate-700 font-bold text-xs uppercase tracking-widest mt-1">Time Estratégico de Marketing</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <span className="text-[10px] text-slate-600 uppercase font-black tracking-widest block mb-2">Sobre este time</span>
                  <p className="text-sm text-slate-600 italic leading-relaxed">{viewingGroup.description || 'Nenhuma descrição detalhada fornecida.'}</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <span className="text-[10px] text-slate-600 uppercase font-black tracking-widest block mb-4">Integrantes ({members.filter(m => m.invitedTeamId === viewingGroup.id).length})</span>
                  <div className="space-y-3">
                    {members.filter(m => m.invitedTeamId === viewingGroup.id).map(m => (
                      <div key={m.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-[10px] text-slate-900 border border-slate-200">{m.name.charAt(0)}</div>
                          <span className="text-xs font-bold text-slate-900">{m.name}</span>
                        </div>
                        <span className="text-[9px] font-black px-2 py-0.5 bg-blue-100 text-blue-600 rounded-lg">{m.role}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <span className="text-[10px] text-slate-600 uppercase font-black tracking-widest block mb-4">Permissões Habilitadas</span>
                  <div className="flex flex-wrap gap-2">
                    {viewingGroup.canView && <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black">VISUALIZAR</span>}
                    {viewingGroup.canCreate && <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black">CRIAR</span>}
                    {viewingGroup.canEdit && <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black">EDITAR</span>}
                    {viewingGroup.canDelete && <span className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-black">EXCLUIR</span>}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-white">
               <button onClick={() => setViewingGroup(null)} className="w-full py-4 rounded-xl font-bold bg-[#7ba1ee] text-white shadow-lg">Fechar Detalhes</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAIS DE EXCLUSÃO */}
      {deletingMemberId && (
        <div className="fixed inset-0 z-[3000]">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setDeletingMemberId(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl h-fit">
             <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle size={32}/></div>
             <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Revogar acesso do membro?</h3>
             <p className="text-slate-700 text-center mb-8 text-sm italic leading-relaxed px-4">O vínculo dele com a área de marketing será excluído. O perfil de identidade global não será afetado.</p>
             <div className="flex gap-4">
                <button onClick={() => setDeletingMemberId(null)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">Manter</button>
                <button onClick={async () => { if (deletingMemberId) { await onDeleteMember(deletingMemberId); setDeletingMemberId(null); } }} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg">Confirmar</button>
             </div>
          </div>
        </div>
      )}

      {deletingGroupId && (
        <div className="fixed inset-0 z-[3000]">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setDeletingGroupId(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl h-fit">
             <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle size={32}/></div>
             <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Excluir time permanentemente?</h3>
             <p className="text-slate-700 text-center mb-8 text-sm italic leading-relaxed px-4">Esta ação apagará o time do banco de dados. Os membros vinculados continuarão ativos, mas sem o vínculo com este time.</p>
             <div className="flex gap-4">
                <button onClick={() => setDeletingGroupId(null)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">Manter</button>
                <button onClick={async () => { if (deletingGroupId) { await onDeleteGroup(deletingGroupId); setDeletingGroupId(null); } }} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg">Confirmar</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface MemberCardProps {
  member: TeamMember;
  teamName: string | null;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  menuOpenId: string | null;
  onToggleMenu: (id: string | null) => void;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, teamName, onView, onEdit, onDelete, menuOpenId, onToggleMenu }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col h-full">
      <div className={`absolute top-0 left-0 w-1 h-full ${member.role === 'ADM' ? 'bg-[#7ba1ee]' : member.role === 'Supervisor' ? 'bg-blue-500' : 'bg-[#4c6eb3]'}`} />
      <div className="flex justify-between items-start mb-4">
        <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900 font-black uppercase text-lg shadow-inner">{(member.name || "").charAt(0)}</div>
        <div className="relative">
          <button onClick={() => onToggleMenu(menuOpenId === member.id ? null : member.id)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"><MoreVertical size={20} /></button>
          {menuOpenId === member.id && (
            <>
              <div className="fixed inset-0 z-[100]" onClick={() => onToggleMenu(null)} />
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 z-[110] py-2 animate-in fade-in zoom-in-95 duration-100 text-left">
                <button onClick={() => { onView(); onToggleMenu(null); }} className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-bold transition-colors"><Eye size={14} className="text-blue-500" /> Ver Ficha</button>
                <button onClick={() => { onEdit(); onToggleMenu(null); }} className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-bold transition-colors"><Edit2 size={14} className="text-[#4c6eb3]" /> Editar</button>
                <div className="h-px bg-slate-100 my-1 mx-2" />
                <button onClick={() => { onDelete(); onToggleMenu(null); }} className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 flex items-center gap-2 font-bold transition-colors"><Trash2 size={14} /> Excluir</button>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="space-y-1 mb-4 flex-1 min-w-0">
        <h4 className="font-bold text-slate-900 text-sm truncate">{member.name}</h4>
        <p className="text-[10px] text-slate-600 font-bold truncate italic tracking-tighter">{member.email}</p>
        <div className="flex items-center gap-2 mt-2">
           <span className="text-[8px] font-black px-2 py-0.5 rounded-full border border-blue-100 bg-blue-50 text-blue-500 uppercase tracking-widest">
              {member.invitation}
           </span>
           {teamName && (
             <span className="text-[8px] font-bold text-slate-600 uppercase truncate max-w-[80px]">@ {teamName}</span>
           )}
        </div>
      </div>
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
        <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${member.role === 'ADM' ? 'bg-[#7ba1ee] text-white' : 'bg-slate-50 text-slate-700 border border-slate-100 shadow-sm'}`}>{member.role}</span>
        <span className={`text-[8px] font-black px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-tighter ${member.status === 'Ativo' ? 'text-emerald-500' : 'text-slate-300'}`}>
          <div className={`w-1 h-1 rounded-full ${member.status === 'Ativo' ? 'bg-emerald-500' : 'bg-slate-300'}`} /> {member.status}
        </span>
      </div>
    </div>
  );
};

export default Team;
