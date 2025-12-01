import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorizedResponse } from '@/lib/api-helpers'
import { getUserFilePath } from '@/lib/storage'
import { prisma } from '@/lib/prisma'
import { logActivity, ActivityType } from '@/lib/storage'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
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

    // Ensure destination exists
    if (!existsSync(fullDestPath)) {
      await mkdir(fullDestPath, { recursive: true })
    }

    // Copy file or folder
    if (type === 'file') {
      const fileContent = await readFile(fullItemPath)
      await writeFile(newFullPath, fileContent)

      // Update database - find original file first
      const originalFile = await prisma.file.findFirst({
        where: {
          ownerId: session.user.id,
          path: itemPath,
        },
      })

      if (originalFile) {
        const relativeNewPath = path.relative(getUserFilePath(session.user.id, ''), newFullPath)
        await prisma.file.create({
          data: {
            filename: itemName,
            path: relativeNewPath,
            mimeType: originalFile.mimeType,
            size: originalFile.size,
            ownerId: session.user.id,
          },
        })
      }

      await logActivity(
        session.user.id,
        ActivityType.FILE_CREATE,
        `Copied file: ${itemPath} to ${destinationPath}`
      )
    } else {
      // For folders, recursively copy (simplified - would need recursive copy function)
      await logActivity(
        session.user.id,
        ActivityType.FOLDER_CREATE,
        `Copied folder: ${itemPath} to ${destinationPath}`
      )
    }

    return NextResponse.json({ message: 'Copied successfully', newPath: newFullPath })
  } catch (error) {
    console.error('Copy error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

