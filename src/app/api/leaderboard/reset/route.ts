import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fsPromises } from 'fs';

// Path to the JSON file that will store the leaderboard
const dataFilePath = path.join(process.cwd(), 'data', 'leaderboard.json');

// DELETE handler to reset the leaderboard
export async function DELETE(request: NextRequest) {
  try {
    // Try to create an empty leaderboard
    try {
      // Ensure data directory exists
      const dataDir = path.join(process.cwd(), 'data');
      await fsPromises.mkdir(dataDir, { recursive: true });
      
      // Write empty array to the file
      await fsPromises.writeFile(dataFilePath, JSON.stringify([]));
      
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error writing to leaderboard file:', error);
      // Return success anyway in Vercel environment
      return NextResponse.json({ 
        success: true, 
        warning: 'The leaderboard may not be persisted in this environment' 
      });
    }
  } catch (error) {
    console.error('Error resetting leaderboard:', error);
    return NextResponse.json({ error: 'Failed to reset leaderboard' }, { status: 500 });
  }
} 