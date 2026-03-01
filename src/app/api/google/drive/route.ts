import { NextRequest, NextResponse } from 'next/server';
import { googleSheetsAuth } from '../../../../backend/service/googleSheetsAuth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (!googleSheetsAuth.isAuthenticated()) {
      return NextResponse.json({
        error: 'Usuário não autenticado',
        authenticated: false
      }, { status: 401 });
    }

    const drive = await googleSheetsAuth.getDriveClient();

    if (action === 'list') {
      // Listar pastas do Google Drive
      const parentId = searchParams.get('parentId') || 'root';

      let q = "mimeType='application/vnd.google-apps.folder'";
      if (parentId !== 'root') {
        q += ` and '${parentId}' in parents`;
      } else {
        q += " and 'root' in parents";
      }

      const response = await drive.files.list({
        q: q,
        fields: 'files(id,name,createdTime,modifiedTime,parents)',
        orderBy: 'name asc',
        pageSize: 100
      });

      const folders = response.data.files?.map(file => ({
        id: file.id,
        name: file.name,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        parents: file.parents,
        parentId: parentId
      })) || [];

      return NextResponse.json({
        folders,
        parentId,
        authenticated: true
      });
    }

    if (action === 'list_all') {
      // Listar TODAS as pastas do Google Drive para busca
      const response = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.folder'",
        fields: 'files(id,name,createdTime,modifiedTime,parents)',
        orderBy: 'name asc',
        pageSize: 1000 // Aumentado para busca abrangente
      });

      const folders = response.data.files?.map(file => ({
        id: file.id,
        name: file.name,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        parents: file.parents
      })) || [];

      return NextResponse.json({
        folders,
        total: folders.length,
        authenticated: true
      });
    }

    if (action === 'search') {
      // Buscar pastas por nome
      const query = searchParams.get('q');

      if (!query) {
        return NextResponse.json({
          folders: [],
          authenticated: true
        });
      }

      const response = await drive.files.list({
        q: `mimeType='application/vnd.google-apps.folder' and name contains '${query}'`,
        fields: 'files(id,name,createdTime,modifiedTime,parents)',
        orderBy: 'name asc',
        pageSize: 50
      });

      const folders = response.data.files?.map(file => ({
        id: file.id,
        name: file.name,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        parents: file.parents
      })) || [];

      return NextResponse.json({
        folders,
        query,
        authenticated: true
      });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });

  } catch (error) {
    console.error('Erro na API do Google Drive:', error);
    return NextResponse.json({
      error: 'Erro na API do Google Drive',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, name, parentId } = await request.json();

    if (!googleSheetsAuth.isAuthenticated()) {
      return NextResponse.json({
        error: 'Usuário não autenticado',
        authenticated: false
      }, { status: 401 });
    }

    const drive = await googleSheetsAuth.getDriveClient();

    if (action === 'create_folder') {
      if (!name) {
        return NextResponse.json({
          error: 'Nome da pasta é obrigatório'
        }, { status: 400 });
      }

      // Criar nova pasta
      const folderMetadata = {
        name: name,
        mimeType: 'application/vnd.google-apps.folder',
        ...(parentId && { parents: [parentId] })
      };

      const response = await drive.files.create({
        requestBody: folderMetadata,
        fields: 'id,name,createdTime,modifiedTime'
      });

      return NextResponse.json({
        folder: {
          id: response.data.id,
          name: response.data.name,
          createdTime: response.data.createdTime,
          modifiedTime: response.data.modifiedTime
        },
        authenticated: true
      });
    }

    if (action === 'upload_backup') {
      // Upload de arquivo de backup
      const { fileName, fileContent, folderId } = await request.json();

      if (!fileName || !fileContent || !folderId) {
        return NextResponse.json({
          error: 'Nome do arquivo, conteúdo e ID da pasta são obrigatórios'
        }, { status: 400 });
      }

      // Converter base64 para buffer se necessário
      const buffer = Buffer.isBuffer(fileContent) ? fileContent : Buffer.from(fileContent, 'base64');

      const fileMetadata = {
        name: fileName,
        parents: [folderId]
      };

      const media = {
        mimeType: 'application/zip',
        body: buffer
      };

      const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id,name,size,createdTime,modifiedTime'
      });

      return NextResponse.json({
        file: {
          id: response.data.id,
          name: response.data.name,
          size: response.data.size,
          createdTime: response.data.createdTime,
          modifiedTime: response.data.modifiedTime,
          downloadUrl: `https://drive.google.com/file/d/${response.data.id}/view`
        },
        authenticated: true
      });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });

  } catch (error) {
    console.error('Erro na API do Google Drive (POST):', error);
    return NextResponse.json({
      error: 'Erro na API do Google Drive',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json({
        error: 'ID do arquivo é obrigatório'
      }, { status: 400 });
    }

    if (!googleSheetsAuth.isAuthenticated()) {
      return NextResponse.json({
        error: 'Usuário não autenticado',
        authenticated: false
      }, { status: 401 });
    }

    const drive = await googleSheetsAuth.getDriveClient();

    await drive.files.delete({
      fileId: fileId
    });

    return NextResponse.json({
      success: true,
      message: 'Arquivo excluído com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir arquivo:', error);
    return NextResponse.json({
      error: 'Erro ao excluir arquivo',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}