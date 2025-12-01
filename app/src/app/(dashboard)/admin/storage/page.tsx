import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatBytes } from '@/lib/utils'
import { HardDrive } from 'lucide-react'

export default async function AdminStoragePage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const payload = verifyToken(token || '')

  if (!payload || payload.role !== 'ADMIN') {
    return null
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      username: true,
    },
  })

  // This is a simplified version - in production, you'd want to fetch actual storage stats
  // For now, showing a placeholder
  const totalFiles = await prisma.file.count()
  const totalFolders = await prisma.folder.count()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Storage Management</h1>
        <p className="text-muted-foreground">Monitor and manage system storage</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">Active users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFiles}</div>
            <p className="text-xs text-muted-foreground">System-wide files</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Folders</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFolders}</div>
            <p className="text-xs text-muted-foreground">System-wide folders</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Storage</CardTitle>
          <CardDescription>Storage usage by user</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div>
                  <p className="font-medium">{user.username}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Storage info</p>
                  <p className="text-xs text-muted-foreground">Click to view details</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

