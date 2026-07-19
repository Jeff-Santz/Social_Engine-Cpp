<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useLocaleStore } from '@/stores/locale'
import { useNotificationsStore } from '@/stores/notifications'
import NavBar from '@/components/NavBar.vue'
import AuthView from '@/views/AuthView.vue'
import ToastContainer from '@/components/ToastContainer.vue'
import ReportModal from '@/components/ReportModal.vue'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'

// Raiz do app. Replica a estrutura do <div id="app"> original:
// LanguageSwitcher e Toast sempre visíveis (mesmo deslogado); troca entre
// AuthView (tela de login/registro) e o app principal (NavBar + conteúdo
// da rota) é feita pelo mesmo v-if/v-else de isLoggedIn que existia antes
// — só que agora "o conteúdo da rota" é de fato roteado pelo vue-router,
// em vez de currentView.
const authStore = useAuthStore()
const localeStore = useLocaleStore()
const notificationsStore = useNotificationsStore()

onMounted(async () => {
  await localeStore.init()
  if (authStore.checkAuth()) {
    notificationsStore.startPolling()
  }
})

onUnmounted(() => {
  notificationsStore.stopPolling()
})
</script>

<template>
  <LanguageSwitcher />
  <ToastContainer />

  <AuthView v-if="!authStore.isLoggedIn" />
  <div v-else class="container">
    <NavBar />
    <router-view />
  </div>

  <ReportModal />
</template>
