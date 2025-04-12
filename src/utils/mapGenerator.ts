import type { MapTile } from '@/types';
import { EntityType, TileType } from '@/types';


// Structure pour stocker les zones climatiques et d'altitude
interface MapZone {
  altitude: number; // 0-100 (0 = profondeur océanique, 100 = haute montagne)
  humidity: number; // 0-100 (0 = aride, 100 = très humide)
  temperature: number; // 0-100 (0 = glacial, 100 = très chaud)
}

// Générer une carte réaliste
export function generateMap(width: number, height: number): MapTile[][] {
  // Taille significativement augmentée
  const worldWidth = Math.max(width, 100);
  const worldHeight = Math.max(height, 80);
  
  // 1. Générer la topographie et le climat de base
  const worldData: MapZone[][] = generateWorldData(worldWidth, worldHeight);
  
  // 2. Convertir les données climatiques en types de terrain
  const map: MapTile[][] = convertWorldDataToTerrain(worldData);
  
  // 3. Ajouter des chemins naturels, routes et rivières
  addPathsAndRivers(map, worldWidth, worldHeight, worldData);
  
  // 4. Ajouter des points d'intérêt et des entités
  addEntitiesAndPOIs(map, worldWidth, worldHeight, worldData);
  
  return map;
}

// Génère les données de base pour l'altitude, l'humidité et la température
function generateWorldData(width: number, height: number): MapZone[][] {
  const worldData: MapZone[][] = [];
  
  // Initialiser avec des valeurs aléatoires de base
  for (let y = 0; y < height; y++) {
    const row: MapZone[] = [];
    for (let x = 0; x < width; x++) {
      row.push({
        altitude: 0,
        humidity: 0,
        temperature: 0
      });
    }
    worldData.push(row);
  }
  
  // Générer le terrain avec un algorithme de bruit cohérent
  generateTerrain(worldData, width, height);
  
  // Appliquer des règles climatiques basées sur la latitude et l'altitude
  applyClimateRules(worldData, width, height);
  
  // Lisser les transitions entre les différentes zones
  smoothTransitions(worldData, width, height);
  
  return worldData;
}

// Génère le terrain en utilisant un algorithme simplifié de bruit cohérent
function generateTerrain(worldData: MapZone[][], width: number, height: number): void {
  // Paramètres pour la génération de terrain
  const numSeedPoints = Math.floor(width * height * 0.001); // 0.1% de points de départ
  const iterationsPasses = 5; // Nombre de passes pour lisser le terrain
  
  // Placer des "pics" et des "vallées" comme points de départ
  const seedPoints: Array<{x: number, y: number, altitude: number}> = [];
  
  // Créer des chaînes de montagnes et des vallées
  const numMountainRanges = Math.floor(width / 25); // Une chaîne tous les 25 tuiles
  
  for (let i = 0; i < numMountainRanges; i++) {
    // Point de départ de la chaîne de montagnes
    const startX = Math.floor(Math.random() * width);
    const startY = Math.floor(Math.random() * height);
    const length = Math.floor(Math.random() * (width / 3)) + (width / 6); // Entre 1/6 et 1/2 de la largeur
    
    // Direction de la chaîne (angle en radians)
    const angle = Math.random() * Math.PI * 2;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    
    // Créer la chaîne de montagnes
    for (let j = 0; j < length; j++) {
      const x = Math.floor(startX + dx * j) % width;
      const y = Math.floor(startY + dy * j) % height;
      
      if (x >= 0 && x < width && y >= 0 && y < height) {
        // Altitude décroissante en s'éloignant du centre de la chaîne
        const distFromCenter = Math.abs(j - length / 2) / (length / 2);
        const altitude = 80 + Math.random() * 20 - distFromCenter * 30;
        
        seedPoints.push({ x, y, altitude });
      }
    }
  }
  
  // Créer des bassins/océans
  const numOceans = Math.floor(width / 40); // Un océan tous les 40 tuiles
  
  for (let i = 0; i < numOceans; i++) {
    const centerX = Math.floor(Math.random() * width);
    const centerY = Math.floor(Math.random() * height);
    const radius = Math.floor(Math.random() * (width / 8)) + (width / 8); // Entre 1/8 et 1/4 de la largeur
    
    // Ajouter un bassin océanique
    for (let y = centerY - radius; y <= centerY + radius; y++) {
      for (let x = centerX - radius; x <= centerX + radius; x++) {
        const safeX = ((x % width) + width) % width;
        const safeY = ((y % height) + height) % height;
        
        // Distance au centre du cercle
        const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        
        if (dist <= radius) {
          // Plus profond au centre et moins profond aux bords
          const depthFactor = 1 - (dist / radius);
          const altitude = 20 - depthFactor * 20;
          
          seedPoints.push({ x: safeX, y: safeY, altitude });
        }
      }
    }
  }
  
  // Ajouter quelques points aléatoires supplémentaires
  for (let i = 0; i < numSeedPoints; i++) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    const altitude = Math.random() * 100;
    
    seedPoints.push({ x, y, altitude });
  }
  
  // Initialiser le terrain à partir des points de départ
  for (const point of seedPoints) {
    worldData[point.y][point.x].altitude = point.altitude;
  }
  
  // Propager les valeurs aux tuiles adjacentes (plusieurs passes)
  for (let pass = 0; pass < iterationsPasses; pass++) {
    const tempWorldData = JSON.parse(JSON.stringify(worldData)) as MapZone[][];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Si c'est un point de départ, ne pas modifier
        if (seedPoints.some(p => p.x === x && p.y === y)) continue;
        
        // Calculer la valeur moyenne des voisins
        let totalAltitude = 0;
        let count = 0;
        
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = ((x + dx) % width + width) % width;
            const ny = ((y + dy) % height + height) % height;
            
            totalAltitude += worldData[ny][nx].altitude;
            count++;
          }
        }
        
        const avgAltitude = totalAltitude / count;
        
        // Ajouter un peu de bruit pour éviter un terrain trop lisse
        const noise = (Math.random() - 0.5) * 5;
        
        tempWorldData[y][x].altitude = avgAltitude + noise;
        
        // S'assurer que l'altitude reste dans les limites
        tempWorldData[y][x].altitude = Math.max(0, Math.min(100, tempWorldData[y][x].altitude));
      }
    }
    
    // Copier les données temporaires dans worldData
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        worldData[y][x].altitude = tempWorldData[y][x].altitude;
      }
    }
  }
}

// Appliquer des règles climatiques réalistes basées sur la latitude
function applyClimateRules(worldData: MapZone[][], width: number, height: number): void {
  for (let y = 0; y < height; y++) {
    // Facteur de latitude (équateur au milieu, pôles aux extrémités)
    const latitudeFactor = 1 - Math.abs((y - height / 2) / (height / 2));
    
    for (let x = 0; x < width; x++) {
      const zone = worldData[y][x];
      
      // Température basée sur la latitude et l'altitude
      // Plus chaud à l'équateur, plus froid aux pôles et en haute altitude
      const baseTemp = latitudeFactor * 100; // 0-100 (équateur = 100, pôles = 0)
      const altitudeFactor = zone.altitude / 100; // 0-1
      
      // Diminution de la température avec l'altitude (~6°C par 1000m)
      // Converti ici à une échelle de 0-100
      zone.temperature = baseTemp - (altitudeFactor * 40);
      zone.temperature = Math.max(0, Math.min(100, zone.temperature));
      
      // Humidité influencée par la latitude et l'altitude
      // Les zones équatoriales sont généralement plus humides
      let baseHumidity = latitudeFactor * 60 + Math.random() * 40;
      
      // Les montagnes ont tendance à capturer l'humidité d'un côté et créer des zones arides de l'autre
      // Simulons un vent dominant d'ouest en est
      if (x > 0 && worldData[y][x-1].altitude < zone.altitude && zone.altitude > 60) {
        baseHumidity += 20; // Côté au vent (ouest) est plus humide
      } else if (x < width - 1 && worldData[y][x+1].altitude < zone.altitude && zone.altitude > 60) {
        baseHumidity -= 20; // Côté sous le vent (est) est plus sec
      }
      
      // Ajustement basé sur la distance des océans (simple)
      let isNearWater = false;
      const searchRadius = 10;
      
      for (let dy = -searchRadius; dy <= searchRadius && !isNearWater; dy++) {
        for (let dx = -searchRadius; dx <= searchRadius && !isNearWater; dx++) {
          const nx = ((x + dx) % width + width) % width;
          const ny = ((y + dy) % height + height) % height;
          
          // Si c'est de l'eau (altitude < 30)
          if (worldData[ny][nx].altitude < 30) {
            const distance = Math.sqrt(dx*dx + dy*dy);
            if (distance <= searchRadius) {
              isNearWater = true;
              baseHumidity += 20 * (1 - distance / searchRadius);
            }
          }
        }
      }
      
      zone.humidity = Math.max(0, Math.min(100, baseHumidity));
    }
  }
}

// Lisser les transitions entre les zones climatiques
function smoothTransitions(worldData: MapZone[][], width: number, height: number): void {
  const tempWorldData = JSON.parse(JSON.stringify(worldData)) as MapZone[][];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let totalHumidity = 0;
      let totalTemperature = 0;
      let count = 0;
      
      // Calculer la moyenne des voisins
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = ((x + dx) % width + width) % width;
          const ny = ((y + dy) % height + height) % height;
          
          totalHumidity += worldData[ny][nx].humidity;
          totalTemperature += worldData[ny][nx].temperature;
          count++;
        }
      }
      
      // Ajuster légèrement vers la moyenne
      const avgHumidity = totalHumidity / count;
      const avgTemperature = totalTemperature / count;
      
      tempWorldData[y][x].humidity = worldData[y][x].humidity * 0.7 + avgHumidity * 0.3;
      tempWorldData[y][x].temperature = worldData[y][x].temperature * 0.7 + avgTemperature * 0.3;
    }
  }
  
  // Copier les données lissées
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      worldData[y][x].humidity = tempWorldData[y][x].humidity;
      worldData[y][x].temperature = tempWorldData[y][x].temperature;
    }
  }
}

// Convertir les données climatiques en types de terrain
function convertWorldDataToTerrain(worldData: MapZone[][]): MapTile[][] {
  const height = worldData.length;
  const width = worldData[0].length;
  const map: MapTile[][] = [];
  
  for (let y = 0; y < height; y++) {
    const row: MapTile[] = [];
    for (let x = 0; x < width; x++) {
      const zone = worldData[y][x];
      const { altitude, humidity, temperature } = zone;
      
      // Détermine le type de terrain basé sur l'altitude, l'humidité et la température
      let tileType: TileType;
      let walkable = true;
      let description = '';
      
      // Océans et mers (altitude basse)
      if (altitude < 30) {
        tileType = TileType.Water;
        walkable = false;
        
        if (altitude < 15) {
          description = 'Eaux profondes de l\'océan';
        } else {
          description = 'Eaux peu profondes près de la côte';
        }
      }
      // Zones côtières et plages
      else if (altitude < 35) {
        tileType = TileType.Sand;
        description = 'Une plage de sable au bord de l\'eau';
      }
      // Hautes montagnes (altitude très élevée)
      else if (altitude > 85) {
        // Sommets enneigés si température basse
        if (temperature < 30) {
          tileType = TileType.Ice;
          description = 'Un sommet montagneux enneigé';
        } else {
          tileType = TileType.Mountain;
          description = 'Un sommet rocailleux';
        }
        walkable = false;
      }
      // Montagnes (altitude élevée)
      else if (altitude > 75) {
        tileType = TileType.Mountain;
        // Certaines pentes sont accessibles
        walkable = Math.random() > 0.6;
        description = 'Une zone montagneuse escarpée';
      }
      // Collines et terrain élevé
      else if (altitude > 60) {
        // Différents types selon climat
        if (humidity < 30) {
          if (temperature > 70) {
            tileType = TileType.Sand; // Désert rocheux
            description = 'Des collines arides et rocailleuses';
          } else {
            tileType = TileType.Ruins; // Terrain rocheux
            description = 'Des collines de pierres et d\'éboulis';
            walkable = true;
          }
        } else {
          tileType = TileType.Forest; // Forêt de montagne
          description = 'Une forêt d\'altitude';
        }
      }
      // Plaines et terrains moyens
      else {
        // Combinaison température/humidité
        if (humidity < 30) {
          // Zones arides
          if (temperature > 70) {
            tileType = TileType.Sand; // Désert chaud
            description = 'Un désert de sable chaud';
          } else if (temperature > 30) {
            tileType = TileType.Grass; // Savane/steppe
            description = 'Une plaine d\'herbes sèches';
          } else {
            tileType = TileType.Grass; // Toundra
            description = 'Une toundra froide';
          }
        } 
        else if (humidity < 60) {
          // Zones moyennement humides
          if (temperature > 60) {
            tileType = TileType.Grass; // Savane
            description = 'Une savane avec des herbes hautes';
          } else if (temperature > 30) {
            tileType = TileType.Grass; // Prairie
            description = 'Une prairie verdoyante';
          } else {
            tileType = TileType.Grass; // Prairie froide
            description = 'Une prairie froide';
          }
        } 
        else {
          // Zones humides
          if (temperature > 70) {
            tileType = TileType.Forest; // Forêt tropicale
            description = 'Une forêt tropicale dense';
          } else if (temperature > 40) {
            if (humidity > 80) {
              tileType = TileType.Swamp; // Marécage
              description = 'Un marécage boueux';
            } else {
              tileType = TileType.Forest; // Forêt tempérée
              description = 'Une forêt tempérée';
            }
          } else {
            tileType = TileType.Forest; // Forêt boréale/taïga
            description = 'Une forêt de conifères';
          }
        }
      }
      
      row.push({ 
        type: tileType, 
        walkable, 
        description
      });
    }
    map.push(row);
  }
  
  return map;
}

// Ajouter des chemins naturels, routes et rivières
function addPathsAndRivers(map: MapTile[][], width: number, height: number, worldData: MapZone[][]): void {
  // Ajouter des rivières qui coulent des montagnes vers la mer
  addRivers(map, width, height, worldData);
  
  // Ajouter des chemins/routes entre les zones d'intérêt
  addPaths(map, width, height);
}

// Ajouter des rivières depuis les zones montagneuses vers les océans
function addRivers(map: MapTile[][], width: number, height: number, worldData: MapZone[][]): void {
  const numRivers = Math.floor(Math.max(width, height) / 8); // Un nombre raisonnable de rivières
  
  for (let i = 0; i < numRivers; i++) {
    // Chercher un point de départ élevé (source en montagne)
    let startX = -1;
    let startY = -1;
    let maxTries = 100;
    
    while (maxTries > 0 && (startX === -1 || worldData[startY][startX].altitude < 70)) {
      startX = Math.floor(Math.random() * width);
      startY = Math.floor(Math.random() * height);
      maxTries--;
    }
    
    if (startX !== -1) {
      // Tracer la rivière en suivant la pente
      let currentX = startX;
      let currentY = startY;
      let maxSteps = width + height; // Éviter les boucles infinies
      
      while (maxSteps > 0) {
        // Marquer cette tuile comme rivière si elle n'est pas déjà de l'eau
        if (map[currentY][currentX].type !== TileType.Water) {
          map[currentY][currentX] = {
            type: TileType.Water,
            walkable: false,
            description: 'Une rivière qui coule vers l\'océan'
          };
        }
        
        // Trouver le voisin avec l'altitude la plus basse
        let minAltitude = worldData[currentY][currentX].altitude;
        let nextX = -1;
        let nextY = -1;
        
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            
            const nx = (currentX + dx + width) % width;
            const ny = (currentY + dy + height) % height;
            
            if (worldData[ny][nx].altitude < minAltitude) {
              minAltitude = worldData[ny][nx].altitude;
              nextX = nx;
              nextY = ny;
            }
          }
        }
        
        // Si on ne trouve pas de voisin plus bas, terminer
        if (nextX === -1 || nextY === -1) break;
        
        // Si on atteint l'océan, terminer
        if (map[nextY][nextX].type === TileType.Water && worldData[nextY][nextX].altitude < 30) break;
        
        currentX = nextX;
        currentY = nextY;
        maxSteps--;
      }
    }
  }
}

// Ajouter des chemins qui relient des points d'intérêt
function addPaths(map: MapTile[][], width: number, height: number): void {
  // Nombres de chemins à ajouter
  const numPaths = Math.floor(Math.max(width, height) / 10);
  
  for (let i = 0; i < numPaths; i++) {
    // Choisir deux points aléatoires sur la carte (assez espacés)
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;
    let validPoints = false;
    let attempts = 0;
    
    while (!validPoints && attempts < 50) {
      startX = Math.floor(Math.random() * width);
      startY = Math.floor(Math.random() * height);
      
      // Point d'arrivée dans une direction aléatoire, mais à bonne distance
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.floor(Math.random() * (width / 3)) + (width / 6);
      
      endX = Math.floor(startX + Math.cos(angle) * distance);
      endY = Math.floor(startY + Math.sin(angle) * distance);
      
      // S'assurer que les points sont dans les limites
      endX = Math.max(0, Math.min(width - 1, endX));
      endY = Math.max(0, Math.min(height - 1, endY));
      
      // Vérifier que les deux points sont sur terre
      if (map[startY][startX].walkable && map[endY][endX].walkable) {
        validPoints = true;
      }
      
      attempts++;
    }
    
    if (validPoints) {
      // Tracer un chemin entre ces deux points (algorithme A* simplifié)
      const path = findPath(map, startX, startY, endX, endY, width, height);
      
      // Créer le chemin
      for (const {x, y} of path) {
        // Ne pas placer de chemins sur l'eau
        if (map[y][x].type !== TileType.Water) {
          map[y][x] = {
            type: TileType.Path,
            walkable: true,
            description: 'Un chemin bien tracé'
          };
        }
      }
    }
  }
}

// Trouver un chemin entre deux points (algorithme A* simplifié)
function findPath(
  map: MapTile[][], 
  startX: number, 
  startY: number, 
  endX: number, 
  endY: number,
  width: number,
  height: number
): Array<{x: number, y: number}> {
  // Simplification : tracé d'une ligne sinueuse au lieu d'un A* complet
  const path: Array<{x: number, y: number}> = [];
  let currentX = startX;
  let currentY = startY;
  
  // Nombre de points intermédiaires pour la sinuosité
  const numIntermediatePoints = Math.floor(
    Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2) / 5
  );
  
  // Ajouter le point de départ
  path.push({ x: currentX, y: currentY });
  
  // Créer des points intermédiaires aléatoires
  for (let i = 0; i < numIntermediatePoints; i++) {
    // Progresser vers la destination avec un peu d'aléatoire
    const progressRatio = (i + 1) / (numIntermediatePoints + 1);
    const targetX = startX + (endX - startX) * progressRatio;
    const targetY = startY + (endY - startY) * progressRatio;
    
    // Ajouter de l'aléatoire
    const randomDeviation = Math.min(width, height) / 15;
    currentX = Math.floor(targetX + (Math.random() - 0.5) * randomDeviation);
    currentY = Math.floor(targetY + (Math.random() - 0.5) * randomDeviation);
    
    // S'assurer que les points sont dans les limites
    currentX = Math.max(0, Math.min(width - 1, currentX));
    currentY = Math.max(0, Math.min(height - 1, currentY));
    
    path.push({ x: currentX, y: currentY });
  }
  
  // Ajouter le point final
  path.push({ x: endX, y: endY });
  
  // Générer les points intermédiaires entre chaque segment
  const finalPath: Array<{x: number, y: number}> = [];
  
  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i];
    const p2 = path[i + 1];
    
    // Ajouter le premier point
    finalPath.push(p1);
    
    // Tracer une ligne entre p1 et p2
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    
    for (let step = 1; step < steps; step++) {
      const x = Math.round(p1.x + dx * (step / steps));
      const y = Math.round(p1.y + dy * (step / steps));
      
      finalPath.push({ x, y });
    }
  }
  
  // Ajouter le dernier point s'il n'est pas déjà inclus
  finalPath.push(path[path.length - 1]);
  
  return finalPath;
}

// Ajouter des entités et des points d'intérêt
// Remplacer la fonction addEntitiesAndPOIs qui est incomplète
function addEntitiesAndPOIs(map: MapTile[][], width: number, height: number, worldData: MapZone[][]): void {
    // Ajouter des villages/villes aux carrefours ou près des ressources
    addSettlements(map, width, height, worldData);
    
    // Ajouter des ruines et structures anciennes
    // addRuinsToMap(map, width, height, worldData);
    
    // // Ajouter des PNJ, trésors et autres entités
    // addEntitiesToMap(map, width, height);
  }

// Ajouter des villages et campements
function addSettlements(map: MapTile[][], width: number, height: number, worldData: MapZone[][]): void {
  const numSettlements = Math.floor(Math.max(width, height) / 15);
  const settlements: Array<{x: number, y: number}> = [];
  
  // Trouver les emplacements appropriés pour les établissements
  for (let i = 0; i < numSettlements; i++) {
    // Chercher un emplacement favorable (près de l'eau, sur terrain plat)
    let bestX = -1;
    let bestY = -1;
    let bestScore = -1;
    
    // Essayer plusieurs positions
    for (let attempt = 0; attempt < 20; attempt++) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      
      if (!map[y][x].walkable) continue;
      
      // Calculer un score pour cet emplacement
      let score = 0;
      
      // Préférence pour les terrains plats
      if (map[y][x].type === TileType.Grass || map[y][x].type === TileType.Path) {
        score += 10;
      }
      
      // Vérifier la proximité d'eau
      let hasWaterNearby = false;
      let pathCount = 0;
      
      for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
          const nx = (x + dx + width) % width;
          const ny = (y + dy + height) % height;
          
          if (map[ny][nx].type === TileType.Water) {
            hasWaterNearby = true;
            // Plus proche est l'eau, mieux c'est
            const distance = Math.sqrt(dx*dx + dy*dy);
            score += 5 * (1 - distance / 3);
          }
          
          if (map[ny][nx].type === TileType.Path) {
            pathCount++;
          }
        }
      }
// Fin du code pour la fonction addSettlements

      // Bonus pour la proximité des chemins
      if (pathCount > 0) {
        score += pathCount * 2;
      }
      
      // Bonus pour la proximité de l'eau
      if (hasWaterNearby) {
        score += 15;
      }
      
      // Éviter les endroits trop proches d'autres établissements
      let tooClose = false;
      for (const settlement of settlements) {
        const distance = Math.sqrt((x - settlement.x) ** 2 + (y - settlement.y) ** 2);
        if (distance < width / 10) {
          tooClose = true;
          break;
        }
      }
      
      if (tooClose) {
        continue;
      }
      
      // Mettre à jour le meilleur emplacement
      if (score > bestScore) {
        bestScore = score;
        bestX = x;
        bestY = y;
      }
    }
    
    // Si on a trouvé un bon emplacement, l'ajouter
    if (bestX !== -1 && bestY !== -1) {
      settlements.push({ x: bestX, y: bestY });
      
      // Créer l'établissement
      map[bestY][bestX] = {
        type: TileType.Path,
        walkable: true,
        description: 'Un petit village',
        entity: {
          type: EntityType.NPC,
          name: 'Villageois',
          interaction: 'Bienvenue dans notre village, voyageur !'
        }
      };
      
      // Ajouter quelques maisons autour
      for (let i = 0; i < 3; i++) {
        const dx = Math.floor(Math.random() * 3) - 1;
        const dy = Math.floor(Math.random() * 3) - 1;
        
        if (dx === 0 && dy === 0) continue;
        
        const nx = (bestX + dx + width) % width;
        const ny = (bestY + dy + height) % height;
        
        if (map[ny][nx].walkable) {
          map[ny][nx] = {
            type: TileType.Path,
            walkable: true,
            description: 'Une petite maison'
          };
        }
      }
    }
  }
}
