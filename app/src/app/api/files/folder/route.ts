import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorizedResponse } from '@/lib/api-helpers'
import { createFolder, getUserFilePath } from '@/lib/storage'
import { prisma } from '@/lib/prisma'
import { logActivity, ActivityType } from '@/lib/storage'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return unauthorizedResponse()
    }

    const { name, path: folderPath } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Folder name required' }, { status: 400 })
    }

    const fullPath = await createFolder(session.user.id, folderPath || '', name.trim())

    // Save folder record to database
    const relativePath = path.relative(getUserFilePath(session.user.id, ''), fullPath)
    const dbFolder = await prisma.folder.create({
      data: {
        name: name.trim(),
        path: relativePath,
        ownerId: session.user.id,
      },
    })

    await logActivity(
      session.user.id,
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

