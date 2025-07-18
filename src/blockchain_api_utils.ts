import axios from "axios";
import * as types from "./blockchain_api_types";
import { BASE_URL, ENERGY_MULTIPLIER, MAX_QUERIABLE_DAYS, MAX_QUERIABLE_DAYS_AT_ONCE } from "./constants";
import * as cacheClient from "./cache_client";
import { GraphQLError } from "graphql";

export const getBlockByHash = async (hash: string): Promise<types.RawBlock> => {
    const cached = await cacheClient.getCache(types.CachableComponents.Block, hash)
    if (cached) {
        return JSON.parse(cached)
    }

    const { data } = await axios.get(`${BASE_URL}/rawblock/${hash}`)
    await cacheClient.setCache(types.CachableComponents.Block, hash, JSON.stringify(data))
    return data
}

export const getDailyBlocks = async (timestampMs: string): Promise<types.BlockSummary[]> => {
    const cached = await cacheClient.getCache(types.CachableComponents.DailyBlocks, timestampMs);
    if (cached) {
        return JSON.parse(cached);
    }

    const { data } = await axios.get(`${BASE_URL}/blocks/${timestampMs}?format=json`);

    await cacheClient.setCache(types.CachableComponents.DailyBlocks, timestampMs, JSON.stringify(data));
    return data;
};

export const getDailyBlockSummaryFromCache = async (date: string): Promise<types.DailyEnergyUsage | null> => {
    const cached = await cacheClient.getCache(types.CachableComponents.DailySummary, date);
    if (cached) {
        console.log("✅ cache hit for daily summary: ", date);
        return JSON.parse(cached);
    }

    return null;
};

/** Calculates the energy consumption of all the transactions for a given `Block` */
const calculateTheEnergyConsumption = (block: types.RawBlock): types.EnergyPerTransaction[] => {
    if (!block?.tx?.length) return [];

    return block.tx.map(tx => ({
        hash: tx.hash,
        size: tx.size,
        energyKwh: tx.size * ENERGY_MULTIPLIER
    }))
}

/** Converts timestampMs to start-of-day UTC Date object */
export const timestampToDate = (timestampMs: number): Date => {
    const date = new Date(timestampMs)
    date.setUTCHours(0, 0, 0, 0)
    return date
}

/** Converts days ago (number) to Date */
export const daysAgoToTimestamp = (daysAgo: number): number => {
    const now = new Date()
    now.setUTCHours(0, 0, 0, 0)
    now.setUTCDate(now.getUTCDate() - daysAgo)
    return now.getTime()
}

export const getDailyEnergyUsage = async (days: number) => {
    if (days > MAX_QUERIABLE_DAYS) {
        throw new GraphQLError("Maximum queriable days exceeded");
    };

    const existingCachedDays = await cacheClient.getCacheCount(types.CachableComponents.DailySummary);
    if (days > (existingCachedDays + MAX_QUERIABLE_DAYS_AT_ONCE)) {
        throw new GraphQLError("Maximum queriable days once exceeded")
    };

    const dayPromises = Array.from({ length: days }).map(async (_, i) => {
        const timestampMs = daysAgoToTimestamp(i); // Timestamp of the start of the day in MS given the daysAgo number
        const day = timestampToDate(timestampMs); // Date object
        const formattedDay = day.toISOString().slice(0, 10); // YYYY-MM-DD

        // We're skipping to query daily summary cache if we're querying today, because new blocks and transactions might have been added
        if (i > 0) {
            const cached = await getDailyBlockSummaryFromCache(formattedDay)
            if (cached) {
                return cached
            };
        };

        // Get all blocks for that day
        const blocks = await getDailyBlocks(timestampMs.toString())

        // Use parallel requests to query the daily blocks
        const blockEnergyPromises = blocks.map(async (block) => {
            try {
                const blockRes = await getBlockByHash(block.hash)
                const blockEnergyConsumption = calculateTheEnergyConsumption(blockRes)
                return blockEnergyConsumption.reduce((acc, curr) => acc + curr.size, 0)
            } catch (err) {
                console.error(`Failed to fetch block ${block.hash}:`, err)
                return 0
            }
        })

        const byteTotals = await Promise.all(blockEnergyPromises)
        const totalBytes = byteTotals.reduce((sum, val) => sum + val, 0)

        const daySummary = {
            date: formattedDay,
            totalEnergyKwh: totalBytes * ENERGY_MULTIPLIER
        } as types.DailyEnergyUsage

        // Cache the day summary if it's in the past
        if (i > 0) await cacheClient.setCache(types.CachableComponents.DailySummary, formattedDay, JSON.stringify(daySummary));

        return daySummary
    })

    // Run all day requests in parallel
    return Promise.all(dayPromises)
}

export const getEnergyByBlock = async (hash: string) => {
    const block: types.RawBlock = await getBlockByHash(hash)

    return calculateTheEnergyConsumption(block)
}