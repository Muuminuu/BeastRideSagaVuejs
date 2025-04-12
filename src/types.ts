export enum TileType {
  Grass = 'grass',
  Water = 'water',
  Sand = 'sand',
  Forest = 'forest',
  Mountain = 'mountain',
  Wall = 'wall',
  Path = 'path',
  Swamp = 'swamp',
  Cave = 'cave',
  Lava = 'lava',
  Ice = 'ice',
  Ruins = 'ruins'
}

export enum EntityType {
  None = 'none',
  Player = 'player',
  NPC = 'npc',
  Enemy = 'enemy',
  Treasure = 'treasure',
  Item = 'item',
  Portal = 'portal'
}

export interface MapTile {
  type: TileType;
  walkable: boolean;
  description?: string;
  entity?: {
    type: EntityType;
    id?: string;
    name?: string;
    interaction?: string;
  };
  attributes?: {
    // Attributs spéciaux pour différents types de tuiles
    danger?: number; // Niveau de danger (0-10)
    treasure?: number; // Valeur du trésor (0-10)
    hidden?: boolean; // Éléments cachés
    needsKey?: string; // ID d'une clé nécessaire pour accéder
  };
}

export interface Position {
  x: number;
  y: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Player {
  position: Position;
  health: number;
  inventory: Item[];
  experience: number;
  level: number;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'armor' | 'potion' | 'key' | 'treasure';
  value: number;
  effect?: string;
}

export interface GameState {
  player: Player;
  map: MapTile[][];
  visibleMap: boolean[][]; // Pour le brouillard de guerre
  discoveredItems: string[];
  completedQuests: string[];
  gameTime: number; // Temps de jeu en secondes
}