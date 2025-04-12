<template>
  <div class="game-container">
    <h1>Beast Ride Saga</h1>
    
    <div v-if="gameStore.isLoadingMap" class="loading-screen">
      <div class="loading-animation"></div>
      <p>Génération du monde en cours...</p>
    </div>
    
    <template v-else>
      <div class="game-stats">
        <div class="stat-item">
          <span class="stat-label">Santé:</span>
          <div class="health-bar">
            <div class="health-fill" :style="{ width: `${gameStore.playerHealth}%` }"></div>
          </div>
          <span class="stat-value">{{ gameStore.playerHealth }}/100</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Niveau:</span>
          <span class="stat-value">{{ gameStore.playerLevel }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">EXP:</span>
          <div class="exp-bar">
            <div class="exp-fill" :style="{ width: `${(gameStore.player.experience / (gameStore.playerLevel * 100)) * 100}%` }"></div>
          </div>
          <span class="stat-value">{{ gameStore.player.experience }}/{{ gameStore.playerLevel * 100 }}</span>
        </div>
        <div class="stat-item exploration">
          <span class="stat-label">Exploration:</span>
          <span class="stat-value">{{ gameStore.getDiscoveredPercentage() }}%</span>
        </div>
      </div>
      
      <div class="top-container">
        <div class="game-info">
          <h2>Journal</h2>
          <div class="message-log">
            <div v-for="(message, index) in gameStore.messages" :key="index" class="message">
              {{ message }}
            </div>
          </div>
          <div class="tile-info">
            <strong>Position actuelle:</strong>
            <span v-if="gameStore.currentTile.description">{{ gameStore.currentTile.description }}</span>
            <span v-else>Déplacez-vous pour explorer</span>
          </div>
        </div>
        
        <div class="inventory-panel">
          <h2>Inventaire</h2>
          <div class="inventory-list">
            <div v-if="gameStore.playerInventory.length === 0" class="empty-inventory">
              Votre inventaire est vide.
            </div>
            <div v-else v-for="(item, index) in gameStore.playerInventory" :key="index" class="inventory-item">
              <strong>{{ item.name }}</strong>
              <span class="item-description">{{ item.description }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="map-container">
        <RPGMap
          :mapData="gameStore.mapData"
          :playerPosition="gameStore.playerPosition"
          :visibleMap="gameStore.visibleMap"
          @move="gameStore.movePlayer"
        />
      </div>
      
      <div class="controls">
        <div class="controls-info">
          <p>Utilisez les flèches du clavier ou les boutons ci-dessous pour vous déplacer</p>
        </div>
        <button @click="gameStore.movePlayer('up')" :disabled="!gameStore.canMove">↑</button>
        <div class="horizontal-controls">
          <button @click="gameStore.movePlayer('left')" :disabled="!gameStore.canMove">←</button>
          <button @click="gameStore.movePlayer('right')" :disabled="!gameStore.canMove">→</button>
        </div>
        <button @click="gameStore.movePlayer('down')" :disabled="!gameStore.canMove">↓</button>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted } from 'vue';
import RPGMap from '@/components/RPGMap.vue';
import type { Direction } from '@/types';
import { useGameStore } from '@/stores/game';

export default defineComponent({
  name: 'App',
  components: {
    RPGMap
  },
  setup() {
    const gameStore = useGameStore();
    
    // Initialiser le jeu
    if (!gameStore.gameInitialized) {
      gameStore.initializeGame();
    }
    
    // Gestionnaire d'événements pour les touches du clavier
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!gameStore.canMove) return;
      
      switch (event.key) {
        case 'ArrowUp':
          gameStore.movePlayer('up');
          event.preventDefault();
          break;
        case 'ArrowDown':
          gameStore.movePlayer('down');
          event.preventDefault();
          break;
        case 'ArrowLeft':
          gameStore.movePlayer('left');
          event.preventDefault();
          break;
        case 'ArrowRight':
          gameStore.movePlayer('right');
          event.preventDefault();
          break;
      }
    };
    
    // Ajouter et supprimer les écouteurs d'événements
    onMounted(() => {
      window.addEventListener('keydown', handleKeyDown);
    });
    
    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeyDown);
    });

    return {
      gameStore
    };
  }
});
</script>

<style scoped>
.game-container {
  font-family: 'Press Start 2P', monospace;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  text-align: center;
  background-color: #f8f8f8;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 15px;
}

h1 {
  color: #4a4a4a;
  margin-bottom: 15px;
  font-size: 24px;
  text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.1);
  background: linear-gradient(to right, #7b68ee, #5a48ce);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  padding: 10px 0;
}

h2 {
  font-size: 14px;
  margin-bottom: 10px;
  text-align: left;
  color: #eee;
  border-bottom: 1px solid #444;
  padding-bottom: 5px;
}

.loading-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  background-color: #222;
  border-radius: 8px;
  border: 4px solid #333;
  color: white;
}

.loading-animation {
  width: 60px;
  height: 60px;
  border: 6px solid rgba(255, 255, 255, 0.1);
  border-top: 6px solid #7b68ee;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.top-container {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.game-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  padding: 10px;
  background-color: #333;
  border-radius: 8px;
  color: white;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 150px;
}

.exploration {
  min-width: 100px;
}

.stat-label {
  font-size: 10px;
}

.stat-value {
  font-size: 12px;
  color: #ffcc00;
}

.health-bar, .exp-bar {
  width: 100px;
  height: 12px;
  background-color: #555;
  border-radius: 6px;
  overflow: hidden;
}

.health-fill {
  height: 100%;
  background-color: #ff4444;
  transition: width 0.3s ease;
}

.exp-fill {
  height: 100%;
  background-color: #44ff44;
  transition: width 0.3s ease;
}

.game-info {
  flex: 2;
  margin-bottom: 15px;
  padding: 10px;
  background-color: #222;
  border-radius: 8px;
  border: 2px solid #555;
  color: #eee;
  display: flex;
  flex-direction: column;
  text-align: left;
}

.inventory-panel {
  flex: 1;
  padding: 10px;
  background-color: #222;
  border-radius: 8px;
  border: 2px solid #555;
  color: #eee;
  display: flex;
  flex-direction: column;
  text-align: left;
}

.inventory-list {
  flex: 1;
  overflow-y: auto;
  max-height: 150px;
}

.inventory-item {
  padding: 5px;
  margin-bottom: 5px;
  border-bottom: 1px solid #444;
  font-size: 10px;
}

.item-description {
  display: block;
  font-size: 8px;
  color: #aaa;
  margin-top: 3px;
}

.empty-inventory {
  font-size: 10px;
  color: #888;
  font-style: italic;
  padding: 10px 0;
}

.message-log {
  font-size: 10px;
  max-height: 150px;
  overflow-y: auto;
  margin-bottom: 10px;
  padding: 5px;
  background-color: #444;
  border-radius: 4px;
  text-align: left;
  flex: 1;
}

.message {
  padding: 3px 0;
  border-bottom: 1px solid #555;
}

.tile-info {
  font-size: 12px;
  padding: 5px;
  min-height: 20px;
  color: #7b68ee;
}

.map-container {
  overflow: auto;
  max-height: 60vh;
  margin: 0 auto;
  padding: 10px;
  background-color: #333;
  border-radius: 8px;
  border: 4px solid #222;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
}

.controls {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.controls-info {
  margin-bottom: 10px;
  font-size: 10px;
  color: #666;
}

.horizontal-controls {
  display: flex;
  gap: 50px;
  margin: 5px 0;
}

button {
  width: 60px;
  height: 60px;
  font-size: 24px;
  background-color: #7b68ee;
  color: white;
  border: 3px solid #5a48ce;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

button:hover:not([disabled]) {
  background-color: #6a5acd;
  transform: scale(1.05);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
}

button:active:not([disabled]) {
  transform: scale(0.95);
  background-color: #5a48ce;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

button[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .game-container {
    padding: 10px;
  }
  
  h1 {
    font-size: 20px;
  }
  
  button {
    width: 50px;
    height: 50px;
  }
  
  .game-stats {
    flex-direction: column;
    gap: 10px;
  }
  
  .stat-item {
    justify-content: space-between;
  }
  
  .health-bar, .exp-bar {
    width: 80px;
  }
  
  .top-container {
    flex-direction: column;
  }
}
</style>