import { MapTile, TileType } from '../types';

export function generateMap(width: number, height: number): MapTile[][] {
  const map: MapTile[][] = [];

  // Générer une carte basique avec différents types de terrain
  for (let y = 0; y < height; y++) {
    const row: MapTile[] = [];
    for (let x = 0; x < width; x++) {
      // Définir les bords comme des murs
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
        row.push({ 
          type: TileType.Wall, 
          walkable: false,
          description: 'Un mur infranchissable' 
        });
        continue;
      }

      // Générer un nombre aléatoire pour déterminer le type de terrain
      const rand = Math.random();
      let tileType: TileType;
      let walkable: boolean = true;
      let description: string = '';

      if (rand < 0.55) {
        tileType = TileType.Grass;
        description = 'Une zone d\'herbe luxuriante';
      } else if (rand < 0.65) {
        tileType = TileType.Forest;
        description = 'Une zone forestière dense';
      } else if (rand < 0.75) {
        tileType = TileType.Sand;
        description = 'Une zone sablonneuse';
      } else if (rand < 0.85) {
        tileType = TileType.Water;
        walkable = false;
        description = 'Un plan d\'eau infranchissable';
      } else if (rand < 0.90) {
        tileType = TileType.Mountain;
        walkable = false;
        description = 'Une montagne infranchissable';
      } else if (rand < 0.95) {
        tileType = TileType.Path;
        description = 'Un chemin bien défini';
      } else {
        tileType = TileType.Wall;
        walkable = false;
        description = 'Un mur de pierre';
      }

      row.push({ type: tileType, walkable, description });
    }
    map.push(row);
  }

  // Créer un chemin au milieu de la carte (garantir un espace de mouvement)
  const midY = Math.floor(height / 2);
  for (let x = 1; x < width - 1; x++) {
    map[midY][x] = { 
      type: TileType.Path, 
      walkable: true,
      description: 'Un sentier principal traversant la carte'
    };
  }

  // Ajouter quelques éléments verticaux au chemin
  const midX = Math.floor(width / 2);
  for (let y = 1; y < height - 1; y++) {
    map[y][midX] = { 
      type: TileType.Path, 
      walkable: true,
      description: 'Un sentier principal traversant la carte'
    };
  }

  return map;
}

// Vous pourriez également ajouter :
// - Fichier: store.ts (pour utiliser Vuex/Pinia)
// - Fichier: assets/sprites pour les sprites
// - Système d'événements sur les cases
// - Système de combat
// - Inventaire
// - Quêtes