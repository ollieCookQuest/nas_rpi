import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export async function getSession() {
  const session = await auth()
  
  if (!session?.user) {
    return null
  }
  
  return session
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

