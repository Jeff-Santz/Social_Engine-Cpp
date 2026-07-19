<script setup>
import { useI18n } from 'vue-i18n'
import { useReportsStore } from '@/stores/reports'
import BaseModal from './BaseModal.vue'

// Global (montado 1x em App.vue), acionado via reportsStore.open(type, id)
// a partir de PostCard (post/comentário) ou ProfileView (usuário).
const { t } = useI18n()
const reportsStore = useReportsStore()
</script>

<template>
  <BaseModal :show="reportsStore.showModal" @close="reportsStore.close()">
    <h3>{{ t('UI_TITLE_REPORT') }}</h3>
    <div class="form-group">
      <label>{{ t('UI_LBL_CATEGORY') }}</label>
      <select v-model="reportsStore.form.category">
        <option value="">{{ t('UI_SELECT') }}</option>
        <option value="spam">{{ t('UI_OPT_SPAM') }}</option>
        <option value="hate">{{ t('UI_OPT_HATE') }}</option>
        <option value="fake">{{ t('UI_OPT_FAKE') }}</option>
      </select>
    </div>
    <div class="form-group">
      <label>{{ t('UI_LBL_REASON') }}</label>
      <textarea v-model="reportsStore.form.reason" :placeholder="t('UI_PLACEHOLDER_REASON')"></textarea>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" @click="reportsStore.close()">{{ t('UI_BTN_CANCEL') }}</button>
      <button class="btn-danger" @click="reportsStore.submit()">{{ t('UI_BTN_REPORT') }}</button>
    </div>
  </BaseModal>
</template>
