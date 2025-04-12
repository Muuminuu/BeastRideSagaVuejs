import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'combat',
      component: () => import('../views/CombatView.vue'),
    },
    {
      path: '/test-combat',
      name: 'test-combat',
      component: () => import('../views/TestCombatView.vue'),
    }
  ],
})

export default router
