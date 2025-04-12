import { defineStore } from 'pinia';
import type { MapTile, Position, Direction, GameState, Player, Item } from '@/types';
import { generateMap } from '@/utils/mapGenerator';
import { EntityType, TileType } from '@/types';

export const useGameStore = defineStore('game', {
  state: () => ({
    // État du jeu
    mapSize: { width: 40, height: 30 },
    mapData: [] as MapTile[][],
    playerPosition: { x: 0, y: 0 } as Position,
    player: {
      health: 100,
      inventory: [],
      experience: 0,
      level: 1,
      position: { x: 0, y: 0 }  // Ajout de la position manquante
    } as Player,
    messages: [] as string[],
    visibleMap: [] as boolean[][],
    gameInitialized: false,
    turnCount: 0
  }),
  
  getters: {
    currentTile(): MapTile {
      const { x, y } = this.playerPosition;
      if (this.mapData && this.mapData[y] && this.mapData[y][x]) {
        return this.mapData[y][x];
      }
      // Return a default tile if position is invalid
      return { type: TileType.Grass, walkable: true, description: 'Une zone vide' };
    },
    
    playerHealth(): number {
      return this.player.health;
    },
    
    playerLevel(): number {
      return this.player.level;
    },
    
    playerInventory(): Item[] {
      return this.player.inventory;
    },
    
    latestMessage(): string | null {
      return this.messages.length > 0 ? this.messages[this.messages.length - 1] : null;
    }
  },
  
  actions: {
    initializeGame() {
      // Générer la carte
      this.mapData = generateMap(this.mapSize.width, this.mapSize.height);
      
      // Initialiser la position du joueur (trouver un endroit marchable)
      this.findStartingPosition();
      
      // Initialiser le brouillard de guerre
      this.initializeVisibility();
      
      // Initialiser le joueur
      this.player.position = this.playerPosition;
      
      // Ajouter un message initial
      this.addMessage('Vous commencez votre aventure dans Beast Ride Saga !');
      
      this.gameInitialized = true;
    },
    
    findStartingPosition() {
      // Trouver une position de départ valide (un chemin)
      const midX = Math.floor(this.mapSize.width / 2);
      const midY = Math.floor(this.mapSize.height / 2);
      
      // Commencer par chercher au milieu
      let found = false;
      let radius = 0;
      
      while (!found && radius < Math.max(this.mapSize.width, this.mapSize.height)) {
        // Chercher dans un cercle de plus en plus grand
        for (let y = midY - radius; y <= midY + radius; y++) {
          for (let x = midX - radius; x <= midX + radius; x++) {
            // Vérifier seulement les points qui sont exactement à la distance 'radius'
            if (Math.abs(x - midX) + Math.abs(y - midY) === radius) {
              if (y >= 0 && y < this.mapSize.height && x >= 0 && x < this.mapSize.width) {
                if (this.mapData[y][x].walkable) {
                  this.playerPosition = { x, y };
                  found = true;
                  break;
                }
              }
            }
          }
          if (found) break;
        }
        radius++;
      }
    },
    
    initializeVisibility() {
      // Initialiser la matrice de visibilité (tout est invisible au début)
      this.visibleMap = [];
      for (let y = 0; y < this.mapSize.height; y++) {
        const row: boolean[] = [];
        for (let x = 0; x < this.mapSize.width; x++) {
          row.push(false);
        }
        this.visibleMap.push(row);
      }
      
      // Rendre visible la zone autour du joueur
      this.updateVisibility();
    },
    
    updateVisibility() {
      // Rayon de vision du joueur
      const visionRadius = 4;
      const { x: playerX, y: playerY } = this.playerPosition;
      
      for (let y = Math.max(0, playerY - visionRadius); y <= Math.min(this.mapSize.height - 1, playerY + visionRadius); y++) {
        for (let x = Math.max(0, playerX - visionRadius); x <= Math.min(this.mapSize.width - 1, playerX + visionRadius); x++) {
          // Distance de Manhattan
          const distance = Math.abs(x - playerX) + Math.abs(y - playerY);
          if (distance <= visionRadius) {
            this.visibleMap[y][x] = true;
          }
        }
      }
    },
    
    movePlayer(direction: Direction) {
      if (!this.gameInitialized) return;
      
      const newPos = { ...this.playerPosition };
      
      switch (direction) {
        case 'up':
          newPos.y = Math.max(0, newPos.y - 1);
          break;
        case 'down':
          newPos.y = Math.min(this.mapSize.height - 1, newPos.y + 1);
          break;
        case 'left':
          newPos.x = Math.max(0, newPos.x - 1);
          break;
        case 'right':
          newPos.x = Math.min(this.mapSize.width - 1, newPos.x + 1);
          break;
      }
      
      // Vérifier si la nouvelle position est accessible
      if (this.mapData[newPos.y][newPos.x].walkable) {
        // Mettre à jour la position
        this.playerPosition = newPos;
        
        // Mettre à jour la visibilité
        this.updateVisibility();
        
        // Vérifier les événements de la tuile
        this.checkTileEvents();
        
        // Incrémenter le compteur de tours
        this.turnCount++;
      } else {
        this.addMessage(`Vous ne pouvez pas aller par là.`);
      }
    },
    
    checkTileEvents() {
      const currentTile = this.currentTile;
      
      // Vérifier s'il y a une entité sur cette tuile
      if (currentTile.entity) {
        switch (currentTile.entity.type) {
          case EntityType.Treasure:
            this.addMessage(`Vous avez trouvé un trésor : ${currentTile.entity.name || 'Trésor'}`);
            // Ajouter au inventaire...
            // Supprimer l'entité de la tuile
            delete this.mapData[this.playerPosition.y][this.playerPosition.x].entity;
            break;
            
          case EntityType.NPC:
            this.addMessage(`${currentTile.entity.name || 'Quelqu\'un'} vous dit : "${currentTile.entity.interaction || 'Bonjour !'}"`);
            break;
            
          case EntityType.Portal:
            this.addMessage(`Vous avez trouvé un portail mystérieux.`);
            // Logique de téléportation serait ici...
            break;
        }
      }
      
      // Vérifier les attributs spéciaux de la tuile
      if (currentTile.attributes) {
        if (currentTile.attributes.danger && currentTile.attributes.danger > 0) {
          const damage = currentTile.attributes.danger * 5;
          this.player.health -= damage;
          this.addMessage(`Vous prenez ${damage} points de dégâts en traversant cette zone dangereuse !`);
        }
        
        if (currentTile.attributes.treasure && currentTile.attributes.treasure > 0) {
          const experience = currentTile.attributes.treasure * 10;
          this.player.experience += experience;
          this.addMessage(`Vous gagnez ${experience} points d'expérience en découvrant cette zone !`);
          
          // Supprimer le trésor après l'avoir récupéré
          delete this.mapData[this.playerPosition.y][this.playerPosition.x].attributes?.treasure;
        }
      }
      
      // Mettre à jour le niveau du joueur si nécessaire
      this.checkLevelUp();
    },
    
    checkLevelUp() {
      const experienceRequired = this.player.level * 100;
      if (this.player.experience >= experienceRequired) {
        this.player.level++;
        this.player.experience -= experienceRequired;
        this.player.health = 100; // Restaurer la santé lors du niveau supérieur
        this.addMessage(`Félicitations ! Vous avez atteint le niveau ${this.player.level} !`);
      }
    },
    
    addMessage(message: string) {
      this.messages.push(message);
      // Garder seulement les 5 derniers messages
      if (this.messages.length > 5) {
        this.messages.shift();
      }
    }
  }
});