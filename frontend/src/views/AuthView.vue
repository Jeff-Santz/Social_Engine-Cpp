<script setup>
import { reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useLocaleStore } from '@/stores/locale'
import BaseModal from '@/components/BaseModal.vue'

// Tela de login/registro (renderizada pelo App.vue quando !isLoggedIn, não
// é uma "rota" — igual ao original, onde isso era um v-if de topo, não um
// valor de currentView). Port do bloco ".auth-box" + modal de signup.
const { t } = useI18n()
const authStore = useAuthStore()
const localeStore = useLocaleStore()

const isLoginView = ref(true)
const loginForm = reactive({ identifier: '', password: '' })
const signupForm = reactive({ username: '', email: '', password: '', state: '', city: '' })

// No original, changeLanguage() limpava signupForm.state/city direto (mesmo
// escopo do setup()). Como o form agora vive aqui e o idioma vive em
// localeStore, replicamos com um watch.
watch(
  () => localeStore.currentLang,
  () => {
    signupForm.state = ''
    signupForm.city = ''
  },
)

const toggleView = () => {
  isLoginView.value = !isLoginView.value
  authStore.authError = ''
}

const handleLogin = () => authStore.login(loginForm.identifier, loginForm.password)

const handleSignup = async () => {
  const payload = { username: signupForm.username, email: signupForm.email, password: signupForm.password }
  if (signupForm.state) payload.state = signupForm.state
  if (signupForm.city) payload.city = signupForm.city
  const ok = await authStore.signup(payload)
  if (ok) {
    signupForm.username = ''
    signupForm.email = ''
    signupForm.password = ''
    signupForm.state = ''
    signupForm.city = ''
  }
}

const closeSignupModal = () => {
  authStore.showSignupModal = false
  isLoginView.value = true
}
</script>

<template>
  <div class="auth-box">
    <h2>{{ isLoginView ? t('UI_TITLE_LOGIN') : t('UI_BTN_SIGNUP') }}</h2>

    <div v-if="isLoginView">
      <div class="form-group">
        <label>{{ t('UI_LBL_ID') }}</label>
        <input v-model="loginForm.identifier" type="text" />
      </div>
      <div class="form-group">
        <label>{{ t('UI_LBL_PASS') }}</label>
        <input v-model="loginForm.password" type="password" @keyup.enter="handleLogin" />
      </div>
      <button class="btn-primary" style="width: 100%" :disabled="authStore.loading" @click="handleLogin">
        {{ t('UI_BTN_LOGIN') }}
      </button>
    </div>

    <div v-else>
      <div class="form-group">
        <label>{{ t('UI_LBL_USERNAME') }}</label>
        <input v-model="signupForm.username" type="text" />
      </div>
      <div class="form-group">
        <label>{{ t('UI_LBL_EMAIL') }}</label>
        <input v-model="signupForm.email" type="email" />
      </div>
      <div class="form-group">
        <label>{{ t('UI_LBL_PASS') }}</label>
        <input v-model="signupForm.password" type="password" />
      </div>
      <div class="form-group">
        <label>{{ t('UI_LBL_STATE') }}</label>
        <select v-model="signupForm.state" @change="localeStore.loadCities(signupForm.state)">
          <option value="">{{ t('UI_SELECT') }}</option>
          <option v-for="s in localeStore.serverStates" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>
      <div class="form-group">
        <label>{{ t('UI_LBL_CITY') }}</label>
        <select v-model="signupForm.city">
          <option value="">{{ t('UI_SELECT') }}</option>
          <option v-for="c in localeStore.serverCities" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>
      <button class="btn-primary" style="width: 100%" :disabled="authStore.loading" @click="handleSignup">
        {{ t('UI_BTN_SIGNUP') }}
      </button>
    </div>

    <div v-if="authStore.authError" class="error">{{ authStore.authError }}</div>

    <div class="auth-toggle">
      <a @click="toggleView">{{ isLoginView ? t('UI_BTN_REGISTER_LINK') : t('UI_BTN_LOGIN_LINK') }}</a>
    </div>
  </div>

  <BaseModal :show="authStore.showSignupModal" @close="closeSignupModal">
    <h3>{{ t('MSG_CREATED') }}</h3>
    <p>{{ t('UI_LBL_YOUR_ID') }}: <strong>{{ authStore.signupUserId }}</strong></p>
    <p>{{ t('UI_MSG_SAVE_ID') }}</p>
    <button class="btn-primary" style="width: 100%" @click="closeSignupModal">{{ t('UI_BTN_OK') }}</button>
  </BaseModal>
</template>
