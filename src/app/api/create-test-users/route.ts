import { NextRequest, NextResponse } from 'next/server';

// Mock user creation API for testing purposes
// In production, this would interact with your actual user database

interface TestUser {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'client';
  clientId?: string; // For client users
  managerId?: string; // For manager users
  createdAt: string;
  status: 'active' | 'pending';
}

const mockTestUsers: TestUser[] = [
  {
    id: 'manager-001',
    name: 'João Silva Manager',
    email: 'joao.manager@teste.com',
    role: 'manager',
    createdAt: new Date().toISOString(),
    status: 'active'
  },
  {
    id: 'client-001',
    name: 'Maria Santos Cliente',
    email: 'maria.cliente@teste.com',
    role: 'client',
    clientId: 'client-001',
    createdAt: new Date().toISOString(),
    status: 'active'
  },
  {
    id: 'manager-002',
    name: 'Carlos Oliveira Manager',
    email: 'carlos.manager@teste.com',
    role: 'manager',
    createdAt: new Date().toISOString(),
    status: 'active'
  },
  {
    id: 'client-002',
    name: 'Ana Costa Cliente',
    email: 'ana.cliente@teste.com',
    role: 'client',
    clientId: 'client-002',
    createdAt: new Date().toISOString(),
    status: 'active'
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') as 'manager' | 'client' | 'all';

    let filteredUsers = mockTestUsers;

    if (role && role !== 'all') {
      filteredUsers = mockTestUsers.filter(user => user.role === role);
    }

    return NextResponse.json({
      success: true,
      users: filteredUsers,
      total: filteredUsers.length,
      message: `Found ${filteredUsers.length} test ${role === 'all' ? 'users' : role + 's'}`
    });

  } catch (error) {
    console.error('Get test users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, name, email, clientId } = body;

    // Validate required fields
    if (!role || !name || !email) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['role', 'name', 'email']
        },
        { status: 400 }
      );
    }

    // Validate role
    if (!['manager', 'client'].includes(role)) {
      return NextResponse.json(
        {
          error: 'Invalid role',
          validRoles: ['manager', 'client']
        },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = mockTestUsers.find(user => user.email === email);
    if (existingUser) {
      return NextResponse.json(
        {
          error: 'Email already exists',
          existingUser: {
            id: existingUser.id,
            name: existingUser.name,
            email: existingUser.email,
            role: existingUser.role
          }
        },
        { status: 409 }
      );
    }

    // Create new user
    const newUser: TestUser = {
      id: `${role}-${Date.now()}`,
      name,
      email,
      role,
      ...(role === 'client' && { clientId: clientId || `client-${Date.now()}` }),
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    // In a real implementation, save to database
    mockTestUsers.push(newUser);

    return NextResponse.json({
      success: true,
      user: newUser,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} user created successfully`,
      credentials: {
        email: newUser.email,
        password: 'teste123', // Mock password
        loginUrl: role === 'manager' ? '/manager' : '/client'
      }
    });

  } catch (error) {
    console.error('Create test user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Bulk create test users
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { users } = body;

    if (!Array.isArray(users)) {
      return NextResponse.json(
        { error: 'Users must be an array' },
        { status: 400 }
      );
    }

    const createdUsers: TestUser[] = [];
    const errors: string[] = [];

    for (const userData of users) {
      try {
        const { role, name, email, clientId } = userData;

        if (!role || !name || !email) {
          errors.push(`Missing required fields for user: ${email || 'unknown'}`);
          continue;
        }

        if (!['manager', 'client'].includes(role)) {
          errors.push(`Invalid role for user: ${email}`);
          continue;
        }

        const existingUser = mockTestUsers.find(user => user.email === email);
        if (existingUser) {
          errors.push(`Email already exists: ${email}`);
          continue;
        }

        const newUser: TestUser = {
          id: `${role}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          email,
          role,
          ...(role === 'client' && { clientId: clientId || `client-${Date.now()}` }),
          createdAt: new Date().toISOString(),
          status: 'active'
        };

        mockTestUsers.push(newUser);
        createdUsers.push(newUser);

      } catch (err) {
        errors.push(`Error creating user: ${userData.email || 'unknown'} - ${err}`);
      }
    }

    return NextResponse.json({
      success: true,
      created: createdUsers.length,
      errors: errors.length,
      users: createdUsers,
      errorMessages: errors,
      message: `Created ${createdUsers.length} users${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
    });

  } catch (error) {
    console.error('Bulk create test users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}