'use client'

import { useState, useEffect } from 'react'
import { Share2, Copy, Trash2, Loader2, ExternalLink, Lock, Calendar } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

interface Share {
  id: string
  token: string
  fileId: string | null
  folderId: string | null
  isPublic: boolean
  expiresAt: string | null
  password: string | null
  accessCount: number
  createdAt: string
}

export default function SharesPage() {
  const [shares, setShares] = useState<Share[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadShares()
  }, [])

  const loadShares = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/shares')
      if (!response.ok) throw new Error('Failed to load shares')
      const data = await response.json()
      setShares(data.shares || [])
    } catch (error) {
      console.error('Error loading shares:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteShare = async (token: string) => {
    if (!confirm('Are you sure you want to delete this share?')) return

    try {
      const response = await fetch(`/api/shares/${token}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete share')
      
      await loadShares()
    } catch (error) {
      console.error('Delete share error:', error)
      alert('Failed to delete share')
    }
  }

  const handleCopyLink = async (token: string) => {
    const url = `${window.location.origin}/share/${token}`
    await navigator.clipboard.writeText(url)
    alert('Share link copied to clipboard!')
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Shares</h1>
        <p className="text-muted-foreground">Manage your shared files and folders</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : shares.length === 0 ? (
        <Card className="card-unifi">
          <CardContent className="py-12 text-center">
            <Share2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              No shares yet. Share a file or folder to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {shares.map((share) => {
            const shareUrl = `${window.location.origin}/share/${share.token}`
            const isExpired = share.expiresAt && new Date(share.expiresAt) < new Date()

            return (
              <Card key={share.id} className="card-unifi">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Share2 className="h-4 w-4 text-primary" />
                        Share Link
                      </CardTitle>
                      <CardDescription className="mt-2">
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          {share.isPublic && (
                            <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted">
                              <ExternalLink className="h-3 w-3" />
                              Public
                            </span>
                          )}
                          {share.password && (
                            <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted">
                              <Lock className="h-3 w-3" />
                              Password Protected
                            </span>
                          )}
                          {share.expiresAt && (
                            <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted">
                              <Calendar className="h-3 w-3" />
                              Expires {formatDate(share.expiresAt)}
                            </span>
                          )}
                          <span className="px-2 py-1 rounded-md bg-muted">
                            {share.accessCount} accesses
                          </span>
                        </div>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-md">
                    <code className="text-xs font-mono text-foreground flex-1 break-all">
                      {shareUrl}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopyLink(share.token)}
                      className="h-7 w-7 flex-shrink-0"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteShare(share.token)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                  {isExpired && (
                    <p className="text-xs text-destructive">This share has expired</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
