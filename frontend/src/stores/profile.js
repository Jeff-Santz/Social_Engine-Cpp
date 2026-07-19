import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useApi } from '@/composables/useApi'
import { useToast } from '@/composables/useToast'
import { i18n } from '@/i18n'

/**
 * Perfil sendo visualizado no momento (pode ser o próprio usuário logado ou
 * outro) — distinto de authStore.currentUser, que é a sessão logada.
 * Port do bloco de estado "Profile View" + viewProfile/deleteProfilePost/
 * toggleProfilePostLike do index.html original.
 *
 * A navegação (antes `currentView.value = 'profile'`) agora é feita via
 * router.push({ name: 'profile', params: { id } }) direto em cada
 * componente que abre um perfil; esta store só cuida dos dados.
 */
export const useProfileStore = defineStore('profile', () => {
  const viewedProfile = ref(null)
  const profilePosts = ref([])
  const profileLoading = ref(false)

  const viewProfile = async (userId) => {
    const { apiFetch } = useApi()
    profileLoading.value = true
    viewedProfile.value = null
    profilePosts.value = []

    try {
      viewedProfile.value = await apiFetch(`/api/users/${userId}`)
      const canSeePosts =
        !viewedProfile.value.is_locked ||
        viewedProfile.value.friend_status === 'friend' ||
        viewedProfile.value.friend_status === 'self'

      if (canSeePosts) {
        const postsData = await apiFetch(`/api/users/${userId}/posts`)
        profilePosts.value = Array.isArray(postsData)
          ? postsData.map((p) => ({ ...p, liked_by_me: p.liked_by_me || false }))
          : []
      }
    } catch (e) {
      console.error('Failed to load profile:', e)
    } finally {
      profileLoading.value = false
    }
  }

  const deleteProfilePost = async (post) => {
    if (!confirm(i18n.global.t('UI_CONFIRM_DELETE'))) return
    const { apiFetch } = useApi()
    const { showToast } = useToast()
    try {
      await apiFetch(`/api/posts/${post.id}`, { method: 'DELETE' })
      profilePosts.value = profilePosts.value.filter((p) => p.id !== post.id)
      showToast(i18n.global.t('MSG_SAVED'))
    } catch (e) {
      alert(e.message || 'Failed to delete post')
    }
  }

  const toggleProfilePostLike = async (post) => {
    const { apiFetch } = useApi()
    const wasLiked = post.liked_by_me
    post.liked_by_me = !wasLiked
    post.likes = wasLiked ? post.likes - 1 : post.likes + 1
    try {
      await apiFetch('/api/likes', { method: 'POST', body: JSON.stringify({ post_id: post.id }) })
    } catch (e) {
      post.liked_by_me = wasLiked
      post.likes = wasLiked ? post.likes + 1 : post.likes - 1
      console.error('Failed to toggle like:', e)
    }
  }

  return {
    viewedProfile, profilePosts, profileLoading,
    viewProfile, deleteProfilePost, toggleProfilePostLike,
  }
})
