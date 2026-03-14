import React, { useState, useEffect } from 'react';
import { X, Save, FileText, Layers, User, Calendar, CheckCircle2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { BlogPost, BlogPostStatus, CreativeItem, TeamMember, BlogCategory, GeneratedContent } from '../types';
import { blogPostService } from '../services/blogPostService';
import { generateUUID } from '../services/supabaseClient';

interface BlogFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (post: BlogPost) => void;
  generatedContent?: GeneratedContent | null;
  creativeItems: CreativeItem[];
  teamMembers: TeamMember[];
  blogCategories: BlogCategory[];
}

const BlogFormDrawer: React.FC<BlogFormDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  generatedContent,
  creativeItems,
  teamMembers,
  blogCategories
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    titulo: '',
    resumo: '',
    conteudo: '',
    autor: '',
    categoria_id: '',
    imagem_url: '',
    tags: [] as string[],
    slug: '',
    status: 'Rascunho' as BlogPostStatus,
    selectedCreativeId: ''
  });

  useEffect(() => {
    if (isOpen && generatedContent) {
      setForm(prev => ({
        ...prev,
        titulo: generatedContent.title || '',
        resumo: generatedContent.summary || '',
        conteudo: generatedContent.body || '',
        tags: (generatedContent.hashtags || [])
          .flatMap(t => t.split(/[\s,;#]+/).map(tag => tag.trim()))
          .map(tag => tag.replace(/[^\w\u00C0-\u00FF-]/g, '')) // Keep alphanumeric, Portuguese accents, and hyphens
          .filter(tag => tag.length > 1), // Filter out empty or single-char tags (like weird symbols)
        categoria_id: '',
        autor: teamMembers.length > 0 ? teamMembers[0].id : '', // Default to first member
        slug: generatedContent.title ? generatedContent.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') : ''
      }));
    }
  }, [isOpen, generatedContent, teamMembers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo || !form.conteudo || isSaving) return;

    setIsSaving(true);
    try {
      const postData: Partial<BlogPost> = {
        id: generateUUID(),
        titulo: form.titulo,
        resumo: form.resumo,
        conteudo: form.conteudo,
        autor: form.autor,
        categoria_id: form.categoria_id || undefined,
        imagem_url: form.imagem_url,
        tags: form.tags,
        slug: form.slug,
        status: form.status
      };

      const savedPost = await blogPostService.save(postData);
      onSave(savedPost);
      onClose();
    } catch (error) {
      console.error("Erro ao salvar blog post:", error);
      alert("Falha ao salvar post do blog.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreativeSelect = (creative: CreativeItem) => {
    if (form.selectedCreativeId === creative.id) {
      setForm({ ...form, selectedCreativeId: '', imagem_url: '' });
    } else {
      setForm({ ...form, selectedCreativeId: creative.id, imagem_url: creative.url });
    }
  };

  if (!isOpen) return null;

  const inputClasses = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-[#fafafa] focus:ring-2 focus:ring-[#7ba1ee] focus:bg-white outline-none text-slate-900 font-medium transition-all placeholder:text-slate-600";

  return (
    <div className="fixed inset-0 z-[2000]">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full md:w-[600px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#7ba1ee] text-white">
          <h3 className="font-bold text-xl">Finalizar Blog Post</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 h-full bg-slate-50/20">
          <div className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900">Título</label>
              <input required className={inputClasses} value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900">Slug (URL Amigável)</label>
              <input className={inputClasses} value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900">Resumo</label>
              <textarea rows={3} className={`${inputClasses} resize-none`} value={form.resumo} onChange={e => setForm({...form, resumo: e.target.value})} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900">Conteúdo Completo</label>
              <textarea required rows={10} className={`${inputClasses} resize-none font-mono text-sm`} value={form.conteudo} onChange={e => setForm({...form, conteudo: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers size={16} className="text-orange-500" /> Categoria
                </label>
                <select className={inputClasses} value={form.categoria_id} onChange={e => setForm({...form, categoria_id: e.target.value})}>
                  <option value="">Selecione...</option>
                  {blogCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <User size={16} className="text-blue-500" /> Autor
                </label>
                <select className={inputClasses} value={form.autor} onChange={e => setForm({...form, autor: e.target.value})}>
                  <option value="">Selecione...</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.name}>{m.name}</option> // Saving name as autor is text in DB
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900">Status da Publicação</label>
              <select className={inputClasses} value={form.status} onChange={e => setForm({...form, status: e.target.value as BlogPostStatus})}>
                <option value="Rascunho">Rascunho</option>
                <option value="Publicado">Publicar Agora</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900">Tags (Separadas por vírgula)</label>
              <input 
                className={inputClasses} 
                value={form.tags.join(', ')} 
                onChange={e => setForm({...form, tags: e.target.value.split(',').map(t => t.trim().replace(/[^\w\u00C0-\u00FF-]/g, '')).filter(tag => tag.length > 1)})} 
                placeholder="marketing, vendas, estratégia"
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <label className="text-sm font-bold text-slate-900 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2"><ImageIcon size={16} className="text-emerald-500" /> Imagem de Capa (Selecione um Criativo)</span>
              </label>
              
              {form.imagem_url && (
                <div className="mb-4 p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-700 mb-1 font-bold uppercase">URL Selecionada:</p>
                    <p className="text-xs text-blue-600 truncate">{form.imagem_url}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto p-4 bg-white rounded-2xl border border-slate-100 shadow-inner">
                {creativeItems.length > 0 ? creativeItems.map(creative => (
                  <button 
                    key={creative.id} type="button" disabled={isSaving} onClick={() => handleCreativeSelect(creative)}
                    className={`group relative flex flex-col rounded-2xl overflow-hidden border-2 transition-all text-left ${form.selectedCreativeId === creative.id ? 'border-[#4c6eb3] ring-4 ring-[#4c6eb3]/10 shadow-lg' : 'border-slate-100 hover:border-slate-300'} disabled:opacity-50`}
                  >
                    <div className="aspect-video w-full bg-slate-100 relative overflow-hidden">
                      {creative.source === 'Canva' ? (
                          <div className="w-full h-full relative">
                            <iframe src={creative.url} className="w-full h-full border-none pointer-events-none" allowFullScreen />
                            <div className="absolute inset-0 bg-black/5" />
                          </div>
                      ) : (
                          <img src={creative.url} className="w-full h-full object-cover" alt="" />
                      )}
                      {form.selectedCreativeId === creative.id && (
                        <div className="absolute inset-0 bg-[#4c6eb3]/20 backdrop-blur-[1px] flex items-center justify-center animate-in fade-in zoom-in duration-200">
                          <div className="bg-white rounded-full p-2 shadow-xl border-2 border-[#4c6eb3]">
                            <CheckCircle2 size={24} className="text-[#4c6eb3]" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className={`p-2 border-t transition-colors ${form.selectedCreativeId === creative.id ? 'bg-[#4c6eb3]/5 border-[#4c6eb3]/20' : 'bg-white border-slate-50'}`}>
                       <p className="text-[10px] font-bold text-slate-900 truncate">{creative.title}</p>
                    </div>
                  </button>
                )) : (
                  <div className="col-span-2 py-10 text-center">
                    <p className="text-xs text-slate-600 italic">Nenhum criativo disponível.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </form>

        <div className="p-6 border-t border-slate-100 bg-white flex-shrink-0 flex gap-4 shadow-lg">
          <button type="button" disabled={isSaving} onClick={onClose} className="flex-1 py-4 rounded-xl font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all">Cancelar</button>
          <button onClick={handleSubmit} disabled={!form.titulo || !form.conteudo || isSaving} className="flex-[2] bg-[#7ba1ee] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#00152b] transition-all shadow-lg disabled:opacity-50">
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {isSaving ? 'Salvando Blog...' : 'Salvar Blog Post'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlogFormDrawer;
