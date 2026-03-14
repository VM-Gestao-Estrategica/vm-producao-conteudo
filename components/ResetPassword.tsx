
import React, { useState } from 'react';
import { Lock, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { authService } from '../services/authService';

interface ResetPasswordProps {
    onSuccess: () => void;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ onSuccess }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }
        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await authService.updatePassword(password);
            setSuccess(true);
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Erro ao atualizar a senha.');
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] p-6">
                <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-2xl text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="bg-emerald-50 text-emerald-500 p-4 rounded-full">
                            <CheckCircle2 size={48} />
                        </div>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900">Senha Alterada!</h2>
                    <p className="text-slate-600 font-medium">Sua senha foi redefinida com sucesso. Redirecionando para o login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] p-6 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#7ba1ee]/5 rounded-full blur-[120px]" />
            <div className="w-full max-w-md relative z-10">
                <div className="bg-white/70 backdrop-blur-2xl p-10 rounded-[2.5rem] shadow-2xl border border-white/50">
                    <div className="text-center space-y-4 mb-10">
                        <div className="inline-flex p-1 bg-white rounded-2xl shadow-xl mb-2 overflow-hidden">
                            <img 
                                src="https://yihgvuqrdxkeyaitcyie.supabase.co/storage/v1/object/public/identidade-visual/vm-gestao-96x96.jpg" 
                                alt="VM Logo" 
                                className="w-16 h-16 object-cover"
                            />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                            Nova Senha
                        </h1>
                        <p className="text-xs text-slate-600 font-bold uppercase tracking-widest mt-2">Redefina seu acesso</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2 px-1">
                                <Lock size={12} className="text-slate-900" /> Nova Senha
                            </label>
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white focus:ring-4 focus:ring-[#7ba1ee]/5 focus:border-[#7ba1ee] outline-none"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2 px-1">
                                <Lock size={12} className="text-slate-900" /> Confirmar Senha
                            </label>
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white focus:ring-4 focus:ring-[#7ba1ee]/5 focus:border-[#7ba1ee] outline-none"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-500 font-bold flex items-center gap-2 italic">
                                <ShieldCheck size={16} /> {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-[#7ba1ee] text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-2xl hover:bg-[#00152b] active:scale-[0.98] disabled:opacity-50 uppercase tracking-widest text-sm"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Atualizando...
                                </>
                            ) : (
                                "Redefinir Senha"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
