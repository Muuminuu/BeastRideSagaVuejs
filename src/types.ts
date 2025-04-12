export enum TileType {
  Grass = 'grass',
  Water = 'water',
  Sand = 'sand',
  Forest = 'forest',
  Mountain = 'mountain',
  Wall = 'wall',
  Path = 'path'
}

export interface MapTile {
  type: TileType;
  walkable: boolean;
  description?: string;
}

export interface Position {
  x: number;
  y: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';