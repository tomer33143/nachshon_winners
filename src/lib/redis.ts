import { Redis } from '@upstash/redis'
import { readDB as readLocalDB, writeDB as writeLocalDB } from './db'

// Initialize Redis only if keys are present
const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : null;

const isVercel = !!process.env.VERCEL;

export async function getDB() {
    // 1. Try Redis first if available
    if (redis) {
        try {
            const teams = await redis.get('teams');
            if (teams) return { teams };
        } catch (e) {
            console.error("Redis Read Error:", e);
        }
    }

    // 2. Fallback to local DB (works locally, or reads bundled data in production)
    return readLocalDB();
}

export async function writeDB(db: any) {
    // 1. Try writing to Redis if available
    if (redis) {
        try {
            await redis.set('teams', db.teams);
            return;
        } catch (e) {
            console.error("Redis Write Error:", e);
        }
    }

    // 2. Fallback to local file ONLY if not on Vercel
    if (!isVercel) {
        try {
            await writeLocalDB(db);
        } catch (e) {
            console.error("Local DB Write Error:", e);
        }
    }
}
