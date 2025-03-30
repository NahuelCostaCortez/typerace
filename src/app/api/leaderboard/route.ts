import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { promises as fsPromises } from 'fs';

// Interface for score entries
interface UserScore {
  username: string;
  wpm: number;
  date: string;
  won: boolean;
}

// Path to the JSON file that will store the leaderboard
const dataFilePath = path.join(process.cwd(), 'data', 'leaderboard.json');

// Ensure the data directory exists
const ensureDirectoryExists = async () => {
  // This is needed for local development but may not work in Vercel
  // We'll handle the error gracefully if it fails
  try {
    const dataDir = path.join(process.cwd(), 'data');
    await fsPromises.mkdir(dataDir, { recursive: true });
    return true;
  } catch (error) {
    console.warn('Could not ensure data directory exists:', error);
    return false;
  }
};

// Function to read leaderboard data
const readLeaderboard = async (): Promise<UserScore[]> => {
  try {
    // Try to read the file
    await ensureDirectoryExists();
    
    try {
      const data = await fsPromises.readFile(dataFilePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // If file doesn't exist or can't be read, return empty array
      console.warn('Could not read leaderboard file, returning empty array:', error);
      // Try to create an empty file
      try {
        await fsPromises.writeFile(dataFilePath, JSON.stringify([]));
      } catch (writeError) {
        console.warn('Could not create empty leaderboard file:', writeError);
      }
      return [];
    }
  } catch (error) {
    console.error('Error reading leaderboard:', error);
    return [];
  }
};

// GET handler to retrieve the leaderboard
export async function GET(request: NextRequest) {
  try {
    // Check if we're just checking for username existence
    const searchParams = request.nextUrl.searchParams;
    const checkUsername = searchParams.get('checkUsername');
    
    // Read leaderboard data
    const leaderboard = await readLeaderboard();
    
    // If we're checking for a username, return whether it exists
    if (checkUsername) {
      const exists = leaderboard.some(
        score => score.username.toLowerCase() === checkUsername.toLowerCase()
      );
      return NextResponse.json({ exists });
    }
    
    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Error in leaderboard GET handler:', error);
    return NextResponse.json({ error: 'Failed to read leaderboard' }, { status: 500 });
  }
}

// POST handler to save the leaderboard
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const leaderboard: UserScore[] = await request.json();
    
    // Validate the data
    if (!Array.isArray(leaderboard)) {
      return NextResponse.json({ error: 'Invalid leaderboard data' }, { status: 400 });
    }
    
    // Ensure the directory exists
    const dirExists = await ensureDirectoryExists();
    
    if (!dirExists) {
      console.warn('Data directory could not be created, but attempting write anyway');
    }
    
    // Try to write the data to the file
    try {
      await fsPromises.writeFile(dataFilePath, JSON.stringify(leaderboard, null, 2));
      return NextResponse.json({ success: true });
    } catch (writeError) {
      console.error('Error writing leaderboard file:', writeError);
      // Still return success in Vercel environment as we expect filesystem writes to fail
      // In a production app, you would use a database instead
      return NextResponse.json({ 
        success: true, 
        warning: 'The leaderboard may not be persisted in this environment'
      });
    }
  } catch (error) {
    console.error('Error in leaderboard POST handler:', error);
    return NextResponse.json({ error: 'Failed to save leaderboard' }, { status: 500 });
  }
} 