import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default async function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const user = {
    id: session.user.id,
    email: session.user.email || '',
    username: session.user.name || '',
    role: session.user.role,
  }

  return <DashboardLayout user={user}>{children}</DashboardLayout>
}

