import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const payload = verifyToken(token || '')

  if (!payload || payload.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return <>{children}</>
}

