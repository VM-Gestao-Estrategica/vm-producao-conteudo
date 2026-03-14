import { supabaseFetch } from './supabaseClient';
import { BlogPost } from '../types';

export const blogPostService = {
    async getAll(): Promise<BlogPost[]> {
        const columns = 'id,titulo,resumo,conteudo,autor,data_publicacao,categoria_id,imagem_url,tags,slug';
        const data = await supabaseFetch(`blog_posts?select=${columns}&deleted_at=is.null&order=data_publicacao.desc.nullslast`, {
            headers: {
                'Accept-Profile': 'public',
                'Content-Profile': 'public',
                'X-Schema': 'public'
            }
        });
        
        if (!data || !Array.isArray(data)) return [];
        
        return data.map((p: any) => ({
            id: p.id,
            titulo: p.titulo,
            resumo: p.resumo,
            conteudo: p.conteudo,
            autor: p.autor,
            data_publicacao: p.data_publicacao,
            categoria_id: p.categoria_id,
            imagem_url: p.imagem_url,
            tags: p.tags || [],
            slug: p.slug,
            status: p.data_publicacao ? 'Publicado' : 'Rascunho'
        }));
    },

    async save(post: Partial<BlogPost>): Promise<BlogPost> {
        const payload: any = {
            id: post.id
        };

        if ('titulo' in post) payload.titulo = post.titulo;
        if ('resumo' in post) payload.resumo = post.resumo;
        if ('conteudo' in post) payload.conteudo = post.conteudo;
        if ('autor' in post) payload.autor = post.autor;
        if ('categoria_id' in post) payload.categoria_id = post.categoria_id || null;
        if ('imagem_url' in post) payload.imagem_url = post.imagem_url;
        if ('tags' in post) payload.tags = post.tags;
        if ('slug' in post) payload.slug = post.slug;

        // Lógica de status
        if (post.status === 'Publicado') {
            // Se já tem data, mantém. Se não, usa agora.
            payload.data_publicacao = post.data_publicacao || new Date().toISOString();
        } else if (post.status === 'Rascunho') {
            payload.data_publicacao = null;
        }

        const columns = 'id,titulo,resumo,conteudo,autor,data_publicacao,categoria_id,imagem_url,tags,slug';
        const result = await supabaseFetch(`blog_posts?select=${columns}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Prefer': 'return=representation,resolution=merge-duplicates',
                'On-Conflict': 'id',
                'Accept-Profile': 'public',
                'Content-Profile': 'public',
                'X-Schema': 'public'
            }
        });

        const data = Array.isArray(result) ? result[0] : result;

        return {
            id: data.id,
            titulo: data.titulo,
            resumo: data.resumo,
            conteudo: data.conteudo,
            autor: data.autor,
            data_publicacao: data.data_publicacao,
            categoria_id: data.categoria_id,
            imagem_url: data.imagem_url,
            tags: data.tags || [],
            slug: data.slug,
            status: data.data_publicacao ? 'Publicado' : 'Rascunho'
        };
    },

    async delete(id: string): Promise<void> {
        await supabaseFetch(`blog_posts?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ deleted_at: new Date().toISOString() }),
            headers: { 
                'Prefer': 'return=representation',
                'Accept-Profile': 'public',
                'Content-Profile': 'public',
                'X-Schema': 'public'
            }
        });
    }
};
