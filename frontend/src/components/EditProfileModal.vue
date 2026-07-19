<script setup>
import { reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'
import { fileToBase64 } from '@/utils/file'
import { API_BASE } from '@/composables/useApi'
import BaseModal from './BaseModal.vue'

// Aberto só a partir do próprio ProfileView (friend_status === 'self'),
// então o form já nasce pré-preenchido com authStore.currentUser.
const emit = defineEmits(['close'])

const { t } = useI18n()
const authStore = useAuthStore()
const profileStore = useProfileStore()

const form = reactive({
  bio: '',
  is_private: false,
  avatarBase64: '',
  avatarPreview: '',
  coverBase64: '',
  coverPreview: '',
})

onMounted(() => {
  form.bio = authStore.currentUser.bio || ''
  form.is_private = authStore.currentUser.is_private || false
})

const handleAvatarChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  const base64 = await fileToBase64(file)
  form.avatarBase64 = base64
  form.avatarPreview = base64
}

const handleCoverChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  const base64 = await fileToBase64(file)
  form.coverBase64 = base64
  form.coverPreview = base64
}

const save = async () => {
  const ok = await authStore.saveProfile(form)
  if (ok) {
    // Igual ao original: como esse modal só abre pro próprio perfil,
    // viewedProfile (se for o mesmo usuário) é sincronizado também.
    if (profileStore.viewedProfile && profileStore.viewedProfile.id === authStore.currentUser.id) {
      profileStore.viewedProfile.bio = form.bio
      profileStore.viewedProfile.is_private = form.is_private
      if (form.avatarPreview) profileStore.viewedProfile.avatar_url = form.avatarPreview
      if (form.coverPreview) profileStore.viewedProfile.cover_url = form.coverPreview
    }
    emit('close')
  }
}
</script>

<template>
  <BaseModal @close="emit('close')">
    <h3>{{ t('UI_TITLE_EDIT_PROFILE') }}</h3>
    <div class="form-group">
      <label>{{ t('UI_LBL_BIO') }}</label>
      <textarea v-model="form.bio" maxlength="200"></textarea>
    </div>
    <div class="form-group checkbox-group">
      <input id="editPrivate" v-model="form.is_private" type="checkbox" />
      <label for="editPrivate">{{ t('UI_LBL_PRIVATE') }}</label>
    </div>
    <div class="form-group">
      <!-- Sem chave própria no backend (Translation.cpp não tem "avatar"); Avatar é igual em PT/EN -->
      <label>Avatar</label>
      <div class="file-input-wrapper">
        <button class="btn-secondary">{{ t('UI_BTN_MEDIA') }}</button>
        <input type="file" accept="image/*" @change="handleAvatarChange" />
      </div>
      <img :src="form.avatarPreview || API_BASE + authStore.currentUser.avatar_url" class="image-preview" />
    </div>
    <div class="form-group">
      <!-- Sem chave própria no backend (Translation.cpp não tem "capa/cover") -->
      <label>Cover</label>
      <div class="file-input-wrapper">
        <button class="btn-secondary">{{ t('UI_BTN_MEDIA') }}</button>
        <input type="file" accept="image/*" @change="handleCoverChange" />
      </div>
      <img
        v-if="form.coverPreview || authStore.currentUser.cover_url"
        :src="form.coverPreview || API_BASE + authStore.currentUser.cover_url"
        class="image-preview"
      />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" @click="emit('close')">{{ t('UI_BTN_CANCEL') }}</button>
      <button class="btn-primary" @click="save">{{ t('UI_BTN_SAVE') }}</button>
    </div>
    <div class="danger-zone">
      <!-- Sem chave própria no backend (Translation.cpp não tem "zona de perigo") -->
      <h4>Danger Zone</h4>
      <p>{{ t('MSG_USER_DELETED') }}</p>
      <button class="btn-danger" @click="authStore.deleteAccount()">{{ t('UI_BTN_DELETE') }}</button>
    </div>
  </BaseModal>
</template>
