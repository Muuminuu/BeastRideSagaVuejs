<!-- src/components/game/CombatView.vue -->
<template>
    <div class="combat-container">
      <div class="combat-header">
        {{ locationName }} - {{ timeOfDay }} - {{ season }}
      </div>
      
      <div class="combatants">
        <div class="player-spirit">
          <div class="name">{{ playerSpirit.name }} ({{ playerSpirit.stage }})</div>
          <div class="health">PV: {{ playerSpirit.stats.currentHealth }}/{{ playerSpirit.stats.maxHealth }}</div>
          <div class="health-bar">
            <div 
              class="health-bar-fill" 
              :style="{ width: (playerSpirit.stats.currentHealth / playerSpirit.stats.maxHealth) * 100 + '%' }"
            ></div>
          </div>
        </div>
        
        <div class="enemy">
          <div class="name">{{ currentEnemy.name }} Nv.{{ currentEnemy.level }}</div>
          <div class="health">PV: {{ currentEnemy.stats.currentHealth }}/{{ currentEnemy.stats.maxHealth }}</div>
          <div class="health-bar">
            <div 
              class="health-bar-fill" 
              :style="{ width: (currentEnemy.stats.currentHealth / currentEnemy.stats.maxHealth) * 100 + '%' }"
            ></div>
          </div>
        </div>
      </div>
      
      <div class="action-area" v-if="isPlayerTurn && !combatState.combatEnded">
        <div class="action-buttons">
          <button @click="selectAction(ActionType.Attack)">Attaque</button>
          <button 
            v-for="ability in availableAbilities" 
            :key="ability.id"
            @click="useAbility(ability)"
            :disabled="ability.currentCooldown > 0"
          >
            {{ ability.name }} {{ ability.currentCooldown > 0 ? `(CD: ${ability.currentCooldown})` : '' }}
          </button>
          <button @click="selectAction(ActionType.RunAway)">Fuir</button>
        </div>
      </div>
      
      <div class="combat-log">
        <div v-for="(message, index) in combatState.messages.slice(-3)" :key="index">
          {{ message }}
        </div>
      </div>
      
      <div class="combat-result" v-if="combatState.combatEnded">
        <h2>{{ combatState.playerWon ? 'Victoire!' : 'Défaite...' }}</h2>
        <button @click="endCombat">Continuer</button>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref, computed } from 'vue';
  import { ActionType } from '@/core/types/Enums';
  import { CombatSystem, CombatState, PlayerAction } from '@/core/systems/CombatSystem';
  import { Hero } from '@/core/entities/Hero';
  import { Enemy } from '@/core/entities/Enemy';
  import { Ability } from '@/core/types/Ability';
  
  export default defineComponent({
    name: 'CombatView',
    props: {
      player: {
        type: Object as () => Hero,
        required: true
      },
      enemies: {
        type: Array as () => Enemy[],
        required: true
      },
      locationName: {
        type: String,
        default: 'Forêt Mystique'
      },
      timeOfDay: {
        type: String,
        default: 'Jour'
      },
      season: {
        type: String,
        default: 'Printemps'
      }
    },
    setup(props, { emit }) {
      const combatSystem = new CombatSystem();
      const combatState = ref<CombatState>(combatSystem.initiateCombat(props.player, props.enemies));
      const selectedAction = ref<ActionType | null>(null);
      
      const playerSpirit = computed(() => props.player.soulBond!);
      const currentEnemy = computed(() => combatState.value.enemies[0]);
      const isPlayerTurn = computed(() => combatState.value.isPlayerTurn);
      
      const availableAbilities = computed(() => {
        return playerSpirit.value.abilities.filter(ability => {
          // Filtrer les capacités disponibles (pour simplifier l'UI)
          return true; // Pour débuter, montrons toutes les capacités
        });
      });
      
      function selectAction(action: ActionType) {
        selectedAction.value = action;
        
        if (action === ActionType.Attack) {
          // Attaque simple directement sur l'ennemi actuel
          executePlayerAction({
            type: ActionType.Attack,
            targetId: currentEnemy.value.id
          });
        } else if (action === ActionType.RunAway) {
          executePlayerAction({
            type: ActionType.RunAway
          });
        }
      }
      
      function useAbility(ability: Ability) {
        executePlayerAction({
          type: ActionType.UseAbility,
          abilityId: ability.id,
          targetId: currentEnemy.value.id
        });
      }
      
      function executePlayerAction(action: PlayerAction) {
        if (!isPlayerTurn.value) return;
        
        // Exécuter l'action du joueur
        combatState.value = combatSystem.executeTurn(combatState.value, action);
        
        // Continuer avec les tours des ennemis jusqu'au prochain tour du joueur ou la fin du combat
        while (!combatState.value.isPlayerTurn && !combatState.value.combatEnded) {
          combatState.value = combatSystem.executeTurn(combatState.value);
        }
      }
      
      function endCombat() {
        emit('combat-ended', {
          victory: combatState.value.playerWon,
          defeatedEnemies: props.enemies.filter(e => !combatState.value.enemies.includes(e))
        });
      }
      
      return {
        combatState,
        playerSpirit,
        currentEnemy,
        isPlayerTurn,
        availableAbilities,
        selectAction,
        useAbility,
        endCombat,
        ActionType
      };
    }
  });
  </script>
  
  <style scoped>
  .combat-container {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
    border: 2px solid #444;
    border-radius: 4px;
    background-color: #f0f0f0;
    font-family: monospace;
  }
  
  .combat-header {
    background-color: #444;
    color: white;
    padding: 10px;
    text-align: center;
    font-weight: bold;
  }
  
  .combatants {
    display: flex;
    justify-content: space-between;
    padding: 20px;
    border-bottom: 1px solid #ccc;
  }
  
  .player-spirit, .enemy {
    width: 45%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: white;
  }
  
  .name {
    font-weight: bold;
    margin-bottom: 5px;
  }
  
  .health-bar {
    width: 100%;
    height: 10px;
    background-color: #ddd;
    border-radius: 5px;
    margin-top: 5px;
    overflow: hidden;
  }
  
  .health-bar-fill {
    height: 100%;
    background-color: #4CAF50;
    transition: width 0.3s ease;
  }
  
  .action-area {
    padding: 15px;
    border-bottom: 1px solid #ccc;
  }
  
  .action-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .action-buttons button {
    padding: 8px 12px;
    background-color: #2196F3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .action-buttons button:hover {
    background-color: #0b7dda;
  }
  
  .action-buttons button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
  
  .combat-log {
    padding: 15px;
    height: 80px;
    overflow-y: auto;
    background-color: #f9f9f9;
    border-bottom: 1px solid #ccc;
  }
  
  .combat-result {
    padding: 20px;
    text-align: center;
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  .combat-result h2 {
    color: #4CAF50;
    margin-bottom: 15px;
  }
  
  .combat-result button {
    padding: 10px 20px;
    background-color: #2196F3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
  }
  </style>