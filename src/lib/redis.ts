import { Redis } from '@upstash/redis'
import { readDB as readLocalDB, writeDB as writeLocalDB } from './db'

const isRedisEnabled = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

const redis = isRedisEnabled ? new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
}) : null;

export async function getDB() {
    if (redis) {
        const teams = await redis.get('teams');
        return { teams: teams || [] };
    }
    return readLocalDB();
}

export async function writeDB(db: any) {
    if (redis) {
        await redis.set('teams', db.teams);
    } else {
        await writeLocalDB(db);
    }
}
