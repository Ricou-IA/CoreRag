/**
 * Page Dashboard - Core RAG Engine
 * ============================================================================
 * Page principale après onboarding.
 * Affiche les informations de l'utilisateur et de son organisation.
 * 
 * Pour la Brique 1, c'est une page de validation montrant:
 * - Profil utilisateur
 * - Organisation créée automatiquement
 * - Crédits disponibles
 * ============================================================================
 */

import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { callRagBrain } from '../lib/supabaseClient'
import UserMenu from '../components/UserMenu'
import { 
  Sparkles,
  Settings,
  Paperclip,
  Mic,
  Send,
  Calendar,
  Briefcase,
  Loader2,
  AlertCircle
} from 'lucide-react'

export default function Dashboard() {
  const { 
    user, 
    profile, 
    organization, 
    signOut
  } = useAuth()

  const [activeTab, setActiveTab] = useState('assistant')
  const [message, setMessage] = useState('')
  const [isLoadingRag, setIsLoadingRag] = useState(false)
  const [conversationHistory, setConversationHistory] = useState([])
  const [ragError, setRagError] = useState(null)
  const [verticalIdWarning, setVerticalIdWarning] = useState(false)

  const handleSignOut = async () => {
    await signOut()
  }

  const handleSendMessage = async (e) => {
    e?.preventDefault()
    
    if (!message.trim() || isLoadingRag) return
    
    setIsLoadingRag(true)
    setRagError(null)
    setVerticalIdWarning(false)
    
    // Ajouter le message utilisateur à l'historique
    const userMessage = { 
      role: 'user', 
      content: message, 
      timestamp: new Date() 
    }
    setConversationHistory(prev => [...prev, userMessage])
    
    const currentMessage = message
    setMessage('') // Vider le champ immédiatement
    
    try {
      // Utiliser une valeur par défaut temporaire avec avertissement
      const verticalId = organization?.vertical_id || profile?.vertical_id || 'default-vertical-id'
      
      if (verticalId === 'default-vertical-id') {
        setVerticalIdWarning(true)
        console.warn('⚠️ vertical_id non configuré, utilisation d\'une valeur par défaut temporaire')
      }
      
      const { data, error } = await callRagBrain(currentMessage, verticalId, {
        matchThreshold: 0.5,
        matchCount: 5
      })
      
      if (error) {
        setRagError(error.message || 'Une erreur est survenue lors de la requête RAG')
        console.error('Erreur RAG:', error)
      } else {
        // Ajouter la réponse à l'historique selon le format de votre Edge Function
        const assistantMessage = { 
          role: 'assistant', 
          content: data.answer, 
          sources: data.sources || [],
          processingTime: data.processingTime,
          timestamp: new Date() 
        }
        setConversationHistory(prev => [...prev, assistantMessage])
      }
    } catch (err) {
      setRagError(err.message || 'Une erreur inattendue s\'est produite')
      console.error('Erreur:', err)
    } finally {
      setIsLoadingRag(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bonjour'
    if (hour < 18) return 'Bon après-midi'
    return 'Bonsoir'
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header avec navigation */}
      <header className="bg-white border-b border-secondary-200">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo et compteur */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-secondary-900">Core RAG</span>
              </div>
              
              {/* Compteur */}
              <div className="text-sm text-secondary-500">
                {conversationHistory.length}/10
              </div>

              {/* Navigation tabs */}
              <nav className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('assistant')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'assistant'
                      ? 'bg-secondary-100 text-secondary-900'
                      : 'text-secondary-500 hover:text-secondary-700 hover:bg-secondary-50'
                  }`}
                >
                  Assistant
                </button>
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'documents'
                      ? 'bg-secondary-100 text-secondary-900'
                      : 'text-secondary-500 hover:text-secondary-700 hover:bg-secondary-50'
                  }`}
                >
                  Documents
                </button>
                <button
                  onClick={() => setActiveTab('bibliotheque')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'bibliotheque'
                      ? 'bg-secondary-100 text-secondary-900'
                      : 'text-secondary-500 hover:text-secondary-700 hover:bg-secondary-50'
                  }`}
                >
                  Bibliothèque
                </button>
              </nav>
            </div>

            {/* Actions droite */}
            <div className="flex items-center gap-2">
              <button className="p-2 text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              
              {/* User menu */}
              <UserMenu 
                user={user}
                profile={profile}
                organization={organization}
                onSignOut={handleSignOut}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Zone principale avec message de bienvenue */}
        <div className="max-w-5xl mx-auto">
          {/* Message de bienvenue */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-secondary-900 mb-4">
              {getGreeting()} {profile?.full_name?.split(' ')[0] || 'Eric'},
            </h1>
            
            {/* Graphique décoratif */}
            <div className="relative w-full h-32 mb-6 overflow-hidden">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                    <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,100 Q300,50 600,100 T1200,100 L1200,200 L0,200 Z"
                  fill="url(#waveGradient)"
                />
                <path
                  d="M0,120 Q400,80 800,120 T1200,120 L1200,200 L0,200 Z"
                  fill="url(#waveGradient)"
                  opacity="0.5"
                />
              </svg>
            </div>

            {/* Bouton Effacer l'historique */}
            <div className="flex justify-end mb-6">
              {conversationHistory.length > 0 && (
                <button 
                  onClick={() => {
                    setConversationHistory([])
                    setRagError(null)
                    setVerticalIdWarning(false)
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary-100 text-secondary-700 rounded-lg hover:bg-secondary-200 transition-colors"
                >
                  <Briefcase className="w-4 h-4" />
                  <span className="text-sm font-medium">Effacer l'historique</span>
                </button>
              )}
            </div>
          </div>

          {/* Avertissement vertical_id */}
          {verticalIdWarning && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-amber-900 text-sm font-semibold mb-1">Configuration requise</p>
                <p className="text-amber-800 text-sm">
                  Aucune verticale configurée. Veuillez configurer un <code className="bg-amber-100 px-1 rounded">vertical_id</code> dans les paramètres de votre organisation pour utiliser le RAG correctement.
                </p>
              </div>
              <button
                onClick={() => setVerticalIdWarning(false)}
                className="text-amber-600 hover:text-amber-800"
              >
                ×
              </button>
            </div>
          )}

          {/* Historique de conversation */}
          {conversationHistory.length > 0 && (
            <div className="mb-6 space-y-4 max-h-96 overflow-y-auto">
              {conversationHistory.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-primary-50 text-primary-900 ml-8 border border-primary-200' 
                      : 'bg-secondary-100 text-secondary-900 mr-8 border border-secondary-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                      msg.role === 'user' ? 'bg-primary-600 text-white' : 'bg-secondary-600 text-white'
                    }`}>
                      {msg.role === 'user' ? 'U' : 'AI'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      
                      {/* Afficher les sources si disponibles */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-secondary-200">
                          <p className="text-xs font-semibold text-secondary-600 mb-2">
                            📚 {msg.sources.length} source{msg.sources.length > 1 ? 's' : ''} utilisée{msg.sources.length > 1 ? 's' : ''}:
                          </p>
                          <div className="space-y-2">
                            {msg.sources.map((source, sourceIdx) => (
                              <div 
                                key={sourceIdx} 
                                className="p-2 bg-white rounded border border-secondary-200 text-xs"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-secondary-700">
                                    Source {sourceIdx + 1}
                                  </span>
                                  {source.similarity && (
                                    <span className="text-secondary-500">
                                      {Math.round(source.similarity * 100)}% de similarité
                                    </span>
                                  )}
                                </div>
                                <p className="text-secondary-600 line-clamp-2">
                                  {source.content || 'Aucun aperçu disponible'}
                                </p>
                                {source.metadata && Object.keys(source.metadata).length > 0 && (
                                  <div className="mt-1 text-secondary-400 text-xs">
                                    {JSON.stringify(source.metadata)}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Afficher le temps de traitement si disponible */}
                      {msg.processingTime && (
                        <p className="mt-2 text-xs text-secondary-400">
                          ⏱️ Traité en {msg.processingTime}ms
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Zone de saisie pour l'assistant */}
          <div className="relative">
            <form onSubmit={handleSendMessage}>
              <div className="bg-white rounded-2xl shadow-lg border border-secondary-200 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <button 
                    type="button"
                    className="p-2 text-secondary-400 hover:text-secondary-600 hover:bg-secondary-50 rounded-lg transition-colors"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    placeholder="Dites-moi ce dont vous avez besoin...... (@ pour mentionner un document)"
                    className="flex-1 px-4 py-2 text-secondary-900 placeholder-secondary-400 focus:outline-none disabled:opacity-50"
                    disabled={isLoadingRag}
                  />
                  <button 
                    type="button"
                    className="p-2 text-secondary-400 hover:text-secondary-600 hover:bg-secondary-50 rounded-lg transition-colors"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                  <button 
                    type="submit"
                    disabled={isLoadingRag || !message.trim()}
                    className="p-2 bg-secondary-900 text-white rounded-full hover:bg-secondary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingRag ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
                
                {/* Afficher l'erreur si présente */}
                {ragError && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-red-900 text-sm font-semibold mb-1">Erreur</p>
                      <p className="text-red-800 text-sm">{ragError}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRagError(null)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </div>
                )}
                
                {/* Informations en bas du champ */}
                <div className="flex items-center justify-between pt-3 border-t border-secondary-100">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-secondary-100 text-secondary-600 text-xs rounded-full">
                      {conversationHistory.length > 0 
                        ? `${conversationHistory.length} message${conversationHistory.length > 1 ? 's' : ''}` 
                        : 'EUFR 12 sources'}
                    </span>
                    <button className="flex items-center gap-1 px-3 py-1 bg-secondary-100 text-secondary-600 text-xs rounded-full hover:bg-secondary-200 transition-colors">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date().toLocaleDateString('fr-FR')}</span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Message footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-secondary-500">
              Vous êtes sur notre version gratuite.{' '}
              <button className="text-primary-600 hover:text-primary-700 font-medium">
                Passez PRO
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
