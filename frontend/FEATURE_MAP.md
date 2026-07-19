# Mapa de funcionalidades: index.html original → novo projeto

Confirma onde cada funcionalidade do `frontend/index.html` original (2221 linhas)
foi realocada. Nada foi removido — cada linha abaixo é 1:1 com uma função ou
bloco de template do arquivo original.

## 1. Autenticação (login/registro)
- **Estado + ações:** `src/stores/auth.js` (`login`, `signup`, `logout`, `checkAuth`)
- **UI:** `src/views/AuthView.vue` (login/registro + modal "conta criada, guarde seu ID")
- **Renderizado quando:** `src/App.vue` (`v-if="!authStore.isLoggedIn"`, mesmo lugar de antes)

## 2. Feed de posts com mídia em Base64
- **Estado + ações:** `src/stores/posts.js` (`loadFeed`, `createPost`, `deletePost`)
- **UI:** `src/views/FeedView.vue` (rota `/`) + `src/components/PostComposer.vue` (form
  com upload/preview de imagem) + `src/components/PostCard.vue` (renderização do post)

## 3. Sistema de likes
- Feed: `postsStore.toggleLike` — `src/stores/posts.js`
- Perfil: `profileStore.toggleProfilePostLike` — `src/stores/profile.js`
- Comunidade: `communitiesStore.toggleCommunityPostLike` — `src/stores/communities.js`
- Comentário: `postsStore.toggleCommentLike` — `src/stores/posts.js`
- Todos usam UI otimista (atualiza antes da resposta do servidor, reverte em erro),
  igual ao original.

## 4. Comentários aninhados/recursivos (CommentItem)
- **Componente recursivo:** `src/components/CommentItem.vue` — agora um único `.vue`
  que referencia a si mesmo nativamente (Vue 3.3+), substituindo a dupla-registração
  do original (`components: {CommentItem}` local + `app.component('comment-item', ...)`
  global, que existiam porque o setup sem build step precisava disso).
- **Montagem da árvore a partir da lista plana da API:** `postsStore.buildCommentTree`
  — `src/stores/posts.js` (o backend não devolve hierarquia, isso é 100% client-side,
  igual ao original).
- **Demais ações:** `loadComments`, `toggleComments`, `submitComment`, `setReplyTo`,
  `cancelReply`, `deleteComment` — todas em `src/stores/posts.js`.
- **Usado dentro de:** `src/components/PostCard.vue` (só quando `enable-comments`).

## 5. Comunidades (criação, edição, membros, papéis, posts)
- **Estado + ações:** `src/stores/communities.js` — lista (`loadCommunities`,
  `createCommunity`, `joinCommunity`, `leaveCommunity`), detalhe (`viewCommunity`,
  `joinCommunityDirect`, `leaveCommunityDirect`, `saveCommunity`), membros
  (`loadCommunityMembers`, `changeMemberRole`, `removeMember`, `promoteToAdmin`),
  pedidos de entrada (`loadCommunityRequests`, `approveCommunityRequest`,
  `respondCommunityRequest`), posts (`createCommunityPost`, `toggleCommunityPostLike`)
- **UI lista:** `src/views/CommunitiesView.vue` (rota `/communities`)
- **UI detalhe (papéis Master/Admin/Member, sub-abas posts/membros/pedidos):**
  `src/views/CommunityDetailView.vue` (rota `/communities/:id`)
- **Modal de edição:** `src/components/EditCommunityModal.vue`

## 6. Sistema de amizades (pedidos, aceitar/recusar, busca de usuários)
- **Estado + ações:** `src/stores/friends.js` (`loadFriends`, `loadPendingRequests`,
  `searchUsers`, `sendFriendRequest`, `respondFriendRequest`, `removeFriend`)
- **UI:** `src/views/FriendsView.vue` (rota `/friends`, sub-abas lista/pendentes/busca)
- **Também acionado a partir de:** `src/views/ProfileView.vue` (botões de amizade no
  perfil de outra pessoa) — sincroniza `profileStore.viewedProfile.friend_status`
  depois de cada ação, igual ao original.

## 7. Notificações com polling automático
- **Estado + ações:** `src/stores/notifications.js` (`loadNotifications`, `markAllRead`,
  `handleNotificationClick`, `startPolling`/`stopPolling` — mesmo intervalo de 10s)
- **UI:** `src/views/NotificationsView.vue` (rota `/notifications`), badge de não lidas
  em `src/components/NavBar.vue`
- **Início/parada do polling:** `src/stores/auth.js` (login/logout) e `src/App.vue`
  (sessão restaurada do localStorage no boot) — mesmos pontos de disparo do original.

## 8. Perfis públicos/privados com edição de avatar/capa
- **Perfil visualizado (próprio ou de outros):** `src/stores/profile.js`
  (`viewProfile`, `deleteProfilePost`, `toggleProfilePostLike`)
- **Edição do próprio perfil (bio, privacidade, avatar, capa, exclusão de conta):**
  `src/stores/auth.js` (`saveProfile`, `deleteAccount`)
- **UI:** `src/views/ProfileView.vue` (rota `/profile/:id`) +
  `src/components/EditProfileModal.vue` (upload/preview de avatar e capa, zona de perigo)

## 9. Sistema de denúncias (reports) e painel administrativo
- **Modal de denúncia (post/comentário/usuário), acionável de qualquer lugar:**
  `src/stores/reports.js` + `src/components/ReportModal.vue` (montado 1x em `App.vue`)
- **Painel administrativo (listar/resolver denúncias, só usuário id=1):**
  `src/stores/admin.js` + `src/views/AdminView.vue` (rota `/admin`)
- Segurança preservada: o backend já barra `/api/admin/reports` pra quem não é id=1;
  o front só esconde a aba, igual ao original.

## 10. i18n (PT-BR/EN-US) consumido do backend
- **Migrado para vue-i18n**, mas a fonte dos textos continua 100% o backend:
  `src/stores/locale.js` chama `POST /api/language` + `GET /api/translations` e
  injeta o dicionário recebido em `i18n.global.setLocaleMessage(...)`.
- **Instância vue-i18n + mapeamento de códigos:** `src/i18n/index.js`
- **Seletor de idioma (sempre visível, até deslogado):** `src/components/LanguageSwitcher.vue`
- Nos componentes, `t('CHAVE')` (via `useI18n()`) substitui o `t()` manual do original.

## 11. Toasts de feedback
- **Composable com estado compartilhado:** `src/composables/useToast.js`
  (mesma duração de 3s do original)
- **UI:** `src/components/ToastContainer.vue` (montado 1x em `App.vue`)

## Peça transversal: helper de API
- `function api()` do original → `src/composables/useApi.js` (`useApi().apiFetch`),
  mesmo contrato: header `Authorization: Bearer`, header `ngrok-skip-browser-warning`,
  parse de JSON com fallback pra texto, erro lançado com a mensagem do backend.
- `API_BASE` → mesma variável, agora lida de `import.meta.env.VITE_API_BASE` (`.env`),
  com o mesmo valor do original como default.

## Navegação: currentView → Vue Router
Nenhuma view foi perdida — o mapeamento é 1:1:

| `currentView` (original) | Rota nova              |
|---------------------------|-------------------------|
| `'feed'`                  | `/`                      |
| `'profile'`                | `/profile/:id`           |
| `'communities'`            | `/communities`           |
| `'community'`               | `/communities/:id`       |
| `'friends'`                 | `/friends`                |
| `'notifications'`           | `/notifications`          |
| `'admin'`                   | `/admin`                  |

`goBack()`/`previousView` → `router.back()`. Ver `README.md` para as poucas
diferenças de comportamento que essa troca traz (todas esperadas ao adotar
roteamento de verdade, não bugs).
