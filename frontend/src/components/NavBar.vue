<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { usePostsStore } from '@/stores/posts'
import { useCommunitiesStore } from '@/stores/communities'
import { useFriendsStore } from '@/stores/friends'
import { useNotificationsStore } from '@/stores/notifications'
import { useAdminStore } from '@/stores/admin'
import { API_BASE } from '@/composables/useApi'

// Cabeçalho (marca + usuário + logout) e tabs de navegação. Port do
// ".header" + ".tabs" do index.html original. Cada aba antes fazia
// `currentView.value = 'x'` + a chamada de load correspondente; agora troca
// de rota e dispara o load explicitamente (visto que, se você já estiver na
// mesma rota, o Vue Router sozinho não re-monta o componente de destino).
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const postsStore = usePostsStore()
const communitiesStore = useCommunitiesStore()
const friendsStore = useFriendsStore()
const notificationsStore = useNotificationsStore()
const adminStore = useAdminStore()

const goToFeed = () => {
  postsStore.loadFeed()
  if (route.name !== 'feed') router.push({ name: 'feed' })
}
const goToCommunities = () => {
  communitiesStore.loadCommunities()
  if (route.name !== 'communities') router.push({ name: 'communities' })
}
const goToFriends = () => {
  friendsStore.loadFriends()
  friendsStore.loadPendingRequests()
  if (route.name !== 'friends') router.push({ name: 'friends' })
}
const goToNotifications = () => {
  notificationsStore.loadNotifications()
  if (route.name !== 'notifications') router.push({ name: 'notifications' })
}
const goToOwnProfile = () => {
  router.push({ name: 'profile', params: { id: authStore.currentUser.id } })
}
const goToAdmin = () => {
  adminStore.loadReports()
  if (route.name !== 'admin') router.push({ name: 'admin' })
}
</script>

<template>
  <div class="header">
    <h1 @click="goToFeed">Social Engine</h1>
    <div class="user-info">
      <img
        v-if="authStore.currentUser.avatar_url"
        :src="API_BASE + authStore.currentUser.avatar_url"
        class="profile-avatar-small"
        @error="$event.target.style.display = 'none'"
      />
      <span>{{ authStore.currentUser.username }} (#{{ authStore.currentUser.id }})</span>
      <button class="btn-secondary" @click="authStore.logout()">{{ t('UI_NAV_LOGOUT') }}</button>
    </div>
  </div>
  <div class="tabs">
    <button :class="{ active: route.name === 'feed' }" @click="goToFeed">{{ t('TAB_FEED') }}</button>
    <button :class="{ active: route.name === 'communities' }" @click="goToCommunities">{{ t('TAB_COMMUNITIES') }}</button>
    <button :class="{ active: route.name === 'friends' }" @click="goToFriends">{{ t('TAB_FRIENDS') }}</button>
    <button :class="{ active: route.name === 'notifications' }" @click="goToNotifications">
      {{ t('TAB_NOTIFICATIONS') }}
      <span v-if="notificationsStore.unreadCount > 0" class="badge unread">{{ notificationsStore.unreadCount }}</span>
    </button>
    <button
      :class="{ active: route.name === 'profile' && String(route.params.id) === String(authStore.currentUser.id) }"
      @click="goToOwnProfile"
    >
      {{ t('TAB_PROFILE') }}
    </button>
    <button v-if="authStore.currentUser.id === 1" :class="{ active: route.name === 'admin' }" @click="goToAdmin">
      <!-- Sem chave própria no backend (Translation.cpp não tem uma TAB_ADMIN) -->
      Admin
    </button>
  </div>
</template>
