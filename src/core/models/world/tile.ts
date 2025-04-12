// src/models/world/tile.ts
export enum BiomeType {
    PLAINS = 'plains',
    FOREST = 'forest',
    MOUNTAIN = 'mountain',
    DESERT = 'desert',
    SWAMP = 'swamp',
    TUNDRA = 'tundra',
    WATER = 'water'
  }
  
  export enum TileFeature {
    NONE = 'none',
    TOWN = 'town',
    DUNGEON = 'dungeon',
    QUEST = 'quest',
    RESOURCE = 'resource'
  }
  
  export interface Tile {
    id: string
    x: number
    y: number
    biome: BiomeType
    feature: TileFeature
    explored: boolean
    // Propriétés qui peuvent être affectées par le temps et les saisons
    temperature: number // Modifier selon la saison
    humidity: number // Modifier selon la saison
    resources: string[] // Ressources disponibles sur la tuile
  }
  
  export const getBiomeColor = (biome: BiomeType): string => {
    switch (biome) {
      case BiomeType.PLAINS:
        return '#90ee90' // Light green
      case BiomeType.FOREST:
        return '#228b22' // Forest green
      case BiomeType.MOUNTAIN:
        return '#a9a9a9' // Dark gray
      case BiomeType.DESERT:
        return '#f4a460' // Sand
      case BiomeType.SWAMP:
        return '#2f4f4f' // Dark slate gray
      case BiomeType.TUNDRA:
        return '#e0ffff' // Light cyan
      case BiomeType.WATER:
        return '#1e90ff' // Dodger blue
      default:
        return '#ffffff' // White
    }
  }
  
  export const getFeatureSymbol = (feature: TileFeature): string => {
    switch (feature) {
      case TileFeature.TOWN:
        return '🏠'
      case TileFeature.DUNGEON:
        return '🏰'
      case TileFeature.QUEST:
        return '❗'
      case TileFeature.RESOURCE:
        return '💎'
      default:
        return ''
    }
  }
  
  // Règles pour déterminer si un biome est favorable ou défavorable à un type d'esprit
  export const getBiomeAffinity = (
    biome: BiomeType,
    spiritType: string
  ): 'advantage' | 'disadvantage' | 'neutral' => {
    const affinities: Record<string, { advantage: BiomeType[]; disadvantage: BiomeType[] }> = {
      snake: {
        advantage: [BiomeType.SWAMP, BiomeType.DESERT],
        disadvantage: [BiomeType.TUNDRA, BiomeType.MOUNTAIN]
      },
      wolf: {
        advantage: [BiomeType.FOREST, BiomeType.PLAINS],
        disadvantage: [BiomeType.DESERT, BiomeType.WATER]
      },
      bear: {
        advantage: [BiomeType.FOREST, BiomeType.MOUNTAIN],
        disadvantage: [BiomeType.DESERT, BiomeType.WATER]
      },
      eagle: {
        advantage: [BiomeType.MOUNTAIN, BiomeType.PLAINS],
        disadvantage: [BiomeType.FOREST, BiomeType.SWAMP]
      },
      fish: {
        advantage: [BiomeType.WATER, BiomeType.SWAMP],
        disadvantage: [BiomeType.DESERT, BiomeType.MOUNTAIN]
      }
    }
  
    const spiritAffinity = affinities[spiritType]
    if (!spiritAffinity) return 'neutral'
  
    if (spiritAffinity.advantage.includes(biome)) return 'advantage'
    if (spiritAffinity.disadvantage.includes(biome)) return 'disadvantage'
    return 'neutral'
  }