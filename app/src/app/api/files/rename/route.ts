import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorizedResponse } from '@/lib/api-helpers'
import { getUserFilePath, renameItem } from '@/lib/storage'
import { prisma } from '@/lib/prisma'
import { logActivity, ActivityType } from '@/lib/storage'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return unauthorizedResponse()
    }

    const { oldPath, newName, type } = await request.json()

    if (!oldPath || !newName || !type) {
      return NextResponse.json(
        { error: 'oldPath, newName, and type are required' },
        { status: 400 }
      )
    }

    const fullOldPath = getUserFilePath(session.user.id, oldPath)
    const dirPath = path.dirname(fullOldPath)
    const fullNewPath = path.join(dirPath, newName)

    // Rename on filesystem
    await renameItem(fullOldPath, fullNewPath)

    // Update database
    const relativeNewPath = path.relative(getUserFilePath(session.user.id, ''), fullNewPath)
    const relativeOldPath = path.relative(getUserFilePath(session.user.id, ''), fullOldPath)

    if (type === 'file') {
      await prisma.file.updateMany({
        where: {
          ownerId: session.user.id,
          path: relativeOldPath,
        },
        data: {
          filename: newName,
          path: relativeNewPath,
        },
      })

      await logActivity(
        session.user.id,
        ActivityType.FILE_MODIFY,
        `Renamed file: ${oldPath} to ${newName}`
      )
    } else {
      await prisma.folder.updateMany({
        where: {
          ownerId: session.user.id,
          path: relativeOldPath,
        },
        data: {
          name: newName,
          path: relativeNewPath,
        },
      })

      await logActivity(
        session.user.id,
        ActivityType.FOLDER_CREATE,
        `Renamed folder: ${oldPath} to ${newName}`
      )
    }

    return NextResponse.json({ message: 'Renamed successfully', newPath: relativeNewPath })
  } catch (error) {
    console.error('Rename error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

