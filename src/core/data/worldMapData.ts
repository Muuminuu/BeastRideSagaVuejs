// Structure des données pour une carte du monde détaillée
export interface MapZone {
    id: string;
    name: string;
    regionId: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    terrain: string;
    dangerLevel: number;
    explored: boolean;
    accessible: boolean;
    pointOfInterest?: {
      type: string;
      name: string;
      description?: string;
    };
    encounters?: {
      common: string[];
      uncommon: string[];
      rare: string[];
    };
    collectibles?: {
      spring: string[];
      summer: string[];
      fall: string[];
      winter: string[];
    };
    events?: {
      id: string;
      probability: number;
      condition?: string;
      title: string;
      description: string;
    }[];
  }
  
  export interface MapRegion {
    id: string;
    name: string;
    biome: string;
    dangerLevel: number;
    explored: boolean;
    zones: MapZone[];
    visualDetails: {
      backgroundColor: string;
      borderColor: string;
      position: { x: number; y: number };
      size: { width: number; height: number };
      shape: string; // 'rect', 'circle', 'polygon'
      shapeCoords?: string; // Pour les formes polygonales
    };
    climate: {
      rainfall: number; // 0-10
      temperature: number; // 0-10
      wind: number; // 0-10
    };
    seasonalEffects: {
      spring: { description: string; statEffects?: any };
      summer: { description: string; statEffects?: any };
      fall: { description: string; statEffects?: any };
      winter: { description: string; statEffects?: any };
    };
  }
  
  export interface MapConnection {
    id: string;
    fromZoneId: string;
    toZoneId: string;
    type: string; // 'road', 'trail', 'river'
    difficulty: number; // 0-10
    description?: string;
    requiredCondition?: string; // Ex: "item:bridge_key" ou "quest:completed:bridge_builder"
  }
  
  // Exemple de données pour une région
  export const forestRegionExample: MapRegion = {
    id: 'forest_verdant',
    name: 'Forêt Verdoyante',
    biome: 'forest',
    dangerLevel: 2,
    explored: true,
    zones: [
      {
        id: 'forest_entrance',
        name: 'Orée de la Forêt',
        regionId: 'forest_verdant',
        position: { x: 50, y: 180 },
        size: { width: 80, height: 60 },
        terrain: 'plains',
        dangerLevel: 1,
        explored: true,
        accessible: true,
        pointOfInterest: {
          type: 'camp',
          name: 'Camp des Voyageurs',
          description: 'Un petit camp où les voyageurs se reposent avant d\'entrer dans la forêt.'
        },
        encounters: {
          common: ['Lapin Sauvage', 'Renard Rusé'],
          uncommon: ['Loup Solitaire'],
          rare: []
        },
        collectibles: {
          spring: ['Fleur de Lune', 'Champignon Commun'],
          summer: ['Baie Rouge', 'Champignon Commun'],
          fall: ['Champignon Doré', 'Noix de Forêt'],
          winter: ['Lichen Bleu', 'Champignon de Glace']
        }
      },
      {
        id: 'deep_woods',
        name: 'Bois Profonds',
        regionId: 'forest_verdant',
        position: { x: 120, y: 140 },
        size: { width: 100, height: 70 },
        terrain: 'forest',
        dangerLevel: 2,
        explored: false,
        accessible: true,
        encounters: {
          common: ['Loup Sauvage', 'Sanglier Féroce'],
          uncommon: ['Ours Brun', 'Araignée Géante'],
          rare: ['Esprit des Arbres']
        },
        collectibles: {
          spring: ['Champignon Lumineux', 'Herbe Médicinale'],
          summer: ['Fruit Sylvestre', 'Herbe Médicinale'],
          fall: ['Champignon Coloré', 'Écorce d\'Ancien'],
          winter: ['Baie de Givre', 'Lichen Rare']
        }
      },
      {
        id: 'forest_lake',
        name: 'Lac Miroir',
        regionId: 'forest_verdant',
        position: { x: 200, y: 160 },
        size: { width: 90, height: 90 },
        terrain: 'water',
        dangerLevel: 2,
        explored: false,
        accessible: false,
        pointOfInterest: {
          type: 'landmark',
          name: 'Sanctuaire de l\'Eau',
          description: 'Un ancien sanctuaire dédié aux esprits de l\'eau, situé au centre du lac.'
        },
        encounters: {
          common: ['Poisson Argenté', 'Grenouille Tachetée'],
          uncommon: ['Serpent d\'Eau', 'Tortue Ancienne'],
          rare: ['Nymphe des Eaux']
        },
        collectibles: {
          spring: ['Lotus Blanc', 'Algue Bleue'],
          summer: ['Nénuphar Rouge', 'Algue Verte'],
          fall: ['Racine Aquatique', 'Algue Pourpre'],
          winter: ['Cristal d\'Eau', 'Algue Blanche']
        }
      },
      {
        id: 'ancient_grove',
        name: 'Bosquet Ancien',
        regionId: 'forest_verdant',
        position: { x: 150, y: 80 },
        size: { width: 70, height: 70 },
        terrain: 'hills',
        dangerLevel: 3,
        explored: false,
        accessible: false,
        pointOfInterest: {
          type: 'dungeon',
          name: 'Ruines Sylvestres',
          description: 'Des ruines anciennes envahies par la végétation, qui abritent encore de puissants secrets.'
        },
        encounters: {
          common: ['Loup Ancien', 'Cerf Fantôme'],
          uncommon: ['Golem de Racines', 'Gardien de Pierre'],
          rare: ['Gardien de la Forêt']
        },
        collectibles: {
          spring: ['Fleur Éternelle', 'Écorce d\'Ancien'],
          summer: ['Fruit d\'Or', 'Feuille d\'Argent'],
          fall: ['Bois Enchanté', 'Champignon Ancestral'],
          winter: ['Cristal de Givre', 'Écorce Éternelle']
        },
        events: [
          {
            id: 'guardian_encounter',
            probability: 0.2,
            condition: 'time:night',
            title: 'Gardien Endormi',
            description: 'Vous apercevez un ancien gardien de pierre. Il semble endormi mais pourrait se réveiller à tout moment.'
          }
        ]
      }
    ],
    visualDetails: {
      backgroundColor: '#2d8659',
      borderColor: '#1a5c3a',
      position: { x: 100, y: 100 },
      size: { width: 300, height: 250 },
      shape: 'polygon',
      shapeCoords: '10% 40%, 30% 20%, 70% 10%, 90% 30%, 80% 70%, 60% 90%, 30% 80%, 10% 60%'
    },
    climate: {
      rainfall: 7,
      temperature: 5,
      wind: 3
    },
    seasonalEffects: {
      spring: {
        description: 'La forêt est en pleine floraison, les sentiers sont facilement visibles et les créatures plus douces.',
        statEffects: { encounter_rate: -0.1, collectible_rate: 0.2 }
      },
      summer: {
        description: 'La canopée dense crée des zones d\'ombre fraîche, mais aussi des passages étouffants.',
        statEffects: { water_consumption: 0.2, movement_speed: -0.1 }
      },
      fall: {
        description: 'Les feuilles rouges et dorées recouvrent le sol, rendant la forêt magnifique mais bruyante.',
        statEffects: { stealth: -0.2, collectible_rate: 0.3 }
      },
      winter: {
        description: 'La neige recouvre les branches, créant un silence mystérieux et rendant la navigation difficile.',
        statEffects: { movement_speed: -0.2, visibility: -0.1, cold_damage: 0.1 }
      }
    }
  };
  
  // Exemple de connections entre zones
  export const forestConnectionsExample: MapConnection[] = [
    {
      id: 'path_entrance_to_woods',
      fromZoneId: 'forest_entrance',
      toZoneId: 'deep_woods',
      type: 'trail',
      difficulty: 2,
      description: 'Un sentier étroit qui s\'enfonce dans les bois profonds.'
    },
    {
      id: 'path_woods_to_lake',
      fromZoneId: 'deep_woods',
      toZoneId: 'forest_lake',
      type: 'trail',
      difficulty: 3,
      description: 'Un chemin sinueux qui mène au lac, parfois difficile à suivre.'
    },
    {
      id: 'river_lake_to_entrance',
      fromZoneId: 'forest_lake',
      toZoneId: 'forest_entrance',
      type: 'river',
      difficulty: 4,
      description: 'Une rivière qui coule du lac vers l\'orée de la forêt. Navigable, mais avec précaution.'
    },
    {
      id: 'hidden_path_to_grove',
      fromZoneId: 'deep_woods',
      toZoneId: 'ancient_grove',
      type: 'trail',
      difficulty: 5,
      description: 'Un chemin caché, à peine visible, qui mène vers un lieu ancien.',
      requiredCondition: 'skill:tracking:3'
    }
  ];