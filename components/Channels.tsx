import React, { useState, useEffect } from 'react';
import { ChannelAccount, DistributionChannel } from '../types';
import { generateUUID } from '../services/supabaseClient';
import { 
  Plus, Search, MoreVertical, Edit2, Trash2, X, Save, Eye, EyeOff, Globe, 
  Shield, Lock, User, AlertTriangle, CheckCircle2, Circle, Instagram, 
  Facebook, Linkedin, Youtube, Music2, Store, Loader2 
} from 'lucide-react';

interface ChannelsProps {
  accounts: ChannelAccount[];
  onSave: (account: ChannelAccount) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const PLATFORMS: DistributionChannel[] = ['Instagram', 'Facebook', 'LinkedIn', 'YouTube', 'TikTok', 'Blog', 'Google Business'];

const PlatformIcon = ({ platform, size = 20 }: { platform: DistributionChannel; size?: number }) => {
  switch (platform) {
    case 'Instagram': return <Instagram size={size} />;
    case 'Facebook': return <Facebook size={size} />;
    case 'LinkedIn': return <Linkedin size={size} />;
    case 'YouTube': return <Youtube size={size} />;
    case 'TikTok': return <Music2 size={size} />;
    case 'Google Business': return <Store size={size} />;
    default: return <Globe size={size} />;
  }
};

const Channels: React.FC<ChannelsProps> = ({ accounts, onSave, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ChannelAccount | null>(null);
  const [viewingAccount, setViewingAccount] = useState<ChannelAccount | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const [form, setForm] = useState({
    platform: 'Instagram' as DistributionChannel,
    username: '',
    password: '',
    status: 'Ativo' as 'Ativo' | 'Inativo'
  });

  useEffect(() => {
    if (editingAccount) {
      setForm({
        platform: editingAccount.platform,
        username: editingAccount.username,
        password: editingAccount.password || '',
        status: editingAccount.status
      });
      setShowDrawer(true);
    }
  }, [editingAccount]);

  const handleOpenMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + window.scrollY,
      left: rect.right + window.scrollX - 192
    });
    setMenuOpenId(id);
  };

  const closeDrawer = () => {
    setShowDrawer(false);
    setEditingAccount(null);
    setShowPassword(false);
    setIsSaving(false);
    setForm({ platform: 'Instagram', username: '', password: '', status: 'Ativo' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || isSaving) return;

    setIsSaving(true);
    try {
      await onSave({
        id: editingAccount ? editingAccount.id : generateUUID(),
        ...form,
        lastUpdated: Date.now()
      });
      closeDrawer();
    } catch (error) {
      console.error("Erro ao salvar canal no Supabase:", error);
      alert("Falha ao salvar credenciais. Verifique sua conexão ou permissões do banco.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredAccounts = accounts.filter(acc => 
    acc.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.platform.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inputClasses = "w-full px-4 py-4 rounded-xl border border-slate-200 bg-[#fafafa] focus:ring-2 focus:ring-[#7ba1ee] focus:bg-white outline-none text-slate-900 font-medium transition-all placeholder:text-slate-600 appearance-none";

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-12 w-full px-4 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Canais de Distribuição</h2>
          <p className="text-slate-700 text-sm">Centralize os acessos das suas redes sociais vinculadas à VM Gestão Estratégica.</p>
        </div>
        <button 
          onClick={() => setShowDrawer(true)}
          className="bg-[#7ba1ee] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#00152b] transition-all shadow-lg w-full sm:w-auto justify-center"
        >
          <Plus size={20} /> Adicionar Canal
        </button>
      </div>

      <div className="relative max-w-md px-2">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600">
          <Search size={20} />
        </div>
        <input 
          type="text"
          placeholder="Pesquisar canal ou usuário..."
          className={`${inputClasses} pl-12 !py-3 text-sm shadow-sm`}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
        {filteredAccounts.length > 0 ? filteredAccounts.map(acc => (
          <div key={acc.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col h-full">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${acc.status === 'Ativo' ? 'bg-[#4c6eb3]' : 'bg-slate-300'}`} />
            
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border ${
                  acc.platform === 'Instagram' ? 'bg-pink-50 text-pink-600 border-pink-100' :
                  acc.platform === 'LinkedIn' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                  acc.platform === 'YouTube' ? 'bg-red-50 text-red-600 border-red-100' :
                  acc.platform === 'Google Business' ? 'bg-blue-50 text-blue-500 border-blue-200' :
                  'bg-slate-50 text-slate-600 border-slate-100'
                }`}>
                  <PlatformIcon platform={acc.platform} size={28} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-lg leading-tight">{acc.platform === 'Google Business' ? 'Google Meu Negócio' : acc.platform}</h4>
                  <p className="text-slate-600 text-xs font-medium truncate max-w-[150px]">{acc.username}</p>
                </div>
              </div>

              <button 
                onClick={(e) => handleOpenMenu(e, acc.id)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
              >
                <MoreVertical size={20} />
              </button>
            </div>

            <div className="mt-auto pt-5 border-t border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${acc.status === 'Ativo' ? 'bg-[#4c6eb3]' : 'bg-slate-300'}`} />
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{acc.status}</span>
              </div>
              <span className="text-[9px] text-slate-300 font-bold uppercase">Sinc: {new Date(acc.lastUpdated).toLocaleDateString()}</span>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-24 text-center bg-white rounded-[2.5rem] border border-slate-200 border-dashed">
            <Globe size={48} className="mx-auto text-slate-200 mb-4" />
            <h3 className="text-slate-600 font-bold">Nenhum canal configurado</h3>
            <p className="text-slate-300 text-sm mt-1">Adicione as credenciais para facilitar o agendamento.</p>
          </div>
        )}
      </div>

      {/* Menu Flutuante de Ações */}
      {menuOpenId && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setMenuOpenId(null)} />
          <div 
            style={{ position: 'fixed', top: `${menuPosition.top}px`, left: `${menuPosition.left}px`, zIndex: 110 }}
            className="w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 animate-in fade-in zoom-in-95 duration-100 text-left"
          >
            <button 
              onClick={() => { setViewingAccount(accounts.find(a => a.id === menuOpenId)!); setMenuOpenId(null); }}
              className="w-full text-left px-5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 font-bold transition-colors"
            >
              <Eye size={16} className="text-blue-500" /> Ver Ficha
            </button>
            <button 
              onClick={() => { setEditingAccount(accounts.find(a => a.id === menuOpenId)!); setMenuOpenId(null); }}
              className="w-full text-left px-5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 font-bold transition-colors"
            >
              <Edit2 size={16} className="text-[#4c6eb3]" /> Editar
            </button>
            <div className="h-px bg-slate-100 my-2 mx-2" />
            <button 
              onClick={() => { setDeletingId(menuOpenId); setMenuOpenId(null); }}
              className="w-full text-left px-5 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-3 font-bold transition-colors"
            >
              <Trash2 size={16} /> Excluir
            </button>
          </div>
        </>
      )}

      {/* Side Drawer Criar / Editar */}
      {showDrawer && (
        <div className="fixed inset-0 z-[2000]">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity" onClick={closeDrawer} />
          <div className="fixed top-0 right-0 h-full w-full md:w-[600px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#7ba1ee] text-white flex-shrink-0">
              <h3 className="font-bold text-xl">{editingAccount ? 'Editar Credenciais' : 'Novo Canal Estratégico'}</h3>
              <button onClick={closeDrawer} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 h-full bg-slate-50/20">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Globe size={16} className="text-blue-500" /> Plataforma de Distribuição
                  </label>
                  <div className="relative">
                    <select 
                      disabled={isSaving}
                      className={inputClasses} 
                      value={form.platform} 
                      onChange={e => setForm({...form, platform: e.target.value as DistributionChannel})}
                    >
                      {PLATFORMS.map(p => <option key={p} value={p}>{p === 'Google Business' ? 'Google Meu Negócio' : p}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
                       <PlatformIcon platform={form.platform} size={18} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <User size={16} className="text-purple-500" /> Nome de Usuário / Email
                  </label>
                  <input 
                    required 
                    disabled={isSaving}
                    className={inputClasses} 
                    placeholder="@perfil ou email@empresa.com.br" 
                    value={form.username} 
                    onChange={e => setForm({...form, username: e.target.value})} 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Lock size={16} className="text-emerald-500" /> Senha (Para referência rápida)
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      disabled={isSaving}
                      className={inputClasses} 
                      placeholder="••••••••" 
                      value={form.password} 
                      onChange={e => setForm({...form, password: e.target.value})} 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-900"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900">Disponibilidade</label>
                  <div className="flex bg-white border border-slate-200 p-1.5 rounded-2xl shadow-inner">
                    <button type="button" disabled={isSaving} onClick={() => setForm({...form, status: 'Ativo'})} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${form.status === 'Ativo' ? 'bg-[#7ba1ee] text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}>ATIVO</button>
                    <button type="button" disabled={isSaving} onClick={() => setForm({...form, status: 'Inativo'})} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${form.status === 'Inativo' ? 'bg-red-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}>INATIVO</button>
                  </div>
                </div>

                <div className="p-5 bg-blue-50 rounded-3xl border border-blue-100 flex gap-4 shadow-sm">
                   <Shield size={24} className="text-blue-500 flex-shrink-0" />
                   <p className="text-[11px] text-blue-700 leading-relaxed font-medium italic">
                     As informações de acesso são criptografadas e utilizadas apenas para fins de registro interno da VM Gestão Estratégica. Nunca compartilhe sua senha mestra.
                   </p>
                </div>
              </div>
            </form>

            <div className="p-6 border-t border-slate-100 bg-white flex gap-4 shadow-2xl">
              <button type="button" disabled={isSaving} onClick={closeDrawer} className="flex-1 py-4 rounded-xl font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all">Descartar</button>
              <button onClick={handleSubmit} disabled={isSaving || !form.username} className="flex-[2] bg-[#7ba1ee] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#00152b] transition-all shadow-lg disabled:opacity-50">
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                {isSaving ? 'Sincronizando...' : (editingAccount ? 'Atualizar no Banco' : 'Salvar no Banco')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visualizar Ficha Detalhada */}
      {viewingAccount && (
        <div className="fixed inset-0 z-[2000]">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setViewingAccount(null)} />
          <div className="fixed top-0 right-0 h-full w-full md:w-[500px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#7ba1ee] text-white">
              <h3 className="font-bold text-xl">Ficha da Conta</h3>
              <button onClick={() => setViewingAccount(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="flex-1 p-8 space-y-10 overflow-y-auto bg-slate-50/20">
              <div className="flex flex-col items-center text-center space-y-4 animate-in slide-in-from-bottom-4">
                <div className={`w-28 h-28 rounded-[2rem] flex items-center justify-center text-white shadow-2xl border-4 border-white ${
                  viewingAccount.platform === 'Instagram' ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600' : 
                  viewingAccount.platform === 'LinkedIn' ? 'bg-blue-700' : 
                  viewingAccount.platform === 'Google Business' ? 'bg-blue-500' :
                  viewingAccount.platform === 'YouTube' ? 'bg-red-600' :
                  'bg-[#7ba1ee]'
                }`}>
                  <PlatformIcon platform={viewingAccount.platform} size={56} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{viewingAccount.platform === 'Google Business' ? 'Google Meu Negócio' : viewingAccount.platform}</h2>
                  <p className="text-slate-700 font-bold text-xs uppercase tracking-widest mt-1">Conta de Distribuição VM Gestão Estratégica</p>
                </div>
              </div>

              <div className="space-y-4">
                 <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-1">
                    <span className="text-[10px] text-slate-600 uppercase font-black tracking-widest block">Login / Usuário</span>
                    <p className="font-bold text-slate-900 text-lg select-all">{viewingAccount.username}</p>
                 </div>
                 <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-1">
                    <span className="text-[10px] text-slate-600 uppercase font-black tracking-widest block">Senha de Acesso</span>
                    <div className="flex items-center justify-between">
                       <p className="font-mono font-bold text-slate-900 text-lg">
                          {showPassword ? (viewingAccount.password || 'Sem senha registrada') : '••••••••••••'}
                       </p>
                       <button onClick={() => setShowPassword(!showPassword)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors">
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                       </button>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      <span className="text-[10px] text-slate-600 uppercase font-black tracking-widest block mb-1">Status</span>
                      <p className={`font-black text-xs ${viewingAccount.status === 'Ativo' ? 'text-emerald-500' : 'text-slate-300'}`}>{viewingAccount.status.toUpperCase()}</p>
                   </div>
                   <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      <span className="text-[10px] text-slate-600 uppercase font-black tracking-widest block mb-1">Atualizado</span>
                      <p className="font-bold text-slate-900 text-xs">{new Date(viewingAccount.lastUpdated).toLocaleDateString()}</p>
                   </div>
                 </div>
              </div>

              <div className="p-6 bg-[#7ba1ee] text-white rounded-[2rem] flex gap-4 shadow-xl relative overflow-hidden group">
                 <div className="absolute -right-4 -bottom-4 text-white/10 group-hover:scale-110 transition-transform duration-700">
                    <Shield size={100} />
                 </div>
                 <div className="p-3 bg-white/10 rounded-2xl shadow-sm text-[#4c6eb3] h-fit relative z-10">
                    <Shield size={24} />
                 </div>
                 <div className="space-y-1 relative z-10">
                    <h4 className="font-bold text-sm">Segurança da Informação</h4>
                    <p className="text-[10px] text-white/60 leading-relaxed font-medium">
                      Esta conta está vinculada aos processos de publicação e automação da empresa. Mantenha os dados atualizados no banco para evitar falhas críticas de execução.
                    </p>
                 </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-white">
               <button onClick={() => setViewingAccount(null)} className="w-full py-4 rounded-xl font-bold bg-[#7ba1ee] text-white hover:bg-[#00152b] shadow-lg transition-all">Fechar Detalhes</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Exclusão */}
      {deletingId && (
        <div className="fixed inset-0 z-[3000]">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setDeletingId(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl animate-in zoom-in duration-200">
             <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle size={32}/></div>
             <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Excluir canal permanentemente?</h3>
             <p className="text-slate-700 text-center mb-8 text-sm italic leading-relaxed">As credenciais serão apagadas do banco de dados e o vínculo estratégico será perdido. Esta ação não pode ser desfeita.</p>
             <div className="flex gap-4">
                <button onClick={() => setDeletingId(null)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
                <button onClick={async () => { 
                  if (deletingId) {
                    await onDelete(deletingId); 
                    setDeletingId(null); 
                  }
                }} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg">Confirmar Exclusão</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Channels;