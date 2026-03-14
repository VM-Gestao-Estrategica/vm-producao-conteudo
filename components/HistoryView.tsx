
import React, { useState } from 'react';
import { HistoryItem, HistoryVersion, GeneratedContent } from '../types';
import { Calendar, Trash2, ExternalLink, Copy, Check, MoreVertical, Eye, Edit2, X, AlertTriangle, ChevronLeft, ChevronRight, Share2, Layers, MessageCircle, Info, Image as ImageIcon } from 'lucide-react';

interface HistoryViewProps {
  items: HistoryItem[];
  onDelete: (id: string) => void;
  onClear: () => void;
  onEdit: (item: HistoryItem) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ items, onDelete, onClear, onEdit }) => {
  const [copied, setCopied] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<HistoryItem | null>(null);
  const [activeVersionIndex, setActiveVersionIndex] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

  // Helper to safely get the first content if it's an array
  const getSafeContent = (content: GeneratedContent | GeneratedContent[]): GeneratedContent => {
    return Array.isArray(content) ? content[0] : content;
  };

  const handleCopy = (version: HistoryVersion) => {
    if (!version) return;
    const content = getSafeContent(version.content);
    if (!content) return;

    const hashtagsFormatted = content.hashtags
      .map(tag => tag.startsWith('#') ? tag : `#${tag}`)
      .join(' ');
    const textToCopy = `${content.title}\n\n${content.body}\n\n${hashtagsFormatted}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confirmDelete = () => {
    if (deletingId) {
      onDelete(deletingId);
      setDeletingId(null);
    }
  };

  const confirmClearAll = () => {
    onClear();
    setShowClearAllConfirm(false);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-[1400px] mx-auto text-center py-20 px-4">
        <div className="bg-white rounded-3xl p-12 shadow-sm border border-slate-200">
          <Calendar size={48} className="mx-auto text-slate-200 mb-4" />
          <h3 className="text-xl font-bold text-slate-800">Seu histórico está vazio</h3>
          <p className="text-slate-700 mt-2">Gere seu primeiro conteúdo para vê-lo aqui.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-12 w-full relative">
      <div className="flex justify-between items-center px-2">
        <div className="flex items-center gap-3">
           <div className="p-2.5 bg-[#7ba1ee] text-white rounded-xl shadow-lg">
              <Share2 size={20} />
           </div>
           <div>
              <h2 className="text-2xl font-bold text-slate-900">Produções Estratégicas</h2>
              <p className="text-xs text-slate-700 font-bold uppercase tracking-widest mt-0.5">Total de {items.length} produções ativas</p>
           </div>
        </div>
        <button 
          onClick={() => setShowClearAllConfirm(true)} 
          className="text-red-500 text-sm font-bold hover:bg-red-50 px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2"
        >
          <Trash2 size={16} /> Limpar Tudo
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {items.sort((a, b) => b.lastUpdated - a.lastUpdated).map((production) => {
          const lastVersion = production.versions[production.versions.length - 1];
          if (!lastVersion) return null;
          const content = getSafeContent(lastVersion.content);
          const config = Array.isArray(production.config) ? production.config[0] : production.config;
          
          return (
            <div key={production.id} className={`bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col md:flex-row items-stretch relative ${menuOpenId === production.id ? 'z-30' : 'z-10'}`}>
              {/* Faixa lateral colorida com arredondamento manual para não usar overflow-hidden */}
              <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#7ba1ee] rounded-l-2xl" />
              
              <div className="p-6 md:p-8 flex-1 flex flex-col md:flex-row gap-6 ml-1.5">
                <div className="w-16 h-16 bg-[#7ba1ee] text-white rounded-[1.2rem] flex flex-col items-center justify-center flex-shrink-0 shadow-lg border border-white/10">
                   <span className="text-xl font-black">{production.versions.length}</span>
                   <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">VERSÕES</span>
                </div>

                <div className="flex-1 min-w-0 space-y-2 pr-8 md:pr-12">
                  <div className="flex items-center gap-3 text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                    <Calendar size={12} className="text-[#4c6eb3]" />
                    {new Date(production.lastUpdated).toLocaleString('pt-BR')}
                    <span className="text-slate-200">|</span>
                    <span className="text-blue-500 font-black">{config.format}</span>
                    <span className="text-slate-200">|</span>
                    <span className="text-purple-500 font-black">{config.tone}</span>
                  </div>
                  
                  <h3 className="text-lg md:text-xl font-bold text-slate-900 leading-tight truncate">
                    {production.title || content?.title || 'Sem título'}
                  </h3>
                  
                  <p className="text-slate-700 text-sm line-clamp-2 italic leading-relaxed">
                    {content?.body || 'Conteúdo não disponível'}
                  </p>

                  <div className="flex items-center gap-4 pt-2">
                     <a href={config.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-blue-500 hover:underline flex items-center gap-1.5 uppercase">
                       Acessar Fonte Original <ExternalLink size={10} />
                     </a>
                  </div>
                </div>
              </div>

              {/* Botão de Menu de Pontos (Padrão do App) */}
              <div className="absolute top-6 right-6 md:top-8 md:right-8 z-20">
                <button 
                  onClick={() => setMenuOpenId(menuOpenId === production.id ? null : production.id)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
                >
                  <MoreVertical size={24} />
                </button>

                {menuOpenId === production.id && (
                  <>
                    <div className="fixed inset-0 z-[100]" onClick={() => setMenuOpenId(null)} />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[110] py-3 animate-in fade-in zoom-in-95 duration-150">
                      <button 
                        onClick={() => { setViewingItem(production); setActiveVersionIndex(production.versions.length - 1); setMenuOpenId(null); }}
                        className="w-full text-left px-5 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 font-bold transition-colors"
                      >
                        <Eye size={18} className="text-blue-500" /> Visualizar Conteúdo
                      </button>
                      
                      {/* 
                          Continuar Geração oculto pois estamos usando o "topstacksquad" para gerenciar todo o crud da aplicação.
                          <button 
                            onClick={() => { onEdit(production); setMenuOpenId(null); }}
                            className="w-full text-left px-5 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 font-bold transition-colors"
                          >
                            <Edit2 size={18} className="text-[#4c6eb3]" /> Continuar Geração
                          </button>
                      */}
                      
                      <div className="h-px bg-slate-100 my-2 mx-2" />
                      <button 
                        onClick={() => { setDeletingId(production.id); setMenuOpenId(null); }}
                        className="w-full text-left px-5 py-3 text-sm text-red-500 hover:bg-red-50 flex items-center gap-3 font-bold transition-colors"
                      >
                        <Trash2 size={18} /> Excluir Produção
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* View Drawer */}
      {viewingItem && (
        <div className="fixed inset-0 z-[1000]">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md transition-opacity duration-300" onClick={() => setViewingItem(null)} />
          <div className="fixed top-0 right-0 h-full w-full md:w-[700px] bg-white z-[1010] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#7ba1ee] text-white flex-shrink-0">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-white/10 rounded-lg"><Share2 size={18} /></div>
                 <h3 className="font-bold text-lg">Histórico de Versões</h3>
              </div>
              <button onClick={() => setViewingItem(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 sm:p-12 space-y-10 custom-scrollbar">
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-[1.5rem] border border-slate-100">
                 <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                      Versão {activeVersionIndex + 1} de {viewingItem.versions.length}
                    </span>
                    <span className="text-[10px] text-slate-600 font-bold">
                      {viewingItem.versions[activeVersionIndex] && new Date(viewingItem.versions[activeVersionIndex].timestamp).toLocaleString()}
                    </span>
                 </div>
                 <div className="flex items-center gap-2">
                    <button disabled={activeVersionIndex === 0} onClick={() => setActiveVersionIndex(prev => prev - 1)} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-900 disabled:opacity-30 shadow-sm hover:bg-slate-50"><ChevronLeft size={18} /></button>
                    <button disabled={activeVersionIndex === viewingItem.versions.length - 1} onClick={() => setActiveVersionIndex(prev => prev + 1)} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-900 disabled:opacity-30 shadow-sm hover:bg-slate-50"><ChevronRight size={18} /></button>
                 </div>
              </div>

              {(() => {
                const currentVersion = viewingItem.versions[activeVersionIndex];
                if (!currentVersion) return null;
                const contents = Array.isArray(currentVersion.content) ? currentVersion.content : [currentVersion.content];
                const config = Array.isArray(viewingItem.config) ? viewingItem.config[0] : viewingItem.config;
                
                return contents.map((content, idx) => (
                  <div key={idx} className={`space-y-10 ${idx > 0 ? "pt-10 border-t border-slate-100 mt-10" : ""}`}>
                    <div>
                      {content.platform && <span className="text-[10px] uppercase tracking-widest text-[#4c6eb3] font-bold block mb-1">{content.platform}</span>}
                      <span className="text-[10px] uppercase tracking-widest text-[#4c6eb3] font-bold block mb-2">Título</span>
                      <h2 className="text-2xl font-bold text-slate-900 leading-tight">{content.title}</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm"><Layers size={16} className="text-blue-500" /></div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-600 block">Formato</span>
                          <span className="font-bold text-xs text-slate-900">{config.format}</span>
                        </div>
                      </div>
                      <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm"><MessageCircle size={16} className="text-purple-500" /></div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-600 block">Linguagem</span>
                          <span className="font-bold text-xs text-slate-900">{config.tone}</span>
                        </div>
                      </div>
                    </div>

                    {content.imageSuggestion && (
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-[#4c6eb3] font-bold block mb-3">Sugestão Visual da IA</span>
                        <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl italic text-slate-900 font-medium leading-relaxed">
                          {content.imageSuggestion}
                        </div>
                      </div>
                    )}

                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-[#4c6eb3] font-bold block mb-3">Copy Estratégica</span>
                      <div className="p-8 bg-white border border-slate-100 rounded-[2rem] whitespace-pre-wrap text-slate-900 text-lg leading-relaxed shadow-sm font-medium italic text-slate-700">
                        {content.body}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-[#4c6eb3] font-bold block mb-3">Hashtags Sugeridas</span>
                      <div className="flex flex-wrap gap-2">
                        {content.hashtags.map(tag => (
                          <span key={tag} className="px-4 py-2 bg-blue-50 text-slate-900 rounded-xl text-xs font-bold border border-blue-100 shadow-sm">
                            {tag.startsWith('#') ? tag : `#${tag}`}
                          </span>
                        ))}
                      </div>
                    </div>

                    {content.tips && content.tips.length > 0 && (
                      <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex gap-4">
                        <div className="p-3 bg-white rounded-2xl shadow-sm text-emerald-500 h-fit"><Info size={24} /></div>
                        <div className="space-y-3">
                          <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-widest">Diretrizes de Produção</span>
                          <ul className="space-y-2">
                            {content.tips.map((tip, i) => (
                              <li key={i} className="text-sm text-emerald-800 font-medium italic">• {tip}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>

            <div className="p-6 border-t border-slate-100 bg-white flex gap-4 flex-shrink-0">
              <button 
                onClick={() => handleCopy(viewingItem.versions[activeVersionIndex])}
                className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${copied ? 'bg-emerald-500 text-white' : 'bg-[#7ba1ee] text-white hover:bg-[#00152b]'}`}
              >
                {copied ? <Check size={20} /> : <Copy size={20} />}
                {copied ? 'Conteúdo Copiado!' : 'Copiar esta Versão'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal (Individual) */}
      {deletingId && (
        <div className="fixed inset-0 z-[3000]">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setDeletingId(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl z-[3060] shadow-2xl p-8 animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle size={32} /></div>
            <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Excluir Produção Completa?</h3>
            <p className="text-slate-700 text-center mb-8 italic">Todas as versões e iterações desta produção serão apagadas permanentemente do sistema.</p>
            <div className="flex gap-4">
              <button onClick={() => setDeletingId(null)} className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 py-3 px-4 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg">Confirmar Exclusão</button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Modal (Global) */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 z-[3000]">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowClearAllConfirm(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl z-[3060] shadow-2xl p-8 animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><Trash2 size={32} /></div>
            <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Limpar Todo o Histórico?</h3>
            <p className="text-slate-700 text-center mb-8 italic">Esta ação é irreversível. Todas as suas produções estratégicas salvas serão removidas permanentemente.</p>
            <div className="flex gap-4">
              <button onClick={() => setShowClearAllConfirm(false)} className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors">Cancelar</button>
              <button onClick={confirmClearAll} className="flex-1 py-3 px-4 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg">Limpar Agora</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryView;
