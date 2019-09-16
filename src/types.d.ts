import { KVNamespace } from '@cloudflare/workers-types'

declare global {
  const myKVNamespace: KVNamespace
}

interface DiffImageRequest {
	imgOne: string;
	imgTwo: string;
}