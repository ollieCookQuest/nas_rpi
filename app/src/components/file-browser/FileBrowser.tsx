'use client'

import { useState, useEffect } from 'react'
import { Folder, File, Upload, Download, Trash2, Plus, Loader2, Eye } from 'lucide-react'
import MediaViewer from '@/components/media-player/MediaViewer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatBytes, formatDate } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface FileItem {
  name: string
  path: string
  size?: number
  mimeType?: string
  createdAt: string
}

interface FolderItem {
  name: string
  path: string
  createdAt: string
}

interface FileBrowserProps {
  currentPath?: string
}

export default function FileBrowser({ currentPath = '' }: FileBrowserProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [path, setPath] = useState(currentPath)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [mediaViewer, setMediaViewer] = useState<{
    src: string
    type: 'image' | 'video' | 'audio'
    filename: string
  } | null>(null)

  const loadFiles = async (folderPath: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/files/list?path=${encodeURIComponent(folderPath)}`)
      if (!response.ok) throw new Error('Failed to load files')
      const data = await response.json()
      setFiles(data.files || [])
      setFolders(data.folders || [])
      setPath(data.path || '')
    } catch (error) {
      console.error('Error loading files:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFiles(path)
  }, [])

  const handleFolderClick = (folderPath: string) => {
    loadFiles(folderPath)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('path', path)

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Upload failed')
      
      await loadFiles(path)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload file')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handlePreview = async (file: FileItem) => {
    const mimeType = file.mimeType || ''
    if (mimeType.startsWith('image/')) {
      const viewUrl = `/api/files/view?path=${encodeURIComponent(file.path)}`
      setMediaViewer({ src: viewUrl, type: 'image', filename: file.name })
    } else if (mimeType.startsWith('video/')) {
      const viewUrl = `/api/files/view?path=${encodeURIComponent(file.path)}`
      setMediaViewer({ src: viewUrl, type: 'video', filename: file.name })
    } else if (mimeType.startsWith('audio/')) {
      const viewUrl = `/api/files/view?path=${encodeURIComponent(file.path)}`
      setMediaViewer({ src: viewUrl, type: 'audio', filename: file.name })
    }
  }

  const handleDownload = async (filePath: string) => {
    try {
      const response = await fetch(`/api/files/download?path=${encodeURIComponent(filePath)}`)
      if (!response.ok) throw new Error('Download failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filePath.split('/').pop() || 'download'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download file')
    }
  }

  const handleDelete = async (itemPath: string, type: 'file' | 'folder') => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return

    try {
      const response = await fetch(
        `/api/files/delete?path=${encodeURIComponent(itemPath)}&type=${type}`,
        { method: 'DELETE' }
      )

      if (!response.ok) throw new Error('Delete failed')
      
      await loadFiles(path)
    } catch (error) {
      console.error('Delete error:', error)
      alert(`Failed to delete ${type}`)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      const response = await fetch('/api/files/folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName, path }),
      })

      if (!response.ok) throw new Error('Failed to create folder')
      
      setNewFolderName('')
      setShowNewFolderDialog(false)
      await loadFiles(path)
    } catch (error) {
      console.error('Create folder error:', error)
      alert('Failed to create folder')
    }
  }

  const breadcrumbs = path.split('/').filter(Boolean)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button
            onClick={() => loadFiles('')}
            className="hover:text-foreground"
          >
            Home
          </button>
          {breadcrumbs.map((crumb, index) => (
            <span key={index}>
              <span className="mx-2">/</span>
              <button
                onClick={() => loadFiles(breadcrumbs.slice(0, index + 1).join('/'))}
                className="hover:text-foreground"
              >
                {crumb}
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
                <DialogDescription>Enter a name for the new folder</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="folder-name">Folder Name</Label>
                  <Input
                    id="folder-name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="My New Folder"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateFolder()
                    }}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateFolder}>Create</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <label>
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <Button variant="default" size="sm" disabled={uploading} asChild>
              <span>
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Upload
              </span>
            </Button>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {folders.map((folder) => (
            <Card key={folder.path} className="p-4 hover:bg-accent transition-colors">
              <div className="flex items-start justify-between">
                <button
                  onClick={() => handleFolderClick(folder.path)}
                  className="flex-1 text-left"
                >
                  <Folder className="h-8 w-8 text-primary mb-2" />
                  <p className="font-medium truncate">{folder.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(folder.createdAt)}
                  </p>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDelete(folder.path, 'folder')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}

          {files.map((file) => (
            <Card key={file.path} className="p-4 hover:bg-accent transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <File className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {file.size ? formatBytes(file.size) : 'Unknown size'}
                  </p>
                </div>
                <div className="flex gap-1">
                  {(file.mimeType?.startsWith('image/') || 
                    file.mimeType?.startsWith('video/') || 
                    file.mimeType?.startsWith('audio/')) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handlePreview(file)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDownload(file.path)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDelete(file.path, 'file')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {folders.length === 0 && files.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No files or folders. Upload a file or create a folder to get started.
            </div>
          )}
        </div>
      )}

      {mediaViewer && (
        <MediaViewer
          src={mediaViewer.src}
          type={mediaViewer.type}
          filename={mediaViewer.filename}
          open={!!mediaViewer}
          onOpenChange={(open) => !open && setMediaViewer(null)}
        />
      )}
    </div>
  )
}

