import { NextRequest, NextResponse } from 'next/server';

// Mock data for assets library
const generateMockAssets = (clientId: string, category?: string) => {
  const allAssets = [
    {
      id: '1',
      name: 'Product Brochure 2024',
      type: 'document' as const,
      size: '2.4 MB',
      uploadDate: '2024-01-15',
      category: 'marketing',
      downloads: Math.floor(Math.random() * 100) + 50,
      favorite: Math.random() > 0.7,
      url: `/api/assets/download/${clientId}/brochure-2024.pdf`,
      description: 'Brochura completa dos produtos e serviços'
    },
    {
      id: '2',
      name: 'Service Presentation',
      type: 'presentation' as const,
      size: '8.7 MB',
      uploadDate: '2024-01-10',
      category: 'sales',
      downloads: Math.floor(Math.random() * 80) + 30,
      favorite: Math.random() > 0.8,
      url: `/api/assets/download/${clientId}/presentation-2024.pptx`,
      description: 'Apresentação para vendas e demonstrações'
    },
    {
      id: '3',
      name: 'Brand Guidelines',
      type: 'document' as const,
      size: '5.2 MB',
      uploadDate: '2024-01-08',
      category: 'brand',
      downloads: Math.floor(Math.random() * 60) + 20,
      favorite: Math.random() > 0.6,
      url: `/api/assets/download/${clientId}/brand-guidelines.pdf`,
      description: 'Manual de identidade visual e diretrizes de marca'
    },
    {
      id: '4',
      name: 'Product Demo Video',
      type: 'video' as const,
      size: '45.8 MB',
      uploadDate: '2024-01-12',
      category: 'marketing',
      downloads: Math.floor(Math.random() * 150) + 80,
      favorite: Math.random() > 0.5,
      url: `/api/assets/download/${clientId}/demo-video.mp4`,
      description: 'Vídeo demonstrativo dos principais recursos'
    },
    {
      id: '5',
      name: 'Logo Pack',
      type: 'image' as const,
      size: '12.3 MB',
      uploadDate: '2024-01-05',
      category: 'brand',
      downloads: Math.floor(Math.random() * 90) + 40,
      favorite: Math.random() > 0.7,
      url: `/api/assets/download/${clientId}/logo-pack.zip`,
      description: 'Pacote completo com logotipos em diversos formatos'
    },
    {
      id: '6',
      name: 'Case Study Template',
      type: 'document' as const,
      size: '1.8 MB',
      uploadDate: '2024-01-20',
      category: 'sales',
      downloads: Math.floor(Math.random() * 70) + 25,
      favorite: Math.random() > 0.8,
      url: `/api/assets/download/${clientId}/case-study-template.docx`,
      description: 'Template para criação de estudos de caso'
    },
    {
      id: '7',
      name: 'Social Media Kit',
      type: 'image' as const,
      size: '25.6 MB',
      uploadDate: '2024-01-18',
      category: 'marketing',
      downloads: Math.floor(Math.random() * 120) + 60,
      favorite: Math.random() > 0.6,
      url: `/api/assets/download/${clientId}/social-media-kit.zip`,
      description: 'Materiais para redes sociais e campanhas digitais'
    }
  ];

  // Filter by category if specified
  const filteredAssets = category && category !== 'all'
    ? allAssets.filter(asset => asset.category === category)
    : allAssets;

  return filteredAssets;
};

const getCategories = (assets: any[]) => {
  const categories = ['all', 'marketing', 'sales', 'brand'];
  return categories.map(cat => ({
    id: cat,
    name: cat === 'all' ? 'All Assets' : cat.charAt(0).toUpperCase() + cat.slice(1),
    count: cat === 'all' ? assets.length : assets.filter(a => a.category === cat).length
  }));
};

export async function GET(request: NextRequest) {
  try {
    // TODO: Implement proper authentication when NextAuth is configured

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const category = searchParams.get('category') || 'all';
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'name'; // name, date, downloads, size
    const sortOrder = searchParams.get('sortOrder') || 'asc'; // asc, desc

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    // Generate mock data
    let assets = generateMockAssets(clientId, category);

    // Apply search filter
    if (search) {
      assets = assets.filter(asset =>
        asset.name.toLowerCase().includes(search.toLowerCase()) ||
        asset.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply sorting
    assets.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.uploadDate);
          bValue = new Date(b.uploadDate);
          break;
        case 'downloads':
          aValue = a.downloads;
          bValue = b.downloads;
          break;
        case 'size':
          // Simple size comparison (in MB)
          aValue = parseFloat(a.size);
          bValue = parseFloat(b.size);
          break;
        default: // name
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'desc') {
        return aValue < bValue ? 1 : -1;
      }
      return aValue > bValue ? 1 : -1;
    });

    const categories = getCategories(generateMockAssets(clientId));

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 100));

    return NextResponse.json({
      success: true,
      data: {
        assets,
        categories,
        total: assets.length,
        filters: {
          category,
          search,
          sortBy,
          sortOrder
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Assets API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Implement proper authentication when NextAuth is configured

    const body = await request.json();
    const { clientId, action, assetData } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    if (action === 'upload') {
      if (!assetData) {
        return NextResponse.json(
          { error: 'Asset data is required' },
          { status: 400 }
        );
      }

      // Mock asset upload
      const newAsset = {
        id: Date.now().toString(),
        ...assetData,
        uploadDate: new Date().toISOString(),
        downloads: 0,
        favorite: false,
        url: `/api/assets/download/${clientId}/${Date.now()}`,
        uploadedAt: new Date().toISOString()
      };

      return NextResponse.json({
        success: true,
        message: 'Asset uploaded successfully',
        asset: newAsset
      });
    }

    if (action === 'favorite') {
      const { assetId, favorite } = body;
      if (!assetId) {
        return NextResponse.json(
          { error: 'Asset ID is required' },
          { status: 400 }
        );
      }

      // Mock favorite toggle
      return NextResponse.json({
        success: true,
        message: `Asset ${favorite ? 'added to' : 'removed from'} favorites`,
        assetId,
        favorite
      });
    }

    if (action === 'delete') {
      const { assetId } = body;
      if (!assetId) {
        return NextResponse.json(
          { error: 'Asset ID is required' },
          { status: 400 }
        );
      }

      // Mock asset deletion
      return NextResponse.json({
        success: true,
        message: 'Asset deleted successfully'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Assets API POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}