
import React, { useState, useEffect, useRef } from 'react';
import { Link2, Sparkles, Copy, Check, Info, Share2, Search, CalendarDays, Layers, X, CheckCircle2, MessageCircle, Zap, ChevronLeft, ChevronRight, History, Target, Palette, Settings2, Bot, MessageSquarePlus, Terminal, Edit3, Lock, Paperclip, FileIcon, Trash2, Upload, Save, Send, Image as ImageIcon, Brain, ChevronDown, MessageSquare, Loader2 } from 'lucide-react';
import { generateSocialContent, DEFAULT_PRE_PROMPT } from '../services/geminiService';
import { productionService } from '../services/productionService'; 
import { aiModelService } from '../services/aiModelService';
import { generateUUID } from '../services/supabaseClient';
import { GenerationConfig, GeneratedContent, ContentFormat, ContentGoal, Tone, HistoryItem, HistoryVersion, PlannerItem, CreativeItem, AiContextFile, TeamMember, Post, DistributionChannel, AiModel, INITIAL_AI_MODELS, BlogCategory, BlogPost } from '../types';
import PostFormDrawer from './PostFormDrawer';
import BlogFormDrawer from './BlogFormDrawer';

const STORAGE_AI_FILES = 'vm_gestao_ai_context_files';

interface ContentGeneratorProps {
  onSave?: (productionId: string, config: GenerationConfig | GenerationConfig[], version: HistoryVersion, title?: string) => void;
  onSavePost?: (post: Post) => void;
  onSaveBlog?: (post: BlogPost) => void;
  initialProduction?: HistoryItem | null;
  plannerItems?: PlannerItem[];
  creativeItems?: CreativeItem[];
  teamMembers?: TeamMember[];
  historyItems?: HistoryItem[];
  blogCategories?: BlogCategory[];
}

const ContentGenerator: React.FC<ContentGeneratorProps> = ({ 
  onSave, 
  onSavePost,
  onSaveBlog,
  initialProduction, 
  plannerItems = [], 
  creativeItems = [],
  teamMembers = [],
  historyItems = [],
  blogCategories = []
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [aiModels, setAiModels] = useState<AiModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [prePrompt, setPrePrompt] = useState(''); // Sincronizado com o modelo
  const [aiFiles, setAiFiles] = useState<AiContextFile[]>([]);
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [isEditingPrePrompt, setIsEditingPrePrompt] = useState(false);
  const [userPrompt, setUserPrompt] = useState('');
  const [isUserPromptVisible, setIsUserPromptVisible] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // ID da "Thread" persistida no Supabase (Deve ser UUID)
  const [productionId, setProductionId] = useState<string>(generateUUID());
  const [results, setResults] = useState<GeneratedContent[][]>([]); 
  const [historyVersions, setHistoryVersions] = useState<HistoryVersion[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const [plannerSearch, setPlannerSearch] = useState('');
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const plannerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showPostDrawer, setShowPostDrawer] = useState(false);
  const [showBlogDrawer, setShowBlogDrawer] = useState(false);
  const [selectedResultToPost, setSelectedResultToPost] = useState<GeneratedContent | null>(null);
  const [selectedResultToBlog, setSelectedResultToBlog] = useState<GeneratedContent | null>(null);
  const [selectedIndexToPost, setSelectedIndexToPost] = useState<number | undefined>(undefined);

  const [url, setUrl] = useState('');
  const [selectedPlannerId, setSelectedPlannerId] = useState<string | undefined>(undefined);
  const [configsByChannel, setConfigsByChannel] = useState<Record<string, Partial<GenerationConfig>>>({
    'default': { format: 'Post', goal: 'Engajamento', tone: 'Humano' }
  });

  // Carregar Modelos e Arquivos
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const models = await aiModelService.getAll();
        const activeModels = models.filter(m => m.status === 'Ativo');
        setAiModels(activeModels);
        
        const defaultModel = activeModels.find(m => m.isDefault) || activeModels[0];
        if (defaultModel) {
          setSelectedModelId(defaultModel.id);
          setPrePrompt(defaultModel.systemInstruction || DEFAULT_PRE_PROMPT);
        }
      } catch (err) {
        console.error("Erro ao carregar modelos do Supabase:", err);
        setAiModels(INITIAL_AI_MODELS); // Fallback
      }

      const savedFiles = localStorage.getItem(STORAGE_AI_FILES);
      if (savedFiles) setAiFiles(JSON.parse(savedFiles));
    };

    loadInitialData();
  }, []);

  // Sincronizar prompt ao trocar modelo
  useEffect(() => {
    const model = aiModels.find(m => m.id === selectedModelId);
    if (model) {
      setPrePrompt(model.systemInstruction || DEFAULT_PRE_PROMPT);
    }
  }, [selectedModelId, aiModels]);

  useEffect(() => {
    if (initialProduction) {
      setProductionId(initialProduction.id);
      const firstConfig = Array.isArray(initialProduction.config) ? initialProduction.config[0] : initialProduction.config;
      setUrl(firstConfig.url || '');
      setSelectedPlannerId(firstConfig.plannerItemId);
      
      if (Array.isArray(initialProduction.config)) {
        const newMap: Record<string, Partial<GenerationConfig>> = {};
        initialProduction.config.forEach(c => {
          newMap[c.platform || 'default'] = c;
        });
        setConfigsByChannel(newMap);
      }

      setResults((initialProduction.versions || []).map(v => Array.isArray(v.content) ? v.content : [v.content]));
      setHistoryVersions(initialProduction.versions || []);
      setActiveIndex(Math.max(0, (initialProduction.versions || []).length - 1));
      
      if (firstConfig.plannerItemId) {
        const item = plannerItems.find(p => p.id === firstConfig.plannerItemId);
        if (item) setPlannerSearch(item.theme);
      }
    }
  }, [initialProduction, plannerItems]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (plannerRef.current && !plannerRef.current.contains(event.target as Node)) {
        setIsPlannerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGenerate = async () => {
    const selectedModel = aiModels.find(m => m.id === selectedModelId);
    if (!selectedModel) {
      setError("Selecione um motor de IA válido nas configurações.");
      return;
    }

    const hasContext = url || userPrompt.trim() || aiFiles.length > 0 || selectedPlannerId;
    if (!hasContext) {
      setError("Forneça uma URL, instruções, arquivos ou selecione um item do planner.");
      return;
    }

    setLoading(true);
    setLoadingProgress(0);
    setLoadingStatus('Iniciando motores estratégicos...');
    setError(null);

    const statuses = [
      'Analisando dados da fonte...',
      'Estruturando copy persuasiva...',
      'Refinando gatilhos mentais...',
      'Gravando sessão no banco...',
      'Ajustando tons por canal...',
      'Gerando sugestões visuais...',
      'Finalizando hashtags...'
    ];

    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 95) return prev;
        const jump = Math.floor(Math.random() * 5) + 1;
        const statusIdx = Math.min(Math.floor((prev / 100) * statuses.length), statuses.length - 1);
        setLoadingStatus(statuses[statusIdx]);
        return prev + jump;
      });
    }, 400);

    let plannerCtx = '';
    const activePlanner = plannerItems.find(p => p.id === selectedPlannerId);
    if (activePlanner) {
      plannerCtx = `Tema: ${activePlanner.theme}. Notas: ${activePlanner.notes}. Canais: ${activePlanner.channels.join(', ')}.`;
    }

    const configsToGenerate: GenerationConfig[] = [];
    const channelsToIterate = activePlanner ? activePlanner.channels : (['default'] as const);

    channelsToIterate.forEach(ch => {
      const config = configsByChannel[ch] || configsByChannel['default'];
      configsToGenerate.push({
        url,
        format: config.format || 'Post',
        goal: config.goal || 'Engajamento',
        tone: config.tone || 'Humano',
        plannerItemId: selectedPlannerId,
        platform: ch === 'default' ? undefined : ch
      });
    });

    try {
      const initialTitle = activePlanner?.theme || url || 'Geração Manual';
      const savedProdId = await productionService.upsertProduction({
        id: productionId, 
        title: initialTitle,
        config: configsToGenerate
      });
      
      setProductionId(savedProdId);

      // Passamos o modelo selecionado que já contém a systemInstruction atualizada
      const { content, promptUsed } = await generateSocialContent(
        configsToGenerate, 
        { ...selectedModel, systemInstruction: prePrompt }, 
        userPrompt || undefined, 
        aiFiles,
        plannerCtx,
        historyVersions
      );

      // Limpeza defensiva de tags HTML nos campos de texto, preservando quebras de linha
      const cleanedContent = content.map(item => ({
        ...item,
        title: item.title?.replace(/<[^>]*>?/gm, '') || '',
        summary: item.summary?.replace(/<[^>]*>?/gm, '') || '',
        body: item.body
          ?.replace(/<\/p>/g, '\n\n')
          ?.replace(/<br\s*\/?>/g, '\n')
          ?.replace(/<[^>]*>?/gm, '')
          ?.replace(/\n{3,}/g, '\n\n') // Remove excesso de quebras
          ?.trim() || ''
      }));

      // Se não houver planner vinculado, atualizamos o título com o gerado pela IA
      let finalTitle = initialTitle;
      if (!activePlanner && cleanedContent.length > 0 && cleanedContent[0].title) {
        finalTitle = cleanedContent[0].title;
        await productionService.upsertProduction({
          id: savedProdId,
          title: finalTitle,
          config: configsToGenerate
        });
      }

      setLoadingProgress(98);
      setLoadingStatus('Salvando iteração estratégica...');

      const savedVersion = await productionService.addVersion(savedProdId, {
        content: cleanedContent,
        prompt: promptUsed
      });

      setLoadingProgress(100);
      setLoadingStatus('Produção finalizada!');

      const newResults = [...results, cleanedContent];
      const newHistory = [...historyVersions, savedVersion];
      
      setResults(newResults);
      setHistoryVersions(newHistory);
      setActiveIndex(newResults.length - 1);

      if (onSave) {
        onSave(savedProdId, configsToGenerate, savedVersion, finalTitle);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setLoading(false);
        setLoadingProgress(0);
      }, 800);
    }
  };

  const handleSaveAiSettings = async () => {
    setIsSavingSettings(true);
    try {
      // 1. Persistir arquivos no local
      localStorage.setItem(STORAGE_AI_FILES, JSON.stringify(aiFiles));

      // 2. Persistir nova instrução de sistema no modelo do Supabase
      if (selectedModelId) {
        await aiModelService.update(selectedModelId, { systemInstruction: prePrompt });
        // Atualizar lista local de modelos
        setAiModels(prev => prev.map(m => m.id === selectedModelId ? { ...m, systemInstruction: prePrompt } : m));
      }

      setIsEditingPrePrompt(false);
      setShowAiSettings(false);
    } catch (err) {
      console.error("Erro ao salvar configurações:", err);
      alert("Falha ao salvar instruções no banco de dados.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newFile: AiContextFile = {
          id: generateUUID(),
          name: file.name,
          type: file.type,
          data: reader.result as string,
          size: file.size
        };
        setAiFiles(prev => [...prev, newFile]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAiFile = (id: string) => {
    setAiFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleCopy = (res: GeneratedContent) => {
    const hashtagsFormatted = res.hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ');
    const textToCopy = `${res.title}\n\n${res.body}\n\n${hashtagsFormatted}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredPlannerItems = plannerItems.filter(item => {
    const theme = item.theme || "";
    const search = plannerSearch || "";
    return theme.toLowerCase().includes(search.toLowerCase()) && !item.completed;
  });

  const selectPlannerItem = (item: PlannerItem) => {
    let foundUrl = url;
    if (!foundUrl && item.notes) {
      const found = item.notes.match(/(https?:\/\/[^\s]+)/g);
      if (found) foundUrl = found[0];
    }
    setUrl(foundUrl);
    setSelectedPlannerId(item.id);
    setPlannerSearch(item.theme);
    setIsPlannerOpen(false);

    const newConfigs: Record<string, Partial<GenerationConfig>> = {};
    item.channels.forEach(ch => {
      newConfigs[ch] = {
        format: item.format === 'Mult Canais' ? 'Post' : item.format,
        goal: 'Engajamento',
        tone: 'Humano'
      };
    });
    setConfigsByChannel(newConfigs);
  };

  const updateConfigForChannel = (channel: string, field: keyof GenerationConfig, value: any) => {
    setConfigsByChannel(prev => ({
      ...prev,
      [channel]: { ...prev[channel], [field]: value }
    }));
  };

  const inputClasses = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#7ba1ee] focus:bg-white outline-none text-slate-900 font-medium transition-all placeholder:text-slate-600";

  const currentIterationResults = results[activeIndex] || [];
  const canGenerate = url || userPrompt.trim() || aiFiles.length > 0 || selectedPlannerId || results.length > 0;

  const activePlanner = selectedPlannerId ? plannerItems.find(p => p.id === selectedPlannerId) : null;
  const channelsToDisplay = activePlanner ? activePlanner.channels : ['default'];
  const selectedModel = aiModels.find(m => m.id === selectedModelId);

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-0 overflow-hidden bg-white">
      <style>{`
        .custom-ai-scroll::-webkit-scrollbar { width: 6px; }
        .custom-ai-scroll::-webkit-scrollbar-track { background: #ffffff; border-radius: 10px; }
        .custom-ai-scroll::-webkit-scrollbar-thumb { background: #7ba1ee; border-radius: 10px; }
      `}</style>

      {/* IA SETTINGS DRAWER OVERLAY */}
      {showAiSettings && (
        <div className="fixed inset-0 z-[100] flex justify-center items-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAiSettings(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200 max-h-[90vh] flex flex-col">
             <div className="bg-[#7ba1ee] p-8 text-white flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-white/10 rounded-2xl"><Bot size={24} /></div>
                   <div>
                      <h3 className="font-bold text-xl">Configuração do Agente IA</h3>
                      <p className="text-xs text-[#4c6eb3] font-bold uppercase tracking-widest">Ajuste o comportamento do motor estratégico</p>
                   </div>
                </div>
                <button onClick={() => setShowAiSettings(false)} className="p-2 hover:bg-white/10 rounded-full"><X size={24}/></button>
             </div>
             <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-ai-scroll">
                <div className="space-y-4">
                   <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <Terminal size={14} className="text-slate-900" /> Prompt de Sistema ({selectedModel?.name})
                        </label>
                      </div>
                      <button onClick={() => setIsEditingPrePrompt(!isEditingPrePrompt)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${isEditingPrePrompt ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                         {isEditingPrePrompt ? <Check size={12} /> : <Edit3 size={12} />} {isEditingPrePrompt ? 'Concluir' : 'Editar'}
                      </button>
                   </div>
                   <div className="relative group">
                     <textarea 
                        readOnly={!isEditingPrePrompt} 
                        className={`${inputClasses} h-48 resize-none font-mono text-xs leading-relaxed p-6 ${!isEditingPrePrompt ? 'bg-slate-50/50 text-slate-600 cursor-default' : 'bg-white ring-2 ring-[#4c6eb3]/20'}`} 
                        value={prePrompt} 
                        onChange={e => setPrePrompt(e.target.value)} 
                     />
                     {!isEditingPrePrompt && (
                       <div className="absolute top-2 right-2 p-1 bg-white/80 rounded border border-slate-100 shadow-sm flex items-center gap-1">
                         <Lock size={10} className="text-slate-300" />
                         <span className="text-[8px] font-bold text-slate-300 uppercase">Modo Leitura</span>
                       </div>
                     )}
                   </div>
                   <p className="text-[10px] text-slate-600 font-medium italic">Esta instrução define a base de conhecimento e tom de voz global do motor de IA selecionado.</p>
                </div>
                <div className="space-y-4">
                   <div className="flex justify-between items-end">
                      <label className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2"><Paperclip size={14} className="text-slate-900" /> Arquivos de Contexto</label>
                      <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase bg-blue-50 text-blue-600 border border-blue-200"><Upload size={12} /> Adicionar</button>
                      <input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                   </div>
                   <div className="grid grid-cols-1 gap-3">
                      {aiFiles.map(file => (
                        <div key={file.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                           <div className="flex items-center gap-3 min-w-0">
                              <div className="p-2 bg-white rounded-lg shadow-sm text-slate-900"><FileIcon size={16} /></div>
                              <div className="min-w-0"><p className="text-xs font-bold text-slate-900 truncate">{file.name}</p></div>
                           </div>
                           <button onClick={() => removeAiFile(file.id)} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                        </div>
                      ))}
                      {aiFiles.length === 0 && <p className="text-center py-6 text-[10px] text-slate-300 font-bold uppercase border border-dashed border-slate-200 rounded-2xl">Nenhum arquivo anexado</p>}
                   </div>
                </div>
             </div>
             <div className="p-8 border-t border-slate-100 bg-white flex justify-end">
                <button onClick={handleSaveAiSettings} disabled={isSavingSettings} className="bg-[#7ba1ee] text-white px-10 py-4 rounded-xl font-bold shadow-xl flex items-center gap-2 hover:bg-[#00152b] transition-all disabled:opacity-50">
                  {isSavingSettings ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Salvar Configuração
                </button>
             </div>
          </div>
        </div>
      )}

      {/* PAINEL LATERAL ESQUERDO */}
      <aside className="w-full lg:w-[400px] bg-slate-50/50 border-r border-slate-100 flex flex-col flex-shrink-0 h-full min-h-0 overflow-hidden shadow-sm relative">
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#7ba1ee] text-white rounded-2xl shadow-lg ring-4 ring-[#7ba1ee]/5"><Zap size={20} fill="currentColor" /></div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 leading-none">Gerador Estratégico</h2>
                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-1">VM Gestão Estratégica AI Production</p>
              </div>
            </div>
            <button onClick={() => setShowAiSettings(true)} className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100"><Settings2 size={20} /></button>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2"><Brain size={14} className="text-emerald-500" /> Motor de IA Ativo</label>
              <div className="relative">
                <select 
                  className={`${inputClasses} !py-2.5 text-xs shadow-sm cursor-pointer appearance-none pr-10`}
                  value={selectedModelId}
                  onChange={e => setSelectedModelId(e.target.value)}
                >
                  {aiModels.length > 0 ? aiModels.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  )) : (
                    <option value="">Carregando modelos...</option>
                  )}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none">
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>

            <div className="space-y-2 relative" ref={plannerRef}>
              <label className="text-[10px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2"><CalendarDays size={14} className="text-purple-500" /> Vincular ao Planner</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"><Search size={14} /></div>
                <input type="text" placeholder="Pesquisar tema planejado..." className={`${inputClasses} pl-10 !py-2.5 text-xs shadow-sm`} value={plannerSearch} onFocus={() => setIsPlannerOpen(true)} onChange={e => { setPlannerSearch(e.target.value); setIsPlannerOpen(true); }} />
              </div>
              {isPlannerOpen && filteredPlannerItems.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                  {filteredPlannerItems.map(item => (
                    <button key={item.id} onClick={() => selectPlannerItem(item)} className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-none">
                      <span className="font-bold text-slate-900 text-xs line-clamp-1">{item.theme}</span>
                      <ChevronRight size={14} className="text-slate-300" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2"><Link2 size={14} className="text-blue-500" /> URL da Fonte (Opcional)</label>
              <input type="url" placeholder="Cole o link ou deixe vazio para manual" className={`${inputClasses} !py-2.5 text-xs shadow-sm`} value={url} onChange={e => setUrl(e.target.value)} />
            </div>

            <div className="space-y-8 pt-2 border-t border-slate-200/50">
               {channelsToDisplay.map((channel) => {
                 const config = configsByChannel[channel] || configsByChannel['default'];
                 return (
                   <div key={channel} className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                      {activePlanner && (
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase tracking-widest bg-[#4c6eb3] text-slate-900 px-3 py-1 rounded-lg shadow-sm">{channel}</span>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2"><Layers size={14} /> Formato</label>
                        <div className="relative">
                          <select className={`${inputClasses} !py-2.5 text-xs shadow-sm cursor-pointer appearance-none pr-10`} value={config.format} onChange={e => updateConfigForChannel(channel, 'format', e.target.value as ContentFormat)}>
                            <option>Post</option>
                            <option>Stories</option>
                            <option>Reels</option>
                            <option>Carrossel</option>
                            <option>Blog</option>
                            <option>Vídeo</option>
                            <option>Shorts</option>
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none">
                            <ChevronDown size={14} />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2"><Target size={14} /> Objetivo</label>
                            <div className="relative">
                              <select className={`${inputClasses} !py-2.5 text-[10px] shadow-sm cursor-pointer appearance-none pr-8`} value={config.goal} onChange={e => updateConfigForChannel(channel, 'goal', e.target.value as ContentGoal)}>
                                <option>Engajamento</option><option>Autoridade</option><option>Vendas</option><option>Educação</option>
                              </select>
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none">
                                <ChevronDown size={12} />
                              </div>
                            </div>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2"><MessageCircle size={14} /> Tom</label>
                            <div className="relative">
                              <select className={`${inputClasses} !py-2.5 text-[10px] shadow-sm cursor-pointer appearance-none pr-8`} value={config.tone} onChange={e => updateConfigForChannel(channel, 'tone', e.target.value as Tone)}>
                                <option>Humano</option><option>Formal</option><option>Persuasivo</option><option>Descontraído</option><option>Técnico</option>
                              </select>
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none">
                                <ChevronDown size={12} />
                              </div>
                            </div>
                         </div>
                      </div>
                   </div>
                 );
               })}
            </div>
          </div>
        </div>

        {/* ÁREA DE AÇÕES COM INSTRUÇÕES ATIVAS */}
        <div className="p-6 md:p-8 bg-white border-t border-slate-100 flex flex-col gap-4 flex-shrink-0">
           <div className="space-y-3 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isUserPromptVisible ? 'bg-[#4c6eb3]' : 'bg-slate-200'}`} />
                  <label className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Instruções Ativas</label>
                </div>
                <button 
                  onClick={() => setIsUserPromptVisible(!isUserPromptVisible)}
                  className={`p-1.5 rounded-lg transition-all shadow-md ${isUserPromptVisible ? 'bg-[#7ba1ee] text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'}`}
                >
                   <MessageSquarePlus size={14} />
                </button>
              </div>
              
              {isUserPromptVisible && (
                <div className="relative group animate-in slide-in-from-top-2 duration-300">
                  <textarea 
                    rows={4}
                    className={`${inputClasses} !py-4 text-xs resize-none bg-slate-50/50 border-slate-100 focus:bg-white focus:ring-[#7ba1ee]/10 shadow-inner italic leading-relaxed placeholder:text-slate-300`}
                    placeholder="Ex: 'Utilize o arquivo que está carregado e aplique as melhores técnicas de SEO'..."
                    value={userPrompt}
                    onChange={e => setUserPrompt(e.target.value)}
                  />
                </div>
              )}
           </div>

           <button 
             onClick={handleGenerate}
             disabled={loading || !canGenerate || aiModels.length === 0}
             className={`w-full py-4 rounded-[1.2rem] font-bold flex items-center justify-center gap-3 transition-all shadow-xl disabled:opacity-50 relative overflow-hidden group ${loading ? 'bg-slate-100 text-slate-600' : 'bg-[#7ba1ee] text-white active:scale-95'}`}
           >
             {loading ? (
               <>
                 <Loader2 size={20} className="animate-spin" />
                 <span>{loadingProgress}% Gerando...</span>
               </>
             ) : (
               <>
                 <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
                 {userPrompt.trim() ? 'Gerar com Instruções' : (results.length > 0 ? 'Refinar Geração' : 'Iniciar Geração Estratégica')}
               </>
             )}
           </button>
           {error && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[10px] text-red-500 font-bold flex items-center gap-2 animate-in fade-in zoom-in duration-200 uppercase tracking-tighter italic"><Info size={14} /> {error}</div>}
        </div>
      </aside>

      {/* ÁREA PRINCIPAL DE RESULTADOS */}
      <main className="flex-1 min-w-0 bg-white h-full flex flex-col relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-[50] flex items-center justify-center bg-white/95 backdrop-blur-sm transition-all duration-500 animate-in fade-in">
            <div className="max-w-md w-full px-8 flex flex-col items-center text-center space-y-8">
              <div className="relative">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="60" stroke="rgba(0,31,63,0.05)" strokeWidth="8" fill="transparent" />
                  <circle
                    cx="64" cy="64" r="60" stroke="#4c6eb3" strokeWidth="8" fill="transparent"
                    strokeDasharray={377} strokeDashoffset={377 - (377 * loadingProgress) / 100}
                    className="transition-all duration-500 ease-out" strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-black text-slate-900">{loadingProgress}%</span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xl font-bold text-slate-900 uppercase tracking-widest animate-pulse">Produzindo Conteúdo</h3>
                <p className="text-[#4c6eb3] text-sm font-bold h-5 uppercase">{loadingStatus}</p>
              </div>

              <div className="w-full bg-[#7ba1ee]/5 h-1.5 rounded-full overflow-hidden">
                 <div className="h-full bg-[#4c6eb3] transition-all duration-500 ease-out shadow-[0_0_15px_rgba(76,110,179,0.3)]" style={{ width: `${loadingProgress}%` }} />
              </div>

              <p className="text-slate-600 text-[10px] font-medium italic">Transformando referências em autoridade digital...</p>
            </div>
          </div>
        )}

        {results.length > 0 ? (
          <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
            <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button disabled={activeIndex === 0} onClick={() => setActiveIndex(prev => prev - 1)} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-900 disabled:opacity-30 shadow-sm hover:shadow-md transition-all active:scale-90"><ChevronLeft size={18} /></button>
                    <button disabled={activeIndex === results.length - 1} onClick={() => setActiveIndex(prev => prev + 1)} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-900 disabled:opacity-30 shadow-sm hover:shadow-md transition-all active:scale-90"><ChevronRight size={18} /></button>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-none">Produção em Thread</p>
                    <p className="text-xs font-black text-slate-900 uppercase mt-1">Iteração {activeIndex + 1} de {results.length}</p>
                  </div>
               </div>
               <button onClick={() => { setResults([]); setHistoryVersions([]); setProductionId(generateUUID()); }} className="text-[10px] font-bold text-red-400 hover:text-red-600 transition-colors uppercase tracking-widest flex items-center gap-1.5"><Trash2 size={12} /> Limpar Geração</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-12 custom-scrollbar scroll-smooth">
              {currentIterationResults.map((res, idx) => {
                if (!res) return null;
                return (
                <div key={idx} className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <div className="flex flex-col md:flex-row gap-10 items-start">
                    <div className="flex-1 space-y-8 min-w-0">
                      <div className="flex items-center justify-between">
                         <div className="space-y-1">
                            {res.platform && (
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4c6eb3] bg-[#4c6eb3]/5 px-3 py-1 rounded-full border border-[#4c6eb3]/10">{res.platform}</span>
                            )}
                            <h2 className="text-3xl font-black text-slate-900 leading-tight break-words">{res.title}</h2>
                         </div>
                      </div>

                      <div className="relative group">
                         <div className="absolute -inset-4 bg-slate-50/50 rounded-[2.5rem] -z-10 transition-colors group-hover:bg-slate-50" />
                         <p className="text-lg text-slate-700 leading-relaxed whitespace-pre-wrap font-medium italic select-text cursor-auto">
                            {res.body}
                         </p>
                         <div className="flex flex-wrap gap-2 mt-6">
                            {res.hashtags.map(tag => (
                              <span key={tag} className="text-blue-500 font-bold text-sm hover:underline cursor-pointer">
                                {tag.startsWith('#') ? tag : `#${tag}`}
                              </span>
                            ))}
                         </div>
                      </div>
                    </div>

                    <div className="w-full md:w-80 space-y-6 flex-shrink-0">
                      <div className="bg-slate-50 rounded-[2rem] p-6 space-y-4 border border-slate-100 shadow-sm transition-all hover:shadow-md">
                         <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2"><ImageIcon size={14} /> Visual Sugerido</h4>
                         <div className="p-5 bg-white rounded-2xl text-xs text-slate-900 leading-relaxed italic font-medium border border-slate-100 shadow-inner">
                            {res.imageSuggestion}
                         </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <button 
                          onClick={() => handleCopy(res)}
                          className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${copied ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-white border-2 border-[#7ba1ee] text-slate-900 hover:bg-slate-50'}`}
                        >
                          {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                          {copied ? 'Conteúdo Copiado' : 'Copiar Legenda'}
                        </button>
                        {(() => {
                          const config = (res.platform && configsByChannel[res.platform]) || configsByChannel['default'];
                          const isBlog = res.platform === 'Blog' || config?.format === 'Blog';
                          
                          if (isBlog) {
                            return (
                              <button 
                                onClick={() => {
                                  setSelectedResultToBlog(res);
                                  setShowBlogDrawer(true);
                                }}
                                className="w-full py-4 bg-[#7ba1ee] text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl hover:bg-[#00152b] active:scale-95 shadow-[#7ba1ee]/20"
                              >
                                <Send size={18} /> Finalizar Blog
                              </button>
                            );
                          }
                          
                          return (
                            <button 
                              onClick={() => {
                                setSelectedResultToPost(res);
                                setSelectedIndexToPost(idx);
                                setShowPostDrawer(true);
                              }}
                              className="w-full py-4 bg-[#7ba1ee] text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl hover:bg-[#00152b] active:scale-95 shadow-[#7ba1ee]/20"
                            >
                              <Send size={18} /> Finalizar Post
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                  {idx < currentIterationResults.length - 1 && <div className="h-px w-full bg-slate-100" />}
                </div>
              );
              })}
              <div className="h-20" />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-1000">
            <div className="max-w-md space-y-8">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-[#4c6eb3] blur-3xl opacity-20 animate-pulse" />
                <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center mx-auto border border-slate-100 relative z-10">
                  <Sparkles size={48} className="text-slate-900" />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-slate-900">Pronto para produzir?</h3>
                <p className="text-slate-600 text-sm leading-relaxed italic">
                  Utilize o painel lateral para configurar os canais e o motor de inteligência artificial. Transforme temas e links em autoridade digital com um clique.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <PostFormDrawer 
        isOpen={showPostDrawer}
        onClose={() => { setShowPostDrawer(false); setSelectedResultToPost(null); setSelectedIndexToPost(undefined); }}
        onSave={(p) => { onSavePost?.(p); setShowPostDrawer(false); }}
        historyItems={historyItems}
        plannerItems={plannerItems}
        creativeItems={creativeItems}
        teamMembers={teamMembers}
        blogCategories={blogCategories}
        fixedHistoryId={productionId}
        fixedContentIndex={selectedIndexToPost}
        fixedPlannerId={selectedPlannerId}
        preselectedChannel={selectedResultToPost?.platform as DistributionChannel}
      />

      <BlogFormDrawer 
        isOpen={showBlogDrawer}
        onClose={() => { setShowBlogDrawer(false); setSelectedResultToBlog(null); }}
        onSave={(p) => { onSaveBlog?.(p); setShowBlogDrawer(false); }}
        generatedContent={selectedResultToBlog}
        creativeItems={creativeItems}
        teamMembers={teamMembers}
        blogCategories={blogCategories}
      />
    </div>
  );
};

export default ContentGenerator;
