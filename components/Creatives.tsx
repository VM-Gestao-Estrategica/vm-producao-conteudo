
import React, { useState, useEffect } from 'react';
import { CreativeItem, CreativeSource, CreativeMediaType, PlannerItem, Post, HistoryItem } from '../types';
import { generateUUID } from '../services/supabaseClient';
import { Palette, Plus, MoreVertical, Eye, Edit2, Trash2, X, Save, Info, Image as ImageIcon, Video, Link as LinkIcon, Upload, AlertTriangle, ExternalLink, Check, Loader2, Search, Calendar, FileText } from 'lucide-react';

import { creativeService } from '../services/creativeService';
import { postService } from '../services/postService';

interface CreativesProps {
  items: CreativeItem[];
  plannerItems: PlannerItem[];
  posts: Post[];
  historyItems: HistoryItem[];
  onSave: (item: CreativeItem) => void;
  onDelete: (id: string) => void;
  onPostUpdate?: (post: Post) => void;
}

const Creatives: React.FC<CreativesProps> = ({ items, plannerItems, posts, historyItems, onSave, onDelete, onPostUpdate }) => {
  const [showDrawer, setShowDrawer] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<CreativeItem | null>(null);
  const [viewingItem, setViewingItem] = useState<CreativeItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  // Confirmation Modal State
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<CreativeItem | null>(null);

  const [form, setForm] = useState({
    title: '',
    source: 'Canva' as CreativeSource,
    mediaType: 'Imagem' as CreativeMediaType,
    url: '',
    plannerItemId: undefined as string | undefined,
    postId: undefined as string | undefined
  });

  const [searchPlanner, setSearchPlanner] = useState('');
  const [searchPost, setSearchPost] = useState('');
  const [showPlannerResults, setShowPlannerResults] = useState(false);
  const [showPostResults, setShowPostResults] = useState(false);

  // Helper to get post title/preview
  const getPostTitle = (post: Post) => {
    const history = historyItems.find(h => h.id === post.historyId);
    if (!history) return `Post de ${new Date(post.timestamp).toLocaleDateString()}`;
    
    const lastVersion = history.versions[history.versions.length - 1];
    if (!lastVersion) return `Post de ${new Date(post.timestamp).toLocaleDateString()}`;
    
    const contents = Array.isArray(lastVersion.content) ? lastVersion.content : [lastVersion.content];
    const content = contents[post.contentIndex ?? 0] || contents[0];
    
    return content?.title || `Post de ${new Date(post.timestamp).toLocaleDateString()}`;
  };

  useEffect(() => {
    if (editingItem) {
      setForm({
        title: editingItem.title,
        source: editingItem.source,
        mediaType: editingItem.mediaType,
        url: editingItem.url,
        plannerItemId: editingItem.plannerItemId,
        postId: editingItem.postId
      });
      
      // Pre-fill search fields if IDs exist
      if (editingItem.plannerItemId) {
        const planner = plannerItems.find(p => p.id === editingItem.plannerItemId);
        if (planner) setSearchPlanner(planner.theme);
      }
      if (editingItem.postId) {
        const post = posts.find(p => p.id === editingItem.postId);
        if (post) {
             setSearchPost(getPostTitle(post));
        }
      }

      setShowDrawer(true);
    }
  }, [editingItem, plannerItems, posts, historyItems]);

  const handleOpenMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + window.scrollY,
      left: rect.right + window.scrollX - 160
    });
    setMenuOpenId(id);
  };

  const closeDrawer = () => {
    setShowDrawer(false);
    setEditingItem(null);
    setForm({ title: '', source: 'Canva', mediaType: 'Imagem', url: '', plannerItemId: undefined, postId: undefined });
    setSearchPlanner('');
    setSearchPost('');
    setShowConfirmationModal(false);
    setPendingSaveData(null);
  };

  const processCanvaInput = (input: string): string => {
    if (!input) return '';
    if (input.includes('<iframe')) {
      const match = input.match(/src="([^"]+)"/);
      if (match && match[1]) {
        let url = match[1];
        if (!url.includes('?embed') && !url.includes('&embed')) {
          url += (url.includes('?') ? '&' : '?') + 'embed';
        }
        return url;
      }
    }
    if (input.includes('canva.com/design/')) {
      let url = input.trim().split(' ')[0];
      if (!url.includes('?embed') && !url.includes('&embed')) {
        url += (url.includes('?') ? '&' : '?') + 'embed';
      }
      return url;
    }
    return input;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.url || isSaving) return;

    const finalUrl = form.source === 'Canva' ? processCanvaInput(form.url) : form.url;
    
    const newItem: CreativeItem = {
      id: editingItem ? editingItem.id : generateUUID(),
      title: form.title,
      source: form.source,
      mediaType: form.mediaType,
      url: finalUrl,
      timestamp: editingItem ? editingItem.timestamp : Date.now(),
      plannerItemId: form.plannerItemId,
      postId: form.postId
    };

    if (form.plannerItemId || form.postId) {
        setPendingSaveData(newItem);
        setShowConfirmationModal(true);
    } else {
        saveCreative(newItem);
    }
  };

  const saveCreative = async (item: CreativeItem) => {
    setIsSaving(true);
    try {
      // 1. Salvar o Criativo
      await onSave(item);

      // 2. Se houver Post vinculado, atualizar o Post com o ID do criativo
      if (item.postId && onPostUpdate) {
        const postToUpdate = posts.find(p => p.id === item.postId);
        if (postToUpdate) {
          // Evitar duplicatas
          const currentCreativeIds = postToUpdate.creativeIds || [];
          if (!currentCreativeIds.includes(item.id)) {
            const updatedPost = {
              ...postToUpdate,
              creativeIds: [...currentCreativeIds, item.id]
            };
            
            // Persistir no banco
            await postService.save(updatedPost);
            
            // Atualizar estado local
            onPostUpdate(updatedPost);
          }
        }
      }

      closeDrawer();
    } catch (error) {
      console.error("Erro ao salvar criativo:", error);
      alert("Erro ao sincronizar com o banco de dados.");
    } finally {
      setIsSaving(false);
      setShowConfirmationModal(false);
      setPendingSaveData(null);
    }
  };
// ... rest of component

  const filteredPlannerItems = plannerItems.filter(item => 
    item.theme.toLowerCase().includes(searchPlanner.toLowerCase())
  );

  const filteredPosts = posts.filter(post => 
     getPostTitle(post).toLowerCase().includes(searchPost.toLowerCase())
  );

  const inputClasses = "w-full px-4 py-4 rounded-xl border border-slate-200 bg-[#fafafa] focus:ring-2 focus:ring-[#7ba1ee] focus:bg-white outline-none text-slate-900 font-medium transition-all placeholder:text-slate-600 appearance-none";

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-12 w-full px-4 relative">
      <div className="flex justify-between items-center px-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Minhas Mídias</h2>
          <p className="text-slate-700 text-sm">Organize seus criativos do Canva e arquivos de armazenamento.</p>
        </div>
        <button onClick={() => setShowDrawer(true)} className="bg-[#7ba1ee] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#00152b] transition-all shadow-lg"><Plus size={20} /> Novo Criativo</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
        {items.length > 0 ? [...items].sort((a, b) => b.timestamp - a.timestamp).map(item => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col h-full">
            <div className="aspect-[4/5] relative bg-slate-100 overflow-hidden">
               {item.source === 'Canva' ? (
                  <div className="w-full h-full relative group/canva">
                    <iframe src={item.url} loading="lazy" className="w-full h-full border-none pointer-events-none scale-105" allowFullScreen></iframe>
                    <div className="absolute inset-0 bg-transparent z-10" />
                  </div>
                ) : (
                  item.mediaType === 'Imagem' ? ( <img src={item.url} alt={item.title} className="w-full h-full object-cover" /> ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900">
                      <video src={item.url} className="w-full h-full object-cover opacity-60" muted playsInline />
                      <div className="absolute inset-0 flex items-center justify-center"><Video size={48} className="text-white/50" /></div>
                    </div>
                  )
                )}
                <div className="absolute top-4 right-4 z-20">
                  <button onClick={(e) => handleOpenMenu(e, item.id)} className="p-2 bg-white/90 backdrop-blur-sm rounded-lg text-slate-700 shadow-sm hover:bg-white transition-colors"><MoreVertical size={18} /></button>
                </div>
                
                {/* Badges de Vínculo */}
                <div className="absolute bottom-2 left-2 flex flex-col gap-1 z-20">
                    {item.plannerItemId && (
                        <span className="bg-blue-500/90 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Calendar size={8} /> PLANNER
                        </span>
                    )}
                    {item.postId && (
                        <span className="bg-purple-500/90 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <FileText size={8} /> POST
                        </span>
                    )}
                </div>
            </div>
            <div className="p-4 flex flex-col flex-1 border-t border-slate-100">
              <h4 className="font-bold text-slate-900 line-clamp-1 mb-2">{item.title}</h4>
              <div className="flex items-center justify-between mt-auto">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${item.source === 'Canva' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>{item.source}</span>
                <span className="text-[10px] text-slate-600 font-medium">{new Date(item.timestamp).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-slate-200 border-dashed">
            <Palette size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-600 font-medium">Nenhum criativo na biblioteca. Adicione links do Canva ou fotos.</p>
          </div>
        )}
      </div>

      {menuOpenId && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setMenuOpenId(null)} />
          <div style={{ position: 'fixed', top: `${menuPosition.top}px`, left: `${menuPosition.left}px`, zIndex: 110 }} className="w-40 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 animate-in fade-in zoom-in-95 duration-100">
             <button onClick={() => { setViewingItem(items.find(i => i.id === menuOpenId)!); setMenuOpenId(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 font-bold transition-colors"><Eye size={16} className="text-blue-500" /> Ver Grande</button>
             <button onClick={() => { setEditingItem(items.find(i => i.id === menuOpenId)!); setMenuOpenId(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 font-bold transition-colors"><Edit2 size={16} className="text-[#4c6eb3]" /> Editar</button>
             <div className="h-px bg-slate-100 my-1 mx-2" />
             <button onClick={() => { setDeletingId(menuOpenId); setMenuOpenId(null); }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-3 font-bold transition-colors"><Trash2 size={16} /> Excluir</button>
          </div>
        </>
      )}

      {showDrawer && (
        <div className="fixed inset-0 z-[2000]">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity" onClick={closeDrawer} />
          <div className="fixed top-0 right-0 h-full w-full md:w-[600px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#7ba1ee] text-white">
              <h3 className="font-bold text-xl">{editingItem ? 'Editar Criativo' : 'Novo Criativo'}</h3>
              <button onClick={closeDrawer} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleInitialSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/20">
               <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900">Título Identificador</label>
                  <input required disabled={isSaving} className={inputClasses} placeholder="Ex: Post de Planejamento Tributário V1" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
               </div>
               
               {/* VINCULAR AO PLANNER */}
               <div className="space-y-2 relative">
                  <label className="text-sm font-bold text-slate-900 flex items-center gap-2"><Calendar size={14} className="text-blue-500" /> Vincular ao Planner</label>
                  <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                      <input 
                        type="text"
                        className={`${inputClasses} pl-12`} 
                        placeholder="Pesquisar tema planejado..." 
                        value={searchPlanner}
                        onChange={e => { setSearchPlanner(e.target.value); setShowPlannerResults(true); if(!e.target.value) setForm({...form, plannerItemId: undefined}); }}
                        onFocus={() => setShowPlannerResults(true)}
                      />
                      {form.plannerItemId && (
                          <button type="button" onClick={() => { setForm({...form, plannerItemId: undefined}); setSearchPlanner(''); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-red-500">
                              <X size={16} />
                          </button>
                      )}
                  </div>
                  {showPlannerResults && searchPlanner && !form.plannerItemId && (
                      <div className="absolute z-10 w-full bg-white mt-2 rounded-xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto">
                          {filteredPlannerItems.length > 0 ? (
                              filteredPlannerItems.map(item => (
                                  <button 
                                    key={item.id} 
                                    type="button"
                                    onClick={() => { setForm({...form, plannerItemId: item.id}); setSearchPlanner(item.theme); setShowPlannerResults(false); }}
                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 text-sm text-slate-700"
                                  >
                                      <span className="font-bold block text-slate-900">{item.theme}</span>
                                      <span className="text-xs text-slate-600">{new Date(item.date).toLocaleDateString()}</span>
                                  </button>
                              ))
                          ) : (
                              <div className="p-4 text-center text-slate-600 text-sm">Nenhum planejamento encontrado.</div>
                          )}
                      </div>
                  )}
               </div>

               {/* VINCULAR AO POST */}
               <div className="space-y-2 relative">
                  <label className="text-sm font-bold text-slate-900 flex items-center gap-2"><FileText size={14} className="text-purple-500" /> Vincular ao Post</label>
                  <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                      <input 
                        type="text"
                        className={`${inputClasses} pl-12`} 
                        placeholder="Pesquisar post..." 
                        value={searchPost}
                        onChange={e => { setSearchPost(e.target.value); setShowPostResults(true); if(!e.target.value) setForm({...form, postId: undefined}); }}
                        onFocus={() => setShowPostResults(true)}
                      />
                      {form.postId && (
                          <button type="button" onClick={() => { setForm({...form, postId: undefined}); setSearchPost(''); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-red-500">
                              <X size={16} />
                          </button>
                      )}
                  </div>
                  {showPostResults && searchPost && !form.postId && (
                      <div className="absolute z-10 w-full bg-white mt-2 rounded-xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto">
                          {filteredPosts.length > 0 ? (
                              filteredPosts.map(post => (
                                  <button 
                                    key={post.id} 
                                    type="button"
                                    onClick={() => { setForm({...form, postId: post.id}); setSearchPost(getPostTitle(post)); setShowPostResults(false); }}
                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 text-sm text-slate-700"
                                  >
                                      <span className="font-bold block text-slate-900">{getPostTitle(post)}</span>
                                      <span className="text-xs text-slate-600">{new Date(post.timestamp).toLocaleDateString()} • {post.status}</span>
                                  </button>
                              ))
                          ) : (
                              <div className="p-4 text-center text-slate-600 text-sm">Nenhum post encontrado.</div>
                          )}
                      </div>
                  )}
               </div>

               <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900">Origem da Mídia</label>
                  <div className="flex bg-white p-1 rounded-2xl border border-slate-200">
                    <button type="button" onClick={() => setForm({...form, source: 'Canva'})} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${form.source === 'Canva' ? 'bg-[#7ba1ee] text-white shadow-md' : 'text-slate-700'}`}>Canva (Link/Iframe)</button>
                    <button type="button" onClick={() => setForm({...form, source: 'Storage'})} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${form.source === 'Storage' ? 'bg-[#7ba1ee] text-white shadow-md' : 'text-slate-700'}`}>Arquivo Local</button>
                  </div>
               </div>

               {form.source === 'Canva' ? (
                 <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                   <label className="text-sm font-bold text-slate-900">Link de Incorporação ou URL</label>
                   <textarea rows={5} disabled={isSaving} className={`${inputClasses} resize-none font-mono text-xs`} placeholder="Cole o link 'Smart Embed' ou o código <iframe> do Canva..." value={form.url} onChange={e => setForm({...form, url: e.target.value})} />
                   <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                      <Info size={20} className="text-blue-500 flex-shrink-0" />
                      <p className="text-[10px] text-blue-700 leading-relaxed font-medium italic">No Canva, clique em <b>Compartilhar &gt; Mais &gt; Incorporar</b> para obter o link otimizado.</p>
                   </div>
                   
                   {/* PREVIEW EM TEMPO REAL NO DRAWER (CANVA) */}
                   {form.url && (
                     <div className="mt-4 space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Pré-visualização do Design</label>
                        <div className="rounded-2xl overflow-hidden aspect-[4/5] bg-slate-100 border border-slate-200 shadow-inner">
                           <iframe src={processCanvaInput(form.url)} className="w-full h-full border-none pointer-events-none" allowFullScreen />
                        </div>
                     </div>
                   )}
                 </div>
               ) : (
                 <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-2 gap-4">
                      <button type="button" onClick={() => setForm({...form, mediaType: 'Imagem'})} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${form.mediaType === 'Imagem' ? 'border-[#4c6eb3] bg-[#4c6eb3]/5 text-slate-900' : 'border-slate-100 bg-white text-slate-600'}`}><ImageIcon size={24}/> <span className="text-[10px] font-bold uppercase">Imagem</span></button>
                      <button type="button" onClick={() => setForm({...form, mediaType: 'Vídeo'})} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${form.mediaType === 'Vídeo' ? 'border-[#4c6eb3] bg-[#4c6eb3]/5 text-slate-900' : 'border-slate-100 bg-white text-slate-600'}`}><Video size={24}/> <span className="text-[10px] font-bold uppercase">Vídeo</span></button>
                    </div>
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-slate-200 border-dashed rounded-3xl cursor-pointer bg-white hover:bg-slate-50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-3 text-slate-600" />
                            <p className="mb-2 text-sm text-slate-700 font-bold">Clique para enviar</p>
                            <p className="text-xs text-slate-600">JPG, PNG ou MP4</p>
                        </div>
                        <input type="file" className="hidden" accept={form.mediaType === 'Imagem' ? 'image/*' : 'video/*'} onChange={handleFileChange} />
                    </label>
                    
                    {/* PREVIEW EM TEMPO REAL NO DRAWER (LOCAL) */}
                    {form.url && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Pré-visualização do Arquivo</label>
                        <div className="relative rounded-2xl overflow-hidden aspect-[4/5] bg-black/5 border border-slate-200">
                          {form.mediaType === 'Imagem' ? <img src={form.url} className="w-full h-full object-contain" /> : <video src={form.url} className="w-full h-full object-contain" controls />}
                          <button type="button" onClick={() => setForm({...form, url: ''})} className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-xl shadow-lg hover:bg-red-600 transition-colors"><X size={18}/></button>
                        </div>
                      </div>
                    )}
                 </div>
               )}
            </form>
            <div className="p-6 border-t border-slate-100 bg-white flex gap-4 shadow-lg">
              <button type="button" disabled={isSaving} onClick={closeDrawer} className="flex-1 py-4 rounded-xl font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all">Cancelar</button>
              <button onClick={handleInitialSubmit} disabled={isSaving || !form.title || !form.url} className="flex-[2] bg-[#7ba1ee] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#00152b] transition-all shadow-lg disabled:opacity-40">
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                {isSaving ? 'Salvando Criativo...' : (editingItem ? 'Atualizar Criativo' : 'Salvar na Biblioteca')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE VÍNCULO */}
      {showConfirmationModal && pendingSaveData && (
          <div className="fixed inset-0 z-[3000]">
              <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowConfirmationModal(false)} />
              <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl p-8 z-[3010] shadow-2xl animate-in zoom-in duration-200">
                  <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <LinkIcon size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Confirmar Vínculo?</h3>
                  <p className="text-slate-700 text-center mb-6 text-sm">
                      Você está vinculando este criativo a:
                      {pendingSaveData.plannerItemId && <span className="block font-bold mt-1 text-blue-600">Planner: {plannerItems.find(p => p.id === pendingSaveData.plannerItemId)?.theme}</span>}
                      {pendingSaveData.postId && <span className="block font-bold mt-1 text-purple-600">Post: {getPostTitle(posts.find(p => p.id === pendingSaveData.postId)!)}</span>}
                      <span className="block mt-4 italic">Uma função automática irá popular as imagens nos posts correspondentes.</span>
                  </p>
                  <div className="flex gap-4">
                      <button onClick={() => setShowConfirmationModal(false)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
                      <button onClick={() => saveCreative(pendingSaveData)} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg">Confirmar</button>
                  </div>
              </div>
          </div>
      )}

      {/* Visualização Lateral (Sidebar) */}
      {viewingItem && (
        <div className="fixed inset-0 z-[3000]">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setViewingItem(null)} />
          <div className="fixed top-0 right-0 h-full w-full md:w-[600px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#7ba1ee] text-white flex-shrink-0">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl"><Palette size={20}/></div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight line-clamp-1">{viewingItem.title}</h3>
                    <p className="text-[10px] text-[#4c6eb3] font-bold uppercase tracking-widest">{viewingItem.source} • {viewingItem.mediaType}</p>
                  </div>
               </div>
               <button onClick={() => setViewingItem(null)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                <X size={24} />
               </button>
             </div>
             
             <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mb-6">
                    <div className="aspect-[4/5] relative bg-slate-100 w-full flex items-center justify-center">
                        {viewingItem.source === 'Canva' ? (
                        <iframe src={viewingItem.url} className="w-full h-full border-none" allowFullScreen />
                        ) : (
                        viewingItem.mediaType === 'Imagem' ? (
                            <img src={viewingItem.url} className="w-full h-full object-contain bg-slate-900" alt={viewingItem.title} />
                        ) : (
                            <video src={viewingItem.url} className="w-full h-full object-contain bg-slate-900" controls autoPlay />
                        )
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <span className="text-[10px] text-slate-600 uppercase font-bold block mb-2">Detalhes do Arquivo</span>
                        <div className="flex flex-col gap-3">
                             <div className="flex justify-between text-sm border-b border-slate-50 pb-2">
                                <span className="text-slate-700">Título</span>
                                <span className="font-medium text-slate-900">{viewingItem.title}</span>
                             </div>
                             <div className="flex justify-between text-sm border-b border-slate-50 pb-2">
                                <span className="text-slate-700">Adicionado em</span>
                                <span className="font-medium text-slate-900">{new Date(viewingItem.timestamp).toLocaleString()}</span>
                             </div>
                             <div className="flex justify-between text-sm">
                                <span className="text-slate-700">Tipo</span>
                                <span className="font-medium text-slate-900">{viewingItem.mediaType}</span>
                             </div>
                        </div>
                    </div>
                    
                    {/* Vínculos */}
                    {(viewingItem.plannerItemId || viewingItem.postId) && (
                        <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                             <span className="text-[10px] text-slate-600 uppercase font-bold block mb-2">Vínculos Ativos</span>
                             <div className="space-y-2">
                                {viewingItem.plannerItemId && (
                                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                        <div className="p-2 bg-white rounded-md text-blue-500 shadow-sm"><Calendar size={16} /></div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] text-blue-400 font-bold uppercase">Planner</p>
                                            <p className="text-sm text-blue-900 font-bold truncate">{plannerItems.find(p => p.id === viewingItem.plannerItemId)?.theme || 'Item não encontrado'}</p>
                                        </div>
                                    </div>
                                )}
                                {viewingItem.postId && (
                                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                                        <div className="p-2 bg-white rounded-md text-purple-500 shadow-sm"><FileText size={16} /></div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] text-purple-400 font-bold uppercase">Post</p>
                                            <p className="text-sm text-purple-900 font-bold truncate">
                                                {(() => {
                                                    const post = posts.find(p => p.id === viewingItem.postId);
                                                    return post ? getPostTitle(post) : 'Post não encontrado';
                                                })()}
                                            </p>
                                        </div>
                                    </div>
                                )}
                             </div>
                        </div>
                    )}
                </div>
             </div>
             
             <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3">
                <button onClick={() => { setEditingItem(viewingItem); setViewingItem(null); }} className="px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2">
                    <Edit2 size={16} /> Editar
                </button>
                <button onClick={() => setViewingItem(null)} className="px-6 py-3 bg-[#7ba1ee] text-white font-bold rounded-xl hover:bg-[#00152b] transition-colors">Fechar</button>
             </div>
          </div>
        </div>
      )}

      {/* Modal Deletar */}
      {deletingId && (
        <div className="fixed inset-0 z-[4000]">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setDeletingId(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl p-8 z-[4060] shadow-2xl animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle size={32} /></div>
            <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Excluir criativo?</h3>
            <p className="text-slate-700 text-center mb-8 italic text-sm">Esta ação removerá o arquivo da biblioteca. Posts já finalizados que utilizam este criativo podem perder a referência visual.</p>
            <div className="flex gap-4">
              <button onClick={() => setDeletingId(null)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
              <button onClick={() => { onDelete(deletingId); setDeletingId(null); }} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 shadow-lg">Excluir Agora</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Creatives;
