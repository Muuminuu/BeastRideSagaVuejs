// src/core/types/ElementalTypes.ts
export enum ElementType {
    Normal = 'normal',
    Fire = 'fire',
    Water = 'water',
    Earth = 'earth',
    Air = 'air',
    Light = 'light',
    Dark = 'dark'
  }
  
  export enum AnimalClass {
    Mammal = 'mammal',
    Reptile = 'reptile',
    Bird = 'bird',
    Insect = 'insect',
    Amphibian = 'amphibian',
    Fish = 'fish',
    Mythical = 'mythical'
  }
  
  // Table des efficacités (multiplieur de dégâts)
  export const TypeEffectiveness: Record<ElementType, Record<ElementType, number>> = {
    [ElementType.Normal]: {
      [ElementType.Normal]: 1.0,
      [ElementType.Fire]: 1.0,
      // ... etc pour tous les types
    },
    [ElementType.Fire]: {
      [ElementType.Normal]: 1.0,
      [ElementType.Fire]: 0.5,
      [ElementType.Water]: 0.5,
      [ElementType.Earth]: 2.0,
      // ... etc
    },
    // ... définir pour tous les types
  }