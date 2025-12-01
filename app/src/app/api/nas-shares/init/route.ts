import { NextResponse } from 'next/server'
import { syncNASShares } from '@/lib/nas-sync'

// Initialize NAS shares on startup
// This endpoint can be called after the app starts to sync any existing shares
export async function GET() {
  try {
    const result = await syncNASShares()
    
    return NextResponse.json({
      message: 'NAS shares initialized successfully',
      ...result,
    })
  } catch (error: any) {
    console.error('Initialize NAS shares error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error',
      message: 'NAS shares initialization completed with warnings'
    }, { status: 200 }) // Return 200 even on error to not break startup
  }
}

