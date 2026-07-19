import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useApi } from '@/composables/useApi'
import { useToast } from '@/composables/useToast'
import { useProfileStore } from '@/stores/profile'
import { i18n } from '@/i18n'

/**
 * Amizades: lista, pedidos pendentes, busca de usuários. Port do bloco
 * "--- FRIENDS ---" do index.html original.
 *
 * sendFriendRequest/respondFriendRequest/removeFriend também são chamadas a
 * partir do ProfileView (botões de ação no perfil de outra pessoa) — por
 * isso, igual ao original, elas sincronizam profileStore.viewedProfile.friend_status
 * quando o perfil aberto no momento é o alvo da ação.
 */
export const useFriendsStore = defineStore('friends', () => {
  const friends = ref([])
  const pendingRequests = ref([])
  const searchResults = ref([])
  const searchQuery = ref('')
  const searchPerformed = ref(false)

  const loadFriends = async () => {
    const { apiFetch } = useApi()
    try {
      friends.value = await apiFetch('/api/friends')
    } catch (e) {
      console.error('Failed to load friends:', e)
      friends.value = []
    }
  }

  const loadPendingRequests = async () => {
    const { apiFetch } = useApi()
    try {
      pendingRequests.value = await apiFetch('/api/friends/pending')
    } catch (e) {
      console.error('Failed to load pending requests:', e)
      pendingRequests.value = []
    }
  }

  const searchUsers = async () => {
    if (!searchQuery.value.trim()) return
    const { apiFetch } = useApi()
    searchPerformed.value = true
    try {
      searchResults.value = await apiFetch(`/api/users/search?q=${encodeURIComponent(searchQuery.value)}`)
    } catch (e) {
      console.error('Failed to search:', e)
      searchResults.value = []
    }
  }

  const sendFriendRequest = async (toId) => {
    const { apiFetch } = useApi()
    const { showToast } = useToast()
    const profileStore = useProfileStore()
    try {
      await apiFetch('/api/friends/request', { method: 'POST', body: JSON.stringify({ to_id: toId }) })
      showToast(i18n.global.t('MSG_REQ_SENT'))
      if (profileStore.viewedProfile && profileStore.viewedProfile.id === toId) {
        profileStore.viewedProfile.friend_status = 'pending_sent'
      }
    } catch (e) {
      alert(e.message || 'Failed to send request')
    }
  }

  const respondFriendRequest = async (requesterId, action) => {
    const { apiFetch } = useApi()
    const { showToast } = useToast()
    const profileStore = useProfileStore()
    try {
      await apiFetch('/api/friends/respond', { method: 'POST', body: JSON.stringify({ requester_id: requesterId, action }) })
      await loadPendingRequests()
      if (action === 'accept') await loadFriends()
      showToast(action === 'accept' ? i18n.global.t('MSG_FRIEND_ADDED') : i18n.global.t('MSG_REQ_REJECTED'))
      if (profileStore.viewedProfile && profileStore.viewedProfile.id === requesterId) {
        profileStore.viewedProfile.friend_status = action === 'accept' ? 'friend' : 'none'
      }
    } catch (e) {
      alert(e.message || 'Failed to process request')
    }
  }

  const removeFriend = async (friendId) => {
    if (!confirm(i18n.global.t('UI_CONFIRM_REMOVE_FRIEND'))) return
    const { apiFetch } = useApi()
    const { showToast } = useToast()
    const profileStore = useProfileStore()
    try {
      await apiFetch('/api/friends/respond', { method: 'POST', body: JSON.stringify({ requester_id: friendId, action: 'reject' }) })
      await loadFriends()
      showToast(i18n.global.t('MSG_FRIEND_REMOVED'))
      if (profileStore.viewedProfile && profileStore.viewedProfile.id === friendId) {
        profileStore.viewedProfile.friend_status = 'none'
      }
    } catch (e) {
      alert(e.message || 'Failed to remove friend')
    }
  }

  return {
    friends, pendingRequests, searchResults, searchQuery, searchPerformed,
    loadFriends, loadPendingRequests, searchUsers, sendFriendRequest, respondFriendRequest, removeFriend,
  }
})
