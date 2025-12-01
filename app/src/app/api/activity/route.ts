import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    const payload = verifyToken(token || '')

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const type = searchParams.get('type')
    const allUsers = searchParams.get('all') === 'true' && payload.role === 'ADMIN'

    const where: any = {}
    if (!allUsers) {
      where.userId = payload.userId
    }
    if (type) {
      where.type = type
    }

    const activities = await prisma.activityLog.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ activities })
  } catch (error) {
    console.error('Activity error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

