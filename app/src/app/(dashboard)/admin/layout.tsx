import { auth } from '@/auth'
import { redirect } from 'next/navigation'

// Force dynamic rendering since we use auth() which reads cookies
export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return <>{children}</>
}

