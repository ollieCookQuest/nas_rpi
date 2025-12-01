'use client'

import { useState, useEffect } from 'react'
import { Activity, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'

interface ActivityItem {
  id: string
  type: string
  description: string
  createdAt: string
  user?: {
    username: string
    email: string
  }
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/activity?limit=100')
      if (!response.ok) throw new Error('Failed to load activities')
      const data = await response.json()
      setActivities(data.activities || [])
    } catch (error) {
      console.error('Error loading activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIconColor = (type: string) => {
    if (type.includes('CREATE')) return 'text-green-400'
    if (type.includes('DELETE')) return 'text-red-400'
    if (type.includes('MODIFY')) return 'text-blue-400'
    if (type.includes('UPLOAD')) return 'text-primary'
    return 'text-muted-foreground'
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Activity</h1>
        <p className="text-muted-foreground">View your recent activity logs</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card className="card-unifi">
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>Recent file operations and system activities</CardDescription>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">No activity to display</p>
              </div>
            ) : (
              <div className="space-y-1">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-md hover:bg-accent/50 transition-colors"
                  >
                    <div className={`h-2 w-2 rounded-full mt-1.5 ${getActivityIconColor(activity.type).replace('text-', 'bg-').replace('-400', '-500')} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(activity.createdAt)}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
                          {activity.type.replace(/_/g, ' ')}
                        </span>
                        {activity.user && (
                          <span className="text-xs text-muted-foreground">
                            by {activity.user.username}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
