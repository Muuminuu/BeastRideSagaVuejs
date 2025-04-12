<!-- src/views/CombatView.vue -->
<template>
  <div class="combat-container" v-if="isReady">
    <div class="combat-header">
      {{ locationName }} - {{ timeOfDay }} - {{ season }}
    </div>
    
    <div class="combatants" v-if="playerSpirit && currentEnemy">
      <div class="player-spirit">
        <div class="name">{{ playerSpirit.name }} ({{ playerSpirit.growthStage }})</div>
        <div class="health">PV: {{ playerSpirit.stats.currentHealth }}/{{ playerSpirit.stats.maxHealth }}</div>
        <div class="health-bar">
          <div 
            class="health-bar-fill" 
            :style="{ width: (playerSpirit.stats.currentHealth / playerSpirit.stats.maxHealth) * 100 + '%' }"
          ></div>
        </div>
      </div>
      
      <div class="enemy">
        <div class="name">{{ currentEnemy.name }}</div>
        <div class="health">PV: {{ currentEnemy.stats.currentHealth }}/{{ currentEnemy.stats.maxHealth }}</div>
        <div class="health-bar">
          <div 
            class="health-bar-fill" 
            :style="{ width: (currentEnemy.stats.currentHealth / currentEnemy.stats.maxHealth) * 100 + '%' }"
          ></div>
        </div>
      </div>
    </div>
    
    <div class="action-area" v-if="isPlayerTurn && combatState && !combatState.combatEnded">
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
    
    <div class="combat-log" v-if="combatState">
      <div v-for="(message, index) in combatState.messages.slice(-3)" :key="index">
        {{ message }}
      </div>
    </div>
    
    <div class="combat-result" v-if="combatState && combatState.combatEnded">
      <h2>{{ combatState.playerWon ? 'Victoire!' : 'Défaite...' }}</h2>
      <button @click="endCombat">Continuer</button>
    </div>
  </div>
  <div v-else class="loading">
    Chargement du combat...
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ActionType } from '@/core/types/Enums';
import { CombatSystem } from '@/core/systems/CombatSystem';
import type { CombatState, PlayerAction } from '@/core/systems/CombatSystem';
import { Hero } from '@/core/entities/Hero';
import { Enemy } from '@/core/entities/Enemy';
import type { Ability } from '@/core/types/Ability';
import { useGameStore, GameTime, Season } from '@/stores/game.ts';

export default defineComponent({
  name: 'CombatView',
  setup() {
    const router = useRouter();
    const gameStore = useGameStore();
    const isReady = ref(false);
    const player = ref<Hero | null>(null);
    const enemies = ref<Enemy[]>([]);

    const locationName = computed(() => {
      return gameStore.currentRegion?.name || 'Zone inconnue';
    });

    const timeOfDay = computed(() => {
      switch(gameStore.currentGameTime) {
        case GameTime.Morning: return 'Matin';
        case GameTime.Afternoon: return 'Après-midi';
        case GameTime.Evening: return 'Soir';
        case GameTime.Night: return 'Nuit';
        default: return 'Jour';
      }
    })

    const season = computed(() => {
      switch(gameStore.currentSeason) {
        case Season.Spring: return 'Printemps';
        case Season.Summer: return 'Été';
        case Season.Fall : return 'Automne';
        case Season.Winter: return 'Hiver';
        default: return 'Saison inconnue';
      }
    });
    
    const combatSystem = new CombatSystem();
    const combatState = ref<CombatState | null>(null);
    const selectedAction = ref<ActionType | null>(null);

    // Chargement des données
    onMounted(() => {
      try {
        // Dans une application réelle, vous pourriez passer directement les données depuis le store
        // au lieu d'utiliser localStorage
        const storedPlayer = localStorage.getItem('combatPlayer');
        const storedEnemies = localStorage.getItem('combatEnemies');
        
        if (storedPlayer && storedEnemies) {
          // Reconstruction des objets avec leurs prototypes
          // Note: Ceci est une simplification, en pratique vous auriez besoin
          // de reconstruire complètement les objets avec leurs prototypes
          const playerData = JSON.parse(storedPlayer);
          const enemiesData = JSON.parse(storedEnemies);
          
          // Recréer le Hero avec son prototype
          player.value = new Hero(
            playerData.id, 
            playerData.name, 
            playerData.stats
          );
          
          // Recréer le SoulBond
          if (playerData.soulBond) {
            const spiritData = playerData.soulBond;
            const spirit = new AnimalSpirit(
              spiritData.id,
              spiritData.name,
              spiritData.type,
              spiritData.stats
            );
            
            // Ajouter les capacités
            spirit.abilities = spiritData.abilities;
            spirit.growthStage = spiritData.growthStage;
            spirit.experience = spiritData.experience;
            
            // Lier l'esprit au héros
            player.value.bondWithSpirit(spirit);
          }
          
          // Recréer les ennemis
          enemies.value = enemiesData.map((enemyData: any) => {
            const enemy = new Enemy(
              enemyData.id,
              enemyData.name,
              enemyData.type,
              enemyData.stats
            );
            
            enemy.abilities = enemyData.abilities;
            return enemy;
          });
          
          // Initialiser le combat
          if (player.value && enemies.value.length > 0) {
            combatState.value = combatSystem.initiateCombat(player.value, enemies.value);
            isReady.value = true;
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données de combat:', error);
      }
    });
    
    // Computed properties
    const playerSpirit = computed(() => {
      return player.value?.soulBond || null;
    });
    
    const currentEnemy = computed(() => {
      return combatState.value?.enemies[0] || null;
    });
    
    const isPlayerTurn = computed(() => {
      return combatState.value?.isPlayerTurn || false;
    });
    
    const availableAbilities = computed(() => {
      if (!playerSpirit.value) return [];
      return playerSpirit.value.abilities;
    });
    
    // Méthodes
    function selectAction(action: ActionType) {
      selectedAction.value = action;
      
      if (action === ActionType.Attack && currentEnemy.value) {
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
      if (!currentEnemy.value) return;
      
      executePlayerAction({
        type: ActionType.UseAbility,
        abilityId: ability.id,
        targetId: currentEnemy.value.id
      });
    }
    
    function executePlayerAction(action: PlayerAction) {
      if (!isPlayerTurn.value || !combatState.value) return;
      
      // Exécuter l'action du joueur
      combatState.value = combatSystem.executeTurn(combatState.value, action);
      
      // Continuer avec les tours des ennemis jusqu'au prochain tour du joueur ou la fin du combat
      while (combatState.value && !combatState.value.isPlayerTurn && !combatState.value.combatEnded) {
        combatState.value = combatSystem.executeTurn(combatState.value);
      }
    }
    
    function endCombat() {
      // Gain d'expérience si victoire
      if (combatState.value?.playerWon && gameStore.player?.soulBond) {
        const spirit = gameStore.player.soulBond;

        const expGain = 10 * (gameStore.currentRegion?.dangerLevel || 1);
        spirit.experience += expGain;

        // Gérer la montée de niveau
        
        gameStore.saveGame();
      }

      // Nettoyer les données du combat
      localStorage.removeItem('combatPlayer');
      localStorage.removeItem('combatEnemies');
      
      // Rediriger vers une autre page
      router.push('/world');
    }
    
    return {
      isReady,
      combatState,
      playerSpirit,
      currentEnemy,
      isPlayerTurn,
      availableAbilities,
      locationName,
      timeOfDay,
      season,
      selectAction,
      useAbility,
      endCombat,
      ActionType
    };
  }
});

// Import local à ajouter ici pour éviter une erreur dans le bloc setup
import { AnimalSpirit } from '@/core/entities/AnimalSpirit';
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

.loading {
  text-align: center;
  padding: 50px;
  font-size: 18px;
}
</style>