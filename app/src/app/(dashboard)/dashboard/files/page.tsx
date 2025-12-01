import FileBrowser from '@/components/file-browser/FileBrowser'

// Force dynamic rendering for file operations
export const dynamic = 'force-dynamic'

export default function FilesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Files</h1>
        <p className="text-muted-foreground">Manage your files and folders</p>
      </div>
      <FileBrowser />
    </div>
  )
}

