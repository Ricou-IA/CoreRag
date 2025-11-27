import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import * as supabaseHelpers from '../lib/supabaseClient'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [organization, setOrganization] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const profileLoadedRef = useRef(false)
  const loadingProfileRef = useRef(false)
  const signingUpRef = useRef(false)
  const loadUserProfile = useCallback(async (userId) => {
    if (loadingProfileRef.current) {
      return
    }
    
    loadingProfileRef.current = true
    
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          setProfile(null)
          setOrganization(null)
          profileLoadedRef.current = true
          return
        }
        throw profileError
      }

      setProfile(profileData)

      if (profileData?.org_id) {
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profileData.org_id)
          .single()

        if (!orgError) {
          setOrganization(orgData)
        }
      }
      
      profileLoadedRef.current = true
    } catch (err) {
      setError(err.message)
      profileLoadedRef.current = true
    } finally {
      loadingProfileRef.current = false
    }
  }, [])

  useEffect(() => {
    let mounted = true
    
    const initSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        setSession(initialSession)
        setUser(initialSession?.user ?? null)

        if (initialSession?.user) {
          await loadUserProfile(initialSession.user.id)
        }
      } catch (err) {
        if (mounted) setError(err.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return
        
        setSession(newSession)
        setUser(newSession?.user ?? null)

        if (event === 'SIGNED_IN' && newSession?.user) {
          profileLoadedRef.current = false
          loadingProfileRef.current = false
          
          setTimeout(async () => {
            if (mounted) {
              await loadUserProfile(newSession.user.id)
              setLoading(false)
            }
          }, 1000)
        } else if (event === 'SIGNED_OUT') {
          setProfile(null)
          setOrganization(null)
          profileLoadedRef.current = false
          loadingProfileRef.current = false
          setLoading(false)
        } else {
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [loadUserProfile])

  const signUp = async (email, password, metadata = {}) => {
    if (signingUpRef.current) {
      return { data: null, error: { message: 'Une inscription est déjà en cours.' } }
    }

    signingUpRef.current = true
    setLoading(true)

    try {
      if (supabaseHelpers.checkEmailExists && typeof supabaseHelpers.checkEmailExists === 'function') {
        try {
          const emailExists = await supabaseHelpers.checkEmailExists(email)
          
          if (emailExists === true) {
            const errorMessage = 'Un compte existe déjà avec cet email. Veuillez vous connecter ou utiliser la réinitialisation de mot de passe.'
            setError(errorMessage)
            signingUpRef.current = false
            setLoading(false)
            
            return {
              data: null,
              error: {
                message: errorMessage,
                code: 'EMAIL_EXISTS'
              }
            }
          }
        } catch (checkErr) {
          // Continue l'inscription même si la vérification échoue
        }
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      })

      if (error) {
        const errorMessage = error.message || ''
        const errorStatus = error.status || error.code || ''
        const errorLower = errorMessage.toLowerCase()
        
        const isEmailExists = 
          errorStatus === 422 || 
          errorStatus === 400 ||
          errorLower.includes('already') ||
          errorLower.includes('exists') ||
          errorLower.includes('registered') ||
          errorLower.includes('duplicate') ||
          errorMessage === 'User already registered' ||
          errorMessage === 'Email already registered' ||
          errorMessage === 'A user with this email already exists'

        if (isEmailExists) {
          return { 
            data: null, 
            error: { 
              message: 'Un compte existe déjà avec cet email. Veuillez vous connecter ou utiliser la réinitialisation de mot de passe.',
              code: 'EMAIL_EXISTS',
              originalError: error
            } 
          }
        }
        
        return { data: null, error: error }
      }

      signingUpRef.current = false
      return { data, error: null }
    } catch (err) {
      const errorMessage = err?.message || 'Une erreur inattendue s\'est produite.'
      setError(errorMessage)
      signingUpRef.current = false
      return { 
        data: null, 
        error: { 
          message: errorMessage,
          code: 'UNKNOWN_ERROR'
        } 
      }
    } finally {
      setLoading(false)
      signingUpRef.current = false
    }
  }

  const signIn = async (email, password) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      return { data, error: null }
    } catch (err) {
      setError(err.message)
      return { data: null, error: err }
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (error) throw error

      return { data, error: null }
    } catch (err) {
      setError(err.message)
      return { data: null, error: err }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      setSession(null)
      setProfile(null)
      setOrganization(null)
      profileLoadedRef.current = false

      return { error: null }
    } catch (err) {
      setError(err.message)
      return { error: err }
    } finally {
      setLoading(false)
    }
  }

  const refreshProfile = async () => {
    if (user?.id) {
      profileLoadedRef.current = false
      loadingProfileRef.current = false
      await loadUserProfile(user.id)
    }
  }

  const resetPassword = async (email) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      return { data, error: null }
    } catch (err) {
      setError(err.message)
      return { data: null, error: err }
    } finally {
      setLoading(false)
    }
  }

  const updatePassword = async (newPassword) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      return { data, error: null }
    } catch (err) {
      setError(err.message)
      return { data: null, error: err }
    } finally {
      setLoading(false)
    }
  }

  const clearError = () => {
    setError(null)
  }

  const value = {
    user,
    session,
    profile,
    organization,
    loading,
    error,
    isAuthenticated: !!session,
    isOnboarded: !!profile?.business_role,
    isOrgAdmin: profile?.app_role === 'org_admin' || profile?.app_role === 'super_admin',
    isSuperAdmin: profile?.app_role === 'super_admin',
    hasProfile: !!profile,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    refreshProfile,
    resetPassword,
    updatePassword,
    clearError,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext

