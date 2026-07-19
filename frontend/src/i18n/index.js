import { createI18n } from 'vue-i18n'

// O backend (Core::Translation) não fala em códigos de idioma tipo "pt-BR":
// ele usa um enum numérico (Core::Language: EN_US=0, PT_BR=1) e devolve um
// dicionário chave->texto plano via GET /api/translations, sempre no idioma
// que estiver setado no singleton do servidor no momento (POST /api/language
// troca esse singleton globalmente). Esse mapeamento numérico é o mesmo que
// o <select> do index.html original já usava:
//   <option :value="1">PT-BR</option>  <option :value="0">EN-US</option>
export const LANG_CODE_TO_LOCALE = { 0: 'en-US', 1: 'pt-BR' }
export const LOCALE_TO_LANG_CODE = { 'en-US': 0, 'pt-BR': 1 }
export const DEFAULT_LANG_CODE = 1 // PT-BR, igual ao original (initialLang default = 1)

export const i18n = createI18n({
  legacy: false, // Composition API (useI18n) em vez do modo Options
  locale: LANG_CODE_TO_LOCALE[DEFAULT_LANG_CODE],
  fallbackLocale: false,
  messages: {},
  // Replica o comportamento do `t()` original:
  //   const t = (key) => translations.value[key] || `[${key}]`
  // vue-i18n chama `missing` quando a chave não existe no dicionário carregado.
  missing: (locale, key) => `[${key}]`,
  missingWarn: false,
  fallbackWarn: false,
})
