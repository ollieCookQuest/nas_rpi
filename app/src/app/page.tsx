import { redirect } from 'next/navigation'
import { auth } from '@/auth'

// Force dynamic rendering since we use auth() which reads cookies
export const dynamic = 'force-dynamic'

export default async function Home() {
  const session = await auth()
  
  if (session?.user) {
    redirect('/dashboard')
  }
  
  redirect('/login')
}

