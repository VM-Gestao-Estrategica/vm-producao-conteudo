import React, { useState, useMemo } from 'react';
import { Post, HistoryItem, PlannerItem, CreativeItem, TeamMember, PostStatus, BlogCategory, DistributionChannel } from '../types';
import { postService } from '../services/postService';
import { 
  Plus, Search, MoreVertical, Edit2, Trash2, X, Send, Eye, Calendar, User, 
  Layers, Palette, AlertTriangle, Clock, FileText, Share2, ExternalLink,
  CheckCircle2, Image as ImageIcon, ChevronDown, Loader2, Filter, ArrowUpDown
} from 'lucide-react';
import PostFormDrawer from './PostFormDrawer';

interface PostsProps {
  posts: Post[];
  historyItems: HistoryItem[];
  plannerItems: PlannerItem[];
  creativeItems: CreativeItem[];
  teamMembers: TeamMember[];
  blogCategories?: BlogCategory[];
  onSave: (post: Post) => void;
  onDelete: (id: string) => void;
}

const CHANNELS: DistributionChannel[] = ['Instagram', 'Facebook', 'LinkedIn', 'YouTube', 'TikTok', 'Blog', 'Google Business'];

const Posts: React.FC<PostsProps> = ({ posts, historyItems, plannerItems, creativeItems, teamMembers, blogCategories = [], onSave, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<PostStatus | 'all'>('all');
  const [filterChannel, setFilterChannel] = useState<DistributionChannel | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date_asc' | 'date_desc' | 'title_asc' | 'title_desc'>('date_desc');

  const [showDrawer, setShowDrawer] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [viewingPost, setViewingPost] = useState<Post | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const handleOpenMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + window.scrollY,
      left: rect.right + window.scrollX - 160
    });
    setMenuOpenId(id);
  };

  const confirmDelete = () => {
    if (deletingId) {
      onDelete(deletingId);
      setDeletingId(null);
    }
  };

  const handleStatusChange = async (post: Post, newStatus: PostStatus) => {
    if (post.status === newStatus) return;
    
    setUpdatingStatusId(post.id);
    try {
      const updatedPost = await postService.save({ ...post, status: newStatus });
      onSave(updatedPost);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Falha ao sincronizar novo status com o banco.");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const getPostContent = (post: Post) => {
    const history = historyItems.find(h => h.id === post.historyId);
    if (!history) return null;
    const lastVersion = history.versions[history.versions.length - 1];
    if (!lastVersion) return null;
    const contents = Array.isArray(lastVersion.content) ? lastVersion.content : [lastVersion.content];
    return contents[post.contentIndex ?? 0] || contents[0];
  };

  const filteredPosts = useMemo(() => {
    let result = posts.filter(p => {
      const content = getPostContent(p);
      const title = content?.title || "";
      const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
      const matchesChannel = filterChannel === 'all' || p.channels.includes(filterChannel);
      
      return matchesSearch && matchesStatus && matchesChannel;
    });

    return result;
  }, [posts, searchTerm, filterStatus, filterChannel, historyItems]);

  const groupedDisplayItems = useMemo(() => {
    const grouped = filteredPosts.reduce((acc, post) => {
      if (post.plannerId) {
        const existingGroup = acc.find(item => item.type === 'group' && item.plannerId === post.plannerId) as { type: 'group', plannerId: string, posts: Post[] } | undefined;
        if (existingGroup) {
          existingGroup.posts.push(post);
        } else {
          acc.push({ type: 'group', plannerId: post.plannerId, posts: [post] });
        }
      } else {
        acc.push({ type: 'post', data: post });
      }
      return acc;
    }, [] as Array<{ type: 'post', data: Post } | { type: 'group', plannerId: string, posts: Post[] }>);

    // Sort the overall list (groups and solo posts)
    grouped.sort((a, b) => {
      const isAsc = sortBy.endsWith('_asc');
      const isTitleSort = sortBy.startsWith('title');

      if (isTitleSort) {
        const getTitle = (item: typeof grouped[0]) => {
          if (item.type === 'post') return getPostContent(item.data)?.title || '';
          const planner = plannerItems.find(p => p.id === item.plannerId);
          return planner?.theme || '';
        };
        const titleA = getTitle(a);
        const titleB = getTitle(b);
        return isAsc ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA);
      } else {
        const getDate = (item: typeof grouped[0]) => {
          if (item.type === 'post') return item.data.timestamp;
          const planner = plannerItems.find(p => p.id === item.plannerId);
          if (planner) return new Date(planner.date).getTime();
          return Math.max(...item.posts.map(p => p.timestamp));
        };
        const dateA = getDate(a);
        const dateB = getDate(b);
        return isAsc ? dateA - dateB : dateB - dateA;
      }
    });

    return grouped;
  }, [filteredPosts, sortBy, plannerItems, historyItems]);

  const getStatusColor = (status: PostStatus) => {
    switch (status) {
      case 'Publicado': return 'bg-emerald-600 text-white border-emerald-700';
      case 'Aprovado': return 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100';
      case 'Agendado': return 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100';
      case 'Em Revisão': return 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100';
    }
  };

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
            placeholder="Pesquisar posts por título..."
            className={`${inputClasses} pl-12`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => { setEditingPost(null); setShowDrawer(true); }}
          className="bg-[#7ba1ee] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#00152b] transition-all shadow-lg w-full md:w-auto justify-center"
        >
          <Plus size={20} /> Criar Post Final
        </button>
      </div>

      {/* Filters and Sort Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
            <Filter size={16} className="text-slate-600" />
            <span className="text-xs font-bold text-slate-900 uppercase">Status:</span>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-transparent text-sm font-semibold text-slate-900 outline-none cursor-pointer"
            >
              <option value="all">Todos</option>
              <option value="Rascunho">Rascunhos</option>
              <option value="Em Revisão">Em Revisão</option>
              <option value="Aprovado">Aprovados</option>
              <option value="Agendado">Agendados</option>
              <option value="Publicado">Publicados</option>
            </select>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
            <Filter size={16} className="text-slate-600" />
            <span className="text-xs font-bold text-slate-900 uppercase">Canal:</span>
            <select 
              value={filterChannel} 
              onChange={(e) => setFilterChannel(e.target.value as any)}
              className="bg-transparent text-sm font-semibold text-slate-900 outline-none cursor-pointer"
            >
              <option value="all">Todos</option>
              {CHANNELS.map(ch => (
                <option key={ch} value={ch}>{ch}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 w-full lg:w-auto">
            <ArrowUpDown size={16} className="text-slate-600" />
            <span className="text-xs font-bold text-slate-900 uppercase whitespace-nowrap">Ordenar por:</span>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-sm font-semibold text-slate-900 outline-none cursor-pointer w-full"
            >
              <option value="date_desc">Data (Mais Recentes)</option>
              <option value="date_asc">Data (Mais Antigos)</option>
              <option value="title_asc">Título (A-Z)</option>
              <option value="title_desc">Título (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {(() => {
          if (groupedDisplayItems.length === 0) {
            return (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
                <Clock size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-600 font-medium">Nenhum post finalizado ainda.</p>
              </div>
            );
          }

          const renderPostCard = (post: Post, index?: number, total?: number, isListMode: boolean = false) => {
            const content = getPostContent(post);
            const author = teamMembers.find(m => m.id === post.authorId);
            const isUpdating = updatingStatusId === post.id;
            const statusClasses = getStatusColor(post.status);
            // Extrai apenas a classe de texto para o ícone
            const textColorClass = statusClasses.split(' ').find(c => c.startsWith('text-')) || 'text-slate-600';
            
            const wrapperClass = isListMode 
              ? `p-6 flex flex-col md:flex-row items-start md:items-center gap-6 group relative transition-colors hover:bg-blue-50/30 ${index! % 2 !== 0 ? 'bg-slate-50/50' : 'bg-white'} ${index !== total! - 1 ? 'border-b border-slate-100' : ''}`
              : "bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center gap-6 group relative";

            return (
              <div key={post.id} className={wrapperClass}>
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 font-bold text-xl border border-slate-100">
                  <Send size={24} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    {/* DROPDOWN DE STATUS RÁPIDO COM ÍCONE AJUSTADO */}
                    <div className="relative inline-flex items-center group/status">
                      <select
                        disabled={isUpdating}
                        value={post.status}
                        onChange={(e) => handleStatusChange(post, e.target.value as PostStatus)}
                        className={`appearance-none text-[10px] font-black px-4 py-1.5 pr-9 rounded-full border uppercase tracking-widest cursor-pointer transition-all focus:ring-2 focus:ring-[#7ba1ee]/10 outline-none shadow-sm ${statusClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <option value="Rascunho">Rascunho</option>
                        <option value="Em Revisão">Em Revisão</option>
                        <option value="Aprovado">Aprovado</option>
                        <option value="Agendado">Agendado</option>
                        <option value="Publicado">Publicado</option>
                      </select>
                      <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center ${textColorClass}`}>
                        {isUpdating ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <ChevronDown size={14} strokeWidth={4} />
                        )}
                      </div>
                    </div>

                    <span className="text-slate-600 text-[10px] font-bold flex items-center gap-1 uppercase tracking-tighter">
                      <Clock size={10} /> {new Date(post.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h4 className="font-bold text-slate-900 text-lg truncate">{content?.title || 'Conteúdo Removido'}</h4>
                  
                  <div className="flex flex-wrap items-center gap-4 mt-2">
                     <div className="flex items-center gap-1 text-xs text-slate-700">
                        <User size={12} /> <span className="font-medium">{author?.name || 'Sistema'}</span>
                     </div>
                     {post.channels && post.channels.length > 0 && (
                       <div className="flex flex-wrap gap-1">
                          {post.channels.map(ch => (
                            <span key={ch} className="text-[10px] text-blue-500 font-bold uppercase tracking-tight bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
                              <Share2 size={10} /> {ch}
                            </span>
                          ))}
                       </div>
                     )}
                     {post.plannerId && (
                       <div className="flex items-center gap-1 text-xs text-slate-600 font-bold uppercase tracking-tight">
                          <Layers size={12} /> PLANEJADO
                       </div>
                     )}
                     {post.creativeIds.length > 0 && (
                       <div className="flex items-center gap-1 text-xs text-emerald-500 font-bold uppercase tracking-tight">
                          <Palette size={12} /> {post.creativeIds.length} Visual{post.creativeIds.length > 1 ? 's' : ''}
                       </div>
                     )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button 
                      onClick={(e) => handleOpenMenu(e, post.id)}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                    >
                      <MoreVertical size={20} />
                    </button>
                  </div>
                </div>
              </div>
            );
          };

          return groupedDisplayItems.map((item, index) => {
            if (item.type === 'post') {
              return renderPostCard(item.data);
            } else {
              const planner = plannerItems.find(p => p.id === item.plannerId);
              return (
                <div key={item.plannerId} className="bg-white border border-slate-200 rounded-3xl overflow-hidden relative shadow-sm">
                   <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <Layers size={18} />
                      </div>
                      <div>
                         <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500 block mb-0.5">Campanha Planejada</span>
                         <h3 className="font-bold text-slate-900 text-base">{planner?.theme || 'Planejamento sem título'}</h3>
                      </div>
                      <div className="ml-auto text-right">
                         <div className="flex items-center gap-2 text-slate-600 text-xs font-bold bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                            <Calendar size={14} /> {planner ? new Date(planner.date).toLocaleDateString() : 'Data desconhecida'}
                         </div>
                      </div>
                   </div>
                   
                   <div className="flex flex-col">
                     {item.posts.map((post, idx) => renderPostCard(post, idx, item.posts.length, true))}
                   </div>
                </div>
              );
            }
          });
        })()}
      </div>

      {menuOpenId && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setMenuOpenId(null)} />
          <div style={{ position: 'fixed', top: `${menuPosition.top}px`, left: `${menuPosition.left}px`, zIndex: 110 }} className="w-40 bg-white rounded-xl shadow-xl border border-slate-100 py-2 animate-in fade-in zoom-in-95 duration-100 text-left">
             <button 
               onClick={() => { 
                 const post = posts.find(p => p.id === menuOpenId);
                 if(post) setViewingPost(post); 
                 setMenuOpenId(null); 
               }}
               className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 font-bold"
             >
               <Eye size={16} className="text-blue-500" /> Visualizar
             </button>
             <button 
               onClick={() => { 
                 const post = posts.find(p => p.id === menuOpenId);
                 if(post) { setEditingPost(post); setShowDrawer(true); }
                 setMenuOpenId(null); 
               }}
               className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 font-bold"
             >
               <Edit2 size={16} className="text-[#4c6eb3]" /> Editar
             </button>
             <div className="h-px bg-slate-100 my-1" />
             <button 
               onClick={() => { setDeletingId(menuOpenId); setMenuOpenId(null); }}
               className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-3 font-bold"
             >
               <Trash2 size={16} /> Excluir
             </button>
          </div>
        </>
      )}

      <PostFormDrawer 
        isOpen={showDrawer}
        onClose={() => { setShowDrawer(false); setEditingPost(null); }}
        onSave={onSave}
        historyItems={historyItems}
        plannerItems={plannerItems}
        creativeItems={creativeItems}
        teamMembers={teamMembers}
        blogCategories={blogCategories}
        editingPost={editingPost}
      />

      {/* Visualizar Side Drawer */}
      {viewingPost && (
        <div className="fixed inset-0 z-[2000]">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setViewingPost(null)} />
          <div className="fixed top-0 right-0 h-full w-full md:w-[600px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#7ba1ee] text-white">
              <h3 className="font-bold text-xl">Visualização do Post</h3>
              <button onClick={() => setViewingPost(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 h-full bg-slate-50/20">
               {(() => {
                 const content = getPostContent(viewingPost);
                 const planner = plannerItems.find(p => p.id === viewingPost.plannerId);
                 const author = teamMembers.find(m => m.id === viewingPost.authorId);
                 
                 return (
                   <div className="space-y-8">
                      {viewingPost.creativeIds.length > 0 && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-widest block mb-4">Mídia Selecionada</span>
                          <div className="grid grid-cols-1 gap-4">
                            {viewingPost.creativeIds.map(id => {
                              const creative = creativeItems.find(c => c.id === id);
                              if (!creative) return null;
                              return (
                                <div key={id} className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-md group relative">
                                   <div className="aspect-[4/5] bg-slate-100">
                                      {creative.source === 'Canva' ? (
                                        <div className="w-full h-full relative group">
                                            <iframe src={creative.url} className="w-full h-full border-none pointer-events-none" allowFullScreen />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="px-4 py-2 bg-white rounded-lg shadow-lg font-bold text-slate-900 text-xs flex items-center gap-2">
                                                    <ExternalLink size={14} /> VIEW ON CANVA
                                                </div>
                                            </div>
                                        </div>
                                      ) : (
                                        <img src={creative.url} className="w-full h-full object-cover" alt="" />
                                      )}
                                   </div>
                                   <div className="p-4 flex items-center justify-between bg-white">
                                      <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-900 truncate">{creative.title}</p>
                                        <p className="text-[9px] text-slate-600 uppercase font-black tracking-tight">{creative.source}</p>
                                      </div>
                                      <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg">
                                        <CheckCircle2 size={16} />
                                      </div>
                                   </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {content?.imageSuggestion && (
                        <div className="space-y-3">
                          <span className="text-[10px] uppercase font-bold text-[#4c6eb3] tracking-widest block">Sugestão Visual da IA</span>
                          <div className="p-6 bg-[#7ba1ee]/5 border border-[#7ba1ee]/10 rounded-2xl italic text-slate-900 font-medium leading-relaxed">
                            {content.imageSuggestion}
                          </div>
                        </div>
                      )}

                      <div className="pt-2">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-widest ${getStatusColor(viewingPost.status)}`}>
                            {viewingPost.status}
                          </span>
                          {viewingPost.channels && viewingPost.channels.map(ch => (
                            <span key={ch} className="text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100 bg-blue-50 text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                              <Share2 size={10} /> {ch}
                            </span>
                          ))}
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 leading-tight">{content?.title || 'Título não disponível'}</h2>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                            <span className="text-[10px] text-slate-600 uppercase font-bold block mb-1">Responsável</span>
                            <div className="font-bold text-slate-900 flex items-center gap-2"><User size={14}/> {author?.name || 'Sistema'}</div>
                         </div>
                         <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                            <span className="text-[10px] text-slate-600 uppercase font-bold block mb-1">Data Criada</span>
                            <div className="font-bold text-slate-900 flex items-center gap-2"><Calendar size={14}/> {new Date(viewingPost.timestamp).toLocaleDateString()}</div>
                         </div>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-blue-500 tracking-widest block mb-3">Legenda Final</span>
                        <div className="bg-white border border-slate-200 rounded-[1.5rem] p-8 shadow-inner whitespace-pre-wrap text-slate-700 leading-relaxed italic text-lg">
                           {content?.body}
                           {"\n\n"}
                           <div className="mt-6 flex flex-wrap gap-2">
                            {content?.hashtags.map(tag => (
                              <span key={tag} className="text-blue-500 font-bold text-sm">{tag.startsWith('#') ? tag : `#${tag}`}</span>
                            ))}
                           </div>
                        </div>
                      </div>

                      {planner && (
                        <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl">
                           <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-white rounded-xl text-blue-500 shadow-sm">
                                <FileText size={20} />
                              </div>
                              <div>
                                <h4 className="font-bold text-blue-900 text-sm">Tema do Planner</h4>
                                <p className="text-sm text-blue-700 line-clamp-2">{planner.theme}</p>
                              </div>
                           </div>
                           <div className="mt-4 pt-4 border-t border-blue-100/50 flex items-center justify-between">
                              <p className="text-[10px] text-blue-400 uppercase font-bold">Agendado para: {new Date(planner.date).toLocaleDateString()}</p>
                              <div className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-[9px] font-black uppercase">VINCULADO</div>
                           </div>
                        </div>
                      )}
                      
                      <div className="h-8" />
                   </div>
                 );
               })()}
            </div>

            <div className="p-6 border-t border-slate-100 bg-white flex-shrink-0">
               <button 
                 onClick={() => setViewingPost(null)} 
                 className="w-full py-4 rounded-xl font-bold bg-[#7ba1ee] text-white hover:bg-[#00152b] transition-all shadow-lg"
               >
                 Fechar Visualização
               </button>
            </div>
          </div>
        </div>
      )}

      {deletingId && (
        <div className="fixed inset-0 z-[3000]">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setDeletingId(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Excluir post final?</h3>
            <p className="text-slate-700 text-center mb-8 italic text-sm">Esta ação removerá o registro do post final. O histórico gerado e os criativos permanecerão intactos na sua biblioteca.</p>
            <div className="flex gap-4">
              <button onClick={() => setDeletingId(null)} className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors text-sm">Manter Post</button>
              <button onClick={confirmDelete} className="flex-1 py-3 px-4 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors text-sm">Excluir Registro</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Posts;