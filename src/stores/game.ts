// src/stores/game.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  Player, 
  SoulBond, 
  SpiritType, 
  createNewPlayer, 
  createNewSpirit 
} from '@/models/entities/player'
import { useWorldStore } from './world'

export enum GameState {
  INTRO = 'intro',
  WORLD_MAP = 'world_map',
  COMBAT = 'combat',
  DIALOGUE = 'dialogue',
  INVENTORY = 'inventory',
  SPIRIT_SELECTION = 'spirit_selection'
}

export const useGameStore = defineStore('game', () => {
  // État du jeu
  const gameState = ref<GameState>(GameState.INTRO)
  const player = ref<Player | null>(null)
  const gameStarted = ref<boolean>(false)
  const gameOver = ref<boolean>(false)
  const dialogueQueue = ref<string[]>([])
  const currentQuest = ref<string | null>(null)
  
  // Sélection d'esprit au début du jeu
  const availableStarterSpirits = computed(() => {
    return [
      createNewSpirit(SpiritType.SNAKE, 'Serpentis'),
      createNewSpirit(SpiritType.WOLF, 'Lupus'),
      createNewSpirit(SpiritType.BEAR, 'Ursus'),
      createNewSpirit(SpiritType.EAGLE, 'Aquila'),
      createNewSpirit(SpiritType.FISH, 'Piscis')
    ]
  })
  
  // Actions
  function initGame() {
    gameState.value = GameState.INTRO
    dialogueQueue.value = [
      "Vous vous êtes toujours senti abandonné, comme si Dieu vous avait oublié...",
      "Un jour, dans un moment de désespoir, vous lancez vos reproches vers le ciel.",
      "À votre grande surprise, une lumière aveuglante apparaît devant vous.",
      "Une voix résonne : \"Tu te plains de ton sort ? Tu n'as aucune idée des combats invisibles qui se mènent chaque jour pour protéger ton monde.\"",
      "\"Je vais te montrer. Je vais t'accorder un pouvoir rare : celui de fusionner avec les esprits des créatures.\"",
      "\"Tu vas être envoyé dans une dimension où tu devras combattre pour comprendre l'équilibre fragile de l'existence.\"",
      "\"Choisis maintenant ton premier compagnon spirituel. Ce lien sera ton ancre dans ce nouveau monde.\""
    ]
    gameStarted.value = false
    gameOver.value = false
  }
  
  function startGame(playerName: string, selectedSpirit: SoulBond) {
    player.value = createNewPlayer(playerName, selectedSpirit)
    gameStarted.value = true
    gameState.value = GameState.WORLD_MAP
    
    // Initialiser le monde
    const worldStore = useWorldStore()
    worldStore.initializeWorld()
  }
  
  function nextDialogue(): string | null {
    if (dialogueQueue.value.length > 0) {
      return dialogueQueue.value.shift() || null
    }
    
    // Si plus de dialogues et qu'on est encore dans l'intro, passer à la sélection d'esprit
    if (gameState.value === GameState.INTRO && dialogueQueue.value.length === 0) {
      gameState.value = GameState.SPIRIT_SELECTION
    }
    
    return null
  }
  
  function addExperience(amount: number) {
    if (!player.value) return
    
    player.value.experience += amount
    
    // Vérifier si le joueur monte de niveau
    if (player.value.experience >= player.value.experienceToNextLevel) {
      levelUpPlayer()
    }
    
    // Ajouter également de l'XP à l'esprit lié actuel
    if (player.value.soulBond) {
      player.value.soulBond.experience += amount
      
      // Vérifier si l'esprit monte de niveau
      if (player.value.soulBond.experience >= player.value.soulBond.experienceToNextLevel) {
        levelUpSpirit(player.value.soulBond)
      }
    }
  }
  
  function levelUpPlayer() {
    if (!player.value) return
    
    player.value.level += 1
    player.value.experience -= player.value.experienceToNextLevel
    player.value.experienceToNextLevel = Math.floor(player.value.experienceToNextLevel * 1.5)
    
    // Augmenter les statistiques du joueur
    const statGain = 5 // Gain de base par niveau
    player.value.stats.maxHealth += statGain * 2
    player.value.stats.health = player.value.stats.maxHealth
    player.value.stats.attack += statGain
    player.value.stats.defense += statGain
    player.value.stats.speed += statGain
    player.value.stats.specialAttack += statGain
    player.value.stats.specialDefense += statGain
  }
  
  function levelUpSpirit(spirit: SoulBond) {
    spirit.level += 1
    spirit.experience -= spirit.experienceToNextLevel
    spirit.experienceToNextLevel = Math.floor(spirit.experienceToNextLevel * 1.5)
    
    // Augmenter les statistiques de l'esprit
    const statGain = 3 // Gain de base par niveau
    spirit.stats.maxHealth += statGain * 2
    spirit.stats.health = spirit.stats.maxHealth
    spirit.stats.attack += statGain
    spirit.stats.defense += statGain
    spirit.stats.speed += statGain
    spirit.stats.specialAttack += statGain
    spirit.stats.specialDefense += statGain
    
    // Vérifier si l'esprit évolue
    checkSpiritGrowth(spirit)
  }
  
  function checkSpiritGrowth(spirit: SoulBond) {
    // Évolution basée sur le niveau
    if (spirit.level >= 30 && spirit.growthStage !== 'legendary') {
      spirit.growthStage = 'legendary'
      addToDialogueQueue(`${spirit.name} a atteint le stade légendaire !`)
    } else if (spirit.level >= 20 && spirit.growthStage !== 'elder' && spirit.growthStage !== 'legendary') {
      spirit.growthStage = 'elder'
      addToDialogueQueue(`${spirit.name} a atteint le stade ancien !`)
    } else if (spirit.level >= 10 && spirit.growthStage !== 'adult' && spirit.growthStage !== 'elder' && spirit.growthStage !== 'legendary') {
      spirit.growthStage = 'adult'
      addToDialogueQueue(`${spirit.name} a atteint le stade adulte !`)
    } else if (spirit.level >= 5 && spirit.growthStage === 'juvenile') {
      spirit.growthStage = 'adolescent'
      addToDialogueQueue(`${spirit.name} a atteint le stade adolescent !`)
    }
  }
  
  function addToDialogueQueue(message: string) {
    dialogueQueue.value.push(message)
    if (gameState.value !== GameState.DIALOGUE) {
      gameState.value = GameState.DIALOGUE
    }
  }
  
  function changeSoulBond(spiritId: string) {
    if (!player.value) return
    
    const newBond = player.value.soulBonds.find(spirit => spirit.id === spiritId)
    if (newBond) {
      player.value.soulBond = newBond
    }
  }
  
  function acquireNewSpirit(spirit: SoulBond) {
    if (!player.value) return
    
    player.value.soulBonds.push(spirit)
    addToDialogueQueue(`Vous avez obtenu un nouvel esprit : ${spirit.name} !`)
  }
  
  function healPlayer(amount: number) {
    if (!player.value) return
    
    player.value.stats.health = Math.min(
      player.value.stats.health + amount,
      player.value.stats.maxHealth
    )
  }
  
  function healCurrentSpirit(amount: number) {
    if (!player.value || !player.value.soulBond) return
    
    player.value.soulBond.stats.health = Math.min(
      player.value.soulBond.stats.health + amount,
      player.value.soulBond.stats.maxHealth
    )
  }
  
  function healAllSpirits() {
    if (!player.value) return
    
    for (const spirit of player.value.soulBonds) {
      spirit.stats.health = spirit.stats.maxHealth
    }
  }
  
  function setGameState(state: GameState) {
    gameState.value = state
  }
  
  function completeQuest(questId: string) {
    if (!player.value) return
    
    if (!player.value.completedQuests.includes(questId)) {
      player.value.completedQuests.push(questId)
      
      // Récompenses ici
      player.value.gold += 100 // Récompense de base
      addExperience(50) // XP de base pour compléter une quête
      
      addToDialogueQueue('Quête terminée ! Vous avez reçu 100 pièces d\'or et 50 points d\'expérience.')
    }
  }
  
  return {
    // État
    gameState,
    player,
    gameStarted,
    gameOver,
    dialogueQueue,
    currentQuest,
    availableStarterSpirits,
    
    // Actions
    initGame,
    startGame,
    nextDialogue,
    addExperience,
    levelUpPlayer,
    levelUpSpirit,
    checkSpiritGrowth,
    addToDialogueQueue,
    changeSoulBond,
    acquireNewSpirit,
    healPlayer,
    healCurrentSpirit,
    healAllSpirits,
    setGameState,
    completeQuest
  }
})