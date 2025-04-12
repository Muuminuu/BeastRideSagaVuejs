import type { MapTile } from '@/types';
import { TileType } from '@/types';

// Fonction pour générer une carte plus naturelle et cohérente
import { EntityType } from '@/types';

export function generateMap(width: number, height: number): MapTile[][] {
  const map: MapTile[][] = [];
  
  // Initialiser une carte vide avec de l'herbe partout
  for (let y = 0; y < height; y++) {
    const row: MapTile[] = [];
    for (let x = 0; x < width; x++) {
      row.push({ 
        type: TileType.Grass, 
        walkable: true,
        description: 'Une zone d\'herbe luxuriante' 
      });
    }
    map.push(row);
  }

  // Ajouter des bordures de murs
  addBorders(map, width, height);
  
  // Générer des biomes cohérents
  generateBiomes(map, width, height);
  
  // Ajouter des chemins
  generatePaths(map, width, height);
  
  // Ajouter quelques obstacles aléatoires (montagnes, rochers, etc.)
  addRandomObstacles(map, width, height);
  
  // Ajouter des entités sur la carte
  addEntities(map, width, height);
  
  return map;
}

// Ajouter des bordures de murs autour de la carte
function addBorders(map: MapTile[][], width: number, height: number): void {
  for (let x = 0; x < width; x++) {
    map[0][x] = { 
      type: TileType.Wall, 
      walkable: false, 
      description: 'Un mur infranchissable'
    };
    map[height - 1][x] = { 
      type: TileType.Wall, 
      walkable: false, 
      description: 'Un mur infranchissable'
    };
  }
  
  for (let y = 0; y < height; y++) {
    map[y][0] = { 
      type: TileType.Wall, 
      walkable: false, 
      description: 'Un mur infranchissable'
    };
    map[y][width - 1] = { 
      type: TileType.Wall, 
      walkable: false, 
      description: 'Un mur infranchissable'
    };
  }
}

// Générer des biomes cohérents (lacs, forêts, déserts, etc.)
function generateBiomes(map: MapTile[][], width: number, height: number): void {
  // Paramètres pour les biomes
  const biomes = [
    { type: TileType.Water, probability: 0.03, minSize: 8, maxSize: 20, walkable: false, description: 'Un lac profond' },
    { type: TileType.Forest, probability: 0.04, minSize: 10, maxSize: 25, walkable: true, description: 'Une forêt dense' },
    { type: TileType.Sand, probability: 0.03, minSize: 8, maxSize: 15, walkable: true, description: 'Une zone sablonneuse' },
    { type: TileType.Mountain, probability: 0.02, minSize: 5, maxSize: 12, walkable: false, description: 'Une montagne escarpée' },
    { type: TileType.Swamp, probability: 0.02, minSize: 6, maxSize: 12, walkable: true, description: 'Un marécage boueux' },
    { type: TileType.Ice, probability: 0.015, minSize: 5, maxSize: 10, walkable: true, description: 'Une surface glacée glissante' },
    { type: TileType.Ruins, probability: 0.01, minSize: 3, maxSize: 8, walkable: true, description: 'Des ruines anciennes' },
    { type: TileType.Cave, probability: 0.01, minSize: 2, maxSize: 5, walkable: true, description: 'L\'entrée d\'une grotte sombre' }
  ];

  // Générer chaque biome
  for (let biome of biomes) {
    generateBiome(map, width, height, biome);
  }
}

// Générer un type spécifique de biome
function generateBiome(
  map: MapTile[][], 
  width: number, 
  height: number, 
  biome: { type: TileType, probability: number, minSize: number, maxSize: number, walkable: boolean, description: string }
): void {
  // Nombre de points de départ pour ce biome
  const numStartPoints = Math.floor((width * height) * biome.probability);
  
  for (let i = 0; i < numStartPoints; i++) {
    // Choisir un point de départ aléatoire (éviter les bords)
    const startX = Math.floor(Math.random() * (width - 4)) + 2;
    const startY = Math.floor(Math.random() * (height - 4)) + 2;
    
    // Taille aléatoire pour ce biome
    const size = Math.floor(Math.random() * (biome.maxSize - biome.minSize + 1)) + biome.minSize;
    
    // Croissance organique du biome à partir du point de départ
    growBiome(map, startX, startY, biome.type, size, biome.walkable, biome.description);
  }
}

// Faire croître un biome de manière organique à partir d'un point
function growBiome(
  map: MapTile[][], 
  startX: number, 
  startY: number, 
  type: TileType, 
  size: number,
  walkable: boolean,
  description: string
): void {
  const width = map[0].length;
  const height = map.length;
  
  // Liste des tuiles à traiter (commençant par le point de départ)
  const tilesToProcess = [{ x: startX, y: startY }];
  // Tuiles déjà traitées
  const processedTiles = new Set<string>();
  
  while (tilesToProcess.length > 0 && processedTiles.size < size) {
    // Prendre une tuile aléatoire de la liste
    const randomIndex = Math.floor(Math.random() * tilesToProcess.length);
    const currentTile = tilesToProcess[randomIndex];
    tilesToProcess.splice(randomIndex, 1);
    
    const tileKey = `${currentTile.x},${currentTile.y}`;
    if (processedTiles.has(tileKey)) continue;
    
    // Marquer comme traitée
    processedTiles.add(tileKey);
    
    // Modifier la tuile actuelle (sauf si c'est un mur de bordure)
    if (currentTile.x > 1 && currentTile.y > 1 && currentTile.x < width - 2 && currentTile.y < height - 2) {
      // Éviter de remplacer les murs
      if (map[currentTile.y][currentTile.x].type !== TileType.Wall) {
        map[currentTile.y][currentTile.x] = { type, walkable, description };
      }
      
      // Ajouter les tuiles voisines avec une probabilité décroissante selon la distance
      const neighbors = [
        { x: currentTile.x + 1, y: currentTile.y },
        { x: currentTile.x - 1, y: currentTile.y },
        { x: currentTile.x, y: currentTile.y + 1 },
        { x: currentTile.x, y: currentTile.y - 1 }
      ];
      
      for (const neighbor of neighbors) {
        if (
          neighbor.x > 0 && neighbor.y > 0 && 
          neighbor.x < width - 1 && neighbor.y < height - 1 &&
          !processedTiles.has(`${neighbor.x},${neighbor.y}`) &&
          Math.random() < 0.75  // 75% de chance de croître dans cette direction
        ) {
          tilesToProcess.push(neighbor);
        }
      }
    }
  }
}

// Générer des chemins naturels sur la carte
function generatePaths(map: MapTile[][], width: number, height: number): void {
  // Chemin principal horizontal
  const midY = Math.floor(height / 2);
  
  // Point de départ et d'arrivée
  const startX = 1;
  const endX = width - 2;
  
  // Générer un chemin sinueux
  generateSinuousPath(map, { x: startX, y: midY }, { x: endX, y: midY });
  
  // Chemin secondaire vertical
  const midX = Math.floor(width / 2);
  generateSinuousPath(map, { x: midX, y: 1 }, { x: midX, y: height - 2 });
  
  // Quelques chemins aléatoires supplémentaires
  for (let i = 0; i < 3; i++) {
    const startPoint = {
      x: Math.floor(Math.random() * (width - 4)) + 2,
      y: Math.floor(Math.random() * (height - 4)) + 2
    };
    
    const endPoint = {
      x: Math.floor(Math.random() * (width - 4)) + 2,
      y: Math.floor(Math.random() * (height - 4)) + 2
    };
    
    generateSinuousPath(map, startPoint, endPoint);
  }
}

// Générer un chemin sinueux entre deux points
function generateSinuousPath(
  map: MapTile[][], 
  start: { x: number, y: number }, 
  end: { x: number, y: number }
): void {
  const width = map[0].length;
  const height = map.length;
  
  let currentX = start.x;
  let currentY = start.y;
  
  while (currentX !== end.x || currentY !== end.y) {
    // Marquer la tuile actuelle comme un chemin (si ce n'est pas un mur)
    if (map[currentY][currentX].type !== TileType.Wall) {
      map[currentY][currentX] = { 
        type: TileType.Path, 
        walkable: true,
        description: 'Un sentier bien tracé' 
      };
    }
    
    // Déterminer la direction à prendre
    const horizontalDiff = end.x - currentX;
    const verticalDiff = end.y - currentY;
    
    // Probabilité de mouvement selon les différences
    const horizontalProb = Math.abs(horizontalDiff) / (Math.abs(horizontalDiff) + Math.abs(verticalDiff));
    
    // Ajouter un facteur aléatoire pour rendre le chemin sinueux
    const randomFactor = Math.random() * 0.3; // 30% d'aléatoire
    
    // Décider si on bouge horizontalement ou verticalement
    if (Math.random() < horizontalProb + randomFactor) {
      // Mouvement horizontal
      currentX += horizontalDiff > 0 ? 1 : -1;
    } else {
      // Mouvement vertical
      currentY += verticalDiff > 0 ? 1 : -1;
    }
    
    // S'assurer qu'on reste dans les limites
    currentX = Math.max(1, Math.min(width - 2, currentX));
    currentY = Math.max(1, Math.min(height - 2, currentY));
  }
  
  // Marquer le point final
  if (map[end.y][end.x].type !== TileType.Wall) {
    map[end.y][end.x] = { 
      type: TileType.Path, 
      walkable: true,
      description: 'Un sentier bien tracé' 
    };
  }
}

// Ajouter des obstacles aléatoires
function addRandomObstacles(map: MapTile[][], width: number, height: number): void {
  const numObstacles = Math.floor((width * height) * 0.01); // 1% de la carte
  
  for (let i = 0; i < numObstacles; i++) {
    const x = Math.floor(Math.random() * (width - 4)) + 2;
    const y = Math.floor(Math.random() * (height - 4)) + 2;
    
    // Ajouter un rocher ou un autre petit obstacle
    if (map[y][x].type === TileType.Grass || map[y][x].type === TileType.Sand) {
      // Plusieurs types d'obstacles possibles
      const rand = Math.random();
      
      if (rand < 0.3) {
        map[y][x] = { 
          type: TileType.Mountain, 
          walkable: false,
          description: 'Un rocher imposant' 
        };
      } else if (rand < 0.6) {
        map[y][x] = { 
          type: TileType.Wall, 
          walkable: false,
          description: 'Un mur de pierre' 
        };
      } else if (rand < 0.8) {
        // Ajouter une zone de danger avec attributs
        map[y][x] = { 
          type: TileType.Lava, 
          walkable: true,
          description: 'Une flaque de lave bouillonnante',
          attributes: {
            danger: 2, // Niveau de danger (0-10)
          }
        };
      } else {
        // Ajouter une zone avec un trésor caché
        map[y][x] = { 
          type: map[y][x].type, // Garder le même type
          walkable: true,
          description: 'Il semble y avoir quelque chose d\'intéressant ici...',
          attributes: {
            treasure: Math.floor(Math.random() * 5) + 1, // Valeur du trésor (1-5)
            hidden: true
          }
        };
      }
    }
  }
}

// Ajouter des entités sur la carte (NPC, trésors, portails, etc.)
function addEntities(map: MapTile[][], width: number, height: number): void {
  // Ajouter quelques PNJ
  addEntityType(map, width, height, {
    type: EntityType.NPC,
    count: 5,
    nameOptions: ['Villageois', 'Marchand', 'Voyageur', 'Sage', 'Étranger'],
    interactions: [
      'Bienvenue dans Beast Ride Saga!',
      'Méfiez-vous des marécages au sud.',
      'On raconte qu\'il y a des trésors cachés dans les ruines.',
      'Avez-vous vu les étranges portails qui sont apparus?',
      'Le passage vers les montagnes du nord est dangereux.'
    ]
  });
  
  // Ajouter des trésors
  addEntityType(map, width, height, {
    type: EntityType.Treasure,
    count: 8,
    nameOptions: ['Coffre', 'Butin', 'Artefact ancien', 'Relique', 'Gemmes'],
    valueRange: [1, 5]
  });
  
  // Ajouter des portails
  addEntityType(map, width, height, {
    type: EntityType.Portal,
    count: 3,
    nameOptions: ['Portail mystérieux', 'Porte dimensionnelle', 'Vortex'],
    interactions: ['Ce portail semble mener vers un autre endroit...']
  });
  
  // Ajouter des objets
  addEntityType(map, width, height, {
    type: EntityType.Item,
    count: 10,
    nameOptions: ['Potion', 'Épée', 'Bouclier', 'Parchemin', 'Amulette'],
    interactions: ['Un objet qui pourrait être utile.']
  });
}

// Fonction utilitaire pour ajouter un type d'entité spécifique
function addEntityType(
  map: MapTile[][], 
  width: number, 
  height: number, 
  options: {
    type: EntityType,
    count: number,
    nameOptions: string[],
    interactions?: string[],
    valueRange?: [number, number]
  }
): void {
  const { type, count, nameOptions, interactions, valueRange } = options;
  
  let placedCount = 0;
  let attempts = 0;
  const maxAttempts = count * 10; // Éviter les boucles infinies
  
  while (placedCount < count && attempts < maxAttempts) {
    attempts++;
    
    // Choisir une position aléatoire (éviter les bords)
    const x = Math.floor(Math.random() * (width - 4)) + 2;
    const y = Math.floor(Math.random() * (height - 4)) + 2;
    
    // Vérifier si la position est adaptée
    if (
      map[y][x].walkable && 
      map[y][x].type !== TileType.Water && 
      !map[y][x].entity // Pas d'entité existante
    ) {
      // Choisir un nom aléatoire
      const name = nameOptions[Math.floor(Math.random() * nameOptions.length)];
      
      // Choisir une interaction si disponible
      let interaction = undefined;
      if (interactions && interactions.length > 0) {
        interaction = interactions[Math.floor(Math.random() * interactions.length)];
      }
      
      // Créer l'entité
      const entity: any = {
        type,
        name,
        id: `${type}-${placedCount}`
      };
      
      if (interaction) {
        entity.interaction = interaction;
      }
      
      // Ajouter des attributs spécifiques au type
      if (type === EntityType.Treasure && valueRange) {
        map[y][x].attributes = {
          ...map[y][x].attributes,
          treasure: Math.floor(Math.random() * (valueRange[1] - valueRange[0] + 1)) + valueRange[0]
        };
      }
      
      // Ajouter l'entité à la tuile
      map[y][x].entity = entity;
      
      placedCount++;
    }
  }
}