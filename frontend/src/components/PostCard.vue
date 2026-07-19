<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { usePostsStore } from '@/stores/posts'
import { useReportsStore } from '@/stores/reports'
import { API_BASE } from '@/composables/useApi'
import CommentItem from './CommentItem.vue'

/**
 * Card de post reutilizado em 3 contextos que, no index.html original,
 * tinham cada um seu próprio bloco de template quase-idêntico:
 *   - Feed:      tag de comunidade OU localização, deletar, comentários, denunciar
 *   - Profile:   data, deletar, SEM comentários/denunciar, autor não é link
 *   - Community: data, SEM deletar, SEM comentários/denunciar
 * As diferenças viram props; deletar/curtir são emitidos pro componente pai
 * decidir qual store chamar (postsStore/profileStore/communitiesStore têm
 * cada uma sua própria versão dessas ações, herdada do original).
 */
const props = defineProps({
  post: { type: Object, required: true },
  clickableAuthor: { type: Boolean, default: true },
  authorLabel: { type: String, default: null }, // Profile usa o username fixo do perfil, não post.author_name
  showCommunityContext: { type: Boolean, default: false }, // Feed: tag de comunidade OU localização
  showDate: { type: Boolean, default: false }, // Profile/Community: data do post
  enableDelete: { type: Boolean, default: true }, // ainda validado por permissão abaixo
  enableComments: { type: Boolean, default: false }, // só Feed
  enableReport: { type: Boolean, default: false }, // só Feed
})

const emit = defineEmits(['delete', 'toggle-like'])

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const postsStore = usePostsStore()
const reportsStore = useReportsStore()

const canDelete = computed(
  () => props.enableDelete && (props.post.author_id === authStore.currentUser.id || authStore.currentUser.id === 1),
)

const goToAuthor = (id) => {
  if (props.clickableAuthor) router.push({ name: 'profile', params: { id } })
}
const goToCommunity = (id) => router.push({ name: 'community', params: { id } })
</script>

<template>
  <div class="card">
    <div class="post-header">
      <div>
        <div
          v-if="showCommunityContext && post.community_id > 0"
          class="community-tag"
          @click="goToCommunity(post.community_id)"
        >
          {{ post.community_name }}
        </div>
        <div>
          <span
            class="post-author"
            :style="{ cursor: clickableAuthor ? 'pointer' : 'default' }"
            @click="goToAuthor(post.author_id)"
          >{{ authorLabel || post.author_name }}</span>
        </div>
        <div v-if="showCommunityContext && !post.community_id" class="post-origin">{{ post.location }}</div>
        <div v-if="showDate" class="post-origin">{{ post.date || post.created_at }}</div>
      </div>
      <button v-if="canDelete" class="btn-danger post-delete-btn" @click="emit('delete', post)">{{ t('UI_BTN_DELETE') }}</button>
    </div>

    <div class="post-content">{{ post.content }}</div>
    <img v-if="post.media_url" :src="API_BASE + post.media_url" class="post-media" />

    <div class="post-actions">
      <button :class="{ liked: post.liked_by_me }" @click="emit('toggle-like', post)">
        &hearts; <span :class="{ 'likes-count': post.liked_by_me }">{{ post.likes }}</span>
      </button>
      <button v-if="enableComments" @click="postsStore.toggleComments(post)">
        {{ t('UI_BTN_COMMENTS') }} ({{ post.comments_count || 0 }})
      </button>
      <button v-if="enableReport" class="btn-secondary" @click="reportsStore.open('post', post.id)">{{ t('UI_BTN_REPORT') }}</button>
    </div>

    <div v-if="enableComments && post.showComments" class="comments-section">
      <div v-if="post.replyingTo" class="reply-indicator">
        <span>{{ t('UI_LBL_REPLYING_TO') }} {{ post.replyingTo.author_name }}</span>
        <button @click="postsStore.cancelReply(post)">&#10005;</button>
      </div>
      <div class="form-group">
        <textarea v-model="post.newComment" :placeholder="t('UI_PLACEHOLDER_COMMENT')" maxlength="200"></textarea>
        <button class="btn-primary" @click="postsStore.submitComment(post)">{{ t('UI_BTN_COMMENT_ACTION') }}</button>
      </div>
      <div v-if="post.comments && post.comments.length > 0">
        <CommentItem
          v-for="comment in postsStore.buildCommentTree(post.comments)"
          :key="comment.id"
          :comment="comment"
          :post="post"
          :depth="0"
          @reply="postsStore.setReplyTo(post, $event)"
          @like="postsStore.toggleCommentLike(post, $event)"
          @delete="postsStore.deleteComment(post, $event)"
          @report="reportsStore.open('comment', $event)"
          @view-profile="goToAuthor"
        />
      </div>
      <div v-else class="empty">{{ t('UI_NO_COMMENTS') }}</div>
    </div>
  </div>
</template>
