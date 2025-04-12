<template>
    <div class="world-container">
      <div class="world-header">
        <div class="world-info">
          <div class="day-info">
            Jour {{ dayCount }} - {{ currentTimeLabel }} - {{ currentSeasonLabel }}
          </div>
          <div class="player-info">
            <span>{{ playerName }}</span>
            <span v-if="playerSpirit"> - {{ playerSpirit.name }} ({{ playerSpirit.growthStage }})</span>
          </div>
        </div>
        <button @click="saveGame" class="save-button">Sauvegarder</button>
      </div>
      
      <WorldMap 
        :regions="mapRegions"
        :currentZoneId="currentZoneId"
        :selectedRegionId="currentRegionId"
        :connections="mapConnections"
        @zoneSelected="handleZoneSelection"
      />
      
      <div class="region-details" v-if="currentRegion">
        <h2>{{ currentRegion.name }}</h2>
        <p>{{ getRegionDescription(currentRegion) }}</p>
        
        <div class="action-buttons">
          <button @click="explore" class="action-button">Explorer</button>
          <button @click="rest" class="action-button">Se reposer</button>
          <button @click="openInventory" class="action-button">Inventaire</button>
        </div>
      </div>
      
      <!-- Dialogue d'exploration -->
      <div class="exploration-modal" v-if="isExploring">
        <div class="modal-content">
          <h3>Exploration : {{ currentRegion?.name }}</h3>
          <p>{{ explorationMessage }}</p>
          
          <div class="exploration-options">
            <button 
              v-for="option in explorationOptions" 
              :key="option.id"
              @click="selectExplorationOption(option)"
              class="exploration-option"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import WorldMap from '@/components/WorldMap.vue'
  import { useGameStore, type WorldRegion, GameTime, Season } from '@/stores/game.ts'
  import { forestRegionExample, forestConnectionsExample } from '@/core/data/worldMapData'
  import type { Enemy } from '@/core/entities/Enemy'
  
  interface ExplorationOption {
    id: string
    label: string
    action: () => void
  }
  
  const router = useRouter()
  const gameStore = useGameStore()

  const currentPosition = ref({ x: 0, y: 0 })
  
  // Exploration state
  const isExploring = ref(false)
  const explorationMessage = ref('')
  const explorationOptions = ref<ExplorationOption[]>([])
  const currentZoneId = ref('')
  
  // Initialize the game world if needed
  onMounted(() => {
    if (!gameStore.gameInitialized) {
      // Try to load saved game first
      const loaded = gameStore.loadGame()
      
      if (!loaded) {
        // If no saved game, initialize a new world
        gameStore.initializeWorld()
      }
    }
  })
  
  // Computed properties
  const playerName = computed(() => gameStore.player?.name || 'Aventurier')
  const playerSpirit = computed(() => gameStore.player?.soulBond || null)
  const worldRegions = computed(() => gameStore.worldRegions)
  const currentRegionId = computed(() => gameStore.currentRegionId)
  const currentRegion = computed(() => gameStore.currentRegion)
  const dayCount = computed(() => gameStore.dayCount)
  
  const currentTimeLabel = computed(() => {
    switch (gameStore.currentGameTime) {
      case GameTime.Morning: return 'Matin'
      case GameTime.Afternoon: return 'Après-midi'
      case GameTime.Evening: return 'Soir'
      case GameTime.Night: return 'Nuit'
      default: return ''
    }
  })
  
  const currentSeasonLabel = computed(() => {
    switch (gameStore.currentSeason) {
      case Season.Spring: return 'Printemps'
      case Season.Summer: return 'Été'
      case Season.Fall: return 'Automne'
      case Season.Winter: return 'Hiver'
      default: return ''
    }
  })
  
  // Map data
  const mapRegions = computed(() => {
    // Transforme les WorldRegion en MapRegion pour le composant WorldMap
    return worldRegions.value.map(region => ({
      ...region,
      zones: [{
        id: `${region.id}_main`,
        name: region.name,
        regionId: region.id,
        position: { x: 0, y: 0 },
        size: { width: 80, height: 60 },
        terrain: getBiomeTerrain(region.biome),
        dangerLevel: region.dangerLevel,
        explored: region.explored,
        accessible: region.explored || isRegionAdjacent(region)
      }],
      visualDetails: {
        backgroundColor: getBiomeColor(region.biome),
        borderColor: '#333',
        position: { 
          x: (region.position.x * 150) + 400,
          y: (region.position.y * 150) + 300
        },
        size: { width: 120, height: 80 },
        shape: 'rect'
      }
    }))
  })
  
  const mapConnections = computed(() => {
    // Crée des connexions entre les régions adjacentes
    const connections = []
    const regions = worldRegions.value
    
    for (let i = 0; i < regions.length; i++) {
      for (let j = i + 1; j < regions.length; j++) {
        if (areRegionsAdjacent(regions[i], regions[j])) {
          connections.push({
            id: `connection_${regions[i].id}_${regions[j].id}`,
            fromZoneId: `${regions[i].id}_main`,
            toZoneId: `${regions[j].id}_main`,
            type: getConnectionType(regions[i].biome, regions[j].biome)
          })
        }
      }
    }
    
    return connections
  })
  
  // Helper functions
  function getBiomeColor(biome: string): string {
    switch(biome) {
      case 'forest': return '#2d8659'
      case 'plains': return '#9bdb4d'
      case 'mountains': return '#8c7963'
      case 'swamp': return '#6b7e45'
      case 'beach': return '#e0c088'
      default: return '#cccccc'
    }
  }
  
  function getBiomeTerrain(biome: string): string {
    switch(biome) {
      case 'forest': return 'forest'
      case 'plains': return 'plains'
      case 'mountains': return 'mountains'
      case 'swamp': return 'swamp'
      case 'beach': return 'beach'
      default: return 'plains'
    }
  }
  
  function getConnectionType(biome1: string, biome2: string): string {
    if (biome1 === 'beach' || biome2 === 'beach') return 'river'
    if (biome1 === 'mountains' || biome2 === 'mountains') return 'trail'
    return 'road'
  }
  
  function areRegionsAdjacent(region1: WorldRegion, region2: WorldRegion): boolean {
    const dx = Math.abs(region1.position.x - region2.position.x)
    const dy = Math.abs(region1.position.y - region2.position.y)
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1)
  }
  
  function handleZoneSelection(zoneId: string) {
    const regionId = zoneId.split('_')[0]
    moveToRegion(regionId)
  }
  
  function getBiomeLabel(biome: string): string {
    switch (biome) {
      case 'forest': return 'Forêt'
      case 'plains': return 'Plaines'
      case 'mountains': return 'Montagnes'
      case 'swamp': return 'Marais'
      case 'beach': return 'Plage'
      case 'desert': return 'Désert'
      case 'tundra': return 'Toundra'
      default: return biome
    }
  }
  
  function getRegionDescription(region: WorldRegion): string {
    // Generate a description based on the region's properties
    let description = ''
    
    switch (region.biome) {
      case 'forest':
        description = 'Une forêt dense remplie d\'arbres majestueux et de créatures diverses.'
        break
      case 'plains':
        description = 'Des plaines vastes et ouvertes où les vents soufflent librement.'
        break
      case 'mountains':
        description = 'Des montagnes escarpées et impressionnantes qui touchent les nuages.'
        break
      case 'swamp':
        description = 'Un marais brumeux avec des eaux stagnantes et une végétation luxuriante.'
        break
      case 'beach':
        description = 'Une côte balayée par les vagues, où l\'océan rencontre la terre.'
        break
      default:
        description = 'Une région mystérieuse avec ses propres secrets.'
    }
    
    // Add time of day and season effects
    if (gameStore.currentGameTime === GameTime.Night) {
      description += ' Les ombres de la nuit rendent cet endroit plus dangereux.'
    }
    
    switch (gameStore.currentSeason) {
      case Season.Winter:
        description += ' Le froid de l\'hiver a transformé le paysage.'
        break
      case Season.Spring:
        description += ' Les fleurs du printemps éclosent partout.'
        break
      case Season.Summer:
        description += ' La chaleur de l\'été se fait sentir dans l\'air.'
        break
      case Season.Fall:
        description += ' Les couleurs de l\'automne parent la région de teintes rouges et dorées.'
        break
    }
    
    return description
  }

  function isRegionAdjacent(region: WorldRegion): boolean {
    return worldRegions.value.some(r => 
        r.explored && 
        areRegionsAdjacent(r, region)
    )
  }
  
  function moveToRegion(regionId: string) {
    currentRegionId.value = regionId
    const region = worldRegions.value.find(r => r.id === regionId)
    
    if (region) {
        // Mise à jour de la position courante
        currentPosition.value = region.position
        
        // Marquer la région comme explorée
        const regionToUpdate = gameStore.worldRegions.find(r => r.id === regionId)
        if (regionToUpdate) {
        regionToUpdate.explored = true
        }
    }
  }
  
  function explore() {
    if (!currentRegion.value) return
    
    isExploring.value = true
    
    // 50% chance of encounter, 30% chance of finding item, 20% chance of nothing
    const roll = Math.random()
    
    if (roll < 0.5) {
      // Combat encounter
      explorationMessage.value = `Vous avez rencontré des ennemis dans ${currentRegion.value.name}!`
      
      explorationOptions.value = [
        {
          id: 'fight',
          label: 'Combattre',
          action: () => {
            // Initialize combat
            initializeCombat()
          }
        },
        {
          id: 'flee',
          label: 'Fuir',
          action: () => {
            // 70% chance to escape
            if (Math.random() < 0.7) {
              explorationMessage.value = 'Vous avez réussi à échapper au danger.'
              explorationOptions.value = [
                {
                  id: 'continue',
                  label: 'Continuer',
                  action: () => {
                    isExploring.value = false
                  }
                }
              ]
            } else {
              explorationMessage.value = 'Impossible de fuir! Vous devez combattre!'
              explorationOptions.value = [
                {
                  id: 'fight',
                  label: 'Combattre',
                  action: () => {
                    initializeCombat()
                  }
                }
              ]
            }
          }
        }
      ]
    } else if (roll < 0.8) {
      // Find an item
      explorationMessage.value = 'Vous avez trouvé quelque chose d\'intéressant!'
      
      // In a real game, you'd generate a random item based on region, season, etc.
      const itemName = 'Herbe Médicinale'
      
      explorationOptions.value = [
        {
          id: 'take',
          label: `Ramasser ${itemName}`,
          action: () => {
            // Add item to inventory
            explorationMessage.value = `Vous avez ajouté ${itemName} à votre inventaire.`
            explorationOptions.value = [
              {
                id: 'continue',
                label: 'Continuer',
                action: () => {
                  isExploring.value = false
                }
              }
            ]
          }
        },
        {
          id: 'leave',
          label: 'Laisser',
          action: () => {
            explorationMessage.value = 'Vous avez décidé de laisser l\'objet.'
            explorationOptions.value = [
              {
                id: 'continue',
                label: 'Continuer',
                action: () => {
                  isExploring.value = false
                }
              }
            ]
          }
        }
      ]
    } else {
      // Nothing special
      explorationMessage.value = 'Vous explorez tranquillement la région sans rien trouver de particulier.'
      explorationOptions.value = [
        {
          id: 'continue',
          label: 'Continuer',
          action: () => {
            isExploring.value = false
          }
        }
      ]
    }
    
    // Time passes when exploring
    gameStore.advanceTime()
  }
  
  function initializeCombat() {
    if (!gameStore.player || !gameStore.player.soulBond) {
      console.error('Player or spirit not initialized')
      return
    }
    
    // Generate enemies based on current region
    // In a full game, this would be more sophisticated
    const regionId = currentRegion.value?.id || ''
    const dangerLevel = currentRegion.value?.dangerLevel || 1
    
    // Create a simple enemy for now
    const enemyLevel = Math.max(1, dangerLevel)
    const enemy = {
      id: 'enemy_' + Date.now(),
      name: getRandomEnemyName(),
      type: 'beast',
      stats: {
        maxHealth: 40 + (enemyLevel * 10),
        currentHealth: 40 + (enemyLevel * 10),
        attack: 8 + (enemyLevel * 2),
        defense: 5 + enemyLevel,
        speed: 8 + enemyLevel,
        intelligence: 5 + enemyLevel
      },
      abilities: [
        {
          id: 'enemy_attack',
          name: 'Griffes Acérées',
          description: 'Une attaque avec des griffes tranchantes',
          damageType: 'physical',
          power: 10 + enemyLevel,
          cooldown: 2,
          currentCooldown: 0,
          targetType: 'singleEnemy'
        }
      ]
    }
    
    // Store combat data in localStorage for the combat view
    localStorage.setItem('combatPlayer', JSON.stringify(gameStore.player))
    localStorage.setItem('combatEnemies', JSON.stringify([enemy]))
    
    // Navigate to combat view
    router.push('/combat')
  }
  
  function getRandomEnemyName(): string {
    const enemies = [
      'Loup Sauvage', 'Ours Féroce', 'Sanglier Enragé', 
      'Serpent Venimeux', 'Aigle Chasseur', 'Lynx Embusqué',
      'Scorpion Géant', 'Araignée Tisseuse', 'Renard Rusé'
    ]
    return enemies[Math.floor(Math.random() * enemies.length)]
  }
  
  function rest() {
    if (!gameStore.player || !gameStore.player.soulBond) return
    
    // Restore some health
    const spirit = gameStore.player.soulBond
    const healAmount = Math.floor(spirit.stats.maxHealth * 0.3)
    spirit.stats.currentHealth = Math.min(
      spirit.stats.maxHealth,
      spirit.stats.currentHealth + healAmount
    )
    
    // Time passes when resting
    gameStore.advanceTime()
    
    // Display message
    isExploring.value = true
    explorationMessage.value = `Vous vous reposez et récupérez ${healAmount} points de vie.`
    explorationOptions.value = [
      {
        id: 'continue',
        label: 'Continuer',
        action: () => {
          isExploring.value = false
        }
      }
    ]
  }
  
  function openInventory() {
    // This would open the inventory view
    // For now, just show a message
    isExploring.value = true
    explorationMessage.value = 'Fonctionnalité d\'inventaire à venir!'
    explorationOptions.value = [
      {
        id: 'continue',
        label: 'Retour',
        action: () => {
          isExploring.value = false
        }
      }
    ]
  }
  
  function saveGame() {
    const saved = gameStore.saveGame()
    if (saved) {
      isExploring.value = true
      explorationMessage.value = 'Partie sauvegardée avec succès!'
      explorationOptions.value = [
        {
          id: 'continue',
          label: 'Continuer',
          action: () => {
            isExploring.value = false
          }
        }
      ]
    } else {
      isExploring.value = true
      explorationMessage.value = 'Erreur lors de la sauvegarde!'
      explorationOptions.value = [
        {
          id: 'continue',
          label: 'Continuer',
          action: () => {
            isExploring.value = false
          }
        }
      ]
    }
  }
  
  function selectExplorationOption(option: ExplorationOption) {
    option.action()
  }
  </script>
  
  <style scoped>
  .world-container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 20px;
    position: relative;
  }
  
  .world-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 10px;
    background-color: rgba(44, 62, 80, 0.1);
    border-radius: 4px;
  }
  
  .world-info {
    display: flex;
    flex-direction: column;
  }
  
  .save-button {
    padding: 8px 16px;
    background-color: #41b883;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .save-button:hover {
    background-color: #349268;
  }
  
  .region-details {
    padding: 15px;
    background-color: rgba(44, 62, 80, 0.05);
    border-radius: 4px;
  }
  
  .action-buttons {
    display: flex;
    gap: 10px;
    margin-top: 15px;
  }
  
  .action-button {
    padding: 8px 16px;
    background-color: #2c3e50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .action-button:hover {
    background-color: #1e2b38;
  }
  
  .exploration-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }
  
  .modal-content {
    width: 90%;
    max-width: 500px;
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
  }
  
  .exploration-options {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 20px;
  }
  
  .exploration-option {
    padding: 8px 16px;
    background-color: #2c3e50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .exploration-option:hover {
    background-color: #1e2b38;
  }
  </style>