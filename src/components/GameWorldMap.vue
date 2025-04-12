<!-- src/components/GameWorldMap.vue -->
<template>
    <div 
      class="game-world-map" 
      tabindex="0"
      @keydown="handleKeyDown"
      ref="mapContainer"
    >
      <!-- Mode carte locale (vue détaillée autour du joueur) -->
      <div v-if="!showGlobalMap" class="local-map-view">
        <div class="local-map-grid">
          <div 
            v-for="(row, y) in viewport" 
            :key="`row-${y}`" 
            class="map-row"
          >
            <div 
              v-for="(tile, x) in row" 
              :key="`tile-${x}-${y}`" 
              class="map-tile"
              :class="[
                `terrain-${tile.terrain}`, 
                `biome-${tile.biome}`,
                { 'player-position': isPlayerPosition(x, y) },
                { 'unexplored': !tile.explored }
              ]"
            >
              <div v-if="isPlayerPosition(x, y)" class="player-marker">@</div>
              <div v-else-if="tile.hasPointOfInterest" class="poi-marker">
                {{ getPoiMarker(tile.terrain) }}
              </div>
              <div v-else class="terrain-marker">
                {{ getTerrainMarker(tile.terrain) }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="local-map-info">
          <div class="current-position-info">
            <h3>Position actuelle</h3>
            <p v-if="currentRegion">{{ currentRegion.name }}</p>
            <p>{{ getTerrainName(currentTile?.terrain) }}</p>
            <p>{{ getBiomeName(currentTile?.biome) }}</p>
          </div>
          
          <div v-if="currentPoi" class="current-poi-info">
            <h3>{{ currentPoi.name }}</h3>
            <p>{{ currentPoi.description }}</p>
            <div v-if="currentPoi.type === 'town' || currentPoi.type === 'village'">
              <h4>Services</h4>
              <ul>
                <li v-for="service in currentPoi.services" :key="service">
                  {{ getServiceName(service) }}
                </li>
              </ul>
            </div>
          </div>
          
          <div class="map-controls">
            <button @click="toggleGlobalMap">Carte du monde</button>
            <div class="movement-controls">
              <button @click="movePlayer('north')" :disabled="!canMove('north')">↑</button>
              <div class="horizontal-controls">
                <button @click="movePlayer('west')" :disabled="!canMove('west')">←</button>
                <button @click="movePlayer('east')" :disabled="!canMove('east')">→</button>
              </div>
              <button @click="movePlayer('south')" :disabled="!canMove('south')">↓</button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Mode carte globale -->
      <div v-else class="global-map-view">
        <div class="global-map-container">
          <svg :width="mapWidth" :height="mapHeight" class="global-map-svg">
            <!-- Fond de carte (océan) -->
            <rect x="0" y="0" :width="mapWidth" :height="mapHeight" fill="#1a5276" />
            
            <!-- Afficher les régions découvertes -->
            <g v-for="region in discoveredRegions" :key="region.id" class="map-region">
              <rect 
                :x="getRegionX(region)"
                :y="getRegionY(region)"
                :width="getRegionWidth(region)"
                :height="getRegionHeight(region)"
                :fill="getRegionColor(region)"
                :stroke="isCurrentRegion(region) ? '#f1c40f' : '#2c3e50'"
                stroke-width="2"
                :rx="5"
                :ry="5"
              />
              <text 
                :x="getRegionX(region) + getRegionWidth(region) / 2"
                :y="getRegionY(region) + getRegionHeight(region) / 2"
                text-anchor="middle"
                fill="#fff"
                font-size="12"
                font-weight="bold"
                pointer-events="none"
              >
                {{ region.name }}
              </text>
              <text 
                :x="getRegionX(region) + getRegionWidth(region) / 2"
                :y="getRegionY(region) + getRegionHeight(region) / 2 + 15"
                text-anchor="middle"
                fill="#fff"
                font-size="10"
                pointer-events="none"
              >
                Exploré: {{ region.explored }}%
              </text>
            </g>
            
            <!-- Afficher les points d'intérêt découverts -->
            <g v-for="poi in discoveredPois" :key="poi.id" class="map-poi">
              <circle 
                :cx="getPoiX(poi)"
                :cy="getPoiY(poi)"
                r="5"
                :fill="getPoiColor(poi)"
                stroke="#fff"
                stroke-width="1"
              />
              <text 
                :x="getPoiX(poi)"
                :y="getPoiY(poi) - 8"
                text-anchor="middle"
                fill="#fff"
                font-size="8"
                pointer-events="none"
              >
                {{ poi.name }}
              </text>
            </g>
            
            <!-- Position du joueur -->
            <circle 
              :cx="playerPositionX"
              :cy="playerPositionY"
              r="7"
              fill="#f1c40f"
              stroke="#fff"
              stroke-width="2"
            />
          </svg>
        </div>
        
        <div class="global-map-info">
          <h3>Carte du monde</h3>
          <p>Régions découvertes: {{ discoveredRegions.length }} / {{ worldMap.regions.length }}</p>
          <p>Points d'intérêt: {{ discoveredPois.length }} / {{ worldMap.pointsOfInterest.length }}</p>
          
          <div class="map-legend">
            <h4>Légende</h4>
            <div class="legend-item">
              <div class="legend-color" style="background-color: #f1c40f;"></div>
              <div class="legend-text">Joueur</div>
            </div>
            <div class="legend-item">
              <div class="legend-color" style="background-color: #3498db;"></div>
              <div class="legend-text">Ville</div>
            </div>
            <div class="legend-item">
              <div class="legend-color" style="background-color: #2ecc71;"></div>
              <div class="legend-text">Village</div>
            </div>
            <div class="legend-item">
              <div class="legend-color" style="background-color: #e74c3c;"></div>
              <div class="legend-text">Donjon</div>
            </div>
            <div class="legend-item">
              <div class="legend-color" style="background-color: #9b59b6;"></div>
              <div class="legend-text">Point d'intérêt</div>
            </div>
          </div>
          
          <button @click="toggleGlobalMap">Retour à la carte locale</button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import type { 
    WorldMap, 
    WorldMapManager, 
    TerrainType, 
    BiomeType, 
    WorldTile,
    Region,
    PointOfInterest
  } from '@/core/world/WorldMapSystem'
  
  // Props et émissions
  const props = defineProps<{
    worldMap: WorldMap
  }>()
  
  const emit = defineEmits<{
    'move': [direction: string, success: boolean],
    'enter-location': [pointOfInterest: PointOfInterest]
  }>()
  
  // État local du composant
  const mapContainer = ref<HTMLElement | null>(null)
  const showGlobalMap = ref(false)
  const mapManager = ref<WorldMapManager>(new WorldMapManager(props.worldMap))
  const viewport = ref<WorldTile[][]>([])
  
  // Dimensions de la carte globale pour l'affichage SVG
  const mapWidth = 800
  const mapHeight = 600
  
  // Mettre à jour le viewport lorsque la carte change
  watch(() => props.worldMap, (newMap) => {
    mapManager.value = new WorldMapManager(newMap)
    updateViewport()
  }, { deep: true })
  
  // Calculer les propriétés dérivées
  const currentTile = computed(() => mapManager.value.getCurrentTile())
  const currentPoi = computed(() => mapManager.value.getCurrentPointOfInterest())
  const currentRegion = computed(() => mapManager.value.getCurrentRegion())
  const discoveredRegions = computed(() => mapManager.value.getDiscoveredRegions())
  const discoveredPois = computed(() => mapManager.value.getDiscoveredPointsOfInterest())
  
  // Position du joueur sur la carte globale
  const playerPositionX = computed(() => {
    const x = props.worldMap.currentPlayerPosition.x
    return (x / props.worldMap.width) * mapWidth
  })
  
  const playerPositionY = computed(() => {
    const y = props.worldMap.currentPlayerPosition.y
    return (y / props.worldMap.height) * mapHeight
  })
  
  // Initialisation
  onMounted(() => {
    updateViewport()
    // Donner le focus au conteneur pour capter les événements clavier
    if (mapContainer.value) {
      mapContainer.value.focus()
    }
  })
  
  // Méthodes
  function updateViewport() {
    viewport.value = mapManager.value.getViewport()
  }
  
  function movePlayer(direction: 'north' | 'south' | 'east' | 'west') {
    const success = mapManager.value.movePlayer(direction)
    if (success) {
      updateViewport()
      
      // Vérifier si le joueur est entré dans un point d'intérêt
      const poi = mapManager.value.getCurrentPointOfInterest()
      if (poi) {
        emit('enter-location', poi)
      }
    }
    
    emit('move', direction, success)
  }
  
  function handleKeyDown(event: KeyboardEvent) {
    if (showGlobalMap.value) return // Désactiver les mouvements en mode carte globale
    
    switch (event.key) {
      case 'ArrowUp':
      case 'w':
      case 'z': // Azerty
        event.preventDefault()
        movePlayer('north')
        break
      case 'ArrowDown':
      case 's':
        event.preventDefault()
        movePlayer('south')
        break
      case 'ArrowLeft':
      case 'a':
      case 'q': // Azerty
        event.preventDefault()
        movePlayer('west')
        break
      case 'ArrowRight':
      case 'd':
        event.preventDefault()
        movePlayer('east')
        break
      case 'm':
        event.preventDefault()
        toggleGlobalMap()
        break
    }
  }
  
  function toggleGlobalMap() {
    showGlobalMap.value = !showGlobalMap.value
  }
  
  function isPlayerPosition(x: number, y: number): boolean {
    const halfWidth = Math.floor(viewport.value[0].length / 2)
    const halfHeight = Math.floor(viewport.value.length / 2)
    
    return x === halfWidth && y === halfHeight
  }
  
  function canMove(direction: 'north' | 'south' | 'east' | 'west'): boolean {
    const halfWidth = Math.floor(viewport.value[0].length / 2)
    const halfHeight = Math.floor(viewport.value.length / 2)
    
    let targetX = halfWidth
    let targetY = halfHeight
    
    switch (direction) {
      case 'north':
        targetY--
        break
      case 'south':
        targetY++
        break
      case 'east':
        targetX++
        break
      case 'west':
        targetX--
        break
    }
    
    if (targetY < 0 || targetY >= viewport.value.length ||
        targetX < 0 || targetX >= viewport.value[0].length) {
      return false
    }
    
    const targetTile = viewport.value[targetY][targetX]
    return targetTile.movementCost < 50 // 50+ considéré comme infranchissable
  }
  
  // Fonctions d'aide pour les marqueurs de terrain
  function getTerrainMarker(terrain: TerrainType | undefined): string {
    if (!terrain) return ' '
    
    const markers: Record<TerrainType, string> = {
      [TerrainType.Ocean]: '~',
      [TerrainType.Shore]: '.',
      [TerrainType.Plains]: '"',
      [TerrainType.Forest]: '♣',
      [TerrainType.Hills]: '▲',
      [TerrainType.Mountains]: '▲▲',
      [TerrainType.Swamp]: ',',
      [TerrainType.Desert]: '░',
      [TerrainType.Tundra]: '*',
      [TerrainType.River]: '≈',
      [TerrainType.Lake]: '≈',
      [TerrainType.Path]: '·',
      [TerrainType.Road]: '=',
      [TerrainType.Bridge]: '≡',
      [TerrainType.Settlement]: '♦',
      [TerrainType.Dungeon]: '†',
      [TerrainType.Landmark]: '★'
    }
    
    return markers[terrain] || ' '
  }
  
  function getPoiMarker(terrain: TerrainType | undefined): string {
    if (!terrain) return '?'
    
    const markers: Partial<Record<TerrainType, string>> = {
      [TerrainType.Settlement]: '♦',
      [TerrainType.Dungeon]: '†',
      [TerrainType.Landmark]: '★'
    }
    
    return markers[terrain] || '○'
  }
  
  function getTerrainName(terrain: TerrainType | undefined): string {
    if (!terrain) return 'Inconnu'
    
    const names: Record<TerrainType, string> = {
      [TerrainType.Ocean]: 'Océan',
      [TerrainType.Shore]: 'Rivage',
      [TerrainType.Plains]: 'Plaines',
      [TerrainType.Forest]: 'Forêt',
      [TerrainType.Hills]: 'Collines',
      [TerrainType.Mountains]: 'Montagnes',
      [TerrainType.Swamp]: 'Marais',
      [TerrainType.Desert]: 'Désert',
      [TerrainType.Tundra]: 'Toundra',
      [TerrainType.River]: 'Rivière',
      [TerrainType.Lake]: 'Lac',
      [TerrainType.Path]: 'Sentier',
      [TerrainType.Road]: 'Route',
      [TerrainType.Bridge]: 'Pont',
      [TerrainType.Settlement]: 'Habitation',
      [TerrainType.Dungeon]: 'Donjon',
      [TerrainType.Landmark]: 'Point d\'intérêt'
    }
    
    return names[terrain]
  }
  
  function getBiomeName(biome: BiomeType | undefined): string {
    if (!biome) return 'Inconnu'
    
    const names: Record<BiomeType, string> = {
      [BiomeType.Temperate]: 'Climat tempéré',
      [BiomeType.Tropical]: 'Climat tropical',
      [BiomeType.Arctic]: 'Climat arctique',
      [BiomeType.Arid]: 'Climat aride',
      [BiomeType.Coastal]: 'Zone côtière',
      [BiomeType.Volcanic]: 'Zone volcanique'
    }
    
    return names[biome]
  }
  
  function getServiceName(service: string): string {
    const names: Record<string, string> = {
      'inn': 'Auberge',
      'shop': 'Magasin',
      'blacksmith': 'Forge',
      'temple': 'Temple',
      'guild': 'Guilde'
    }
    
    return names[service] || service
  }
  
  // Fonctions pour la carte globale
  function getRegionX(region: Region): number {
    return (region.x / props.worldMap.width) * mapWidth - (getRegionWidth(region) / 2)
  }
  
  function getRegionY(region: Region): number {
    return (region.y / props.worldMap.height) * mapHeight - (getRegionHeight(region) / 2)
  }
  
  function getRegionWidth(region: Region): number {
    return (region.width / props.worldMap.width) * mapWidth
  }
  
  function getRegionHeight(region: Region): number {
    return (region.height / props.worldMap.height) * mapHeight
  }
  
  function getRegionColor(region: Region): string {
    const biomeColors: Record<BiomeType, string> = {
      [BiomeType.Temperate]: '#27ae60',
      [BiomeType.Tropical]: '#2ecc71',
      [BiomeType.Arctic]: '#ecf0f1',
      [BiomeType.Arid]: '#f39c12',
      [BiomeType.Coastal]: '#3498db',
      [BiomeType.Volcanic]: '#c0392b'
    }
    
    // Ajuster l'opacité en fonction de l'exploration
    const opacity = 0.3 + (region.explored / 100 * 0.7)
    
    const baseColor = biomeColors[region.biome] || '#7f8c8d'
    return `${baseColor}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`
  }
  
  function isCurrentRegion(region: Region): boolean {
    return currentRegion.value?.id === region.id
  }
  
  function getPoiX(poi: PointOfInterest): number {
    return (poi.x / props.worldMap.width) * mapWidth
  }
  
  function getPoiY(poi: PointOfInterest): number {
    return (poi.y / props.worldMap.height) * mapHeight
  }
  
  function getPoiColor(poi: PointOfInterest): string {
    const typeColors: Record<string, string> = {
      'town': '#3498db',
      'village': '#2ecc71',
      'dungeon': '#e74c3c',
      'landmark': '#9b59b6',
      'shrine': '#f1c40f'
    }
    
    return typeColors[poi.type] || '#7f8c8d'
  }
  </script>
  
  <style scoped>
  .game-world-map {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-height: 600px;
    background-color: #2c3e50;
    color: #ecf0f1;
    font-family: monospace;
    outline: none;
  }
  
  /* Styles pour la carte locale */
  .local-map-view {
    display: flex;
    height: 100%;
    width: 100%;
  }
  
  .local-map-grid {
    flex: 2;
    overflow: auto;
    padding: 10px;
    background-color: #1a1a2e;
    border-right: 2px solid #444;
  }
  
  .map-row {
    display: flex;
    flex-direction: row;
    justify-content: center;
  }
  
  .map-tile {
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-sizing: border-box;
    transition: all 0.1s ease;
  }
  
  .map-tile:hover {
    transform: scale(1.1);
    z-index: 10;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  }
  
  .player-position {
    box-shadow: 0 0 0 2px #f1c40f;
    z-index: 5;
  }
  
  .player-marker {
    color: #f1c40f;
    font-weight: bold;
    font-size: 24px;
  }
  
  .poi-marker {
    color: #e74c3c;
    font-weight: bold;
  }
  
  .unexplored {
    filter: brightness(0.3) grayscale(0.8);
    color: rgba(255, 255, 255, 0.3);
  }
  
  /* Styles de terrains */
  .terrain-ocean {
    background-color: #1a5276;
  }
  
  .terrain-shore {
    background-color: #f9e79f;
  }
  
  .terrain-plains {
    background-color: #7dcea0;
  }
  
  .terrain-forest {
    background-color: #186a3b;
  }
  
  .terrain-hills {
    background-color: #9c640c;
  }
  
  .terrain-mountains {
    background-color: #6e2c00;
  }
  
  .terrain-swamp {
    background-color: #5b5b4f;
  }
  
  .terrain-desert {
    background-color: #d4ac0d;
  }
  
  .terrain-tundra {
    background-color: #d0d3d4;
  }
  
  .terrain-river {
    background-color: #3498db;
  }
  
  .terrain-lake {
    background-color: #2980b9;
  }
  
  .terrain-path {
    background-color: #795548;
  }
  
  .terrain-road {
    background-color: #9e9e9e;
  }
  
  .terrain-bridge {
    background-color: #5d4037;
  }
  
  .terrain-settlement {
    background-color: #e74c3c;
  }
  
  .terrain-dungeon {
    background-color: #34495e;
  }
  
  .terrain-landmark {
    background-color: #8e44ad;
  }
  
  /* Modificateurs de biome (appliqués sous forme de filtre ou d'overlay) */
  .biome-temperate {
    /* Pas de modificateur, c'est le biome par défaut */
  }
  
  .biome-tropical {
    filter: hue-rotate(20deg) saturate(1.2);
  }
  
  .biome-arctic {
    filter: brightness(1.2) saturate(0.7);
  }
  
  .biome-arid {
    filter: sepia(0.4) saturate(1.1);
  }
  
  .biome-coastal {
    filter: hue-rotate(-10deg) brightness(1.1);
  }
  
  .biome-volcanic {
    filter: hue-rotate(-30deg) saturate(1.2);
  }
  
  .local-map-info {
    flex: 1;
    padding: 20px;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }
  
  .current-position-info {
    margin-bottom: 20px;
  }
  
  .current-poi-info {
    margin-bottom: 20px;
    padding: 10px;
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: 5px;
  }
  
  .map-controls {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .movement-controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
  }
  
  .horizontal-controls {
    display: flex;
    gap: 5px;
  }
  
  button {
    background-color: #34495e;
    color: white;
    border: none;
    padding: 10px 15px;
    cursor: pointer;
    border-radius: 4px;
    font-family: inherit;
    transition: background-color 0.2s;
  }
  
  button:hover:not(:disabled) {
    background-color: #2c3e50;
  }
  
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .movement-controls button {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    padding: 0;
  }
  
  /* Styles pour la carte globale */
  .global-map-view {
    display: flex;
    height: 100%;
    width: 100%;
  }
  
  .global-map-container {
    flex: 2;
    padding: 10px;
    background-color: #1a1a2e;
    overflow: hidden;
    position: relative;
  }
  
  .global-map-svg {
    background-color: #1a5276;
    border-radius: 5px;
  }
  
  .global-map-info {
    flex: 1;
    padding: 20px;
    display: flex;
    flex-direction: column;
  }
  
  .map-legend {
    margin-top: 20px;
    margin-bottom: auto;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }
  
  .legend-color {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    margin-right: 8px;
    border: 1px solid white;
  }
  
  /* Media queries pour la responsivité */
  @media (max-width: 768px) {
    .local-map-view, .global-map-view {
      flex-direction: column;
    }
    
    .local-map-grid, .global-map-container {
      flex: none;
      height: 400px;
    }
    
    .map-tile {
      width: 24px;
      height: 24px;
      font-size: 16px;
    }
  }