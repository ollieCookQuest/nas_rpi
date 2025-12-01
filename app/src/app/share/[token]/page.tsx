import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const share = await prisma.share.findUnique({
    where: { token },
  })

  if (!share) {
    redirect('/login?error=share_not_found')
  }

  // Check if expired
  if (share.expiresAt && new Date() > share.expiresAt) {
    redirect('/login?error=share_expired')
  }

  // If password protected, show password form
  // Otherwise redirect to download/view
  if (share.password) {
    // TODO: Show password form
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4">
        <div className="w-full max-w-md">
          <div className="bg-card p-6 rounded-lg">
            <h1 className="text-2xl font-bold mb-4">Share Protected</h1>
            <p className="text-muted-foreground mb-4">This share requires a password.</p>
            {/* TODO: Implement password form */}
          </div>
        </div>
      </div>
    )
  }

  // Redirect to API endpoint for download
  redirect(`/api/shares/${token}`)
}

