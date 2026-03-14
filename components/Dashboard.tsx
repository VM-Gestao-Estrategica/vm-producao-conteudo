import React, { useState } from 'react';
import { HistoryItem, PlannerItem, TeamMember, TeamGroup, GeneratedContent, Post, CreativeItem } from '../types';

import { FileText, ListTodo, CheckCircle2, TrendingUp, Clock, Users, LayoutGrid, Send, Calendar, ChevronDown, Globe, Palette } from 'lucide-react';

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

interface DashboardProps {
  history: HistoryItem[];
  planner: PlannerItem[];
  posts: Post[];
  creatives?: CreativeItem[];
  members?: TeamMember[];
  teams?: TeamGroup[];
  onNavigate: (tab: 'dashboard' | 'generator' | 'history' | 'planner' | 'creatives' | 'team' | 'posts' | 'settings') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ history, planner, posts, creatives = [], members = [], teams = [], onNavigate }) => {
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isMonthMenuOpen, setIsMonthMenuOpen] = useState(false);
  const [isYearMenuOpen, setIsYearMenuOpen] = useState(false);

  const years = Array.from({ length: 7 }, (_, i) => currentYear - 2 + i);

  const filterByMonth = (dateStrOrNum: string | number) => {
    // Para strings YYYY-MM-DD, adicionamos um horário ao meio-dia para evitar problemas de fuso horário
    const cleanDate = typeof dateStrOrNum === 'string' && dateStrOrNum.includes('-') 
      ? new Date(`${dateStrOrNum}T12:00:00`)
      : new Date(dateStrOrNum);
      
    return cleanDate.getMonth() === selectedMonth && cleanDate.getFullYear() === selectedYear;
  };

  const filteredHistory = history.filter(h => filterByMonth(h.lastUpdated));
  const filteredPlanner = planner.filter(p => filterByMonth(p.date));
  const filteredPosts = posts.filter(p => filterByMonth(p.timestamp));
  const filteredCreatives = creatives.filter(c => filterByMonth(c.timestamp));

  const completedPlanner = filteredPlanner.filter(item => {
    if (item.completed) return true;
    const relevantPosts = posts.filter(p => p.plannerId === item.id);
    return item.channels.every(channel => 
      relevantPosts.some(post => post.channels.includes(channel))
    );
  }).length;
  
  const approvedBlogs = filteredPosts.filter(p => p.channels.includes('Blog') && p.status === 'Aprovado').length;
  
  const stats = [
    { label: 'Planner Mensal', value: `${completedPlanner} / ${filteredPlanner.length}`, icon: ListTodo, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Posts Realizados', value: filteredPosts.length, icon: Send, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Criativos Gerados', value: filteredCreatives.length, icon: Palette, color: 'text-pink-500', bg: 'bg-pink-50' },
    { label: 'Artigos de Blog', value: approvedBlogs, icon: Globe, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  ];

  const getSafeContent = (content: GeneratedContent | GeneratedContent[]): GeneratedContent => {
    return Array.isArray(content) ? content[0] : content;
  };

  const getFormat = (config: any) => {
    return Array.isArray(config) ? config[0]?.format : config?.format;
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-12 w-full px-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <div className="flex items-center gap-2">
          {/* Mês Selector */}
          <div className="relative">
            <button 
              onClick={() => setIsMonthMenuOpen(!isMonthMenuOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
            >
              <Calendar size={18} className="text-[#7ba1ee]" />
              {months[selectedMonth]}
              <ChevronDown size={16} className={`transition-transform ${isMonthMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isMonthMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsMonthMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 py-2 animate-in fade-in zoom-in duration-200">
                  {months.map((month, index) => (
                    <button
                      key={month}
                      onClick={() => {
                        setSelectedMonth(index);
                        setIsMonthMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors ${selectedMonth === index ? 'text-[#7ba1ee] bg-blue-50/50' : 'text-slate-600'}`}
                    >
                      {month}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Ano Selector */}
          <div className="relative">
            <button 
              onClick={() => setIsYearMenuOpen(!isYearMenuOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
            >
              {selectedYear}
              <ChevronDown size={16} className={`transition-transform ${isYearMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isYearMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsYearMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-28 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 py-2 animate-in fade-in zoom-in duration-200">
                  {years.map((year) => (
                    <button
                      key={year}
                      onClick={() => {
                        setSelectedYear(year);
                        setIsYearMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors ${selectedYear === year ? 'text-[#7ba1ee] bg-blue-50/50' : 'text-slate-600'}`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`${stat.bg} ${stat.color} p-4 rounded-xl`}><stat.icon size={24} /></div>
            <div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-900 flex items-center gap-2"><Clock size={18} className="text-blue-500" /> Últimas Produções</h3>
            <button onClick={() => onNavigate('history')} className="text-xs font-bold text-blue-500 hover:underline uppercase tracking-wider">Ver tudo</button>
          </div>
          <div className="p-4 space-y-2">
            {filteredHistory.slice(0, 5).map((item) => {
              const lastVersion = item.versions[item.versions.length - 1];
              const content = lastVersion ? getSafeContent(lastVersion.content) : null;
              const format = getFormat(item.config);
              
              return (
                <div key={item.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors group border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#7ba1ee] text-white flex items-center justify-center font-bold text-sm uppercase">
                      {(format?.[0]) || 'C'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm line-clamp-1">{item.title || content?.title || 'Sem título'}</p>
                      <p className="text-[10px] font-bold text-slate-600 uppercase">
                        {format} • {new Date(item.lastUpdated).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredHistory.length === 0 && <p className="text-center py-8 text-slate-600 text-xs italic">Nenhuma geração registrada para este mês.</p>}
          </div>
        </div>

        <div className="bg-[#7ba1ee] text-white rounded-3xl shadow-xl p-8 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-8 -bottom-8 text-white/5 group-hover:scale-110 transition-transform duration-700">
            <TrendingUp size={240} />
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
            <div className="flex-1">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#b5cbfa]">Produtividade VM Gestão Estratégica</span>
              <h3 className="text-2xl font-bold mt-2">Acelere sua presença<br/> digital hoje.</h3>
              <p className="text-white/80 text-sm mt-4 leading-relaxed max-w-xs italic">
                "A inteligência artificial transforma links em autoridade, mas o seu time transforma conteúdo em conexão."
              </p>
            </div>

            {/* Velocímetro de Conteúdos Gerados */}
            <div className="flex-shrink-0 flex flex-col items-center bg-white/10 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/20 shadow-2xl">
               <div className="relative w-32 h-16 overflow-hidden">
                  {/* Gauge Background */}
                  <div className="absolute top-0 left-0 w-32 h-32 rounded-full border-[10px] border-white/10" style={{ clipPath: 'inset(0 0 50% 0)' }} />
                  {/* Gauge Active Fill */}
                  <div 
                    className="absolute top-0 left-0 w-32 h-32 rounded-full border-[10px] border-[#4c6eb3]" 
                    style={{ 
                      clipPath: 'inset(0 0 50% 0)',
                      transform: `rotate(${Math.min(filteredHistory.length * 10, 180)}deg)`,
                      transition: 'transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }} 
                  />
                  {/* Needle Center */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full border-2 border-[#4c6eb3] z-20" />
               </div>
               <div className="text-center mt-2">
                  <span className="text-3xl font-black block leading-none">{filteredHistory.length}</span>
                  <span className="text-[10px] font-black uppercase tracking-tighter opacity-60">Produções</span>
               </div>
               <div className="mt-3 text-[8px] font-bold uppercase tracking-widest py-1 px-3 bg-[#4c6eb3] text-white rounded-full">Conteúdos Ativos</div>
            </div>
          </div>

          {/* Conteúdo gerado e gerenciado pelo topstacksquad */}
          <button 
            disabled
            className="mt-8 bg-slate-900/40 text-white/60 py-4 rounded-xl font-bold flex items-center justify-center gap-2 cursor-not-allowed shadow-lg w-full sm:w-fit px-8 relative z-10"
          >
            Geração via topstacksquad
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
