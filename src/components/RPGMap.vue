<template>
    <div class="rpg-map">
      <div 
        v-for="(row, y) in visibleMapData" 
        :key="`row-${y + viewportStart.y}`" 
        class="map-row"
      >
        <div 
          v-for="(tile, x) in row" 
          :key="`tile-${x + viewportStart.x}-${y + viewportStart.y}`" 
          class="map-tile"
          :class="[
            `tile-${tile.type}`,
            { 'player-position': isPlayerPosition(x + viewportStart.x, y + viewportStart.y) },
            { 'tile-fog': !isTileVisible(x + viewportStart.x, y + viewportStart.y) }
          ]"
          @click="handleTileClick(x + viewportStart.x, y + viewportStart.y)"
          :title="tile.description"
        >
          <div v-if="isPlayerPosition(x + viewportStart.x, y + viewportStart.y)" class="player-sprite"></div>
          <div v-else-if="tile.entity && isTileVisible(x + viewportStart.x, y + viewportStart.y)" 
               class="entity-sprite" 
               :class="`entity-${tile.entity.type}`"></div>
        </div>
      </div>
    </div>
  </template>
    
  <script lang="ts">
  import { defineComponent, computed, ref, watch } from 'vue';
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
      },
      visibleMap: {
        type: Array as PropType<boolean[][]>,
        required: true
      }
    },
    emits: ['move'],
    setup(props, { emit }) {
      // Taille de la fenêtre visible autour du joueur
      const viewportSize = { width: 15, height: 10 };
      
      // Position de départ de la fenêtre visible
      const viewportStart = ref({ 
        x: Math.max(0, props.playerPosition.x - Math.floor(viewportSize.width / 2)),
        y: Math.max(0, props.playerPosition.y - Math.floor(viewportSize.height / 2))
      });
      
      // Calculer la portion visible de la carte
      const visibleMapData = computed(() => {
        const result: MapTile[][] = [];
        
        const mapHeight = props.mapData.length;
        const mapWidth = props.mapData[0]?.length || 0;
        
        for (let y = 0; y < viewportSize.height; y++) {
          const mapY = y + viewportStart.value.y;
          if (mapY >= mapHeight) break;
          
          const row: MapTile[] = [];
          for (let x = 0; x < viewportSize.width; x++) {
            const mapX = x + viewportStart.value.x;
            if (mapX >= mapWidth) break;
            
            row.push(props.mapData[mapY][mapX]);
          }
          result.push(row);
        }
        
        return result;
      });
      
      // Vérifier si une tuile est visible selon le brouillard de guerre
      const isTileVisible = (x: number, y: number): boolean => {
        if (x < 0 || y < 0 || x >= props.visibleMap[0]?.length || y >= props.visibleMap.length) {
          return false;
        }
        return props.visibleMap[y][x];
      };
      
      // Mettre à jour la position de la fenêtre visible quand le joueur se déplace
      watch(() => props.playerPosition, (newPos) => {
        // Calculer la nouvelle position de la fenêtre en gardant le joueur au centre
        const newX = Math.max(0, newPos.x - Math.floor(viewportSize.width / 2));
        const newY = Math.max(0, newPos.y - Math.floor(viewportSize.height / 2));
        
        // Limiter la position de la fenêtre pour ne pas dépasser les limites de la carte
        const maxX = Math.max(0, props.mapData[0]?.length - viewportSize.width);
        const maxY = Math.max(0, props.mapData.length - viewportSize.height);
        
        viewportStart.value = {
          x: Math.min(newX, maxX),
          y: Math.min(newY, maxY)
        };
      }, { immediate: true });
      
      const isPlayerPosition = (x: number, y: number): boolean => {
        return props.playerPosition.x === x && props.playerPosition.y === y;
      };
  
      const handleTileClick = (x: number, y: number) => {
        // Ne pas permettre de cliquer sur les tuiles non visibles
        if (!isTileVisible(x, y)) return;
        
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
        isTileVisible,
        handleTileClick,
        visibleMapData,
        viewportStart
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
    background-image: linear-gradient(45deg, #5aa02c 25%, #4c8c22 25%, #4c8c22 50%, #5aa02c 50%, #5aa02c 75%, #4c8c22 75%, #4c8c22 100%);
    background-size: 8px 8px;
  }
    
  .tile-water {
    background-color: #2a7fff;
    background-image: linear-gradient(to right, #2a7fff, #1a6fff);
    box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.2);
  }
    
  .tile-sand {
    background-color: #e5d3a8;
    background-image: radial-gradient(circle, #e5d3a8 0%, #d9c28e 100%);
  }
    
  .tile-forest {
    background-color: #2d6a1e;
    background-image: 
      radial-gradient(circle at 50% 20%, #3d8a2e 5%, transparent 5%),
      radial-gradient(circle at 70% 30%, #3d8a2e 5%, transparent 5%),
      radial-gradient(circle at 30% 30%, #3d8a2e 5%, transparent 5%);
  }
    
  .tile-mountain {
    background-color: #7a7a7a;
    background-image: 
      linear-gradient(45deg, #7a7a7a 0%, #5a5a5a 50%, #7a7a7a 100%);
    box-shadow: inset 2px -2px 0 rgba(255, 255, 255, 0.2);
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
    background-image: linear-gradient(to right, #d2b48c, #c0a378);
  }
  
  .tile-swamp {
    background-color: #4a6c2a;
    background-image: radial-gradient(circle, rgba(90, 120, 50, 0.6) 10%, transparent 10%);
    background-size: 15px 15px;
  }
  
  .tile-cave {
    background-color: #333;
    background-image: radial-gradient(circle, #444 5%, transparent 5%);
    background-size: 10px 10px;
  }
  
  .tile-lava {
    background-color: #ff4500;
    background-image: radial-gradient(circle, #ff7700 20%, transparent 20%);
    background-size: 10px 10px;
    animation: lava-bubble 2s infinite alternate;
  }
  
  .tile-ice {
    background-color: #a5f2f3;
    background-image: linear-gradient(135deg, #ffffff 25%, transparent 25%),
                      linear-gradient(225deg, #ffffff 25%, transparent 25%),
                      linear-gradient(315deg, #ffffff 25%, transparent 25%),
                      linear-gradient(45deg, #ffffff 25%, transparent 25%);
    background-size: 10px 10px;
  }
  
  .tile-ruins {
    background-color: #8c8c8c;
    background-image: 
      linear-gradient(90deg, transparent 0%, transparent 40%, #777 40%, #777 60%, transparent 60%, transparent 100%),
      linear-gradient(0deg, transparent 0%, transparent 40%, #777 40%, #777 60%, transparent 60%, transparent 100%);
    background-size: 15px 15px;
  }
  
  .tile-fog {
    position: relative;
  }
  
  .tile-fog::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    z-index: 10;
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
    z-index: 20;
  }
  
  .entity-sprite {
    width: 16px;
    height: 16px;
    border-radius: 3px;
    z-index: 15;
  }
  
  .entity-treasure {
    background-color: gold;
    box-shadow: 0 0 8px rgba(255, 215, 0, 0.8);
    animation: treasure-shine 2s infinite alternate;
  }
  
  .entity-npc {
    background-color: #55aaff;
    border: 2px solid #3388dd;
    animation: npc-move 3s infinite alternate;
  }
  
  .entity-enemy {
    background-color: #ff3333;
    border: 2px solid #cc0000;
    animation: enemy-pulse 1s infinite alternate;
  }
  
  .entity-item {
    background-color: #44dd44;
    border: 2px solid #22bb22;
    animation: item-float 2s infinite alternate;
  }
  
  .entity-portal {
    background-color: #aa33ff;
    border: 2px solid #7700cc;
    animation: portal-rotate 3s infinite linear;
    border-radius: 50%;
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
  
  @keyframes treasure-shine {
    from { box-shadow: 0 0 5px gold; }
    to { box-shadow: 0 0 15px gold; }
  }
  
  @keyframes npc-move {
    from { transform: translateY(0); }
    to { transform: translateY(-3px); }
  }
  
  @keyframes enemy-pulse {
    from { transform: scale(1); }
    to { transform: scale(1.15); }
  }
  
  @keyframes item-float {
    from { transform: translateY(0) rotate(0deg); }
    to { transform: translateY(-2px) rotate(10deg); }
  }
  
  @keyframes portal-rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes lava-bubble {
    0% { background-position: 0 0; }
    100% { background-position: 5px 5px; }
  }

    </style>