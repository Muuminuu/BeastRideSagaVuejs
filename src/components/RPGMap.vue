<template>
    <div class="rpg-map">
      <div 
        v-for="(row, y) in mapData" 
        :key="`row-${y}`" 
        class="map-row"
      >
        <div 
          v-for="(tile, x) in row" 
          :key="`tile-${x}-${y}`" 
          class="map-tile"
          :class="[
            `tile-${tile.type}`,
            { 'player-position': isPlayerPosition(x, y) }
          ]"
          @click="handleTileClick(x, y)"
          :title="tile.description"
        >
          <div v-if="isPlayerPosition(x, y)" class="player-sprite"></div>
        </div>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue';
  import type { PropType } from 'vue';
  import type { MapTile, Position, Direction } from '@/types';
  
  export default defineComponent({
    name: 'RPGMap',
    props: {
      mapData: {
        type: Array as PropType<MapTile[][]>,
        required: true
      },
      playerPosition: {
        type: Object as PropType<Position>,
        required: true
      }
    },
    emits: ['move'],
    setup(props, { emit }) {
      const isPlayerPosition = (x: number, y: number): boolean => {
        return props.playerPosition.x === x && props.playerPosition.y === y;
      };
  
      const handleTileClick = (x: number, y: number) => {
        // Calculer la direction du déplacement basée sur la position actuelle
        const dx = x - props.playerPosition.x;
        const dy = y - props.playerPosition.y;
        
        // Déplacement seulement sur les cases adjacentes
        if (Math.abs(dx) + Math.abs(dy) === 1) {
          let direction: Direction;
          
          if (dx === 1) direction = 'right';
          else if (dx === -1) direction = 'left';
          else if (dy === 1) direction = 'down';
          else direction = 'up';
          
          emit('move', direction);
        }
      };
  
      return {
        isPlayerPosition,
        handleTileClick
      };
    }
  });
  </script>
  
  <style scoped>
  .rpg-map {
    display: inline-block;
    border: 4px solid #333;
    background-color: #222;
    padding: 2px;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
  }
  
  .map-row {
    display: flex;
  }
  
  .map-tile {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    transition: transform 0.1s ease;
  }
  
  .map-tile:hover {
    transform: scale(1.05);
    cursor: pointer;
    box-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
    z-index: 1;
  }
  
  .tile-grass {
    background-color: #5aa02c;
  }
  
  .tile-water {
    background-color: #2a7fff;
  }
  
  .tile-sand {
    background-color: #e5d3a8;
  }
  
  .tile-forest {
    background-color: #2d6a1e;
  }
  
  .tile-mountain {
    background-color: #7a7a7a;
  }
  
  .tile-wall {
    background-color: #555;
    background-image: linear-gradient(45deg, #444 25%, transparent 25%),
                      linear-gradient(-45deg, #444 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, #444 75%),
                      linear-gradient(-45deg, transparent 75%, #444 75%);
    background-size: 8px 8px;
  }
  
  .tile-path {
    background-color: #d2b48c;
  }
  
  .player-position {
    box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.8);
  }
  
  .player-sprite {
    width: 20px;
    height: 20px;
    background-color: #ff5a5a;
    border-radius: 50%;
    border: 2px solid #ffffff;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
    animation: pulse 1.5s infinite alternate;
  }
  
  @keyframes pulse {
    from {
      transform: scale(1);
      box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
    }
    to {
      transform: scale(1.1);
      box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
    }
  }
  </style>