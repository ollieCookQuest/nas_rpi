import { promises as fs } from 'fs'
import path from 'path'
import { prisma } from './prisma'
import { ActivityType } from '@prisma/client'

export { ActivityType }

const STORAGE_PATH = process.env.STORAGE_PATH || '/data/storage'

export function getStoragePath(userId: string): string {
  return path.join(STORAGE_PATH, userId)
}

export function getUserFilePath(userId: string, filePath: string): string {
  const basePath = getStoragePath(userId)
  const resolvedPath = path.resolve(basePath, filePath)
  
  // Security: Ensure the resolved path is within the user's storage directory
  if (!resolvedPath.startsWith(path.resolve(basePath))) {
    throw new Error('Invalid file path')
  }
  
  return resolvedPath
}

export async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true })
  } catch (error) {
    // Directory might already exist, ignore if that's the case
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error
    }
  }
}

export async function getFileStats(filePath: string) {
  try {
    const stats = await fs.stat(filePath)
    return {
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile(),
    }
  } catch (error) {
    return null
  }
}

export async function listDirectory(dirPath: string) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true })
  
  return entries.map(entry => ({
    name: entry.name,
    isDirectory: entry.isDirectory(),
    isFile: entry.isFile(),
    path: path.join(dirPath, entry.name),
  }))
}

export async function deleteFile(filePath: string): Promise<void> {
  const stats = await fs.stat(filePath)
  if (stats.isDirectory()) {
    await fs.rmdir(filePath, { recursive: true })
  } else {
    await fs.unlink(filePath)
  }
}

export async function createFolder(userId: string, folderPath: string, name: string) {
  const fullPath = getUserFilePath(userId, path.join(folderPath, name))
  await ensureDirectory(fullPath)
  return fullPath
}

export async function renameItem(oldPath: string, newPath: string): Promise<void> {
  await fs.rename(oldPath, newPath)
}

export async function logActivity(
  userId: string,
  type: ActivityType,
  description: string,
  metadata?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
) {
  await prisma.activityLog.create({
    data: {
      userId,
      type,
      description,
      metadata: metadata ? JSON.stringify(metadata) : null,
      ipAddress,
      userAgent,
    },
  })
}

export async function getDiskUsage(userId?: string) {
  const storagePath = userId ? getStoragePath(userId) : STORAGE_PATH
  
  async function calculateSize(dirPath: string): Promise<number> {
    let totalSize = 0
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)
        if (entry.isDirectory()) {
          totalSize += await calculateSize(fullPath)
        } else {
          const stats = await fs.stat(fullPath)
          totalSize += stats.size
        }
      }
    } catch (error) {
      // Ignore errors for inaccessible directories
    }
    return totalSize
  }

  const usedBytes = await calculateSize(storagePath)
  
  // Try to get disk stats using df command or estimate
  // For now, we'll store used bytes and let the system calculate total/free
  // This can be enhanced with a system call to df if needed
  const totalBytes = BigInt(usedBytes * 2) // Placeholder - should use actual disk stats
  const freeBytes = totalBytes - BigInt(usedBytes)

  return {
    totalBytes,
    usedBytes: BigInt(usedBytes),
    freeBytes,
  }
}

