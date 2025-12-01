import { auth } from '@/auth'
import { getDiskUsage } from '@/lib/storage'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatBytes, cn } from '@/lib/utils'
import { HardDrive, Folder, File, Activity as ActivityIcon } from 'lucide-react'

// Force dynamic rendering since we use auth() and database
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
    take: 5,
  })

  const usagePercent = diskUsage.totalBytes > 0 
    ? Number((diskUsage.usedBytes * BigInt(100)) / diskUsage.totalBytes)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {session.user.name || session.user.email?.split('@')[0] || 'User'}! Here's an overview of your storage.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Storage Used</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <HardDrive className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{formatBytes(Number(diskUsage.usedBytes))}</div>
            <p className="text-xs text-muted-foreground mb-3">
              {formatBytes(Number(diskUsage.totalBytes))} total
            </p>
            <div className="h-2.5 w-full bg-secondary/50 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-500 rounded-full bg-gradient-to-r",
                  usagePercent > 90 ? "from-destructive to-destructive/80" : 
                  usagePercent > 75 ? "from-orange-500 to-orange-400" : 
                  "from-primary to-primary/70"
                )}
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Files</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <File className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{fileCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total files</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Folders</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Folder className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{folderCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total folders</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Recent Activity</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <ActivityIcon className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{recentActivities.length}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-xl">Recent Activity</CardTitle>
          <CardDescription>Your latest file operations</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity</p>
          ) : (
            <div className="space-y-2">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors border border-transparent hover:border-border/50"
                >
                  <div>
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activity.createdAt.toLocaleString()}
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-md bg-secondary/80 text-muted-foreground font-medium">
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

