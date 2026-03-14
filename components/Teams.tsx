
import React, { useState, useEffect } from 'react';
import { TeamGroup, TeamMember } from '../types';
import { Plus, Search, MoreVertical, Edit2, Trash2, X, Save, Users, Shield, AlertTriangle, Check, LayoutGrid, UserPlus, CheckCircle2, Circle } from 'lucide-react';

interface TeamsProps {
  teams: TeamGroup[];
  members: TeamMember[];
  onSave: (group: TeamGroup) => void;
  onDelete: (id: string) => void;
}

const PAGES = ['dashboard', 'generator', 'history', 'planner', 'creatives', 'team', 'teams', 'settings'];

const Teams: React.FC<TeamsProps> = ({ teams, members, onSave, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamGroup | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    memberIds: [] as string[],
    // Fix: Added missing 'canView' property required by TeamGroup interface
    canView: true,
    canEdit: true,
    canCreate: true,
    canDelete: false,
    accessiblePages: ['dashboard', 'generator'] as string[]
  });

  useEffect(() => {
    if (editingTeam) {
      setForm({
        name: editingTeam.name,
        description: editingTeam.description,
        memberIds: editingTeam.memberIds,
        // Fix: Ensuring 'canView' is mapped from editingTeam
        canView: editingTeam.canView,
        canEdit: editingTeam.canEdit,
        canCreate: editingTeam.canCreate,
        canDelete: editingTeam.canDelete,
        accessiblePages: editingTeam.accessiblePages
      });
      setShowDrawer(true);
    }
  }, [editingTeam]);

  const closeDrawer = () => {
    setShowDrawer(false);
    setEditingTeam(null);
    setForm({
      name: '',
      description: '',
      memberIds: [],
      // Fix: Added missing 'canView' property to default state
      canView: true,
      canEdit: true,
      canCreate: true,
      canDelete: false,
      accessiblePages: ['dashboard', 'generator']
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;

    onSave({
      id: editingTeam ? editingTeam.id : Math.random().toString(36).substr(2, 9),
      ...form
    });

    closeDrawer();
  };

  const confirmDelete = () => {
    if (deletingId) {
      onDelete(deletingId);
      setDeletingId(null);
    }
  };

  const toggleMember = (id: string) => {
    const next = form.memberIds.includes(id)
      ? form.memberIds.filter(mid => mid !== id)
      : [...form.memberIds, id];
    setForm({ ...form, memberIds: next });
  };

  const togglePage = (page: string) => {
    const next = form.accessiblePages.includes(page)
      ? form.accessiblePages.filter(p => p !== page)
      : [...form.accessiblePages, page];
    setForm({ ...form, accessiblePages: next });
  };

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inputClasses = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-[#fafafa] focus:ring-2 focus:ring-[#7ba1ee] focus:bg-white outline-none text-slate-900 font-medium transition-all placeholder:text-slate-600";

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-12 w-full px-4 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
        <div className="relative flex-1 w-full max-w-md">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">
            <Search size={20} />
          </div>
          <input 
            type="text"
            placeholder="Pesquisar times..."
            className={`${inputClasses} pl-12`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setShowDrawer(true)}
          className="bg-[#7ba1ee] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#00152b] transition-all shadow-lg w-full md:w-auto justify-center"
        >
          <Plus size={20} /> Novo Time
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeams.length > 0 ? filteredTeams.map(team => (
          <div key={team.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col h-full">
            <div className="absolute top-0 right-0 p-2">
               <button 
                  onClick={() => setMenuOpenId(menuOpenId === team.id ? null : team.id)}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                >
                  <MoreVertical size={20} />
                </button>
                {menuOpenId === team.id && (
                  <>
                    <div className="fixed inset-0 z-[100]" onClick={() => setMenuOpenId(null)} />
                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 z-[110] py-2 animate-in fade-in zoom-in-95 duration-100">
                      <button 
                        onClick={() => { setEditingTeam(team); setMenuOpenId(null); }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                      >
                        <Edit2 size={16} className="text-[#4c6eb3]" /> Editar
                      </button>
                      <div className="h-px bg-slate-100 my-1" />
                      <button 
                        onClick={() => { setDeletingId(team.id); setMenuOpenId(null); }}
                        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-3"
                      >
                        <Trash2 size={16} /> Excluir
                      </button>
                    </div>
                  </>
                )}
            </div>

            <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <LayoutGrid size={24} />
               </div>
               <div>
                  <h4 className="font-bold text-slate-900 text-lg">{team.name}</h4>
                  <p className="text-slate-600 text-xs">{team.memberIds.length} membros vinculados</p>
               </div>
            </div>

            <p className="text-slate-700 text-sm mb-6 line-clamp-2 italic">{team.description || "Sem descrição disponível."}</p>

            <div className="mt-auto space-y-4 pt-4 border-t border-slate-50">
               <div>
                  <span className="text-[10px] uppercase font-bold text-slate-300 tracking-widest block mb-2">Membros</span>
                  <div className="flex -space-x-2 overflow-hidden">
                    {team.memberIds.slice(0, 5).map(mid => {
                      const m = members.find(x => x.id === mid);
                      return (
                        <div key={mid} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-900" title={m?.name}>
                          {m?.name.charAt(0)}
                        </div>
                      );
                    })}
                    {team.memberIds.length > 5 && (
                      <div className="flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-white bg-slate-200 text-[10px] font-bold text-slate-900">
                        +{team.memberIds.length - 5}
                      </div>
                    )}
                  </div>
               </div>

               <div>
                  <span className="text-[10px] uppercase font-bold text-slate-300 tracking-widest block mb-2">Permissões de Time</span>
                  <div className="flex gap-2">
                    {team.canView && <span className="bg-indigo-50 text-indigo-600 text-[9px] px-2 py-0.5 rounded font-bold uppercase">Ver</span>}
                    {team.canCreate && <span className="bg-emerald-50 text-emerald-600 text-[9px] px-2 py-0.5 rounded font-bold uppercase">Criar</span>}
                    {team.canEdit && <span className="bg-blue-50 text-blue-600 text-[9px] px-2 py-0.5 rounded font-bold uppercase">Editar</span>}
                    {team.canDelete && <span className="bg-red-50 text-red-600 text-[9px] px-2 py-0.5 rounded font-bold uppercase">Excluir</span>}
                  </div>
               </div>
            </div>
          </div>
        )) : (
          <div className="md:col-span-2 lg:col-span-3 text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
            <LayoutGrid size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-600 font-medium">Nenhum time estratégico configurado.</p>
          </div>
        )}
      </div>

      {/* Side Drawer CRUD */}
      {showDrawer && (
        <div className="fixed inset-0 z-[2000]">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={closeDrawer} />
          <div className="fixed top-0 right-0 h-full w-full md:w-[600px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#7ba1ee] text-white">
              <h3 className="font-bold text-xl">{editingTeam ? 'Editar Time' : 'Novo Time Estratégico'}</h3>
              <button onClick={closeDrawer} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 h-full bg-slate-50/20">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <LayoutGrid size={16} className="text-blue-500" /> Nome do Time
                  </label>
                  <input required className={inputClasses} placeholder="Ex: Equipe de Social Media" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900">Descrição/Objetivo</label>
                  <textarea rows={2} className={`${inputClasses} resize-none`} placeholder="Descreva as responsabilidades deste time..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <UserPlus size={16} className="text-emerald-500" /> Vincular Membros
                  </label>
                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto p-2 bg-white rounded-xl border border-slate-100">
                    {members.map(member => (
                      <button 
                        key={member.id}
                        type="button"
                        onClick={() => toggleMember(member.id)}
                        className={`flex items-center justify-between p-3 rounded-xl transition-all ${form.memberIds.includes(member.id) ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : 'hover:bg-slate-50 border-transparent'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">{member.name.charAt(0)}</div>
                          <div className="text-left">
                            <p className="text-sm font-bold text-slate-900">{member.name}</p>
                            <p className="text-[10px] text-slate-600 uppercase">{member.role}</p>
                          </div>
                        </div>
                        {form.memberIds.includes(member.id) ? <CheckCircle2 size={18} className="text-blue-500" /> : <Circle size={18} className="text-slate-200" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Shield size={16} className="text-purple-500" /> Permissões Coletivas do Time
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Fix: Included canView in permissions setup if necessary, but following UI pattern of original code */}
                    <button 
                      type="button" 
                      onClick={() => setForm({...form, canCreate: !form.canCreate})}
                      className={`py-3 rounded-xl border font-bold text-xs transition-all ${form.canCreate ? 'bg-[#7ba1ee] text-white' : 'bg-white text-slate-600 border-slate-100'}`}
                    >
                      Criar
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setForm({...form, canEdit: !form.canEdit})}
                      className={`py-3 rounded-xl border font-bold text-xs transition-all ${form.canEdit ? 'bg-[#7ba1ee] text-white' : 'bg-white text-slate-600 border-slate-100'}`}
                    >
                      Editar
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setForm({...form, canDelete: !form.canDelete})}
                      className={`py-3 rounded-xl border font-bold text-xs transition-all ${form.canDelete ? 'bg-[#7ba1ee] text-white' : 'bg-white text-slate-600 border-slate-100'}`}
                    >
                      Excluir
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900">Páginas Acessíveis</label>
                  <div className="flex flex-wrap gap-2">
                    {PAGES.map(page => (
                      <button 
                        key={page}
                        type="button"
                        onClick={() => togglePage(page)}
                        className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all ${form.accessiblePages.includes(page) ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-600 border-slate-100'}`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </form>

            <div className="p-6 border-t border-slate-100 bg-white flex-shrink-0 flex gap-4 shadow-lg">
              <button type="button" onClick={closeDrawer} className="flex-1 py-4 rounded-xl font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all">Cancelar</button>
              <button onClick={handleSubmit} disabled={!form.name} className="flex-[2] bg-[#7ba1ee] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#00152b] transition-all shadow-lg disabled:opacity-50">
                <Save size={20} /> {editingTeam ? 'Atualizar Time' : 'Salvar Time'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-[3000]">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setDeletingId(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Remover time estratégico?</h3>
            <p className="text-slate-700 text-center mb-8 italic text-sm">Esta ação removerá o grupo e as permissões coletivas vinculadas a ele. Os membros continuarão ativos individualmente no sistema.</p>
            <div className="flex gap-4">
              <button onClick={() => setDeletingId(null)} className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors text-sm">Manter Time</button>
              <button onClick={confirmDelete} className="flex-1 py-3 px-4 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors text-sm">Excluir Grupo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;
