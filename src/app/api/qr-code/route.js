import { NextResponse } from 'next/server';
import { readFile, access } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const checkOnly = searchParams.get('checkOnly') === 'true';

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const clientName = clientId;
    console.log(`[QR Code API] ClientId: ${clientId}, ClientName: ${clientName}`);
    
    const qrCodePath = path.join(
      process.cwd(),
      'clientes',
      clientName,
      'config',
      'qrcode',
      'qrcode.png'
    );
    
    console.log(`[QR Code API] Looking for QR code at: ${qrCodePath}`);
    console.log(`[QR Code API] File exists: ${existsSync(qrCodePath)}`);

    try {
      // Check if file exists
      await access(qrCodePath);

      if (checkOnly) {
        console.log(`[QR Code API] File found for ${clientId}, returning exists: true`);
        return NextResponse.json({ exists: true });
      }

      console.log(`[QR Code API] Reading file for ${clientId}`);
      const imageBuffer = await readFile(qrCodePath);
      const headers = new Headers();
      headers.set('Content-Type', 'image/png');
      headers.set('Cache-Control', 'no-cache, no-store');

      return new NextResponse(imageBuffer, {
        status: 200,
        headers,
      });
    } catch (error) {
      console.log(`[QR Code API] File not found for ${clientId}:`, error.message);
      // If checkOnly, return exists: false
      if (checkOnly) {
        return NextResponse.json({ exists: false });
      }
      // If file doesn't exist, return 404
      return NextResponse.json({ error: 'QR Code not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error serving QR code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
