import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateQRCode(urlCode: string): Promise<string> {
  try {
    // Criar diretório qrcode se não existir
    const qrCodeDir = path.join(__dirname, 'qrcode');
    if (!fs.existsSync(qrCodeDir)) {
      fs.mkdirSync(qrCodeDir, { recursive: true });
    }

    // Nome fixo para o arquivo
    const fileName = `qrcode.png`;
    const filePath = path.join(qrCodeDir, fileName);

    // Verifica se o arquivo já existe e o deleta, se existir
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Arquivo QR Code antigo removido: ${filePath}`);
    }

    // Gerar QR code
    await QRCode.toFile(filePath, urlCode, {
      errorCorrectionLevel: 'H',
      margin: 1,
      scale: 8
    });

    console.log(`QR Code gerado com sucesso: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('Erro ao gerar QR Code:', error);
    throw error;
  }
}
