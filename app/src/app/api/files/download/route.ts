import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getUserFilePath, getFileStats } from '@/lib/storage'
import { logActivity, ActivityType } from '@/lib/storage'
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

    const fullPath = getUserFilePath(session.user.id, filePath)
    const stats = await getFileStats(fullPath)

    if (!stats || !stats.isFile) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Get file metadata from database
    const relativePath = path.relative(getUserFilePath(payload.userId, ''), fullPath)
    const dbFile = await prisma.file.findFirst({
      where: {
        ownerId: payload.userId,
        path: relativePath,
      },
    })

    const fileBuffer = await readFile(fullPath)

    await logActivity(
      session.user.id,
      ActivityType.FILE_DOWNLOAD,
      `Downloaded file: ${filePath}`,
      { path: filePath }
    )

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': dbFile?.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${path.basename(filePath)}"`,
        'Content-Length': stats.size.toString(),
      },
    })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

