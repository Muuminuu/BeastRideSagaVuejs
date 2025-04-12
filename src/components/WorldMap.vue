<template>
    <div class="world-map-container">
      <div class="map-controls">
        <button @click="zoomIn" class="map-control-btn">+</button>
        <button @click="zoomOut" class="map-control-btn">-</button>
        <button @click="resetView" class="map-control-btn">Reset</button>
      </div>
      
      <div 
        class="map-viewport" 
        ref="mapViewport"
        @mousedown="startPan"
        @mousemove="pan"
        @mouseup="endPan"
        @mouseleave="endPan"
        @wheel="handleZoom"
      >
        <div 
          class="map-content" 
          :style="{
            transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
            cursor: isPanning ? 'grabbing' : 'grab'
          }"
        >
          <!-- Régions du monde -->
          <div 
            v-for="region in regions" 
            :key="region.id"
            class="region"
            :class="{ 'selected-region': selectedRegionId === region.id }"
            :style="getRegionStyle(region)"
          >
            <!-- Titres des régions (affichés seulement à certains niveaux de zoom) -->
            <div class="region-title" v-if="zoom > 0.7">
              {{ region.name }}
            </div>
            
            <!-- Zones dans chaque région -->
            <div 
              v-for="zone in region.zones" 
              :key="zone.id"
              class="zone"
              :class="{
                'current-zone': currentZoneId === zone.id,
                'accessible-zone': isZoneAccessible(zone),
                'unexplored-zone': !zone.explored,
                [`terrain-${zone.terrain}`]: true
              }"
              :style="getZoneStyle(zone)"
              @click="handleZoneClick(zone)"
            >
              <div class="zone-content" v-if="zoom > 1.2 && (zone.explored || isZoneAccessible(zone))">
                <div class="zone-name">{{ zone.name }}</div>
                <div class="zone-terrain">{{ getTerrainName(zone.terrain) }}</div>
                
                <!-- Éléments spéciaux dans la zone (ville, donjon, etc.) -->
                <div v-if="zone.pointOfInterest" class="zone-poi">
                  <div class="poi-icon" :class="`poi-${zone.pointOfInterest.type}`"></div>
                </div>
              </div>
              
              <!-- Indice visuel pour zones inexplorées mais accessibles -->
              <div v-if="!zone.explored && isZoneAccessible(zone)" class="zone-unexplored-marker">
                ?
              </div>
            </div>
          </div>
          
          <!-- Connexions entre les zones (chemins, routes) -->
          <svg class="map-connections">
            <path 
              v-for="connection in visibleConnections" 
              :key="connection.id"
              :d="getConnectionPath(connection)"
              :class="{
                'connection-path': true,
                'connection-road': connection.type === 'road',
                'connection-trail': connection.type === 'trail',
                'connection-river': connection.type === 'river'
              }"
            />
          </svg>
          
          <!-- Position actuelle du joueur -->
          <div class="player-marker" :style="playerPosition">
            <div class="player-icon"></div>
          </div>
        </div>
      </div>
      
      <!-- Légende de la carte (affichée en overlay) -->
      <div class="map-legend" v-if="showLegend">
        <h4>Légende</h4>
        <div class="legend-items">
          <div class="legend-item">
            <div class="legend-icon terrain-plains"></div>
            <span>Plaines</span>
          </div>
          <div class="legend-item">
            <div class="legend-icon terrain-forest"></div>
            <span>Forêt</span>
          </div>
          <div class="legend-item">
            <div class="legend-icon terrain-hills"></div>
            <span>Collines</span>
          </div>
          <div class="legend-item">
            <div class="legend-icon terrain-mountains"></div>
            <span>Montagnes</span>
          </div>
          <div class="legend-item">
            <div class="legend-icon terrain-swamp"></div>
            <span>Marais</span>
          </div>
          <div class="legend-item">
            <div class="legend-icon terrain-water"></div>
            <span>Eau</span>
          </div>
          <div class="legend-item">
            <div class="legend-icon poi-town"></div>
            <span>Ville</span>
          </div>
          <div class="legend-item">
            <div class="legend-icon poi-dungeon"></div>
            <span>Donjon</span>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref, computed, watchEffect, PropType, onMounted } from 'vue';
  import type { WorldRegion } from '@/stores/game';
  
  // Types for enhanced map data
  interface MapZone {
    id: string;
    name: string;
    regionId: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    terrain: string;
    dangerLevel: number;
    explored: boolean;
    accessible: boolean;
    pointOfInterest?: {
      type: string;
      name: string;
    };
  }
  
  interface MapRegion extends WorldRegion {
    zones: MapZone[];
    visualDetails: {
      backgroundColor: string;
      borderColor: string;
      position: { x: number; y: number };
      size: { width: number; height: number };
      shape: string; // 'rect', 'circle', 'polygon'
      shapeCoords?: string; // For polygon shapes
    };
  }
  
  interface MapConnection {
    id: string;
    fromZoneId: string;
    toZoneId: string;
    type: string; // 'road', 'trail', 'river'
  }
  
  export default defineComponent({
    name: 'WorldMap',
    props: {
      regions: {
        type: Array as PropType<MapRegion[]>,
        required: true
      },
      currentZoneId: {
        type: String,
        default: ''
      },
      selectedRegionId: {
        type: String,
        default: ''
      },
      connections: {
        type: Array as PropType<MapConnection[]>,
        default: () => []
      }
    },
    emits: ['zoneSelected'],
    setup(props, { emit }) {
      // View state
      const zoom = ref(1);
      const panX = ref(0);
      const panY = ref(0);
      const isPanning = ref(false);
      const startPanX = ref(0);
      const startPanY = ref(0);
      const lastMouseX = ref(0);
      const lastMouseY = ref(0);
      const showLegend = ref(true);
      const mapViewport = ref<HTMLElement | null>(null);
      
      // Computed properties
      const visibleConnections = computed(() => {
        return props.connections.filter(connection => {
          // Determine if connection is between explored or accessible zones
          const fromZone = findZoneById(connection.fromZoneId);
          const toZone = findZoneById(connection.toZoneId);
          
          if (!fromZone || !toZone) return false;
          
          return (fromZone.explored || isZoneAccessible(fromZone)) && 
                 (toZone.explored || isZoneAccessible(toZone));
        });
      });
      
      const playerPosition = computed(() => {
        // Find current zone
        const currentZone = findZoneById(props.currentZoneId);
        if (!currentZone) return { left: '50%', top: '50%' };
        
        // Calculate position based on zone
        const region = props.regions.find(r => r.id === currentZone.regionId);
        if (!region) return { left: '50%', top: '50%' };
        
        const x = region.visualDetails.position.x + currentZone.position.x;
        const y = region.visualDetails.position.y + currentZone.position.y;
        
        return {
          left: `${x}px`,
          top: `${y}px`
        };
      });
      
      // Helper functions
      function findZoneById(zoneId: string): MapZone | undefined {
        for (const region of props.regions) {
          const zone = region.zones.find(z => z.id === zoneId);
          if (zone) return zone;
        }
        return undefined;
      }
      
      function isZoneAccessible(zone: MapZone): boolean {
        // A zone is accessible if it's adjacent to an explored zone
        if (zone.explored) return true;
        
        // Check all zones to find adjacent explored ones
        for (const region of props.regions) {
          for (const otherZone of region.zones) {
            if (otherZone.explored && areZonesAdjacent(zone, otherZone)) {
              return true;
            }
          }
        }
        
        // Check if the zone is connected by a path to an explored zone
        for (const connection of props.connections) {
          if (connection.fromZoneId === zone.id) {
            const toZone = findZoneById(connection.toZoneId);
            if (toZone?.explored) return true;
          } else if (connection.toZoneId === zone.id) {
            const fromZone = findZoneById(connection.fromZoneId);
            if (fromZone?.explored) return true;
          }
        }
        
        return false;
      }
      
      function areZonesAdjacent(zone1: MapZone, zone2: MapZone): boolean {
        // Check if zones are in the same region and adjacent
        if (zone1.regionId !== zone2.regionId) return false;
        
        const dx = Math.abs(zone1.position.x - zone2.position.x);
        const dy = Math.abs(zone1.position.y - zone2.position.y);
        
        // Adjacent if exactly one step away in only one direction
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
      }
      
      function getTerrainName(terrain: string): string {
        const terrainNames: Record<string, string> = {
          'plains': 'Plaines',
          'forest': 'Forêt',
          'hills': 'Collines',
          'mountains': 'Montagnes',
          'swamp': 'Marais',
          'water': 'Eau',
          'desert': 'Désert',
          'tundra': 'Toundra',
          'jungle': 'Jungle',
          'beach': 'Plage'
        };
        
        return terrainNames[terrain] || terrain;
      }
      
      // Style computations
      function getRegionStyle(region: MapRegion) {
        const { position, size, backgroundColor, borderColor, shape, shapeCoords } = region.visualDetails;
        
        const style: Record<string, string> = {
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${size.width}px`,
          height: `${size.height}px`,
          backgroundColor: backgroundColor || '#e0e0e0',
          borderColor: borderColor || '#888'
        };
        
        if (shape === 'circle') {
          style.borderRadius = '50%';
        } else if (shape === 'polygon' && shapeCoords) {
          style.clipPath = `polygon(${shapeCoords})`;
        }
        
        return style;
      }
      
      function getZoneStyle(zone: MapZone) {
        const style: Record<string, string> = {
          left: `${zone.position.x}px`,
          top: `${zone.position.y}px`,
          width: `${zone.size.width}px`,
          height: `${zone.size.height}px`
        };
        
        // Add some randomness to shape for more natural look
        if (zone.terrain === 'hills' || zone.terrain === 'mountains') {
          const borderRadiusVariation = `${10 + Math.floor(Math.random() * 20)}% ${10 + Math.floor(Math.random() * 20)}% ${10 + Math.floor(Math.random() * 20)}% ${10 + Math.floor(Math.random() * 20)}%`;
          style.borderRadius = borderRadiusVariation;
        } else if (zone.terrain === 'water') {
          style.borderRadius = '40%';
        }
        
        return style;
      }
      
      function getConnectionPath(connection: MapConnection): string {
        const fromZone = findZoneById(connection.fromZoneId);
        const toZone = findZoneById(connection.toZoneId);
        
        if (!fromZone || !toZone) return '';
        
        // Find the parent regions
        const fromRegion = props.regions.find(r => r.id === fromZone.regionId);
        const toRegion = props.regions.find(r => r.id === toZone.regionId);
        
        if (!fromRegion || !toRegion) return '';
        
        // Calculate absolute positions
        const x1 = fromRegion.visualDetails.position.x + fromZone.position.x + (fromZone.size.width / 2);
        const y1 = fromRegion.visualDetails.position.y + fromZone.position.y + (fromZone.size.height / 2);
        const x2 = toRegion.visualDetails.position.x + toZone.position.x + (toZone.size.width / 2);
        const y2 = toRegion.visualDetails.position.y + toZone.position.y + (toZone.size.height / 2);
        
        // For rivers, add some curvature
        if (connection.type === 'river') {
          const dx = x2 - x1;
          const dy = y2 - y1;
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          const controlX = midX + dy * 0.2;
          const controlY = midY - dx * 0.2;
          return `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`;
        }
        
        // For roads and trails
        return `M ${x1} ${y1} L ${x2} ${y2}`;
      }
      
      // User interactions
      function handleZoneClick(zone: MapZone) {
        if (zone.explored || isZoneAccessible(zone)) {
          emit('zoneSelected', zone.id);
        }
      }
      
      function startPan(event: MouseEvent) {
        isPanning.value = true;
        startPanX.value = panX.value;
        startPanY.value = panY.value;
        lastMouseX.value = event.clientX;
        lastMouseY.value = event.clientY;
      }
      
      function pan(event: MouseEvent) {
        if (!isPanning.value) return;
        
        const dx = event.clientX - lastMouseX.value;
        const dy = event.clientY - lastMouseY.value;
        
        panX.value = startPanX.value + dx / zoom.value;
        panY.value = startPanY.value + dy / zoom.value;
        
        lastMouseX.value = event.clientX;
        lastMouseY.value = event.clientY;
      }
      
      function endPan() {
        isPanning.value = false;
      }
      
      function zoomIn() {
        zoom.value = Math.min(2, zoom.value + 0.2);
      }
      
      function zoomOut() {
        zoom.value = Math.max(0.5, zoom.value - 0.2);
      }
      
      function handleZoom(event: WheelEvent) {
        event.preventDefault();
        if (event.deltaY < 0) {
          zoomIn();
        } else {
          zoomOut();
        }
      }
      
      function resetView() {
        zoom.value = 1;
        panX.value = 0;
        panY.value = 0;
      }
      
      // Center on current zone when it changes
      watchEffect(() => {
        if (props.currentZoneId && mapViewport.value) {
          // Find the zone
          const zone = findZoneById(props.currentZoneId);
          if (zone) {
            // Reset the view to center on this zone
            const viewportWidth = mapViewport.value.clientWidth;
            const viewportHeight = mapViewport.value.clientHeight;
            
            // Find the parent region
            const region = props.regions.find(r => r.id === zone.regionId);
            if (region) {
              const x = region.visualDetails.position.x + zone.position.x + (zone.size.width / 2);
              const y = region.visualDetails.position.y + zone.position.y + (zone.size.height / 2);
              
              panX.value = (viewportWidth / 2 - x * zoom.value) / zoom.value;
              panY.value = (viewportHeight / 2 - y * zoom.value) / zoom.value;
            }
          }
        }
      });
      
      return {
        zoom,
        panX,
        panY,
        isPanning,
        showLegend,
        mapViewport,
        visibleConnections,
        playerPosition,
        
        // Methods
        getRegionStyle,
        getZoneStyle,
        getTerrainName,
        getConnectionPath,
        isZoneAccessible,
        handleZoneClick,
        startPan,
        pan,
        endPan,
        zoomIn,
        zoomOut,
        handleZoom,
        resetView
      };
    }
  });
  </script>
  
  <style scoped>
  .world-map-container {
    width: 100%;
    height: 600px;
    position: relative;
    overflow: hidden;
    border: 2px solid #2c3e50;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
  
  .map-controls {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 10;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 4px;
    padding: 5px;
  }
  
  .map-control-btn {
    width: 30px;
    height: 30px;
    margin: 0 2px;
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
  }
  
  .map-control-btn:hover {
    background: #f0f0f0;
  }
  
  .map-viewport {
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
    background-color: #f0f8ff; /* Light blue background */
  }
  
  .map-content {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transform-origin: center;
    transition: transform 0.1s ease-out;
  }
  
  .region {
    position: absolute;
    border: 2px solid;
    box-sizing: border-box;
    background-color: rgba(255, 255, 255, 0.2);
    transition: all 0.3s;
  }
  
  .selected-region {
    box-shadow: 0 0 0 4px rgba(65, 184, 131, 0.5);
  }
  
  .region-title {
    position: absolute;
    top: -25px;
    left: 50%;
    transform: translateX(-50%);
    background: #2c3e50;
    color: white;
    padding: 3px 8px;
    border-radius: 10px;
    font-weight: bold;
    font-size: 14px;
    white-space: nowrap;
    z-index: 5;
  }
  
  .zone {
    position: absolute;
    border: 1px solid rgba(0, 0, 0, 0.3);
    box-sizing: border-box;
    transition: all 0.2s;
  }
  
  .zone:hover {
    transform: scale(1.05);
    z-index: 5;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
  }
  
  .current-zone {
    box-shadow: 0 0 0 3px gold;
    z-index: 5;
  }
  
  .accessible-zone {
    cursor: pointer;
  }
  
  .unexplored-zone {
    filter: brightness(0.7) grayscale(0.4);
  }
  
  .zone-content {
    padding: 5px;
    font-size: 10px;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
  }
  
  .zone-name {
    font-weight: bold;
    margin-bottom: 2px;
    text-shadow: 0 0 2px white;
  }
  
  .zone-terrain {
    font-size: 8px;
    opacity: 0.8;
    text-shadow: 0 0 2px white;
  }
  
  .zone-unexplored-marker {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 20px;
    font-weight: bold;
    color: white;
    text-shadow: 0 0 3px black;
  }
  
  .zone-poi {
    margin-top: 5px;
  }
  
  .poi-icon {
    width: 16px;
    height: 16px;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
  }
  
  .player-marker {
    position: absolute;
    width: 20px;
    height: 20px;
    transform: translate(-50%, -50%);
    z-index: 10;
  }
  
  .player-icon {
    width: 100%;
    height: 100%;
    background-color: gold;
    border-radius: 50%;
    border: 2px solid #2c3e50;
    box-shadow: 0 0 0 2px white;
    animation: pulse 1.5s infinite;
  }
  
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }
  
  .map-connections {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  
  .connection-path {
    fill: none;
    stroke-width: 3;
  }
  
  .connection-road {
    stroke: #8B4513; /* Brown */
    stroke-dasharray: none;
  }
  
  .connection-trail {
    stroke: #A0522D; /* Sienna */
    stroke-dasharray: 5, 5;
  }
  
  .connection-river {
    stroke: #4682B4; /* Steel Blue */
    stroke-width: 4;
  }
  
  .map-legend {
    position: absolute;
    bottom: 10px;
    left: 10px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 4px;
    padding: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    z-index: 10;
    font-size: 12px;
  }
  
  .map-legend h4 {
    margin: 0 0 5px 0;
  }
  
  .legend-items {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 5px;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
  }
  
  .legend-icon {
    width: 15px;
    height: 15px;
    margin-right: 5px;
    border: 1px solid rgba(0, 0, 0, 0.3);
  }
  
  /* Terrain styles */
  .terrain-plains {
    background-color: #9bdb4d;
    background-image: linear-gradient(rgba(255, 255, 255, 0.3) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255, 255, 255, 0.3) 1px, transparent 1px);
    background-size: 10px 10px;
  }
  
  .terrain-forest {
    background-color: #2d8659;
    background-image: radial-gradient(circle, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
    background-size: 5px 5px;
  }
  
  .terrain-hills {
    background-color: #b9a36d;
    background-image: linear-gradient(45deg, rgba(0, 0, 0, 0.1) 25%, transparent 25%),
                      linear-gradient(-45deg, rgba(0, 0, 0, 0.1) 25%, transparent 25%);
    background-size: 10px 10px;
  }
  
  .terrain-mountains {
    background-color: #8c7963;
    background-image: linear-gradient(45deg, rgba(0, 0, 0, 0.2) 25%, transparent 25%),
                      linear-gradient(-45deg, rgba(0, 0, 0, 0.2) 25%, transparent 25%);
    background-size: 8px 8px;
  }
  
  .terrain-swamp {
    background-color: #6b7e45;
    background-image: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.2) 1px, transparent 1px),
                      radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0.2) 1px, transparent 1px);
    background-size: 10px 10px;
  }
  
  .terrain-water {
    background-color: #4f94cd;
    background-image: linear-gradient(0deg, rgba(255, 255, 255, 0.2) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255, 255, 255, 0.2) 1px, transparent 1px);
    background-size: 10px 10px;
    animation: water-ripple 3s infinite linear;
  }
  
  .terrain-desert {
    background-color: #e0c088;
    background-image: radial-gradient(circle, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
    background-size: 6px 6px;
  }
  
  .terrain-tundra {
    background-color: #e0e0e0;
    background-image: radial-gradient(circle, rgba(255, 255, 255, 0.5) 1px, transparent 1px);
    background-size: 5px 5px;
  }
  
  /* Point of Interest Icons */
  .poi-town {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2'%3E%3Cpath d='M3 21h18M5 21V7l7-4 7 4v14M12 17v4M9 13h.01M15 13h.01'/%3E%3C/svg%3E");
  }
  
  .poi-dungeon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2'%3E%3Cpath d='M10 3a7 7 0 00-7 7v8a2 2 0 002 2h14a2 2 0 002-2v-8a7 7 0 00-7-7h-4zm0 5v.01M14 8v.01'/%3E%3Cpath d='M12 11v3m0 0v3m0-3h3m-3 0H9'/%3E%3C/svg%3E");
  }
  
  /* Animation for water */
  @keyframes water-ripple {
    0% { background-position: 0px 0px; }
    100% { background-position: 10px 10px; }
  }
  </style>