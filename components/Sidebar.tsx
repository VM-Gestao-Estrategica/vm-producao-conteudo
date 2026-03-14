import React from 'react';
import { LayoutDashboard, PenTool, History, Settings, X, ExternalLink, CalendarDays, Palette, Users, Globe, Send, Cpu } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'dashboard' | 'generator' | 'history' | 'planner' | 'creatives' | 'team' | 'posts' | 'channels' | 'settings' | 'ai-models';
  onTabChange: (tab: 'dashboard' | 'generator' | 'history' | 'planner' | 'creatives' | 'team' | 'posts' | 'channels' | 'settings' | 'ai-models') => void;
  onLogout: () => void;
  user?: {
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, activeTab, onTabChange, onLogout, user }) => {
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  const menuItems = [
    { id: 'dashboard' as const, icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'planner' as const, icon: CalendarDays, label: 'Planner' },
    /* 
       Gerador oculto pois estamos usando o "topstacksquad" para gerenciar todo o crud da aplicação.
       { id: 'generator' as const, icon: PenTool, label: 'Gerador' }, 
    */
    { id: 'history' as const, icon: History, label: 'Histórico' },
    { id: 'posts' as const, icon: Send, label: 'Posts' },
    { id: 'creatives' as const, icon: Palette, label: 'Criativos' },
  ];

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário';
  const initials = firstName.substring(0, 2).toUpperCase();
  const avatarUrl = user?.user_metadata?.avatar_url;

  const topstackUrl = "https://topstack.com.br?utm_source=vm_gestao_social_media&utm_medium=software_branding&utm_campaign=dev_by_topstack";

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60] md:hidden" 
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 bottom-0 bg-[#7ba1ee] text-slate-900 w-72 transform transition-all duration-300 ease-in-out z-[70]
        flex flex-col shadow-2xl border-r border-black/5
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="p-5 flex justify-between items-center border-b border-black/5">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <img 
                src="apple-touch-icon.png" 
                alt="VM Gestão" 
                className="w-11 h-11 rounded-xl object-contain bg-white shadow-sm"
              />
              <div className="flex flex-col justify-center -space-y-1">
                <span className="text-lg font-black tracking-tighter text-slate-900 leading-tight">VM Produção</span>
                <span className="text-sm font-bold tracking-tight text-slate-900/70">De conteúdo</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden">
            <X size={24} />
          </button>
        </div>
        
        {/* Adicionado scrollbar-hide para uma estética mais limpa */}
        <nav className="flex-1 mt-4 px-4 space-y-1 overflow-y-auto scrollbar-hide">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                onClose();
              }}
              className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
                activeTab === item.id 
                ? 'bg-white text-slate-900 font-semibold shadow-lg' 
                : 'hover:bg-black/5 text-slate-900/70 hover:text-slate-900'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Seção Inferior: Modelos de IA e Usuário */}
        <div className="px-4 pb-2 mt-auto space-y-1 border-t border-black/5 pt-4">
          <button 
            onClick={() => {
              onTabChange('ai-models');
              onClose();
            }}
            className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
              activeTab === 'ai-models' 
              ? 'bg-white text-slate-900 font-semibold shadow-lg' 
              : 'hover:bg-black/5 text-slate-900/70 hover:text-slate-900'
            }`}
          >
            <Cpu size={20} />
            <span>Modelos de IA</span>
          </button>

          {/* User Session Section */}
          <div className="relative pt-1" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className={`w-full flex items-center justify-between p-1.5 rounded-2xl transition-all hover:bg-black/5 ${userMenuOpen ? 'bg-black/5' : ''}`}
            >
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-sm border border-black/5">
                  {avatarUrl ? (
                    <img src="apple-touch-icon.png" alt="VM Logo" className="w-16 h-16 object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-slate-900">{initials}</span>
                  )}
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-xs font-bold text-slate-900 capitalize">{firstName}</span>
                  <span className="text-[9px] text-slate-900/50 font-medium whitespace-nowrap">Minha Conta</span>
                </div>
              </div>
              <Settings size={14} className={`text-slate-900/40 transition-transform ${userMenuOpen ? 'rotate-90' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white/80 backdrop-blur-xl rounded-2xl p-2 border border-black/5 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200 z-[80]">
                <button
                  onClick={() => {
                    onTabChange('channels');
                    setUserMenuOpen(false);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-900 hover:bg-white transition-all"
                >
                  <Globe size={16} />
                  <span>Canais</span>
                </button>
                <button
                  onClick={() => {
                    onTabChange('team');
                    setUserMenuOpen(false);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-900 hover:bg-white transition-all"
                >
                  <Users size={16} />
                  <span>Equipe</span>
                </button>
                <div className="my-1 border-t border-black/5" />
                <button
                  onClick={() => {
                    onLogout();
                    setUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all"
                >
                  <X size={16} />
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-black/5">
          <a 
            href={topstackUrl}
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] text-slate-900/40 hover:text-slate-900 transition-all italic font-medium flex items-center gap-1 group"
          >
            Tecnologia TOPSTACK
            <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;