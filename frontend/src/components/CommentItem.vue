<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'

// Comentário recursivo/aninhado. No Vue 3.3+, um SFC com <script setup>
// pode se referenciar dentro do próprio template (<CommentItem> aqui
// embaixo) sem registro manual — substitui a dupla-registração
// (local + app.component('comment-item', ...)) que o index.html original
// precisava sob o setup sem build step.
const props = defineProps({
  comment: { type: Object, required: true },
  post: { type: Object, required: true },
  depth: { type: Number, default: 0 },
})
const emit = defineEmits(['reply', 'like', 'delete', 'report', 'view-profile'])

const { t } = useI18n()
const authStore = useAuthStore()

const depthClass = computed(() => `depth-${Math.min(props.depth, 3)}`)
const canDelete = computed(
  () => props.comment.author_id === authStore.currentUser.id || props.post.author_id === authStore.currentUser.id,
)
const canReport = computed(() => props.comment.author_id !== authStore.currentUser.id)
const formattedDate = computed(() => new Date(props.comment.created_at).toLocaleString())
</script>

<template>
  <div class="comment" :class="depthClass">
    <div class="comment-header">
      <span class="comment-author" @click="emit('view-profile', comment.author_id)">{{ comment.author_name }}</span>
      <span>{{ formattedDate }}</span>
    </div>
    <div>{{ comment.content }}</div>
    <div class="comment-actions">
      <button :class="{ liked: comment.liked_by_me }" @click="emit('like', comment)">
        &hearts; <span :class="{ 'likes-count': comment.liked_by_me }">{{ comment.likes || 0 }}</span>
      </button>
      <button @click="emit('reply', comment)">{{ t('UI_BTN_REPLY') }}</button>
      <button v-if="canDelete" class="btn-danger post-delete-btn" @click="emit('delete', comment)">{{ t('UI_BTN_DELETE') }}</button>
      <button v-if="canReport" class="btn-secondary post-delete-btn" @click="emit('report', comment.id)">{{ t('UI_BTN_REPORT') }}</button>
    </div>
    <div v-if="comment.replies && comment.replies.length > 0">
      <CommentItem
        v-for="reply in comment.replies"
        :key="reply.id"
        :comment="reply"
        :post="post"
        :depth="depth + 1"
        @reply="emit('reply', $event)"
        @like="emit('like', $event)"
        @delete="emit('delete', $event)"
        @report="emit('report', $event)"
        @view-profile="emit('view-profile', $event)"
      />
    </div>
  </div>
</template>
