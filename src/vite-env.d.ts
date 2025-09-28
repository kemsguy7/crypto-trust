/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_REAL_MIDNIGHT?: string
  readonly VITE_SYNC_ENABLED?: string
  readonly VITE_SYNC_BASE_URL?: string
  readonly VITE_SYNC_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
