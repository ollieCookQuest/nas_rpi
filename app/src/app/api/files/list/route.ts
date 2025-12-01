import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getUserFilePath, listDirectory, getFileStats } from '@/lib/storage'
import { prisma } from '@/lib/prisma'
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
    const folderPath = searchParams.get('path') || ''

    const userStoragePath = getUserFilePath(payload.userId, folderPath)
    const stats = await getFileStats(userStoragePath)

    if (!stats || !stats.isDirectory) {
      return NextResponse.json({ error: 'Invalid directory' }, { status: 400 })
    }

    const entries = await listDirectory(userStoragePath)
    const relativePath = path.relative(getUserFilePath(payload.userId, ''), userStoragePath) || '.'

    // Get database records for files and folders
    const dbFiles = await prisma.file.findMany({
      where: {
        ownerId: payload.userId,
        path: {
          startsWith: relativePath === '.' ? '' : relativePath,
        },
      },
    })

    const dbFolders = await prisma.folder.findMany({
      where: {
        ownerId: payload.userId,
        path: {
          startsWith: relativePath === '.' ? '' : relativePath,
        },
      },
    })

    const files = entries
      .filter((entry) => entry.isFile)
      .map((entry) => {
        const relativeFilePath = path.relative(userStoragePath, entry.path)
        const dbFile = dbFiles.find((f) => f.path === path.join(relativePath, relativeFilePath))
        return {
          name: entry.name,
          path: relativeFilePath,
          size: dbFile?.size || 0,
          mimeType: dbFile?.mimeType || 'application/octet-stream',
          createdAt: dbFile?.createdAt || new Date(),
        }
      })

    const folders = entries
      .filter((entry) => entry.isDirectory)
      .map((entry) => {
        const relativeFolderPath = path.relative(userStoragePath, entry.path)
        const dbFolder = dbFolders.find(
          (f) => f.path === path.join(relativePath, relativeFolderPath)
        )
        return {
          name: entry.name,
          path: relativeFolderPath,
          createdAt: dbFolder?.createdAt || new Date(),
        }
      })

    return NextResponse.json({
      path: relativePath,
      files,
      folders,
    })
  } catch (error) {
    console.error('List files error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

