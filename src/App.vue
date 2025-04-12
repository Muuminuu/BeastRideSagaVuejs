<template>
  <div class="game-container">
    <h1>Carte RPG Old School</h1>
    <RPGMap
      :mapData="mapData"
      :playerPosition="playerPosition"
      @move="movePlayer"
    />
    <div class="controls">
      <button @click="movePlayer('up')">↑</button>
      <div class="horizontal-controls">
        <button @click="movePlayer('left')">←</button>
        <button @click="movePlayer('right')">→</button>
      </div>
      <button @click="movePlayer('down')">↓</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import RPGMap from './components/RPGMap.vue';
import { MapTile, Position, Direction, TileType } from './types';
import { generateMap } from './utils/mapGenerator';

export default defineComponent({
  name: 'App',
  components: {
    RPGMap
  },
  setup() {
    // Générer la carte
    const mapSize = { width: 20, height: 15 };
    const mapData = ref<MapTile[][]>(generateMap(mapSize.width, mapSize.height));
    
    // Position initiale du joueur (milieu de la carte)
    const playerPosition = ref<Position>({
      x: Math.floor(mapSize.width / 2),
      y: Math.floor(mapSize.height / 2)
    });

    // Fonction pour déplacer le joueur
    const movePlayer = (direction: Direction) => {
      const newPos = { ...playerPosition.value };
      
      switch (direction) {
        case 'up':
          newPos.y = Math.max(0, newPos.y - 1);
          break;
        case 'down':
          newPos.y = Math.min(mapSize.height - 1, newPos.y + 1);
          break;
        case 'left':
          newPos.x = Math.max(0, newPos.x - 1);
          break;
        case 'right':
          newPos.x = Math.min(mapSize.width - 1, newPos.x + 1);
          break;
      }
      
      // Vérifier si la nouvelle position est accessible
      if (mapData.value[newPos.y][newPos.x].type !== TileType.Wall) {
        playerPosition.value = newPos;
      }
    };

    return {
      mapData,
      playerPosition,
      movePlayer
    };
  }
});
</script>

<style scoped>
.game-container {
  font-family: 'Press Start 2P', monospace;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  text-align: center;
}

h1 {
  color: #4a4a4a;
  margin-bottom: 20px;
  font-size: 24px;
}

.controls {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.horizontal-controls {
  display: flex;
  gap: 50px;
}

button {
  width: 50px;
  height: 50px;
  font-size: 20px;
  background-color: #7b68ee;
  color: white;
  border: 2px solid #5a48ce;
  border-radius: 8px;
  cursor: pointer;
  font-family: 'Press Start 2P', monospace;
}

button:hover {
  background-color: #6a5acd;
}
</style>