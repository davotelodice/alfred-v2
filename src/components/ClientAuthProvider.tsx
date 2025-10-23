'use client'

import { AuthProvider } from './AuthProvider'

export function ClientAuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
