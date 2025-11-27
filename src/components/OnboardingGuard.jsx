import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Loader2, AlertTriangle } from 'lucide-react'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto" />
        <p className="mt-4 text-secondary-600">Chargement...</p>
      </div>
    </div>
  )
}

function ProfileErrorScreen({ onRetry, onSignOut }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-xl font-semibold text-secondary-900 mb-2">
          Profil non trouvé
        </h2>
        <p className="text-secondary-600 mb-6">
          Votre compte a été créé mais le profil n'a pas été initialisé correctement. 
          Cela peut arriver si le trigger de base de données n'a pas fonctionné.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Réessayer
          </button>
          <button
            onClick={onSignOut}
            className="px-4 py-2 bg-secondary-200 text-secondary-700 rounded-lg hover:bg-secondary-300 transition-colors"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Guard pour les routes nécessitant une authentification
 * Vérifie également que l'onboarding est complété
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, isOnboarded, hasProfile, loading, refreshProfile, signOut } = useAuth()
  const location = useLocation()

  // En cours de chargement
  if (loading) {
    return <LoadingScreen />
  }

  // Non authentifié → Login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Authentifié mais pas de profil → Erreur
  if (!hasProfile) {
    return <ProfileErrorScreen onRetry={refreshProfile} onSignOut={signOut} />
  }

  if (!isOnboarded) {
    return <Navigate to="/onboarding" replace />
  }

  return children
}

export function OnboardingRoute({ children }) {
  const { isAuthenticated, isOnboarded, hasProfile, loading, refreshProfile, signOut } = useAuth()
  const location = useLocation()

  // En cours de chargement
  if (loading) {
    return <LoadingScreen />
  }

  // Non authentifié → Login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Authentifié mais pas de profil → Erreur
  if (!hasProfile) {
    return <ProfileErrorScreen onRetry={refreshProfile} onSignOut={signOut} />
  }

  if (isOnboarded) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export function PublicRoute({ children }) {
  const { isAuthenticated, isOnboarded, hasProfile, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (isAuthenticated) {
    if (!hasProfile) {
      return children
    }
    if (!isOnboarded) {
      return <Navigate to="/onboarding" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export function AdminRoute({ children }) {
  const { isAuthenticated, isOnboarded, isOrgAdmin, hasProfile, loading, refreshProfile, signOut } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingScreen />
  }

  // Non authentifié → Login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!hasProfile) {
    return <ProfileErrorScreen onRetry={refreshProfile} onSignOut={signOut} />
  }

  if (!isOnboarded) {
    return <Navigate to="/onboarding" replace />
  }

  if (!isOrgAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute

