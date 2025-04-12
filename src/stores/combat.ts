// src/stores/combat.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  SoulBond, 
  SpiritAttack, 
  ElementType, 
  Stats,
  calculateDamage,
  doesAttackHit,
  isCriticalHit
} from '@/models/entities/player'
import { BiomeType } from '@/models/world/tile'
import { useGameStore, GameState } from './game'
import { useWorldStore, TimeOfDay } from './world'

export interface Enemy {
  id: string
  name: string
  level: number
  element: ElementType
  stats: Stats
  attacks: SpiritAttack[]
  description: string
  isBoss: boolean
  experienceReward: number
  goldReward: number
  drops?: string[] // Items potentiellement lâchés
}

export enum CombatState {
  WAITING_FOR_PLAYER = 'waiting_for_player',
  PLAYER_EXECUTING = 'player_executing',
  ENEMY_EXECUTING = 'enemy_executing',
  COMBAT_ENDED = 'combat_ended'
}

export enum CombatResult {
  NONE = 'none',
  VICTORY = 'victory',
  DEFEAT = 'defeat',
  ESCAPE = 'escape'
}

// Multiplicateur de dommages en fonction des types
const elementalEffectiveness: Record<ElementType, Record<ElementType, number>> = {
  [ElementType.FIRE]: {
    [ElementType.FIRE]: 0.5,
    [ElementType.WATER]: 0.5,
    [ElementType.EARTH]: 2.0,
    [ElementType.AIR]: 1.0,
    [ElementType.LIGHT]: 1.0,
    [ElementType.DARK]: 1.0,
    [ElementType.NEUTRAL]: 1.0
  },
  [ElementType.WATER]: {
    [ElementType.FIRE]: 2.0,
    [ElementType.WATER]: 0.5,
    [ElementType.EARTH]: 0.5,
    [ElementType.AIR]: 1.0,
    [ElementType.LIGHT]: 1.0,
    [ElementType.DARK]: 1.0,
    [ElementType.NEUTRAL]: 1.0
  },
  [ElementType.EARTH]: {
    [ElementType.FIRE]: 0.5,
    [ElementType.WATER]: 2.0,
    [ElementType.EARTH]: 0.5,
    [ElementType.AIR]: 0.5,
    [ElementType.LIGHT]: 1.0,
    [ElementType.DARK]: 1.0,
    [ElementType.NEUTRAL]: 1.0
  },
  [ElementType.AIR]: {
    [ElementType.FIRE]: 1.0,
    [ElementType.WATER]: 1.0,
    [ElementType.EARTH]: 2.0,
    [ElementType.AIR]: 0.5,
    [ElementType.LIGHT]: 1.0,
    [ElementType.DARK]: 1.0,
    [ElementType.NEUTRAL]: 1.0
  },
  [ElementType.LIGHT]: {
    [ElementType.FIRE]: 1.0,
    [ElementType.WATER]: 1.0,
    [ElementType.EARTH]: 1.0,
    [ElementType.AIR]: 1.0,
    [ElementType.LIGHT]: 0.5,
    [ElementType.DARK]: 2.0,
    [ElementType.NEUTRAL]: 1.0
  },
  [ElementType.DARK]: {
    [ElementType.FIRE]: 1.0,
    [ElementType.WATER]: 1.0,
    [ElementType.EARTH]: 1.0,
    [ElementType.AIR]: 1.0,
    [ElementType.LIGHT]: 2.0,
    [ElementType.DARK]: 0.5,
    [ElementType.NEUTRAL]: 1.0
  },
  [ElementType.NEUTRAL]: {
    [ElementType.FIRE]: 1.0,
    [ElementType.WATER]: 1.0,
    [ElementType.EARTH]: 1.0,
    [ElementType.AIR]: 1.0,
    [ElementType.LIGHT]: 1.0,
    [ElementType.DARK]: 1.0,
    [ElementType.NEUTRAL]: 1.0
  }
}

export const useCombatStore = defineStore('combat', () => {
  // État du combat
  const currentEnemy = ref<Enemy | null>(null)
  const combatState = ref<CombatState>(CombatState.WAITING_FOR_PLAYER)
  const combatResult = ref<CombatResult>(CombatResult.NONE)
  const combatLog = ref<string[]>([])
  const turnCount = ref<number>(0)
  
  // QTE (Quick Time Events) pour les attaques
  const qteActive = ref<boolean>(false)
  const qteTimeRemaining = ref<number>(0)
  const qteSuccess = ref<boolean>(false)
  
  // Status d'évasion
  const playerTryingToEscape = ref<boolean>(false)
  const escapeAttempts = ref<number>(0)
  
  // Timer pour les cooldowns
  const combatTimer = ref<number | null>(null)
  
  // Avantages/désavantages liés au terrain
  const biomeMod = ref<{ attack: number; defense: number; speed: number }>({ attack: 1, defense: 1, speed: 1 })
  const timeOfDayMod = ref<{ attack: number; defense: number; speed: number }>({ attack: 1, defense: 1, speed: 1 })
  
  // Getters
  const gameStore = useGameStore()
  const worldStore = useWorldStore()
  
  const playerSpirit = computed(() => {
    return gameStore.player?.soulBond || null
  })
  
  const canPlayerAct = computed(() => {
    return combatState.value === CombatState.WAITING_FOR_PLAYER && combatResult.value === CombatResult.NONE
  })
  
  const spiritAttacks = computed(() => {
    return playerSpirit.value?.attacks || []
  })
  
  const getAttackEffectiveness = (attackElement: ElementType, targetElement: ElementType): number => {
    return elementalEffectiveness[attackElement][targetElement]
  }
  
  // Calculer les effets du biome et de l'heure sur les combats
  const calculateEnvironmentModifiers = (): void => {
    // Réinitialiser les modificateurs
    biomeMod.value = { attack: 1, defense: 1, speed: 1 }
    timeOfDayMod.value = { attack: 1, defense: 1, speed: 1 }
    
    // Biome
    if (worldStore.currentTile && playerSpirit.value) {
      const biome = worldStore.currentTile.biome
      const spiritType = playerSpirit.value.type
      
      // Calcul simplifié des avantages/désavantages du biome
      switch (biome) {
        case BiomeType.SWAMP:
          if (spiritType === 'snake') {
            biomeMod.value.attack *= 1.2
            biomeMod.value.speed *= 1.1
          } else if (spiritType === 'bear' || spiritType === 'eagle') {
            biomeMod.value.speed *= 0.8
          }
          break
        case BiomeType.FOREST:
          if (spiritType === 'wolf' || spiritType === 'bear') {
            biomeMod.value.attack *= 1.1
            biomeMod.value.defense *= 1.1
          } else if (spiritType === 'snake') {
            biomeMod.value.speed *= 1.1
          }
          break
        case BiomeType.MOUNTAIN:
          if (spiritType === 'eagle') {
            biomeMod.value.attack *= 1.2
            biomeMod.value.speed *= 1.2
          } else if (spiritType === 'snake') {
            biomeMod.value.defense *= 0.8
          }
          break
        case BiomeType.DESERT:
          if (spiritType === 'snake') {
            biomeMod.value.speed *= 1.2
          } else {
            biomeMod.value.speed *= 0.9
          }
          break
        case BiomeType.TUNDRA:
          if (spiritType === 'wolf') {
            biomeMod.value.defense *= 1.1
          } else {
            biomeMod.value.attack *= 0.9
          }
          break
        case BiomeType.WATER:
          if (spiritType === 'fish') {
            biomeMod.value.attack *= 1.2
            biomeMod.value.defense *= 1.2
            biomeMod.value.speed *= 1.2
          } else {
            biomeMod.value.attack *= 0.8
            biomeMod.value.speed *= 0.7
          }
          break
      }
    }
    
    // Heure du jour
    const timeOfDay = worldStore.currentTime
    if (timeOfDay === TimeOfDay.NIGHT) {
      if (playerSpirit.value?.element === ElementType.DARK) {
        timeOfDayMod.value.attack *= 1.2
      } else if (playerSpirit.value?.element === ElementType.LIGHT) {
        timeOfDayMod.value.attack *= 0.9
      }
    } else if (timeOfDay === TimeOfDay.DAY) {
      if (playerSpirit.value?.element === ElementType.LIGHT) {
        timeOfDayMod.value.attack *= 1.2
      } else if (playerSpirit.value?.element === ElementType.DARK) {
        timeOfDayMod.value.attack *= 0.9
      }
    }
  }
  
  // Actions
  function startCombat(enemy: Enemy) {
    currentEnemy.value = enemy
    combatState.value = CombatState.WAITING_FOR_PLAYER
    combatResult.value = CombatResult.NONE
    combatLog.value = [`Un combat a commencé contre ${enemy.name} !`]
    turnCount.value = 0
    escapeAttempts.value = 0
    playerTryingToEscape.value = false
    
    // Calculer les modificateurs d'environnement
    calculateEnvironmentModifiers()
    
    // Réinitialiser les cooldowns des attaques
    if (playerSpirit.value) {
      for (const attack of playerSpirit.value.attacks) {
        attack.currentCooldown = 0
      }
    }
    
    // Passer au mode combat
    gameStore.setGameState(GameState.COMBAT)
  }
  
  function executePlayerAttack(attackIndex: number) {
    if (!canPlayerAct.value || !currentEnemy.value || !playerSpirit.value) return
    
    const attack = playerSpirit.value.attacks[attackIndex]
    
    // Vérifier si l'attaque est en cooldown
    if (attack.currentCooldown > 0) {
      combatLog.value.push(`${attack.name} est encore en cooldown pour ${attack.currentCooldown} tours.`)
      return
    }
    
    combatState.value = CombatState.PLAYER_EXECUTING
    
    // QTE (Quick Time Event) pour améliorer l'efficacité de l'attaque
    startQTE(() => {
      // Cette fonction sera exécutée après le QTE
      const attackHit = doesAttackHit(
        attack,
        playerSpirit.value!.stats.speed * biomeMod.value.speed * timeOfDayMod.value.speed,
        currentEnemy.value!.stats.speed
      )
      
      if (!attackHit) {
        combatLog.value.push(`${playerSpirit.value!.name} rate son attaque ${attack.name} !`)
        finishPlayerTurn()
        return
      }
      
      const isCrit = isCriticalHit(playerSpirit.value!.stats.speed)
      const effectiveness = getAttackEffectiveness(attack.element, currentEnemy.value!.element)
      
      let damageMultiplier = 1.0
      if (qteSuccess.value) {
        damageMultiplier = 1.5 // Bonus de 50% pour QTE réussi
        combatLog.value.push("Timing parfait ! L'attaque est plus puissante !")
      }
      
      let damage = calculateDamage(
        playerSpirit.value!,
        currentEnemy.value!,
        attack,
        effectiveness,
        isCrit
      )
      
      // Appliquer les modificateurs d'environnement et de QTE
      damage = Math.floor(damage * biomeMod.value.attack * timeOfDayMod.value.attack * damageMultiplier)
      
      // Appliquer les dégâts
      currentEnemy.value!.stats.health = Math.max(0, currentEnemy.value!.stats.health - damage)
      
      // Message d'attaque
      let message = `${playerSpirit.value!.name} utilise ${attack.name} et inflige ${damage} points de dégâts à ${currentEnemy.value!.name}.`
      
      if (isCrit) {
        message += " Coup critique !"
      }
      
      if (effectiveness > 1) {
        message += " C'est super efficace !"
      } else if (effectiveness < 1) {
        message += " Ce n'est pas très efficace..."
      }
      
      combatLog.value.push(message)
      
      // Mettre l'attaque en cooldown
      attack.currentCooldown = attack.cooldown
      
      // Vérifier si l'ennemi est vaincu
      if (currentEnemy.value!.stats.health <= 0) {
        endCombat(CombatResult.VICTORY)
        return
      }
      
      // Appliquer les effets secondaires de l'attaque
      if (attack.effect) {
        applyStatusEffect(attack.effect, currentEnemy.value!)
      }
      
      finishPlayerTurn()
    })
  }
  
  function startQTE(callback: () => void) {
    qteActive.value = true
    qteTimeRemaining.value = 1.5 // 1.5 secondes pour réagir
    qteSuccess.value = false
    
    // Timer pour le QTE
    const qteInterval = setInterval(() => {
      qteTimeRemaining.value -= 0.1
      
      if (qteTimeRemaining.value <= 0) {
        clearInterval(qteInterval)
        qteActive.value = false
        callback()
      }
    }, 100)
    
    // Fonction pour permettre au joueur de répondre au QTE
    window.addEventListener('keydown', qteKeyHandler)
    
    // Nettoyage après le QTE
    setTimeout(() => {
      window.removeEventListener('keydown', qteKeyHandler)
      qteActive.value = false
      callback()
    }, 1500)
  }
  
  // Handler temporaire pour le QTE (à remplacer par une vraie implémentation UI)
  function qteKeyHandler(e: KeyboardEvent) {
    if (!qteActive.value) return
    
    // Utiliser la barre d'espace pour le QTE
    if (e.code === 'Space') {
      const timing = Math.abs(qteTimeRemaining.value - 0.75) // Le meilleur timing est à 0.75s
      
      if (timing < 0.2) {
        qteSuccess.value = true
      }
      
      qteActive.value = false
      window.removeEventListener('keydown', qteKeyHandler)
    }
  }
  
  function applyStatusEffect(effect: string, target: Enemy | SoulBond) {
    switch (effect) {
      case 'poison':
        combatLog.value.push(`${target.name} est empoisonné !`)
        break
      case 'defense_down':
        target.stats.defense = Math.floor(target.stats.defense * 0.8)
        combatLog.value.push(`La défense de ${target.name} diminue !`)
        break
      case 'attack_down':
        target.stats.attack = Math.floor(target.stats.attack * 0.8)
        combatLog.value.push(`L'attaque de ${target.name} diminue !`)
        break
      case 'speed_down':
        target.stats.speed = Math.floor(target.stats.speed * 0.8)
        combatLog.value.push(`La vitesse de ${target.name} diminue !`)
        break
      case 'stun':
        combatLog.value.push(`${target.name} est étourdi et ne peut pas attaquer ce tour !`)
        break
      case 'defense_up':
        if (target === playerSpirit.value) {
          target.stats.defense = Math.floor(target.stats.defense * 1.2)
          combatLog.value.push(`La défense de ${target.name} augmente !`)
        }
        break
      case 'attack_up':
        if (target === playerSpirit.value) {
          target.stats.attack = Math.floor(target.stats.attack * 1.2)
          combatLog.value.push(`L'attaque de ${target.name} augmente !`)
        }
        break
      case 'speed_up':
        if (target === playerSpirit.value) {
          target.stats.speed = Math.floor(target.stats.speed * 1.2)
          combatLog.value.push(`La vitesse de ${target.name} augmente !`)
        }
        break
    }
  }
  
  function finishPlayerTurn() {
    turnCount.value++
    
    // Réduire les cooldowns des attaques du joueur
    if (playerSpirit.value) {
      for (const attack of playerSpirit.value.attacks) {
        if (attack.currentCooldown > 0) {
          attack.currentCooldown--
        }
      }
    }
    
    // Tour de l'ennemi
    executeEnemyTurn()
  }
  
  function executeEnemyTurn() {
    if (!currentEnemy.value || !playerSpirit.value) return
    
    combatState.value = CombatState.ENEMY_EXECUTING
    
    // Vérifier si l'ennemi est étourdi
    const isStunned = false // À implémenter: système d'états
    
    if (isStunned) {
      combatLog.value.push(`${currentEnemy.value.name} est étourdi et ne peut pas attaquer !`)
      combatState.value = CombatState.WAITING_FOR_PLAYER
      return
    }
    
    // Sélectionner une attaque aléatoire pour l'ennemi
    const availableAttacks = currentEnemy.value.attacks.filter(a => a.currentCooldown === 0)
    
    if (availableAttacks.length === 0) {
      combatLog.value.push(`${currentEnemy.value.name} n'a pas d'attaque disponible ce tour-ci.`)
      combatState.value = CombatState.WAITING_FOR_PLAYER
      return
    }
    
    const randomAttackIndex = Math.floor(Math.random() * availableAttacks.length)
    const enemyAttack = availableAttacks[randomAttackIndex]
    
    // QTE de défense pour le joueur
    startQTE(() => {
      const attackHit = doesAttackHit(
        enemyAttack,
        currentEnemy.value!.stats.speed,
        playerSpirit.value!.stats.speed * biomeMod.value.speed * timeOfDayMod.value.speed
      )
      
      // Si le QTE est réussi, augmenter les chances d'esquiver
      let dodgeBonus = 0
      if (qteSuccess.value) {
        dodgeBonus = 0.3 // +30% de chances d'esquiver
        combatLog.value.push("Timing parfait pour l'esquive !")
      }
      
      if (!attackHit || Math.random() < dodgeBonus) {
        combatLog.value.push(`${playerSpirit.value!.name} esquive l'attaque ${enemyAttack.name} de ${currentEnemy.value!.name} !`)
        combatState.value = CombatState.WAITING_FOR_PLAYER
        return
      }
      
      const isCrit = isCriticalHit(currentEnemy.value!.stats.speed)
      const effectiveness = getAttackEffectiveness(enemyAttack.element, playerSpirit.value!.element)
      
      const damage = calculateDamage(
        currentEnemy.value!,
        playerSpirit.value!,
        enemyAttack,
        effectiveness,
        isCrit
      )
      
      // Appliquer les dégâts
      playerSpirit.value!.stats.health = Math.max(0, playerSpirit.value!.stats.health - damage)
      
      // Message d'attaque
      let message = `${currentEnemy.value!.name} utilise ${enemyAttack.name} et inflige ${damage} points de dégâts à ${playerSpirit.value!.name}.`
      
      if (isCrit) {
        message += " Coup critique !"
      }
      
      if (effectiveness > 1) {
        message += " C'est super efficace !"
      } else if (effectiveness < 1) {
        message += " Ce n'est pas très efficace..."
      }
      
      combatLog.value.push(message)
      
      // Mettre l'attaque en cooldown
      enemyAttack.currentCooldown = enemyAttack.cooldown
      
      // Vérifier si le joueur est vaincu
      if (playerSpirit.value!.stats.health <= 0) {
        endCombat(CombatResult.DEFEAT)
        return
      }
      
      // Appliquer les effets secondaires de l'attaque
      if (enemyAttack.effect) {
        applyStatusEffect(enemyAttack.effect, playerSpirit.value!)
      }
      
      // Retour au tour du joueur
      combatState.value = CombatState.WAITING_FOR_PLAYER
    })
  }
  
  function tryToEscape() {
    if (!canPlayerAct.value || !currentEnemy.value || !playerSpirit.value) return
    
    playerTryingToEscape.value = true
    escapeAttempts.value++
    
    // Calculer les chances de fuite basées sur la vitesse
    const escapeChance = 0.3 + 
                        (playerSpirit.value.stats.speed - currentEnemy.value.stats.speed) / 100 + 
                        escapeAttempts.value * 0.1
    
    if (Math.random() < escapeChance) {
      endCombat(CombatResult.ESCAPE)
    } else {
      combatLog.value.push("Vous n'avez pas réussi à fuir !")
      finishPlayerTurn()
    }
  }
  
  function endCombat(result: CombatResult) {
    combatResult.value = result
    combatState.value = CombatState.COMBAT_ENDED
    
    switch (result) {
      case CombatResult.VICTORY:
        if (currentEnemy.value) {
          combatLog.value.push(`Vous avez vaincu ${currentEnemy.value.name} !`)
          
          // Récompenses
          const xpReward = currentEnemy.value.experienceReward
          const goldReward = currentEnemy.value.goldReward
          
          combatLog.value.push(`Vous gagnez ${xpReward} points d'expérience et ${goldReward} pièces d'or.`)
          
          if (gameStore.player) {
            gameStore.player.gold += goldReward
            gameStore.addExperience(xpReward)
          }
        }
        break
      case CombatResult.DEFEAT:
        combatLog.value.push("Vous avez été vaincu !")
        // Conséquences de la défaite (perte d'or, retour au dernier point de sauvegarde, etc.)
        break
      case CombatResult.ESCAPE:
        combatLog.value.push("Vous avez réussi à fuir le combat !")
        break
    }
    
    // Délai avant de quitter l'écran de combat
    setTimeout(() => {
      gameStore.setGameState(GameState.WORLD_MAP)
    }, 3000)
  }
  
  return {
    // État
    currentEnemy,
    combatState,
    combatResult,
    combatLog,
    turnCount,
    qteActive,
    qteTimeRemaining,
    qteSuccess,
    playerTryingToEscape,
    
    // Getters
    playerSpirit,
    canPlayerAct,
    spiritAttacks,
    
    // Actions
    startCombat,
    executePlayerAttack,
    tryToEscape,
    getAttackEffectiveness
  }
})