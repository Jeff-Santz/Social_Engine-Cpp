<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useFriendsStore } from '@/stores/friends'
import { API_BASE } from '@/composables/useApi'

// Rota "/friends" (antes currentView === 'friends'). Sub-tabs
// list/pending/search continuam como estado local (não iam pra URL).
const { t } = useI18n()
const router = useRouter()
const friendsStore = useFriendsStore()

const friendsSubView = ref('list')

onMounted(() => {
  friendsStore.loadFriends()
})

const openList = () => {
  friendsSubView.value = 'list'
  friendsStore.loadFriends()
}
const openPending = () => {
  friendsSubView.value = 'pending'
  friendsStore.loadPendingRequests()
}
const openSearch = () => {
  friendsSubView.value = 'search'
}
const goToProfile = (id) => router.push({ name: 'profile', params: { id } })
</script>

<template>
  <div class="sub-tabs">
    <button :class="{ active: friendsSubView === 'list' }" @click="openList">{{ t('UI_TAB_MY_FRIENDS') }}</button>
    <button :class="{ active: friendsSubView === 'pending' }" @click="openPending">{{ t('UI_TAB_PENDING') }}</button>
    <button :class="{ active: friendsSubView === 'search' }" @click="openSearch">{{ t('UI_TAB_SEARCH') }}</button>
  </div>

  <div v-if="friendsSubView === 'list'">
    <div v-if="friendsStore.friends.length === 0" class="empty">{{ t('UI_NO_FRIENDS') }}</div>
    <div v-for="f in friendsStore.friends" :key="f.id" class="friend-item">
      <div class="user-header-row">
        <img
          v-if="f.avatar_url"
          :src="API_BASE + f.avatar_url"
          class="profile-avatar-small"
          @error="$event.target.style.display = 'none'"
        />
        <span style="cursor: pointer" @click="goToProfile(f.id)">{{ f.username }}</span>
      </div>
      <button class="btn-danger" @click="friendsStore.removeFriend(f.id)">{{ t('UI_BTN_REMOVE') }}</button>
    </div>
  </div>

  <div v-else-if="friendsSubView === 'pending'">
    <div v-if="friendsStore.pendingRequests.length === 0" class="empty">{{ t('UI_NO_REQUESTS') }}</div>
    <div v-for="r in friendsStore.pendingRequests" :key="r.id" class="friend-item">
      <span>{{ r.username }}</span>
      <div>
        <button class="btn-success" @click="friendsStore.respondFriendRequest(r.id, 'accept')">{{ t('UI_BTN_ACCEPT') }}</button>
        <button class="btn-danger" @click="friendsStore.respondFriendRequest(r.id, 'reject')">{{ t('UI_BTN_REJECT') }}</button>
      </div>
    </div>
  </div>

  <div v-else-if="friendsSubView === 'search'">
    <div class="search-box">
      <input v-model="friendsStore.searchQuery" type="text" :placeholder="t('UI_PLACEHOLDER_SEARCH')" @keyup.enter="friendsStore.searchUsers" />
      <button class="btn-primary" @click="friendsStore.searchUsers">{{ t('UI_BTN_SEARCH') }}</button>
    </div>
    <div v-if="friendsStore.searchPerformed && friendsStore.searchResults.length === 0" class="empty">{{ t('UI_NO_RESULTS') }}</div>
    <div v-for="u in friendsStore.searchResults" :key="u.id" class="friend-item">
      <div class="user-header-row">
        <img
          v-if="u.avatar_url"
          :src="API_BASE + u.avatar_url"
          class="profile-avatar-small"
          @error="$event.target.style.display = 'none'"
        />
        <span style="cursor: pointer" @click="goToProfile(u.id)">{{ u.username }}</span>
      </div>
      <button v-if="u.friend_status === 'none'" class="btn-primary" @click="friendsStore.sendFriendRequest(u.id)">
        {{ t('BTN_ADD_FRIEND') }}
      </button>
      <button v-else-if="u.friend_status === 'pending_sent'" class="btn-pending" disabled>{{ t('UI_LBL_REQUEST_SENT') }}</button>
      <button v-else-if="u.friend_status === 'friend'" class="btn-secondary" disabled>{{ t('BTN_FRIENDS') }}</button>
    </div>
  </div>
</template>
