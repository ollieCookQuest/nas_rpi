import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorizedResponse } from '@/lib/api-helpers'
import { getUserFilePath, deleteFile, getFileStats } from '@/lib/storage'
import { prisma } from '@/lib/prisma'
import { logActivity, ActivityType } from '@/lib/storage'
import path from 'path'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')
    const type = searchParams.get('type') || 'file' // 'file' or 'folder'

    if (!filePath) {
      return NextResponse.json({ error: 'Path required' }, { status: 400 })
    }

    const fullPath = getUserFilePath(session.user.id, filePath)
    const stats = await getFileStats(fullPath)

    if (!stats) {
      return NextResponse.json({ error: 'File or folder not found' }, { status: 404 })
    }

    // Delete from filesystem
    await deleteFile(fullPath)

    // Delete from database
    const relativePath = path.relative(getUserFilePath(session.user.id, ''), fullPath)
    
    if (type === 'file') {
      await prisma.file.deleteMany({
        where: {
          ownerId: session.user.id,
          path: relativePath,
        },
      })
      
      await logActivity(
        session.user.id,
        ActivityType.FILE_DELETE,
        `Deleted file: ${filePath}`
      )
    } else {
      await prisma.folder.deleteMany({
        where: {
          ownerId: session.user.id,
          path: relativePath,
        },
      })
      
      await logActivity(
        session.user.id,
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

