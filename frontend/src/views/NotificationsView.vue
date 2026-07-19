<script setup>
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useNotificationsStore } from '@/stores/notifications'

// Rota "/notifications" (antes currentView === 'notifications').
const { t } = useI18n()
const notificationsStore = useNotificationsStore()

onMounted(() => {
  notificationsStore.loadNotifications()
})
</script>

<template>
  <button class="btn-secondary" style="margin-bottom: 15px" @click="notificationsStore.markAllRead">
    {{ t('UI_BTN_MARK_READ') }}
  </button>

  <div v-if="notificationsStore.loading" class="loading">{{ t('UI_LOADING') }}</div>
  <div v-else-if="notificationsStore.notifications.length === 0" class="empty">{{ t('UI_NO_NOTIFS') }}</div>
  <div
    v-for="notif in notificationsStore.notifications"
    :key="notif.id"
    class="notification"
    :class="notif.is_read ? 'read' : 'unread'"
    @click="notificationsStore.handleNotificationClick(notif)"
  >
    {{ notif.message }}
    <div style="font-size: 11px; color: #666">{{ new Date(notif.created_at).toLocaleString() }}</div>
  </div>
</template>
