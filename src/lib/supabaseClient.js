import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '❌ Variables Supabase manquantes!\n' +
    'Assurez-vous de créer un fichier .env.local avec:\n' +
    '- VITE_SUPABASE_URL\n' +
    '- VITE_SUPABASE_ANON_KEY\n' +
    'Consultez .env.example pour plus de détails.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
export async function getMyProfile() {
  const { data, error } = await supabase.rpc('get_my_profile')
  if (error) return null
  return data
}

export async function completeOnboarding(businessRole, bio = null) {
  const { data, error } = await supabase.rpc('complete_onboarding', {
    p_business_role: businessRole,
    p_bio: bio,
  })
  
  if (error) throw error
  return data
}

export async function checkEmailExists(email) {
  if (!email) return false
  
  try {
    const { data, error } = await supabase.rpc('check_email_exists', {
      email_to_check: email
    })
    
    if (error) return false
    
    return data === true || data === 'true' || data === 1
  } catch (err) {
    return false
  }
}

/**
 * Appelle la fonction Edge Function rag-brain de Supabase
 * @param {string} query - La question/requête de l'utilisateur
 * @param {string} verticalId - L'ID de la verticale (requis)
 * @param {object} options - Options supplémentaires
 * @returns {Promise<{data: any, error: Error|null}>}
 */
export async function callRagBrain(query, verticalId, options = {}) {
  try {
    // Récupérer la session pour l'authentification
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('Utilisateur non authentifié')
    }

    if (!query || query.trim() === '') {
      throw new Error('La requête ne peut pas être vide')
    }

    if (!verticalId || verticalId.trim() === '') {
      throw new Error('L\'ID de la verticale est requis')
    }

    // Construire le body selon le format attendu par votre Edge Function
    const requestBody = {
      query: query.trim(),
      vertical_id: verticalId.trim(),
      match_threshold: options.matchThreshold || 0.5,
      match_count: options.matchCount || 5
    }

    // Appel à l'Edge Function
    const response = await fetch(
      `${supabaseUrl}/functions/v1/rag-brain`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      // Gérer les erreurs selon le format de votre Edge Function
      const errorMessage = data.error || `Erreur HTTP: ${response.status}`
      throw new Error(errorMessage)
    }

    // Vérifier le format de réponse
    if (!data.success) {
      throw new Error(data.error || 'Erreur inconnue de l\'Edge Function')
    }

    return { 
      data: {
        answer: data.answer,
        sources: data.sources || [],
        processingTime: data.processing_time_ms
      }, 
      error: null 
    }
  } catch (err) {
    console.error('Erreur lors de l\'appel RAG:', err)
    return { 
      data: null, 
      error: err instanceof Error ? err : new Error(String(err))
    }
  }
}

export default supabase
