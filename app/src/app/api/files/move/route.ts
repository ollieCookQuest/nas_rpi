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

    const { itemPath, destinationPath, type } = await request.json()

    if (!itemPath || !destinationPath || !type) {
      return NextResponse.json(
        { error: 'itemPath, destinationPath, and type are required' },
        { status: 400 }
      )
    }

    const fullItemPath = getUserFilePath(session.user.id, itemPath)
    const fullDestPath = getUserFilePath(session.user.id, destinationPath)
    const itemName = path.basename(fullItemPath)
    const newFullPath = path.join(fullDestPath, itemName)

    // Move on filesystem
    await renameItem(fullItemPath, newFullPath)

    // Update database
    const relativeNewPath = path.relative(getUserFilePath(session.user.id, ''), newFullPath)
    const relativeOldPath = path.relative(getUserFilePath(session.user.id, ''), fullItemPath)

    if (type === 'file') {
      await prisma.file.updateMany({
        where: {
          ownerId: session.user.id,
          path: relativeOldPath,
        },
        data: {
          path: relativeNewPath,
        },
      })

      await logActivity(
        session.user.id,
        ActivityType.FILE_MODIFY,
        `Moved file: ${itemPath} to ${destinationPath}`
      )
    } else {
      await prisma.folder.updateMany({
        where: {
          ownerId: session.user.id,
          path: relativeOldPath,
        },
        data: {
          path: relativeNewPath,
        },
      })

      await logActivity(
        session.user.id,
        ActivityType.FOLDER_CREATE,
        `Moved folder: ${itemPath} to ${destinationPath}`
      )
    }

    return NextResponse.json({ message: 'Moved successfully', newPath: relativeNewPath })
  } catch (error) {
    console.error('Move error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

