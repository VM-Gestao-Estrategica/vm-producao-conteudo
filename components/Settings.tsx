
import React, { useState, useEffect } from 'react';
import { User, Shield, Eye, EyeOff, Save, LogOut, Trash2, AlertTriangle, Check, Lock, Mail, Users, CheckCircle2, Circle, Edit3, X, KeyRound, MoreVertical, Phone, Image as ImageIcon, UserCircle, Plus, Layout, Settings as SettingsIcon, Cpu, Brain, Zap, ChevronRight, Sliders, MessageSquareText, Loader2, MessageSquare } from 'lucide-react';
import { UserRole, RolePermissions, AiModel, INITIAL_AI_MODELS, DEFAULT_AI_INSTRUCTION } from '../types';
import { aiModelService } from '../services/aiModelService';

interface SettingsProps {
  onLogout: () => void;
  initialTab?: 'perfil' | 'seguranca' | 'permissoes' | 'modelos-ia';
  hideTabs?: boolean;
}

const INITIAL_PERMISSIONS: RolePermissions[] = [
  { role: 'ADM' as UserRole, canView: true, canEdit: true, canCreate: true, canDelete: true, accessiblePages: ['dashboard', 'generator', 'history', 'planner', 'creatives', 'team', 'posts', 'channels', 'settings'] },
  { role: 'Supervisor' as UserRole, canView: true, canEdit: true, canCreate: true, canDelete: false, accessiblePages: ['dashboard', 'generator', 'history', 'planner', 'creatives'] },
  { role: 'Colaborador' as UserRole, canView: true, canEdit: true, canCreate: true, canDelete: false, accessiblePages: ['generator', 'planner', 'creatives'] },
  { role: 'Cliente' as UserRole, canView: true, canEdit: false, canCreate: false, canDelete: false, accessiblePages: ['dashboard', 'history'] },
];

const PAGES = ['dashboard', 'generator', 'history', 'planner', 'creatives', 'team', 'posts', 'settings'];

const Settings: React.FC<SettingsProps> = ({ onLogout, initialTab, hideTabs }) => {
  const [activeTab, setActiveTab] = useState<'perfil' | 'seguranca' | 'permissoes' | 'modelos-ia'>(initialTab || 'perfil');
  const [showPassword, setShowPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados de Gerenciamento de Permissões
  const [permissions, setPermissions] = useState<RolePermissions[]>(INITIAL_PERMISSIONS);
  const [showPermDrawer, setShowPermDrawer] = useState(false);
  const [editingPerm, setEditingPerm] = useState<RolePermissions | null>(null);
  const [viewingPerm, setViewingPerm] = useState<RolePermissions | null>(null);
  const [deletingPermRole, setDeletingPermRole] = useState<string | null>(null);
  const [menuPermOpenId, setMenuPermOpenId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  // Estados de Modelos de IA
  const [aiModels, setAiModels] = useState<AiModel[]>([]);
  const [showModelDrawer, setShowModelDrawer] = useState(false);
  const [viewingModel, setViewingModel] = useState<AiModel | null>(null);
  const [editingModel, setEditingModel] = useState<AiModel | null>(null);
  const [deletingModelId, setDeletingModelId] = useState<string | null>(null);
  const [menuModelOpenId, setMenuModelOpenId] = useState<string | null>(null);
  const [modelForm, setModelForm] = useState<Omit<AiModel, 'id'>>({
    name: '',
    modelId: '',
    provider: 'Google',
    temperature: 0.7,
    systemInstruction: DEFAULT_AI_INSTRUCTION,
    status: 'Ativo',
    isDefault: false
  });

  // Carregar Modelos de IA do Supabase
  useEffect(() => {
    if (activeTab === 'modelos-ia') {
      loadAiModels();
    }
  }, [activeTab]);

  const loadAiModels = async () => {
    setIsLoading(true);
    try {
      const models = await aiModelService.getAll();
      setAiModels(models);
    } catch (error) {
      console.error("Erro ao carregar modelos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Estados de edição de Perfil/Segurança
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  
  const [menuProfileOpen, setMenuProfileOpen] = useState(false);
  const [menuEmailOpen, setMenuEmailOpen] = useState(false);
  const [menuPasswordOpen, setMenuPasswordOpen] = useState(false);
  
  const [userForm, setUserForm] = useState({
    name: 'Administrador VM Gestão Estratégica',
    whatsapp: '(41) 99999-9999',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    email: 'contato@vmgestao.com.br',
    password: '',
    confirmPassword: '',
    role: 'ADM' as UserRole
  });

  const [permForm, setPermForm] = useState<RolePermissions>({
    role: '' as UserRole,
    canView: false,
    canEdit: false,
    canCreate: false,
    canDelete: false,
    accessiblePages: []
  });

  const formatWhatsApp = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\={11})/, '')
        .replace(/^(\d{2})(\d)/g, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
    }
    return value;
  };

  const handleOpenMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX - 160
    });
    if (activeTab === 'permissoes') setMenuPermOpenId(id);
    else if (activeTab === 'modelos-ia') setMenuModelOpenId(id);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditingProfile) return;
    alert('Perfil atualizado com sucesso!');
    setIsEditingProfile(false);
  };

  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditingEmail) return;
    alert('Email atualizado com sucesso!');
    setIsEditingEmail(false);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditingPassword) return;
    if (userForm.password !== userForm.confirmPassword) {
      alert('As senhas não coincidem!');
      return;
    }
    alert('Senha alterada com sucesso!');
    setIsEditingPassword(false);
    setUserForm(prev => ({ ...prev, password: '', confirmPassword: '' }));
  };

  const handleDeleteAccount = () => {
    alert('Sua solicitação de exclusão foi enviada. A conta será desativada em 30 dias.');
    setShowDeleteConfirm(false);
    onLogout();
  };

  const openPermDrawer = (perm?: RolePermissions) => {
    if (perm) {
      setEditingPerm(perm);
      setPermForm(perm);
    } else {
      setEditingPerm(null);
      setPermForm({
        role: '' as UserRole,
        canView: true,
        canEdit: false,
        canCreate: false,
        canDelete: false,
        accessiblePages: []
      });
    }
    setShowPermDrawer(true);
  };

  const handleSavePerm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!permForm.role) return;
    if (editingPerm) {
      setPermissions(prev => prev.map(p => p.role === editingPerm.role ? permForm : p));
    } else {
      setPermissions(prev => [...prev, permForm]);
    }
    setShowPermDrawer(false);
    setEditingPerm(null);
  };

  const handleDeletePerm = () => {
    if (deletingPermRole) {
      setPermissions(prev => prev.filter(p => p.role !== deletingPermRole));
      setDeletingPermRole(null);
    }
  };

  const togglePageAccess = (page: string) => {
    const next = permForm.accessiblePages.includes(page)
      ? permForm.accessiblePages.filter(p => p !== page)
      : [...permForm.accessiblePages, page];
    setPermForm({ ...permForm, accessiblePages: next });
  };

  const openModelDrawer = (model?: AiModel) => {
    if (model) {
      setEditingModel(model);
      setModelForm({
        name: model.name,
        modelId: model.modelId,
        provider: model.provider,
        temperature: model.temperature,
        systemInstruction: model.systemInstruction || DEFAULT_AI_INSTRUCTION,
        status: model.status,
        isDefault: model.isDefault
      });
    } else {
      setEditingModel(null);
      setModelForm({
        name: '',
        modelId: '',
        provider: 'Google',
        temperature: 0.7,
        systemInstruction: DEFAULT_AI_INSTRUCTION,
        status: 'Ativo',
        isDefault: aiModels.length === 0
      });
    }
    setShowModelDrawer(true);
  };

  const handleSaveModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelForm.name || !modelForm.modelId || isLoading) return;

    setIsLoading(true);
    try {
      if (editingModel) {
        const updated = await aiModelService.update(editingModel.id, modelForm);
        if (modelForm.isDefault) {
          await aiModelService.setAsDefault(editingModel.id);
          await loadAiModels();
        } else {
          setAiModels(prev => prev.map(m => m.id === editingModel.id ? updated : m));
        }
      } else {
        const created = await aiModelService.create(modelForm);
        if (modelForm.isDefault) {
          await aiModelService.setAsDefault(created.id);
          await loadAiModels();
        } else {
          setAiModels(prev => [...prev, created]);
        }
      }
      setShowModelDrawer(false);
    } catch (error) {
      console.error("Erro ao salvar modelo:", error);
      alert("Falha ao salvar motor de IA.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteModel = async () => {
    if (!deletingModelId || isLoading) return;
    setIsLoading(true);
    try {
      await aiModelService.delete(deletingModelId);
      setAiModels(prev => prev.filter(m => m.id !== deletingModelId));
      setDeletingModelId(null);
    } catch (error) {
      console.error("Erro ao deletar modelo:", error);
      alert("Falha ao remover motor de IA.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = (editable: boolean) => `w-full px-4 py-3 rounded-xl border transition-all font-medium outline-none ${
    editable 
      ? "border-blue-200 bg-white focus:ring-2 focus:ring-[#7ba1ee] text-slate-900" 
      : "border-slate-100 bg-slate-50 text-slate-600 cursor-not-allowed shadow-inner"
  }`;

  const primaryButtonClasses = (active: boolean) => `px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md ${
    active 
      ? "bg-[#7ba1ee] text-white hover:bg-[#00152b] cursor-pointer" 
      : "bg-slate-200 text-slate-600 cursor-not-allowed shadow-none"
  }`;

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-10 w-full px-1">
      {!hideTabs && (
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 w-full sm:w-fit shadow-sm overflow-x-auto custom-scrollbar">
          <button onClick={() => setActiveTab('perfil')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'perfil' ? 'bg-[#7ba1ee] text-white shadow-lg' : 'text-slate-700 hover:bg-slate-50'}`}><UserCircle size={18} /> Perfil</button>
          <button onClick={() => setActiveTab('seguranca')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'seguranca' ? 'bg-[#7ba1ee] text-white shadow-lg' : 'text-slate-700 hover:bg-slate-50'}`}><Lock size={18} /> Segurança</button>
          <button onClick={() => setActiveTab('permissoes')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'permissoes' ? 'bg-[#7ba1ee] text-white shadow-lg' : 'text-slate-700 hover:bg-slate-50'}`}><Shield size={18} /> Permissões</button>
          <button onClick={() => setActiveTab('modelos-ia')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'modelos-ia' ? 'bg-[#7ba1ee] text-white shadow-lg' : 'text-slate-700 hover:bg-slate-50'}`}><Cpu size={18} /> Modelos de IA</button>
        </div>
      )}

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'perfil' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2"><User size={20} className="text-[#4c6eb3]" /> Informações do Perfil</h3>
                  <div className="relative">
                    <button onClick={() => setMenuProfileOpen(!menuProfileOpen)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"><MoreVertical size={24} /></button>
                    {menuProfileOpen && (
                      <>
                        <div className="fixed inset-0 z-[100]" onClick={() => setMenuProfileOpen(false)} />
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-[110] py-2 animate-in fade-in zoom-in-95 duration-150">
                          <button onClick={() => { setIsEditingProfile(true); setMenuProfileOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 font-bold"><Edit3 size={16} className="text-[#4c6eb3]" /> Editar Perfil</button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-8 items-start md:items-center mb-4">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-3xl bg-slate-100 border-2 border-slate-200 overflow-hidden shadow-inner">
                        {userForm.avatarUrl ? <img src={userForm.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><UserCircle size={48} /></div>}
                      </div>
                      {isEditingProfile && <div className="absolute -bottom-2 -right-2 bg-[#4c6eb3] text-slate-900 p-1.5 rounded-lg shadow-lg border-2 border-white"><ImageIcon size={14} /></div>}
                    </div>
                    <div className="flex-1 space-y-4 w-full">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-900">Nome de Exibição</label>
                        <input type="text" readOnly={!isEditingProfile} className={inputClasses(isEditingProfile)} value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} placeholder="Seu nome completo" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-900 flex items-center gap-2"><Phone size={14} /> WhatsApp</label>
                      <input type="text" readOnly={!isEditingProfile} className={inputClasses(isEditingProfile)} value={userForm.whatsapp} onChange={e => setUserForm({...userForm, whatsapp: formatWhatsApp(e.target.value)})} placeholder="(00) 00000-0000" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-900 flex items-center gap-2"><ImageIcon size={14} /> URL do Avatar</label>
                      <input type="text" readOnly={!isEditingProfile} className={inputClasses(isEditingProfile)} value={userForm.avatarUrl} onChange={e => setUserForm({...userForm, avatarUrl: e.target.value})} placeholder="https://imagem.com/foto.jpg" />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-4 pt-4">
                    {isEditingProfile && <button type="button" onClick={() => setIsEditingProfile(false)} className="bg-slate-100 text-slate-600 px-8 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center gap-2"><X size={18} /> Cancelar</button>}
                    <button type="submit" disabled={!isEditingProfile} className={primaryButtonClasses(isEditingProfile)}><Save size={18} /> {isEditingProfile ? 'Salvar Alterações' : 'Alterar Perfil'}</button>
                  </div>
                </form>
              </div>
            </div>
            <div className="space-y-8">
              <div className="bg-[#7ba1ee] text-white p-8 rounded-3xl shadow-xl">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6"><Shield size={32} className="text-[#4c6eb3]" /></div>
                <h4 className="text-xl font-bold mb-2">Seu Cargo: {userForm.role}</h4>
                <p className="text-white/60 text-sm leading-relaxed mb-6">Como administrador, você tem controle total sobre o gerador, histórico e planejamento da equipe VM Gestão Estratégica.</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#4c6eb3]"><CheckCircle2 size={14} /> Acesso Completo</div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#4c6eb3]"><CheckCircle2 size={14} /> Gerenciamento de Equipe</div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#4c6eb3]"><CheckCircle2 size={14} /> Backup de Dados</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'seguranca' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Mail size={20} className="text-blue-500" /> Alterar Email</h3>
                  <div className="relative">
                    <button onClick={() => setMenuEmailOpen(!menuEmailOpen)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"><MoreVertical size={24} /></button>
                    {menuEmailOpen && (
                      <>
                        <div className="fixed inset-0 z-[100]" onClick={() => setMenuEmailOpen(false)} />
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-[110] py-2 animate-in fade-in zoom-in-95 duration-150">
                          <button onClick={() => { setIsEditingEmail(true); setMenuEmailOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 font-bold"><Edit3 size={16} className="text-[#4c6eb3]" /> Editar Email</button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <form onSubmit={handleSaveEmail} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-900">Email de Acesso</label>
                    <input type="email" readOnly={!isEditingEmail} className={inputClasses(isEditingEmail)} value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
                  </div>
                  <div className="flex items-center justify-end gap-4">
                    {isEditingEmail && <button type="button" onClick={() => setIsEditingEmail(false)} className="bg-slate-100 text-slate-600 px-8 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center gap-2"><X size={18} /> Cancelar</button>}
                    <button type="submit" disabled={!isEditingEmail} className={primaryButtonClasses(isEditingEmail)}><Save size={18} /> {isEditingEmail ? 'Salvar Novo Email' : 'Alterar Email'}</button>
                  </div>
                </form>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2"><KeyRound size={20} className="text-purple-500" /> Alterar Senha</h3>
                  <div className="relative">
                    <button onClick={() => setMenuPasswordOpen(!menuPasswordOpen)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"><MoreVertical size={24} /></button>
                    {menuPasswordOpen && (
                      <>
                        <div className="fixed inset-0 z-[100]" onClick={() => setMenuPasswordOpen(false)} />
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-[110] py-2 animate-in fade-in zoom-in-95 duration-150">
                          <button onClick={() => { setIsEditingPassword(true); setMenuPasswordOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 font-bold"><Edit3 size={16} className="text-[#4c6eb3]" /> Editar Senha</button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <form onSubmit={handleSavePassword} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-900">Nova Senha</label>
                      <div className="relative">
                        <input type={showPassword ? "text" : "password"} readOnly={!isEditingPassword} className={inputClasses(isEditingPassword)} placeholder={isEditingPassword ? "Digite a nova senha" : "••••••••"} value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
                        {isEditingPassword && <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-900">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-900">Confirmar Senha</label>
                      <div className="relative">
                        <input type={showPassword ? "text" : "password"} readOnly={!isEditingPassword} className={inputClasses(isEditingPassword)} placeholder={isEditingPassword ? "Confirme a nova senha" : "••••••••"} value={userForm.confirmPassword} onChange={e => setUserForm({...userForm, confirmPassword: e.target.value})} />
                        {isEditingPassword && <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-900">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-4">
                    {isEditingPassword && <button type="button" onClick={() => { setIsEditingPassword(false); setUserForm(prev => ({ ...prev, password: '', confirmPassword: '' })); }} className="bg-slate-100 text-slate-600 px-8 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center gap-2"><X size={18} /> Cancelar</button>}
                    <button type="submit" disabled={!isEditingPassword} className={primaryButtonClasses(isEditingPassword)}><Lock size={18} /> {isEditingPassword ? 'Salvar Nova Senha' : 'Alterar Senha'}</button>
                  </div>
                </form>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><AlertTriangle size={20} className="text-red-500" /> Zona de Risco</h3>
                <p className="text-slate-700 text-sm mb-6 leading-relaxed italic">A exclusão da conta é um processo administrativo. Seus dados de histórico e planejamento serão preservados por 30 dias antes da remoção definitiva.</p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={() => setShowDeleteConfirm(true)} className="flex-1 py-4 px-6 rounded-xl border border-red-200 text-red-500 font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2"><Trash2 size={18} /> Excluir minha conta</button>
                  <button onClick={onLogout} className="flex-1 py-4 px-6 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"><LogOut size={18} /> Encerrar sessão</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'permissoes' && (
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm min-h-[450px]">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Users size={24} className="text-blue-500" /> Matriz de Permissões</h3>
                  <p className="text-slate-700 text-sm italic">Defina o que cada nível hierárquico pode realizar no sistema.</p>
                </div>
                <button onClick={() => openPermDrawer()} className="bg-[#7ba1ee] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#00152b] transition-all shadow-md"><Plus size={18} /> Novo Nível</button>
              </div>
              <div className="overflow-x-auto pb-4">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-600">
                      <th className="text-left py-4 px-4 text-xs font-bold uppercase tracking-widest">Nível / Cargo</th>
                      <th className="text-center py-4 px-4 text-xs font-bold uppercase tracking-widest">Visualizar</th>
                      <th className="text-center py-4 px-4 text-xs font-bold uppercase tracking-widest">Criar</th>
                      <th className="text-center py-4 px-4 text-xs font-bold uppercase tracking-widest">Editar</th>
                      <th className="text-center py-4 px-4 text-xs font-bold uppercase tracking-widest">Excluir</th>
                      <th className="text-left py-4 px-4 text-xs font-bold uppercase tracking-widest">Páginas de Acesso</th>
                      <th className="text-center py-4 px-4 text-xs font-bold uppercase tracking-widest">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {permissions.map(perm => (
                      <tr key={perm.role} className="group hover:bg-slate-50 transition-colors">
                        <td className="py-6 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#7ba1ee]/5 text-slate-900 rounded-xl flex items-center justify-center font-bold">{(perm.role as string).charAt(0)}</div>
                            <span className="font-bold text-slate-900">{perm.role}</span>
                          </div>
                        </td>
                        <td className="py-6 px-4 text-center"><div className="flex justify-center">{perm.canView ? <CheckCircle2 size={20} className="text-[#4c6eb3]" /> : <Circle size={20} className="text-slate-200" />}</div></td>
                        <td className="py-6 px-4 text-center"><div className="flex justify-center">{perm.canCreate ? <CheckCircle2 size={20} className="text-[#4c6eb3]" /> : <Circle size={20} className="text-slate-200" />}</div></td>
                        <td className="py-6 px-4 text-center"><div className="flex justify-center">{perm.canEdit ? <CheckCircle2 size={20} className="text-[#4c6eb3]" /> : <Circle size={20} className="text-slate-200" />}</div></td>
                        <td className="py-6 px-4 text-center"><div className="flex justify-center">{perm.canDelete ? <CheckCircle2 size={20} className="text-[#4c6eb3]" /> : <Circle size={20} className="text-slate-200" />}</div></td>
                        <td className="py-6 px-4"><div className="flex flex-wrap gap-1">{perm.accessiblePages.map(page => <span key={page} className="text-[9px] font-bold bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded uppercase">{page}</span>)}</div></td>
                        <td className="py-6 px-4 text-center relative"><button onClick={(e) => handleOpenMenu(e, perm.role as string)} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-600 shadow-sm border border-slate-100"><MoreVertical size={20} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'modelos-ia' && (
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm min-h-[400px]">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Brain size={24} className="text-emerald-500" /> Motores de Inteligência Artificial</h3>
                  <p className="text-slate-700 text-sm italic mt-1">Defina como cada cérebro deve se comportar em suas gerações estratégicas.</p>
                </div>
                <button onClick={() => openModelDrawer()} className="bg-[#7ba1ee] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#00152b] transition-all shadow-md w-full md:w-auto justify-center"><Plus size={18} /> Novo Modelo</button>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="animate-spin text-slate-900" size={40} />
                  <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">Sincronizando com Supabase...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-500">
                  {aiModels.map(model => (
                    <div key={model.id} className={`bg-white rounded-3xl border p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col h-full ${model.status === 'Inativo' ? 'opacity-60' : ''} ${model.isDefault ? 'border-blue-500 ring-2 ring-blue-50' : 'border-slate-100'}`}>
                      {model.isDefault && <div className="absolute top-0 right-0 bg-blue-500 text-white text-[8px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-tighter">PADRÃO</div>}
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border ${model.provider === 'Google' ? 'bg-blue-50 text-blue-500 border-blue-100' : 'bg-slate-50 text-slate-700 border-slate-100'}`}><Cpu size={24} /></div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-slate-900 text-lg leading-tight truncate">{model.name}</h4>
                            <p className="text-slate-600 text-xs font-bold uppercase tracking-widest mt-0.5">{model.provider}</p>
                          </div>
                        </div>
                        <button onClick={(e) => handleOpenMenu(e, model.id)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 flex-shrink-0"><MoreVertical size={20} /></button>
                      </div>
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                           <span className="text-[10px] text-slate-600 font-bold uppercase">Engine ID</span>
                           <span className="text-xs font-mono font-bold text-slate-900">{model.modelId}</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                           <span className="text-[10px] text-slate-600 font-bold uppercase block">Instrução de Comportamento</span>
                           <p className="text-[10px] text-slate-900 font-medium line-clamp-2 italic">"{model.systemInstruction || 'Sem instrução customizada.'}"</p>
                        </div>
                      </div>
                      <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${model.status === 'Ativo' ? 'bg-[#4c6eb3]' : 'bg-slate-300'}`} />
                          <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">{model.status}</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <Sliders size={12} className="text-slate-300" />
                             <span className="text-xs font-bold text-slate-900">{model.temperature.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {aiModels.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                       <Cpu size={48} className="mx-auto text-slate-200 mb-4" />
                       <p className="text-slate-600 font-medium italic">Nenhum motor de IA configurado no banco de dados.</p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-12 p-6 bg-[#7ba1ee] text-white rounded-3xl shadow-xl flex gap-4 overflow-hidden relative group">
                 <div className="absolute -right-4 -bottom-4 text-white/5 group-hover:scale-110 transition-transform duration-700"><Brain size={120} /></div>
                 <div className="p-3 bg-white/10 rounded-2xl shadow-sm text-[#4c6eb3] h-fit relative z-10"><Zap size={24} /></div>
                 <div className="space-y-1 relative z-10">
                    <h4 className="font-bold text-white text-sm">Controle Centralizado</h4>
                    <p className="text-[11px] text-white/60 leading-relaxed font-medium">As configurações acima afetam todas as produções da VM Gestão Estratégica. Utilize as **Instruções de Sistema** para treinar a IA em nichos específicos, como "Estrategista de Marketing Jurídico" ou "Copiador Criativo".</p>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {(menuPermOpenId || menuModelOpenId) && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => { setMenuPermOpenId(null); setMenuModelOpenId(null); }} />
          <div style={{ position: 'fixed', top: `${menuPosition.top}px`, left: `${menuPosition.left}px`, zIndex: 101 }} className="w-48 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 animate-in fade-in zoom-in-95 duration-150 text-left">
            {menuPermOpenId && (
              <>
                <button onClick={() => { setViewingPerm(permissions.find(p => p.role === menuPermOpenId)!); setMenuPermOpenId(null); }} className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 font-bold transition-colors"><Eye size={16} className="text-blue-500" /> Visualizar</button>
                <button onClick={() => { openPermDrawer(permissions.find(p => p.role === menuPermOpenId)!); setMenuPermOpenId(null); }} className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 font-bold transition-colors"><Edit3 size={16} className="text-[#4c6eb3]" /> Editar</button>
                <div className="h-px bg-slate-100 my-1 mx-2" />
                <button onClick={() => { setDeletingPermRole(menuPermOpenId); setMenuPermOpenId(null); }} className="w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-3 font-bold transition-colors"><Trash2 size={16} /> Excluir</button>
              </>
            )}
            {menuModelOpenId && (
              <>
                <button onClick={() => { setViewingModel(aiModels.find(m => m.id === menuModelOpenId)!); setMenuModelOpenId(null); }} className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 font-bold transition-colors"><Eye size={16} className="text-blue-500" /> Visualizar Detalhes</button>
                <button onClick={() => { openModelDrawer(aiModels.find(m => m.id === menuModelOpenId)!); setMenuModelOpenId(null); }} className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 font-bold transition-colors"><Edit3 size={16} className="text-[#4c6eb3]" /> Editar Modelo</button>
                <div className="h-px bg-slate-100 my-1 mx-2" />
                <button onClick={() => { setDeletingModelId(menuModelOpenId); setMenuModelOpenId(null); }} className="w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-3 font-bold transition-colors"><Trash2 size={16} /> Remover</button>
              </>
            )}
          </div>
        </>
      )}

      {/* Visualização de Modelo de IA */}
      {viewingModel && (
        <div className="fixed inset-0 z-[2000]">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setViewingModel(null)} />
          <div className="fixed top-0 right-0 h-full w-full md:w-[500px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#7ba1ee] text-white flex-shrink-0">
              <h3 className="font-bold text-xl">Ficha do Motor de IA</h3>
              <button onClick={() => setViewingModel(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="flex-1 p-8 space-y-10 overflow-y-auto bg-slate-50/20 h-full">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`w-28 h-28 rounded-[2rem] flex items-center justify-center text-white shadow-2xl border-4 border-white ${viewingModel.provider === 'Google' ? 'bg-blue-600' : 'bg-slate-800'}`}>
                  <Cpu size={56} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{viewingModel.name}</h2>
                  <p className="text-slate-700 font-bold text-xs uppercase tracking-widest mt-1">{viewingModel.provider} • {viewingModel.modelId}</p>
                </div>
              </div>

              <div className="space-y-4">
                 <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <span className="text-[10px] text-slate-600 uppercase font-black tracking-widest block mb-2">Configurações de Execução</span>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="flex items-center gap-2">
                          <Sliders size={14} className="text-blue-500" />
                          <span className="text-xs font-bold text-slate-900">Temperatura: {viewingModel.temperature}</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-emerald-500" />
                          <span className="text-xs font-bold text-slate-900">Status: {viewingModel.status}</span>
                       </div>
                    </div>
                 </div>
                 <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <span className="text-[10px] text-slate-600 uppercase font-black tracking-widest block mb-3 flex items-center gap-2"><MessageSquare size={14} className="text-slate-900" /> Instrução de Sistema</span>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-inner">
                       <p className="text-xs text-slate-900 font-medium leading-relaxed italic select-text">
                         {viewingModel.systemInstruction || 'Nenhuma instrução de sistema customizada para este motor.'}
                       </p>
                    </div>
                 </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-white">
               <button onClick={() => setViewingModel(null)} className="w-full py-4 rounded-xl font-bold bg-[#7ba1ee] text-white shadow-lg">Fechar Detalhes</button>
            </div>
          </div>
        </div>
      )}

      {showModelDrawer && (
        <div className="fixed inset-0 z-[2000]">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowModelDrawer(false)} />
          <div className="fixed top-0 right-0 h-full w-full md:w-[600px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#7ba1ee] text-white flex-shrink-0">
              <h3 className="font-bold text-xl">{editingModel ? 'Editar Modelo de IA' : 'Configurar Novo Modelo'}</h3>
              <button onClick={() => setShowModelDrawer(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleSaveModel} className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/20 h-full">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900 flex items-center gap-2"><Cpu size={16} className="text-blue-500" /> Nome do Modelo</label>
                  <input required className={inputClasses(true)} placeholder="Ex: Especialista Imobiliário" value={modelForm.name} onChange={e => setModelForm({...modelForm, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900 flex items-center gap-2"><Zap size={16} className="text-amber-500" /> Engine ID (Ex: gemini-3-pro-preview)</label>
                  <input required className={inputClasses(true)} placeholder="gemini-3-pro-preview" value={modelIdMapping(modelForm.modelId)} onChange={e => setModelForm({...modelForm, modelId: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900 flex items-center gap-2"><MessageSquareText size={16} className="text-blue-500" /> Instrução de Sistema (Opcional)</label>
                  <textarea rows={6} className={`${inputClasses(true)} resize-none text-xs leading-relaxed italic`} placeholder="Defina como o modelo deve agir..." value={modelForm.systemInstruction} onChange={e => setModelForm({...modelForm, systemInstruction: e.target.value})} />
                  <p className="text-[10px] text-slate-600 font-medium">Isso define a personalidade básica da IA antes das suas instruções específicas.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-900">Provedor</label>
                    <select className={inputClasses(true)} value={modelForm.provider} onChange={e => setModelForm({...modelForm, provider: e.target.value as any})}><option value="Google">Google (Gemini)</option><option value="OpenAI">OpenAI (GPT)</option><option value="Anthropic">Anthropic (Claude)</option></select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-900 flex items-center justify-between">Temperatura <span>{modelForm.temperature}</span></label>
                    <div className="pt-2">
                       <input type="range" min="0" max="1" step="0.1" className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#7ba1ee]" value={modelForm.temperature} onChange={e => setModelForm({...modelForm, temperature: parseFloat(e.target.value)})} />
                       <div className="flex justify-between text-[8px] font-black text-slate-600 mt-2 uppercase tracking-tighter"><span>Preciso</span><span>Equilibrado</span><span>Criativo</span></div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 pt-4">
                   <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                      <div><p className="text-sm font-bold text-slate-900">Modelo Padrão</p><p className="text-[10px] text-slate-600">Usar este como o motor inicial do gerador.</p></div>
                      <button type="button" onClick={() => setModelForm({...modelForm, isDefault: !modelForm.isDefault})} className={`w-12 h-6 rounded-full transition-all relative ${modelForm.isDefault ? 'bg-[#4c6eb3]' : 'bg-slate-200'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${modelForm.isDefault ? 'left-7' : 'left-1'}`} /></button>
                   </div>
                   <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                      <div><p className="text-sm font-bold text-slate-900">Status</p><p className="text-[10px] text-slate-600">Disponibilidade no seletor do gerador.</p></div>
                      <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button type="button" onClick={() => setModelForm({...modelForm, status: 'Ativo'})} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${modelForm.status === 'Ativo' ? 'bg-[#7ba1ee] text-white shadow-md' : 'text-slate-50'}`}>Ativo</button>
                        <button type="button" onClick={() => setModelForm({...modelForm, status: 'Inativo'})} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${modelForm.status === 'Inativo' ? 'bg-white text-red-500 shadow-md' : 'text-slate-700'}`}>Inativo</button>
                      </div>
                   </div>
                </div>
              </div>
            </form>
            <div className="p-6 border-t border-slate-100 bg-white flex gap-4 shadow-2xl flex-shrink-0">
              <button type="button" onClick={() => setShowModelDrawer(false)} className="flex-1 py-4 rounded-xl font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all">Cancelar</button>
              <button onClick={handleSaveModel} disabled={isLoading} className="flex-[2] bg-[#7ba1ee] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#00152b] transition-all shadow-lg">
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                {editingModel ? 'Atualizar Engine' : 'Salvar e Ativar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[3000]">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowDeleteConfirm(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><Trash2 size={32} /></div>
            <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Deseja excluir sua conta?</h3>
            <p className="text-slate-700 text-center mb-8">Esta ação removerá seu acesso pessoal. Todo o conteúdo gerado pela VM Gestão Estratégica permanecerá nos arquivos da empresa.</p>
            <div className="flex gap-4"><button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors">Cancelar</button><button onClick={handleDeleteAccount} className="flex-1 py-3 px-4 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors">Confirmar Exclusão</button></div>
          </div>
        </div>
      )}

      {deletingPermRole && (
        <div className="fixed inset-0 z-[3000]">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setDeletingPermRole(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle size={32} /></div>
            <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Excluir Nível de Acesso?</h3>
            <p className="text-slate-700 text-center mb-8">Tem certeza que deseja remover o nível "{deletingPermRole}"? Membros associados a este cargo podem perder o acesso imediatamente.</p>
            <div className="flex gap-4"><button onClick={() => setDeletingPermRole(null)} className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors">Cancelar</button><button onClick={handleDeletePerm} className="flex-1 py-3 px-4 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors">Confirmar Exclusão</button></div>
          </div>
        </div>
      )}

      {deletingModelId && (
        <div className="fixed inset-0 z-[3000]">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setDeletingModelId(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle size={32} /></div>
            <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Remover Modelo de IA?</h3>
            <p className="text-slate-700 text-center mb-8">Esta ação removerá as configurações de engine do banco de dados. O sistema não poderá utilizar este modelo até que seja reconfigurado.</p>
            <div className="flex gap-4"><button onClick={() => setDeletingModelId(null)} className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors">Cancelar</button><button onClick={handleDeleteModel} disabled={isLoading} className="flex-1 py-3 px-4 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors">Remover Engine</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

// Auxiliar para exibição amigável dos modelos fornecidos
const modelIdMapping = (id: string) => {
    return id;
};

export default Settings;
