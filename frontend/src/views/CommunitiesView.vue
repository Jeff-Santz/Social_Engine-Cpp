<script setup>
import { reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useCommunitiesStore } from '@/stores/communities'

// Rota "/communities" (antes currentView === 'communities'): form de criar
// + lista com entrar/sair.
const { t } = useI18n()
const router = useRouter()
const communitiesStore = useCommunitiesStore()

const newCommunity = reactive({ name: '', description: '', is_private: false })

onMounted(() => {
  communitiesStore.loadCommunities()
})

const handleCreate = async () => {
  const ok = await communitiesStore.createCommunity({ ...newCommunity })
  if (ok) {
    newCommunity.name = ''
    newCommunity.description = ''
    newCommunity.is_private = false
  }
}

const goToCommunity = (id) => router.push({ name: 'community', params: { id } })
</script>

<template>
  <div class="card">
    <h3>{{ t('UI_BTN_CREATE_COMM') }}</h3>
    <div class="form-group">
      <label>{{ t('UI_LBL_NAME') }}</label>
      <input v-model="newCommunity.name" type="text" />
    </div>
    <div class="form-group">
      <label>{{ t('UI_LBL_DESC') }}</label>
      <textarea v-model="newCommunity.description"></textarea>
    </div>
    <div class="form-group checkbox-group">
      <input id="newCommPrivate" v-model="newCommunity.is_private" type="checkbox" />
      <label for="newCommPrivate">{{ t('UI_LBL_PRIVATE') }}</label>
    </div>
    <button class="btn-primary" @click="handleCreate">{{ t('UI_BTN_CREATE_COMM') }}</button>
  </div>

  <div v-if="communitiesStore.loading" class="loading">{{ t('UI_LOADING') }}</div>
  <div v-else-if="communitiesStore.communities.length === 0" class="empty">{{ t('UI_NO_COMMUNITIES') }}</div>
  <div v-for="comm in communitiesStore.communities" :key="comm.id" class="card community-card">
    <div class="community-info">
      <h3 @click="goToCommunity(comm.id)">
        {{ comm.name }} <span v-if="comm.is_private" class="lock-icon">&#128274;</span>
      </h3>
      <p>{{ comm.description }}</p>
      <div class="community-meta">{{ t('UI_LBL_MEMBERS') }}: {{ comm.members }}</div>
    </div>
    <div>
      <button v-if="comm.isMember" class="btn-secondary" @click="communitiesStore.leaveCommunity(comm)">{{ t('UI_BTN_LEAVE') }}</button>
      <button v-else-if="comm.joinStatus === 'pending'" class="btn-pending" disabled>{{ t('UI_LBL_REQUEST_SENT') }}</button>
      <button v-else class="btn-primary" @click="communitiesStore.joinCommunity(comm)">{{ t('UI_BTN_JOIN') }}</button>
    </div>
  </div>
</template>
