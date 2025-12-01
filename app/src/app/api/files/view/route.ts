import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getUserFilePath, getFileStats } from '@/lib/storage'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    const payload = verifyToken(token || '')

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')

    if (!filePath) {
      return NextResponse.json({ error: 'File path required' }, { status: 400 })
    }

    const fullPath = getUserFilePath(payload.userId, filePath)
    const stats = await getFileStats(fullPath)

    if (!stats || !stats.isFile) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Get file metadata
    const relativePath = path.relative(getUserFilePath(payload.userId, ''), fullPath)
    const dbFile = await prisma.file.findFirst({
      where: {
        ownerId: payload.userId,
        path: relativePath,
      },
    })

    // Check if file is an image or video for preview
    const mimeType = dbFile?.mimeType || 'application/octet-stream'
    const isImage = mimeType.startsWith('image/')
    const isVideo = mimeType.startsWith('video/')
    const isAudio = mimeType.startsWith('audio/')

    if (isImage || isVideo || isAudio) {
      const fileBuffer = await readFile(fullPath)
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }

    // For text files, return as text
    if (mimeType.startsWith('text/')) {
      const fileBuffer = await readFile(fullPath)
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      })
    }

    // For other files, return as download
    const fileBuffer = await readFile(fullPath)
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${path.basename(filePath)}"`,
      },
    })
  } catch (error) {
    console.error('View file error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

