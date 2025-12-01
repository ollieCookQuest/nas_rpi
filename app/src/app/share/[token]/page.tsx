'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, File, Folder, Download, Lock, HardDrive, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatBytes, formatDate } from '@/lib/utils'

interface SharedItem {
  file?: {
    filename: string
    path: string
    mimeType: string
    size: number
    createdAt: string
  }
  folder?: {
    name: string
    path: string
    createdAt: string
  }
  share: {
    token: string
    isPublic: boolean
    expiresAt: string | null
    password: string | null
    accessCount: number
  }
}

export default function SharePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const [sharedItem, setSharedItem] = useState<SharedItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [requiresPassword, setRequiresPassword] = useState(false)

  useEffect(() => {
    if (token) {
      fetchSharedItem()
    }
  }, [token])

  const fetchSharedItem = async (submitPassword?: string) => {
    setLoading(true)
    setError(null)
    setRequiresPassword(false)

    let url = `/api/shares/${token}`
    if (submitPassword) {
      url += `?password=${encodeURIComponent(submitPassword)}`
    }

    try {
      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401 && data.requiresPassword) {
          setRequiresPassword(true)
        }
        setError(data.error || 'Failed to load shared item.')
        setSharedItem(null)
        return
      }

      setSharedItem(data)
    } catch (err) {
      console.error('Error fetching shared item:', err)
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchSharedItem(password)
  }

  const handleDownload = async () => {
    if (!sharedItem?.file) return

    try {
      const url = `/api/shares/${token}?password=${encodeURIComponent(password)}`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Download failed')
      
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = sharedItem.file.filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Download error:', err)
      setError('Failed to download file.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading share...</p>
        </div>
      </div>
    )
  }

  if (error && !requiresPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md card-unifi">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (requiresPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                <HardDrive className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gradient-unifi">UniFi Drive</h1>
          </div>
          <Card className="card-unifi">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Password Required
              </CardTitle>
              <CardDescription>This share is password protected</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="share-password">Password</Label>
                  <Input
                    id="share-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    className="input-unifi"
                  />
                </div>
                <Button type="submit" className="w-full btn-unifi">
                  Unlock Share
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!sharedItem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md card-unifi">
          <CardHeader>
            <CardTitle>Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">The shared item could not be found.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const item = sharedItem.file || sharedItem.folder
  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md card-unifi">
          <CardHeader>
            <CardTitle>Invalid Item</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">The shared link points to an invalid item.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
              <HardDrive className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gradient-unifi">UniFi Drive</h1>
        </div>

        <Card className="card-unifi">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {sharedItem.file ? (
                <div className="p-4 rounded-xl bg-primary/10">
                  <File className="h-12 w-12 text-primary" />
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-primary/10">
                  <Folder className="h-12 w-12 text-primary" />
                </div>
              )}
            </div>
            <CardTitle className="text-xl">{item.name || sharedItem.file?.filename || sharedItem.folder?.name}</CardTitle>
            <CardDescription>Shared by a UniFi Drive user</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sharedItem.file && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">{sharedItem.file.mimeType}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Size</span>
                  <span className="font-medium">{formatBytes(sharedItem.file.size)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Uploaded</span>
                  <span className="font-medium">{formatDate(sharedItem.file.createdAt)}</span>
                </div>
              </div>
            )}
            {sharedItem.folder && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium">{formatDate(sharedItem.folder.createdAt)}</span>
                </div>
              </div>
            )}
            {sharedItem.share.expiresAt && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Expires: {formatDate(sharedItem.share.expiresAt)}
                </span>
              </div>
            )}
            {sharedItem.share.password && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-orange-500/10 border border-orange-500/20">
                <Lock className="h-4 w-4 text-orange-400" />
                <span className="text-sm text-orange-400">Password Protected</span>
              </div>
            )}
            {sharedItem.file && (
              <Button onClick={handleDownload} className="w-full btn-unifi" size="lg">
                <Download className="h-4 w-4 mr-2" />
                Download {item.name}
              </Button>
            )}
            {sharedItem.folder && (
              <div className="text-center p-4 rounded-md bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  This is a shared folder. Folder contents can be accessed through the download link.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
