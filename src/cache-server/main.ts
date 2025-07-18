// cache-server.ts
import express from 'express'
import { CachableComponents } from '../blockchain_api_types'
import * as caches from "./caches";
import { CACHE_SERVER_PORT, TTL_24_HRS } from '../constants';

const app = express()
app.use(express.json({ limit: '10mb' })) // WATCH OUT, since this is a mock cache server, JS might die due to exceeding memory error.

const getCacheObject = (type: CachableComponents) => {
    switch (type) {
        case CachableComponents.Block:
            return caches.blockCache
        case CachableComponents.DailyBlocks:
            return caches.blocksSummaryCache
        case CachableComponents.DailySummary:
            return caches.dailySummaryCache
    }
}

// GET cache key count
app.get('/cache/count/:type', (req, res) => {
    const { type } = req.params
    console.log("cache count requested for: ", type);
    const cache = getCacheObject(type as CachableComponents)
    if (!cache) return res.status(400).json({ error: 'Invalid cache type' })

    res.json({ count: cache.size })
})

// GET cache
app.get('/cache/:type/:key', (req, res) => {
    const { type, key } = req.params
    const cache = getCacheObject(type as CachableComponents);
    const value = cache.get(key)
    if (value === undefined) return res.status(404).end()
    res.json({ value })
})

// SET cache
app.post('/cache/:type/:key', (req, res) => {
    const { type, key } = req.params
    const cache = getCacheObject(type as CachableComponents)
    const { value, ttl } = req.body
    cache.set(key, value, { ttl: ttl ?? TTL_24_HRS })
    res.status(200).end()
})

app.listen(CACHE_SERVER_PORT, () => {
    console.log(`🧠 Cache server running on http://localhost:${CACHE_SERVER_PORT}`)
})
