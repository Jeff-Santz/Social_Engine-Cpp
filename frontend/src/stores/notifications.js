import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useApi } from '@/composables/useApi'
import { useToast } from '@/composables/useToast'
import { i18n } from '@/i18n'
import router from '@/router'

/**
 * Notificações + polling automático (10s). Port do bloco
 * "--- NOTIFICATIONS ---" do index.html original.
 */
export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref([])
  const loading = ref(false)
  const unreadCount = computed(() => notifications.value.filter((n) => !n.is_read).length)

  let pollInterval = null
  let lastUnreadCount = 0

  const loadNotifications = async () => {
    const { apiFetch } = useApi()
    loading.value = true
    try {
      const data = await apiFetch('/api/notifications')
      notifications.value = Array.isArray(data) ? data : []
    } catch (e) {
      console.error('Failed to load notifications:', e)
      notifications.value = []
    } finally {
      loading.value = false
    }
  }

  const markAllRead = async () => {
    const { apiFetch } = useApi()
    try {
      await apiFetch('/api/notifications/read', { method: 'POST' })
      notifications.value.forEach((n) => (n.is_read = true))
    } catch (e) {
      console.error('Failed to mark as read:', e)
    }
  }

  // Navegação simples: post -> feed, ator -> perfil do ator. Não faz
  // deep-link pro post específico — igual ao original.
  const handleNotificationClick = (notif) => {
    notif.is_read = true
    if (notif.post_id) {
      router.push({ name: 'feed' })
    } else if (notif.actor_id) {
      router.push({ name: 'profile', params: { id: notif.actor_id } })
    }
  }

  const startPolling = () => {
    const { apiFetch } = useApi()
    const { showToast } = useToast()
    lastUnreadCount = 0
    pollInterval = setInterval(async () => {
      try {
        const data = await apiFetch('/api/notifications')
        if (Array.isArray(data)) {
          const newUnread = data.filter((n) => !n.is_read).length
          if (newUnread > lastUnreadCount && lastUnreadCount > 0) {
            showToast(i18n.global.t('MSG_NEW_NOTIF'))
          }
          lastUnreadCount = newUnread
          notifications.value = data
        }
      } catch (e) {
        // Silencioso, igual ao original (falha de rede não deve gerar ruído).
      }
    }, 10000)
  }

  const stopPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
  }

  return {
    notifications, loading, unreadCount,
    loadNotifications, markAllRead, handleNotificationClick, startPolling, stopPolling,
  }
})
