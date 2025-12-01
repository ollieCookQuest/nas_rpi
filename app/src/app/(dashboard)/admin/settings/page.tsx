import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, HardDrive, Info } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">Configure system-wide settings</p>
      </div>

      {/* Storage Settings */}
      <Card className="card-unifi">
        <CardHeader>
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-primary" />
            <CardTitle>Storage Settings</CardTitle>
          </div>
          <CardDescription>Configure storage paths and limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="storage-path">Storage Path</Label>
            <Input
              id="storage-path"
              defaultValue={process.env.STORAGE_PATH || '/data/storage'}
              disabled
              className="input-unifi"
            />
            <p className="text-xs text-muted-foreground">
              Storage path is configured via environment variables
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="max-upload">Max Upload Size</Label>
            <Input
              id="max-upload"
              defaultValue={process.env.UPLOAD_MAX_SIZE || '10737418240'}
              disabled
              className="input-unifi"
            />
            <p className="text-xs text-muted-foreground">
              Maximum file upload size in bytes (default: 10GB)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card className="card-unifi">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            <CardTitle>System Information</CardTitle>
          </div>
          <CardDescription>NAS system information and version</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Version</span>
              <span className="text-sm font-medium">1.0.0</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Environment</span>
              <span className="text-sm font-medium">{process.env.NODE_ENV || 'production'}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Storage Path</span>
              <span className="text-sm font-medium font-mono">{process.env.STORAGE_PATH || '/data/storage'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
