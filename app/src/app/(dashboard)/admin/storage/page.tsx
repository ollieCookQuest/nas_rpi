import { auth } from '@/auth'
import { getDiskUsage } from '@/lib/storage'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatBytes, cn } from '@/lib/utils'
import { HardDrive, TrendingUp, Database, Users, Folder, File as FileIcon } from 'lucide-react'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminStoragePage() {
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const diskUsage = await getDiskUsage()
  const totalFiles = await prisma.file.count()
  const totalFolders = await prisma.folder.count()
  const totalUsers = await prisma.user.count()

  const usagePercent = diskUsage.totalBytes > 0 
    ? Number((diskUsage.usedBytes * BigInt(100)) / diskUsage.totalBytes)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Storage Management</h1>
        <p className="text-muted-foreground">Monitor and manage system storage</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(Number(diskUsage.totalBytes))}</div>
            <p className="text-xs text-muted-foreground">Total capacity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Used Storage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(Number(diskUsage.usedBytes))}</div>
            <p className="text-xs text-muted-foreground">{usagePercent.toFixed(1)}% utilized</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(Number(diskUsage.freeBytes))}</div>
            <p className="text-xs text-muted-foreground">Free space</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <FileIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFiles.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{totalFolders} folders</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Overview
          </CardTitle>
          <CardDescription>System-wide storage utilization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Storage Usage</span>
              <span className="text-sm text-muted-foreground">
                {formatBytes(Number(diskUsage.usedBytes))} / {formatBytes(Number(diskUsage.totalBytes))}
              </span>
            </div>
            <div className="h-4 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all",
                  usagePercent > 90 ? "bg-destructive" : usagePercent > 75 ? "bg-orange-500" : "bg-primary"
                )}
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{usagePercent.toFixed(1)}% used</span>
              <span>{formatBytes(Number(diskUsage.freeBytes))} available</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 pt-4 border-t">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Total Users</span>
              </div>
              <p className="text-2xl font-bold">{totalUsers}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Total Files</span>
              </div>
              <p className="text-2xl font-bold">{totalFiles.toLocaleString()}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Folder className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Total Folders</span>
              </div>
              <p className="text-2xl font-bold">{totalFolders.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
