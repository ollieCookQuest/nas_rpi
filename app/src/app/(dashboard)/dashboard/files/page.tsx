import FileBrowser from '@/components/file-browser/FileBrowser'

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

