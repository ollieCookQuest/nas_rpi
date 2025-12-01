import { auth } from '@/auth'
import { getDiskUsage } from '@/lib/storage'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatBytes } from '@/lib/utils'
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
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's an overview of your storage.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(Number(diskUsage.usedBytes))}</div>
            <p className="text-xs text-muted-foreground">
              {formatBytes(Number(diskUsage.totalBytes))} total
            </p>
            <div className="mt-2 h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Files</CardTitle>
            <File className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fileCount}</div>
            <p className="text-xs text-muted-foreground">Total files</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Folders</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{folderCount}</div>
            <p className="text-xs text-muted-foreground">Total folders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentActivities.length}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
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
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-accent"
                >
                  <div>
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.createdAt.toLocaleString()}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-secondary">
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

