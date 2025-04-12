<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import WorldMap from '@/components/map/WorldMap.vue'
import { useWorldStore } from '@/stores/world'
import { useGameStore } from '@/stores/game'
import { useCombatStore } from '@/stores/combat'

const worldStore = useWorldStore()
const gameStore = useGameStore()
const combatStore = useCombatStore()

// État local pour le dialogue contextuel
const showInfoPanel = ref(false)
const selectedAction = ref<string | null>(null)

// Informations sur la tuile actuelle
const currentTile = computed(() => worldStore.currentTile)
const tileResources = computed(() => worldStore.getResourcesForCurrentTile())

// Statut du joueur
const playerSpirit = computed(() => gameStore.player?.soulBond)

// Informations sur l'environnement
const environmentInfo = computed(() => {
  if (!currentTile.value) return null
  
  return {
    biome: currentTile.value.biome,
    temperature: currentTile.value.temperature,
    humidity: currentTile.value.humidity,
    feature: currentTile.value.feature
  }
})

// Actions possibles sur la tuile actuelle
const availableActions = computed(() => {
  const actions = ['explorer', 'collecter', 'examiner']
  
  if (currentTile.value?.feature === 'town') {
    actions.push('visiter')
  }
  
  if (currentTile.value?.feature === 'dungeon') {
    actions.push('entrer')
  }
  
  if (currentTile.value?.feature === 'quest') {
    actions.push('quête')
  }
  
  return actions
})

// Ouvrir le panneau d'informations
const openInfoPanel = () => {
  showInfoPanel.value = true
}

// Fermer le panneau d'informations
const closeInfoPanel = () => {
  showInfoPanel.value = false
  selectedAction.value = null
}

// Exécuter une action
const executeAction = (action: string) => {
  selectedAction.value = action
  
  switch (action) {
    case 'explorer':
      exploreArea()
      break
    case 'collecter':
      collectResources()
      break
    case 'examiner':
      examineEnvironment()
      break
    case 'visiter':
      visitTown()
      break
    case 'entrer':
      enterDungeon()
      break
    case 'quête':
      startQuest()
      break
  }
}

// Fonctions d'action

// Explorer la zone (chance de rencontrer un ennemi)
const exploreArea = () => {
  const encounterChance = 0.4 // 40% de chance de rencontrer un ennemi
  
  if (Math.random() < encounterChance) {
    // Générer un ennemi
    const enemy = generateRandomEnemy()
    gameStore.addToDialogueQueue(`Vous avez rencontré un ${enemy.name} !`)
    
    // Démarrer un combat
    combatStore.startCombat(enemy)
  } else {
    // Trouver quelque chose d'intéressant
    const discoveries = [
      'Vous trouvez un petit coffre contenant 10 pièces d\'or.',
      'Vous découvrez un sentier caché qui mène à une clairière paisible.',
      'Vous repérez des traces fraîches d\'un animal qui est passé par là récemment.',
      'Vous trouvez un petit étang où votre esprit peut se rafraîchir.',
      'La zone semble calme et sans danger particulier.'
    ]
    
    const discoveryIndex = Math.floor(Math.random() * discoveries.length)
    const discovery = discoveries[discoveryIndex]
    
    if (discoveryIndex === 0 && gameStore.player) {
      // Le joueur a trouvé de l'or
      gameStore.player.gold += 10
    }
    
    gameStore.addToDialogueQueue(discovery)
  }
}

// Collecter des ressources
const collectResources = () => {
  if (tileResources.value.length === 0) {
    gameStore.addToDialogueQueue('Il n\'y a pas de ressources à collecter ici.')
    return
  }
  
  // Ajouter les ressources à l'inventaire
  if (gameStore.player) {
    for (const resource of tileResources.value) {
      gameStore.player.inventory.push({
        id: `item_${Date.now()}_${Math.random()}`,
        name: resource,
        type: 'resource',
        description: `Une ressource de type ${resource}.`,
        value: 5
      })
    }
    
    gameStore.addToDialogueQueue(`Vous avez collecté ${tileResources.value.join(', ')}.`)
    
    // Vider les ressources de la tuile
    if (currentTile.value) {
      currentTile.value.resources = []
    }
  }
}

// Examiner l'environnement
const examineEnvironment = () => {
  if (!environmentInfo.value) return
  
  let description = `Vous êtes dans un biome de type ${environmentInfo.value.biome}. `
  
  if (environmentInfo.value.temperature > 30) {
    description += 'Il fait très chaud. '
  } else if (environmentInfo.value.temperature > 20) {
    description += 'La température est agréable. '
  } else if (environmentInfo.value.temperature > 10) {
    description += 'Il fait frais. '
  } else if (environmentInfo.value.temperature > 0) {
    description += 'Il fait froid. '
  } else {
    description += 'Il fait glacial. '
  }
  
  if (environmentInfo.value.humidity > 80) {
    description += 'L\'air est très humide. '
  } else if (environmentInfo.value.humidity > 50) {
    description += 'L\'humidité est modérée. '
  } else if (environmentInfo.value.humidity > 20) {
    description += 'L\'air est plutôt sec. '
  } else {
    description += 'L\'air est très sec. '
  }
  
  if (playerSpirit.value) {
    const spiritType = playerSpirit.value.type
    
    if (spiritType === 'snake' && environmentInfo.value.biome === 'swamp') {
      description += `Votre esprit ${playerSpirit.value.name} se sent revigoré dans ce marécage.`
    } else if (spiritType === 'wolf' && environmentInfo.value.biome === 'forest') {
      description += `Votre esprit ${playerSpirit.value.name} se sent à l'aise dans cette forêt.`
    } else if (spiritType === 'bear' && environmentInfo.value.biome === 'mountain') {
      description += `Votre esprit ${playerSpirit.value.name} se sent fort dans ces montagnes.`
    } else if (spiritType === 'eagle' && environmentInfo.value.biome === 'mountain') {
      description += `Votre esprit ${playerSpirit.value.name} se sent libre dans ces montagnes.`
    } else if (spiritType === 'fish' && environmentInfo.value.biome === 'water') {
      description += `Votre esprit ${playerSpirit.value.name} se sent dans son élément près de l'eau.`
    }
  }
  
  gameStore.addToDialogueQueue(description)
}

// Visiter une ville
const visitTown = () => {
  gameStore.addToDialogueQueue('Vous visitez la ville. Les habitants semblent accueillants.')
  // Implémenter plus tard: magasins, quêtes, PNJ, etc.
}

// Entrer dans un donjon
const enterDungeon = () => {
  gameStore.addToDialogueQueue('Vous entrez dans le donjon. L\'atmosphère est sombre et