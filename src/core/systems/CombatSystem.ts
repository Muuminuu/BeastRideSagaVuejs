import { Hero } from '../entities/Hero';
import { Enemy } from '../entities/Enemy';
import { Ability } from '../types/Ability';
import { Combatant } from '../types/Interfaces';
import { ActionType } from '../types/Enums';

export interface CombatState {
  player: Hero;
  enemies: Enemy[];
  turnOrder: string[]; // IDs des entités dans l'ordre
  currentTurnIndex: number;
  roundNumber: number;
  isPlayerTurn: boolean;
  messages: string[];
  combatEnded: boolean;
  playerWon: boolean;
}

export interface PlayerAction {
  type: ActionType;
  abilityId?: string;
  targetId?: string;
}

export class CombatSystem {
  initiateCombat(player: Hero, enemies: Enemy[]): CombatState {
    if (!player.soulBond) {
      throw new Error("Le héros doit être lié à un esprit animal pour combattre");
    }
    
    // Création de l'ordre des tours basé sur la vitesse
    const allCombatants = [player.soulBond, ...enemies];
    const sortedCombatants = allCombatants.sort((a, b) => b.stats.speed - a.stats.speed);
    
    const turnOrder = sortedCombatants.map(c => c.id);
    
    return {
      player,
      enemies,
      turnOrder,
      currentTurnIndex: 0,
      roundNumber: 1,
      isPlayerTurn: turnOrder[0] === player.soulBond.id,
      messages: ["Le combat commence!"],
      combatEnded: false,
      playerWon: false
    };
  }
  
  executeTurn(state: CombatState, playerAction?: PlayerAction): CombatState {
    const newState = { ...state };
    let currentEntity: Combatant;
    let target: Combatant;
    
    // Déterminer l'entité dont c'est le tour
    const currentEntityId = state.turnOrder[state.currentTurnIndex];
    
    if (currentEntityId === state.player.soulBond?.id) {
      // Tour du joueur
      if (!playerAction) {
        throw new Error("Action du joueur requise");
      }
      
      currentEntity = state.player.soulBond;
      
      // Traiter l'action du joueur
      switch (playerAction.type) {
        case ActionType.Attack:
          // Attaque de base
          const target = state.enemies.find(e => e.id === playerAction.targetId);
          if (!target) throw new Error("Cible invalide");
          
          const damage = Math.floor(currentEntity.stats.attack * 0.8);
          target.takeDamage(damage, 'physical' as DamageType);
          
          newState.messages.push(`${currentEntity.name} attaque ${target.name} pour ${damage} dégâts!`);
          
          if (target.stats.currentHealth <= 0) {
            newState.messages.push(`${target.name} est vaincu!`);
            newState.enemies = state.enemies.filter(e => e.id !== target.id);
            newState.turnOrder = newState.turnOrder.filter(id => id !== target.id);
          }
          break;
          
        case ActionType.UseAbility:
          // Utilisation d'une capacité
          if (!playerAction.abilityId || !playerAction.targetId) {
            throw new Error("ID de capacité et de cible requis");
          }
          
          const ability = currentEntity.abilities.find(a => a.id === playerAction.abilityId);
          if (!ability) throw new Error("Capacité invalide");
          
          const abilityTarget = state.enemies.find(e => e.id === playerAction.targetId);
          if (!abilityTarget) throw new Error("Cible invalide");
          
          currentEntity.useAbility(ability, abilityTarget);
          
          newState.messages.push(`${currentEntity.name} utilise ${ability.name} sur ${abilityTarget.name}!`);
          
          if (abilityTarget.stats.currentHealth <= 0) {
            newState.messages.push(`${abilityTarget.name} est vaincu!`);
            newState.enemies = state.enemies.filter(e => e.id !== abilityTarget.id);
            newState.turnOrder = newState.turnOrder.filter(id => id !== abilityTarget.id);
          }
          break;
          
        case ActionType.RunAway:
          // Tenter de fuir
          const escapeChance = 0.5 + (currentEntity.stats.speed / 200);
          if (Math.random() < escapeChance) {
            newState.messages.push("Vous avez réussi à fuir!");
            newState.combatEnded = true;
          } else {
            newState.messages.push("Impossible de fuir!");
          }
          break;
          
        default:
          throw new Error("Action non implémentée");
      }
      
    } else {
      // Tour d'un ennemi
      currentEntity = state.enemies.find(e => e.id === currentEntityId)!;
      
      // IA simple pour l'ennemi
      const selectedAbility = (currentEntity as Enemy).selectAbility();
      target = state.player.soulBond;
      
      currentEntity.useAbility(selectedAbility, target);
      
      newState.messages.push(`${currentEntity.name} utilise ${selectedAbility.name} sur ${target.name}!`);
      
      if (target.stats.currentHealth <= 0) {
        newState.messages.push(`${target.name} est vaincu!`);
        newState.combatEnded = true;
        newState.playerWon = false;
      }
    }
    
    // Réduire le cooldown des capacités pour tous les combattants
    const allCombatants = [state.player.soulBond, ...state.enemies];
    allCombatants.forEach(combatant => {
      combatant.abilities.forEach(ability => {
        if (ability.currentCooldown > 0) {
          ability.currentCooldown--;
        }
      });
    });
    
    // Passer au combattant suivant
    newState.currentTurnIndex = (state.currentTurnIndex + 1) % state.turnOrder.length;
    
    // Si on revient au premier combattant, c'est un nouveau tour
    if (newState.currentTurnIndex === 0) {
      newState.roundNumber++;
    }
    
    // Déterminer si c'est le tour du joueur pour la prochaine action
    newState.isPlayerTurn = newState.turnOrder[newState.currentTurnIndex] === state.player.soulBond?.id;
    
    // Vérifier si le combat est terminé
    if (newState.enemies.length === 0) {
      newState.combatEnded = true;
      newState.playerWon = true;
      newState.messages.push("Vous avez gagné le combat!");
    }
    
    return newState;
  }
}