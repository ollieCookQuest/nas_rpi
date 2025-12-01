'use client'

import { useState, useEffect } from 'react'
import { Share2, Copy, Trash2, Loader2, ExternalLink, Lock, Calendar } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

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

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/share/${token}`
    navigator.clipboard.writeText(url)
    alert('Share link copied to clipboard!')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Shares</h1>
        <p className="text-muted-foreground">Manage your shared files and folders</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : shares.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Share2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No shares yet. Share a file or folder to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {shares.map((share) => {
            const shareUrl = `${window.location.origin}/share/${share.token}`
            const isExpired = share.expiresAt && new Date(share.expiresAt) < new Date()

            return (
              <Card key={share.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5" />
                        Share: {share.token.substring(0, 8)}...
                      </CardTitle>
                      <CardDescription className="mt-2">
                        <div className="flex items-center gap-4 text-xs">
                          {share.isPublic && (
                            <span className="flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              Public
                            </span>
                          )}
                          {share.password && (
                            <span className="flex items-center gap-1">
                              <Lock className="h-3 w-3" />
                              Password Protected
                            </span>
                          )}
                          {share.expiresAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Expires: {formatDate(share.expiresAt)}
                            </span>
                          )}
                          <span>Access Count: {share.accessCount}</span>
                        </div>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyLink(share.token)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Link
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteShare(share.token)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded text-sm font-mono break-all">
                    {shareUrl}
                  </div>
                  {isExpired && (
                    <p className="text-sm text-destructive mt-2">This share has expired</p>
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

