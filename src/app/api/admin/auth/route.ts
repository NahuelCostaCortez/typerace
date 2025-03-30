import { NextRequest, NextResponse } from 'next/server';

// In a real production app, this would come from an environment variable
// and would be properly hashed
const ADMIN_PASSWORD = 'typerace2023';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { success: false, message: 'Password is required' },
        { status: 400 }
      );
    }

    const isValid = password === ADMIN_PASSWORD;

    return NextResponse.json({
      success: isValid,
      message: isValid ? 'Authentication successful' : 'Invalid password'
    });
  } catch (error) {
    console.error('Error in admin authentication:', error);
    return NextResponse.json(
      { success: false, message: 'Authentication failed' },
      { status: 500 }
    );
  }
} 