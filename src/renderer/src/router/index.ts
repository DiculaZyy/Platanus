import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@renderer/views/HomeView.vue'
import GraphView from '@renderer/views/GraphView.vue'
import TreeView from '@renderer/views/TreeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/graph',
      name: 'graph',
      component: GraphView
    },
    {
      path: '/tree',
      name: 'tree',
      component: TreeView
    }
  ]
})

export default router
