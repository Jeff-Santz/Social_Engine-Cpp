import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useApi } from '@/composables/useApi'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { i18n } from '@/i18n'

/**
 * Comunidades: lista, criação, comunidade em visualização (posts, membros,
 * papéis Master/Admin/Member, pedidos de entrada). Port dos blocos
 * "--- COMMUNITIES ---" do index.html original.
 *
 * Importante: não existe endpoint de "buscar 1 comunidade por id" no
 * backend — por isso viewCommunity() busca a lista inteira e filtra no
 * cliente, exatamente como o original fazia (não inventei um endpoint novo).
 */
export const useCommunitiesStore = defineStore('communities', () => {
  const communities = ref([])
  const loading = ref(false)

  const viewedCommunity = ref(null)
  const communityPosts = ref([])
  const communityMembers = ref([])
  const communityRequests = ref([])
  const communityLoading = ref(false)

  const loadCommunities = async () => {
    const { apiFetch } = useApi()
    const authStore = useAuthStore()
    loading.value = true
    try {
      const data = await apiFetch('/api/communities')
      const memberships = await Promise.all(
        data.map(async (c) => {
          try {
            const members = await apiFetch(`/api/communities/${c.id}/members`)
            return members.some((m) => m.id === authStore.currentUser.id)
          } catch {
            return false
          }
        }),
      )
      communities.value = data.map((c, i) => ({ ...c, isMember: memberships[i], joinStatus: null }))
    } catch (e) {
      console.error('Failed to load communities:', e)
      communities.value = []
    } finally {
      loading.value = false
    }
  }

  const createCommunity = async (payload) => {
    if (!payload.name.trim()) return false
    const { apiFetch } = useApi()
    const { showToast } = useToast()
    try {
      await apiFetch('/api/communities', { method: 'POST', body: JSON.stringify(payload) })
      await loadCommunities()
      showToast(i18n.global.t('MSG_COMM_CREATED'))
      return true
    } catch (e) {
      alert(e.message || 'Failed to create community')
      return false
    }
  }

  // Usada na lista de comunidades (comm.isMember / comm.joinStatus)
  const joinCommunity = async (comm) => {
    const { apiFetch } = useApi()
    const { showToast } = useToast()
    try {
      const res = await apiFetch('/api/communities/request', {
        method: 'POST',
        body: JSON.stringify({ community_id: comm.id }),
      })
      if (res === 'JOINED_DIRECTLY' || (typeof res === 'string' && res.includes('JOINED'))) {
        comm.isMember = true
        comm.members++
        comm.joinStatus = null
        showToast(i18n.global.t('MSG_COMM_JOINED'))
      } else if (res === 'REQUEST_SENT' || (typeof res === 'string' && res.includes('REQUEST'))) {
        comm.joinStatus = 'pending'
        showToast(i18n.global.t('MSG_REQ_SENT'))
      } else {
        showToast(i18n.global.t('MSG_COMM_JOINED'))
        comm.isMember = true
      }
    } catch (e) {
      alert(e.message || 'Failed to join community')
    }
  }

  const leaveCommunity = async (comm) => {
    if (!confirm(i18n.global.t('UI_CONFIRM_LEAVE'))) return
    const { apiFetch } = useApi()
    try {
      await apiFetch('/api/communities/leave', { method: 'POST', body: JSON.stringify({ community_id: comm.id }) })
      comm.isMember = false
      comm.members--
      comm.joinStatus = null
    } catch (e) {
      alert(e.message || 'Failed to leave community')
    }
  }

  // Usadas na página de detalhe (viewedCommunity.am_i_member, etc.)
  const joinCommunityDirect = async (comm) => {
    await joinCommunity(comm)
    if (comm.isMember) comm.am_i_member = true
  }

  const leaveCommunityDirect = async (comm) => {
    if (!confirm(i18n.global.t('UI_CONFIRM_LEAVE'))) return
    const { apiFetch } = useApi()
    try {
      await apiFetch('/api/communities/leave', { method: 'POST', body: JSON.stringify({ community_id: comm.id }) })
      comm.am_i_member = false
      comm.am_i_admin = false
      comm.am_i_master = false
      comm.joinStatus = null
    } catch (e) {
      alert(e.message || 'Failed to leave community')
    }
  }

  const viewCommunity = async (commId) => {
    const { apiFetch } = useApi()
    const authStore = useAuthStore()
    communityLoading.value = true
    viewedCommunity.value = null
    communityPosts.value = []
    communityMembers.value = []
    communityRequests.value = []

    try {
      const commList = await apiFetch('/api/communities')
      const comm = commList.find((c) => c.id === commId)
      if (comm) {
        viewedCommunity.value = { ...comm, am_i_member: false, am_i_admin: false, am_i_master: false, joinStatus: null }
      }

      try {
        communityPosts.value = await apiFetch(`/api/communities/${commId}/posts?viewer=${authStore.currentUser.id}`)
      } catch (e) {
        communityPosts.value = []
      }

      const members = await apiFetch(`/api/communities/${commId}/members`)
      const myMembership = members.find((m) => m.id === authStore.currentUser.id)
      if (myMembership) {
        viewedCommunity.value.am_i_member = true
        viewedCommunity.value.am_i_admin = myMembership.role <= 2 // Master=1, Admin=2
        viewedCommunity.value.am_i_master = myMembership.role === 1
      }
    } catch (e) {
      console.error('Failed to load community:', e)
    } finally {
      communityLoading.value = false
    }
  }

  const loadCommunityMembers = async () => {
    if (!viewedCommunity.value) return
    const { apiFetch } = useApi()
    try {
      communityMembers.value = await apiFetch(`/api/communities/${viewedCommunity.value.id}/members`)
    } catch (e) {
      console.error('Failed to load members:', e)
      communityMembers.value = []
    }
  }

  const loadCommunityRequests = async () => {
    if (!viewedCommunity.value) return
    const { apiFetch } = useApi()
    try {
      communityRequests.value = await apiFetch(`/api/communities/${viewedCommunity.value.id}/requests`)
    } catch (e) {
      console.error('Failed to load requests:', e)
      communityRequests.value = []
    }
  }

  const approveCommunityRequest = async (userId) => {
    const { apiFetch } = useApi()
    const { showToast } = useToast()
    const authStore = useAuthStore()
    try {
      await apiFetch('/api/communities/approve', {
        method: 'POST',
        body: JSON.stringify({ community_id: viewedCommunity.value.id, user_id: userId, admin_id: authStore.currentUser.id }),
      })
      await loadCommunityRequests()
      await loadCommunityMembers()
      showToast(i18n.global.t('MSG_REQ_ACCEPTED'))
    } catch (e) {
      alert(e.message || 'Failed to approve request')
    }
  }

  const respondCommunityRequest = async (userId, action) => {
    const { apiFetch } = useApi()
    const { showToast } = useToast()
    try {
      await apiFetch('/api/communities/respond_request', {
        method: 'POST',
        body: JSON.stringify({ community_id: viewedCommunity.value.id, user_id: userId, action }),
      })
      await loadCommunityRequests()
      if (action === 'accept') await loadCommunityMembers()
      showToast(action === 'accept' ? i18n.global.t('MSG_REQ_ACCEPTED') : i18n.global.t('MSG_REQ_REJECTED'))
    } catch (e) {
      alert(e.message || 'Failed to process request')
    }
  }

  const promoteToAdmin = async (userId) => {
    const { apiFetch } = useApi()
    const { showToast } = useToast()
    try {
      await apiFetch('/api/communities/role', {
        method: 'POST',
        body: JSON.stringify({ community_id: viewedCommunity.value.id, target_id: userId, new_role: 2 }),
      })
      await loadCommunityMembers()
      showToast(i18n.global.t('MSG_ROLE_UPDATED'))
    } catch (e) {
      alert(e.message || 'Failed to promote')
    }
  }

  const changeMemberRole = async (userId, newRole) => {
    const { apiFetch } = useApi()
    const { showToast } = useToast()
    try {
      await apiFetch('/api/communities/role', {
        method: 'POST',
        body: JSON.stringify({ community_id: viewedCommunity.value.id, target_id: userId, new_role: parseInt(newRole) }),
      })
      await loadCommunityMembers()
      showToast(i18n.global.t('MSG_ROLE_UPDATED'))
    } catch (e) {
      alert(e.message || 'Failed to change role')
    }
  }

  const removeMember = async (userId) => {
    if (!confirm(i18n.global.t('UI_CONFIRM_REMOVE'))) return
    const { apiFetch } = useApi()
    const { showToast } = useToast()
    const authStore = useAuthStore()
    try {
      await apiFetch('/api/communities/remove_member', {
        method: 'POST',
        body: JSON.stringify({ community_id: viewedCommunity.value.id, admin_id: authStore.currentUser.id, target_id: userId }),
      })
      await loadCommunityMembers()
      showToast(i18n.global.t('MSG_MEMBER_REMOVED'))
    } catch (e) {
      alert(e.message || 'Failed to remove member')
    }
  }

  const createCommunityPost = async (content, imageBase64) => {
    if (!content.trim() || !viewedCommunity.value || content.length > 300) return false
    const { apiFetch } = useApi()
    const authStore = useAuthStore()
    try {
      const payload = { content, community_id: viewedCommunity.value.id }
      if (imageBase64) payload.media_base64 = imageBase64
      await apiFetch('/api/posts', { method: 'POST', body: JSON.stringify(payload) })
      communityPosts.value = await apiFetch(`/api/communities/${viewedCommunity.value.id}/posts?viewer=${authStore.currentUser.id}`)
      return true
    } catch (e) {
      alert(e.message || 'Failed to create post')
      return false
    }
  }

  const saveCommunity = async (formData) => {
    if (!viewedCommunity.value) return false
    const { apiFetch } = useApi()
    const { showToast } = useToast()
    try {
      await apiFetch(`/api/communities/${viewedCommunity.value.id}`, {
        method: 'PUT',
        body: JSON.stringify({ description: formData.description, is_private: formData.is_private }),
      })
      viewedCommunity.value.description = formData.description
      viewedCommunity.value.is_private = formData.is_private
      showToast(i18n.global.t('MSG_SAVED'))
      return true
    } catch (e) {
      alert(e.message || 'Failed to save')
      return false
    }
  }

  const toggleCommunityPostLike = async (post) => {
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
    communities, loading,
    viewedCommunity, communityPosts, communityMembers, communityRequests, communityLoading,
    loadCommunities, createCommunity, joinCommunity, leaveCommunity,
    joinCommunityDirect, leaveCommunityDirect, viewCommunity,
    loadCommunityMembers, loadCommunityRequests, approveCommunityRequest, respondCommunityRequest,
    promoteToAdmin, changeMemberRole, removeMember, createCommunityPost, saveCommunity,
    toggleCommunityPostLike,
  }
})
