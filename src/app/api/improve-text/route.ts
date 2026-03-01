import { NextResponse } from 'next/server';
import { mainGroqSuporte } from '../../../backend/service/groqSuporte';
import * as path from 'node:path';

export async function POST(request: Request) {
  try {
    const { fieldName, text, clientId } = await request.json();

    if (!fieldName || !text || !clientId) {
      return NextResponse.json({ error: 'fieldName, text and clientId are required' }, { status: 400 });
    }

    const prompt = `Melhore o texto para o campo "${fieldName}": "${text}". Faça-o mais coerente, relevante e profissional para este campo específico. Mantenha o sentido original, mas otimize para clareza e impacto.

IMPORTANTE: Responda APENAS com o texto melhorado, sem qualquer explicação, raciocínio, tags ou texto adicional. Apenas o texto final otimizado.`;

    const clientePath = path.join(process.cwd(), 'clientes', clientId.split('/').pop() || clientId);
    let improvedText = await mainGroqSuporte({
      currentMessage: prompt,
      __dirname: clientePath,
    });

    // Limpar qualquer raciocínio ou tags
    improvedText = improvedText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    // Se ainda tiver texto longo com quebras, pegar apenas a última linha ou o texto após o raciocínio
    const lines = improvedText.split('\n').filter(line => line.trim() && !line.includes('think') && !line.startsWith('Okay') && !line.startsWith('First'));
    improvedText = lines.join('\n').trim();

    if (!improvedText) improvedText = text; // Fallback

    return NextResponse.json({ improvedText });
  } catch (error) {
    console.error('Erro ao melhorar texto:', error);
    return NextResponse.json({ error: 'Falha ao melhorar texto' }, { status: 500 });
  }
}