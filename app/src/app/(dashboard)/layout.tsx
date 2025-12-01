import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'

// Force dynamic rendering since we use auth() which reads cookies
export const dynamic = 'force-dynamic'

export default async function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const session = await auth()

    if (!session?.user) {
      redirect('/login')
    }

    // Ensure we have the required user properties
    if (!session.user.id || !session.user.role) {
      console.error('Invalid session structure:', session)
      redirect('/login')
    }

    const user = {
      id: session.user.id,
      email: session.user.email || '',
      username: session.user.name || session.user.email?.split('@')[0] || 'User',
      role: session.user.role,
    }

    return <DashboardLayout user={user}>{children}</DashboardLayout>
  } catch (error: any) {
    console.error('Dashboard layout error:', error)
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
    })
    redirect('/login')
  }
}

