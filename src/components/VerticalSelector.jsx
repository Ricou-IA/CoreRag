import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Building2, Scale, ClipboardCheck, Users, Layers } from 'lucide-react';

/**
 * VerticalSelector - Composant de sélection de verticale
 * 
 * Permet à l'utilisateur de changer de contexte métier (AuditFlow, BatiFlow, etc.)
 * Utilisé dans la barre de navigation pour simuler le changement de White-Label
 * 
 * @param {Object} props
 * @param {string} props.currentVertical - ID de la verticale actuellement sélectionnée
 * @param {function} props.onVerticalChange - Callback appelé lors du changement de verticale
 * @param {Object} props.supabaseClient - Instance Supabase (optionnel, pour charger les verticales depuis la DB)
 * @param {Array} props.staticVerticals - Liste statique des verticales (utilisé si pas de supabaseClient)
 * @param {boolean} props.showLabel - Afficher le label "Verticale" (défaut: true)
 * @param {string} props.className - Classes CSS additionnelles
 */

// Configuration par défaut des verticales
const DEFAULT_VERTICALS = [
  {
    id: 'audit',
    name: 'AuditFlow',
    description: 'Audit & Conformité',
    icon: 'clipboard-check',
    color: '#6366f1', // Indigo
  },
  {
    id: 'btp',
    name: 'BatiFlow',
    description: 'Construction & BTP',
    icon: 'building',
    color: '#f59e0b', // Amber
  },
  {
    id: 'juridique',
    name: 'JuriFlow',
    description: 'Droit & Juridique',
    icon: 'scale',
    color: '#10b981', // Emerald
  },
  {
    id: 'rh',
    name: 'RHFlow',
    description: 'Ressources Humaines',
    icon: 'users',
    color: '#ec4899', // Pink
  },
];

// Mapping des icônes
const IconMap = {
  'clipboard-check': ClipboardCheck,
  'building': Building2,
  'scale': Scale,
  'users': Users,
  'default': Layers,
};

const VerticalSelector = ({
  currentVertical = 'audit',
  onVerticalChange,
  supabaseClient = null,
  staticVerticals = DEFAULT_VERTICALS,
  showLabel = true,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [verticals, setVerticals] = useState(staticVerticals);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Charger les verticales depuis Supabase si client disponible
  useEffect(() => {
    const fetchVerticals = async () => {
      if (!supabaseClient) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabaseClient
          .from('verticals')
          .select('*')
          .eq('is_active', true)
          .order('name');
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setVerticals(data);
        }
      } catch (err) {
        console.warn('Impossible de charger les verticales depuis la DB, utilisation des valeurs par défaut:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVerticals();
  }, [supabaseClient]);

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Trouver la verticale sélectionnée
  const selectedVertical = verticals.find(v => v.id === currentVertical) || verticals[0];
  const SelectedIcon = IconMap[selectedVertical?.icon] || IconMap.default;

  // Gérer la sélection
  const handleSelect = (verticalId) => {
    setIsOpen(false);
    if (onVerticalChange && verticalId !== currentVertical) {
      onVerticalChange(verticalId);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Label optionnel */}
      {showLabel && (
        <label className="block text-xs font-medium text-slate-500 mb-1">
          Verticale active
        </label>
      )}

      {/* Bouton principal */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className={`
          relative w-full min-w-[180px] px-4 py-2.5
          bg-white border border-slate-200 rounded-xl
          shadow-sm hover:shadow-md
          transition-all duration-200
          flex items-center justify-between gap-3
          focus:outline-none focus:ring-2 focus:ring-offset-2
          ${loading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
        `}
        style={{ 
          '--ring-color': selectedVertical?.color || '#6366f1',
          focusRingColor: selectedVertical?.color 
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {/* Indicateur de couleur + Icône */}
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${selectedVertical?.color}15` }}
          >
            <SelectedIcon 
              className="w-4 h-4" 
              style={{ color: selectedVertical?.color }}
            />
          </div>
          
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-800">
              {selectedVertical?.name || 'Sélectionner'}
            </p>
            <p className="text-xs text-slate-500">
              {selectedVertical?.description || ''}
            </p>
          </div>
        </div>

        {/* Chevron */}
        <ChevronDown 
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="
            absolute z-50 mt-2 w-full
            bg-white border border-slate-200 rounded-xl
            shadow-lg shadow-slate-200/50
            py-2 overflow-hidden
            animate-in fade-in slide-in-from-top-2 duration-200
          "
          role="listbox"
        >
          {verticals.map((vertical) => {
            const Icon = IconMap[vertical.icon] || IconMap.default;
            const isSelected = vertical.id === currentVertical;

            return (
              <button
                key={vertical.id}
                type="button"
                onClick={() => handleSelect(vertical.id)}
                className={`
                  w-full px-4 py-3
                  flex items-center gap-3
                  transition-colors duration-150
                  ${isSelected 
                    ? 'bg-slate-50' 
                    : 'hover:bg-slate-50'
                  }
                `}
                role="option"
                aria-selected={isSelected}
              >
                {/* Icône */}
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${vertical.color}15` }}
                >
                  <Icon 
                    className="w-4 h-4" 
                    style={{ color: vertical.color }}
                  />
                </div>

                {/* Texte */}
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-slate-800">
                    {vertical.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {vertical.description}
                  </p>
                </div>

                {/* Check si sélectionné */}
                {isSelected && (
                  <Check 
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: vertical.color }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VerticalSelector;