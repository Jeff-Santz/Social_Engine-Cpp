import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useApi } from '@/composables/useApi'
import { useToast } from '@/composables/useToast'
import { useNotificationsStore } from '@/stores/notifications'
import { i18n } from '@/i18n'

const defaultUser = () => ({
  id: null, username: '', avatar_url: '', cover_url: '', bio: '', role: '', is_private: false,
})

/**
 * Sessão do usuário logado (login/signup/logout) + edição do próprio perfil.
 * Port do bloco "--- AUTH ---" / "--- PROFILE EDIT ---" do index.html original.
 */
export const useAuthStore = defineStore('auth', () => {
  // --- STATE ---
  const currentUser = ref(defaultUser())
  const token = ref('')
  const isLoggedIn = ref(false)
  const loading = ref(false)
  const authError = ref('')
  const authSuccess = ref('') // mantido por paridade: também não era usado no original
  const showSignupModal = ref(false)
  const signupUserId = ref(null)

  // --- AUTH ---
  const login = async (identifier, password) => {
    if (!identifier || !password) {
      authError.value = i18n.global.t('ERR_MISSING')
      return false
    }
    const { apiFetch } = useApi()
    loading.value = true
    authError.value = ''
    try {
      const data = await apiFetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      })
      token.value = data.token
      currentUser.value = {
        id: data.id,
        username: data.username,
        avatar_url: data.avatar_url || '',
        cover_url: data.cover_url || '',
        bio: data.bio || '',
        role: data.role || '',
        is_private: data.is_private || false,
      }
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(currentUser.value))
      isLoggedIn.value = true
      useNotificationsStore().startPolling()
      return true
    } catch (e) {
      authError.value = e.message || i18n.global.t('ERR_AUTH_FAILED')
      return false
    } finally {
      loading.value = false
    }
  }

  const signup = async (payload) => {
    if (!payload.username || !payload.email || !payload.password) {
      authError.value = i18n.global.t('ERR_MISSING')
      return false
    }
    const { apiFetch } = useApi()
    loading.value = true
    authError.value = ''
    try {
      const data = await apiFetch('/api/signup', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      signupUserId.value = data.id
      showSignupModal.value = true
      return true
    } catch (e) {
      authError.value = e.message || i18n.global.t('ERR_SIGNUP')
      return false
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    token.value = ''
    currentUser.value = defaultUser()
    isLoggedIn.value = false
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    useNotificationsStore().stopPolling()
  }

  // Restaura sessão salva (equivalente ao checkAuth() original, chamado no
  // onMounted do App.vue). Continua usando localStorage — ver nota no README
  // sobre a divergência com "guardado em memória" do prompt.
  const checkAuth = () => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (savedToken && savedUser) {
      token.value = savedToken
      currentUser.value = JSON.parse(savedUser)
      isLoggedIn.value = true
      return true
    }
    return false
  }

  // --- EDITAR PERFIL PRÓPRIO ---
  // formData: { bio, is_private, email?, avatarBase64?, coverBase64?, avatarPreview?, coverPreview? }
  const saveProfile = async (formData) => {
    const { apiFetch } = useApi()
    const { showToast } = useToast()
    const payload = { bio: formData.bio, is_private: formData.is_private }
    if (formData.email) payload.email = formData.email
    if (formData.avatarBase64) payload.avatar_base64 = formData.avatarBase64
    if (formData.coverBase64) payload.cover_base64 = formData.coverBase64

    try {
      await apiFetch('/api/profile', { method: 'PUT', body: JSON.stringify(payload) })

      currentUser.value.bio = formData.bio
      currentUser.value.is_private = formData.is_private
      // Preserva o comportamento (e a peculiaridade) original: o avatar/capa
      // passam a apontar pro preview base64 local até o próximo fetch real
      // do perfil — ver observação no README.
      if (formData.avatarPreview) currentUser.value.avatar_url = formData.avatarPreview
      if (formData.coverPreview) currentUser.value.cover_url = formData.coverPreview

      localStorage.setItem('user', JSON.stringify(currentUser.value))
      showToast(i18n.global.t('MSG_PROFILE_UPDATED'))
      return true
    } catch (e) {
      alert(e.message || 'Failed to save profile')
      return false
    }
  }

  const deleteAccount = async () => {
    if (!confirm(i18n.global.t('UI_CONFIRM_DELETE'))) return false
    if (!confirm('This is permanent. Type OK to confirm')) return false
    const { apiFetch } = useApi()
    const { showToast } = useToast()
    try {
      await apiFetch('/api/user', { method: 'DELETE' })
      showToast(i18n.global.t('MSG_USER_DELETED'))
      logout()
      return true
    } catch (e) {
      alert(e.message || 'Failed to delete account')
      return false
    }
  }

  return {
    currentUser, token, isLoggedIn, loading, authError, authSuccess,
    showSignupModal, signupUserId,
    login, signup, logout, checkAuth, saveProfile, deleteAccount,
  }
})
