<!-- src/views/ExplorationView.vue -->
<template>
    <div class="exploration-container">
      <div class="exploration-header">
        <div class="world-info">
          <div class="day-info">
            Jour {{ dayCount }} - {{ currentTimeLabel }} - {{ currentSeasonLabel }}
          </div>
          <div class="player-info">
            <span>{{ playerName }}</span>
            <span v-if="playerSpirit"> - {{ playerSpirit.name }} ({{ playerSpirit.growthStage }})</span>
          </div>
        </div>
        <div class="actions-bar">
          <button @click="saveGame" class="action-button">Sauvegarder</button>
          <button @click="openInventory" class="action-button">Inventaire</button>
          <button @click="openCharacterSheet" class="action-button">Personnage</button>
        </div>
      </div>
      
      <div class="exploration-main">
        <GameWorldMap 
          v-if="worldMapReady && worldMap" 
          :worldMap="worldMap" 
          @move="handlePlayerMove"
          @enter-location="handleEnterLocation"
        />
        <div v-else class="loading-map">
          Chargement de la carte...
        </div>
      </div>
      
      <!-- Dialogue d'événements ou de rencontres -->
      <div class="exploration-event-modal" v-if="showEventModal">
        <div class="modal-content">
          <h3>{{ eventModalTitle }}</h3>
          <div class="event-description">
            {{ eventModalDescription }}
          </div>
          
          <div class="event-options">
            <button 
              v-for="option in eventModalOptions" 
              :key="option.id"
              @click="selectEventOption(option)"
              class="event-option"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </div>
      
      <!-- Dialogue de location (entrée dans un point d'intérêt) -->
      <div class="location-modal" v-if="showLocationModal && currentLocation">
        <div class="modal-content">
          <h3>{{ currentLocation.name }}</h3>
          <div class="location-description">
            {{ currentLocation.description }}
          </div>
          
          <div v-if="currentLocation.type === 'town' || currentLocation.type === 'village'">
            <h4>Services disponibles</h4>
            <div class="location-services">
              <button 
                v-for="service in currentLocation.services" 
                :key="service"
                @click="useService(service)"
                class="service-button"
              >
                {{ getServiceName(service) }}
              </button>
            </div>
          </div>
          
          <div v-if="currentLocation.type === 'dungeon'">
            <h4>Explorer le donjon</h4>
            <p>Niveau de danger: {{ getDangerLevel(currentLocation) }}</p>
            <button 
              @click="enterDungeon" 
              class="dungeon-button"
            >
              Entrer dans le donjon
            </button>
          </div>
          
          <div class="location-actions">
            <button @click="leaveLocation" class="action-button">Quitter</button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
    import { useRouter } from 'vue-router'
    import GameWorldMap from '@/components/GameWorldMap.vue'
    import { useGameStore, GameTime, Season } from '@/stores/game.ts'
    import { 
    TerrainType,
    BiomeType,
    WorldMapGenerator, 
    WorldMapManager
    } from '@/core/world/WorldMapSystem'

// Importer les types séparément
import type { 
  WorldMap, 
  PointOfInterest,
  ServiceType
} from '@/core/world/WorldMapSystem'

  
  const router = useRouter()
  const gameStore = useGameStore()
  
  // État local
  const worldMap = ref<WorldMap | null>(null)
  const worldMapReady = ref(false)
  const showEventModal = ref(false)
  const showLocationModal = ref(false)
  const currentLocation = ref<PointOfInterest | null>(null)
  
  // Données modales d'événement
  const eventModalTitle = ref('')
  const eventModalDescription = ref('')
  const eventModalOptions = ref<{ id: string, label: string, action: () => void }[]>([])
  
  // Initialisation
  onMounted(() => {
    initializeWorld()
  })
  
  // Computed properties
  const playerName = computed(() => gameStore.player?.name || 'Aventurier')
  const playerSpirit = computed(() => gameStore.player?.soulBond || null)
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
  
  // Méthodes
  function initializeWorld() {
    // Vérifier si une carte existe déjà dans le store
    if (gameStore.worldMap) {
      worldMap.value = gameStore.worldMap
      worldMapReady.value = true
      return
    }
    
    // Générer une nouvelle carte
    const mapWidth = 100
    const mapHeight = 80
    
    const generator = new WorldMapGenerator(mapWidth, mapHeight)
    const newMap = generator.generateWorld()
    
    worldMap.value = newMap
    gameStore.setWorldMap(newMap)
    worldMapReady.value = true
  }
  
  function handlePlayerMove(direction: string, success: boolean) {
    if (success) {
      // Avancer le temps (chaque X mouvements)
      if (Math.random() < 0.2) { // 20% de chance par mouvement
        gameStore.advanceTime()
      }
      
      // Possibilité de rencontre aléatoire
      if (Math.random() < 0.1 && !showEventModal.value) { // 10% de chance par mouvement
        triggerRandomEncounter()
      }
    }
  }
  
  function handleEnterLocation(poi: PointOfInterest) {
    currentLocation.value = poi
    showLocationModal.value = true
  }
  
  function triggerRandomEncounter() {
    // Vérifier d'abord que le joueur n'est pas déjà dans un point d'intérêt
    if (currentLocation.value) return
    
    const encounterTypes = ['combat', 'discovery', 'traveler']
    const encounterType = encounterTypes[Math.floor(Math.random() * encounterTypes.length)]
    
    showEventModal.value = true
    
    switch (encounterType) {
      case 'combat':
        initiateCombatEncounter()
        break
      case 'discovery':
        initiateDiscoveryEvent()
        break
      case 'traveler':
        initiateTravelerEvent()
        break
    }
  }
  
  function initiateCombatEncounter() {
    if (!gameStore.player || !gameStore.player.soulBond) return
    
    // Déterminer le niveau de danger basé sur la région actuelle
    const dangerLevel = getDangerLevelFromCurrentPosition()
    
    eventModalTitle.value = 'Rencontre hostile'
    eventModalDescription.value = `Une créature sauvage vous attaque ! Elle semble ${getDangerDescription(dangerLevel)}.`
    
    eventModalOptions.value = [
      {
        id: 'fight',
        label: 'Combattre',
        action: () => {
          // Créer l'ennemi en fonction du niveau de danger
          const enemy = gameStore.createRandomEnemy(dangerLevel)
          
          // Stocker les données de combat
          localStorage.setItem('combatPlayer', JSON.stringify(gameStore.player))
          localStorage.setItem('combatEnemies', JSON.stringify([enemy]))
          
          // Naviguer vers la vue de combat
          router.push('/combat')
        }
      },
      {
        id: 'flee',
        label: 'Fuir',
        action: () => {
          // Chance de fuite basée sur la vitesse du joueur et le niveau de danger
          const fleeChance = 0.5 + ((gameStore.player?.soulBond?.stats.speed || 10) / 200) - (dangerLevel * 0.05)
          
          if (Math.random() < fleeChance) {
            eventModalDescription.value = 'Vous avez réussi à fuir la créature !'
            eventModalOptions.value = [
              {
                id: 'continue',
                label: 'Continuer',
                action: () => {
                  showEventModal.value = false
                }
              }
            ]
          } else {
            eventModalDescription.value = 'Impossible de fuir ! La créature vous rattrape !'
            eventModalOptions.value = [
              {
                id: 'fight-forced',
                label: 'Combattre',
                action: () => {
                  // Créer l'ennemi en fonction du niveau de danger
                  const enemy = gameStore.createRandomEnemy(dangerLevel)
                  
                  // Stocker les données de combat
                  localStorage.setItem('combatPlayer', JSON.stringify(gameStore.player))
                  localStorage.setItem('combatEnemies', JSON.stringify([enemy]))
                  
                  // Naviguer vers la vue de combat
                  router.push('/combat')
                }
              }
            ]
          }
        }
      }
    ]
  }
  
  function initiateDiscoveryEvent() {
    // Générer un événement de découverte aléatoire (item, trésor, etc.)
    const discoveryTypes = ['item', 'treasure', 'landmark']
    const discoveryType = discoveryTypes[Math.floor(Math.random() * discoveryTypes.length)]
    
    eventModalTitle.value = 'Découverte'
    
    switch (discoveryType) {
      case 'item':
        // Découverte d'un objet
        const items = [
          'Herbe médicinale', 'Champignon étrange', 'Cristal scintillant', 
          'Plume rare', 'Écorce magique', 'Fragment mystérieux'
        ]
        const item = items[Math.floor(Math.random() * items.length)]
        
        eventModalDescription.value = `Vous avez trouvé un objet intéressant : ${item} !`
        eventModalOptions.value = [
          {
            id: 'take',
            label: 'Ramasser',
            action: () => {
              // Ajouter l'objet à l'inventaire (à implémenter)
              showEventModal.value = false
            }
          },
          {
            id: 'leave',
            label: 'Laisser',
            action: () => {
              showEventModal.value = false
            }
          }
        ]
        break
        
      case 'treasure':
        // Découverte d'un trésor
        eventModalDescription.value = 'Vous avez trouvé un petit coffre caché entre les rochers !'
        eventModalOptions.value = [
          {
            id: 'open',
            label: 'Ouvrir le coffre',
            action: () => {
              const treasureContents = ['10 pièces d\'or', '25 pièces d\'or', 'un bijou précieux', 'une potion de soin']
              const treasure = treasureContents[Math.floor(Math.random() * treasureContents.length)]
              
              eventModalDescription.value = `Le coffre contient ${treasure} !`
              eventModalOptions.value = [
                {
                  id: 'take-treasure',
                  label: 'Prendre et continuer',
                  action: () => {
                    // Ajouter le trésor à l'inventaire (à implémenter)
                    showEventModal.value = false
                  }
                }
              ]
            }
          },
          {
            id: 'leave-chest',
            label: 'Laisser le coffre',
            action: () => {
              showEventModal.value = false
            }
          }
        ]
        break
        
      case 'landmark':
        // Découverte d'un point d'intérêt
        eventModalDescription.value = 'Vous apercevez une structure étrange au loin. Elle n\'est pas indiquée sur votre carte.'
        eventModalOptions.value = [
          {
            id: 'investigate',
            label: 'Examiner',
            action: () => {
              eventModalDescription.value = 'Après observation, vous décidez de marquer cet endroit sur votre carte pour une exploration future.'
              eventModalOptions.value = [
                {
                  id: 'continue',
                  label: 'Continuer',
                  action: () => {
                    // Ajouter le point d'intérêt à la carte (à implémenter)
                    showEventModal.value = false
                  }
                }
              ]
            }
          },
          {
            id: 'ignore',
            label: 'Ignorer',
            action: () => {
              showEventModal.value = false
            }
          }
        ]
        break
    }
  }
  
  function initiateTravelerEvent() {
    // Rencontre avec un voyageur, marchand, etc.
    const travelers = [
      { type: 'merchant', name: 'Marchand ambulant' },
      { type: 'adventurer', name: 'Aventurier solitaire' },
      { type: 'pilgrim', name: 'Pèlerin' },
      { type: 'scholar', name: 'Érudit en voyage' }
    ]
    
    const traveler = travelers[Math.floor(Math.random() * travelers.length)]
    
    eventModalTitle.value = `Rencontre : ${traveler.name}`
    
    switch (traveler.type) {
      case 'merchant':
        eventModalDescription.value = 'Un marchand ambulant vous propose ses services. "J\'ai des objets rares et utiles, si vous avez de quoi payer !"'
        eventModalOptions.value = [
          {
            id: 'trade',
            label: 'Commercer',
            action: () => {
              // Ouvrir l'interface de commerce (à implémenter)
              eventModalDescription.value = 'Fonctionnalité de commerce à venir !'
              eventModalOptions.value = [
                {
                  id: 'continue',
                  label: 'Continuer',
                  action: () => {
                    showEventModal.value = false
                  }
                }
              ]
            }
          },
          {
            id: 'decline',
            label: 'Décliner',
            action: () => {
              showEventModal.value = false
            }
          }
        ]
        break
        
      case 'adventurer':
        eventModalDescription.value = 'Un aventurier fatigué vous salue. "Les routes sont dangereuses ces temps-ci. Faites attention à vous !"'
        eventModalOptions.value = [
          {
            id: 'chat',
            label: 'Discuter',
            action: () => {
              eventModalDescription.value = 'L\'aventurier vous parle d\'un donjon proche où il a failli perdre la vie. Il vous indique sa position sur votre carte.'
              eventModalOptions.value = [
                {
                  id: 'thank',
                  label: 'Remercier et continuer',
                  action: () => {
                    // Révéler un donjon sur la carte (à implémenter)
                    showEventModal.value = false
                  }
                }
              ]
            }
          },
          {
            id: 'ignore-traveler',
            label: 'Continuer votre route',
            action: () => {
              showEventModal.value = false
            }
          }
        ]
        break
        
      default:
        eventModalDescription.value = `Vous croisez un ${traveler.name} sur votre chemin. Après avoir échangé quelques politesses, vous reprenez chacun votre route.`
        eventModalOptions.value = [
          {
            id: 'continue',
            label: 'Continuer',
            action: () => {
              showEventModal.value = false
            }
          }
        ]
    }
  }
  
  function selectEventOption(option: { id: string, label: string, action: () => void }) {
    option.action()
  }
  
  function saveGame() {
    if (worldMap.value) {
      gameStore.setWorldMap(worldMap.value)
    }
    
    const saved = gameStore.saveGame()
    
    if (saved) {
      eventModalTitle.value = 'Sauvegarde'
      eventModalDescription.value = 'Partie sauvegardée avec succès !'
      eventModalOptions.value = [
        {
          id: 'continue',
          label: 'Continuer',
          action: () => {
            showEventModal.value = false
          }
        }
      ]
      showEventModal.value = true
    } else {
      eventModalTitle.value = 'Erreur'
      eventModalDescription.value = 'Erreur lors de la sauvegarde !'
      eventModalOptions.value = [
        {
          id: 'continue',
          label: 'Continuer',
          action: () => {
            showEventModal.value = false
          }
        }
      ]
      showEventModal.value = true
    }
  }
  
  function openInventory() {
    eventModalTitle.value = 'Inventaire'
    eventModalDescription.value = 'Fonctionnalité d\'inventaire à venir !'
    eventModalOptions.value = [
      {
        id: 'continue',
        label: 'Fermer',
        action: () => {
          showEventModal.value = false
        }
      }
    ]
    showEventModal.value = true
  }
  
  function openCharacterSheet() {
    eventModalTitle.value = 'Fiche de personnage'
    eventModalDescription.value = 'Fonctionnalité de fiche de personnage à venir !'
    eventModalOptions.value = [
      {
        id: 'continue',
        label: 'Fermer',
        action: () => {
          showEventModal.value = false
        }
      }
    ]
    showEventModal.value = true
  }
  
  function useService(service: string) {
    // Logique pour utiliser les différents services des villes/villages
    const serviceName = getServiceName(service)
    
    eventModalTitle.value = serviceName
    eventModalDescription.value = `Fonctionnalité "${serviceName}" à venir !`
    eventModalOptions.value = [
      {
        id: 'continue',
        label: 'Retour',
        action: () => {
          showEventModal.value = false
        }
      }
    ]
    showEventModal.value = true
  }
  
  function enterDungeon() {
    // Logique pour entrer dans un donjon
    if (!currentLocation.value) return
    
    const dungeonName = currentLocation.value.name
    
    eventModalTitle.value = `Entrée dans ${dungeonName}`
    eventModalDescription.value = 'Fonctionnalité de donjon à venir !'
    eventModalOptions.value = [
      {
        id: 'continue',
        label: 'Retour',
        action: () => {
          showEventModal.value = false
        }
      }
    ]
    showEventModal.value = true
    
    // Fermer le modal de localisation
    showLocationModal.value = false
  }
  
  function leaveLocation() {
    showLocationModal.value = false
    currentLocation.value = null
  }
  
  function getDangerLevelFromCurrentPosition(): number {
    // Déterminer le niveau de danger en fonction de la position actuelle sur la carte
    // Pour l'exemple, on utilise une valeur entre 1 et 5
    if (!worldMap.value) return 1
    
    const { x, y } = worldMap.value.currentPlayerPosition
    const tile = worldMap.value.tiles[y][x]
    
    // Base sur le niveau de danger de la tuile
    let dangerLevel = tile.dangerLevel
    
    // Ajuster en fonction du temps (plus dangereux la nuit)
    if (gameStore.currentGameTime === GameTime.Night) {
      dangerLevel += 1
    }
    
    // Ajuster en fonction de la saison
    if (gameStore.currentSeason === Season.Winter) {
      dangerLevel += 1
    }
    
    // S'assurer que le niveau est entre 1 et 5
    return Math.max(1, Math.min(5, dangerLevel))
  }
  
  function getDangerLevel(location: PointOfInterest): number {
    // Pour l'exemple, on utilise une valeur entre 1 et 5
    if (location.type === 'dungeon') {
      return 3 + Math.floor(Math.random() * 3) // 3-5
    }
    
    return 1 + Math.floor(Math.random() * 2) // 1-2
  }
  
  function getDangerDescription(level: number): string {
    switch (level) {
      case 1: return 'peu menaçante'
      case 2: return 'potentiellement dangereuse'
      case 3: return 'dangereuse'
      case 4: return 'très dangereuse'
      case 5: return 'extrêmement dangereuse'
      default: return 'de menace inconnue'
    }
  }
  
  function getServiceName(service: ServiceType): string {
    const names: Record<string, string> = {
      'inn': 'Auberge',
      'shop': 'Magasin',
      'blacksmith': 'Forge',
      'temple': 'Temple',
      'guild': 'Guilde'
    }
    
    return names[service]
  }
  </script>
  
  <style scoped>
  .exploration-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-color: #2c3e50;
    color: #ecf0f1;
  }
  
  .exploration-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 20px;
    background-color: #1a1a2e;
    border-bottom: 2px solid #444;
  }
  
  .world-info {
    display: flex;
    flex-direction: column;
  }
  
  .day-info {
    font-weight: bold;
  }
  
  .actions-bar {
    display: flex;
    gap: 10px;
  }
  
  .action-button {
    background-color: #34495e;
    color: white;
    border: none;
    padding: 8px 15px;
    cursor: pointer;
    border-radius: 4px;
    transition: background-color 0.2s;
  }
  
  .action-button:hover {
    background-color: #2c3e50;
  }
  
  .exploration-main {
    flex: 1;
    display: flex;
    position: relative;
    overflow: hidden;
  }
  
  .loading-map {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    font-size: 20px;
  }
  
  /* Styles pour les modaux */
  .exploration-event-modal,
  .location-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .modal-content {
    background-color: #34495e;
    border-radius: 8px;
    padding: 20px;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  }
  
  .modal-content h3 {
    color: #f1c40f;
    margin-top: 0;
    margin-bottom: 15px;
    font-size: 20px;
  }
  
  .event-description,
  .location-description {
    margin-bottom: 20px;
    line-height: 1.6;
  }
  
  .event-options,
  .location-services,
  .location-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 20px;
  }
  
  .event-option,
  .service-button,
  .dungeon-button {
    background-color: #2980b9;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .event-option:hover,
  .service-button:hover,
  .dungeon-button:hover {
    background-color: #3498db;
  }
  
  .dungeon-button {
    background-color: #c0392b;
  }
  
  .dungeon-button:hover {
    background-color: #e74c3c;
  }
  
  /* Responsive styles */
  @media (max-width: 768px) {
    .exploration-header {
      flex-direction: column;
      gap: 10px;
    }
    
    .actions-bar {
      width: 100%;
      justify-content: space-between;
    }
    
    .modal-content {
      width: 95%;
      padding: 15px;
    }
  }
  </style>