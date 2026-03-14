
import React, { useState, useMemo, useEffect } from 'react';
import { PlannerItem, ContentFormat, DistributionChannel, Post } from '../types';
import { generateUUID } from '../services/supabaseClient';
import { CalendarDays, Plus, Trash2, CheckCircle, Circle, Save, MoreVertical, Eye, X, Info, Layout, Check, Edit2, ArrowLeft, AlertTriangle, Calendar as CalendarIcon, Loader2, Filter, ArrowUpDown, ChevronDown, LayoutList, ChevronLeft, ChevronRight } from 'lucide-react';

interface PlannerProps {
  items: PlannerItem[];
  posts: Post[];
  onSave: (item: PlannerItem) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

const CHANNELS: DistributionChannel[] = ['Instagram', 'Facebook', 'LinkedIn', 'YouTube', 'TikTok', 'Blog', 'Google Business'];

const CHANNEL_FORMATS: Record<DistributionChannel, ContentFormat[]> = {
  'Instagram': ['Post', 'Stories', 'Reels', 'Carrossel'],
  'Facebook': ['Post', 'Stories', 'Reels'],
  'LinkedIn': ['Post', 'Blog'],
  'YouTube': ['Vídeo', 'Shorts'],
  'TikTok': ['Vídeo'],
  'Blog': ['Blog'],
  'Google Business': ['Post']
};

const Planner: React.FC<PlannerProps> = ({ items, posts, onSave, onDelete, onToggle }) => {
  const [showDrawer, setShowDrawer] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [viewingItem, setViewingItem] = useState<PlannerItem | null>(null);
  const [editingItem, setEditingItem] = useState<PlannerItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // View Mode State
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Filters and Sort State
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending'>('pending');
  const [filterChannel, setFilterChannel] = useState<DistributionChannel | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date_asc' | 'date_desc' | 'theme_asc' | 'theme_desc'>('date_desc');

  const [form, setForm] = useState({
    theme: '',
    date: '',
    channels: [] as DistributionChannel[],
    format: 'Post' as ContentFormat,
    notes: ''
  });

  useEffect(() => {
    if (editingItem) {
      setForm({
        theme: editingItem.theme,
        date: editingItem.date,
        channels: editingItem.channels,
        format: editingItem.format,
        notes: editingItem.notes
      });
      setShowDrawer(true);
    }
  }, [editingItem]);

  const availableFormats = useMemo(() => {
    if (form.channels.length === 0) return ['Post', 'Stories', 'Reels', 'Carrossel', 'Blog', 'Vídeo', 'Shorts', 'Mult Canais'] as ContentFormat[];
    if (form.channels.length > 1) return ['Mult Canais'] as ContentFormat[];
    
    const formats = new Set<ContentFormat>();
    form.channels.forEach(ch => {
      CHANNEL_FORMATS[ch]?.forEach(f => formats.add(f));
    });
    return Array.from(formats);
  }, [form.channels]);

  useEffect(() => {
    if (form.channels.length > 1) {
      setForm(prev => ({ ...prev, format: 'Mult Canais' }));
    } else if (form.channels.length === 1 && form.format === 'Mult Canais') {
      setForm(prev => ({ ...prev, format: 'Post' }));
    }
  }, [form.channels.length]);

  const filteredItems = useMemo(() => {
    let result = [...items];

    // Filter by status
    if (filterStatus !== 'all') {
      result = result.filter(item => filterStatus === 'completed' ? item.completed : !item.completed);
    }

    // Filter by channel
    if (filterChannel !== 'all') {
      result = result.filter(item => item.channels.includes(filterChannel));
    }

    // Sort (Only relevant for List View, but applied anyway)
    result.sort((a, b) => {
      if (sortBy === 'date_asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'date_desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'theme_asc') return a.theme.localeCompare(b.theme);
      if (sortBy === 'theme_desc') return b.theme.localeCompare(a.theme);
      return 0;
    });

    return result;
  }, [items, filterStatus, filterChannel, sortBy]);

  const handleOpenMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 160; // Altura aproximada do menu
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    
    // Se não houver espaço abaixo, abre para cima
    let top = rect.bottom;
    if (rect.bottom + menuHeight > windowHeight) {
      top = rect.top - menuHeight;
    }

    // Garante que o menu não saia pelas laterais
    let left = rect.right - 192;
    if (left < 10) left = 10;
    if (left + 192 > windowWidth) left = windowWidth - 202;

    setMenuPosition({ top, left });
    setMenuOpenId(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.theme || !form.date || form.channels.length === 0 || isSaving) return;
    
    setIsSaving(true);
    try {
      await onSave({
        id: editingItem ? editingItem.id : generateUUID(),
        ...form,
        completed: editingItem ? editingItem.completed : false
      });
      closeDrawer();
    } catch (error) {
      console.error("Erro ao salvar plano:", error);
      alert("Erro ao sincronizar com o servidor.");
    } finally {
      setIsSaving(false);
    }
  };

  const closeDrawer = () => {
    setShowDrawer(false);
    setEditingItem(null);
    setForm({ theme: '', date: '', channels: [], format: 'Post', notes: '' });
  };

  const toggleChannel = (ch: DistributionChannel) => {
    if (isSaving) return;
    const nextChannels = form.channels.includes(ch)
      ? form.channels.filter(c => c !== ch)
      : [...form.channels, ch];
    setForm({ ...form, channels: nextChannels });
  };

  const confirmDelete = () => {
    if (deletingId) {
      onDelete(deletingId);
      setDeletingId(null);
    }
  };

  const isFulfilled = (item: PlannerItem) => {
    if (item.completed) return true;
    const relevantPosts = posts.filter(p => p.plannerId === item.id);
    return item.channels.every(channel => 
      relevantPosts.some(post => post.channels.includes(channel))
    );
  };

  // Calendar Helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay, year, month };
  };

  const { days, firstDay, year, month } = getDaysInMonth(currentMonth);
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const inputClasses = "w-full px-4 py-4 rounded-xl border border-slate-200 bg-[#fafafa] focus:ring-2 focus:ring-[#7ba1ee] focus:bg-white outline-none text-slate-900 font-medium transition-all placeholder:text-slate-600";

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-12 w-full px-4 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Calendário Editorial</h2>
          <p className="text-slate-700 text-sm">Agende temas e defina canais de distribuição.</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-xl border border-slate-200 flex items-center shadow-sm">
                <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#7ba1ee] text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                    title="Visualização em Lista"
                >
                    <LayoutList size={20} />
                </button>
                <button 
                    onClick={() => setViewMode('calendar')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-[#7ba1ee] text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                    title="Visualização em Calendário"
                >
                    <CalendarIcon size={20} />
                </button>
            </div>
            <button 
            onClick={() => setShowDrawer(true)}
            className="bg-[#7ba1ee] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#00152b] transition-all shadow-lg"
            >
            <Plus size={20} /> Novo Plano
            </button>
        </div>
      </div>

      {/* Filters and Sort Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
            <Filter size={16} className="text-slate-600" />
            <span className="text-xs font-bold text-slate-900 uppercase">Status:</span>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-transparent text-sm font-semibold text-slate-900 outline-none cursor-pointer"
            >
              <option value="all">Todos</option>
              <option value="completed">Concluídos</option>
              <option value="pending">Pendentes</option>
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

        {viewMode === 'list' && (
            <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 w-full md:w-auto">
                <ArrowUpDown size={16} className="text-slate-600" />
                <span className="text-xs font-bold text-slate-900 uppercase whitespace-nowrap">Ordenar por:</span>
                <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-sm font-semibold text-slate-900 outline-none cursor-pointer w-full"
                >
                <option value="date_asc">Publicação (Crescente)</option>
                <option value="date_desc">Publicação (Decrescente)</option>
                <option value="theme_asc">Tema (A-Z)</option>
                <option value="theme_desc">Tema (Z-A)</option>
                </select>
            </div>
            </div>
        )}
        
        {viewMode === 'calendar' && (
            <div className="flex items-center gap-4">
                <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ChevronLeft size={20} className="text-slate-900" /></button>
                <div className="flex flex-col items-center">
                    <span className="text-lg font-bold text-slate-900">{monthNames[month]} {year}</span>
                    <button onClick={goToToday} className="text-[10px] uppercase font-bold text-blue-500 hover:underline">Hoje</button>
                </div>
                <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ChevronRight size={20} className="text-slate-900" /></button>
            </div>
        )}
      </div>

      {viewMode === 'list' ? (
        <div className="grid grid-cols-1 gap-4 animate-in fade-in duration-500">
            {filteredItems.length > 0 ? filteredItems.map(item => {
            const finished = isFulfilled(item);
            return (
                <div key={item.id} className={`flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-white rounded-2xl border border-slate-200 shadow-sm transition-all group relative ${finished ? 'opacity-70 bg-slate-50' : 'hover:shadow-md'}`}>
                <div className="flex items-center gap-4 flex-1">
                    <button onClick={() => onToggle(item.id)} className={`${finished ? 'text-emerald-500' : 'text-slate-300'} hover:scale-110 transition-transform flex-shrink-0`}>
                    {finished ? <CheckCircle size={28} /> : <Circle size={28} />}
                    </button>
                    <div className="flex-1 min-w-0">
                    <h4 className={`font-bold text-lg truncate ${finished ? 'line-through text-slate-600' : 'text-slate-900'}`}>{item.theme}</h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                        {item.channels.map(ch => (
                        <span key={ch} className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600 uppercase">{ch === 'Google Business' ? 'GMB' : ch}</span>
                        ))}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${item.format === 'Mult Canais' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'}`}>{item.format}</span>
                        <span className="text-xs text-slate-600 flex items-center gap-1 ml-2">
                        <CalendarDays size={12} />
                        {new Date(item.date).toLocaleDateString('pt-BR')}
                        </span>
                    </div>
                    </div>
                </div>
                <div className="mt-4 md:mt-0 ml-12 md:ml-0">
                    <button onClick={(e) => handleOpenMenu(e, item.id)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"><MoreVertical size={24} /></button>
                </div>
                </div>
            );
            }) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
                <CalendarDays size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-600 font-medium">Nenhum planejamento encontrado com os filtros atuais.</p>
            </div>
            )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                    <div key={day} className="py-3 text-center text-xs font-bold text-slate-900 uppercase tracking-wider">{day}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 auto-rows-fr">
                {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="min-h-[120px] bg-slate-50/50 border-b border-r border-slate-100 last:border-r-0" />
                ))}
                {Array.from({ length: days }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const dayItems = filteredItems.filter(item => item.date === dateStr);
                    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

                    return (
                        <div key={day} className={`min-h-[120px] p-2 border-b border-r border-slate-100 last:border-r-0 relative group hover:bg-slate-50 transition-colors ${isToday ? 'bg-blue-50/30' : ''}`}>
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-[#7ba1ee] text-white' : 'text-slate-700'}`}>{day}</span>
                                <button 
                                    onClick={() => {
                                        setForm(prev => ({ ...prev, date: dateStr }));
                                        setShowDrawer(true);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded text-slate-700 transition-opacity"
                                    title="Adicionar neste dia"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                            <div className="space-y-1">
                                {dayItems.map(item => {
                                    const finished = isFulfilled(item);
                                    return (
                                        <div key={item.id} className={`p-1.5 rounded-lg border text-[10px] font-medium flex items-center justify-between gap-1 group/item transition-all ${finished ? 'bg-slate-100 border-slate-200 text-slate-600 line-through' : 'bg-white border-blue-100 text-slate-900 shadow-sm hover:border-blue-300'}`}>
                                            <span className="truncate flex-1">{item.theme}</span>
                                            <button onClick={(e) => handleOpenMenu(e, item.id)} className="opacity-0 group-hover/item:opacity-100 p-0.5 hover:bg-slate-100 rounded text-slate-600">
                                                <MoreVertical size={12} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
                {/* Fill remaining cells to complete the grid if needed */}
                {Array.from({ length: (7 - ((days + firstDay) % 7)) % 7 }).map((_, i) => (
                    <div key={`empty-end-${i}`} className="min-h-[120px] bg-slate-50/50 border-b border-r border-slate-100 last:border-r-0" />
                ))}
            </div>
        </div>
      )}

      {menuOpenId && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setMenuOpenId(null)} />
          <div style={{ position: 'fixed', top: `${menuPosition.top}px`, left: `${menuPosition.left}px`, zIndex: 110 }} className="w-48 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 animate-in fade-in zoom-in-95 duration-100">
            <button onClick={() => { setViewingItem(items.find(i => i.id === menuOpenId)!); setMenuOpenId(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"><Eye size={16} className="text-blue-500" /> Visualizar</button>
            <button onClick={() => { setEditingItem(items.find(i => i.id === menuOpenId)!); setMenuOpenId(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"><Edit2 size={16} className="text-[#4c6eb3]" /> Editar</button>
            <div className="h-px bg-slate-100 my-1 mx-2" /><button onClick={() => { setDeletingId(menuOpenId); setMenuOpenId(null); }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors"><Trash2 size={16} /> Excluir</button>
          </div>
        </>
      )}

      {showDrawer && (
        <div className="fixed inset-0 z-[2000]">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity" onClick={closeDrawer} />
          <div className="fixed top-0 right-0 h-full w-full md:w-[600px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#7ba1ee] text-white flex-shrink-0">
              <h3 className="font-bold text-xl">{editingItem ? 'Editar Planejamento' : 'Novo Planejamento'}</h3>
              <button onClick={closeDrawer} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 h-full bg-slate-50/20">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900 flex items-center gap-2"><Info size={16} className="text-blue-500" /> Tema do Conteúdo</label>
                  <input required disabled={isSaving} className={inputClasses} placeholder="Ex: O impacto do planejamento tributário..." value={form.theme} onChange={e => setForm({...form, theme: e.target.value})} />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-900 block">Canal (Selecione um ou mais)</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {CHANNELS.map(ch => (
                      <button key={ch} type="button" disabled={isSaving} onClick={() => toggleChannel(ch)} className={`px-3 py-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${form.channels.includes(ch) ? 'bg-[#7ba1ee] text-white border-[#7ba1ee] shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'} disabled:opacity-50`}>{form.channels.includes(ch) && <Check size={14} />}{ch === 'Google Business' ? 'Google Negócio' : ch}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-900">Data Prevista</label>
                    <div className="relative">
                      <input required disabled={isSaving} type="date" className={inputClasses} value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                      <CalendarIcon size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-900">Formato</label>
                    <select disabled={isSaving} className={inputClasses} value={form.format} onChange={e => setForm({...form, format: e.target.value as ContentFormat})}>{availableFormats.map(f => (<option key={f} value={f}>{f}</option>))}</select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900">Notas Adicionais</label>
                  <textarea rows={5} disabled={isSaving} className={`${inputClasses} resize-none`} placeholder="Anote aqui referências, links ou ideias de abordagem..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
                </div>
              </div>
            </form>
            <div className="p-6 border-t border-slate-100 bg-white flex-shrink-0 flex gap-4">
              <button type="button" disabled={isSaving} onClick={closeDrawer} className="flex-1 py-4 rounded-xl font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all">Descartar</button>
              <button onClick={handleSubmit} disabled={isSaving || form.channels.length === 0 || !form.theme || !form.date} className="flex-[2] bg-[#4c6eb3] text-slate-900 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-40 shadow-lg">
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                {isSaving ? 'Salvando plano...' : (editingItem ? 'Atualizar Plano' : 'Criar Plano')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visualização de Detalhes */}
      {viewingItem && (
        <div className="fixed inset-0 z-[2000]">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setViewingItem(null)} />
          <div className="fixed top-0 right-0 h-full w-full md:w-[500px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#7ba1ee] text-white">
              <h3 className="font-bold text-xl">Detalhes do Planejamento</h3>
              <button onClick={() => setViewingItem(null)} className="p-2 hover:bg-white/10 rounded-full"><X size={24} /></button>
            </div>
            <div className="flex-1 p-8 space-y-8 overflow-y-auto bg-slate-50/20">
               <div>
                  <span className="text-[10px] text-slate-600 uppercase font-bold block mb-2">Tema Principal</span>
                  <h2 className="text-2xl font-bold text-slate-900 leading-tight">{viewingItem.theme}</h2>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <span className="text-[10px] text-slate-600 uppercase font-bold block mb-1">Data</span>
                    <p className="font-bold text-slate-900">{new Date(viewingItem.date).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <span className="text-[10px] text-slate-600 uppercase font-bold block mb-1">Formato</span>
                    <p className="font-bold text-slate-900">{viewingItem.format}</p>
                  </div>
               </div>
               <div>
                  <span className="text-[10px] text-slate-600 uppercase font-bold block mb-2">Canais de Distribuição</span>
                  <div className="flex flex-wrap gap-2">
                    {viewingItem.channels.map(ch => (
                      <span key={ch} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold border border-blue-100">{ch}</span>
                    ))}
                  </div>
               </div>
               <div>
                  <span className="text-[10px] text-slate-600 uppercase font-bold block mb-2">Anotações e Referências</span>
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-inner whitespace-pre-wrap text-sm text-slate-600 italic">
                    {viewingItem.notes || 'Nenhuma nota adicional registrada.'}
                  </div>
               </div>
            </div>
            <div className="p-6 border-t border-slate-100">
               <button onClick={() => setViewingItem(null)} className="w-full py-4 rounded-xl font-bold bg-[#7ba1ee] text-white">Fechar Detalhes</button>
            </div>
          </div>
        </div>
      )}

      {deletingId && (
        <div className="fixed inset-0 z-[3000]">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setDeletingId(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl z-[3060] shadow-2xl p-8 animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle size={32} /></div>
            <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Excluir este plano?</h3>
            <p className="text-slate-700 text-center mb-8 italic text-sm">Esta ação removerá o planejamento e o vínculo com posts gerados. Os conteúdos no histórico permanecerão intactos.</p>
            <div className="flex gap-4">
              <button onClick={() => setDeletingId(null)} className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 py-3 px-4 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg">Confirmar Exclusão</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Planner;
