import { Redis } from '@upstash/redis'
import { readDB as readLocalDB, writeDB as writeLocalDB } from './db'

/**
 * Robust Database Layer for Global Synchronization.
 * Prioritizes Redis in production (Vercel) and local file storage otherwise.
 */

// Fallback check for different env var names
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_TOKEN;
const isVercel = !!process.env.VERCEL;

// Global storage key
const DB_KEY = 'nachshon_global_storage_v1';

// Initializing Redis client
let redis: Redis | null = null;
if (REDIS_URL && REDIS_TOKEN) {
    try {
        redis = new Redis({
            url: REDIS_URL,
            token: REDIS_TOKEN,
        });
        console.log("✅ [DB] Redis Client Initialized");
    } catch (e) {
        console.error("❌ [DB] Redis Init Error:", e);
    }
} else {
    console.warn("⚠️ [DB] Redis credentials missing. Using local fallback.");
    if (isVercel) {
        console.error("🚨 CRITICAL: Running on Vercel without Redis. Data will NOT persist across sessions!");
    }
}

export async function getDB() {
    // 1. Try to fetch from Redis if configured
    if (redis) {
        try {
            const data = await redis.get(DB_KEY);
            if (data) {
                const parsed = typeof data === 'string' ? JSON.parse(data) : data;
                if (parsed && Array.isArray(parsed.teams) && parsed.teams.length > 0) {
                    return parsed;
                }
            }

            // If we are here, Redis is empty. Check if we should migrate from local.
            const localData = await readLocalDB();
            if (localData && Array.isArray(localData.teams) && localData.teams.length > 0) {
                console.log(`[DB] Migrating ${localData.teams.length} teams from local to Redis...`);
                await writeDB(localData);
                return localData;
            }
        } catch (e) {
            console.error("[DB] Redis Read/Migrate Error:", e);
        }
    }

    // 2. Local Fallback (Dev mode or missing Redis)
    return readLocalDB();
}

export async function writeDB(db: any) {
    const payload = db || { teams: [] };

    // 1. Sync to Cloud if possible
    if (redis) {
        try {
            // Use EXPIRE-less set for persistence
            await redis.set(DB_KEY, JSON.stringify(payload));
            console.log(`[DB] Global Sync Success | Teams: ${payload.teams?.length || 0}`);

            // On Vercel, we don't write to local filesystem
            if (isVercel) return;
        } catch (e) {
            console.error("[DB] Redis Write Error:", e);
        }
    }

    // 2. Local Sync (Development only)
    if (!isVercel) {
        try {
            await writeLocalDB(payload);
        } catch (e) {
            console.error("[DB] Local Write Error:", e);
        }
    }
}
