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

    const { fileId, folderId, isPublic, expiresAt, password } = await request.json()

    if (!fileId && !folderId) {
      return NextResponse.json(
        { error: 'Either fileId or folderId is required' },
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

    return NextResponse.json({
      message: 'Share created successfully',
      share: {
        id: share.id,
        token: share.token,
        url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/share/${share.token}`,
        expiresAt: share.expiresAt,
        isPublic: share.isPublic,
      },
    })
  } catch (error) {
    console.error('Create share error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

