'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { 
  Home, 
  Folder, 
  Search, 
  Activity, 
  Settings, 
  Users, 
  LogOut,
  HardDrive,
  Menu,
  X,
  Share2,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: React.ReactNode
  user?: {
    id: string
    email: string
    username: string
    role: string
  }
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Files', href: '/dashboard/files', icon: Folder },
  { name: 'Shares', href: '/dashboard/shares', icon: Share2 },
  { name: 'Search', href: '/dashboard/search', icon: Search },
  { name: 'Activity', href: '/dashboard/activity', icon: Activity },
]

const adminNavigation = [
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Storage', href: '/admin/storage', icon: HardDrive },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const isAdmin = user?.role === 'ADMIN'

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border/50 transform transition-transform duration-200 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <SidebarContent 
          user={user} 
          isAdmin={isAdmin}
          onLogout={handleLogout}
          onLinkClick={() => setSidebarOpen(false)}
          pathname={pathname}
        />
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 h-16 border-b border-border/50 bg-background/95 backdrop-blur-sm">
          <div className="flex h-full items-center justify-between px-4 lg:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="flex-1" />
            
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 h-auto py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 border border-primary/30">
                        <span className="text-xs font-semibold text-primary">
                          {user.username[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="hidden md:flex flex-col items-start">
                        <span className="text-sm font-medium leading-none">{user.username}</span>
                        <span className="text-xs text-muted-foreground leading-none mt-1">{user.email}</span>
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.username}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

function SidebarContent({ 
  user, 
  isAdmin, 
  onLogout,
  onLinkClick,
  pathname
}: { 
  user?: DashboardLayoutProps['user']
  isAdmin: boolean
  onLogout: () => void
  onLinkClick?: () => void
  pathname: string
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo/Brand */}
      <div className="flex h-16 items-center border-b border-border/50 px-6">
        <Link href="/dashboard" onClick={onLinkClick} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
            <HardDrive className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-base font-bold text-gradient-unifi">UniFi Drive</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Network Storage</div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 p-4 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href))
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
              )} />
              <span>{item.name}</span>
              {isActive && <ChevronRight className="h-4 w-4 ml-auto text-primary" />}
            </Link>
          )
        })}

        {isAdmin && (
          <>
            <div className="my-4 px-3">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Administration
              </div>
            </div>
            {adminNavigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname?.startsWith(item.href)
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onLinkClick}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 group",
                    isActive
                      ? "bg-primary/10 text-primary border-l-2 border-primary"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                  )} />
                  <span>{item.name}</span>
                  {isActive && <ChevronRight className="h-4 w-4 ml-auto text-primary" />}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* User info at bottom */}
      {user && (
        <div className="border-t border-border/50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
              <span className="text-sm font-semibold text-primary">
                {user.username[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.username}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
