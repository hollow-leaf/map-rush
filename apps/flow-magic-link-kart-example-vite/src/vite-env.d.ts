/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_MAGIC_API_KEY: string
    readonly VITE_BLOCKCHAIN_NETWORK: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
