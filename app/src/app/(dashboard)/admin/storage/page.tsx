import { auth } from '@/auth'
import { getDiskUsage } from '@/lib/storage'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatBytes, cn } from '@/lib/utils'
import { HardDrive, Users, Folder, File as FileIcon } from 'lucide-react'
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
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Storage Management</h1>
        <p className="text-muted-foreground">Monitor and manage system storage</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-unifi">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Storage
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <HardDrive className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatBytes(Number(diskUsage.totalBytes))}</div>
            <p className="text-xs text-muted-foreground mt-1">Total capacity</p>
          </CardContent>
        </Card>

        <Card className="card-unifi">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Used Storage
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <HardDrive className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatBytes(Number(diskUsage.usedBytes))}</div>
            <p className="text-xs text-muted-foreground mt-1">{usagePercent.toFixed(1)}% utilized</p>
          </CardContent>
        </Card>

        <Card className="card-unifi">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <HardDrive className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatBytes(Number(diskUsage.freeBytes))}</div>
            <p className="text-xs text-muted-foreground mt-1">Free space</p>
          </CardContent>
        </Card>

        <Card className="card-unifi">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Files
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileIcon className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totalFiles.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{totalFolders} folders</p>
          </CardContent>
        </Card>
      </div>

      {/* Storage Overview */}
      <Card className="card-unifi">
        <CardHeader>
          <CardTitle>Storage Overview</CardTitle>
          <CardDescription>System-wide storage utilization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium">Storage Usage</span>
              <span className="text-sm text-muted-foreground">
                {formatBytes(Number(diskUsage.usedBytes))} / {formatBytes(Number(diskUsage.totalBytes))}
              </span>
            </div>
            <div className="space-y-2">
              <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    usagePercent > 90 ? "bg-red-500" : 
                    usagePercent > 75 ? "bg-orange-500" : 
                    "bg-primary"
                  )}
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{usagePercent.toFixed(1)}% used</span>
                <span>{formatBytes(Number(diskUsage.freeBytes))} available</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 pt-4 border-t border-border/50">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Total Users</span>
              </div>
              <p className="text-2xl font-semibold">{totalUsers}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Total Files</span>
              </div>
              <p className="text-2xl font-semibold">{totalFiles.toLocaleString()}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Total Folders</span>
              </div>
              <p className="text-2xl font-semibold">{totalFolders.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
