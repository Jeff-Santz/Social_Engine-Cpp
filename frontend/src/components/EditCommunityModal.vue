<script setup>
import { reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCommunitiesStore } from '@/stores/communities'
import BaseModal from './BaseModal.vue'

// Aberto só a partir de CommunityDetailView (am_i_admin), pré-preenchido
// com communitiesStore.viewedCommunity no momento da abertura.
const emit = defineEmits(['close'])
const { t } = useI18n()
const communitiesStore = useCommunitiesStore()

const form = reactive({ description: '', is_private: false })

onMounted(() => {
  if (communitiesStore.viewedCommunity) {
    form.description = communitiesStore.viewedCommunity.description || ''
    form.is_private = communitiesStore.viewedCommunity.is_private || false
  }
})

const save = async () => {
  const ok = await communitiesStore.saveCommunity(form)
  if (ok) emit('close')
}
</script>

<template>
  <BaseModal @close="emit('close')">
    <h3>{{ t('UI_TITLE_EDIT_COMM') }}</h3>
    <div class="form-group">
      <label>{{ t('UI_LBL_DESC') }}</label>
      <textarea v-model="form.description" maxlength="200"></textarea>
    </div>
    <div class="form-group checkbox-group">
      <input id="editCommPrivate" v-model="form.is_private" type="checkbox" />
      <label for="editCommPrivate">{{ t('UI_LBL_PRIVATE') }}</label>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" @click="emit('close')">{{ t('UI_BTN_CANCEL') }}</button>
      <button class="btn-primary" @click="save">{{ t('UI_BTN_SAVE') }}</button>
    </div>
  </BaseModal>
</template>
