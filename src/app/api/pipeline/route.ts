import { NextRequest, NextResponse } from 'next/server';

// Mock data for sales pipeline
const generateMockPipelineData = (clientId: string) => {
  return {
    stages: [
      {
        id: 'prospect',
        name: 'Prospect',
        count: Math.floor(Math.random() * 30) + 20,
        value: Math.floor(Math.random() * 100000) + 150000,
        conversionRate: 100,
        color: 'bg-gray-400'
      },
      {
        id: 'qualified',
        name: 'Qualified',
        count: Math.floor(Math.random() * 25) + 15,
        value: Math.floor(Math.random() * 80000) + 120000,
        conversionRate: Math.floor(Math.random() * 20) + 60,
        color: 'bg-blue-500'
      },
      {
        id: 'proposal',
        name: 'Proposal',
        count: Math.floor(Math.random() * 15) + 8,
        value: Math.floor(Math.random() * 60000) + 80000,
        conversionRate: Math.floor(Math.random() * 25) + 45,
        color: 'bg-yellow-500'
      },
      {
        id: 'negotiation',
        name: 'Negotiation',
        count: Math.floor(Math.random() * 10) + 5,
        value: Math.floor(Math.random() * 40000) + 50000,
        conversionRate: Math.floor(Math.random() * 20) + 55,
        color: 'bg-orange-500'
      },
      {
        id: 'closed',
        name: 'Closed Won',
        count: Math.floor(Math.random() * 8) + 3,
        value: Math.floor(Math.random() * 30000) + 30000,
        conversionRate: Math.floor(Math.random() * 15) + 60,
        color: 'bg-green-500'
      }
    ],
    deals: [
      {
        id: '1',
        name: 'Tech Corp Deal',
        value: Math.floor(Math.random() * 20000) + 30000,
        stage: 'negotiation',
        lastActivity: new Date(Date.now() - Math.random() * 86400000 * 2).toISOString(),
        probability: Math.floor(Math.random() * 30) + 70,
        contact: 'João Silva',
        expectedClose: new Date(Date.now() + Math.random() * 86400000 * 30).toISOString()
      },
      {
        id: '2',
        name: 'Startup Inc',
        value: Math.floor(Math.random() * 15000) + 20000,
        stage: 'proposal',
        lastActivity: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
        probability: Math.floor(Math.random() * 25) + 40,
        contact: 'Maria Santos',
        expectedClose: new Date(Date.now() + Math.random() * 86400000 * 15).toISOString()
      },
      {
        id: '3',
        name: 'Enterprise Ltd',
        value: Math.floor(Math.random() * 25000) + 15000,
        stage: 'qualified',
        lastActivity: new Date(Date.now() - Math.random() * 86400000 * 1).toISOString(),
        probability: Math.floor(Math.random() * 20) + 30,
        contact: 'Carlos Oliveira',
        expectedClose: new Date(Date.now() + Math.random() * 86400000 * 45).toISOString()
      },
      {
        id: '4',
        name: 'Small Business Co',
        value: Math.floor(Math.random() * 10000) + 10000,
        stage: 'prospect',
        lastActivity: new Date(Date.now() - Math.random() * 86400000 * 5).toISOString(),
        probability: Math.floor(Math.random() * 15) + 15,
        contact: 'Ana Costa',
        expectedClose: new Date(Date.now() + Math.random() * 86400000 * 60).toISOString()
      }
    ],
    summary: {
      totalValue: 0, // Will be calculated
      totalDeals: 0, // Will be calculated
      averageDealSize: 0, // Will be calculated
      winRate: Math.floor(Math.random() * 20) + 15, // 15-35%
      averageCycle: Math.floor(Math.random() * 30) + 45 // 45-75 days
    }
  };
};

const calculateSummary = (data: any) => {
  const totalValue = data.stages.reduce((sum: number, stage: any) => sum + stage.value, 0);
  const totalDeals = data.stages.reduce((sum: number, stage: any) => sum + stage.count, 0);
  const averageDealSize = totalDeals > 0 ? Math.round(totalValue / totalDeals) : 0;

  return {
    ...data.summary,
    totalValue,
    totalDeals,
    averageDealSize
  };
};

export async function GET(request: NextRequest) {
  try {
    // TODO: Implement proper authentication when NextAuth is configured

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const period = searchParams.get('period') || 'current'; // current, last_month, quarter

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    // Generate mock data (in production, fetch from database)
    const pipelineData = generateMockPipelineData(clientId);
    pipelineData.summary = calculateSummary(pipelineData);

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 150));

    return NextResponse.json({
      success: true,
      data: pipelineData,
      period,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Pipeline API error:', error);
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
    const { clientId, action, dealData } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    // Deal management actions
    if (action === 'create_deal') {
      if (!dealData) {
        return NextResponse.json(
          { error: 'Deal data is required' },
          { status: 400 }
        );
      }

      // Mock deal creation
      const newDeal = {
        id: Date.now().toString(),
        ...dealData,
        createdAt: new Date().toISOString()
      };

      return NextResponse.json({
        success: true,
        message: 'Deal created successfully',
        deal: newDeal
      });
    }

    if (action === 'update_deal') {
      if (!dealData?.id) {
        return NextResponse.json(
          { error: 'Deal ID is required' },
          { status: 400 }
        );
      }

      // Mock deal update
      return NextResponse.json({
        success: true,
        message: 'Deal updated successfully',
        deal: { ...dealData, updatedAt: new Date().toISOString() }
      });
    }

    if (action === 'delete_deal') {
      const { dealId } = body;
      if (!dealId) {
        return NextResponse.json(
          { error: 'Deal ID is required' },
          { status: 400 }
        );
      }

      // Mock deal deletion
      return NextResponse.json({
        success: true,
        message: 'Deal deleted successfully'
      });
    }

    if (action === 'move_deal') {
      const { dealId, newStage } = body;
      if (!dealId || !newStage) {
        return NextResponse.json(
          { error: 'Deal ID and new stage are required' },
          { status: 400 }
        );
      }

      // Mock deal stage change
      return NextResponse.json({
        success: true,
        message: `Deal moved to ${newStage}`,
        dealId,
        newStage,
        movedAt: new Date().toISOString()
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Pipeline API POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}