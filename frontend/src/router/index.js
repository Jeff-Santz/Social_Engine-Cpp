import { createRouter, createWebHistory } from 'vue-router'

// Substitui a variável de estado manual `currentView` do index.html original
// por rotas de verdade. Mapeamento (view antiga -> rota nova):
//   'feed'          -> /
//   'profile'       -> /profile/:id
//   'communities'   -> /communities
//   'community'     -> /communities/:id
//   'friends'       -> /friends
//   'notifications' -> /notifications
//   'admin'         -> /admin
const routes = [
  {
    path: '/',
    name: 'feed',
    component: () => import('@/views/FeedView.vue'),
  },
  {
    path: '/profile/:id',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
    props: true,
  },
  {
    path: '/communities',
    name: 'communities',
    component: () => import('@/views/CommunitiesView.vue'),
  },
  {
    path: '/communities/:id',
    name: 'community',
    component: () => import('@/views/CommunityDetailView.vue'),
    props: true,
  },
  {
    path: '/friends',
    name: 'friends',
    component: () => import('@/views/FriendsView.vue'),
  },
  {
    path: '/notifications',
    name: 'notifications',
    component: () => import('@/views/NotificationsView.vue'),
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/views/AdminView.vue'),
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
