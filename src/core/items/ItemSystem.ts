// src/core/items/ItemSystem.ts
export enum ItemType {
    Consumable = 'consumable',
    Material = 'material',
    Equipment = 'equipment',
    Key = 'key'
  }
  
  export interface Item {
    id: string;
    name: string;
    type: ItemType;
    description: string;
    value: number;
    effects?: Record<string, number>;
  }
  
  export class HarvestSystem {
    getHarvestableItems(biomeType: BiomeType, season: Season): Item[] {
      // Retourne les items récoltables basés sur le biome et la saison
      const harvestables: Item[] = [];
      
      switch (biomeType) {
        case BiomeType.Forest:
          if (season === Season.Spring) {
            harvestables.push({
              id: 'forest_mushroom_spring',
              name: 'Champignon Luisant',
              type: ItemType.Material,
              description: 'Un champignon qui émet une légère lueur bleue.',
              value: 5
            });
            // Plus d'items...
          } else if (season === Season.Summer) {
            // Items d'été...
          }
          // Autres saisons...
          break;
        // Autres biomes...
      }
      
      return harvestables;
    }
  }