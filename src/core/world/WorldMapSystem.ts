// src/core/world/WorldMapSystem.ts
export enum TerrainType {
    Ocean = 'ocean',
    Shore = 'shore',
    Plains = 'plains',
    Forest = 'forest',
    Hills = 'hills',
    Mountains = 'mountains',
    Swamp = 'swamp',
    Desert = 'desert',
    Tundra = 'tundra',
    River = 'river',
    Lake = 'lake',
    Path = 'path',
    Road = 'road',
    Bridge = 'bridge',
    Settlement = 'settlement',
    Dungeon = 'dungeon',
    Landmark = 'landmark'
  }
  
  export enum BiomeType {
    Temperate = 'temperate',
    Tropical = 'tropical',
    Arctic = 'arctic',
    Arid = 'arid',
    Coastal = 'coastal',
    Volcanic = 'volcanic'
  }
  
  export interface WorldTile {
    x: number;
    y: number;
    terrain: TerrainType;
    biome: BiomeType;
    elevation: number; // 0-100, où 0 est le niveau de la mer et 100 le plus haut sommet
    explored: boolean;
    hasPointOfInterest: boolean;
    pointOfInterestId?: string;
    enemySpawnTable?: string; // Référence à une table de spawn d'ennemis selon le terrain/biome
    itemSpawnTable?: string; // Référence à une table de récolte d'objets selon le terrain/biome/saison
    movementCost: number; // Coût de déplacement sur cette case (1 = normal, 2 = difficile, etc.)
    dangerLevel: number; // Niveau de danger pour ajuster la difficulté des rencontres
  }
  
  export interface Region {
    id: string;
    name: string;
    x: number; // Coordonnée X du centre de la région
    y: number; // Coordonnée Y du centre de la région
    width: number; // Largeur approximative en tiles
    height: number; // Hauteur approximative en tiles
    biome: BiomeType;
    discovered: boolean; // La région apparaît sur la carte globale
    explored: number; // Pourcentage de la région qui a été exploré
    mainTerrainType: TerrainType; // Terrain prédominant dans cette région
    description: string;
  }
  
  // Définir les types de services disponibles pour éviter les problèmes de typage
export type ServiceType = 'inn' | 'shop' | 'blacksmith' | 'temple' | 'guild';

export interface PointOfInterest {
  id: string;
  name: string;
  type: 'town' | 'village' | 'dungeon' | 'shrine' | 'landmark';
  description: string;
  x: number;
  y: number;
  discovered: boolean;
  explored: boolean;
  // Utiliser le type ServiceType[] au lieu de string[]
  services?: ServiceType[];
  questGivers?: string[]; // IDs des PNJs pouvant donner des quêtes ici
  connectedTo?: string[]; // IDs d'autres points d'intérêt directement reliés
}
  
  export interface WorldMap {
    width: number; // Largeur totale de la carte en tiles
    height: number; // Hauteur totale de la carte en tiles
    tiles: WorldTile[][]; // Grille 2D des tiles du monde
    regions: Region[]; // Liste des régions dans le monde
    pointsOfInterest: PointOfInterest[]; // Liste des points d'intérêt
    currentPlayerPosition: { x: number; y: number }; // Position actuelle du joueur
  }
  
  export class WorldMapGenerator {
    private map: WorldMap;
    
    constructor(width: number, height: number) {
      this.map = {
        width,
        height,
        tiles: [],
        regions: [],
        pointsOfInterest: [],
        currentPlayerPosition: { x: Math.floor(width/2), y: Math.floor(height/2) }
      };
      
      // Initialisation de tous les tiles à océan
      for (let y = 0; y < height; y++) {
        this.map.tiles[y] = [];
        for (let x = 0; x < width; x++) {
          this.map.tiles[y][x] = {
            x,
            y,
            terrain: TerrainType.Ocean,
            biome: BiomeType.Temperate,
            elevation: 0,
            explored: false,
            hasPointOfInterest: false,
            movementCost: 1,
            dangerLevel: 1
          };
        }
      }
    }
    
    // Génère une carte complète en utilisant des algorithmes de génération procédurale
    generateWorld(seed?: number): WorldMap {
      this.generateTerrain();
      this.generateBiomes();
      this.identifyRegions();
      this.placePointsOfInterest();
      this.createRoadsAndPaths();
      
      // Place le joueur dans une zone de départ sécurisée
      this.setPlayerStartingPosition();
      
      return this.map;
    }
    
    // Simplifié pour l'exemple - utilisera en réalité des algorithmes comme le bruit de Perlin
    private generateTerrain(): void {
      // Générer le terrain de base avec la hauteur/élévation
      this.generateElevation();
      
      // Appliquer les terrains en fonction de l'élévation
      for (let y = 0; y < this.map.height; y++) {
        for (let x = 0; x < this.map.width; x++) {
          const elevation = this.map.tiles[y][x].elevation;
          
          if (elevation < 10) {
            this.map.tiles[y][x].terrain = TerrainType.Ocean;
            this.map.tiles[y][x].movementCost = 100; // Impossible à traverser à pied
          } 
          else if (elevation < 15) {
            this.map.tiles[y][x].terrain = TerrainType.Shore;
            this.map.tiles[y][x].movementCost = 1.5;
          }
          else if (elevation < 40) {
            this.map.tiles[y][x].terrain = TerrainType.Plains;
            this.map.tiles[y][x].movementCost = 1;
          }
          else if (elevation < 60) {
            this.map.tiles[y][x].terrain = TerrainType.Forest;
            this.map.tiles[y][x].movementCost = 1.2;
          }
          else if (elevation < 80) {
            this.map.tiles[y][x].terrain = TerrainType.Hills;
            this.map.tiles[y][x].movementCost = 1.5;
          }
          else {
            this.map.tiles[y][x].terrain = TerrainType.Mountains;
            this.map.tiles[y][x].movementCost = 2;
          }
        }
      }
      
      // Ajouter des rivières
      this.generateRivers();
      
      // Ajouter des lacs
      this.generateLakes();
    }
    
    // Simplifié pour l'exemple - utilisera des fonctions de bruit Perlin
    private generateElevation(): void {
      // Centre de la carte pour une "île" principale
      const centerX = Math.floor(this.map.width / 2);
      const centerY = Math.floor(this.map.height / 2);
      
      for (let y = 0; y < this.map.height; y++) {
        for (let x = 0; x < this.map.width; x++) {
          // Distance du centre, pour créer une île
          const distanceFromCenter = Math.sqrt(
            Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
          );
          
          // Plus on s'éloigne du centre, plus l'élévation baisse
          let elevation = 100 - (distanceFromCenter / (this.map.width / 2)) * 100;
          
          // Ajouter un peu de bruit aléatoire pour rendre le terrain plus naturel
          elevation += (Math.random() * 20) - 10;
          
          // S'assurer que l'élévation reste dans les limites
          elevation = Math.max(0, Math.min(100, elevation));
          
          this.map.tiles[y][x].elevation = Math.floor(elevation);
        }
      }
    }
    
    private generateRivers(): void {
      // Simuler 2-3 rivières qui partent des montagnes et vont vers l'océan
      const startPoints = this.findHighElevationPoints(3);
      
      for (const point of startPoints) {
        this.createRiverFromPoint(point.x, point.y);
      }
    }
    
    private findHighElevationPoints(count: number): {x: number, y: number}[] {
      const points: {x: number, y: number}[] = [];
      
      // Trouver les points les plus élevés qui ne sont pas trop proches les uns des autres
      const candidates: {x: number, y: number, elevation: number}[] = [];
      
      for (let y = 0; y < this.map.height; y++) {
        for (let x = 0; x < this.map.width; x++) {
          if (this.map.tiles[y][x].elevation > 70) {
            candidates.push({
              x, y, elevation: this.map.tiles[y][x].elevation
            });
          }
        }
      }
      
      // Trier par élévation décroissante
      candidates.sort((a, b) => b.elevation - a.elevation);
      
      // Prendre les N premiers points qui ne sont pas trop proches les uns des autres
      for (const candidate of candidates) {
        if (points.length >= count) break;
        
        // Vérifier qu'il n'est pas trop proche d'un point déjà sélectionné
        let tooClose = false;
        for (const point of points) {
          const distance = Math.sqrt(
            Math.pow(candidate.x - point.x, 2) + Math.pow(candidate.y - point.y, 2)
          );
          
          if (distance < this.map.width / 5) {
            tooClose = true;
            break;
          }
        }
        
        if (!tooClose) {
          points.push({x: candidate.x, y: candidate.y});
        }
      }
      
      return points;
    }
    
    private createRiverFromPoint(x: number, y: number): void {
      let currentX = x;
      let currentY = y;
      
      // Créer un chemin qui descend jusqu'à l'océan
      while (true) {
        // Marquer cette case comme une rivière
        this.map.tiles[currentY][currentX].terrain = TerrainType.River;
        this.map.tiles[currentY][currentX].movementCost = 2; // Difficile à traverser sans pont
        
        // Arrêter si on a atteint l'océan
        if (this.map.tiles[currentY][currentX].elevation < 15) {
          break;
        }
        
        // Trouver la case adjacente avec l'élévation la plus basse
        const neighbors = this.getNeighbors(currentX, currentY);
        let lowestElevation = this.map.tiles[currentY][currentX].elevation;
        let nextX = currentX;
        let nextY = currentY;
        
        for (const neighbor of neighbors) {
          if (this.map.tiles[neighbor.y][neighbor.x].elevation < lowestElevation) {
            lowestElevation = this.map.tiles[neighbor.y][neighbor.x].elevation;
            nextX = neighbor.x;
            nextY = neighbor.y;
          }
        }
        
        // Si on ne peut pas descendre plus bas, arrêter
        if (nextX === currentX && nextY === currentY) {
          break;
        }
        
        currentX = nextX;
        currentY = nextY;
      }
    }
    
    private getNeighbors(x: number, y: number): {x: number, y: number}[] {
      const neighbors: {x: number, y: number}[] = [];
      
      // 8 directions
      const directions = [
        {dx: -1, dy: -1}, {dx: 0, dy: -1}, {dx: 1, dy: -1},
        {dx: -1, dy: 0},                   {dx: 1, dy: 0},
        {dx: -1, dy: 1},  {dx: 0, dy: 1},  {dx: 1, dy: 1}
      ];
      
      for (const dir of directions) {
        const newX = x + dir.dx;
        const newY = y + dir.dy;
        
        // Vérifier que le voisin est dans les limites de la carte
        if (newX >= 0 && newX < this.map.width && newY >= 0 && newY < this.map.height) {
          neighbors.push({x: newX, y: newY});
        }
      }
      
      return neighbors;
    }
    
    private generateLakes(): void {
      // Créer quelques lacs à des endroits appropriés (dépressions de terrain)
      const lakeCount = Math.floor(this.map.width / 40); // 1 lac pour chaque 40 unités de largeur
      
      for (let i = 0; i < lakeCount; i++) {
        // Trouver un emplacement approprié pour un lac (zone de plaine ou forêt avec élévation moyenne-basse)
        const candidates: {x: number, y: number}[] = [];
        
        for (let y = 0; y < this.map.height; y++) {
          for (let x = 0; x < this.map.width; x++) {
            const tile = this.map.tiles[y][x];
            if ((tile.terrain === TerrainType.Plains || tile.terrain === TerrainType.Forest) && 
                tile.elevation > 15 && tile.elevation < 40) {
              candidates.push({x, y});
            }
          }
        }
        
        if (candidates.length === 0) continue;
        
        // Choisir un point aléatoire parmi les candidats
        const lakeCenter = candidates[Math.floor(Math.random() * candidates.length)];
        
        // Créer un lac de taille aléatoire
        const lakeSize = Math.floor(Math.random() * 5) + 3; // Rayon entre 3 et 7
        
        for (let y = lakeCenter.y - lakeSize; y <= lakeCenter.y + lakeSize; y++) {
          for (let x = lakeCenter.x - lakeSize; x <= lakeCenter.x + lakeSize; x++) {
            // Vérifier que le point est dans les limites de la carte
            if (x >= 0 && x < this.map.width && y >= 0 && y < this.map.height) {
              // Calculer la distance du centre du lac
              const distance = Math.sqrt(
                Math.pow(x - lakeCenter.x, 2) + Math.pow(y - lakeCenter.y, 2)
              );
              
              // Si la distance est inférieure au rayon du lac, c'est un lac
              if (distance <= lakeSize) {
                this.map.tiles[y][x].terrain = TerrainType.Lake;
                this.map.tiles[y][x].elevation = 15; // Juste au-dessus du niveau de la mer
                this.map.tiles[y][x].movementCost = 100; // Impossible à traverser à pied
              }
            }
          }
        }
      }
    }
    
    private generateBiomes(): void {
      // Attribuer des biomes en fonction de la position sur la carte et de l'élévation
      for (let y = 0; y < this.map.height; y++) {
        for (let x = 0; x < this.map.width; x++) {
          // Position relative sur la carte (0-1)
          const relativeY = y / this.map.height;
          
          // Distribution simple des biomes par latitude
          // Nord (0-0.25) = Arctique
          // Centre-Nord (0.25-0.4) = Tempéré
          // Centre (0.4-0.6) = Tempéré
          // Centre-Sud (0.6-0.75) = Tropical
          // Sud (0.75-1) = Aride
          
          if (relativeY < 0.25) {
            this.map.tiles[y][x].biome = BiomeType.Arctic;
          } else if (relativeY < 0.6) {
            this.map.tiles[y][x].biome = BiomeType.Temperate;
          } else if (relativeY < 0.75) {
            this.map.tiles[y][x].biome = BiomeType.Tropical;
          } else {
            this.map.tiles[y][x].biome = BiomeType.Arid;
          }
          
          // Zones côtières
          if (this.map.tiles[y][x].terrain === TerrainType.Shore) {
            this.map.tiles[y][x].biome = BiomeType.Coastal;
          }
          
          // Zones volcaniques (rare, placées aléatoirement dans les montagnes)
          if (this.map.tiles[y][x].terrain === TerrainType.Mountains && Math.random() < 0.05) {
            this.map.tiles[y][x].biome = BiomeType.Volcanic;
          }
        }
      }
    }
    
    private identifyRegions(): void {
      // Identifier les différentes régions du monde (forêts, chaînes de montagnes, etc.)
      const regionCount = Math.floor(this.map.width / 30); // 1 région pour chaque 30 unités de largeur
      
      // Créer des "centres" de régions répartis sur la carte
      const regionCenters: {x: number, y: number, terrain: TerrainType, biome: BiomeType}[] = [];
      
      // Placer quelques centres de régions de manière aléatoire
      for (let i = 0; i < regionCount; i++) {
        let x, y;
        let attempts = 0;
        let validPosition = false;
        
        // Essayer de trouver une position valide qui n'est pas trop proche d'une autre région
        while (!validPosition && attempts < 100) {
          x = Math.floor(Math.random() * this.map.width);
          y = Math.floor(Math.random() * this.map.height);
          
          // Vérifier que le point n'est pas dans l'océan
          if (this.map.tiles[y][x].terrain !== TerrainType.Ocean) {
            // Vérifier qu'il n'est pas trop proche d'un autre centre
            validPosition = true;
            for (const center of regionCenters) {
              const distance = Math.sqrt(
                Math.pow(x - center.x, 2) + Math.pow(y - center.y, 2)
              );
              
              if (distance < this.map.width / 5) {
                validPosition = false;
                break;
              }
            }
          }
          
          attempts++;
        }
        
        if (validPosition) {
          regionCenters.push({
            x: x!,
            y: y!,
            terrain: this.map.tiles[y!][x!].terrain,
            biome: this.map.tiles[y!][x!].biome
          });
        }
      }
      
      // Créer les régions à partir des centres
      for (let i = 0; i < regionCenters.length; i++) {
        const center = regionCenters[i];
        
        // Attribuer un nom aléatoire à la région en fonction de son type
        const name = this.generateRegionName(center.terrain, center.biome);
        
        // Calculer la taille approximative de la région
        const width = Math.floor(Math.random() * 20) + 10;
        const height = Math.floor(Math.random() * 20) + 10;
        
        this.map.regions.push({
          id: `region_${i}`,
          name,
          x: center.x,
          y: center.y,
          width,
          height,
          biome: center.biome,
          discovered: false,
          explored: 0,
          mainTerrainType: center.terrain,
          description: this.generateRegionDescription(center.terrain, center.biome)
        });
      }
    }
    
    private generateRegionName(terrain: TerrainType, biome: BiomeType): string {
      // Noms de régions génériques basés sur le terrain et le biome
      const terrainPrefixes: Record<TerrainType, string[]> = {
        [TerrainType.Plains]: ['Plaines de', 'Prairies de', 'Étendues de'],
        [TerrainType.Forest]: ['Forêt de', 'Bois de', 'Bosquet de'],
        [TerrainType.Hills]: ['Collines de', 'Versants de', 'Coteaux de'],
        [TerrainType.Mountains]: ['Monts de', 'Pics de', 'Massif de'],
        [TerrainType.Swamp]: ['Marais de', 'Marécages de', 'Tourbières de'],
        [TerrainType.Desert]: ['Désert de', 'Dunes de', 'Sables de'],
        [TerrainType.Tundra]: ['Toundra de', 'Étendues gelées de', 'Plaines glacées de'],
        [TerrainType.Shore]: ['Côte de', 'Rivage de', 'Littoral de'],
        [TerrainType.River]: ['Rivière de', 'Fleuve de', 'Cours de'],
        [TerrainType.Lake]: ['Lac de', 'Étang de', 'Mare de'],
        [TerrainType.Ocean]: ['Mer de', 'Océan de', 'Eaux de'],
        [TerrainType.Path]: ['Sentier de', 'Chemin de', 'Piste de'],
        [TerrainType.Road]: ['Route de', 'Voie de', 'Passage de'],
        [TerrainType.Bridge]: ['Pont de', 'Passerelle de', 'Traverse de'],
        [TerrainType.Settlement]: ['Village de', 'Bourg de', 'Cité de'],
        [TerrainType.Dungeon]: ['Donjon de', 'Antre de', 'Repaire de'],
        [TerrainType.Landmark]: ['Monument de', 'Vestige de', 'Ruines de']
      };
      
      const biomeSuffixes: Record<BiomeType, string[]> = {
        [BiomeType.Temperate]: ['Verdure', 'l\'Harmonie', 'l\'Équilibre', 'la Sérénité'],
        [BiomeType.Tropical]: ['Chaleur', 'l\'Abondance', 'la Luxuriance', 'la Vivacité'],
        [BiomeType.Arctic]: ['Frimas', 'la Glace', 'l\'Hiver', 'la Neige'],
        [BiomeType.Arid]: ['Sécheresse', 'la Désolation', 'la Soif', 'l\'Aridité'],
        [BiomeType.Coastal]: ['l\'Écume', 'la Marée', 'l\'Horizon', 'les Embruns'],
        [BiomeType.Volcanic]: ['Cendres', 'la Lave', 'le Brasier', 'l\'Incandescence']
      };
      
      const prefix = terrainPrefixes[terrain][Math.floor(Math.random() * terrainPrefixes[terrain].length)];
      const suffix = biomeSuffixes[biome][Math.floor(Math.random() * biomeSuffixes[biome].length)];
      
      return `${prefix} ${suffix}`;
    }
    
    private generateRegionDescription(terrain: TerrainType, biome: BiomeType): string {
      // Descriptions génériques basées sur le terrain et le biome
      const terrainDescriptions: Record<TerrainType, string[]> = {
        [TerrainType.Plains]: [
          'De vastes plaines s\'étendent à perte de vue, couvertes d\'herbes ondulant sous la brise.',
          'Des prairies dégagées offrent une vue imprenable sur l\'horizon lointain.'
        ],
        [TerrainType.Forest]: [
          'Une forêt dense dont la canopée filtre la lumière du soleil, créant un monde mystérieux en dessous.',
          'Des arbres majestueux s\'élèvent vers le ciel, abritant une multitude de créatures.'
        ],
        [TerrainType.Hills]: [
          'Des collines douces roulent à travers le paysage, offrant des vues panoramiques.',
          'Un terrain vallonné parsemé de petits bosquets et de ruisseaux sinueux.'
        ],
        [TerrainType.Mountains]: [
          'D\'imposantes montagnes déchirent le ciel, leurs sommets souvent perdus dans les nuages.',
          'Une chaîne de pics escarpés forme une barrière naturelle impressionnante.'
        ],
        [TerrainType.Swamp]: [
          'Un marécage brumeux où l\'eau stagnante reflète les silhouettes tordues des arbres morts.',
          'Des terres humides et boueuses où la frontière entre terre et eau est constamment floue.'
        ],
        [TerrainType.Desert]: [
          'Un désert aride où les dunes de sable doré s\'étendent jusqu\'à l\'horizon.',
          'Des étendues désolées de sable et de roches, ponctuées de rares oasis.'
        ],
        [TerrainType.Tundra]: [
          'Une toundra balayée par les vents, où seules les plantes les plus résistantes survivent.',
          'Des plaines gelées où la vie semble suspendue pendant la majeure partie de l\'année.'
        ],
        [TerrainType.Shore]: [
          'Une côte où les vagues viennent lécher les plages de sable fin.',
          'Un littoral rocheux constamment battu par les flots tumultueux.'
        ],
        [TerrainType.River]: [
          'Une rivière majestueuse qui serpente à travers le paysage, source de vie.',
          'Un cours d\'eau rapide qui a façonné la vallée au fil des millénaires.'
        ],
        [TerrainType.Lake]: [
          'Un lac aux eaux cristallines qui reflète parfaitement le ciel et les montagnes environnantes.',
          'Une étendue d\'eau calme, haven de paix pour la faune locale.'
        ],
        [TerrainType.Ocean]: [
          'Un océan infini dont les profondeurs recèlent d\'innombrables mystères.',
          'Une mer agitée dont l\'humeur changeante défie les plus braves navigateurs.'
        ],
        [TerrainType.Path]: [
          'Un sentier étroit qui serpente à travers le paysage, témoin silencieux des voyageurs.',
          'Une piste peu fréquentée mais essentielle pour traverser cette région sauvage.'
        ],
        [TerrainType.Road]: [
          'Une route bien entretenue qui facilite le commerce et les voyages.',
          'Une voie pavée reliant les principales implantations de la région.'
        ],
        [TerrainType.Bridge]: [
          'Un pont robuste qui enjambe l\'obstacle, fruit du génie des bâtisseurs.',
          'Une passerelle qui permet de franchir l\'infranchissable, point névralgique pour les voyageurs.'
        ],
        [TerrainType.Settlement]: [
          'Une agglomération animée où les habitants vaquent à leurs occupations quotidiennes.',
          'Un regroupement de bâtiments qui forme le cœur social et économique de la région.'
        ],
        [TerrainType.Dungeon]: [
          'Un complexe souterrain dont l\'entrée sombre promet dangers et trésors.',
          'Un lieu maudit que les habitants locaux évitent soigneusement.'
        ],
        [TerrainType.Landmark]: [
          'Un monument remarquable qui se dresse fièrement, témoin d\'une histoire oubliée.',
          'Des vestiges anciens qui suscitent la curiosité et l\'émerveillement.'
        ]
      };
      
      const biomeModifiers: Record<BiomeType, string[]> = {
        [BiomeType.Temperate]: [
          'Le climat tempéré favorise une biodiversité équilibrée et agréable.',
          'Les saisons bien définies rythment la vie dans cette région harmonieuse.'
        ],
        [BiomeType.Tropical]: [
          'La chaleur tropicale fait prospérer une végétation luxuriante et colorée.',
          'L\'humidité constante crée un environnement foisonnant de vie.'
        ],
        [BiomeType.Arctic]: [
          'Le froid glacial de ce climat arctique met à l\'épreuve toute forme de vie.',
          'La neige et la glace dominent ce paysage d\'une beauté austère.'
        ],
        [BiomeType.Arid]: [
          'La sécheresse persistante a façonné un écosystème unique adapté au manque d\'eau.',
          'Les journées brûlantes contrastent avec des nuits étonnamment fraîches.'
        ],
        [BiomeType.Coastal]: [
          'L\'influence marine adoucit le climat et façonne le mode de vie local.',
          'Les embruns salés et le cri des mouettes sont omniprésents.'
        ],
        [BiomeType.Volcanic]: [
          'L\'activité volcanique rend le sol exceptionnellement fertile malgré les dangers.',
          'Des fumerolles et des sources chaudes témoignent des forces telluriques à l\'œuvre.'
        ]
      };
      
      const terrainDesc = terrainDescriptions[terrain][Math.floor(Math.random() * terrainDescriptions[terrain].length)];
      const biomeDesc = biomeModifiers[biome][Math.floor(Math.random() * biomeModifiers[biome].length)];
      
      return `${terrainDesc} ${biomeDesc}`;
    }
    
    private placePointsOfInterest(): void {
      // Placer des villes, villages, donjons et points d'intérêt sur la carte
      
      // Placer une ville ou un village dans chaque région
      for (const region of this.map.regions) {
        // 30% chance d'avoir une ville, sinon un village
        const isTown = Math.random() < 0.3;
        
        // Trouver un bon emplacement dans la région (plaines ou proche d'une rivière)
        const candidates: {x: number, y: number}[] = [];
        
        for (let y = region.y - region.height/2; y <= region.y + region.height/2; y++) {
          for (let x = region.x - region.width/2; x <= region.x + region.width/2; x++) {
            // Vérifier que le point est dans les limites de la carte
            if (x >= 0 && x < this.map.width && y >= 0 && y < this.map.height) {
              const tile = this.map.tiles[Math.floor(y)][Math.floor(x)];
              
              // Les établissements sont généralement sur des plaines ou à proximité de l'eau
              if (tile.terrain === TerrainType.Plains) {
                // Vérifier si c'est près d'une rivière ou d'un lac (bonus)
                const hasWaterNearby = this.getNeighbors(Math.floor(x), Math.floor(y)).some(
                  n => this.map.tiles[n.y][n.x].terrain === TerrainType.River || 
                       this.map.tiles[n.y][n.x].terrain === TerrainType.Lake
                );
                
                if (hasWaterNearby) {
                  // Priorité aux emplacements près de l'eau
                  candidates.unshift({x: Math.floor(x), y: Math.floor(y)});
                } else {
                  candidates.push({x: Math.floor(x), y: Math.floor(y)});
                }
              }
            }
          }
        }
        
        // S'il n'y a pas de bons emplacements, prendre n'importe quel point non-eau dans la région
        if (candidates.length === 0) {
          for (let y = region.y - region.height/2; y <= region.y + region.height/2; y++) {
            for (let x = region.x - region.width/2; x <= region.x + region.width/2; x++) {
              if (x >= 0 && x < this.map.width && y >= 0 && y < this.map.height) {
                const tile = this.map.tiles[Math.floor(y)][Math.floor(x)];
                if (tile.terrain !== TerrainType.Ocean && 
                    tile.terrain !== TerrainType.Lake && 
                    tile.terrain !== TerrainType.River) {
                  candidates.push({x: Math.floor(x), y: Math.floor(y)});
                }
              }
            }
          }
        }
        
        // S'il y a des emplacements valides, placer l'établissement
        if (candidates.length > 0) {
          const position = candidates[Math.floor(Math.random() * Math.min(candidates.length, 3))]; // Un des 3 meilleurs emplacements
          
          const settlementId = `settlement_${this.map.pointsOfInterest.length}`;
          const settlementName = this.generateSettlementName(region.biome);
          
          this.map.pointsOfInterest.push({
            id: settlementId,
            name: settlementName,
            type: isTown ? 'town' : 'village',
            description: this.generateSettlementDescription(isTown, region.biome),
            x: position.x,
            y: position.y,
            discovered: false,
            explored: false,
            services: isTown ? 
                ['inn', 'shop', 'blacksmith', 'temple'] as ServiceType[] : 
                ['inn', ...(Math.random() < 0.5 ? ['shop' as ServiceType] : []), 
                        ...(Math.random() < 0.3 ? ['blacksmith' as ServiceType] : [])] as ServiceType[]
          });
          
          // Marquer cette case comme ayant un point d'intérêt
          this.map.tiles[position.y][position.x].terrain = TerrainType.Settlement;
          this.map.tiles[position.y][position.x].hasPointOfInterest = true;
          this.map.tiles[position.y][position.x].pointOfInterestId = settlementId;
        }
      }
      
      // Placer des donjons et points d'intérêt
      const dungeonCount = Math.floor(this.map.regions.length * 0.7); // 70% des régions ont un donjon
      
      for (let i = 0; i < dungeonCount; i++) {
        // Choisir une région aléatoire
        const regionIndex = Math.floor(Math.random() * this.map.regions.length);
        const region = this.map.regions[regionIndex];
        
        // Les donjons sont généralement dans les collines, montagnes ou forêts
        const candidates: {x: number, y: number}[] = [];
        
        for (let y = region.y - region.height/2; y <= region.y + region.height/2; y++) {
          for (let x = region.x - region.width/2; x <= region.x + region.width/2; x++) {
            if (x >= 0 && x < this.map.width && y >= 0 && y < this.map.height) {
              const tile = this.map.tiles[Math.floor(y)][Math.floor(x)];
              if (tile.terrain === TerrainType.Hills || 
                  tile.terrain === TerrainType.Mountains || 
                  tile.terrain === TerrainType.Forest) {
                candidates.push({x: Math.floor(x), y: Math.floor(y)});
              }
            }
          }
        }
        
        // S'il y a des emplacements valides, placer le donjon
        if (candidates.length > 0) {
          const position = candidates[Math.floor(Math.random() * candidates.length)];
          
          const dungeonId = `dungeon_${this.map.pointsOfInterest.length}`;
          const dungeonName = this.generateDungeonName(this.map.tiles[position.y][position.x].terrain);
          
          this.map.pointsOfInterest.push({
            id: dungeonId,
            name: dungeonName,
            type: 'dungeon',
            description: this.generateDungeonDescription(this.map.tiles[position.y][position.x].terrain, region.biome),
            x: position.x,
            y: position.y,
            discovered: false,
            explored: false
          });
          
          // Marquer cette case comme ayant un point d'intérêt
          this.map.tiles[position.y][position.x].terrain = TerrainType.Dungeon;
          this.map.tiles[position.y][position.x].hasPointOfInterest = true;
          this.map.tiles[position.y][position.x].pointOfInterestId = dungeonId;
        }
      }
      
      // Placer des points d'intérêt (sanctuaires, monuments, etc.)
      const landmarkCount = Math.floor(this.map.regions.length * 0.5); // 50% des régions ont un point d'intérêt
      
      for (let i = 0; i < landmarkCount; i++) {
        // Choisir une région aléatoire
        const regionIndex = Math.floor(Math.random() * this.map.regions.length);
        const region = this.map.regions[regionIndex];
        
        // Trouver un emplacement approprié (n'importe où sauf l'eau ou les établissements existants)
        const candidates: {x: number, y: number}[] = [];
        
        for (let y = region.y - region.height/2; y <= region.y + region.height/2; y++) {
          for (let x = region.x - region.width/2; x <= region.x + region.width/2; x++) {
            if (x >= 0 && x < this.map.width && y >= 0 && y < this.map.height) {
              const tile = this.map.tiles[Math.floor(y)][Math.floor(x)];
              if (tile.terrain !== TerrainType.Ocean && 
                  tile.terrain !== TerrainType.Lake && 
                  tile.terrain !== TerrainType.River &&
                  tile.terrain !== TerrainType.Settlement &&
                  tile.terrain !== TerrainType.Dungeon &&
                  !tile.hasPointOfInterest) {
                candidates.push({x: Math.floor(x), y: Math.floor(y)});
              }
            }
          }
        }
        
        // S'il y a des emplacements valides, placer le point d'intérêt
        if (candidates.length > 0) {
          const position = candidates[Math.floor(Math.random() * candidates.length)];
          
          const landmarkId = `landmark_${this.map.pointsOfInterest.length}`;
          const landmarkName = this.generateLandmarkName(this.map.tiles[position.y][position.x].terrain, region.biome);
          
          this.map.pointsOfInterest.push({
            id: landmarkId,
            name: landmarkName,
            type: 'landmark',
            description: this.generateLandmarkDescription(this.map.tiles[position.y][position.x].terrain, region.biome),
            x: position.x,
            y: position.y,
            discovered: false,
            explored: false
          });
          
          // Marquer cette case comme ayant un point d'intérêt
          this.map.tiles[position.y][position.x].terrain = TerrainType.Landmark;
          this.map.tiles[position.y][position.x].hasPointOfInterest = true;
          this.map.tiles[position.y][position.x].pointOfInterestId = landmarkId;
        }
      }
    }
    
    private generateSettlementName(biome: BiomeType): string {
      // Préfixes de noms de villes en fonction du biome
      const prefixes: Record<BiomeType, string[]> = {
        [BiomeType.Temperate]: ['Bois', 'Vert', 'Pont', 'Roche', 'Chêne', 'Claire'],
        [BiomeType.Tropical]: ['Palm', 'Soleil', 'Vague', 'Azur', 'Fleur', 'Corail'],
        [BiomeType.Arctic]: ['Gel', 'Neige', 'Glace', 'Frimas', 'Nord', 'Blanc'],
        [BiomeType.Arid]: ['Dune', 'Sable', 'Roc', 'Sec', 'Sol', 'Ocre'],
        [BiomeType.Coastal]: ['Port', 'Cap', 'Baie', 'Anse', 'Grève', 'Sel'],
        [BiomeType.Volcanic]: ['Forge', 'Feu', 'Cendre', 'Flamme', 'Roche', 'Braise']
      };
      
      // Suffixes de noms de villes
      const suffixes = ['bourg', 'ville', 'pont', 'mont', 'val', 'fort', 'port', 'lac', 'champ', 'rive'];
      
      const prefix = prefixes[biome][Math.floor(Math.random() * prefixes[biome].length)];
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
      
      return `${prefix}-${suffix}`;
    }
    
    private generateSettlementDescription(isTown: boolean, biome: BiomeType): string {
      const townDescriptions: Record<BiomeType, string[]> = {
        [BiomeType.Temperate]: [
          'Une ville prospère entourée de champs fertiles et de collines verdoyantes.',
          'Un centre commercial animé où les marchands viennent de loin pour échanger leurs marchandises.'
        ],
        [BiomeType.Tropical]: [
          'Une ville colorée aux toits de palmes où la vie se déroule au rythme lent imposé par la chaleur.',
          'Un port exotique où s\'échangent épices et fruits tropicaux venus de toutes les îles voisines.'
        ],
        [BiomeType.Arctic]: [
          'Une ville fortifiée contre les vents glacials, où les maisons sont en partie creusées dans le sol pour conserver la chaleur.',
          'Un bastion de civilisation dans les terres gelées, dont les habitantes ont développé un art de vivre adapté au froid extrême.'
        ],
        [BiomeType.Arid]: [
          'Une ville oasis dont les puits profonds sont la source vitale autour de laquelle s\'organise toute la vie.',
          'Un centre caravanier fortifié où les nomades viennent se ravitailler et échanger leurs marchandises.'
        ],
        [BiomeType.Coastal]: [
          'Une ville portuaire dynamique dont les quais voient passer navires marchands et bateaux de pêche.',
          'Une cité maritime aux maisons colorées, où la vie est rythmée par les marées et l\'arrivée des bateaux.'
        ],
        [BiomeType.Volcanic]: [
          'Une ville construite à flanc de volcan, dont les habitants exploitent l\'énergie géothermique et les sols fertiles.',
          'Une cité minière réputée pour ses forgerons et ses bijoux en obsidienne.'
        ]
      };
      
      const villageDescriptions: Record<BiomeType, string[]> = {
        [BiomeType.Temperate]: [
          'Un paisible village agricole niché au creux d\'une vallée verdoyante.',
          'Un hameau tranquille entouré de champs et de vergers bien entretenus.'
        ],
        [BiomeType.Tropical]: [
          'Un village de pêcheurs aux huttes de bambou ombragées par des palmiers imposants.',
          'Une petite communauté vivant en harmonie avec la jungle environnante.'
        ],
        [BiomeType.Arctic]: [
          'Un village compact dont les maisons serrées se protègent mutuellement contre les vents polaires.',
          'Un avant-poste robuste habité par des gens aussi résistants que le paysage qui les entoure.'
        ],
        [BiomeType.Arid]: [
          'Un village aux maisons de terre séchée regroupées autour d\'un puits ancestral.',
          'Une petite oasis de vie dans l\'immensité désertique.'
        ],
        [BiomeType.Coastal]: [
          'Un village de pêcheurs dont les bateaux colorés s\'alignent sur la plage.',
          'Une modeste communauté vivant des ressources de la mer et du commerce côtier.'
        ],
        [BiomeType.Volcanic]: [
          'Un village dont les habitations utilisent la chaleur naturelle du sol pour se chauffer.',
          'Une communauté minière exploitant les ressources uniques de cette terre tourmentée.'
        ]
      };
      
      if (isTown) {
        return townDescriptions[biome][Math.floor(Math.random() * townDescriptions[biome].length)];
      } else {
        return villageDescriptions[biome][Math.floor(Math.random() * villageDescriptions[biome].length)];
      }
    }
    
    private generateDungeonName(terrain: TerrainType): string {
      const prefixes: Record<string, string[]> = {
        [TerrainType.Mountains]: ['Pics', 'Gouffre', 'Cime', 'Abîme', 'Caverne'],
        [TerrainType.Hills]: ['Terrier', 'Tunnel', 'Grotte', 'Trou', 'Antre'],
        [TerrainType.Forest]: ['Bosquet', 'Clairière', 'Sous-bois', 'Racines', 'Sylve'],
        default: ['Donjon', 'Ruines', 'Crypte', 'Tombe', 'Fosse']
      };
      
      const terrainKey = Object.keys(prefixes).includes(terrain) ? terrain : 'default';
      
      const prefix = prefixes[terrainKey][Math.floor(Math.random() * prefixes[terrainKey].length)];
      
      // Suffixes évocateurs
      const suffixes = [
        'des Ténèbres', 'du Désespoir', 'des Ombres', 'des Âmes', 'des Échos',
        'Oublié', 'Maudit', 'Interdit', 'Perdu', 'Profond'
      ];
      
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
      
      return `${prefix} ${suffix}`;
    }
    
    private generateDungeonDescription(terrain: TerrainType, biome: BiomeType): string {
      const descriptions: Record<string, string[]> = {
        [TerrainType.Mountains]: [
          'Un réseau de grottes s\'enfonçant profondément dans la montagne, regorgeant de dangers et de trésors.',
          'Une ancienne mine abandonnée dont les tunnels s\'étendent bien au-delà de ce que les cartes indiquent.'
        ],
        [TerrainType.Hills]: [
          'Un complexe souterrain creusé sous les collines, dont l\'entrée discrète trompe sur l\'étendue réelle.',
          'Un labyrinthe de tunnels naturels élargis par des mains anciennes pour un usage mystérieux.'
        ],
        [TerrainType.Forest]: [
          'Une structure ancienne presque entièrement engloutie par la végétation, cachant des secrets oubliés.',
          'Un sanctuaire corrompu dont les salles sont désormais le repaire de créatures sylvestres hostiles.'
        ],
        default: [
          'Des ruines antiques dont l\'architecture suggère une civilisation bien plus avancée que la nôtre.',
          'Un complexe souterrain aux origines mystérieuses, peuplé de dangers aussi anciens que ses murs.'
        ]
      };
      
      const terrainKey = Object.keys(descriptions).includes(terrain) ? terrain : 'default';
      
      return descriptions[terrainKey][Math.floor(Math.random() * descriptions[terrainKey].length)];
    }
    
    private generateLandmarkName(terrain: TerrainType, biome: BiomeType): string {
      const prefixes: Record<string, string[]> = {
        [TerrainType.Plains]: ['Cercle', 'Monument', 'Pilier', 'Autel', 'Stèle'],
        [TerrainType.Forest]: ['Arbre', 'Bosquet', 'Sanctuaire', 'Pierre', 'Source'],
        [TerrainType.Hills]: ['Cairn', 'Tumulus', 'Menhir', 'Dolmen', 'Monument'],
        [TerrainType.Mountains]: ['Pic', 'Autel', 'Observatoire', 'Pilier', 'Trône'],
        default: ['Vestige', 'Monument', 'Sanctuaire', 'Autel', 'Relique']
      };
      
      const terrainKey = Object.keys(prefixes).includes(terrain) ? terrain : 'default';
      
      const prefix = prefixes[terrainKey][Math.floor(Math.random() * prefixes[terrainKey].length)];
      
      // Adjectifs mystiques
      const adjectives = [
        'Ancien', 'Sacré', 'Primordial', 'Éternel', 'Mystique',
        'Oublié', 'Silencieux', 'Gardien', 'Ancestral', 'Divin'
      ];
      
      const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
      
      return `${prefix} ${adjective}`;
    }
    
    private generateLandmarkDescription(terrain: TerrainType, biome: BiomeType): string {
      const descriptions: Record<string, string[]> = {
        [TerrainType.Plains]: [
          'Un cercle de pierres dressées dont l\'alignement semble correspondre aux astres et aux saisons.',
          'Un monument isolé au milieu des plaines, vestige d\'une civilisation depuis longtemps disparue.'
        ],
        [TerrainType.Forest]: [
          'Un arbre majestueux aux dimensions impossibles, dont les racines semblent pulser d\'énergie mystique.',
          'Un ancien sanctuaire sylvestre où les druides venaient communier avec les esprits de la nature.'
        ],
        [TerrainType.Hills]: [
          'Un tumulus funéraire dont on dit qu\'il abrite les restes d\'un roi ou d\'un héros légendaire.',
          'Un alignement de menhirs orientés vers un point précis de l\'horizon au solstice.'
        ],
        [TerrainType.Mountains]: [
          'Un autel situé au sommet d\'un pic difficile d\'accès, où les anciens venaient faire des offrandes aux dieux.',
          'Une formation rocheuse étrange qui semble avoir été façonnée par une intelligence supérieure.'
        ],
        default: [
          'Un monument énigmatique dont la fonction reste un mystère pour les érudits modernes.',
          'Un lieu de pouvoir où le voile entre les mondes semble plus ténu qu\'ailleurs.'
        ]
      };
      
      const terrainKey = Object.keys(descriptions).includes(terrain) ? terrain : 'default';
      
      return descriptions[terrainKey][Math.floor(Math.random() * descriptions[terrainKey].length)];
    }
    
    private createRoadsAndPaths(): void {
      // Connecter les établissements par des routes et des chemins
      
      // D'abord, trouver tous les établissements
      const settlements = this.map.pointsOfInterest.filter(
        poi => poi.type === 'town' || poi.type === 'village'
      );
      
      // Connecter chaque ville à la ville ou au village le plus proche
      for (let i = 0; i < settlements.length; i++) {
        const start = settlements[i];
        
        // Trouver l'établissement le plus proche
        let minDistance = Number.MAX_VALUE;
        let closest = null;
        
        for (let j = 0; j < settlements.length; j++) {
          if (i !== j) {
            const end = settlements[j];
            const distance = Math.sqrt(
              Math.pow(start.x - end.x, 2) + Math.pow(start.y - end.y, 2)
            );
            
            if (distance < minDistance) {
              minDistance = distance;
              closest = end;
            }
          }
        }
        
        // S'il y a un établissement le plus proche, créer une route
        if (closest) {
          this.createRoad(start.x, start.y, closest.x, closest.y, start.type === 'town' || closest.type === 'town');
        }
      }
      
      // Ajouter quelques chemins aléatoires entre établissements et points d'intérêt
      const landmarksAndDungeons = this.map.pointsOfInterest.filter(
        poi => poi.type === 'dungeon' || poi.type === 'landmark'
      );
      
      for (const poi of landmarksAndDungeons) {
        // 70% chance de créer un chemin vers l'établissement le plus proche
        if (Math.random() < 0.7) {
          let minDistance = Number.MAX_VALUE;
          let closest = null;
          
          for (const settlement of settlements) {
            const distance = Math.sqrt(
              Math.pow(poi.x - settlement.x, 2) + Math.pow(poi.y - settlement.y, 2)
            );
            
            if (distance < minDistance) {
              minDistance = distance;
              closest = settlement;
            }
          }
          
          if (closest) {
            this.createRoad(poi.x, poi.y, closest.x, closest.y, false); // Créer un chemin (pas une route)
          }
        }
      }
    }
    
    private createRoad(startX: number, startY: number, endX: number, endY: number, isRoad: boolean): void {
      // Crée une route ou un chemin entre deux points en utilisant une version simplifiée de l'algorithme A*
      // Pour la démonstration, nous utilisons une ligne droite avec de petites variations
      
      const dx = endX - startX;
      const dy = endY - startY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance === 0) return; // Les points sont identiques
      
      // Normaliser les vecteurs de direction
      const nx = dx / distance;
      const ny = dy / distance;
      
      // Dessiner la route/chemin point par point
      let currentX = startX;
      let currentY = startY;
      
      while (Math.abs(currentX - endX) > 0.5 || Math.abs(currentY - endY) > 0.5) {
        // Arrondir les coordonnées pour obtenir des indices valides
        const tileX = Math.round(currentX);
        const tileY = Math.round(currentY);
        
        // Vérifier que le point est dans les limites de la carte
        if (tileX >= 0 && tileX < this.map.width && tileY >= 0 && tileY < this.map.height) {
          // Ne pas remplacer les points d'intérêt ou l'eau
          if (!this.map.tiles[tileY][tileX].hasPointOfInterest && 
              this.map.tiles[tileY][tileX].terrain !== TerrainType.Ocean &&
              this.map.tiles[tileY][tileX].terrain !== TerrainType.Lake &&
              this.map.tiles[tileY][tileX].terrain !== TerrainType.River) {
            
            this.map.tiles[tileY][tileX].terrain = isRoad ? TerrainType.Road : TerrainType.Path;
            
            // Réduire le coût de mouvement sur les routes et chemins
            this.map.tiles[tileY][tileX].movementCost = isRoad ? 0.8 : 0.9;
          }
          
          // Si on croise une rivière, créer un pont
          if (this.map.tiles[tileY][tileX].terrain === TerrainType.River) {
            this.map.tiles[tileY][tileX].terrain = TerrainType.Bridge;
            this.map.tiles[tileY][tileX].movementCost = 1;
          }
        }
        
        // Avancer d'un pas avec une légère déviation aléatoire pour donner un aspect naturel
        const deviation = 0.3; // Force de la déviation
        currentX += nx + (Math.random() - 0.5) * deviation;
        currentY += ny + (Math.random() - 0.5) * deviation;
      }
    }
    
    private setPlayerStartingPosition(): void {
      // Placer le joueur dans une zone de départ sécurisée (généralement un village)
      
      // Trouver tous les villages
      const villages = this.map.pointsOfInterest.filter(poi => poi.type === 'village');
      
      if (villages.length > 0) {
        // Choisir un village aléatoire
        const startVillage = villages[Math.floor(Math.random() * villages.length)];
        
        this.map.currentPlayerPosition = {
          x: startVillage.x,
          y: startVillage.y
        };
        
        // Marquer le village et la région environnante comme explorés
        startVillage.discovered = true;
        startVillage.explored = true;
        
        // Explorer toutes les tuiles dans un rayon de 5 cases autour du joueur
        const radius = 5;
        for (let y = startVillage.y - radius; y <= startVillage.y + radius; y++) {
          for (let x = startVillage.x - radius; x <= startVillage.x + radius; x++) {
            if (x >= 0 && x < this.map.width && y >= 0 && y < this.map.height) {
              const distance = Math.sqrt(
                Math.pow(x - startVillage.x, 2) + Math.pow(y - startVillage.y, 2)
              );
              
              if (distance <= radius) {
                this.map.tiles[y][x].explored = true;
              }
            }
          }
        }
        
        // Trouver et marquer la région contenant le village comme découverte
        for (const region of this.map.regions) {
          if (startVillage.x >= region.x - region.width/2 && 
              startVillage.x <= region.x + region.width/2 && 
              startVillage.y >= region.y - region.height/2 && 
              startVillage.y <= region.y + region.height/2) {
            region.discovered = true;
            region.explored = 10; // Pourcentage exploré
            break;
          }
        }
      } else {
        // S'il n'y a pas de village, placer le joueur dans une zone de plaine
        const candidates: {x: number, y: number}[] = [];
        
        for (let y = 0; y < this.map.height; y++) {
          for (let x = 0; x < this.map.width; x++) {
            if (this.map.tiles[y][x].terrain === TerrainType.Plains) {
              candidates.push({x, y});
            }
          }
        }
        
        if (candidates.length > 0) {
          const startPosition = candidates[Math.floor(Math.random() * candidates.length)];
          
          this.map.currentPlayerPosition = {
            x: startPosition.x,
            y: startPosition.y
          };
          
          // Explorer toutes les tuiles dans un rayon de 3 cases autour du joueur
          const radius = 3;
          for (let y = startPosition.y - radius; y <= startPosition.y + radius; y++) {
            for (let x = startPosition.x - radius; x <= startPosition.x + radius; x++) {
              if (x >= 0 && x < this.map.width && y >= 0 && y < this.map.height) {
                const distance = Math.sqrt(
                  Math.pow(x - startPosition.x, 2) + Math.pow(y - startPosition.y, 2)
                );
                
                if (distance <= radius) {
                  this.map.tiles[y][x].explored = true;
                }
              }
            }
          }
        }
      }
    }
  }
  
  // Classe pour gérer les interactions du joueur avec la carte
  export class WorldMapManager {
    private map: WorldMap;
    private viewportWidth: number = 41; // Nombre impair pour avoir un centre
    private viewportHeight: number = 41;
    
    constructor(map: WorldMap) {
      this.map = map;
    }
    
    // Obtenir la partie visible de la carte autour du joueur
    getViewport(): WorldTile[][] {
      const { x, y } = this.map.currentPlayerPosition;
      const halfWidth = Math.floor(this.viewportWidth / 2);
      const halfHeight = Math.floor(this.viewportHeight / 2);
      
      const viewport: WorldTile[][] = [];
      
      for (let vy = 0; vy < this.viewportHeight; vy++) {
        viewport[vy] = [];
        for (let vx = 0; vx < this.viewportWidth; vx++) {
          const worldX = x - halfWidth + vx;
          const worldY = y - halfHeight + vy;
          
          if (worldX >= 0 && worldX < this.map.width && worldY >= 0 && worldY < this.map.height) {
            // Copier la tuile depuis la carte du monde
            viewport[vy][vx] = { ...this.map.tiles[worldY][worldX] };
          } else {
            // Tuile hors limites (bord du monde)
            viewport[vy][vx] = {
              x: worldX,
              y: worldY,
              terrain: TerrainType.Ocean,
              biome: BiomeType.Temperate,
              elevation: 0,
              explored: false,
              hasPointOfInterest: false,
              movementCost: 100,
              dangerLevel: 0
            };
          }
        }
      }
      
      return viewport;
    }
    
    // Déplacer le joueur dans une direction (NSEW)
    movePlayer(direction: 'north' | 'south' | 'east' | 'west'): boolean {
      const { x, y } = this.map.currentPlayerPosition;
      let newX = x;
      let newY = y;
      
      switch (direction) {
        case 'north':
          newY--;
          break;
        case 'south':
          newY++;
          break;
        case 'east':
          newX++;
          break;
        case 'west':
          newX--;
          break;
      }
      
      // Vérifier si la nouvelle position est valide
      if (newX >= 0 && newX < this.map.width && newY >= 0 && newY < this.map.height) {
        const targetTile = this.map.tiles[newY][newX];
        
        // Vérifier si la tuile est traversable (eau et autres obstacles ne le sont pas)
        if (targetTile.movementCost < 50) { // 50+ considéré comme infranchissable
          // Déplacer le joueur
          this.map.currentPlayerPosition = { x: newX, y: newY };
          
          // Explorer les tuiles environnantes
          this.exploreArea(newX, newY, 3); // Rayon de vision de 3 cases
          
          // Découvrir les points d'intérêt à proximité
          this.discoverNearbyPointsOfInterest(newX, newY);
          
          // Mettre à jour l'exploration des régions
          this.updateRegionExploration();
          
          return true;
        }
      }
      
      return false; // Mouvement impossible
    }
    
    // Explorer la zone autour du joueur
    private exploreArea(centerX: number, centerY: number, radius: number): void {
      for (let y = centerY - radius; y <= centerY + radius; y++) {
        for (let x = centerX - radius; x <= centerX + radius; x++) {
          if (x >= 0 && x < this.map.width && y >= 0 && y < this.map.height) {
            const distance = Math.sqrt(
              Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
            );
            
            if (distance <= radius) {
              this.map.tiles[y][x].explored = true;
            }
          }
        }
      }
    }
    
    // Découvrir les points d'intérêt à proximité
    private discoverNearbyPointsOfInterest(playerX: number, playerY: number): void {
      for (const poi of this.map.pointsOfInterest) {
        const distance = Math.sqrt(
          Math.pow(playerX - poi.x, 2) + Math.pow(playerY - poi.y, 2)
        );
        
        // Les points d'intérêt sont découverts quand le joueur s'en approche à 5 cases
        if (distance <= 5) {
          poi.discovered = true;
        }
        
        // Les points d'intérêt sont explorés quand le joueur est dessus ou adjacent
        if (distance <= 1) {
          poi.explored = true;
        }
      }
    }
    
    // Mettre à jour le pourcentage d'exploration des régions
    private updateRegionExploration(): void {
      for (const region of this.map.regions) {
        let totalTiles = 0;
        let exploredTiles = 0;
        
        // Compter les tuiles de la région et celles qui sont explorées
        const centerX = region.x;
        const centerY = region.y;
        const halfWidth = region.width / 2;
        const halfHeight = region.height / 2;
        
        for (let y = Math.floor(centerY - halfHeight); y <= Math.ceil(centerY + halfHeight); y++) {
          for (let x = Math.floor(centerX - halfWidth); x <= Math.ceil(centerX + halfWidth); x++) {
            if (x >= 0 && x < this.map.width && y >= 0 && y < this.map.height) {
              totalTiles++;
              
              if (this.map.tiles[y][x].explored) {
                exploredTiles++;
              }
            }
          }
        }
        
        // Mettre à jour le pourcentage d'exploration
        if (totalTiles > 0) {
          region.explored = Math.floor((exploredTiles / totalTiles) * 100);
        }
        
        // Si au moins 5% de la région est explorée, elle est considérée comme découverte
        if (region.explored >= 5) {
          region.discovered = true;
        }
      }
    }
    
    // Obtenir un point d'intérêt à une position donnée
    getPointOfInterestAt(x: number, y: number): PointOfInterest | null {
      if (x >= 0 && x < this.map.width && y >= 0 && y < this.map.height) {
        const tile = this.map.tiles[y][x];
        
        if (tile.hasPointOfInterest && tile.pointOfInterestId) {
          return this.map.pointsOfInterest.find(poi => poi.id === tile.pointOfInterestId) || null;
        }
      }
      
      return null;
    }
    
    // Obtenir le point d'intérêt où se trouve le joueur
    getCurrentPointOfInterest(): PointOfInterest | null {
      const { x, y } = this.map.currentPlayerPosition;
      return this.getPointOfInterestAt(x, y);
    }
    
    // Obtenir la région où se trouve le joueur
    getCurrentRegion(): Region | null {
      const { x, y } = this.map.currentPlayerPosition;
      
      for (const region of this.map.regions) {
        const centerX = region.x;
        const centerY = region.y;
        const halfWidth = region.width / 2;
        const halfHeight = region.height / 2;
        
        if (x >= centerX - halfWidth && x <= centerX + halfWidth &&
            y >= centerY - halfHeight && y <= centerY + halfHeight) {
          return region;
        }
      }
      
      return null;
    }
    
    // Obtenir la région par son ID
    getRegionById(regionId: string): Region | null {
      return this.map.regions.find(region => region.id === regionId) || null;
    }
    
    // Obtenir la carte du monde complète
    getWorldMap(): WorldMap {
      return this.map;
    }
    
    // Obtenir les informations sur la tuile où se trouve le joueur
    getCurrentTile(): WorldTile {
      const { x, y } = this.map.currentPlayerPosition;
      return this.map.tiles[y][x];
    }
    
    // Vérifier si une position donnée est visible dans la vue actuelle
    isPositionVisible(x: number, y: number): boolean {
      const { x: playerX, y: playerY } = this.map.currentPlayerPosition;
      const halfWidth = Math.floor(this.viewportWidth / 2);
      const halfHeight = Math.floor(this.viewportHeight / 2);
      
      return x >= playerX - halfWidth && x <= playerX + halfWidth &&
             y >= playerY - halfHeight && y <= playerY + halfHeight;
    }
    
    // Obtenir toutes les régions découvertes
    getDiscoveredRegions(): Region[] {
      return this.map.regions.filter(region => region.discovered);
    }
    
    // Obtenir tous les points d'intérêt découverts
    getDiscoveredPointsOfInterest(): PointOfInterest[] {
      return this.map.pointsOfInterest.filter(poi => poi.discovered);
    }
  }