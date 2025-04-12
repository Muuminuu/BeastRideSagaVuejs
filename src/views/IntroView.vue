<template>
    <div class="intro-container">
      <div v-if="step === 1" class="intro-story">
        <h1>Beast Ride Saga</h1>
        <div class="story-text">
          <p>Vous vous réveillez dans votre chambre, l'esprit embrumé après une autre nuit de sommeil agité. La vie n'a pas été tendre avec vous ces derniers temps.</p>
          <p>Regardant vers le ciel à travers votre fenêtre, vous laissez échapper des paroles amères...</p>
          <p>"Pourquoi m'as-tu abandonné ? Si tu existes vraiment, montre-toi !"</p>
        </div>
        <button @click="nextStep" class="action-button">Continuer</button>
      </div>
  
      <div v-else-if="step === 2" class="intro-story">
        <div class="story-text">
          <p>Un éclair illumine soudain la pièce. Une silhouette lumineuse apparaît devant vous.</p>
          <p><em>"Tu me trouves gonflé ? Toi, simple mortel, qui ose me défier ?"</em></p>
          <p>La voix résonne dans votre tête, à la fois furieuse et amusée.</p>
          <p><em>"Tu ignores tout des combats invisibles qui sont mon quotidien. Laisse-moi te montrer..."</em></p>
        </div>
        <button @click="nextStep" class="action-button">Continuer</button>
      </div>
  
      <div v-else-if="step === 3" class="intro-story">
        <div class="story-text">
          <p>L'entité divine pose sa main sur votre front. Une chaleur vous envahit.</p>
          <p><em>"Je te donne un pouvoir rare : celui de fusionner avec les âmes des créatures. Je t'envoie dans une dimension où tu devras te battre pour comprendre."</em></p>
          <p><em>"Choisis maintenant un compagnon qui guidera tes premiers pas..."</em></p>
        </div>
        <button @click="nextStep" class="action-button">Choisir votre compagnon</button>
      </div>
  
      <div v-else-if="step === 4" class="character-creation">
        <h2>Création du personnage</h2>
        <div class="name-input">
          <label for="player-name">Votre nom :</label>
          <input 
            type="text" 
            id="player-name" 
            v-model="playerName" 
            placeholder="Entrez votre nom"
            maxlength="20"
          >
        </div>
  
        <h3>Choisissez votre premier esprit animal :</h3>
        <div class="spirit-selection">
          <div 
            v-for="spirit in startingSpirits" 
            :key="spirit.id" 
            class="spirit-card"
            :class="{ selected: selectedSpiritId === spirit.id }"
            @click="selectSpirit(spirit.id)"
          >
            <h4>{{ spirit.name }}</h4>
            <div class="spirit-type">{{ spirit.type }}</div>
            <div class="spirit-desc">{{ spirit.description }}</div>
            <div class="spirit-stats">
              <div>Force: {{ spirit.stats.attack }}</div>
              <div>Défense: {{ spirit.stats.defense }}</div>
              <div>Vitesse: {{ spirit.stats.speed }}</div>
            </div>
          </div>
        </div>
  
        <button 
          @click="startJourney" 
          class="action-button"
          :disabled="!playerName || !selectedSpiritId"
        >
          Commencer l'aventure
        </button>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref } from 'vue';
    import { useRouter } from 'vue-router';
    import { Hero } from '@/core/entities/Hero';
    import { AnimalSpirit } from '@/core/entities/AnimalSpirit';
    import { AnimalType, DamageType, TargetType } from '@/core/types/Enums';
    import  { useGameStore } from '@/stores/game.ts';
  
  export default defineComponent({
    name: 'IntroView',
    setup() {
      const router = useRouter();
      const gameStore = useGameStore();
      
      const step = ref(1);
      const playerName = ref('');
      const selectedSpiritId = ref('');
  
      // Définition des esprits animaux de départ
      const startingSpirits = [
        {
          id: 'cobra',
          name: 'Cobra',
          type: AnimalType.Reptile,
          description: 'Rapide et mortel, le cobra est un prédateur redoutable. Ses attaques de poison sont dévastatrices.',
          stats: {
            maxHealth: 80,
            currentHealth: 80,
            attack: 22,
            defense: 8,
            speed: 18,
            intelligence: 10
          },
          abilities: [
            {
              id: 'venom_bite',
              name: 'Morsure Venimeuse',
              description: 'Une morsure qui injecte du venin, causant des dégâts sur la durée.',
              power: 12,
              cooldown: 2,
              currentCooldown: 0
            }
          ]
        },
        {
          id: 'wolf',
          name: 'Loup',
          type: AnimalType.Mammal,
          description: 'Loyal et endurant, le loup est un chasseur né. Ses attaques sont équilibrées entre force et rapidité.',
          stats: {
            maxHealth: 100,
            currentHealth: 100,
            attack: 15,
            defense: 12,
            speed: 14,
            intelligence: 12
          },
          abilities: [
            {
              id: 'fierce_bite',
              name: 'Morsure Féroce',
              description: 'Une attaque puissante qui peut faire saigner l\'ennemi.',
              power: 14,
              cooldown: 3,
              currentCooldown: 0
            }
          ]
        },
        {
          id: 'eagle',
          name: 'Aigle',
          type: AnimalType.Bird,
          description: 'Majestueux et précis, l\'aigle attaque depuis les cieux. Sa vitesse est inégalée.',
          stats: {
            maxHealth: 70,
            currentHealth: 70,
            attack: 16,
            defense: 7,
            speed: 22,
            intelligence: 14
          },
          abilities: [
            {
              id: 'diving_strike',
              name: 'Frappe Plongeante',
              description: 'Une attaque aérienne difficile à esquiver.',
              power: 16,
              cooldown: 2,
              currentCooldown: 0
            }
          ]
        }
      ];
  
      const nextStep = () => {
        step.value++;
      };
  
      const selectSpirit = (id: string) => {
        selectedSpiritId.value = id;
      };
  
      const startJourney = () => {
        if (!playerName.value || !selectedSpiritId.value) return;
  
        // Création du héros
        const hero = new Hero(
          'hero_' + Date.now().toString(),
          playerName.value,
          {
            maxHealth: 100,
            currentHealth: 100,
            attack: 10,
            defense: 10,
            speed: 10,
            intelligence: 10
          }
        );
  
        // Création de l'esprit animal choisi
        const selectedSpirit = startingSpirits.find(s => s.id === selectedSpiritId.value);
        if (selectedSpirit) {
          const animalSpirit = new AnimalSpirit(
            selectedSpirit.id,
            selectedSpirit.name,
            selectedSpirit.type as AnimalType,
            selectedSpirit.stats,
            selectedSpirit.description,
          );
  
          // Ajouter les capacités à l'esprit animal
          animalSpirit.abilities = selectedSpirit.abilities.map(ability => ({
        ...ability,
        damageType: selectedSpirit.type === AnimalType.Reptile ? DamageType.Dark : 
                    selectedSpirit.type === AnimalType.Bird ? DamageType.Air : 
                    DamageType.Physical,
        targetType: TargetType.SingleEnemy
        }));
  
          // Lier l'esprit au héros
          hero.bondWithSpirit(animalSpirit);
  
          // Sauvegarder dans le store
          gameStore.setPlayer(hero);
  
          // Rediriger vers la carte du monde
          router.push('/world');
        }
      };
  
      return {
        step,
        playerName,
        startingSpirits,
        selectedSpiritId,
        nextStep,
        selectSpirit,
        startJourney
      };
    }
  });
  </script>
  
  <style scoped>
  .intro-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background-color: rgba(240, 240, 240, 0.9);
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  .intro-story {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    margin-bottom: 20px;
  }
  
  .story-text {
    margin-bottom: 30px;
    line-height: 1.6;
  }
  
  h1 {
    font-size: 2.5em;
    margin-bottom: 30px;
    color: #2c3e50;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  .action-button {
    padding: 10px 20px;
    background-color: #41b883;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  .action-button:hover {
    background-color: #349268;
  }
  
  .action-button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
  
  .character-creation {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .name-input {
    margin: 20px 0;
    width: 100%;
    max-width: 300px;
  }
  
  .name-input input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 16px;
  }
  
  .spirit-selection {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 20px;
    margin: 20px 0;
  }
  
  .spirit-card {
    width: 200px;
    padding: 15px;
    border: 2px solid #ccc;
    border-radius: 8px;
    background-color: white;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .spirit-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
  
  .spirit-card.selected {
    border-color: #41b883;
    background-color: rgba(65, 184, 131, 0.1);
  }
  
  .spirit-type {
    font-style: italic;
    color: #666;
    margin-bottom: 10px;
  }
  
  .spirit-desc {
    font-size: 0.9em;
    margin-bottom: 15px;
  }
  
  .spirit-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 5px;
    font-size: 0.85em;
  }
  </style>