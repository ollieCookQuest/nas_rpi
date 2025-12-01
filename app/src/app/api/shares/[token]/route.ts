import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorizedResponse } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth'
import { getUserFilePath, logActivity, ActivityType } from '@/lib/storage'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const { searchParams } = new URL(request.url)
    const password = searchParams.get('password')

    const share = await prisma.share.findUnique({
      where: { token },
    })

    if (!share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 })
    }

    // Check if expired
    if (share.expiresAt && new Date() > share.expiresAt) {
      return NextResponse.json({ error: 'Share has expired' }, { status: 410 })
    }

    // Check password if required
    if (share.password) {
      if (!password) {
        return NextResponse.json(
          { error: 'Password required', requiresPassword: true },
          { status: 401 }
        )
      }
      const isValid = await verifyPassword(password, share.password)
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
      }
    }

    // Update access count
    await prisma.share.update({
      where: { id: share.id },
      data: { accessCount: { increment: 1 } },
    })

    // Get file or folder details
    if (share.fileId) {
      const file = await prisma.file.findUnique({
        where: { id: share.fileId },
      })
      if (!file) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
      }

      const fullPath = getUserFilePath(share.ownerId, file.path)
      const fileBuffer = await readFile(fullPath)

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': file.mimeType || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${file.filename}"`,
        },
      })
    } else if (share.folderId) {
      const folder = await prisma.folder.findUnique({
        where: { id: share.folderId },
      })
      if (!folder) {
        return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
      }

      return NextResponse.json({ folder, share })
    }

    return NextResponse.json({ error: 'Invalid share' }, { status: 400 })
  } catch (error) {
    console.error('Get share error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return unauthorizedResponse()
    }

    const { token } = await params

    const share = await prisma.share.findUnique({
      where: { token },
    })

    if (!share || share.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 })
    }

    await prisma.share.delete({
      where: { id: share.id },
    })

    await logActivity(
      session.user.id,
      ActivityType.SHARE_DELETE,
      `Deleted share: ${token}`
    )

    return NextResponse.json({ message: 'Share deleted successfully' })
  } catch (error) {
    console.error('Delete share error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

