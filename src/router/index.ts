// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { useGameStore } from '@/stores/game'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'intro',
      component: () => import('../views/IntroView.vue'),
    },
    {
      path: '/world',
      name: 'world',
      component: () => import('../views/WorldView.vue'),
      meta: { requiresPlayer: true }
    },
    {
      path: '/exploration',
      name: 'exploration',
      component: () => import('../views/ExplorationView.vue'),
      meta: { requiresPlayer: true }
    },
    {
      path: '/combat',
      name: 'combat',
      component: () => import('../views/CombatView.vue'),
      meta: { requiresPlayer: true }
    },
    {
      path: '/test-combat',
      name: 'test-combat',
      component: () => import('../views/TestCombatView.vue'),
    }
  ],
})

// Navigation guard to check if player exists for routes that require it
router.beforeEach((to, from, next) => {
  const gameStore = useGameStore()
  
  if (to.meta.requiresPlayer && !gameStore.player) {
    // Redirect to intro if player doesn't exist
    next({ name: 'intro' })
  } else {
    next()
  }
})

export default router