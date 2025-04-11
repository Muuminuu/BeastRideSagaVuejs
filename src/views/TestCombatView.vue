<template>
    <div>
      <h1>Test Combat</h1>
      <button @click="startCombat">Commencer un combat</button>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue';
  import { useRouter } from 'vue-router';
  import { Hero } from '@/core/entities/Hero';
  import { Enemy } from '@/core/entities/Enemy';
  import { AnimalSpirit } from '@/core/entities/AnimalSpirit';
  import { AnimalType, EnemyType } from '@/core/types/Enums';
  import { Ability } from '@/core/types/Ability';
  
  export default defineComponent({
    name: 'TestCombatView',
    setup() {
      const router = useRouter();
  
      // Fonction pour créer les données de test
      const startCombat = () => {
        // Créer les données de combat et les stocker dans un store ou localStorage
        // pour y accéder dans la CombatView
        
        // Pour cet exemple, nous utiliserons localStorage, mais dans une application
        // réelle, vous voudriez probablement utiliser Pinia
        
        // Créer un héros
        const hero = new Hero('hero1', 'Héros', {
          maxHealth: 100,
          currentHealth: 100,
          attack: 15,
          defense: 10,
          speed: 10,
          intelligence: 12
        });
        
        // Créer un esprit animal
        const spirit = new AnimalSpirit('spirit1', 'Cobra', AnimalType.Reptile, {
          maxHealth: 80,
          currentHealth: 80,
          attack: 20,
          defense: 8,
          speed: 15,
          intelligence: 7
        });
        
        // Ajouter des capacités à l'esprit
        spirit.abilities.push({
          id: 'ability1',
          name: 'Morsure Venimeuse',
          description: 'Une morsure qui injecte du venin',
          damageType: 'poison',
          power: 25,
          cooldown: 2,
          currentCooldown: 0,
          targetType: 'singleEnemy'
        });
        
        // Lier l'esprit au héros
        hero.bondWithSpirit(spirit);
        
        // Créer un ennemi
        const enemy = new Enemy('enemy1', 'Loup Sauvage', EnemyType.Beast, {
          maxHealth: 60,
          currentHealth: 60,
          attack: 12,
          defense: 5,
          speed: 12,
          intelligence: 5
        });
        
        // Ajouter des capacités à l'ennemi
        enemy.abilities.push({
          id: 'enemy_ability1',
          name: 'Morsure Puissante',
          description: 'Une morsure qui fait mal',
          damageType: 'physical',
          power: 15,
          cooldown: 1,
          currentCooldown: 0,
          targetType: 'singleEnemy'
        });
        
        // Stocker les données (en réalité, utilisez un store comme Pinia)
        localStorage.setItem('combatPlayer', JSON.stringify(hero));
        localStorage.setItem('combatEnemies', JSON.stringify([enemy]));
        
        // Naviguer vers la page de combat
        router.push({
          name: 'combat',
          params: {
            // Vous pouvez passer des paramètres dans l'URL si nécessaire
          },
          // Pour les données volumineuses, mieux vaut utiliser un store
          // plutôt que de les passer en query parameters
        });
      };
  
      return {
        startCombat
      };
    }
  });
  </script>