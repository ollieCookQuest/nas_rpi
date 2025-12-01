import { auth } from '@/auth'
import { getDiskUsage } from '@/lib/storage'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatBytes, cn } from '@/lib/utils'
import { HardDrive, Folder, File, Activity as ActivityIcon, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    return null
  }

  const diskUsage = await getDiskUsage(session.user.id)
  const fileCount = await prisma.file.count({
    where: { ownerId: session.user.id },
  })
  const folderCount = await prisma.folder.count({
    where: { ownerId: session.user.id },
  })
  const recentActivities = await prisma.activityLog.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  const usagePercent = diskUsage.totalBytes > 0 
    ? Number((diskUsage.usedBytes * BigInt(100)) / diskUsage.totalBytes)
    : 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user.name || session.user.email?.split('@')[0] || 'User'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-unifi">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Storage Used
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <HardDrive className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold mb-1">
              {formatBytes(Number(diskUsage.usedBytes))}
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              of {formatBytes(Number(diskUsage.totalBytes))} total
            </p>
            <div className="space-y-2">
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
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
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">
                  {formatBytes(Number(diskUsage.freeBytes))} available
                </span>
                <span className="font-medium">{usagePercent.toFixed(1)}% used</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-unifi">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Files
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <File className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{fileCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Total files</p>
          </CardContent>
        </Card>

        <Card className="card-unifi">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Folders
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Folder className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{folderCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Total folders</p>
          </CardContent>
        </Card>

        <Card className="card-unifi">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recent Activity
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <ActivityIcon className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{recentActivities.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="card-unifi">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest file operations</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <div className="text-center py-12">
              <ActivityIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 rounded-md hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {activity.createdAt.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground font-medium flex-shrink-0 ml-2">
                    {activity.type.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
