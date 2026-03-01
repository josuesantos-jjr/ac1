// src/backend/util/emojiUtils.ts
import fs from 'node:fs';
import path from 'node:path';

export function removeEmojisIfConfigured(clientePath: string, message: string): string {
  try {
    const configPath = path.join(clientePath, 'config', 'infoCliente.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    if (config.REMOVER_EMOJIS === 'sim') {
      return removeEmojis(message);
    }
  } catch (error) {
    console.error('Erro ao ler configuração de emojis:', error);
  }

  return message;
}

function removeEmojis(text: string): string {
  return text.replace(/[\u{1F600}-\u{1F64F}]/gu, ``) // Emoticons
             .replace(/[\u{1F300}-\u{1F5FF}]/gu, ``) // Símbolos e pictogramas
             .replace(/[\u{1F680}-\u{1F6FF}]/gu, ``) // Transporte e símbolos de mapa
             .replace(/[\u{1F700}-\u{1F77F}]/gu, ``) // Símbolos alfanuméricos
             .replace(/[\u{1F780}-\u{1F7FF}]/gu, ``) // Símbolos geométricos
             .replace(/[\u{1F800}-\u{1F8FF}]/gu, ``) // Símbolos suplementares
             .replace(/[\u{1F900}-\u{1F9FF}]/gu, ``) // Símbolos e pictogramas suplementares
             .replace(/[\u{1FA00}-\u{1FA6F}]/gu, ``) // Símbolos adicionais
             .replace(/[\u{1FA70}-\u{1FAFF}]/gu, ``) // Símbolos adicionais
             .replace(/[\u{2600}-\u{26FF}]/gu, ``)   // Diversos símbolos e pictogramas
             .replace(/[\u{2700}-\u{27BF}]/gu, ``);  // Dingbats
}