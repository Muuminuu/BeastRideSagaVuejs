// src/stores/game.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Hero } from '@/core/entities/Hero'
import { Enemy } from '@/core/entities/Enemy'
import { AnimalSpirit } from '@/core/entities/AnimalSpirit'
import { 
  EnemyType, 
  DamageType, 
  TargetType 
} from '@/core/types/Enums'
import { 
  TerrainType, 
  BiomeType, 
  WorldMapGenerator 
} from '@/core/world/WorldMapSystem'

import type { 
  WorldMap,
  ServiceType 
} from '@/core/world/WorldMapSystem'

// Reste du code...

export interface WorldPosition {
  x: number
  y: number
}

export interface WorldRegion {
  id: string
  name: string
  biome: string
  dangerLevel: number
  explored: boolean
  position: WorldPosition
}

export enum GameTime {
  Morning = 'morning',
  Afternoon = 'afternoon',
  Evening = 'evening',
  Night = 'night',
}

export enum Season {
  Spring = 'spring',
  Summer = 'summer',
  Fall = 'fall',
  Winter = 'winter',
}

interface InventoryItem {
  id: string
  name: string
  type: 'consumable' | 'material' | 'equipment' | 'key'
  description: string
  value: number
  quantity: number
  effects?: Record<string, number>
}

export const useGameStore = defineStore('game', () => {
  // État du jeu
  const player = ref<Hero | null>(null)
  const worldMap = ref<WorldMap | null>(null)

  const worldRegions = ref<WorldRegion[]>([])
  const currentRegionId = ref<string>('')
  const currentPosition = ref({ x: 0, y: 0 })

  const currentRegion = computed(() => {
    return worldRegions.value.find(r => r.id === currentRegionId.value) || null
  })

  const inventory = ref<InventoryItem[]>([])
  const gold = ref(0)
  
  // État du temps et des saisons
  const currentGameTime = ref(GameTime.Morning)
  const currentSeason = ref(Season.Spring)
  const dayCount = ref(1)
  
  // Autres états
  const currentWeather = ref('sunny')
  const weatherEffects = ref({
    sunny: { visibility: 1, speed: 1 },
    rainy: { visibility: 0.8, speed: 0.9 },
    snowy: { visibility: 0.5, speed: 0.7 },
    stormy: { visibility: 0.3, speed: 0.5 },
  })
  
  const activeQuests = ref<any[]>([])
  const completedQuests = ref<any[]>([])
  
  const gameInitialized = ref(false)
  
  // Propriétés calculées
  const playerHealth = computed(() => {
    return player.value?.soulBond?.stats.currentHealth || 0
  })
  
  const playerMaxHealth = computed(() => {
    return player.value?.soulBond?.stats.maxHealth || 0
  })
  
  // Méthodes
  function setPlayer(newPlayer: Hero) {
    player.value = newPlayer
  }
  
  function setWorldMap(newMap: WorldMap) {
    worldMap.value = newMap
  }
  
  function initializeWorld() {
    // Cette méthode est conservée pour compatibilité mais
    // la génération du monde est maintenant gérée dans ExplorationView
    gameInitialized.value = true
  }
  
  function advanceTime() {
    const times = Object.values(GameTime)
    const currentIndex = times.indexOf(currentGameTime.value)
    const nextIndex = (currentIndex + 1) % times.length
    currentGameTime.value = times[nextIndex]
    
    if (nextIndex === 0) {
      dayCount.value++
      
      if (dayCount.value % 30 === 0) {
        const seasons = Object.values(Season)
        const currentSeasonIndex = seasons.indexOf(currentSeason.value)
        currentSeason.value = seasons[(currentSeasonIndex + 1) % seasons.length]
      }
      
      // Mise à jour de la météo (simplifiée pour l'exemple)
      updateWeather()
    }
  }
  
  function updateWeather() {
    const weatherTypes = ['sunny', 'rainy', 'snowy', 'stormy']
    
    // Influencé par la saison
    let weights: number[] = []
    
    switch (currentSeason.value) {
      case Season.Spring:
        weights = [0.5, 0.4, 0.0, 0.1] // Printemps: surtout sunny et rainy
        break
      case Season.Summer:
        weights = [0.7, 0.2, 0.0, 0.1] // Été: principalement sunny
        break
      case Season.Fall:
        weights = [0.3, 0.5, 0.0, 0.2] // Automne: surtout rainy et stormy
        break
      case Season.Winter:
        weights = [0.2, 0.0, 0.6, 0.2] // Hiver: surtout snowy
        break
    }
    
    // Sélection aléatoire pondérée
    const totalWeight = weights.reduce((sum, w) => sum + w, 0)
    let random = Math.random() * totalWeight
    
    for (let i = 0; i < weights.length; i++) {
      random -= weights[i]
      if (random <= 0) {
        currentWeather.value = weatherTypes[i]
        break
      }
    }
  }
  
  function createRandomEnemy(dangerLevel: number): Enemy {
    // Créer un ennemi basé sur le niveau de danger
    const enemyNames = [
      'Loup Sauvage', 'Ours Féroce', 'Sanglier Enragé',
      'Serpent Venimeux', 'Aigle Chasseur', 'Lynx Embusqué',
      'Scorpion Géant', 'Araignée Tisseuse', 'Renard Rusé'
    ]
    
    const name = enemyNames[Math.floor(Math.random() * enemyNames.length)]
    
    // Ajuster les statistiques en fonction du niveau de danger
    const healthBase = 30 + (dangerLevel * 10)
    const attackBase = 5 + (dangerLevel * 2)
    const defenseBase = 3 + dangerLevel
    const speedBase = 5 + dangerLevel
    const intelligenceBase = 3 + dangerLevel
    
    // Variation aléatoire pour plus de diversité
    const randomFactor = 0.8 + (Math.random() * 0.4) // 0.8 - 1.2
    
    const enemy = new Enemy(
      'enemy_' + Date.now(),
      name,
      EnemyType.Beast, // Simplifié, à améliorer pour plus de diversité
      {
        maxHealth: Math.floor(healthBase * randomFactor),
        currentHealth: Math.floor(healthBase * randomFactor),
        attack: Math.floor(attackBase * randomFactor),
        defense: Math.floor(defenseBase * randomFactor),
        speed: Math.floor(speedBase * randomFactor),
        intelligence: Math.floor(intelligenceBase * randomFactor)
      }
    )
    
    // Ajouter des capacités en fonction du niveau de danger
    enemy.abilities = [
      {
        id: 'enemy_attack',
        name: 'Griffes Acérées',
        description: 'Une attaque avec des griffes tranchantes',
        damageType: DamageType.Physical,
        power: 10 + dangerLevel,
        cooldown: 2,
        currentCooldown: 0,
        targetType: TargetType.SingleEnemy
      }
    ]
    
    // Ajouter des capacités supplémentaires pour les ennemis plus dangereux
    if (dangerLevel >= 3) {
      enemy.abilities.push({
        id: 'enemy_special',
        name: 'Rugissement Intimidant',
        description: 'Un cri puissant qui affaiblit l\'adversaire',
        damageType: DamageType.Physical,
        power: 5 + (dangerLevel * 2),
        cooldown: 4,
        currentCooldown: 0,
        targetType: TargetType.SingleEnemy
      })
    }
    
    if (dangerLevel >= 5) {
      enemy.abilities.push({
        id: 'enemy_ultimate',
        name: 'Assaut Frénétique',
        description: 'Une série d\'attaques rapides et puissantes',
        damageType: DamageType.Physical,
        power: 15 + (dangerLevel * 3),
        cooldown: 6,
        currentCooldown: 0,
        targetType: TargetType.SingleEnemy
      })
    }
    
    return enemy
  }
  
  function addItemToInventory(item: InventoryItem) {
    // Vérifier si l'item existe déjà dans l'inventaire
    const existingItem = inventory.value.find(i => i.id === item.id)
    
    if (existingItem) {
      // Incrémenter la quantité
      existingItem.quantity += item.quantity
    } else {
      // Ajouter le nouvel item
      inventory.value.push(item)
    }
  }
  
  function removeItemFromInventory(itemId: string, quantity: number = 1) {
    const item = inventory.value.find(i => i.id === itemId)
    
    if (item) {
      if (item.quantity <= quantity) {
        // Supprimer complètement l'item
        inventory.value = inventory.value.filter(i => i.id !== itemId)
      } else {
        // Réduire la quantité
        item.quantity -= quantity
      }
      return true
    }
    
    return false
  }
  
  function addGold(amount: number) {
    gold.value += amount
  }
  
  function spendGold(amount: number): boolean {
    if (gold.value >= amount) {
      gold.value -= amount
      return true
    }
    return false
  }
  
  function saveGame() {
    // Sauvegarder l'état du jeu dans localStorage
    if (player.value) {
      try {
        localStorage.setItem('beast_ride_player', JSON.stringify(player.value))
        localStorage.setItem('beast_ride_world_map', JSON.stringify(worldMap.value))
        localStorage.setItem('beast_ride_game_state', JSON.stringify({
          inventory: inventory.value,
          gold: gold.value,
          time: currentGameTime.value,
          season: currentSeason.value,
          day: dayCount.value,
          weather: currentWeather.value,
          activeQuests: activeQuests.value,
          completedQuests: completedQuests.value
        }))
        
        return true
      } catch (error) {
        console.error('Error saving game:', error)
        return false
      }
    }
    return false
  }
  
  function loadGame(): boolean {
    try {
      const savedPlayer = localStorage.getItem('beast_ride_player')
      const savedWorldMap = localStorage.getItem('beast_ride_world_map')
      const savedGameState = localStorage.getItem('beast_ride_game_state')
      
      if (savedPlayer && savedWorldMap && savedGameState) {
        const playerData = JSON.parse(savedPlayer)
        const worldMapData = JSON.parse(savedWorldMap)
        const gameStateData = JSON.parse(savedGameState)
        
        // Reconstruire le héros avec son prototype
        const hero = new Hero(
          playerData.id,
          playerData.name,
          playerData.stats
        )
        
        // Recréer le SoulBond
        if (playerData.soulBond) {
          const spiritData = playerData.soulBond
          const spirit = new AnimalSpirit(
            spiritData.id,
            spiritData.name,
            spiritData.type,
            spiritData.stats
          )
          
          spirit.abilities = spiritData.abilities
          spirit.growthStage = spiritData.growthStage
          spirit.experience = spiritData.experience
          
          hero.bondWithSpirit(spirit)
        }
        
        player.value = hero
        worldMap.value = worldMapData
        
        // Restaurer les autres états
        inventory.value = gameStateData.inventory
        gold.value = gameStateData.gold
        currentGameTime.value = gameStateData.time
        currentSeason.value = gameStateData.season
        dayCount.value = gameStateData.day
        currentWeather.value = gameStateData.weather
        activeQuests.value = gameStateData.activeQuests
        completedQuests.value = gameStateData.completedQuests
        
        gameInitialized.value = true
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error loading game:', error)
      return false
    }
  }
  
  function healPlayer(amount: number) {
    if (player.value?.soulBond) {
      const spirit = player.value.soulBond
      spirit.stats.currentHealth = Math.min(
        spirit.stats.maxHealth,
        spirit.stats.currentHealth + amount
      )
    }
  }
  
  function gainExperience(amount: number) {
    if (player.value?.soulBond) {
      player.value.soulBond.experience += amount
      
      // Logique de niveau (à développer)
      checkLevelUp()
    }
  }
  
  function checkLevelUp() {
    // Logique simplifiée de montée de niveau
    // À développer avec un système plus complet
  }
  
  return {
    // État
    player,
    worldMap,
    inventory,
    gold,
    currentGameTime,
    currentSeason,
    dayCount,
    currentWeather,
    weatherEffects,
    activeQuests,
    completedQuests,
    gameInitialized,
    
    // Propriétés calculées
    playerHealth,
    playerMaxHealth,
    
    // Actions
    setPlayer,
    setWorldMap,
    initializeWorld,
    advanceTime,
    createRandomEnemy,
    addItemToInventory,
    removeItemFromInventory,
    addGold,
    spendGold,
    saveGame,
    loadGame,
    healPlayer,
    gainExperience
  }
})