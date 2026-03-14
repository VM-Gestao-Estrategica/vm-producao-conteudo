
export type ContentFormat = 'Post' | 'Stories' | 'Carrossel' | 'Reels' | 'Blog' | 'Vídeo' | 'Shorts' | 'Mult Canais';
export type ContentGoal = 'Engajamento' | 'Autoridade' | 'Vendas' | 'Educação';
export type Tone = 'Formal' | 'Humano' | 'Persuasivo' | 'Descontraído' | 'Técnico' | 'Conversa';
export type DistributionChannel = 'Instagram' | 'Facebook' | 'LinkedIn' | 'YouTube' | 'TikTok' | 'Blog' | 'Google Business';

export interface GenerationConfig {
  url: string;
  format: ContentFormat;
  goal: ContentGoal;
  tone: Tone;
  plannerItemId?: string;
  creativeIds?: string[];
  platform?: DistributionChannel;
}

export interface GeneratedContent {
  platform?: DistributionChannel;
  title: string;
  body: string;
  summary?: string;
  imageSuggestion?: string;
  hashtags: string[];
  tips?: string[];
}

export interface HistoryVersion {
  id: string;
  timestamp: number;
  content: GeneratedContent | GeneratedContent[];
  prompt?: string;
}

export interface HistoryItem {
  id: string;
  title?: string;
  config: GenerationConfig | GenerationConfig[];
  versions: HistoryVersion[];
  lastUpdated: number;
}

export interface PlannerItem {
  id: string;
  theme: string;
  date: string;
  channels: DistributionChannel[];
  format: ContentFormat;
  notes: string;
  completed: boolean;
}

export type CreativeSource = 'Canva' | 'Storage';
export type CreativeMediaType = 'Imagem' | 'Vídeo';

export interface CreativeItem {
  id: string;
  title: string;
  source: CreativeSource;
  mediaType: CreativeMediaType;
  url: string;
  timestamp: number;
  plannerItemId?: string;
  postId?: string;
}

export type UserRole = 'ADM' | 'Supervisor' | 'Colaborador' | 'Cliente';
export type InvitationStatus = 'Aceito' | 'Não Aceito' | 'Aguardando';

export interface RolePermissions {
  role: UserRole;
  canView: boolean;
  canEdit: boolean;
  canCreate: boolean;
  canDelete: boolean;
  accessiblePages: string[];
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'Ativo' | 'Inativo';
  avatar?: string;
  whatsapp?: string;
  invitedTeamId?: string;
  invitation: InvitationStatus;
  userId?: string; // UUID do identity.user_profiles
}

export interface TeamGroup {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
  canView: boolean;
  canEdit: boolean;
  canCreate: boolean;
  canDelete: boolean;
  accessiblePages: string[];
}

export type PostStatus = 'Agendado' | 'Publicado' | 'Em Revisão' | 'Rascunho' | 'Aprovado';

export interface BlogCategory {
  id: string;
  nome: string;
  slug: string;
}

export type BlogPostStatus = 'Rascunho' | 'Publicado';

export interface BlogPost {
  id: string;
  titulo: string;
  resumo?: string;
  conteudo: string;
  autor?: string;
  data_publicacao?: string;
  categoria_id?: string;
  imagem_url?: string;
  tags?: string[];
  slug?: string;
  status?: BlogPostStatus; // Campo virtual para controle de fluxo, não necessariamente no banco se não houver coluna status
}

export interface Post {
  id: string;
  historyId: string;
  contentIndex?: number;
  plannerId?: string;
  channels: DistributionChannel[];
  creativeIds: string[];
  status: PostStatus;
  authorId: string;
  timestamp: number;
  scheduledDate?: string;
  categoryId?: string;
}

export interface ChannelAccount {
  id: string;
  platform: DistributionChannel;
  username: string;
  password?: string;
  status: 'Ativo' | 'Inativo';
  lastUpdated: number;
}

export interface AiContextFile {
  id: string;
  name: string;
  type: string;
  data: string;
  size: number;
}

export interface AiModel {
  id: string;
  name: string;
  modelId: string;
  provider: 'Google' | 'OpenAI' | 'Anthropic';
  temperature: number;
  systemInstruction?: string;
  status: 'Ativo' | 'Inativo';
  isDefault: boolean;
}

export const DEFAULT_AI_INSTRUCTION = `
Atue como um estrategista de mídias sociais sênior. 
Crie conteúdos persuasivos, use gatilhos mentais e forneça sugestões visuais detalhadas.

REGRAS DE FORMATAÇÃO:
- NUNCA use tags HTML (<p>, <br>, etc).
- Use apenas texto puro com quebras de linha DUPLAS (\n\n) para parágrafos.
- Use marcadores '-' para listas.
- Mantenha um visual limpo e profissional, sem blocos de texto gigantes.
`;

export const INITIAL_AI_MODELS: AiModel[] = [
  { id: '1', name: 'Gemini 3 Pro (Padrão)', modelId: 'gemini-3-pro-preview', provider: 'Google', temperature: 0.7, systemInstruction: DEFAULT_AI_INSTRUCTION, status: 'Ativo', isDefault: true },
  { id: '2', name: 'Gemini 3 Flash (Rápido)', modelId: 'gemini-3-flash-preview', provider: 'Google', temperature: 1.0, systemInstruction: DEFAULT_AI_INSTRUCTION, status: 'Ativo', isDefault: false },
];
