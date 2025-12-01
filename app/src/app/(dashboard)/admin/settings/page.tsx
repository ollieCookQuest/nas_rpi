import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-muted-foreground">Configure system-wide settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Storage Settings</CardTitle>
          <CardDescription>Configure storage paths and limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="storage-path">Storage Path</Label>
            <Input
              id="storage-path"
              defaultValue={process.env.STORAGE_PATH || '/data/storage'}
              disabled
            />
            <p className="text-xs text-muted-foreground mt-1">
              Storage path is configured via environment variables
            </p>
          </div>
          <div>
            <Label htmlFor="max-upload">Max Upload Size</Label>
            <Input
              id="max-upload"
              defaultValue={process.env.UPLOAD_MAX_SIZE || '10737418240'}
              disabled
            />
            <p className="text-xs text-muted-foreground mt-1">
              Maximum file upload size in bytes
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>NAS system information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version:</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Environment:</span>
              <span>{process.env.NODE_ENV || 'production'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

