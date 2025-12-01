'use client'

import { useState, useEffect } from 'react'
import { Activity, Loader2 } from 'lucide-react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { Card } from '@/components/ui/card'
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

  const getActivityColor = (type: string) => {
    if (type.includes('CREATE')) return 'text-green-500'
    if (type.includes('DELETE')) return 'text-red-500'
    if (type.includes('MODIFY')) return 'text-blue-500'
    return 'text-muted-foreground'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Activity</h1>
        <p className="text-muted-foreground">View your recent activity logs</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card>
          <div className="p-6">
            {activities.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No activity to display
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
                  >
                    <Activity className={`h-5 w-5 mt-0.5 ${getActivityColor(activity.type)}`} />
                    <div className="flex-1">
                      <p className="font-medium">{activity.description}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(activity.createdAt)}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-secondary">
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
          </div>
        </Card>
      )}
    </div>
  )
}

