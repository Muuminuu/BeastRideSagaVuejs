<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore, GameState } from '@/stores/game'
import { SoulBond } from '@/models/entities/player'

const router = useRouter()
const gameStore = useGameStore()

// État du dialogue
const currentDialogIndex = ref(0)
const dialogues = computed(() => gameStore.dialogueQueue)
const currentDialog = computed(() => {
  const dialog = dialogues.value[currentDialogIndex.value]
  return dialog || null
})

const showNextButton = computed(() => {
  return currentDialogIndex.value < dialogues.value.length - 1
})

const showChooseButton = computed(() => {
  return currentDialogIndex.value === dialogues.value.length - 1
})

// État de la sélection d'esprit
const showSpiritSelection = ref(false)
const playerName = ref('')
const selectedSpirit = ref<SoulBond | null>(null)
const availableSpirits = computed(() => gameStore.availableStarterSpirits)

onMounted(() => {
  // Initialiser le jeu au chargement
  gameStore.initGame()
})

// Fonction pour avancer dans le dialogue
const nextDialog = () => {
  if (currentDialogIndex.value < dialogues.value.length - 1) {
    currentDialogIndex.value++
  } else {
    showSpiritSelection.value = true
  }
}

// Fonction pour commencer la sélection d'esprit
const startSpiritSelection = () => {
  showSpiritSelection.value = true
}

// Fonction pour sélectionner un esprit
const selectSpirit = (spirit: SoulBond) => {
  selectedSpirit.value = spirit
}

// Fonction pour commencer le jeu
const startGame = () => {
  if (playerName.value.trim() === '') {
    alert('Veuillez entrer un nom de joueur.')
    return
  }
  
  if (!selectedSpirit.value) {
    alert('Veuillez sélectionner un esprit de départ.')
    return
  }
  
  gameStore.startGame(playerName.value, selectedSpirit.value)
  router.push('/world')
}
</script>

<template>
  <main class="intro-container">
    <!-- Introduction dialoguée -->
    <div v-if="!showSpiritSelection" class="intro-dialogue">
      <h1 class="intro-title">Beast Ride Saga</h1>
      
      <div class="dialogue-box">
        <p v-if="currentDialog" class="dialogue-text">{{ currentDialog }}</p>
        <div class="dialogue-controls">
          <button v-if="showNextButton" @click="nextDialog" class="next-button">Suivant</button>
          <button v-if="showChooseButton" @click="startSpiritSelection" class="choose-button">
            Choisir mon esprit
          </button>
        </div>
      </div>
    </div>
    
    <!-- Sélection d'esprit -->
    <div v-else class="spirit-selection">
      <h2>Choisissez votre premier lien spirituel</h2>
      
      <div class="player-name-input">
        <label for="player-name">Votre nom:</label>
        <input 
          type="text" 
          id="player-name" 
          v-model="playerName" 
          placeholder="Entrez votre nom..."
          maxlength="20"
        />
      </div>
      
      <div class="spirits-container">
        <div 
          v-for="spirit in availableSpirits" 
          :key="spirit.id"
          class="spirit-card"
          :class="{ selected: selectedSpirit && selectedSpirit.id === spirit.id }"
          @click="selectSpirit(spirit)"
        >
          <div class="spirit-image" :class="spirit.type.toLowerCase()">
            {{ spirit.type.charAt(0).toUpperCase() }}
          </div>
          <h3>{{ spirit.name }}</h3>
          <p class="spirit-type">{{ spirit.type }} / {{ spirit.element }}</p>
          <div class="spirit-stats">
            <div class="stat-bar">
              <span class="stat-label">VIE</span>
              <div class="stat-progress">
                <div 
                  class="stat-fill health"
                  :style="{ width: `${(spirit.stats.health / 150) * 100}%` }"
                ></div>
              </div>
            </div>
            <div class="stat-bar">
              <span class="stat-label">ATT</span>
              <div class="stat-progress">
                <div 
                  class="stat-fill attack"
                  :style="{ width: `${(spirit.stats.attack / 100) * 100}%` }"
                ></div>
              </div>
            </div>
            <div class="stat-bar">
              <span class="stat-label">DEF</span>
              <div class="stat-progress">
                <div 
                  class="stat-fill defense"
                  :style="{ width: `${(spirit.stats.defense / 100) * 100}%` }"
                ></div>
              </div>
            </div>
            <div class="stat-bar">
              <span class="stat-label">VIT</span>
              <div class="stat-progress">
                <div 
                  class="stat-fill speed"
                  :style="{ width: `${(spirit.stats.speed / 100) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
          <div class="spirit-description">
            {{ spirit.description }}
          </div>
          <div class="spirit-attacks">
            <div v-for="attack in spirit.attacks" :key="attack.name" class="attack-item">
              <span class="attack-name">{{ attack.name }}</span>
              <span class="attack-type">{{ attack.element }}</span>
              <span class="attack-power">{{ attack.power }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <button 
        @click="startGame"
        :disabled="!selectedSpirit || playerName.trim() === ''"
        class="start-game-button"
      >
        Commencer l'aventure
      </button>
    </div>
  </main>
</template>

<style scoped>
.intro-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.intro-title {
  font-size: 3rem;
  text-align: center;
  margin-bottom: 2rem;
  color: #41b883;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.dialogue-box {
  background-color: rgba(44, 62, 80, 0.05);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.dialogue-text {
  font-size: 1.2rem;
  line-height: 1.6;
  margin-bottom: 20px;
}

.dialogue-controls {
  display: flex;
  justify-content: flex-end;
}

.next-button, .choose-button, .start-game-button {
  padding: 10px 20px;
  background-color: #41b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.next-button:hover, .choose-button:hover, .start-game-button:hover {
  background-color: #369e6e;
}

.start-game-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.spirit-selection {
  padding: 20px;
}

.player-name-input {
  margin-bottom: 20px;
}

.player-name-input label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.player-name-input input {
  width: 100%;
  padding: 10px;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.spirits-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.spirit-card {
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s;
  background-color: rgba(255, 255, 255, 0.7);
}

.spirit-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.spirit-card.selected {
  border-color: #41b883;
  background-color: rgba(65, 184, 131, 0.1);
}

.spirit-image {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 15px;
  font-size: 2rem;
  font-weight: bold;
  color: white;
}

.spirit-image.snake {
  background-color: #8fbc8f;
}

.spirit-image.wolf {
  background-color: #a9a9a9;
}

.spirit-image.bear {
  background-color: #8b4513;
}

.spirit-image.eagle {
  background-color: #b8860b;
}

.spirit-image.fish {
  background-color: #4682b4;
}

.spirit-card h3 {
  margin: 0 0 5px;
  text-align: center;
}

.spirit-type {
  text-align: center;
  font-style: italic;
  margin-bottom: 10px;
  color: #666;
}

.spirit-stats {
  margin-bottom: 15px;
}

.stat-bar {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.stat-label {
  width: 40px;
  font-size: 0.8rem;
  font-weight: bold;
}

.stat-progress {
  flex: 1;
  height: 8px;
  background-color: #eee;
  border-radius: 4px;
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  border-radius: 4px;
}

.stat-fill.health {
  background-color: #ff6b6b;
}

.stat-fill.attack {
  background-color: #f39c12;
}

.stat-fill.defense {
  background-color: #3498db;
}

.stat-fill.speed {
  background-color: #2ecc71;
}

.spirit-description {
  font-size: 0.9rem;
  margin-bottom: 10px;
  color: #555;
}

.spirit-attacks {
  font-size: 0.8rem;
}

.attack-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  padding: 3px;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.attack-name {
  font-weight: bold;
}

.attack-type {
  font-style: italic;
}

.attack-power {
  font-weight: bold;
}

@media (max-width: 768px) {
  .spirits-container {
    grid-template-columns: 1fr;
  }
  
  .spirit-card {
    max-width: 300px;
    margin: 0 auto;
  }
}
</style>