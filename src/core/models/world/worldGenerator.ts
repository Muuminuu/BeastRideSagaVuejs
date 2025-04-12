// src/models/world/worldGenerator.ts
import { BiomeType, Tile, TileFeature } from './tile'

// Utilisation d'un algorithme simple pour générer une carte de monde
export class WorldGenerator {
  private width: number
  private height: number
  private tiles: Map<string, Tile> = new Map()

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
  }

  // Génère une clé unique pour chaque tuile basée sur ses coordonnées
  private generateTileId(x: number, y: number): string {
    return `${x},${y}`
  }

  // Génère un monde de taille width x height
  generateWorld(): Map<string, Tile> {
    // Réinitialiser la carte
    this.tiles.clear()

    // Pour un monde plus intéressant, nous pourrions utiliser du bruit de Perlin
    // mais pour cette démonstration nous utilisons une méthode plus simple
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const biome = this.determineBiome(x, y)
        const feature = this.determineFeature(x, y, biome)
        
        const tile: Tile = {
          id: this.generateTileId(x, y),
          x,
          y,
          biome,
          feature,
          explored: false,
          temperature: this.getBaseTemperature(biome),
          humidity: this.getBaseHumidity(biome),
          resources: []
        }
        
        this.tiles.set(tile.id, tile)
      }
    }
    
    // Ajouter des ressources à certaines tuiles
    this.addResources()
    
    return this.tiles
  }
  
  // Détermine le biome en fonction des coordonnées
  private determineBiome(x: number, y: number): BiomeType {
    // Utilisation d'une formule simple qui crée des zones
    // En production, vous utiliseriez du bruit de Perlin pour un résultat plus naturel
    
    // Eau sur les bords
    if (x === 0 || y === 0 || x === this.width - 1 || y === this.height - 1) {
      return BiomeType.WATER
    }
    
    // Utiliser une combinaison de x et y pour créer des motifs
    const xNorm = x / this.width
    const yNorm = y / this.height
    
    // Valeur aléatoire mais déterministe basée sur la position
    const value = Math.sin(xNorm * 10) * Math.cos(yNorm * 10) + Math.sin((xNorm + yNorm) * 5)
    
    // Mapper la valeur à un biome
    if (value < -0.8) return BiomeType.WATER
    if (value < -0.5) return BiomeType.SWAMP
    if (value < -0.2) return BiomeType.FOREST
    if (value < 0.2) return BiomeType.PLAINS
    if (value < 0.5) return BiomeType.DESERT
    if (value < 0.8) return BiomeType.MOUNTAIN
    return BiomeType.TUNDRA
  }
  
  // Détermine les caractéristiques spéciales d'une tuile
  private determineFeature(x: number, y: number, biome: BiomeType): TileFeature {
    // Pas de caractéristiques sur l'eau (pour simplifier)
    if (biome === BiomeType.WATER) return TileFeature.NONE
    
    // 10% de chance d'avoir une caractéristique
    const chance = Math.random()
    if (chance > 0.9) {
      // Distribuer différentes caractéristiques avec des probabilités différentes
      const featureChance = Math.random()
      
      if (featureChance < 0.4) return TileFeature.RESOURCE
      if (featureChance < 0.7) return TileFeature.QUEST
      if (featureChance < 0.9) return TileFeature.DUNGEON
      return TileFeature.TOWN
    }
    
    return TileFeature.NONE
  }
  
  // Obtient la température de base pour un biome
  private getBaseTemperature(biome: BiomeType): number {
    switch (biome) {
      case BiomeType.DESERT:
        return 40 // Très chaud
      case BiomeType.PLAINS:
        return 25 // Modéré
      case BiomeType.FOREST:
        return 20 // Frais
      case BiomeType.SWAMP:
        return 30 // Chaud et humide
      case BiomeType.MOUNTAIN:
        return 10 // Froid
      case BiomeType.TUNDRA:
        return -10 // Très froid
      case BiomeType.WATER:
        return 15 // Température modérée de l'eau
      default:
        return 20
    }
  }
  
  // Obtient l'humidité de base pour un biome
  private getBaseHumidity(biome: BiomeType): number {
    switch (biome) {
      case BiomeType.DESERT:
        return 10 // Très sec
      case BiomeType.PLAINS:
        return 50 // Modéré
      case BiomeType.FOREST:
        return 70 // Humide
      case BiomeType.SWAMP:
        return 90 // Très humide
      case BiomeType.MOUNTAIN:
        return 30 // Sec
      case BiomeType.TUNDRA:
        return 20 // Sec et froid
      case BiomeType.WATER:
        return 100 // Complètement humide
      default:
        return 50
    }
  }
  
  // Ajoute des ressources aléatoires aux tuiles en fonction du biome
  private addResources(): void {
    for (const tile of this.tiles.values()) {
      if (tile.feature === TileFeature.RESOURCE || Math.random() < 0.2) {
        tile.resources = this.getResourcesForBiome(tile.biome)
      }
    }
  }
  
  // Retourne les ressources possibles pour un biome donné
  private getResourcesForBiome(biome: BiomeType): string[] {
    const resources: Record<BiomeType, string[]> = {
      [BiomeType.PLAINS]: ['herb', 'flower', 'grain'],
      [BiomeType.FOREST]: ['wood', 'mushroom', 'berry'],
      [BiomeType.MOUNTAIN]: ['stone', 'ore', 'crystal'],
      [BiomeType.DESERT]: ['cactus', 'sand', 'fossil'],
      [BiomeType.SWAMP]: ['moss', 'reed', 'poison_herb'],
      [BiomeType.TUNDRA]: ['ice_crystal', 'snow_herb', 'frost_flower'],
      [BiomeType.WATER]: ['fish', 'algae', 'shell']
    }
    
    const biomeResources = resources[biome] || []
    const numResources = Math.floor(Math.random() * 3) + 1 // 1 à 3 ressources
    
    // Sélectionner aléatoirement un sous-ensemble de ressources
    const selectedResources: string[] = []
    for (let i = 0; i < numResources; i++) {
      const resourceIndex = Math.floor(Math.random() * biomeResources.length)
      selectedResources.push(biomeResources[resourceIndex])
    }
    
    return selectedResources
  }
  
  // Méthode pour ajouter des villes, donjons et quêtes à des emplacements stratégiques
  addStrategicFeatures(): void {
    // Ajouter une ville de départ près du centre
    const centerX = Math.floor(this.width / 2)
    const centerY = Math.floor(this.height / 2)
    
    // Chercher une tuile de plaine ou de forêt près du centre
    for (let y = centerY - 3; y <= centerY + 3; y++) {
      for (let x = centerX - 3; x <= centerX + 3; x++) {
        const tileId = this.generateTileId(x, y)
        const tile = this.tiles.get(tileId)
        
        if (tile && (tile.biome === BiomeType.PLAINS || tile.biome === BiomeType.FOREST)) {
          tile.feature = TileFeature.TOWN
          tile.explored = true // La ville de départ est déjà explorée
          return
        }
      }
    }
  }
}