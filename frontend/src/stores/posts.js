import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useApi } from '@/composables/useApi'
import { useToast } from '@/composables/useToast'
import { i18n } from '@/i18n'

/**
 * Feed principal + curtidas + comentários (aninhados/recursivos).
 * Port dos blocos "--- FEED ---", curtidas e "--- COMMENTS ---" do
 * index.html original.
 *
 * `post.showComments` / `post.comments` / `post.newComment` /
 * `post.replyingTo` continuam vivendo como propriedades no próprio objeto
 * do post dentro do array `posts` (mutadas in-place), igual ao original —
 * é o que o PostCard usa via v-model diretamente.
 *
 * confirm()/alert() continuam dentro das actions, no mesmo ponto do fluxo
 * onde estavam no original (algumas dessas ações, como remover amigo, são
 * chamadas por mais de uma view — manter o confirm() aqui evita duplicar
 * essa lógica em cada componente chamador).
 */
export const usePostsStore = defineStore('posts', () => {
  const posts = ref([])
  const loading = ref(false)

  // --- FEED ---
  const loadFeed = async () => {
    const { apiFetch } = useApi()
    loading.value = true
    try {
      const data = await apiFetch('/api/feed')
      posts.value = Array.isArray(data)
        ? data.map((p) => ({ ...p, showComments: false, comments: [], newComment: '', replyingTo: null }))
        : []
    } catch (e) {
      console.error('Failed to load feed:', e)
      posts.value = []
    } finally {
      loading.value = false
    }
  }

  const createPost = async (content, imageBase64) => {
    if (!content.trim() || content.length > 300) return false
    const { apiFetch } = useApi()
    try {
      const payload = { content }
      if (imageBase64) payload.media_base64 = imageBase64
      await apiFetch('/api/posts', { method: 'POST', body: JSON.stringify(payload) })
      await loadFeed()
      return true
    } catch (e) {
      alert(e.message || 'Failed to create post')
      return false
    }
  }

  const deletePost = async (post) => {
    if (!confirm(i18n.global.t('UI_CONFIRM_DELETE'))) return
    const { apiFetch } = useApi()
    const { showToast } = useToast()
    try {
      await apiFetch(`/api/posts/${post.id}`, { method: 'DELETE' })
      posts.value = posts.value.filter((p) => p.id !== post.id)
      showToast(i18n.global.t('MSG_SAVED'))
    } catch (e) {
      alert(e.message || 'Failed to delete post')
    }
  }

  // Optimistic UI, igual ao original.
  const toggleLike = async (post) => {
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

  // --- COMMENTS ---
  const loadComments = async (post) => {
    const { apiFetch } = useApi()
    try {
      const data = await apiFetch(`/api/posts/${post.id}/comments`)
      post.comments = Array.isArray(data)
        ? data.map((c) => ({
            id: c.id,
            author_id: c.author_id,
            author_name: c.author_name || 'Unknown',
            author_avatar: c.author_avatar || '',
            content: c.content,
            created_at: c.created_at,
            parent_id: c.parent_id || null,
            likes: c.likes || 0,
            liked_by_me: c.liked_by_me || false,
          }))
        : []
      post.comments_count = post.comments.length
    } catch (e) {
      console.error('Failed to load comments:', e)
      post.comments = []
    }
  }

  const toggleComments = async (post) => {
    post.showComments = !post.showComments
    if (post.showComments && (!post.comments || post.comments.length === 0)) {
      await loadComments(post)
    }
  }

  // Reduz a lista plana (com parent_id) devolvida pela API numa árvore —
  // o backend não faz essa hierarquia, é montada 100% no cliente.
  const buildCommentTree = (comments) => {
    if (!comments || !Array.isArray(comments)) return []
    const map = {}
    const roots = []

    comments.forEach((c) => {
      map[c.id] = { ...c, replies: [] }
    })

    comments.forEach((c) => {
      if (c.parent_id && map[c.parent_id]) {
        map[c.parent_id].replies.push(map[c.id])
      } else if (!c.parent_id) {
        roots.push(map[c.id])
      } else {
        roots.push(map[c.id])
      }
    })

    return roots
  }

  const setReplyTo = (post, comment) => {
    post.replyingTo = comment
    post.newComment = ''
  }

  const cancelReply = (post) => {
    post.replyingTo = null
  }

  const submitComment = async (post) => {
    if (!post.newComment || !post.newComment.trim() || post.newComment.length > 200) return
    const { apiFetch } = useApi()
    try {
      const payload = { post_id: post.id, content: post.newComment }
      if (post.replyingTo) payload.parent_id = post.replyingTo.id
      await apiFetch('/api/comments', { method: 'POST', body: JSON.stringify(payload) })
      post.newComment = ''
      post.replyingTo = null
      await loadComments(post)
    } catch (e) {
      alert(e.message || 'Failed to submit comment')
    }
  }

  const toggleCommentLike = async (post, comment) => {
    const { apiFetch } = useApi()
    try {
      await apiFetch('/api/comments/like', { method: 'POST', body: JSON.stringify({ comment_id: comment.id }) })
      comment.liked_by_me = !comment.liked_by_me
      comment.likes = comment.liked_by_me ? (comment.likes || 0) + 1 : (comment.likes || 1) - 1
    } catch (e) {
      console.error('Failed to toggle comment like:', e)
    }
  }

  const deleteComment = async (post, comment) => {
    if (!confirm(i18n.global.t('UI_CONFIRM_DELETE'))) return
    const { apiFetch } = useApi()
    try {
      await apiFetch(`/api/comments/${comment.id}`, { method: 'DELETE' })
      await loadComments(post)
    } catch (e) {
      alert(e.message || 'Failed to delete comment')
    }
  }

  return {
    posts, loading,
    loadFeed, createPost, deletePost, toggleLike,
    loadComments, toggleComments, buildCommentTree,
    setReplyTo, cancelReply, submitComment, toggleCommentLike, deleteComment,
  }
})
