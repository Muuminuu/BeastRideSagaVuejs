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
            { 'tile-fog': !isTileVisible(x + viewportStart.x, y + viewportStart.y) },
            { 'tile-discovered': !isTileVisible(x + viewportStart.x, y + viewportStart.y) && isTileDiscovered(x + viewportStart.x, y + viewportStart.y) }
          ]"
          @click="handleTileClick(x + viewportStart.x, y + viewportStart.y)"
          :title="isTileVisible(x + viewportStart.x, y + viewportStart.y) || isTileDiscovered(x + viewportStart.x, y + viewportStart.y) ? tile.description : 'Zone inexplorée'"
        >
          <div v-if="isPlayerPosition(x + viewportStart.x, y + viewportStart.y)" class="player-sprite"></div>
          <div v-else-if="tile.entity && isTileVisible(x + viewportStart.x, y + viewportStart.y)" 
               class="entity-sprite" 
               :class="`entity-${tile.entity.type}`"
               :title="tile.entity.name || tile.entity.type"></div>
        </div>
      </div>
      <div class="map-controls">
        <div class="zoom-controls">
          <button @click="zoomIn" class="zoom-button">+</button>
          <button @click="zoomOut" class="zoom-button">-</button>
        </div>
        <div class="mini-map" v-if="showMiniMap">
          <div class="mini-map-content">
            <!-- Implémentation d'une mini-carte ici -->
          </div>
        </div>
      </div>
    </div>
  </template>
    
  <script lang="ts">
  import { defineComponent, computed, ref, watch } from 'vue';
  import type { PropType } from 'vue';
  import type { MapTile, Position, Direction } from '@/types';
  import { useGameStore } from '@/stores/game';
    
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
      const gameStore = useGameStore();
      const tileSize = ref(32); // Taille de base des tuiles
      const showMiniMap = ref(false); // Option pour afficher une mini-carte
      
      // Taille de la fenêtre visible autour du joueur
      const viewportSize = computed(() => ({
        width: Math.min(15, Math.floor(window.innerWidth / tileSize.value)),
        height: Math.min(10, Math.floor(window.innerHeight / tileSize.value * 0.7))
      }));
      
      // Position de départ de la fenêtre visible (centrée sur le joueur)
      const viewportStart = ref({ 
        x: Math.max(0, props.playerPosition.x - Math.floor(viewportSize.value.width / 2)),
        y: Math.max(0, props.playerPosition.y - Math.floor(viewportSize.value.height / 2))
      });
      
      // Calculer la portion visible de la carte
      const visibleMapData = computed(() => {
        const result: MapTile[][] = [];
        
        const mapHeight = props.mapData.length;
        const mapWidth = props.mapData[0]?.length || 0;
        
        for (let y = 0; y < viewportSize.value.height; y++) {
          const mapY = y + viewportStart.value.y;
          if (mapY >= mapHeight) break;
          
          const row: MapTile[] = [];
          for (let x = 0; x < viewportSize.value.width; x++) {
            const mapX = x + viewportStart.value.x;
            if (mapX >= mapWidth) break;
            
            row.push(props.mapData[mapY][mapX]);
          }
          result.push(row);
        }
        
        return result;
      });
      
      // Fonctions d'aide pour vérifier si une tuile est visible ou découverte
      const isTileVisible = (x: number, y: number): boolean => {
        return gameStore.isTileVisible(x, y);
      };
      
      const isTileDiscovered = (x: number, y: number): boolean => {
        return gameStore.isTileDiscovered(x, y);
      };
      
      // Mettre à jour la position de la fenêtre visible quand le joueur se déplace
      watch(() => props.playerPosition, (newPos) => {
        // Calculer la nouvelle position de la fenêtre en gardant le joueur au centre
        const newX = Math.max(0, newPos.x - Math.floor(viewportSize.value.width / 2));
        const newY = Math.max(0, newPos.y - Math.floor(viewportSize.value.height / 2));
        
        // Limiter la position de la fenêtre pour ne pas dépasser les limites de la carte
        const maxX = Math.max(0, props.mapData[0]?.length - viewportSize.value.width);
        const maxY = Math.max(0, props.mapData.length - viewportSize.value.height);
        
        viewportStart.value = {
          x: Math.min(newX, maxX),
          y: Math.min(newY, maxY)
        };
      }, { immediate: true });
      
      // Vérifier si une position correspond à celle du joueur
      const isPlayerPosition = (x: number, y: number): boolean => {
        return props.playerPosition.x === x && props.playerPosition.y === y;
      };
  
      // Gestion des clics sur les tuiles
      const handleTileClick = (x: number, y: number) => {
        // Ne pas permettre de cliquer sur les tuiles non visibles et non découvertes
        if (!isTileVisible(x, y) && !isTileDiscovered(x, y)) return;
        
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
      
      // Fonctions de zoom
      const zoomIn = () => {
        if (tileSize.value < 48) {
          tileSize.value += 4;
          // Recalculer la taille du viewport
          updateViewport();
        }
      };
      
      const zoomOut = () => {
        if (tileSize.value > 16) {
          tileSize.value -= 4;
          // Recalculer la taille du viewport
          updateViewport();
        }
      };
      
      // Mettre à jour le viewport après un changement de zoom
      const updateViewport = () => {
        const newViewportSize = {
          width: Math.min(15, Math.floor(window.innerWidth / tileSize.value)),
          height: Math.min(10, Math.floor(window.innerHeight / tileSize.value * 0.7))
        };
        
        // Ajuster la position du viewport pour garder le joueur centré
        const newX = Math.max(0, props.playerPosition.x - Math.floor(newViewportSize.width / 2));
        const newY = Math.max(0, props.playerPosition.y - Math.floor(newViewportSize.height / 2));
        
        // Limiter la position
        const maxX = Math.max(0, props.mapData[0]?.length - newViewportSize.width);
        const maxY = Math.max(0, props.mapData.length - newViewportSize.height);
        
        viewportStart.value = {
          x: Math.min(newX, maxX),
          y: Math.min(newY, maxY)
        };
      };
      
      // Gérer le redimensionnement de la fenêtre
      const handleResize = () => {
        updateViewport();
      };
      
      // Ajouter/retirer les écouteurs d'événements
      window.addEventListener('resize', handleResize);
      
      // Nettoyer les écouteurs d'événements à la destruction du composant
      onUnmounted(() => {
        window.removeEventListener('resize', handleResize);
      });
    
      return {
        tileSize,
        isPlayerPosition,
        isTileVisible,
        isTileDiscovered,
        handleTileClick,
        visibleMapData,
        viewportStart,
        viewportSize,
        zoomIn,
        zoomOut,
        showMiniMap
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
    position: relative;
  }
    
  .map-row {
    display: flex;
  }
    
  .map-tile {
    width: v-bind('`${tileSize}px`');
    height: v-bind('`${tileSize}px`');
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
  
  .tile-discovered {
    position: relative;
  }
  
  .tile-discovered::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.4);
    z-index: 5;
  }
    
  .player-position {
    box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.8);
  }
    
  .player-sprite {
    width: calc(v-bind('tileSize') * 0.6);
    height: calc(v-bind('tileSize') * 0.6);
    background-color: #ff5a5a;
    border-radius: 50%;
    border: 2px solid #ffffff;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
    animation: pulse 1.5s infinite alternate;
    z-index: 20;
  }
  
  .entity-sprite {
    width: calc(v-bind('tileSize') * 0.5);
    height: calc(v-bind('tileSize') * 0.5);
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
  
  .map-controls {
    position: absolute;
    bottom: 10px;
    right: 10px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  
  .zoom-controls {
    display: flex;
    gap: 5px;
  }
  
  .zoom-button {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background-color: rgba(0, 0, 0, 0.6);
    color: white;
    border: 1px solid white;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  
  .zoom-button:hover {
    background-color: rgba(50, 50, 50, 0.8);
  }
  
  .mini-map {
    width: 100px;
    height: 100px;
    background-color: rgba(0, 0, 0, 0.6);
    border: 1px solid white;
    border-radius: 5px;
    padding: 5px;
  }
  
  .mini-map-content {
    width: 100%;
    height: 100%;
    position: relative;
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
  
  /* Styles responsifs */
  @media (max-width: 768px) {
    .map-tile {
      /* Taille réduite sur mobile */
      width: 24px;
      height: 24px;
    }
    
    .player-sprite {
      width: 14px;
      height: 14px;
    }
    
    .entity-sprite {
      width: 12px;
      height: 12px;
    }
    
    .zoom-controls {
      display: none; /* Masquer les contrôles de zoom sur mobile */
    }
  }
  </style>