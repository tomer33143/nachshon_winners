import { Redis } from '@upstash/redis'
import { readDB as readLocalDB, writeDB as writeLocalDB } from './db'

// Initialize Redis only if keys are present
const isVercel = !!process.env.VERCEL;

// Function to get a fresh client to ensure it uses the latest process.env in serverless
const getRedisClient = () => {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        return null;
    }
    return new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
};

export async function getDB() {
    const redis = getRedisClient();

    // 1. If Redis is available, it is the SOURCE OF TRUTH
    if (redis) {
        try {
            const teams = await redis.get('teams');
            if (teams) {
                return { teams: Array.isArray(teams) ? teams : [] };
            }
        } catch (e) {
            console.error("Redis Read Error:", e);
        }
    }

    // 2. Local Fallback (for development or if Redis is down/missing)
    // IMPORTANT: On Vercel, this is read-only.
    const local = await readLocalDB();
    return local;
}

export async function writeDB(db: any) {
    const redis = getRedisClient();

    // 1. Always attempt to write to Redis if configured
    if (redis) {
        try {
            // Ensure we are saving exactly the teams array
            const teamsArray = db.teams || [];
            await redis.set('teams', teamsArray);
            console.log(`[DB] Successfully saved ${teamsArray.length} teams to Redis`);
        } catch (e) {
            console.error("[DB] Redis Write Error:", e);
            // On Vercel, if Redis fails, we are in trouble as we can't write to disk
        }
    }

    // 2. Also write to local file for local development persistence
    if (!isVercel) {
        try {
            await writeLocalDB(db);
        } catch (e) {
            console.error("[DB] Local Write Error:", e);
        }
    }
}
