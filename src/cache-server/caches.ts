import { LRUCache } from 'lru-cache'
import { BLOCK_CACHE_SIZE, BLOCK_SUMMARY_CACHE_SIZE, DAILY_SUMMARY_CACHE_SIZE, TTL_24_HRS } from '../constants';

export const blockCache = new LRUCache<string, string>({
    max: BLOCK_CACHE_SIZE,
    ttl: TTL_24_HRS,
})

export const blocksSummaryCache = new LRUCache<string, string>({
    max: BLOCK_SUMMARY_CACHE_SIZE,
    ttl: TTL_24_HRS,
})

export const dailySummaryCache = new LRUCache<string, string>({
    max: DAILY_SUMMARY_CACHE_SIZE,
    ttl: TTL_24_HRS,
})