/**
 * Registre des catégories + assemblage des decks avec ID stable par carte.
 * ID = `${categoryId}-${index+1}` (stable tant que l'ordre des tableaux sources
 * n'est pas modifié — ne jamais réordonner un fichier de données existant,
 * seulement ajouter à la fin, sous peine de décaler les ID et l'historique SRS).
 */

const CATEGORIES = [
  {
    id: 'conversational',
    name: 'Anglais conversationnel',
    shortName: 'Conversationnel',
    order: 1,
    color: '#2f6f4f',
    unlock: null, // toujours débloquée
  },
  {
    id: 'professional',
    name: 'Anglais professionnel général',
    shortName: 'Professionnel',
    order: 2,
    color: '#2f5d7c',
    unlock: { requires: 'conversational', matureRatio: 0.7 },
  },
  {
    id: 'culinary',
    name: 'Anglais de la cuisine professionnelle',
    shortName: 'Cuisine',
    order: 3,
    color: '#a15c1f',
    unlock: { requires: 'professional', matureRatio: 0.7 },
  },
  {
    id: 'finance',
    name: 'Anglais des finances en hôtellerie',
    shortName: 'Finance hôtelière',
    order: 4,
    color: '#6a4c93',
    unlock: { requires: 'culinary', matureRatio: 0.7 },
  },
];

function buildDeck(categoryId, rawCards) {
  return rawCards.map((c, i) => ({ id: `${categoryId}-${i + 1}`, cat: categoryId, ...c }));
}

function getAllCards() {
  /* global DATA_CONVERSATIONAL, DATA_PROFESSIONAL, DATA_CULINARY, DATA_FINANCE */
  const src = (typeof module !== 'undefined' && module.exports)
    ? {
        conversational: require('./conversational.js'),
        professional: require('./professional.js'),
        culinary: require('./culinary.js'),
        finance: require('./finance.js'),
      }
    : {
        conversational: DATA_CONVERSATIONAL,
        professional: DATA_PROFESSIONAL,
        culinary: DATA_CULINARY,
        finance: DATA_FINANCE,
      };
  return [
    ...buildDeck('conversational', src.conversational),
    ...buildDeck('professional', src.professional),
    ...buildDeck('culinary', src.culinary),
    ...buildDeck('finance', src.finance),
  ];
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CATEGORIES, getAllCards };
}
if (typeof window !== 'undefined') {
  window.EAL_DATA = { CATEGORIES, getAllCards };
}
