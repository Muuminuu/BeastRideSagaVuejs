// src/models/entities/player.ts
export enum SpiritType {
    SNAKE = 'snake',
    WOLF = 'wolf',
    BEAR = 'bear',
    EAGLE = 'eagle',
    FISH = 'fish'
  }
  
  export enum ElementType {
    FIRE = 'fire',
    WATER = 'water',
    EARTH = 'earth',
    AIR = 'air',
    LIGHT = 'light',
    DARK = 'dark',
    NEUTRAL = 'neutral'
  }
  
  export enum GrowthStage {
    JUVENILE = 'juvenile',
    ADOLESCENT = 'adolescent',
    ADULT = 'adult',
    ELDER = 'elder',
    LEGENDARY = 'legendary'
  }
  
  export interface Stats {
    health: number
    maxHealth: number
    attack: number
    defense: number
    speed: number
    specialAttack: number
    specialDefense: number
  }
  
  export interface SpiritAttack {
    name: string
    element: ElementType
    power: number
    accuracy: number
    cooldown: number
    currentCooldown: number
    description: string
    effect?: string // Effets spéciaux comme poison, paralysie, etc.
  }
  
  export interface SoulBond {
    id: string
    name: string
    type: SpiritType
    element: ElementType
    growthStage: GrowthStage
    level: number
    experience: number
    experienceToNextLevel: number
    stats: Stats
    attacks: SpiritAttack[]
    description: string
  }
  
  export interface Player {
    id: string
    name: string
    level: number
    experience: number
    experienceToNextLevel: number
    stats: Stats
    inventory: Item[]
    gold: number
    // L'esprit actuellement lié (celui utilisé en combat)
    soulBond?: SoulBond
    // Tous les esprits disponibles
    soulBonds: SoulBond[]
    completedQuests: string[]
  }
  
  export interface Item {
    id: string
    name: string
    type: 'consumable' | 'equipment' | 'key' | 'resource'
    description: string
    value: number // Prix de vente
    effect?: string // Effet lorsque consommé ou équipé
  }
  
  // Fonctions utilitaires pour la gestion des esprits et du joueur
  export const createInitialSpiritStats = (type: SpiritType): Stats => {
    const baseStats: Record<SpiritType, Stats> = {
      [SpiritType.SNAKE]: {
        health: 80,
        maxHealth: 80,
        attack: 40,
        defense: 30,
        speed: 55,
        specialAttack: 50,
        specialDefense: 40
      },
      [SpiritType.WOLF]: {
        health: 90,
        maxHealth: 90,
        attack: 60,
        defense: 40,
        speed: 50,
        specialAttack: 30,
        specialDefense: 35
      },
      [SpiritType.BEAR]: {
        health: 120,
        maxHealth: 120,
        attack: 70,
        defense: 60,
        speed: 30,
        specialAttack: 40,
        specialDefense: 45
      },
      [SpiritType.EAGLE]: {
        health: 70,
        maxHealth: 70,
        attack: 45,
        defense: 30,
        speed: 65,
        specialAttack: 55,
        specialDefense: 40
      },
      [SpiritType.FISH]: {
        health: 85,
        maxHealth: 85,
        attack: 35,
        defense: 45,
        speed: 45,
        specialAttack: 60,
        specialDefense: 55
      }
    }
    
    return { ...baseStats[type] }
  }
  
  export const getSpiritElement = (type: SpiritType): ElementType => {
    const elements: Record<SpiritType, ElementType> = {
      [SpiritType.SNAKE]: ElementType.EARTH,
      [SpiritType.WOLF]: ElementType.AIR,
      [SpiritType.BEAR]: ElementType.EARTH,
      [SpiritType.EAGLE]: ElementType.AIR,
      [SpiritType.FISH]: ElementType.WATER
    }
    
    return elements[type]
  }
  
  export const createNewSpirit = (type: SpiritType, name: string): SoulBond => {
    return {
      id: `spirit_${Date.now()}`,
      name,
      type,
      element: getSpiritElement(type),
      growthStage: GrowthStage.JUVENILE,
      level: 1,
      experience: 0,
      experienceToNextLevel: 100,
      stats: createInitialSpiritStats(type),
      attacks: getInitialAttacks(type),
      description: `Un jeune esprit de type ${type}.`
    }
  }
  
  export const createNewPlayer = (name: string, startingSpirit: SoulBond): Player => {
    return {
      id: `player_${Date.now()}`,
      name,
      level: 1,
      experience: 0,
      experienceToNextLevel: 100,
      stats: {
        health: 100,
        maxHealth: 100,
        attack: 10,
        defense: 10,
        speed: 10,
        specialAttack: 10,
        specialDefense: 10
      },
      inventory: [],
      gold: 100,
      soulBond: startingSpirit,
      soulBonds: [startingSpirit],
      completedQuests: []
    }
  }
  
  // Fonction pour calculer les dégâts d'une attaque
  export const calculateDamage = (
    attacker: { stats: Stats },
    defender: { stats: Stats },
    attack: SpiritAttack,
    typeEffectiveness: number,
    isCritical: boolean
  ): number => {
    // Formule similaire à Pokémon
    const attackStat = attack.element === ElementType.NEUTRAL 
      ? attacker.stats.attack 
      : attacker.stats.specialAttack
    
    const defenseStat = attack.element === ElementType.NEUTRAL 
      ? defender.stats.defense 
      : defender.stats.specialDefense
    
    const level = 'level' in attacker ? (attacker as any).level : 1
    
    // Base de la formule: ((2 * level / 5 + 2) * power * (attack / defense)) / 50 + 2
    let damage = ((2 * level / 5 + 2) * attack.power * (attackStat / defenseStat)) / 50 + 2
    
    // Ajustement pour type efficacité
    damage *= typeEffectiveness
    
    // Critique (×1.5)
    if (isCritical) {
      damage *= 1.5
    }
    
    // Variation aléatoire (85% à 100%)
    const randomFactor = 0.85 + Math.random() * 0.15
    damage *= randomFactor
    
    return Math.floor(damage)
  }
  
  // Fonction pour déterminer si une attaque touche
  export const doesAttackHit = (attack: SpiritAttack, attackerSpeed: number, defenderSpeed: number): boolean => {
    // La précision de base de l'attaque
    let hitChance = attack.accuracy / 100
  
    // Ajustement en fonction de la différence de vitesse
    const speedRatio = attackerSpeed / defenderSpeed
    if (speedRatio > 1) {
      // L'attaquant est plus rapide, augmenter les chances de toucher
      hitChance *= (1 + (speedRatio - 1) * 0.1)
    }
    
    // Plafonnement à 95% pour laisser une chance d'échec
    hitChance = Math.min(hitChance, 0.95)
    
    return Math.random() <= hitChance
  }
  
  // Fonction pour vérifier si une attaque est critique
  export const isCriticalHit = (attackerSpeed: number): boolean => {
    // Plus l'attaquant est rapide, plus il a de chances de faire un coup critique
    const critChance = Math.min(attackerSpeed / 512 + 0.0625, 0.25) // Max 25% de chance
    return Math.random() <= critChance
  }
  
  export const getInitialAttacks = (type: SpiritType): SpiritAttack[] => {
    const attacks: Record<SpiritType, SpiritAttack[]> = {
      [SpiritType.SNAKE]: [
        {
          name: 'Morsure venimeuse',
          element: ElementType.EARTH,
          power: 40,
          accuracy: 95,
          cooldown: 0,
          currentCooldown: 0,
          description: 'Une morsure qui peut empoisonner l\'adversaire.',
          effect: 'poison'
        },
        {
          name: 'Enroulement',
          element: ElementType.NEUTRAL,
          power: 30,
          accuracy: 100,
          cooldown: 1,
          currentCooldown: 0,
          description: 'S\'enroule autour de l\'adversaire pour l\'immobiliser.'
        }
      ],
      [SpiritType.WOLF]: [
        {
          name: 'Morsure féroce',
          element: ElementType.NEUTRAL,
          power: 45,
          accuracy: 90,
          cooldown: 0,
          currentCooldown: 0,
          description: 'Une puissante morsure qui peut faire saigner l\'adversaire.'
        },
        {
          name: 'Hurlement',
          element: ElementType.AIR,
          power: 0,
          accuracy: 100,
          cooldown: 2,
          currentCooldown: 0,
          description: 'Un hurlement qui effraie l\'adversaire et réduit sa défense.',
          effect: 'defense_down'
        }
      ],
      [SpiritType.BEAR]: [
        {
          name: 'Coup de griffe',
          element: ElementType.NEUTRAL,
          power: 55,
          accuracy: 85,
          cooldown: 0,
          currentCooldown: 0,
          description: 'Un puissant coup de griffe qui peut déchirer l\'adversaire.'
        },
        {
          name: 'Rugissement',
          element: ElementType.EARTH,
          power: 0,
          accuracy: 100,
          cooldown: 3,
          currentCooldown: 0,
          description: 'Un rugissement qui peut paralyser l\'adversaire de peur.',
          effect: 'stun'
        }
      ],
      [SpiritType.EAGLE]: [
        {
          name: 'Serre tranchante',
          element: ElementType.AIR,
          power: 40,
          accuracy: 95,
          cooldown: 0,
          currentCooldown: 0,
          description: 'Une attaque rapide avec les serres qui peut atteindre des points vitaux.'
        },
        {
          name: 'Rafale de vent',
          element: ElementType.AIR,
          power: 35,
          accuracy: 85,
          cooldown: 1,
          currentCooldown: 0,
          description: 'Crée une puissante rafale qui peut réduire la précision de l\'adversaire.',
          effect: 'accuracy_down'
        }
      ],
      [SpiritType.FISH]: [
        {
          name: 'Jet d\'eau',
          element: ElementType.WATER,
          power: 40,
          accuracy: 100,
          cooldown: 0,
          currentCooldown: 0,
          description: 'Projette un puissant jet d\'eau sur l\'adversaire.'
        },
        {
          name: 'Bouclier aquatique',
          element: ElementType.WATER,
          power: 0,
          accuracy: 100,
          cooldown: 2,
          currentCooldown: 0,
          description: 'Crée un bouclier d\'eau qui augmente la défense.',
          effect: 'defense_up'
        }
      ]