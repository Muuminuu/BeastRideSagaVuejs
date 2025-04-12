// src/stores/world.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { BiomeType, Tile, TileFeature } from '@/models/world/tile'
import { WorldGenerator } from '@/models/world/worldGenerator'

export enum Season {
  SPRING = 'spring',
  SUMMER = 'summer',
  FALL = 'fall',
  WINTER = 'winter'
}

export enum TimeOfDay {
  DAWN = 'dawn',
  DAY = 'day',
  DUSK = 'dusk',
  NIGHT = 'night'
}

// Interface pour les coordonnées
export interface Position {
  x: number
  y: number
}

export const useWorldStore = defineStore('world', () => {
  // État du monde
  const worldSize = ref({ width: 50, height: 50 })
  const tiles = ref<Map<string, Tile>>(new Map())
  const currentSeason = ref<Season>(Season.SPRING)
  const currentTime = ref<TimeOfDay>(TimeOfDay.DAY)
  const worldDays = ref<number>(1)
  
  // État du joueur sur la carte
  const playerPosition = ref<Position>({ x: 25, y: 25 })
  const mapViewOffset = ref<Position>({ x: 0, y: 0 })
  const mapViewSize = ref<{ width: number; height: number }>({ width: 15, height: 15 })
  
  // Getters
  const visibleTiles = computed(() => {
    const result: Tile[] = []
    const startX = Math.max(0, playerPosition.value.x - Math.floor(mapViewSize.value.width / 2))
    const startY = Math.max(0, playerPosition.value.y - Math.floor(mapViewSize.value.height / 2))
    const endX = Math.min(worldSize.value.width - 1, startX + mapViewSize.value.width - 1)
    const endY = Math.min(worldSize.value.height - 1, startY + mapViewSize.value.height - 1)
    
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const tileId = `${x},${y}`
        const tile = tiles.value.get(tileId)
        if (tile) {
          result.push(tile)
        }
      }
    }
    
    return result
  })
  
  const currentTile = computed((): Tile | undefined => {
    const tileId = `${playerPosition.value.x},${playerPosition.value.y}`
    return tiles.value.get(tileId)
  })
  
  // Actions
  function initializeWorld() {
    const generator = new WorldGenerator(worldSize.value.width, worldSize.value.height)
    tiles.value = generator.generateWorld()
    generator.addStrategicFeatures()
    
    // Trouver une tuile de départ appropriée (une ville)
    for (const tile of tiles.value.values()) {
      if (tile.feature === TileFeature.TOWN) {
        playerPosition.value = { x: tile.x, y: tile.y }
        exploreTile(tile.id)
        break
      }
    }
    
    // Si aucune ville n'a été trouvée, partir du centre
    if (!currentTile.value) {
      playerPosition.value = {
        x: Math.floor(worldSize.value.width / 2),
        y: Math.floor(worldSize.value.height / 2)
      }
      exploreTile(`${playerPosition.value.x},${playerPosition.value.y}`)
    }
  }
  
  function movePlayer(dx: number, dy: number) {
    const newX = Math.max(0, Math.min(worldSize.value.width - 1, playerPosition.value.x + dx))
    const newY = Math.max(0, Math.min(worldSize.value.height - 1, playerPosition.value.y + dy))
    
    // Vérifier si la tuile est accessible (par exemple, pas d'eau)
    const tileId = `${newX},${newY}`
    const targetTile = tiles.value.get(tileId)
    
    if (targetTile && targetTile.biome !== BiomeType.WATER) {
      playerPosition.value = { x: newX, y: newY }
      exploreTile(tileId)
      // Possibilité d'avoir des événements aléatoires lors du déplacement
      checkForRandomEncounter()
    }
  }
  
  function exploreTile(tileId: string) {
    const tile = tiles.value.get(tileId)
    if (tile) {
      tile.explored = true
      
      // Mettre à jour la carte
      const newTiles = new Map(tiles.value)
      newTiles.set(tileId, tile)
      tiles.value = newTiles
    }
  }
  
  function advanceTime() {
    // Avancer l'heure du jour
    const timeValues = Object.values(TimeOfDay)
    const currentIndex = timeValues.indexOf(currentTime.value)
    const nextIndex = (currentIndex + 1) % timeValues.length
    currentTime.value = timeValues[nextIndex]
    
    // Si on passe de NIGHT à DAWN, avancer d'un jour
    if (currentTime.value === TimeOfDay.DAWN) {
      worldDays.value++
      
      // Chaque 30 jours, changer de saison
      if (worldDays.value % 30 === 0) {
        const seasonValues = Object.values(Season)
        const currentSeasonIndex = seasonValues.indexOf(currentSeason.value)
        const nextSeasonIndex = (currentSeasonIndex + 1) % seasonValues.length
        currentSeason.value = seasonValues[nextSeasonIndex]
        
        // Mettre à jour les ressources selon la saison
        updateSeasonalResources()
      }
    }
    
    // Mettre à jour les effets selon l'heure du jour
    updateTimeEffects()
  }
  
  function updateSeasonalResources() {
    // Pour chaque tuile, mettre à jour les ressources disponibles en fonction de la saison
    for (const tile of tiles.value.values()) {
      // Ajuster la température en fonction de la saison
      switch (currentSeason.value) {
        case Season.WINTER:
          tile.temperature -= 15
          break
        case Season.SPRING:
          tile.temperature += 5
          break
        case Season.SUMMER:
          tile.temperature += 15
          break
        case Season.FALL:
          tile.temperature -= 5
          break
      }
      
      // Mettre à jour les ressources disponibles
      // Dans une implémentation complète, cela serait plus complexe
    }
  }
  
  function updateTimeEffects() {
    // Ajuster les effets selon l'heure du jour
    // Par exemple, certaines créatures n'apparaissent que la nuit
  }
  
  function checkForRandomEncounter() {
    // Vérifier si un événement aléatoire se produit lors du déplacement
    // Par exemple, une rencontre avec un monstre
    const chanceOfEncounter = 0.2 // 20% de chance
    
    if (Math.random() < chanceOfEncounter) {
      // Déclencher un combat
      // À implémenter: déclencher un événement ou rediriger vers la vue de combat
    }
  }
  
  function getResourcesForCurrentTile(): string[] {
    return currentTile.value?.resources || []
  }
  
  // Exporter les fonctions et les états
  return {
    // État
    worldSize,
    tiles,
    currentSeason,
    currentTime,
    worldDays,
    playerPosition,
    mapViewOffset,
    mapViewSize,
    
    // Getters
    visibleTiles,
    currentTile,
    
    // Actions
    initializeWorld,
    movePlayer,
    exploreTile,
    advanceTime,
    getResourcesForCurrentTile
  }
})