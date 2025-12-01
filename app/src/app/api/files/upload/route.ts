import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorizedResponse } from '@/lib/api-helpers'
import { getUserFilePath, ensureDirectory } from '@/lib/storage'
import { prisma } from '@/lib/prisma'
import { logActivity, ActivityType } from '@/lib/storage'
import { writeFile } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return unauthorizedResponse()
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folderPath = (formData.get('path') as string) || ''

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const userStoragePath = getUserFilePath(session.user.id, folderPath)
    await ensureDirectory(userStoragePath)

    const filePath = path.join(userStoragePath, file.name)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    await writeFile(filePath, buffer)

    // Save file record to database
    const relativePath = path.relative(getUserFilePath(session.user.id, ''), filePath)
    const dbFile = await prisma.file.create({
      data: {
        filename: file.name,
        path: relativePath,
        mimeType: file.type || 'application/octet-stream',
        size: buffer.length,
        ownerId: session.user.id,
      },
    })

    await logActivity(
      session.user.id,
      ActivityType.FILE_UPLOAD,
      `Uploaded file: ${file.name}`,
      { fileId: dbFile.id, size: buffer.length }
    )

    return NextResponse.json({
      message: 'File uploaded successfully',
      file: {
        id: dbFile.id,
        filename: dbFile.filename,
        path: dbFile.path,
        size: dbFile.size,
        mimeType: dbFile.mimeType,
      },
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

