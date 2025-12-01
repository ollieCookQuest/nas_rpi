import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorizedResponse } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { generateShareToken } from '@/lib/utils'
import { logActivity, ActivityType } from '@/lib/storage'
import { hashPassword } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return unauthorizedResponse()
    }

    const shares = await prisma.share.findMany({
      where: { ownerId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ shares })
  } catch (error) {
    console.error('Get shares error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return unauthorizedResponse()
    }

    const { filePath, folderPath, isPublic, expiresAt, password } = await request.json()

    // Find file or folder by path
    let fileId: string | null = null
    let folderId: string | null = null

    if (filePath) {
      const file = await prisma.file.findFirst({
        where: {
          ownerId: session.user.id,
          path: filePath,
        },
      })
      if (!file) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
      }
      fileId = file.id
    } else if (folderPath) {
      const folder = await prisma.folder.findFirst({
        where: {
          ownerId: session.user.id,
          path: folderPath,
        },
      })
      if (!folder) {
        return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
      }
      folderId = folder.id
    } else {
      return NextResponse.json(
        { error: 'Either filePath or folderPath is required' },
        { status: 400 }
      )
    }

    const token = generateShareToken()
    const hashedPassword = password ? await hashPassword(password) : null

    const share = await prisma.share.create({
      data: {
        token,
        fileId: fileId || null,
        folderId: folderId || null,
        ownerId: session.user.id,
        isPublic: isPublic || false,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        password: hashedPassword,
      },
    })

    await logActivity(
      session.user.id,
      ActivityType.SHARE_CREATE,
      `Created share: ${token}`,
      { shareId: share.id, fileId, folderId }
    )

    const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || 'http://localhost:3000'

    return NextResponse.json({
      message: 'Share created successfully',
      share: {
        id: share.id,
        token: share.token,
        url: `${baseUrl}/share/${share.token}`,
        expiresAt: share.expiresAt,
        isPublic: share.isPublic,
        hasPassword: !!share.password,
      },
    })
  } catch (error) {
    console.error('Create share error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

