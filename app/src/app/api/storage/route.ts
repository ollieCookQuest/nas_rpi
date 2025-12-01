import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getDiskUsage } from '@/lib/storage'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    const payload = verifyToken(token || '')

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = payload.role === 'ADMIN'
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Admins can view any user's storage, regular users only their own
    const targetUserId = isAdmin && userId ? userId : payload.userId

    const diskUsage = await getDiskUsage(targetUserId)
    
    // Get user info if admin viewing another user
    let userInfo = null
    if (isAdmin && userId && userId !== payload.userId) {
      userInfo = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
        },
      })
    }

    return NextResponse.json({
      diskUsage: {
        totalBytes: diskUsage.totalBytes.toString(),
        usedBytes: diskUsage.usedBytes.toString(),
        freeBytes: diskUsage.freeBytes.toString(),
      },
      user: userInfo,
    })
  } catch (error) {
    console.error('Storage error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

