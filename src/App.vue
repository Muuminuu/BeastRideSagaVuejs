<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useGameStore } from './stores/game'

const route = useRoute()
const gameStore = useGameStore()

// Hide header on intro screen
const showHeader = computed(() => route.name !== 'intro')
const playerName = computed(() => gameStore.player?.name || '')
</script>

<template>
  <header v-if="showHeader">
    <img alt="Beast Ride Saga logo" class="logo" src="@/assets/logo.svg" width="125" height="125" />

    <div class="wrapper">
      <div class="player-info" v-if="playerName">
        <span class="player-name">{{ playerName }}</span>
        <span v-if="gameStore.player?.soulBond" class="spirit-name">
          | {{ gameStore.player.soulBond.name }} ({{ gameStore.player.soulBond.growthStage }})
        </span>
      </div>

      <nav>
        <RouterLink to="/world">Monde</RouterLink>
        <RouterLink to="/test-combat">Test Combat</RouterLink>
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
  padding: 1rem;
  background-color: rgba(44, 62, 80, 0.05);
  margin-bottom: 1rem;
}

.logo {
  display: block;
  margin: 0 auto 1rem;
}

.player-info {
  text-align: center;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: rgba(65, 184, 131, 0.1);
  border-radius: 4px;
}

.player-name {
  font-weight: bold;
  color: #2c3e50;
}

.spirit-name {
  color: #41b883;
  margin-left: 0.5rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 1rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  .player-info {
    text-align: left;
    margin-bottom: 0;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;
    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>