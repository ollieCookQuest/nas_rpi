import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorizedResponse } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const type = searchParams.get('type')
    const allUsers = searchParams.get('all') === 'true' && session.user.role === 'ADMIN'

    const where: any = {}
    if (!allUsers) {
      where.userId = session.user.id
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

