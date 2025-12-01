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
    const query = searchParams.get('q') || ''
    const type = searchParams.get('type') || 'all' // 'all', 'file', 'folder'
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!query.trim()) {
      return NextResponse.json({ files: [], folders: [] })
    }

    const searchTerm = query.trim()

    let files: any[] = []
    let folders: any[] = []

    if (type === 'all' || type === 'file') {
      files = await prisma.file.findMany({
        where: {
          ownerId: payload.userId,
          filename: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        take: limit,
        orderBy: { updatedAt: 'desc' },
      })
    }

    if (type === 'all' || type === 'folder') {
      folders = await prisma.folder.findMany({
        where: {
          ownerId: payload.userId,
          name: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        take: limit,
        orderBy: { updatedAt: 'desc' },
      })
    }

    return NextResponse.json({ files, folders })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

