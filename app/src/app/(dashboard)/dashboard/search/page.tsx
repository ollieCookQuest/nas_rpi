'use client'

import { useState } from 'react'
import { Search, File, Folder, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatBytes, formatDate } from '@/lib/utils'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState<'all' | 'file' | 'folder'>('all')
  const [files, setFiles] = useState<any[]>([])
  const [folders, setFolders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&type=${searchType}`
      )
      if (!response.ok) throw new Error('Search failed')
      const data = await response.json()
      setFiles(data.files || [])
      setFolders(data.folders || [])
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Search</h1>
        <p className="text-muted-foreground">Search for files and folders</p>
      </div>

      {/* Search Bar */}
      <Card className="card-unifi">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files and folders..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 input-unifi"
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={loading || !query.trim()}
              className="btn-unifi"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs value={searchType} onValueChange={(v) => setSearchType(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="file">Files</TabsTrigger>
            <TabsTrigger value="folder">Folders</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-4">
            {folders.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                  Folders
                </h2>
                <div className="grid gap-2">
                  {folders.map((folder) => (
                    <Card key={folder.id} className="card-unifi">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-md bg-primary/10">
                            <Folder className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{folder.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(folder.createdAt)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {files.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                  Files
                </h2>
                <div className="grid gap-2">
                  {files.map((file) => (
                    <Card key={file.id} className="card-unifi">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-md bg-muted/30">
                            <File className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.filename}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatBytes(file.size)} • {formatDate(file.createdAt)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {files.length === 0 && folders.length === 0 && query && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">No results found</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="file" className="mt-4">
            <div className="grid gap-2">
              {files.map((file) => (
                <Card key={file.id} className="card-unifi">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-md bg-muted/30">
                        <File className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.filename}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(file.size)} • {formatDate(file.createdAt)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {files.length === 0 && (
                <div className="text-center py-12">
                  <File className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">No files found</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="folder" className="mt-4">
            <div className="grid gap-2">
              {folders.map((folder) => (
                <Card key={folder.id} className="card-unifi">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-md bg-primary/10">
                        <Folder className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{folder.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(folder.createdAt)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {folders.length === 0 && (
                <div className="text-center py-12">
                  <Folder className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">No folders found</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
