
import React, { useState, useEffect } from 'react';
import { X, Save, FileText, Layers, Palette, User, Calendar, CheckCircle2, Share2, ExternalLink, Check, Loader2 } from 'lucide-react';
import { Post, HistoryItem, PlannerItem, CreativeItem, TeamMember, PostStatus, DistributionChannel, BlogCategory } from '../types';
import { postService } from '../services/postService';
import { generateUUID } from '../services/supabaseClient';

interface PostFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (post: Post) => void;
  historyItems: HistoryItem[];
  plannerItems: PlannerItem[];
  creativeItems: CreativeItem[];
  teamMembers: TeamMember[];
  blogCategories?: BlogCategory[];
  editingPost?: Post | null;
  fixedHistoryId?: string;
  fixedContentIndex?: number;
  fixedPlannerId?: string;
  fixedCategoryId?: string;
  preselectedChannel?: DistributionChannel;
}

const ALL_CHANNELS: DistributionChannel[] = ['Instagram', 'Facebook', 'LinkedIn', 'YouTube', 'TikTok', 'Blog', 'Google Business'];

const PostFormDrawer: React.FC<PostFormDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  historyItems,
  plannerItems,
  creativeItems,
  teamMembers,
  blogCategories = [],
  editingPost,
  fixedHistoryId,
  fixedContentIndex,
  fixedPlannerId,
  fixedCategoryId,
  preselectedChannel
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    historyId: '',
    contentIndex: undefined as number | undefined,
    plannerId: '',
    channels: [] as DistributionChannel[],
    creativeIds: [] as string[],
    status: 'Rascunho' as PostStatus,
    authorId: '',
    scheduledDate: '',
    categoryId: ''
  });

  useEffect(() => {
    if (editingPost) {
      setForm({
        historyId: editingPost.historyId,
        contentIndex: editingPost.contentIndex,
        plannerId: editingPost.plannerId || '',
        channels: editingPost.channels || [],
        creativeIds: editingPost.creativeIds,
        status: editingPost.status,
        authorId: editingPost.authorId,
        scheduledDate: editingPost.scheduledDate || '',
        categoryId: editingPost.categoryId || ''
      });
    } else {
      const initialChannels: DistributionChannel[] = [];
      if (preselectedChannel) initialChannels.push(preselectedChannel);
      
      const planner = plannerItems.find(p => p.id === fixedPlannerId);
      if (planner && initialChannels.length === 0) {
        planner.channels.forEach(ch => initialChannels.push(ch));
      }

      setForm({
        historyId: fixedHistoryId || (historyItems.length > 0 ? historyItems[0].id : ''),
        contentIndex: fixedContentIndex,
        plannerId: fixedPlannerId || '',
        channels: initialChannels,
        creativeIds: [],
        status: 'Rascunho',
        authorId: teamMembers.length > 0 ? teamMembers[0].id : '',
        scheduledDate: '',
        categoryId: fixedCategoryId || ''
      });
    }
  }, [editingPost, fixedHistoryId, fixedContentIndex, fixedPlannerId, fixedCategoryId, preselectedChannel, historyItems, teamMembers, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.historyId || form.channels.length === 0 || isSaving) return;

    // Se authorId estiver vazio, usamos o primeiro da lista se houver
    const finalAuthorId = form.authorId || (teamMembers.length > 0 ? teamMembers[0].id : undefined);
    
    if (!finalAuthorId) {
      alert("Erro: Não foi possível identificar um responsável válido. Adicione um membro na aba Equipe.");
      return;
    }

    setIsSaving(true);
    try {
      const postData: Partial<Post> = {
        id: editingPost ? editingPost.id : generateUUID(),
        historyId: form.historyId,
        contentIndex: form.contentIndex,
        plannerId: form.plannerId || undefined,
        channels: form.channels,
        creativeIds: form.creativeIds,
        status: form.status,
        authorId: finalAuthorId,
        timestamp: editingPost ? editingPost.timestamp : Date.now(),
        scheduledDate: form.scheduledDate || undefined,
        categoryId: form.categoryId || undefined
      };

      const savedPost = await postService.save(postData);
      onSave(savedPost);
      onClose();
    } catch (error) {
      console.error("Erro ao salvar post no Supabase:", error);
      alert("Falha ao salvar post. Verifique as permissões do banco.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleChannel = (ch: DistributionChannel) => {
    const next = form.channels.includes(ch)
      ? form.channels.filter(c => c !== ch)
      : [...form.channels, ch];
    setForm({ ...form, channels: next });
  };

  const toggleCreative = (id: string) => {
    const next = form.creativeIds.includes(id)
      ? form.creativeIds.filter(cid => cid !== id)
      : [...form.creativeIds, id];
    setForm({ ...form, creativeIds: next });
  };

  const getTitle = (h: HistoryItem) => {
    const lastVersion = h.versions[h.versions.length - 1];
    if (!lastVersion) return 'Sem título';
    const contents = Array.isArray(lastVersion.content) ? lastVersion.content : [lastVersion.content];
    const index = (fixedHistoryId === h.id) ? (form.contentIndex ?? 0) : 0;
    const content = contents[index] || contents[0];
    return content?.title || 'Sem título';
  };

  const selectedPlanner = plannerItems.find(p => p.id === form.plannerId);
  const displayChannels = selectedPlanner ? selectedPlanner.channels : ALL_CHANNELS;

  if (!isOpen) return null;

  const inputClasses = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-[#fafafa] focus:ring-2 focus:ring-[#7ba1ee] focus:bg-white outline-none text-slate-900 font-medium transition-all placeholder:text-slate-600";

  return (
    <div className="fixed inset-0 z-[2000]">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full md:w-[600px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#7ba1ee] text-white">
          <h3 className="font-bold text-xl">{editingPost ? 'Editar Post' : 'Vincular Novo Post'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 h-full bg-slate-50/20">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText size={16} className="text-blue-500" /> Conteúdo (Histórico)
              </label>
              <select 
                required 
                disabled={!!fixedHistoryId || isSaving}
                className={`${inputClasses} ${fixedHistoryId ? 'opacity-60 cursor-not-allowed' : ''}`} 
                value={form.historyId} 
                onChange={e => setForm({...form, historyId: e.target.value})}
              >
                <option value="">Selecione um conteúdo...</option>
                {historyItems.map(h => (
                  <option key={h.id} value={h.id}>{getTitle(h)}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers size={16} className="text-purple-500" /> Tema do Planner (Opcional)
              </label>
              <select 
                disabled={isSaving}
                className={inputClasses} 
                value={form.plannerId} 
                onChange={e => {
                  const newPlannerId = e.target.value;
                  const newPlanner = plannerItems.find(p => p.id === newPlannerId);
                  setForm({
                    ...form, 
                    plannerId: newPlannerId, 
                    channels: newPlanner ? newPlanner.channels : []
                  });
                }}
              >
                <option value="">Sem vínculo com planner</option>
                {plannerItems.map(p => (
                  <option key={p.id} value={p.id}>{p.theme} ({p.format})</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Share2 size={16} className="text-blue-500" /> Canais de Distribuição
              </label>
              <div className="flex flex-wrap gap-2 p-3 bg-white border border-slate-100 rounded-2xl shadow-inner">
                 {displayChannels.map(ch => (
                   <button
                      key={ch}
                      type="button"
                      disabled={isSaving}
                      onClick={() => toggleChannel(ch)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${form.channels.includes(ch) ? 'bg-[#7ba1ee] text-white border-[#7ba1ee] shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-200'} disabled:opacity-50`}
                   >
                     {form.channels.includes(ch) && <Check size={14} />}
                     {ch}
                   </button>
                 ))}
              </div>
            </div>

            {form.channels.includes('Blog') && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers size={16} className="text-orange-500" /> Categoria do Blog
                </label>
                <select 
                  disabled={isSaving}
                  className={inputClasses} 
                  value={form.categoryId} 
                  onChange={e => setForm({...form, categoryId: e.target.value})}
                >
                  <option value="">Selecione uma categoria...</option>
                  {blogCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-900">Status</label>
                <select disabled={isSaving} className={inputClasses} value={form.status} onChange={e => setForm({...form, status: e.target.value as PostStatus})}>
                  <option value="Rascunho">Rascunho</option>
                  <option value="Em Revisão">Em Revisão</option>
                  <option value="Aprovado">Aprovado</option>
                  <option value="Agendado">Agendado</option>
                  <option value="Publicado">Publicado</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-900">Responsável</label>
                <select disabled={isSaving} required className={inputClasses} value={form.authorId} onChange={e => setForm({...form, authorId: e.target.value})}>
                  <option value="">Selecione...</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar size={16} /> Data de Agendamento (Opcional)
              </label>
              <div className="relative">
                <input type="date" disabled={isSaving} className={inputClasses} value={form.scheduledDate} onChange={e => setForm({...form, scheduledDate: e.target.value})} />
                <Calendar size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <label className="text-sm font-bold text-slate-900 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2"><Palette size={16} className="text-emerald-500" /> Criativos Visuais</span>
                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{form.creativeIds.length} selecionados</span>
              </label>
              
              <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto p-4 bg-white rounded-2xl border border-slate-100 shadow-inner">
                {creativeItems.length > 0 ? creativeItems.map(creative => (
                  <button 
                    key={creative.id} type="button" disabled={isSaving} onClick={() => toggleCreative(creative.id)}
                    className={`group relative flex flex-col rounded-2xl overflow-hidden border-2 transition-all text-left ${form.creativeIds.includes(creative.id) ? 'border-[#4c6eb3] ring-4 ring-[#4c6eb3]/10 shadow-lg' : 'border-slate-100 hover:border-slate-300'} disabled:opacity-50`}
                  >
                    <div className="aspect-[4/5] w-full bg-slate-100 relative overflow-hidden">
                      {creative.source === 'Canva' ? (
                          <div className="w-full h-full relative">
                            <iframe src={creative.url} className="w-full h-full border-none pointer-events-none" allowFullScreen />
                            <div className="absolute inset-0 bg-black/5" />
                          </div>
                      ) : (
                          <img src={creative.url} className="w-full h-full object-cover" alt="" />
                      )}
                      {form.creativeIds.includes(creative.id) && (
                        <div className="absolute inset-0 bg-[#4c6eb3]/20 backdrop-blur-[1px] flex items-center justify-center animate-in fade-in zoom-in duration-200">
                          <div className="bg-white rounded-full p-2 shadow-xl border-2 border-[#4c6eb3]">
                            <CheckCircle2 size={24} className="text-[#4c6eb3]" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className={`p-3 border-t transition-colors ${form.creativeIds.includes(creative.id) ? 'bg-[#4c6eb3]/5 border-[#4c6eb3]/20' : 'bg-white border-slate-50'}`}>
                       <p className="text-[10px] font-bold text-slate-900 truncate">{creative.title}</p>
                       <p className="text-[8px] font-black text-slate-600 uppercase tracking-tighter mt-0.5">{creative.source}</p>
                    </div>
                  </button>
                )) : (
                  <div className="col-span-2 py-10 text-center">
                    <p className="text-xs text-slate-600 italic">Nenhum criativo disponível na biblioteca.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-slate-100 bg-white flex-shrink-0 flex gap-4 shadow-lg">
          <button type="button" disabled={isSaving} onClick={onClose} className="flex-1 py-4 rounded-xl font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all">Cancelar</button>
          <button onClick={handleSubmit} disabled={!form.historyId || form.channels.length === 0 || isSaving} className="flex-[2] bg-[#7ba1ee] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#00152b] transition-all shadow-lg disabled:opacity-50">
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {isSaving ? 'Salvando no Banco...' : (editingPost ? 'Atualizar Post' : 'Finalizar Post')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostFormDrawer;
