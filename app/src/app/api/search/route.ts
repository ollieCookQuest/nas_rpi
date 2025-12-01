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
          ownerId: session.user.id,
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
          ownerId: session.user.id,
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

