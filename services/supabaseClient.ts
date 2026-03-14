
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Erro: Credenciais do Supabase não encontradas no arquivo .env");
}

/**
 * Cliente do Supabase configurado para persistência.
 * autoRefreshToken: true garante que o Supabase renove o token de acesso 
 * antes que ele expire usando o Refresh Token.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  }
});

/**
 * Gera um UUID v4 válido no lado do cliente
 */
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Funcao utilitaria para chamadas Fetch ao Supabase fixada no schema 'marketing'
 */
export const supabaseFetch = async (endpoint: string, options: RequestInit = {}) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || SUPABASE_ANON_KEY;
  
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;

  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Accept-Profile': 'marketing',
    'Content-Profile': 'marketing',
    'X-Schema': 'marketing',
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = `Erro no Supabase (${endpoint}): ${response.status} - ${JSON.stringify(errorData)}`;
      throw new Error(errorMsg);
    }

    if (response.status === 204) return null;

    return response.json();
  } catch (err: any) {
    console.error("Fetch Exception:", err);
    throw err;
  }
};
