import { createRouter, createWebHistory } from 'vue-router'
import NodeView from '../views/NodeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/datanode',
      name: 'node',
      component: NodeView
    }
  ]
})

export default router
