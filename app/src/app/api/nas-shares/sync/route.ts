import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorizedResponse } from '@/lib/api-helpers'
import { syncNASShares } from '@/lib/nas-sync'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return unauthorizedResponse()
    }

    // Only admins can sync shares
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Sync shares to NFS/SMB servers
    const result = await syncNASShares()

    return NextResponse.json({
      message: 'NAS shares synced successfully',
      ...result,
    })
  } catch (error: any) {
    console.error('Sync NAS shares error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

