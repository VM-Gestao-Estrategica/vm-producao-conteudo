
import React, { useState, useEffect } from 'react';
import { Menu, Loader2 } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ContentGenerator from './components/ContentGenerator';
import HistoryView from './components/HistoryView';
import Dashboard from './components/Dashboard';
import Planner from './components/Planner';
import Creatives from './components/Creatives';
import Team from './components/Team';
import Posts from './components/Posts';
import Channels from './components/Channels';
import Settings from './components/Settings';
import Footer from './components/Footer';
import Login from './components/Login';
import ResetPassword from './components/ResetPassword';
import { HistoryItem, HistoryVersion, PlannerItem, GenerationConfig, CreativeItem, TeamMember, TeamGroup, Post, ChannelAccount, BlogCategory, BlogPost } from './types';

// Supabase
import { supabase } from './services/supabaseClient';
import { authService } from './services/authService';

// Importação dos Serviços Supabase
import { productionService } from './services/productionService';
import { plannerService } from './services/plannerService';
import { creativeService } from './services/creativeService';
import { postService } from './services/postService';
import { channelService } from './services/channelService';
import { profileService } from './services/profileService';
import { teamService } from './services/teamService';
import { blogCategoryService } from './services/blogCategoryService';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isRecovering, setIsRecovering] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'generator' | 'history' | 'planner' | 'creatives' | 'team' | 'posts' | 'channels' | 'settings' | 'ai-models'>(() => {
    return (localStorage.getItem('vm_gestao_active_tab') as any) || 'dashboard';
  });
  
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [planner, setPlanner] = useState<PlannerItem[]>([]);
  const [creatives, setCreatives] = useState<CreativeItem[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [teamsGroup, setTeamsGroup] = useState<TeamGroup[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [channels, setChannels] = useState<ChannelAccount[]>([]);
  const [blogCategories, setBlogCategories] = useState<BlogCategory[]>([]);
  const [editingProduction, setEditingProduction] = useState<HistoryItem | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Monitorar Estado da Autenticação
  useEffect(() => {
    // Verificar se o usuário está vindo de um link de recuperação
    const params = new URLSearchParams(window.location.search);
    if (params.get('type') === 'recovery') {
      setIsRecovering(true);
    }

    // 1. Verificar se já existe uma sessão no LocalStorage ao carregar
    const checkInitialSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
      } catch (error) {
        console.error("Erro ao recuperar sessão persistida:", error);
      } finally {
        setIsAuthChecking(false);
      }
    };

    checkInitialSession();

    // 2. Ouvir mudanças de estado (Login, Logout, Token Refreshed)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log("Auth Event:", event);
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovering(true);
      }
      setSession(currentSession);
      setIsAuthChecking(false); // Garante que saia do loading em qualquer evento
    });

    return () => subscription.unsubscribe();
  }, []);

  // Carregar dados iniciais do Supabase após login ou refresh de token
  useEffect(() => {
    if (!session || isLoadingInitial) return;

    const fetchData = async () => {
      setIsLoadingInitial(true);
      try {
        const [
          historyData, 
          plannerData, 
          creativesData, 
          postsData, 
          channelsData, 
          membersData, 
          groupsData,
          blogCategoriesData
        ] = await Promise.all([
          productionService.getAll(),
          plannerService.getAll(),
          creativeService.getAll(),
          postService.getAll(),
          channelService.getAll(),
          profileService.getAll(),
          teamService.getAll(),
          blogCategoryService.getAll()
        ]);

        setHistory(historyData);
        setPlanner(plannerData);
        setCreatives(creativesData);
        setPosts(postsData);
        setChannels(channelsData);
        setTeam(membersData);
        setTeamsGroup(groupsData);
        setBlogCategories(blogCategoriesData);
        setHasLoadedOnce(true);
      } catch (error) {
        console.error("Erro ao carregar dados do Supabase:", error);
      } finally {
        setIsLoadingInitial(false);
      }
    };

    fetchData();
  }, [session?.user?.id]); // Usar ID específico para evitar disparos por mudanças de timestamp no objeto session

  // Salvar aba ativa no LocalStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('vm_gestao_active_tab', activeTab);
  }, [activeTab]);

  const handleLogout = async () => {
    await authService.signOut();
    setSession(null);
  };

  const handleSaveToHistory = (productionId: string, config: GenerationConfig | GenerationConfig[], version: HistoryVersion, title?: string) => {
    const existing = history.find(h => h.id === productionId);
    let newHistory: HistoryItem[];

    if (existing) {
      newHistory = history.map(h => 
        h.id === productionId 
          ? { ...h, config, versions: [...h.versions, version], lastUpdated: Date.now(), title: title || h.title } 
          : h
      );
    } else {
      newHistory = [{
        id: productionId,
        title: title,
        config,
        versions: [version],
        lastUpdated: Date.now()
      }, ...history];
    }
    setHistory(newHistory);
  };

  const handleEditFromHistory = (item: HistoryItem) => { 
    setEditingProduction(item); 
    setActiveTab('generator'); 
  };

  const handleSavePost = (p: Post) => {
    const ex = posts.find(x => x.id === p.id);
    setPosts(ex ? posts.map(x => x.id === p.id ? p : x) : [p, ...posts]);
  };

  const handleSaveBlog = (p: BlogPost) => {
    // Como ainda não temos uma view de blogs, apenas logamos ou poderíamos manter um estado local se necessário
    console.log("Blog post salvo:", p);
  };

  const handleUpdatePlanner = async (p: PlannerItem) => {
    try {
      let saved: PlannerItem;
      const ex = planner.find(x => x.id === p.id);
      if (ex) {
        saved = await plannerService.update(p.id, p);
        setPlanner(planner.map(x => x.id === p.id ? saved : x));
      } else {
        saved = await plannerService.create(p);
        setPlanner([...planner, saved]);
      }
    } catch (e) { console.error(e); }
  };

  const handleSaveCreative = async (c: CreativeItem) => {
    try {
      const ex = creatives.find(x => x.id === c.id);
      if (ex) {
        const saved = await creativeService.update(c.id, c);
        setCreatives(creatives.map(x => x.id === c.id ? saved : x));
      } else {
        const saved = await creativeService.create(c);
        setCreatives([saved, ...creatives]);
      }
    } catch (e) {
      console.error("Erro ao persistir criativo:", e);
      throw e;
    }
  };

  if (isAuthChecking) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white">
        <Loader2 className="animate-spin text-slate-900" size={40} />
      </div>
    );
  }

  if (isRecovering) {
    return <ResetPassword onSuccess={() => {
      setIsRecovering(false);
      window.history.replaceState({}, document.title, "/");
    }} />;
  }

  if (!session) {
    return <Login onLoginSuccess={() => {}} />;
  }

  if (isLoadingInitial && !hasLoadedOnce) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#7ba1ee] border-t-[#4c6eb3] rounded-full animate-spin" />
          <p className="text-slate-900 font-bold animate-pulse">Sincronizando com Supabase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-full bg-slate-50 overflow-hidden fixed inset-0">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        activeTab={activeTab} 
        onTabChange={(tab) => {
          if (tab !== 'generator') setEditingProduction(null);
          setActiveTab(tab);
        }} 
        onLogout={handleLogout} 
        user={session?.user}
      />

      <main className="flex-1 flex flex-col min-w-0 h-full md:pl-72 transition-all relative overflow-hidden">
        {/* Header Mobile */}
        <header className="md:hidden flex-shrink-0 flex items-center justify-between px-6 py-4 bg-[#7ba1ee] text-white shadow-md z-[50]">
          <div className="flex items-center gap-2">
            <img 
              src="apple-touch-icon.png" 
              alt="VM Gestão" 
              className="w-10 h-10 rounded-lg object-contain bg-white shadow-sm"
            />
            <div className="flex flex-col justify-center -space-y-1">
              <span className="text-sm font-black tracking-tighter leading-tight">VM Produção</span>
              <span className="text-[10px] font-bold opacity-80">De conteúdo</span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <Menu size={24} />
          </button>
        </header>

        {/* Layout de Conteúdo */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          
          {/* Caso Gerador: Scroll Interno (Layout Especial) */}
          {activeTab === 'generator' ? (
            <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden">
              <ContentGenerator 
                onSave={handleSaveToHistory} 
                onSavePost={handleSavePost}
                onSaveBlog={handleSaveBlog}
                initialProduction={editingProduction} 
                plannerItems={planner} 
                creativeItems={creatives} 
                teamMembers={team}
                historyItems={history}
                blogCategories={blogCategories}
              />
            </div>
          ) : (
            /* Caso Geral: Scroll da Página com Footer no final */
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
              <div className="flex-1 flex flex-col min-h-full">
                {/* Título da Página */}
                <div className="pt-8 px-6 md:px-8 lg:px-12 flex-shrink-0">
                  {activeTab !== 'dashboard' && (
                    <h1 className="text-2xl font-bold text-slate-900">
                      {activeTab === 'history' ? 'Histórico de Produção' : 
                       activeTab === 'planner' ? 'Planner Editorial' : 
                       activeTab === 'creatives' ? 'Biblioteca de Mídia' : 
                       activeTab === 'team' ? 'Equipe & Times' : 
                       activeTab === 'channels' ? 'Canais de Distribuição' :
                       activeTab === 'posts' ? 'Gerenciador de Posts' : 
                       activeTab === 'ai-models' ? 'Configuração de IA' : 'Configurações'}
                    </h1>
                  )}
                </div>

                {/* Componente da Aba */}
                <div className="flex-1 p-6 md:p-8 lg:p-12">
                  {activeTab === 'dashboard' && <Dashboard history={history} planner={planner} posts={posts} creatives={creatives} members={team} teams={teamsGroup} onNavigate={setActiveTab} />}
                  {activeTab === 'history' && (
                    <HistoryView 
                      items={history} 
                      onDelete={async id => { 
                        await productionService.delete(id);
                        setHistory(history.filter(i => i.id !== id)); 
                      }} 
                      onClear={async () => {
                        await productionService.clearAll();
                        setHistory([]);
                      }} 
                      onEdit={handleEditFromHistory} 
                    />
                  )}
                  {activeTab === 'planner' && (
                    <Planner 
                      items={planner} 
                      posts={posts} 
                      onSave={handleUpdatePlanner} 
                      onDelete={async id => { await plannerService.delete(id); setPlanner(planner.filter(p => p.id !== id)); }} 
                      onToggle={async id => { 
                        const p = planner.find(x => x.id === id);
                        if (p) {
                          const updated = await plannerService.update(id, { completed: !p.completed });
                          setPlanner(planner.map(x => x.id === id ? updated : x));
                        }
                      }} 
                    />
                  )}
                  {activeTab === 'creatives' && (
                    <Creatives 
                      items={creatives} 
                      plannerItems={planner}
                      posts={posts}
                      historyItems={history}
                      onSave={handleSaveCreative} 
                      onDelete={async id => { await creativeService.delete(id); setCreatives(creatives.filter(c => c.id !== id)); }} 
                      onPostUpdate={(updatedPost) => setPosts(posts.map(p => p.id === updatedPost.id ? updatedPost : p))}
                    />
                  )}
                  {activeTab === 'team' && (
                    <Team 
                      members={team} 
                      groups={teamsGroup} 
                      onSaveMember={async m => { 
                        const ex = team.find(x => x.id === m.id);
                        const saved = ex ? await profileService.update(m.id, m) : await profileService.create(m);
                        setTeam(ex ? team.map(x => x.id === m.id ? saved : x) : [...team, saved]); 
                      }} 
                      onDeleteMember={async id => { await profileService.delete(id); setTeam(team.filter(m => m.id !== id)); }}
                      onSaveGroup={async g => { 
                        const ex = teamsGroup.find(x => x.id === g.id);
                        const saved = ex 
                          ? await teamService.update(g.id, g) 
                          : await teamService.create(g, session.user.id); // Passando o ID do criador
                        
                        // Após criar o time, recarrega membros para ver o vínculo automático
                        if (!ex) {
                          const membersData = await profileService.getAll();
                          setTeam(membersData);
                        }
                        
                        setTeamsGroup(ex ? teamsGroup.map(x => x.id === g.id ? saved : x) : [...teamsGroup, saved]); 
                      }}
                      onDeleteGroup={async id => { 
                        try {
                          await teamService.delete(id); 
                          setTeamsGroup(prev => prev.filter(g => g.id !== id));
                        } catch (err) {
                          console.error("Falha ao excluir time:", err);
                          alert("Não foi possível excluir o time no banco de dados.");
                        }
                      }}
                    />
                  )}
                  {activeTab === 'channels' && (
                    <Channels 
                      accounts={channels}
                      onSave={async acc => { 
                        const saved = await channelService.save(acc);
                        const ex = channels.find(x => x.id === acc.id);
                        setChannels(ex ? channels.map(x => x.id === acc.id ? saved : x) : [...channels, saved]); 
                      }}
                      onDelete={async id => { await channelService.delete(id); setChannels(channels.filter(c => c.id !== id)); }}
                    />
                  )}
                  {activeTab === 'posts' && (
                    <Posts 
                      posts={posts} 
                      historyItems={history} 
                      plannerItems={planner} 
                      creativeItems={creatives} 
                      teamMembers={team} 
                      blogCategories={blogCategories}
                      onSave={handleSavePost} 
                      onDelete={async id => { await postService.delete(id); setPosts(posts.filter(p => p.id !== id)); }} 
                    />
                  )}
                  {activeTab === 'settings' && <Settings onLogout={handleLogout} />}
                  {activeTab === 'ai-models' && <Settings onLogout={handleLogout} initialTab="modelos-ia" hideTabs={true} />}
                </div>

                <Footer />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
