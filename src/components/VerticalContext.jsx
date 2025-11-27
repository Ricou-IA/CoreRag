import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * VerticalContext - Gestion globale de la verticale active
 * 
 * Ce context permet de :
 * - Stocker la verticale active globalement
 * - Persister le choix dans localStorage
 * - Synchroniser avec les appels API (header x-vertical-id)
 * - Charger les verticales disponibles depuis Supabase
 */

// Valeurs par défaut
const DEFAULT_VERTICAL = 'audit';

const DEFAULT_VERTICALS = [
  { id: 'audit', name: 'AuditFlow', description: 'Audit & Conformité', color: '#6366f1' },
  { id: 'btp', name: 'BatiFlow', description: 'Construction & BTP', color: '#f59e0b' },
  { id: 'juridique', name: 'JuriFlow', description: 'Droit & Juridique', color: '#10b981' },
  { id: 'rh', name: 'RHFlow', description: 'Ressources Humaines', color: '#ec4899' },
];

// Création du context
const VerticalContext = createContext(undefined);

// Hook personnalisé pour utiliser le context
export const useVertical = () => {
  const context = useContext(VerticalContext);
  if (context === undefined) {
    throw new Error('useVertical doit être utilisé à l\'intérieur d\'un VerticalProvider');
  }
  return context;
};

// Provider Component
export const VerticalProvider = ({ 
  children, 
  supabaseClient = null,
  defaultVertical = DEFAULT_VERTICAL,
  persistKey = 'core-rag-vertical',
}) => {
  // State principal
  const [currentVertical, setCurrentVerticalState] = useState(() => {
    // Récupérer depuis localStorage au premier rendu
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(persistKey);
      if (stored) return stored;
    }
    return defaultVertical;
  });

  const [availableVerticals, setAvailableVerticals] = useState(DEFAULT_VERTICALS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les verticales depuis Supabase
  useEffect(() => {
    const fetchVerticals = async () => {
      if (!supabaseClient) {
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabaseClient
          .from('verticals')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (fetchError) throw fetchError;

        if (data && data.length > 0) {
          setAvailableVerticals(data);
          
          // Vérifier que la verticale actuelle existe toujours
          const currentExists = data.some(v => v.id === currentVertical);
          if (!currentExists) {
            setCurrentVerticalState(data[0].id);
          }
        }
      } catch (err) {
        console.warn('Impossible de charger les verticales:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVerticals();
  }, [supabaseClient]);

  // Setter avec persistance
  const setCurrentVertical = useCallback((verticalId) => {
    setCurrentVerticalState(verticalId);
    
    // Persister dans localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(persistKey, verticalId);
    }

    // Émettre un event custom pour synchronisation inter-composants
    window.dispatchEvent(new CustomEvent('vertical-change', { 
      detail: { verticalId } 
    }));
  }, [persistKey]);

  // Récupérer les infos de la verticale courante
  const getCurrentVerticalInfo = useCallback(() => {
    return availableVerticals.find(v => v.id === currentVertical) || availableVerticals[0];
  }, [currentVertical, availableVerticals]);

  // Vérifier si une verticale est valide
  const isValidVertical = useCallback((verticalId) => {
    return availableVerticals.some(v => v.id === verticalId);
  }, [availableVerticals]);

  // Headers pour les appels API
  const getVerticalHeaders = useCallback(() => {
    return {
      'x-vertical-id': currentVertical,
    };
  }, [currentVertical]);

  // Valeur du context
  const value = {
    // État
    currentVertical,
    availableVerticals,
    loading,
    error,
    
    // Actions
    setCurrentVertical,
    
    // Helpers
    getCurrentVerticalInfo,
    isValidVertical,
    getVerticalHeaders,
  };

  return (
    <VerticalContext.Provider value={value}>
      {children}
    </VerticalContext.Provider>
  );
};

export default VerticalContext;