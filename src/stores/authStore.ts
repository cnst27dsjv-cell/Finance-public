import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  isGuest: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  enterGuestMode: () => void
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isGuest: false,
      loading: true,

      initialize: async () => {
        const { data: { session } } = await supabase.auth.getSession()
        set({ session, user: session?.user ?? null, loading: false })

        supabase.auth.onAuthStateChange((_event, session) => {
          set({ session, user: session?.user ?? null })
        })
      },

      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) return { error: error.message }
        set({ isGuest: false })
        return { error: null }
      },

      signUp: async (email, password) => {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) return { error: error.message }
        set({ isGuest: false })
        return { error: null }
      },

      signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null, session: null, isGuest: false })
      },

      enterGuestMode: () => {
        set({ isGuest: true, user: null, session: null })
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ isGuest: state.isGuest }),
    }
  )
)
