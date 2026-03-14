import { supabaseFetch } from './supabaseClient';
import { BlogCategory } from '../types';

export const blogCategoryService = {
  async getAll(): Promise<BlogCategory[]> {
    const data = await supabaseFetch('blog_categorias?select=*&order=nome.asc', {
      headers: {
        'Accept-Profile': 'public',
        'Content-Profile': 'public',
        'X-Schema': 'public'
      }
    });
    if (!data || !Array.isArray(data)) return [];
    
    return data.map((c: any) => ({
      id: c.id,
      nome: c.nome,
      slug: c.slug
    }));
  }
};
