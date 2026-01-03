import { Redis } from '@upstash/redis'
import { readDB as readLocalDB, writeDB as writeLocalDB } from './db'

const isRedisEnabled = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const isVercel = !!process.env.VERCEL;

const redis = isRedisEnabled ? new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
}) : null;

export async function getDB() {
    if (isRedisEnabled && redis) {
        try {
            const teams = await redis.get('teams');
            return { teams: teams || [] };
        } catch (e) {
            console.error("Redis error:", e);
            if (isVercel) return { teams: [] };
        }
    }

    // In Vercel, if Redis fails/missing, we return empty state instead of crashing with file system error
    if (isVercel) return { teams: [] };

    return readLocalDB();
}

export async function writeDB(db: any) {
    if (isRedisEnabled && redis) {
        try {
            await redis.set('teams', db.teams);
            return;
        } catch (e) {
            console.error("Redis write error:", e);
        }
    }

    // Crucial: Only write to local file if NOT on Vercel
    if (!isVercel) {
        await writeLocalDB(db);
    } else {
        console.warn("Skipping writeDB: No Redis configured and environment is Read-Only (Vercel)");
    }
}
