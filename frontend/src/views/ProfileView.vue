<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useProfileStore } from '@/stores/profile'
import { useFriendsStore } from '@/stores/friends'
import { useReportsStore } from '@/stores/reports'
import { API_BASE } from '@/composables/useApi'
import { formatJoinDate } from '@/utils/date'
import PostCard from '@/components/PostCard.vue'
import EditProfileModal from '@/components/EditProfileModal.vue'

// Rota "/profile/:id" (antes currentView === 'profile'). Port do bloco
// PROFILE do template original. `previousView`/goBack() viram router.back().
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const profileStore = useProfileStore()
const friendsStore = useFriendsStore()
const reportsStore = useReportsStore()

const showEditProfileModal = ref(false)

// route.params.id é string; a store compara com IDs numéricos vindos da API
// (===), então convertemos aqui — e refaz o fetch sempre que o :id mudar
// (ex: ir do perfil A pro perfil B sem trocar de "view").
watch(
  () => route.params.id,
  (id) => {
    if (id) profileStore.viewProfile(parseInt(id, 10))
  },
  { immediate: true },
)

const canSeePosts = computed(
  () =>
    profileStore.viewedProfile &&
    (!profileStore.viewedProfile.is_locked ||
      profileStore.viewedProfile.friend_status === 'friend' ||
      profileStore.viewedProfile.friend_status === 'self'),
)

const avatarFallback = (e) => {
  e.target.src =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"%3E%3Crect width="80" height="80" fill="%23333"/%3E%3C/svg%3E'
}
</script>

<template>
  <button class="back-btn btn-secondary" @click="router.back()">&larr; {{ t('UI_BTN_BACK') }}</button>

  <div v-if="profileStore.profileLoading" class="loading">{{ t('UI_LOADING') }}</div>

  <template v-else-if="profileStore.viewedProfile">
    <div class="card" style="padding: 0">
      <img v-if="profileStore.viewedProfile.cover_url" :src="API_BASE + profileStore.viewedProfile.cover_url" class="cover-image" />
      <div class="profile-header">
        <img
          v-if="profileStore.viewedProfile.avatar_url"
          :src="API_BASE + profileStore.viewedProfile.avatar_url"
          class="profile-avatar"
          @error="avatarFallback"
        />
        <div v-else class="profile-avatar" style="display: flex; align-items: center; justify-content: center">?</div>
        <h2>
          {{ profileStore.viewedProfile.username }}
          <span v-if="profileStore.viewedProfile.is_private" class="lock-icon">&#128274;</span>
        </h2>
        <div class="profile-stats">
          <span>{{ t('BTN_FRIENDS') }}: {{ profileStore.viewedProfile.friends_count }}</span>
          <span>{{ t('UI_LBL_JOINED') }}: {{ formatJoinDate(profileStore.viewedProfile.created_at) }}</span>
        </div>
        <div class="profile-bio">{{ profileStore.viewedProfile.bio }}</div>
        <div class="profile-actions">
          <template v-if="profileStore.viewedProfile.friend_status === 'self'">
            <button class="btn-primary" @click="showEditProfileModal = true">{{ t('UI_TITLE_EDIT_PROFILE') }}</button>
          </template>
          <template v-else>
            <button
              v-if="profileStore.viewedProfile.friend_status === 'none'"
              class="btn-primary"
              @click="friendsStore.sendFriendRequest(profileStore.viewedProfile.id)"
            >
              {{ t('BTN_ADD_FRIEND') }}
            </button>
            <button v-else-if="profileStore.viewedProfile.friend_status === 'pending_sent'" class="btn-pending" disabled>
              {{ t('UI_LBL_REQUEST_SENT') }}
            </button>
            <button
              v-else-if="profileStore.viewedProfile.friend_status === 'pending_received'"
              class="btn-success"
              @click="friendsStore.respondFriendRequest(profileStore.viewedProfile.id, 'accept')"
            >
              {{ t('UI_BTN_ACCEPT') }}
            </button>
            <button
              v-else-if="profileStore.viewedProfile.friend_status === 'friend'"
              class="btn-danger"
              @click="friendsStore.removeFriend(profileStore.viewedProfile.id)"
            >
              {{ t('UI_BTN_REMOVE_FRIEND') }}
            </button>
            <button class="btn-secondary" @click="reportsStore.open('user', profileStore.viewedProfile.id)">
              {{ t('UI_BTN_REPORT') }}
            </button>
          </template>
        </div>
      </div>
    </div>

    <div v-if="canSeePosts">
      <div v-if="profileStore.profilePosts.length === 0" class="empty">{{ t('UI_NO_POSTS') }}</div>
      <PostCard
        v-for="post in profileStore.profilePosts"
        :key="post.id"
        :post="post"
        :clickable-author="false"
        :author-label="profileStore.viewedProfile.username"
        show-date
        @delete="profileStore.deleteProfilePost"
        @toggle-like="profileStore.toggleProfilePostLike"
      />
    </div>
    <div v-else class="empty">{{ t('UI_PRIVATE_PROFILE') }}</div>
  </template>

  <EditProfileModal v-if="showEditProfileModal" @close="showEditProfileModal = false" />
</template>
