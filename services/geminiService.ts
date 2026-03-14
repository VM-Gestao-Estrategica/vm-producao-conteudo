import { GoogleGenAI, Type } from "@google/genai";
import { GenerationConfig, GeneratedContent, AiContextFile, HistoryVersion, AiModel } from "../types";

export const DEFAULT_PRE_PROMPT = `
Atue como um estrategista de mídias sociais sênior. 
Sua tarefa é criar conteúdos de alta performance baseados em fontes de dados (URL ou arquivos) ou instruções diretas do usuário.
Garanta que o texto seja persuasivo e utilize gatilhos mentais apropriados para o objetivo selecionado.
Para cada conteúdo gerado, você DEVE obrigatoriamente fornecer uma sugestão detalhada de imagem ou elemento visual (foto, design, vídeo) que acompanhe o texto.
Se o formato for 'Carrossel', dívida o conteúdo em slides numerados (Slide 1, Slide 2...).
Se for 'Reels', forneça um roteiro estruturado com [Cena] e [Fala].
Se for 'Stories', sugira uma sequência lógica de quadros.
Mantenha a voz da marca consistente com a linguagem selecionada.
O campo 'title' deve ser um título criativo, chamativo e otimizado para o canal, NUNCA apenas uma repetição das instruções ou do prompt do usuário.
Responda SEMPRE no formato JSON especificado.
Se o formato for 'Blog', você DEVE obrigatoriamente fornecer um 'summary' (resumo) curto e impactante do artigo.
Se houver mais de um canal solicitado, gere versões distintas adaptadas para cada rede social específica.
No campo 'hashtags', forneça uma lista de palavras-chave relevantes SEM o símbolo '#'. Use apenas caracteres alfanuméricos e hifens. NUNCA use símbolos estranhos ou caracteres de outros idiomas.

IMPORTANTE SOBRE FORMATAÇÃO:
1. NUNCA use tags HTML (como <p>, <br>, <b>, <i>, <h3>, etc) no campo 'body' ou em qualquer outro campo de texto.
2. Use apenas texto puro (plain text).
3. Para parágrafos, use OBRIGATORIAMENTE quebras de linha duplas (\n\n).
4. Para listas, use marcadores convencionais como '-' ou '*'.
5. Garanta uma indentação e espaçamento convencional e limpo, facilitando a leitura direta. NUNCA junte parágrafos diferentes em um único bloco de texto.
`;

export const generateSocialContent = async (
  configs: GenerationConfig[],
  modelConfig: AiModel,
  additionalInstructions?: string,
  contextFiles?: AiContextFile[],
  plannerContext?: string,
  history?: HistoryVersion[]
): Promise<{ content: GeneratedContent[]; promptUsed: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Usa a instrução do sistema do modelo ou a padrão se não houver
  const systemInstruction = modelConfig.systemInstruction || DEFAULT_PRE_PROMPT;
  
  const configsText = configs.map(c => `
    CANAL: ${c.platform || 'Geral'}
    - Formato: ${c.format}
    - Objetivo: ${c.goal}
    - Tom de voz: ${c.tone}
  `).join('\n');

  const currentPrompt = `
    DADOS DA FONTE: ${configs[0].url || 'Nenhuma URL fornecida. Use os arquivos e instruções abaixo.'}
    
    ${plannerContext ? `CONTEXTO DO PLANEJAMENTO (PLANNER): ${plannerContext}` : ''}

    SOLICITAÇÕES DE CONTEÚDO POR CANAL:
    ${configsText}

    INSTRUÇÕES DO USUÁRIO PARA ESTA VERSÃO:
    ${additionalInstructions || 'Gere o conteúdo seguindo os parâmetros acima.'}

    IMPORTANTE: O campo 'title' deve ser um título criativo, chamativo e otimizado para o canal, NUNCA apenas uma repetição das instruções ou do prompt do usuário.
    IMPORTANTE: No campo 'hashtags', forneça apenas tags relevantes em português, sem o símbolo '#'. Não use separadores estranhos ou caracteres especiais.
  `;

  const contents: any[] = [];

  if (history && history.length > 0) {
    history.forEach((version) => {
      contents.push({
        role: 'user',
        parts: [{ text: version.prompt || "Geração inicial baseada nos parâmetros." }]
      });
      contents.push({
        role: 'model',
        parts: [{ text: JSON.stringify(version.content) }]
      });
    });
  }

  const currentParts: any[] = [{ text: currentPrompt }];
  
  if (contextFiles && contextFiles.length > 0) {
    contextFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        currentParts.push({
          inlineData: {
            mimeType: file.type,
            data: file.data.split(',')[1]
          }
        });
      } else {
        currentParts.push({ text: `[Arquivo: ${file.name}]` });
      }
    });
  }

  contents.push({
    role: 'user',
    parts: currentParts
  });

  try {
    const response = await ai.models.generateContent({
      model: modelConfig.modelId, 
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: modelConfig.temperature,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              platform: { type: Type.STRING, description: 'O canal para o qual este conteúdo foi gerado' },
              title: { type: Type.STRING, description: 'Título criativo, chamativo e otimizado para o canal. Não repita o prompt ou instruções do usuário.' },
              summary: { type: Type.STRING, description: 'Resumo curto, impactante e otimizado para SEO (obrigatório para Blog)' },
              imageSuggestion: { type: Type.STRING, description: 'Sugestão detalhada de imagem ou visual' },
              body: { type: Type.STRING, description: 'O conteúdo principal formatado' },
              hashtags: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: 'Lista de tags/hashtags sem o símbolo #. Ex: ["marketing", "vendas"]'
              },
              tips: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["platform", "title", "summary", "body", "hashtags", "imageSuggestion"],
          }
        },
      },
    });

    const jsonStr = response.text?.trim() || '[]';
    return {
      content: JSON.parse(jsonStr) as GeneratedContent[],
      promptUsed: currentPrompt
    };
  } catch (error) {
    console.error("Erro na geração Gemini:", error);
    throw new Error("Falha ao gerar conteúdo. Verifique as configurações do modelo de IA selecionado.");
  }
};