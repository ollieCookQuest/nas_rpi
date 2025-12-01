import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getUserFilePath, deleteFile, getFileStats } from '@/lib/storage'
import { prisma } from '@/lib/prisma'
import { logActivity, ActivityType } from '@/lib/storage'
import path from 'path'

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    const payload = verifyToken(token || '')

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')
    const type = searchParams.get('type') || 'file' // 'file' or 'folder'

    if (!filePath) {
      return NextResponse.json({ error: 'Path required' }, { status: 400 })
    }

    const fullPath = getUserFilePath(payload.userId, filePath)
    const stats = await getFileStats(fullPath)

    if (!stats) {
      return NextResponse.json({ error: 'File or folder not found' }, { status: 404 })
    }

    // Delete from filesystem
    await deleteFile(fullPath)

    // Delete from database
    const relativePath = path.relative(getUserFilePath(payload.userId, ''), fullPath)
    
    if (type === 'file') {
      await prisma.file.deleteMany({
        where: {
          ownerId: payload.userId,
          path: relativePath,
        },
      })
      
      await logActivity(
        payload.userId,
        ActivityType.FILE_DELETE,
        `Deleted file: ${filePath}`
      )
    } else {
      await prisma.folder.deleteMany({
        where: {
          ownerId: payload.userId,
          path: relativePath,
        },
      })
      
      await logActivity(
        payload.userId,
        ActivityType.FOLDER_DELETE,
        `Deleted folder: ${filePath}`
      )
    }

    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

