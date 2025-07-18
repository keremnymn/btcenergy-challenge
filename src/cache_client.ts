import axios from 'axios'
import { CACHE_SERVER_PORT } from './constants'
import { CachableComponents, CacheCountResponse } from './blockchain_api_types'

const CACHE_URL = `http://localhost:${CACHE_SERVER_PORT}`

export const getCacheCount = async (_type: CachableComponents): Promise<number> => {
    try {
        const { data }: { data: CacheCountResponse } = await axios.get(`${CACHE_URL}/cache/count/${_type}`)
        return data.count ?? 0
    } catch {
        console.warn('Failed to get cache count for ', _type);
        return 0
    }
}

export const getCache = async (_type: CachableComponents, key: string): Promise<string | null> => {
    try {
        const { data } = await axios.get(`${CACHE_URL}/cache/${_type}/${key}`)
        return data.value ?? null
    } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
            // Fail 404 silently because we're returning 404 on cache miss

            if (err.response?.status !== 404) {
                console.warn(`Failed to get cache for ${_type}/${key}:`, err.response?.data || err.message);
            }
        } else {
            console.warn(`Unknown error getting cache for ${_type}/${key}:`, err);
        }
        return null
    }
}

export const setCache = async (_type: CachableComponents, key: string, value: string, ttlMs?: number) => {
    try {
        await axios.post(`${CACHE_URL}/cache/${_type}/${key}`, {
            value,
            ttl: ttlMs
        })
    } catch (e) {
        console.warn(`Failed to set cache for ${_type}/${key}`);
    }
}
