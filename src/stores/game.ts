import { defineStore } from 'pinia';
import type { MapTile, Position, Direction, GameState, Player, Item } from '@/types';
import { generateMap } from '@/utils/mapGenerator';
import { EntityType, TileType } from '@/types';

export const useGameStore = defineStore('game', {
  state: () => ({
    // État du jeu
    mapSize: { width: 100, height: 80 }, // Carte beaucoup plus grande
    mapData: [] as MapTile[][],
    playerPosition: { x: 0, y: 0 } as Position,
    player: {
      health: 100,
      inventory: [],
      experience: 0,
      level: 1,
      position: { x: 0, y: 0 }
    } as Player,
    messages: [] as string[],
    visibleMap: [] as boolean[][],
    discoveredAreas: [] as boolean[][], // Zones déjà découvertes
    gameInitialized: false,
    turnCount: 0,
    viewDistance: 5, // Distance de vision du joueur
    isLoadingMap: false // Pour indiquer le chargement de la carte
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
    },
    
    canMove(): boolean {
      return !this.isLoadingMap && this.gameInitialized;
    }
  },
  
  actions: {
    async initializeGame() {
      this.isLoadingMap = true;
      this.addMessage('Génération du monde en cours...');
      
      // Utiliser setTimeout pour permettre à l'interface de se mettre à jour
      setTimeout(() => {
        try {
          // Générer la carte
          this.mapData = generateMap(this.mapSize.width, this.mapSize.height);
          
          // Initialiser la position du joueur (trouver un endroit marchable)
          this.findStartingPosition();
          
          // Initialiser les zones visibles et découvertes
          this.initializeVisibility();
          
          // Initialiser le joueur
          this.player.position = this.playerPosition;
          
          // Ajouter un message initial
          this.addMessage('Bienvenue dans Beast Ride Saga !');
          this.addMessage(`Vous commencez votre aventure dans ${this.currentTile.description.toLowerCase()}.`);
          
          this.gameInitialized = true;
          this.isLoadingMap = false;
        } catch (error) {
          console.error('Erreur lors de l\'initialisation du jeu:', error);
          this.addMessage('Erreur lors de la génération du monde. Veuillez réessayer.');
          this.isLoadingMap = false;
        }
      }, 100);
    },
    
    findStartingPosition() {
      // Chercher un bon point de départ (près d'un chemin idéalement)
      let bestX = -1;
      let bestY = -1;
      let bestScore = -1;
      
      // D'abord, essayer de trouver un chemin ou une zone d'habitation
      for (let attempts = 0; attempts < 100; attempts++) {
        const x = Math.floor(Math.random() * this.mapSize.width);
        const y = Math.floor(Math.random() * this.mapSize.height);
        
        if (!this.mapData[y][x].walkable) continue;
        
        let score = 0;
        
        // Préférer un chemin ou une zone habitée
        if (this.mapData[y][x].type === TileType.Path) {
          score += 10;
        }
        
        // Vérifier s'il y a des PNJ à proximité
        let hasNearbyNPC = false;
        for (let dy = -3; dy <= 3 && !hasNearbyNPC; dy++) {
          for (let dx = -3; dx <= 3 && !hasNearbyNPC; dx++) {
            const nx = (x + dx + this.mapSize.width) % this.mapSize.width;
            const ny = (y + dy + this.mapSize.height) % this.mapSize.height;
            
            if (this.mapData[ny][nx].entity?.type === EntityType.NPC) {
              hasNearbyNPC = true;
              score += 5;
            }
          }
        }
        
        // Bonus pour les zones de départ intéressantes (plaines, forêts légères)
        if (this.mapData[y][x].type === TileType.Grass) {
          score += 3;
        }
        
        // Éviter de démarrer dans des zones difficiles
        if (this.mapData[y][x].type === TileType.Mountain || 
            this.mapData[y][x].type === TileType.Water ||
            this.mapData[y][x].type === TileType.Swamp) {
          score -= 10;
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestX = x;
          bestY = y;
        }
      }
      
      // Si on a trouvé un bon point de départ, l'utiliser
      if (bestX !== -1) {
        this.playerPosition = { x: bestX, y: bestY };
      } else {
        // Sinon, chercher n'importe quelle zone marchable
        let found = false;
        
        for (let y = 0; y < this.mapSize.height && !found; y++) {
          for (let x = 0; x < this.mapSize.width && !found; x++) {
            if (this.mapData[y][x].walkable) {
              this.playerPosition = { x, y };
              found = true;
            }
          }
        }
        
        // Si toujours pas trouvé (improbable), mettre au centre
        if (!found) {
          this.playerPosition = {
            x: Math.floor(this.mapSize.width / 2),
            y: Math.floor(this.mapSize.height / 2)
          };
        }
      }
    },
    
    initializeVisibility() {
      // Initialiser les matrices de visibilité et de découverte
      this.visibleMap = [];
      this.discoveredAreas = [];
      
      for (let y = 0; y < this.mapSize.height; y++) {
        const visibleRow: boolean[] = [];
        const discoveredRow: boolean[] = [];
        
        for (let x = 0; x < this.mapSize.width; x++) {
          visibleRow.push(false);
          discoveredRow.push(false);
        }
        
        this.visibleMap.push(visibleRow);
        this.discoveredAreas.push(discoveredRow);
      }
      
      // Rendre visible la zone autour du joueur
      this.updateVisibility();
    },
    
    updateVisibility() {
      const { x: playerX, y: playerY } = this.playerPosition;
      
      // Mettre à jour la visibilité actuelle
      for (let y = 0; y < this.mapSize.height; y++) {
        for (let x = 0; x < this.mapSize.width; x++) {
          // Distance de Manhattan
          const distance = Math.abs(x - playerX) + Math.abs(y - playerY);
          
          // Mettre à jour la visibilité actuelle
          this.visibleMap[y][x] = distance <= this.viewDistance;
          
          // Si la tuile est visible, la marquer comme découverte
          if (this.visibleMap[y][x]) {
            this.discoveredAreas[y][x] = true;
          }
        }
      }
    },
    
    movePlayer(direction: Direction) {
      if (!this.canMove) return;
      
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
        this.player.position = newPos;
        
        // Mettre à jour la visibilité
        this.updateVisibility();
        
        // Vérifier les événements de la tuile
        this.checkTileEvents();
        
        // Incrémenter le compteur de tours
        this.turnCount++;
      } else {
        this.addMessage(`Vous ne pouvez pas aller par là. ${this.mapData[newPos.y][newPos.x].description}`);
      }
    },
    
    checkTileEvents() {
      const currentTile = this.currentTile;
      
      // Décrire le nouvel environnement (seulement si c'est la première visite)
      if (!this.discoveredAreas[this.playerPosition.y][this.playerPosition.x]) {
        this.addMessage(`Vous découvrez : ${currentTile.description}`);
      }
      
      // Vérifier s'il y a une entité sur cette tuile
      if (currentTile.entity) {
        switch (currentTile.entity.type) {
          case EntityType.Treasure:
            this.addMessage(`Vous avez trouvé un trésor : ${currentTile.entity.name || 'Trésor'}`);
            
            // Ajouter l'expérience si le trésor a une valeur
            if (currentTile.attributes?.treasure) {
              const expGain = currentTile.attributes.treasure * 10;
              this.player.experience += expGain;
              this.addMessage(`Vous gagnez ${expGain} points d'expérience.`);
            }
            
            // Ajouter au inventaire (simulation)
            const treasureItem: Item = {
              id: currentTile.entity.id || `treasure-${Date.now()}`,
              name: currentTile.entity.name || 'Trésor mystérieux',
              description: 'Un objet de valeur trouvé dans votre aventure',
              type: 'treasure',
              value: currentTile.attributes?.treasure || 1
            };
            
            this.player.inventory.push(treasureItem);
            
            // Supprimer l'entité de la tuile
            delete this.mapData[this.playerPosition.y][this.playerPosition.x].entity;
            
            // Supprimer l'attribut trésor
            if (this.mapData[this.playerPosition.y][this.playerPosition.x].attributes) {
              delete this.mapData[this.playerPosition.y][this.playerPosition.x].attributes.treasure;
            }
            break;
            
          case EntityType.NPC:
            this.addMessage(`${currentTile.entity.name || 'Quelqu\'un'} vous dit : "${currentTile.entity.interaction || 'Bonjour !'}"`);
            break;
            
          case EntityType.Item:
            this.addMessage(`Vous trouvez : ${currentTile.entity.name || 'Un objet'}`);
            
            // Ajouter à l'inventaire
            const newItem: Item = {
              id: currentTile.entity.id || `item-${Date.now()}`,
              name: currentTile.entity.name || 'Objet inconnu',
              description: currentTile.entity.interaction || 'Un objet utile',
              type: 'potion', // Par défaut
              value: 1
            };
            
            this.player.inventory.push(newItem);
            
            // Supprimer l'entité de la tuile
            delete this.mapData[this.playerPosition.y][this.playerPosition.x].entity;
            break;
            
          case EntityType.Portal:
            this.addMessage(`Vous avez trouvé un portail mystérieux : ${currentTile.entity.name || 'Portail'}`);
            this.addMessage(currentTile.entity.interaction || 'Ce portail semble mener vers un autre endroit...');
            
            // Logique de téléportation pourrait être ajoutée ici
            // Pour l'instant, nous laissons le portail intact pour permettre plusieurs utilisations
            break;
        }
      }
      
      // Vérifier les attributs spéciaux de la tuile
      if (currentTile.attributes) {
        if (currentTile.attributes.danger && currentTile.attributes.danger > 0) {
          const damage = currentTile.attributes.danger * 5;
          this.player.health -= damage;
          this.addMessage(`Vous prenez ${damage} points de dégâts en traversant cette zone dangereuse !`);
          
          // Vérifier si le joueur est mort
          if (this.player.health <= 0) {
            this.player.health = 0;
            this.addMessage('Vous avez succombé à vos blessures. Votre aventure s'arrête ici.');
            // Logique de game over à implémenter
          }
        }
        
        if (currentTile.attributes.treasure && currentTile.attributes.treasure > 0 && !currentTile.entity) {
          const experience = currentTile.attributes.treasure * 10;
          this.player.experience += experience;
          this.addMessage(`Vous gagnez ${experience} points d'expérience en découvrant cette zone !`);
          
          // Supprimer le trésor après l'avoir récupéré
          delete this.mapData[this.playerPosition.y][this.playerPosition.x].attributes.treasure;
        }
      }
      
      // Effets spécifiques au type de terrain
      switch (currentTile.type) {
        case TileType.Swamp:
          // Ralentissement dans les marécages
          if (Math.random() < 0.3) {
            this.addMessage('Le sol marécageux ralentit vos mouvements.');
          }
          break;
          
        case TileType.Lava:
          // Dégâts de la lave si pas déjà traités par les attributs de danger
          if (!currentTile.attributes?.danger) {
            const damage = 10;
            this.player.health -= damage;
            this.addMessage(`La chaleur intense de la lave vous brûle pour ${damage} points de dégâts !`);
          }
          break;
          
        case TileType.Ice:
          // Chance de glisser sur la glace
          if (Math.random() < 0.2) {
            this.addMessage('Vous glissez sur la surface glacée mais réussissez à garder l'équilibre.');
          }
          break;
          
        case TileType.Ruins:
          // Chance de trouver quelque chose dans les ruines
          if (Math.random() < 0.1 && !currentTile.entity && !currentTile.attributes?.treasure) {
            this.addMessage('En fouillant les ruines, vous trouvez quelque chose d\'intéressant !');
            
            // Ajouter un petit trésor
            this.mapData[this.playerPosition.y][this.playerPosition.x].entity = {
              type: EntityType.Treasure,
              id: `treasure-ruin-${Date.now()}`,
              name: 'Relique ancienne'
            };
            
            this.mapData[this.playerPosition.y][this.playerPosition.x].attributes = {
              ...this.mapData[this.playerPosition.y][this.playerPosition.x].attributes,
              treasure: Math.floor(Math.random() * 3) + 1 // Valeur 1-3
            };
          }
          break;
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
        this.viewDistance += 1; // Augmenter la distance de vision
        this.addMessage(`Félicitations ! Vous avez atteint le niveau ${this.player.level} !`);
        this.addMessage('Votre santé est restaurée et votre vision s\'améliore.');
      }
    },
    
    addMessage(message: string) {
      this.messages.push(message);
      // Garder seulement les 10 derniers messages
      if (this.messages.length > 10) {
        this.messages.shift();
      }
    },
    
    // Fonctions utilitaires supplémentaires
    getDiscoveredPercentage(): number {
      let totalTiles = this.mapSize.width * this.mapSize.height;
      let discoveredTiles = 0;
      
      for (let y = 0; y < this.mapSize.height; y++) {
        for (let x = 0; x < this.mapSize.width; x++) {
          if (this.discoveredAreas[y][x]) {
            discoveredTiles++;
          }
        }
      }
      
      return Math.round((discoveredTiles / totalTiles) * 100);
    },
    
    getTileAt(x: number, y: number): MapTile | null {
      if (x >= 0 && x < this.mapSize.width && y >= 0 && y < this.mapSize.height) {
        return this.mapData[y][x];
      }
      return null;
    },
    
    isTileVisible(x: number, y: number): boolean {
      if (x >= 0 && x < this.mapSize.width && y >= 0 && y < this.mapSize.height) {
        return this.visibleMap[y][x];
      }
      return false;
    },
    
    isTileDiscovered(x: number, y: number): boolean {
      if (x >= 0 && x < this.mapSize.width && y >= 0 && y < this.mapSize.height) {
        return this.discoveredAreas[y][x];
      }
      return false;
    }
  }
});