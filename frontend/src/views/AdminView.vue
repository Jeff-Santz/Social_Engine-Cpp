<script setup>
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAdminStore } from '@/stores/admin'

// Rota "/admin" (antes currentView === 'admin'). O backend já barra
// (403) qualquer usuário que não seja id=1 em /api/admin/reports — aqui só
// replicamos a mesma UI condicional do original (aba escondida em
// NavBar.vue para quem não é id=1).
const { t } = useI18n()
const adminStore = useAdminStore()

onMounted(() => {
  adminStore.loadReports()
})
</script>

<template>
  <h2>{{ t('UI_TITLE_ADMIN') }}</h2>

  <div v-if="adminStore.loading" class="loading">{{ t('UI_LOADING') }}</div>
  <div v-else-if="adminStore.reports.length === 0" class="empty">{{ t('UI_NO_REPORTS') }}</div>
  <div v-for="r in adminStore.reports" :key="r.id" class="report-item">
    <div><strong>{{ r.category }}</strong> - {{ t('UI_LBL_TYPE') }}: {{ r.target_type }}</div>
    <div>{{ r.reason }}</div>
    <div class="report-meta">{{ t('UI_LBL_REPORTER') }}: {{ r.reporter_name }} | {{ new Date(r.created_at).toLocaleString() }}</div>
    <div class="modal-actions" style="justify-content: flex-start; margin-top: 10px">
      <button class="btn-success" @click="adminStore.resolveReport(r.id, 'resolved')">{{ t('UI_BTN_RESOLVE') }}</button>
      <button class="btn-danger" @click="adminStore.resolveReport(r.id, 'dismissed')">{{ t('UI_BTN_IGNORE') }}</button>
    </div>
  </div>
</template>
