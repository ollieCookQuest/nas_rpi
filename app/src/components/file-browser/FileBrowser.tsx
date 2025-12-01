'use client'

import { useState, useEffect } from 'react'
import { 
  Folder, 
  File, 
  Upload, 
  Download, 
  Trash2, 
  Plus, 
  Loader2, 
  Eye,
  Share2,
  MoreVertical,
  Grid3x3,
  List,
  Copy,
  Move,
  Edit,
  ChevronRight,
  Home as HomeIcon
} from 'lucide-react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

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

type ViewMode = 'grid' | 'list'

export default function FileBrowser({ currentPath = '' }: FileBrowserProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [path, setPath] = useState(currentPath)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [renameDialog, setRenameDialog] = useState<{ open: boolean; item: { path: string; name: string; type: 'file' | 'folder' } | null }>({ open: false, item: null })
  const [renameName, setRenameName] = useState('')
  const [shareDialog, setShareDialog] = useState<{ open: boolean; item: { path: string; name: string; type: 'file' | 'folder' } | null }>({ open: false, item: null })
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
      setSelectedItems(new Set())
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
    const filesList = event.target.files
    if (!filesList || filesList.length === 0) return

    setUploading(true)
    try {
      const uploadPromises = Array.from(filesList).map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('path', path)

        const response = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) throw new Error(`Upload failed for ${file.name}`)
        return response.json()
      })

      await Promise.all(uploadPromises)
      await loadFiles(path)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload file(s)')
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

  const handleRename = async () => {
    if (!renameDialog.item || !renameName.trim()) return

    try {
      const response = await fetch('/api/files/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPath: renameDialog.item.path,
          newName: renameName.trim(),
          type: renameDialog.item.type,
        }),
      })

      if (!response.ok) throw new Error('Rename failed')
      
      setRenameDialog({ open: false, item: null })
      setRenameName('')
      await loadFiles(path)
    } catch (error) {
      console.error('Rename error:', error)
      alert('Failed to rename item')
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

  const handleShare = async () => {
    if (!shareDialog.item) return

    try {
      const shareData: any = {
        isPublic: true,
      }

      if (shareDialog.item.type === 'file') {
        shareData.filePath = shareDialog.item.path
      } else {
        shareData.folderPath = shareDialog.item.path
      }

      const response = await fetch('/api/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shareData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Share creation failed')
      }
      
      const data = await response.json()
      await navigator.clipboard.writeText(data.share.url)
      alert('Share link copied to clipboard!')
      setShareDialog({ open: false, item: null })
    } catch (error: any) {
      console.error('Share error:', error)
      alert(error.message || 'Failed to create share')
    }
  }

  const toggleSelection = (itemPath: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemPath)) {
      newSelected.delete(itemPath)
    } else {
      newSelected.add(itemPath)
    }
    setSelectedItems(newSelected)
  }

  const breadcrumbs = path.split('/').filter(Boolean)

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return File
    if (mimeType.startsWith('image/')) return File
    if (mimeType.startsWith('video/')) return File
    if (mimeType.startsWith('audio/')) return File
    return File
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1 text-sm">
          <button
            onClick={() => loadFiles('')}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <HomeIcon className="h-4 w-4" />
          </button>
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-1">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <button
                onClick={() => loadFiles(breadcrumbs.slice(0, index + 1).join('/'))}
                className="px-2 py-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors truncate max-w-[150px]"
              >
                {crumb}
              </button>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 w-8 p-0"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

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
              multiple
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

      {/* File List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {folders.map((folder) => (
            <Card 
              key={folder.path} 
              className={cn(
                "p-4 hover:bg-accent transition-colors cursor-pointer group relative",
                selectedItems.has(folder.path) && "ring-2 ring-primary"
              )}
              onClick={() => handleFolderClick(folder.path)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <Folder className="h-10 w-10 text-primary mb-2" />
                  <p className="font-medium truncate">{folder.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(folder.createdAt)}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      setRenameDialog({ open: true, item: { path: folder.path, name: folder.name, type: 'folder' } })
                      setRenameName(folder.name)
                    }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      setShareDialog({ open: true, item: { path: folder.path, name: folder.name, type: 'folder' } })
                    }}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(folder.path, 'folder')
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}

          {files.map((file) => {
            const FileIcon = getFileIcon(file.mimeType)
            return (
              <Card 
                key={file.path} 
                className={cn(
                  "p-4 hover:bg-accent transition-colors group relative",
                  selectedItems.has(file.path) && "ring-2 ring-primary"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <FileIcon className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {file.size ? formatBytes(file.size) : 'Unknown size'}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {(file.mimeType?.startsWith('image/') || 
                        file.mimeType?.startsWith('video/') || 
                        file.mimeType?.startsWith('audio/')) && (
                        <DropdownMenuItem onClick={() => handlePreview(file)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleDownload(file.path)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setRenameDialog({ open: true, item: { path: file.path, name: file.name, type: 'file' } })
                        setRenameName(file.name)
                      }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        setShareDialog({ open: true, item: { path: file.path, name: file.name, type: 'file' } })
                      }}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDelete(file.path, 'file')}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            )
          })}

          {folders.length === 0 && files.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No files or folders. Upload a file or create a folder to get started.
            </div>
          )}
        </div>
      ) : (
        <Card>
          <div className="divide-y">
            {folders.map((folder) => (
              <div
                key={folder.path}
                className="flex items-center gap-4 p-4 hover:bg-accent transition-colors cursor-pointer group"
                onClick={() => handleFolderClick(folder.path)}
              >
                <Folder className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{folder.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(folder.createdAt)}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      setRenameDialog({ open: true, item: { path: folder.path, name: folder.name, type: 'folder' } })
                      setRenameName(folder.name)
                    }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      setShareDialog({ open: true, item: { path: folder.path, name: folder.name, type: 'folder' } })
                    }}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(folder.path, 'folder')
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}

            {files.map((file) => {
              const FileIcon = getFileIcon(file.mimeType)
              return (
                <div
                  key={file.path}
                  className="flex items-center gap-4 p-4 hover:bg-accent transition-colors group"
                >
                  <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {file.size ? formatBytes(file.size) : 'Unknown size'} • {formatDate(file.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {(file.mimeType?.startsWith('image/') || 
                      file.mimeType?.startsWith('video/') || 
                      file.mimeType?.startsWith('audio/')) && (
                      <Button variant="ghost" size="icon" onClick={() => handlePreview(file)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleDownload(file.path)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setRenameDialog({ open: true, item: { path: file.path, name: file.name, type: 'file' } })
                          setRenameName(file.name)
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setShareDialog({ open: true, item: { path: file.path, name: file.name, type: 'file' } })
                        }}>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDelete(file.path, 'file')}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}

            {folders.length === 0 && files.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No files or folders. Upload a file or create a folder to get started.
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Rename Dialog */}
      <Dialog open={renameDialog.open} onOpenChange={(open) => setRenameDialog({ open, item: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename {renameDialog.item?.type}</DialogTitle>
            <DialogDescription>Enter a new name</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rename-name">Name</Label>
              <Input
                id="rename-name"
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename()
                }}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRenameDialog({ open: false, item: null })}>
                Cancel
              </Button>
              <Button onClick={handleRename}>Rename</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialog.open} onOpenChange={(open) => setShareDialog({ open, item: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share {shareDialog.item?.name}</DialogTitle>
            <DialogDescription>Create a shareable link</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShareDialog({ open: false, item: null })}>
                Cancel
              </Button>
              <Button onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Create Share Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Media Viewer */}
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
