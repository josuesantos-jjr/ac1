import { NextRequest, NextResponse } from 'next/server';

// Mock data - in production, this would come from your database/cache
const generateMockPulseData = (clientId: string) => {
  const baseMetrics = {
    totalConversations: Math.floor(Math.random() * 1000) + 2000,
    activeConversations: Math.floor(Math.random() * 50) + 10,
    conversionRate: Math.round((Math.random() * 15 + 10) * 10) / 10, // 10-25%
    averageResponseTime: `${Math.floor(Math.random() * 2) + 1}.${Math.floor(Math.random() * 9) + 1}s`,
    leadsGenerated: Math.floor(Math.random() * 200) + 100,
    aiInteractions: Math.floor(Math.random() * 2000) + 3000,
  };

  return {
    ...baseMetrics,
    lastUpdate: new Date().toISOString(),
    clientId,
    status: 'active',
    aiHealth: 'healthy',
    systemLoad: Math.floor(Math.random() * 30) + 20, // 20-50%
  };
};

export async function GET(request: NextRequest) {
  try {
    // TODO: Implement proper authentication when NextAuth is configured
    // For now, allow all requests (development mode)

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    // Generate mock data (in production, fetch from database)
    const pulseData = generateMockPulseData(clientId);

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 100));

    return NextResponse.json({
      success: true,
      data: pulseData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Pulse API error:', error);
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
    const { clientId, action } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    // Admin actions
    if (action === 'refresh') {
      // Force refresh of pulse data
      const pulseData = generateMockPulseData(clientId);

      return NextResponse.json({
        success: true,
        message: 'Pulse data refreshed',
        data: pulseData
      });
    }

    if (action === 'reset') {
      // Reset pulse metrics (admin only)
      // TODO: Check admin role when auth is implemented

      return NextResponse.json({
        success: true,
        message: 'Pulse metrics reset'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Pulse API POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}