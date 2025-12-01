'use client'

import { useState, useEffect } from 'react'
import { Network, Plus, Loader2, Trash2, Edit, Copy, Server, Lock, Info, ChevronDown, Terminal, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface NasShare {
  id: string
  name: string
  path: string
  protocol: 'NFS' | 'SMB'
  permissions: 'READ_ONLY' | 'READ_WRITE'
  enabled: boolean
  description: string | null
  allowedIPs: string | null
  createdAt: string
  updatedAt: string
}

export default function NasSharesPage() {
  const [shares, setShares] = useState<NasShare[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingShare, setEditingShare] = useState<NasShare | null>(null)
  const [connectionGuideShare, setConnectionGuideShare] = useState<NasShare | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    path: '',
    protocol: 'NFS' as 'NFS' | 'SMB',
    permissions: 'READ_WRITE' as 'READ_ONLY' | 'READ_WRITE',
    description: '',
    allowedIPs: '',
    enabled: true,
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadShares()
  }, [])

  const loadShares = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/nas-shares')
      if (!response.ok) throw new Error('Failed to load NAS shares')
      const data = await response.json()
      setShares(data.shares || [])
    } catch (error) {
      console.error('Error loading NAS shares:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrUpdate = async () => {
    setSubmitting(true)
    try {
      const payload = {
        ...formData,
        description: formData.description || null,
        allowedIPs: formData.allowedIPs || null,
      }

      const url = editingShare ? `/api/nas-shares/${editingShare.id}` : '/api/nas-shares'
      const method = editingShare ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Failed to save NAS share')
        return
      }

      resetForm()
      await loadShares()
    } catch (error) {
      console.error('Error saving NAS share:', error)
      alert('Failed to save NAS share')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (share: NasShare) => {
    setEditingShare(share)
    setFormData({
      name: share.name,
      path: share.path,
      protocol: share.protocol,
      permissions: share.permissions,
      description: share.description || '',
      allowedIPs: share.allowedIPs || '',
      enabled: share.enabled,
    })
    setShowDialog(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the NAS share "${name}"?`)) return

    try {
      const response = await fetch(`/api/nas-shares/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete NAS share')
      
      await loadShares()
    } catch (error) {
      console.error('Error deleting NAS share:', error)
      alert('Failed to delete NAS share')
    }
  }

  const handleCopyMountCommand = (share: NasShare, os: 'linux' | 'mac' | 'windows') => {
    const serverIP = window.location.hostname || 'localhost'
    let command = ''
    
    if (share.protocol === 'NFS') {
      if (os === 'linux' || os === 'mac') {
        command = `sudo mount -t nfs ${serverIP}:${share.path} /mnt/${share.name}`
      } else {
        // Windows NFS client
        command = `mount \\\\${serverIP}\\${share.path} Z:`
      }
    } else {
      // SMB/CIFS
      if (os === 'linux') {
        command = `sudo mount -t cifs //${serverIP}/${share.name} /mnt/${share.name} -o username=guest,uid=$(id -u),gid=$(id -g)`
      } else if (os === 'mac') {
        command = `mount_smbfs //guest@${serverIP}/${share.name} /Volumes/${share.name}`
      } else {
        // Windows
        command = `net use Z: \\\\${serverIP}\\${share.name} /user:guest`
      }
    }
    
    navigator.clipboard.writeText(command)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      path: '',
      protocol: 'NFS',
      permissions: 'READ_WRITE',
      description: '',
      allowedIPs: '',
      enabled: true,
    })
    setEditingShare(null)
    setShowDialog(false)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">NAS Shares</h1>
          <p className="text-muted-foreground">Manage network file shares (NFS/SMB)</p>
        </div>

        <Dialog open={showDialog} onOpenChange={(open) => {
          setShowDialog(open)
          if (!open) {
            resetForm()
          }
        }}>
          <DialogTrigger asChild>
            <Button className="btn-unifi" onClick={() => setShowDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Share
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingShare ? 'Edit' : 'Create'} NAS Share</DialogTitle>
              <DialogDescription>
                {editingShare ? 'Update network share settings' : 'Create a new network file share accessible via NFS or SMB'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label htmlFor="name">Share Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Media, Documents, Backup"
                  className="input-unifi"
                />
                <p className="text-xs text-muted-foreground">Unique identifier for this share</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="path">Path *</Label>
                <Input
                  id="path"
                  value={formData.path}
                  onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                  placeholder="/data/storage/media or media"
                  className="input-unifi"
                />
                <p className="text-xs text-muted-foreground">Absolute path or relative to storage root</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="protocol">Protocol *</Label>
                  <select
                    id="protocol"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm input-unifi"
                    value={formData.protocol}
                    onChange={(e) => setFormData({ ...formData, protocol: e.target.value as 'NFS' | 'SMB' })}
                  >
                    <option value="NFS">NFS</option>
                    <option value="SMB">SMB (CIFS)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="permissions">Permissions *</Label>
                  <select
                    id="permissions"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm input-unifi"
                    value={formData.permissions}
                    onChange={(e) => setFormData({ ...formData, permissions: e.target.value as 'READ_ONLY' | 'READ_WRITE' })}
                  >
                    <option value="READ_ONLY">Read Only</option>
                    <option value="READ_WRITE">Read/Write</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  className="input-unifi"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="allowedIPs">Allowed IPs/CIDR (optional)</Label>
                <Input
                  id="allowedIPs"
                  value={formData.allowedIPs}
                  onChange={(e) => setFormData({ ...formData, allowedIPs: e.target.value })}
                  placeholder="192.168.1.0/24, 10.0.0.1"
                  className="input-unifi"
                />
                <p className="text-xs text-muted-foreground">Comma-separated IP addresses or CIDR ranges</p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enabled"
                  checked={formData.enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked === true })}
                />
                <Label htmlFor="enabled" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Enabled
                </Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setShowDialog(false)
                  resetForm()
                }}>
                  Cancel
                </Button>
                <Button onClick={handleCreateOrUpdate} disabled={submitting || !formData.name || !formData.path} className="btn-unifi">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingShare ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : shares.length === 0 ? (
        <Card className="card-unifi">
          <CardContent className="py-12 text-center space-y-4">
            <Network className="h-12 w-12 text-muted-foreground/50 mx-auto" />
            <div className="space-y-2">
              <p className="text-sm font-medium">No NAS shares configured</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Create a network share to make directories accessible via NFS or SMB protocols.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {shares.map((share) => (
            <Card key={share.id} className="card-unifi">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Network className="h-5 w-5 text-primary" />
                      {share.name}
                      {!share.enabled && (
                        <span className="px-2 py-0.5 text-xs rounded-md bg-muted text-muted-foreground">
                          Disabled
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2 space-y-1">
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted">
                          <Server className="h-3 w-3" />
                          {share.protocol}
                        </span>
                        <span className="px-2 py-1 rounded-md bg-muted">
                          {share.permissions.replace('_', ' ')}
                        </span>
                        {share.allowedIPs && (
                          <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted">
                            <Lock className="h-3 w-3" />
                            IP Restricted
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 font-mono">{share.path}</p>
                      {share.description && (
                        <p className="text-xs text-muted-foreground">{share.description}</p>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="btn-unifi">
                        <Info className="h-4 w-4 mr-2" />
                        Connection Guide
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <DropdownMenuItem onClick={() => setConnectionGuideShare(share)}>
                        <Monitor className="h-4 w-4 mr-2" />
                        View Connection Guide
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="btn-unifi">
                        <Terminal className="h-4 w-4 mr-2" />
                        Copy Mount Command
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <DropdownMenuItem onClick={() => { handleCopyMountCommand(share, 'linux'); alert('Linux command copied!') }}>
                        Linux
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { handleCopyMountCommand(share, 'mac'); alert('macOS command copied!') }}>
                        macOS
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { handleCopyMountCommand(share, 'windows'); alert('Windows command copied!') }}>
                        Windows
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(share)}
                    className="btn-unifi"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(share.id, share.name)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Connection Guide Dialog */}
      <Dialog open={!!connectionGuideShare} onOpenChange={(open) => !open && setConnectionGuideShare(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {connectionGuideShare && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5 text-primary" />
                  Connection Guide: {connectionGuideShare.name}
                </DialogTitle>
                <DialogDescription>
                  How to connect to this NAS share via {connectionGuideShare.protocol} protocol
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="ui" className="mt-4">
                <TabsList>
                  <TabsTrigger value="ui">
                    <Monitor className="h-4 w-4 mr-2" />
                    GUI Method
                  </TabsTrigger>
                  <TabsTrigger value="cli">
                    <Terminal className="h-4 w-4 mr-2" />
                    Command Line
                  </TabsTrigger>
                </TabsList>

                {connectionGuideShare.protocol === 'NFS' ? (
                  <>
                    <TabsContent value="ui" className="space-y-4 mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Linux (GNOME/KDE)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                            <li>Open your file manager (Nautilus, Dolphin, etc.)</li>
                            <li>Press <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+L</kbd> to show the location bar</li>
                            <li>Type: <code className="px-2 py-1 bg-muted rounded text-xs font-mono">{window.location.hostname}:{connectionGuideShare.path}</code></li>
                            <li>Press Enter and authenticate if prompted</li>
                            <li>The share will mount and appear in your file manager</li>
                          </ol>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">macOS Finder</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                            <li>Open Finder</li>
                            <li>Press <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Cmd+K</kbd> or go to <strong>Go → Connect to Server</strong></li>
                            <li>Enter: <code className="px-2 py-1 bg-muted rounded text-xs font-mono">nfs://{window.location.hostname}{connectionGuideShare.path}</code></li>
                            <li>Click <strong>Connect</strong></li>
                            <li>The share will appear in Finder sidebar and on your desktop</li>
                          </ol>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Windows</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="space-y-2">
                            <p className="text-muted-foreground">First, enable NFS Client:</p>
                            <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-4">
                              <li>Open <strong>Control Panel → Programs → Turn Windows features on or off</strong></li>
                              <li>Check <strong>Services for NFS</strong> and click OK</li>
                              <li>Restart if prompted</li>
                            </ol>
                            <p className="text-muted-foreground mt-4">Then mount the share:</p>
                            <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-4">
                              <li>Open <strong>This PC</strong></li>
                              <li>Click <strong>Map network drive</strong></li>
                              <li>Select a drive letter (e.g., Z:)</li>
                              <li>Enter: <code className="px-2 py-1 bg-muted rounded text-xs font-mono">\\{window.location.hostname}\{connectionGuideShare.path.replace(/\//g, '$')}</code></li>
                              <li>Check <strong>Reconnect at sign-in</strong> if desired</li>
                              <li>Click <strong>Finish</strong></li>
                            </ol>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="cli" className="space-y-4 mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center justify-between">
                            Linux
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { handleCopyMountCommand(connectionGuideShare, 'linux'); alert('Command copied!') }}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="bg-muted p-3 rounded-md">
                            <code className="text-sm">
                              sudo mkdir -p /mnt/{connectionGuideShare.name}<br />
                              sudo mount -t nfs {window.location.hostname}:{connectionGuideShare.path} /mnt/{connectionGuideShare.name}
                            </code>
                          </div>
                          <p className="text-xs text-muted-foreground">To mount automatically on boot, add to <code className="bg-muted px-1 rounded">/etc/fstab</code>:</p>
                          <div className="bg-muted p-3 rounded-md">
                            <code className="text-sm">
                              {window.location.hostname}:{connectionGuideShare.path} /mnt/{connectionGuideShare.name} nfs defaults 0 0
                            </code>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center justify-between">
                            macOS / Darwin
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { handleCopyMountCommand(connectionGuideShare, 'mac'); alert('Command copied!') }}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="bg-muted p-3 rounded-md">
                            <code className="text-sm">
                              sudo mkdir -p /Volumes/{connectionGuideShare.name}<br />
                              sudo mount -t nfs {window.location.hostname}:{connectionGuideShare.path} /Volumes/{connectionGuideShare.name}
                            </code>
                          </div>
                          <p className="text-xs text-muted-foreground">Or using the nfs:// protocol:</p>
                          <div className="bg-muted p-3 rounded-md">
                            <code className="text-sm">
                              mount -t nfs nfs://{window.location.hostname}{connectionGuideShare.path} /Volumes/{connectionGuideShare.name}
                            </code>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center justify-between">
                            Windows (PowerShell / CMD)
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { handleCopyMountCommand(connectionGuideShare, 'windows'); alert('Command copied!') }}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="bg-muted p-3 rounded-md">
                            <code className="text-sm">
                              mount \\{window.location.hostname}\{connectionGuideShare.path.replace(/\//g, '$')} Z:
                            </code>
                          </div>
                          <p className="text-xs text-muted-foreground">Replace Z: with your desired drive letter. Requires NFS Client enabled.</p>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </>
                ) : (
                  <>
                    <TabsContent value="ui" className="space-y-4 mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Windows File Explorer</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                            <li>Open <strong>File Explorer</strong></li>
                            <li>In the address bar, type: <code className="px-2 py-1 bg-muted rounded text-xs font-mono">\\{window.location.hostname}</code></li>
                            <li>Press Enter</li>
                            <li>Double-click the share name: <strong>{connectionGuideShare.name}</strong></li>
                            <li>If prompted, enter credentials (or use guest access)</li>
                            <li>To map as a drive: Right-click the share → <strong>Map network drive</strong></li>
                          </ol>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">macOS Finder</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                            <li>Open Finder</li>
                            <li>Press <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Cmd+K</kbd> or go to <strong>Go → Connect to Server</strong></li>
                            <li>Enter: <code className="px-2 py-1 bg-muted rounded text-xs font-mono">smb://{window.location.hostname}/{connectionGuideShare.name}</code></li>
                            <li>Click <strong>Connect</strong></li>
                            <li>Choose <strong>Registered User</strong> or <strong>Guest</strong></li>
                            <li>Enter credentials if required and click <strong>Connect</strong></li>
                            <li>The share will appear in Finder sidebar</li>
                          </ol>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Linux (GNOME Files/Nautilus)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                            <li>Open your file manager</li>
                            <li>In the sidebar, look for <strong>Other Locations</strong> or <strong>Network</strong></li>
                            <li>In the address bar, type: <code className="px-2 py-1 bg-muted rounded text-xs font-mono">smb://{window.location.hostname}/{connectionGuideShare.name}</code></li>
                            <li>Press Enter</li>
                            <li>Enter credentials or connect as guest</li>
                            <li>The share will mount and appear in your file manager</li>
                          </ol>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="cli" className="space-y-4 mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center justify-between">
                            Linux
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { handleCopyMountCommand(connectionGuideShare, 'linux'); alert('Command copied!') }}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <p className="text-xs text-muted-foreground mb-2">Install CIFS utilities if needed:</p>
                          <div className="bg-muted p-3 rounded-md mb-3">
                            <code className="text-sm">
                              sudo apt-get install cifs-utils  # Debian/Ubuntu<br />
                              sudo yum install cifs-utils      # RHEL/CentOS
                            </code>
                          </div>
                          <p className="text-xs text-muted-foreground">Mount the share:</p>
                          <div className="bg-muted p-3 rounded-md">
                            <code className="text-sm">
                              sudo mkdir -p /mnt/{connectionGuideShare.name}<br />
                              sudo mount -t cifs //{window.location.hostname}/{connectionGuideShare.name} /mnt/{connectionGuideShare.name} -o username=guest,uid=$(id -u),gid=$(id -g)
                            </code>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">For permanent mount, add to <code className="bg-muted px-1 rounded">/etc/fstab</code>:</p>
                          <div className="bg-muted p-3 rounded-md">
                            <code className="text-sm">
                              //{window.location.hostname}/{connectionGuideShare.name} /mnt/{connectionGuideShare.name} cifs username=guest,uid=1000,gid=1000,iocharset=utf8 0 0
                            </code>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center justify-between">
                            macOS / Darwin
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { handleCopyMountCommand(connectionGuideShare, 'mac'); alert('Command copied!') }}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="bg-muted p-3 rounded-md">
                            <code className="text-sm">
                              mkdir -p /Volumes/{connectionGuideShare.name}<br />
                              mount_smbfs //guest@{window.location.hostname}/{connectionGuideShare.name} /Volumes/{connectionGuideShare.name}
                            </code>
                          </div>
                          <p className="text-xs text-muted-foreground">Or using the smb:// protocol:</p>
                          <div className="bg-muted p-3 rounded-md">
                            <code className="text-sm">
                              mount -t smbfs smb://guest@{window.location.hostname}/{connectionGuideShare.name} /Volumes/{connectionGuideShare.name}
                            </code>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center justify-between">
                            Windows (PowerShell / CMD)
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { handleCopyMountCommand(connectionGuideShare, 'windows'); alert('Command copied!') }}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="bg-muted p-3 rounded-md">
                            <code className="text-sm">
                              net use Z: \\{window.location.hostname}\{connectionGuideShare.name} /user:guest
                            </code>
                          </div>
                          <p className="text-xs text-muted-foreground">Replace Z: with your desired drive letter. To disconnect:</p>
                          <div className="bg-muted p-3 rounded-md">
                            <code className="text-sm">
                              net use Z: /delete
                            </code>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </>
                )}
              </Tabs>

              <div className="mt-4 p-3 bg-muted/50 rounded-md">
                <p className="text-xs text-muted-foreground">
                  <strong>Server:</strong> {window.location.hostname} | <strong>Share:</strong> {connectionGuideShare.name} | <strong>Protocol:</strong> {connectionGuideShare.protocol}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

