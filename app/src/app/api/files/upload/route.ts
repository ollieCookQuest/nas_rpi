import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getUserFilePath, ensureDirectory } from '@/lib/storage'
import { prisma } from '@/lib/prisma'
import { logActivity, ActivityType } from '@/lib/storage'
import { writeFile } from 'fs/promises'
import path from 'path'
import { IncomingForm } from 'formidable'

export const config = {
  api: {
    bodyParser: false,
  },
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    const payload = verifyToken(token || '')

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folderPath = (formData.get('path') as string) || ''

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const userStoragePath = getUserFilePath(payload.userId, folderPath)
    await ensureDirectory(userStoragePath)

    const filePath = path.join(userStoragePath, file.name)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    await writeFile(filePath, buffer)

    // Save file record to database
    const relativePath = path.relative(getUserFilePath(payload.userId, ''), filePath)
    const dbFile = await prisma.file.create({
      data: {
        filename: file.name,
        path: relativePath,
        mimeType: file.type || 'application/octet-stream',
        size: buffer.length,
        ownerId: payload.userId,
      },
    })

    await logActivity(
      payload.userId,
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

