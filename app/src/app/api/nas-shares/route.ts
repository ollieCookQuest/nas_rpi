import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorizedResponse } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { logActivity, ActivityType } from '@/lib/storage'
import { syncNASShares } from '@/lib/nas-sync'
import { existsSync, statSync } from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return unauthorizedResponse()
    }

    // Only admins can manage NAS shares
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const shares = await prisma.nasShare.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ shares })
  } catch (error) {
    console.error('Get NAS shares error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return unauthorizedResponse()
    }

    // Only admins can create NAS shares
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { name, path: sharePath, protocol, permissions, description, allowedIPs, enabled } = await request.json()

    if (!name || !sharePath) {
      return NextResponse.json(
        { error: 'Name and path are required' },
        { status: 400 }
      )
    }

    // Validate path exists
    const storagePath = process.env.STORAGE_PATH || '/data/storage'
    const fullPath = path.isAbsolute(sharePath) ? sharePath : path.join(storagePath, sharePath)
    
    if (!existsSync(fullPath)) {
      return NextResponse.json(
        { error: 'Path does not exist' },
        { status: 400 }
      )
    }

    const stats = statSync(fullPath)
    if (!stats.isDirectory()) {
      return NextResponse.json(
        { error: 'Path must be a directory' },
        { status: 400 }
      )
    }

    // Check if share name already exists
    const existingShare = await prisma.nasShare.findUnique({
      where: { name },
    })

    if (existingShare) {
      return NextResponse.json(
        { error: 'Share name already exists' },
        { status: 400 }
      )
    }

    const share = await prisma.nasShare.create({
      data: {
        name,
        path: fullPath,
        protocol: protocol || 'NFS',
        permissions: permissions || 'READ_WRITE',
        description: description || null,
        allowedIPs: allowedIPs || null,
        enabled: enabled !== undefined ? enabled : true,
        createdById: session.user.id,
      },
    })

    await logActivity(
      session.user.id,
      ActivityType.NAS_SHARE_CREATE,
      `Created NAS share: ${name} (${protocol || 'NFS'})`,
      { shareId: share.id, path: fullPath }
    )

    // Sync shares to NFS/SMB servers (if enabled)
    if (enabled !== false) {
      try {
        await syncNASShares()
      } catch (error) {
        console.warn('Error syncing NAS shares to servers:', error)
        // Don't fail the request if sync fails
      }
    }

    return NextResponse.json({
      message: 'NAS share created successfully',
      share,
    })
  } catch (error: any) {
    console.error('Create NAS share error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Share name already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

