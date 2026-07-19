<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useCommunitiesStore } from '@/stores/communities'
import { API_BASE } from '@/composables/useApi'
import PostCard from '@/components/PostCard.vue'
import PostComposer from '@/components/PostComposer.vue'
import EditCommunityModal from '@/components/EditCommunityModal.vue'

// Rota "/communities/:id" (antes currentView === 'community'). Sub-tabs
// posts/members/requests continuam como estado local (não viravam URL no
// original), resetadas pra 'posts' sempre que o :id da rota muda.
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const communitiesStore = useCommunitiesStore()

const communitySubView = ref('posts')
const showEditCommunityModal = ref(false)

watch(
  () => route.params.id,
  (id) => {
    if (!id) return
    communitySubView.value = 'posts'
    communitiesStore.viewCommunity(parseInt(id, 10))
  },
  { immediate: true },
)

const openMembers = () => {
  communitySubView.value = 'members'
  communitiesStore.loadCommunityMembers()
}
const openRequests = () => {
  communitySubView.value = 'requests'
  communitiesStore.loadCommunityRequests()
}
const goToProfile = (id) => router.push({ name: 'profile', params: { id } })
const onRoleChange = (memberId, event) => communitiesStore.changeMemberRole(memberId, event.target.value)
</script>

<template>
  <button class="back-btn btn-secondary" @click="router.back()">&larr; {{ t('UI_BTN_BACK') }}</button>

  <div v-if="communitiesStore.communityLoading" class="loading">{{ t('UI_LOADING') }}</div>

  <template v-else-if="communitiesStore.viewedCommunity">
    <div class="card">
      <h2>
        {{ communitiesStore.viewedCommunity.name }}
        <span v-if="communitiesStore.viewedCommunity.is_private" class="lock-icon">&#128274;</span>
      </h2>
      <p>{{ communitiesStore.viewedCommunity.description }}</p>
      <div class="community-meta">{{ t('UI_LBL_MEMBERS') }}: {{ communitiesStore.viewedCommunity.members }}</div>
      <div class="profile-actions">
        <button
          v-if="!communitiesStore.viewedCommunity.am_i_member && communitiesStore.viewedCommunity.joinStatus !== 'pending'"
          class="btn-primary"
          @click="communitiesStore.joinCommunityDirect(communitiesStore.viewedCommunity)"
        >
          {{ t('UI_BTN_JOIN') }}
        </button>
        <button v-else-if="communitiesStore.viewedCommunity.joinStatus === 'pending'" class="btn-pending" disabled>
          {{ t('UI_LBL_REQUEST_SENT') }}
        </button>
        <button
          v-if="communitiesStore.viewedCommunity.am_i_member && !communitiesStore.viewedCommunity.am_i_master"
          class="btn-secondary"
          @click="communitiesStore.leaveCommunityDirect(communitiesStore.viewedCommunity)"
        >
          {{ t('UI_BTN_LEAVE') }}
        </button>
        <button v-if="communitiesStore.viewedCommunity.am_i_admin" class="btn-secondary" @click="showEditCommunityModal = true">
          {{ t('UI_BTN_EDIT') }}
        </button>
      </div>
    </div>

    <div class="sub-tabs">
      <button :class="{ active: communitySubView === 'posts' }" @click="communitySubView = 'posts'">{{ t('UI_TITLE_POSTS') }}</button>
      <button :class="{ active: communitySubView === 'members' }" @click="openMembers">{{ t('UI_LBL_MEMBERS') }}</button>
      <button
        v-if="communitiesStore.viewedCommunity.am_i_admin"
        :class="{ active: communitySubView === 'requests' }"
        @click="openRequests"
      >
        {{ t('UI_LBL_REQUESTS') }}
      </button>
    </div>

    <div v-if="communitySubView === 'posts'">
      <PostComposer v-if="communitiesStore.viewedCommunity.am_i_member" :on-submit="communitiesStore.createCommunityPost" />
      <div v-if="communitiesStore.communityPosts.length === 0" class="empty">{{ t('UI_NO_POSTS') }}</div>
      <PostCard
        v-for="post in communitiesStore.communityPosts"
        :key="post.id"
        :post="post"
        :enable-delete="false"
        show-date
        @toggle-like="communitiesStore.toggleCommunityPostLike"
      />
    </div>

    <div v-else-if="communitySubView === 'members'">
      <div v-for="m in communitiesStore.communityMembers" :key="m.id" class="member-item">
        <div class="member-info">
          <img
            v-if="m.avatar_url"
            :src="API_BASE + m.avatar_url"
            class="profile-avatar-small"
            @error="$event.target.style.display = 'none'"
          />
          <span style="cursor: pointer" @click="goToProfile(m.id)">{{ m.username }}</span>
          <span class="member-role" :class="{ master: m.role === 1, admin: m.role === 2 }">
            {{ m.role === 1 ? 'Master' : m.role === 2 ? 'Admin' : 'Member' }}
          </span>
        </div>
        <div v-if="communitiesStore.viewedCommunity.am_i_master && m.id !== authStore.currentUser.id">
          <select class="role-select" :value="m.role" @change="onRoleChange(m.id, $event)">
            <option :value="2">Admin</option>
            <option :value="3">Member</option>
          </select>
          <button class="btn-danger post-delete-btn" @click="communitiesStore.removeMember(m.id)">{{ t('UI_BTN_REMOVE') }}</button>
        </div>
        <div
          v-else-if="
            communitiesStore.viewedCommunity.am_i_admin &&
            !communitiesStore.viewedCommunity.am_i_master &&
            m.role === 3 &&
            m.id !== authStore.currentUser.id
          "
        >
          <button class="btn-danger post-delete-btn" @click="communitiesStore.removeMember(m.id)">{{ t('UI_BTN_REMOVE') }}</button>
        </div>
      </div>
    </div>

    <div v-else-if="communitySubView === 'requests'">
      <div v-if="communitiesStore.communityRequests.length === 0" class="empty">{{ t('UI_NO_REQUESTS') }}</div>
      <div v-for="r in communitiesStore.communityRequests" :key="r.id" class="friend-item">
        <span>{{ r.username }}</span>
        <div>
          <button class="btn-success" @click="communitiesStore.respondCommunityRequest(r.id, 'accept')">{{ t('UI_BTN_ACCEPT') }}</button>
          <button class="btn-danger" @click="communitiesStore.respondCommunityRequest(r.id, 'reject')">{{ t('UI_BTN_REJECT') }}</button>
        </div>
      </div>
    </div>
  </template>

  <EditCommunityModal v-if="showEditCommunityModal" @close="showEditCommunityModal = false" />
</template>
