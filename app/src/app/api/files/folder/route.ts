import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { createFolder, getUserFilePath } from '@/lib/storage'
import { prisma } from '@/lib/prisma'
import { logActivity, ActivityType } from '@/lib/storage'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    const payload = verifyToken(token || '')

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, path: folderPath } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Folder name required' }, { status: 400 })
    }

    const fullPath = await createFolder(payload.userId, folderPath || '', name.trim())

    // Save folder record to database
    const relativePath = path.relative(getUserFilePath(payload.userId, ''), fullPath)
    const dbFolder = await prisma.folder.create({
      data: {
        name: name.trim(),
        path: relativePath,
        ownerId: payload.userId,
      },
    })

    await logActivity(
      payload.userId,
      ActivityType.FOLDER_CREATE,
      `Created folder: ${name}`,
      { folderId: dbFolder.id }
    )

    return NextResponse.json({
      message: 'Folder created successfully',
      folder: {
        id: dbFolder.id,
        name: dbFolder.name,
        path: dbFolder.path,
      },
    })
  } catch (error) {
    console.error('Create folder error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

