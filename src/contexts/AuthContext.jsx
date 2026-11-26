import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured, getSupabaseClient } from '../lib/supabase'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const [supabaseReady, setSupabaseReady] = useState(isSupabaseConfigured)

  const fetchProfile = useCallback(async (userId) => {
    const client = getSupabaseClient()
    if (!client) return
    try {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
      } else if (data) {
        setProfile(data)
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }, [user, fetchProfile])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      setInitialized(true)
      setSupabaseReady(false)
      return
    }

    const initAuth = async () => {
      try {
        const client = getSupabaseClient()
        if (!client) {
          setSupabaseReady(false)
          return
        }
        setSupabaseReady(true)
        const { data: { session } } = await client.auth.getSession()
        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        }
      } catch (err) {
        console.error('Auth init error:', err)
      } finally {
        setLoading(false)
        setInitialized(true)
      }
    }

    initAuth()

    const client = getSupabaseClient()
    if (!client) {
      setSupabaseReady(false)
      return
    }

    const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        await fetchProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signUp = async (email, password) => {
    const client = getSupabaseClient()
    if (!client) return { data: null, error: { message: 'Supabase not configured' } }
    const { data, error } = await client.auth.signUp({ email, password })
    return { data, error }
  }

  const signIn = async (email, password) => {
    const client = getSupabaseClient()
    if (!client) return { data: null, error: { message: 'Supabase not configured' } }
    const { data, error } = await client.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  const signOut = async () => {
    const client = getSupabaseClient()
    if (!client) return { error: { message: 'Supabase not configured' } }
    const { error } = await client.auth.signOut()
    if (!error) {
      setUser(null)
      setProfile(null)
    }
    return { error }
  }

  const updateProfile = async (updates) => {
    const client = getSupabaseClient()
    if (!client || !user) return { error: { message: 'Supabase not configured' } }
    const { data, error } = await client
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    if (!error && data) {
      setProfile(data)
    }
    return { data, error }
  }

  const value = {
    user,
    profile,
    loading,
    initialized,
    supabaseReady,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile,
    isAdmin: profile?.role === 'admin'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}