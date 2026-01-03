import { Redis } from '@upstash/redis'
import { readDB as readLocalDB, writeDB as writeLocalDB } from './db'

/**
 * Robust Database Layer for Global Synchronization.
 * Prioritizes Redis in production (Vercel) and local file storage otherwise.
 */

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const isVercel = !!process.env.VERCEL;

// Global storage key
const DB_KEY = 'nachshon_global_storage_v1';

// Initializing Redis client
const redis = (REDIS_URL && REDIS_TOKEN) ? new Redis({
    url: REDIS_URL!,
    token: REDIS_TOKEN!,
}) : null;

export async function getDB() {
    // 1. Try to fetch from Redis if configured
    if (redis) {
        try {
            const data = await redis.get(DB_KEY);
            if (data) {
                // Return parsed object. Upstash may return object or string.
                const parsed = typeof data === 'string' ? JSON.parse(data) : data;
                if (parsed && Array.isArray(parsed.teams)) return parsed;
            }
        } catch (e) {
            console.error("[DB] Redis Read Error:", e);
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
            await redis.set(DB_KEY, JSON.stringify(payload));
            console.log(`[DB] Global Sync Success | Teams: ${payload.teams?.length || 0}`);
            // In Vercel, we only rely on Redis
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
