import { auth } from '@/auth'

// Force dynamic rendering since we use auth() which reads cookies
export const dynamic = 'force-dynamic'

export default async function TestAuthPage() {
  try {
    const session = await auth()
    
    return (
      <div style={{ padding: '20px', fontFamily: 'monospace' }}>
        <h1>Auth Test Page</h1>
        <h2>Session:</h2>
        <pre>{JSON.stringify(session, null, 2)}</pre>
        <h2>Environment Variables:</h2>
        <pre>
          AUTH_SECRET: {process.env.AUTH_SECRET ? 'SET' : 'NOT SET'}
          JWT_SECRET: {process.env.JWT_SECRET ? 'SET' : 'NOT SET'}
          NEXTAUTH_URL: {process.env.NEXTAUTH_URL || 'NOT SET'}
        </pre>
      </div>
    )
  } catch (error: any) {
    return (
      <div style={{ padding: '20px', fontFamily: 'monospace', color: 'red' }}>
        <h1>Auth Test Error</h1>
        <pre>{error?.message}</pre>
        <pre>{error?.stack}</pre>
      </div>
    )
  }
}

