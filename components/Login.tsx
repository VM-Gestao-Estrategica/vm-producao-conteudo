
import React, { useState } from 'react';
import { Mail, Lock, LogIn, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { authService } from '../services/authService';

interface LoginProps {
    onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [mode, setMode] = useState<'login' | 'forgot' | 'sent'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === 'login') {
                await authService.signIn(email, password);
                onLoginSuccess();
            } else {
                await authService.resetPasswordForEmail(email);
                setMode('sent');
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao processar solicitação. Verifique os dados.');
        } finally {
            setLoading(false);
        }
    };

    if (mode === 'sent') {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] p-6 relative overflow-hidden">
                <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-2xl text-center space-y-6 relative z-10 border border-white/50">
                    <div className="flex justify-center">
                        <div className="bg-blue-50 text-[#7ba1ee] p-4 rounded-full">
                            <Mail size={48} />
                        </div>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900">E-mail Enviado!</h2>
                    <p className="text-slate-600 font-medium italic">Enviamos um link de recuperação para <span className="text-slate-900 font-bold">{email}</span>. Verifique sua caixa de entrada e spam.</p>
                    <button 
                        onClick={() => setMode('login')}
                        className="w-full py-4 text-slate-900 font-bold uppercase tracking-widest text-xs hover:underline"
                    >
                        Voltar para o Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] p-6 relative overflow-y-auto py-12">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#7ba1ee]/5 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#4c6eb3]/5 rounded-full blur-[120px] animate-pulse" />

            <div className="w-full max-w-md relative z-10">
                <div className="bg-white/70 backdrop-blur-2xl p-10 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,31,63,0.1)] border border-white/50">
                    <div className="text-center space-y-4 mb-10">
                        <div className="inline-flex p-1 bg-white rounded-3xl shadow-xl shadow-slate-200/50 mb-2 overflow-hidden">
                            <img 
                                src="apple-touch-icon.png" 
                                alt="VM Logo" 
                                className="w-16 h-16 object-cover"
                            />
                        </div>
                        <div className="flex flex-col items-center">
                            <p className="text-sm text-slate-600 font-bold uppercase tracking-[0.2em] mt-2">
                                {mode === 'login' ? 'Acesso Restrito' : 'Recuperar Senha'}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2 px-1">
                                <Mail size={12} className="text-slate-900" /> E-mail Profissional
                            </label>
                            <div className="relative group">
                                <input
                                    type="email"
                                    required
                                    placeholder="seu@email.com"
                                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-4 focus:ring-[#7ba1ee]/5 focus:border-[#7ba1ee] outline-none text-slate-900 font-medium transition-all placeholder:text-slate-300"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {mode === 'login' && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[10px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                        <Lock size={12} className="text-slate-900" /> Senha de Segurança
                                    </label>
                                    <button 
                                        type="button"
                                        onClick={() => setMode('forgot')}
                                        className="text-[9px] font-bold text-[#7ba1ee] uppercase tracking-tighter hover:underline"
                                    >
                                        Esqueci minha senha
                                    </button>
                                </div>
                                <div className="relative group">
                                    <input
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-4 focus:ring-[#7ba1ee]/5 focus:border-[#7ba1ee] outline-none text-slate-900 font-medium transition-all placeholder:text-slate-300"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-500 font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300 uppercase tracking-tight italic">
                                <ShieldCheck size={16} /> {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-[#7ba1ee] text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-2xl hover:bg-[#00152b] active:scale-[0.98] disabled:opacity-50 shadow-[#7ba1ee]/20 uppercase tracking-widest text-sm"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin text-white" />
                                    {mode === 'login' ? 'Autenticando...' : 'Enviando...'}
                                </>
                            ) : (
                                <>
                                    {mode === 'login' ? <LogIn size={20} /> : <Sparkles size={20} />}
                                    {mode === 'login' ? 'Entrar na Plataforma' : 'Enviar Link de Recuperação'}
                                </>
                            )}
                        </button>

                        {mode === 'forgot' && (
                            <button 
                                type="button"
                                onClick={() => setMode('login')}
                                className="w-full py-2 text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:text-slate-900 transition-colors"
                            >
                                Voltar para o Login
                            </button>
                        )}
                    </form>

                    <div className="mt-12 text-center">
                        <p className="text-[10px] text-slate-600 font-medium uppercase tracking-[0.1em]">
                            VM Gestão Estratégica &copy; 2026
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
