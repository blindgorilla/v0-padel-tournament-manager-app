'use client'

import { BottomNav } from '@/components/bottom-nav'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="max-w-lg mx-auto px-4 py-6">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
