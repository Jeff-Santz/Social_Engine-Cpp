<script setup>
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePostsStore } from '@/stores/posts'
import PostComposer from '@/components/PostComposer.vue'
import PostCard from '@/components/PostCard.vue'

// Rota "/" (antes currentView === 'feed'). Port do bloco FEED do template
// original.
const { t } = useI18n()
const postsStore = usePostsStore()

onMounted(() => {
  postsStore.loadFeed()
})
</script>

<template>
  <PostComposer :on-submit="postsStore.createPost" />

  <div v-if="postsStore.loading" class="loading">{{ t('UI_LOADING') }}</div>
  <div v-else-if="postsStore.posts.length === 0" class="empty">{{ t('UI_NO_POSTS') }}</div>
  <PostCard
    v-for="post in postsStore.posts"
    :key="post.id"
    :post="post"
    show-community-context
    enable-comments
    enable-report
    @delete="postsStore.deletePost"
    @toggle-like="postsStore.toggleLike"
  />
</template>
