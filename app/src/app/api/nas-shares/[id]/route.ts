import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorizedResponse } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { logActivity, ActivityType } from '@/lib/storage'
import { syncNASShares } from '@/lib/nas-sync'
import { existsSync, statSync } from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return unauthorizedResponse()
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params
    const share = await prisma.nasShare.findUnique({
      where: { id },
    })

    if (!share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 })
    }

    return NextResponse.json({ share })
  } catch (error) {
    console.error('Get NAS share error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return unauthorizedResponse()
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params
    const { name, path: sharePath, protocol, permissions, description, allowedIPs, enabled } = await request.json()

    const existingShare = await prisma.nasShare.findUnique({
      where: { id },
    })

    if (!existingShare) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 })
    }

    // Validate path if provided
    if (sharePath && sharePath !== existingShare.path) {
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
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (sharePath !== undefined) {
      const storagePath = process.env.STORAGE_PATH || '/data/storage'
      updateData.path = path.isAbsolute(sharePath) ? sharePath : path.join(storagePath, sharePath)
    }
    if (protocol !== undefined) updateData.protocol = protocol
    if (permissions !== undefined) updateData.permissions = permissions
    if (description !== undefined) updateData.description = description
    if (allowedIPs !== undefined) updateData.allowedIPs = allowedIPs
    if (enabled !== undefined) updateData.enabled = enabled

    const share = await prisma.nasShare.update({
      where: { id },
      data: updateData,
    })

    await logActivity(
      session.user.id,
      ActivityType.NAS_SHARE_UPDATE,
      `Updated NAS share: ${share.name}`,
      { shareId: share.id }
    )

    // Sync shares to NFS/SMB servers if enabled
    if (share.enabled) {
      try {
        await syncNASShares()
      } catch (error) {
        console.warn('Error syncing NAS shares to servers:', error)
      }
    }

    return NextResponse.json({
      message: 'NAS share updated successfully',
      share,
    })
  } catch (error: any) {
    console.error('Update NAS share error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Share name already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return unauthorizedResponse()
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params

    const share = await prisma.nasShare.findUnique({
      where: { id },
    })

    if (!share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 })
    }

    await prisma.nasShare.delete({
      where: { id },
    })

    await logActivity(
      session.user.id,
      ActivityType.NAS_SHARE_DELETE,
      `Deleted NAS share: ${share.name}`,
      { shareId: share.id }
    )

    // Sync shares to NFS/SMB servers after deletion
    try {
      await syncNASShares()
    } catch (error) {
      console.warn('Error syncing NAS shares to servers:', error)
    }

    return NextResponse.json({ message: 'NAS share deleted successfully' })
  } catch (error) {
    console.error('Delete NAS share error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

