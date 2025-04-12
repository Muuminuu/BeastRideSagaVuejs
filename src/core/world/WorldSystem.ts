// src/core/world/WorldSystem.ts
export enum BiomeType {
    Forest = 'forest',
    Plains = 'plains',
    Mountains = 'mountains',
    Swamp = 'swamp',
    Desert = 'desert',
    Tundra = 'tundra',
    Beach = 'beach'
  }
  
  export enum GameTime {
    Morning = 'morning',
    Afternoon = 'afternoon',
    Evening = 'evening',
    Night = 'night'
  }
  
  export enum Season {
    Spring = 'spring',
    Summer = 'summer',
    Fall = 'fall',
    Winter = 'winter'
  }
  
  export interface WorldTile {
    x: number;
    y: number;
    biomeType: BiomeType;
    explored: boolean;
    hasPointOfInterest: boolean;
    pointOfInterestId?: string;
    // Plus de propriétés...
  }
  
  export class WorldGenerator {
    // Méthodes pour générer le monde, les régions, etc.
  }
  
  export class TimeSystem {
    private currentTime: GameTime;
    private currentSeason: Season;
    private dayCount: number;
    
    constructor() {
      this.currentTime = GameTime.Morning;
      this.currentSeason = Season.Spring;
      this.dayCount = 1;
    }
    
    advanceTime(): GameTime {
      // Logique pour faire avancer le temps
      const times = Object.values(GameTime);
      const currentIndex = times.indexOf(this.currentTime);
      this.currentTime = times[(currentIndex + 1) % times.length];
      
      // Si on revient au matin, on change de jour
      if (this.currentTime === GameTime.Morning) {
        this.dayCount++;
        
        // Changement de saison tous les 30 jours
        if (this.dayCount % 30 === 0) {
          const seasons = Object.values(Season);
          const currentSeasonIndex = seasons.indexOf(this.currentSeason);
          this.currentSeason = seasons[(currentSeasonIndex + 1) % seasons.length];
        } 
      }
      
      return this.currentTime;
    }
    
    // Getters et autres méthodes...
  }