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
            console.error("Redis fetch error:", e);
            if (isVercel) throw new Error("שגיאה בתקשורת עם מסד הנתונים בענן.");
        }
    }

    if (isVercel && !isRedisEnabled) {
        // We can still try to read from the static db.json if it exists, 
        // but no new teams can be saved without Redis.
        return readLocalDB();
    }

    return readLocalDB();
}

export async function writeDB(db: any) {
    if (isRedisEnabled && redis) {
        try {
            await redis.set('teams', db.teams);
            return;
        } catch (e) {
            console.error("Redis write error:", e);
            throw new Error("שגיאה בכתיבה למסד הנתונים בענן. וודא שההגדרות ב-Vercel תקינות.");
        }
    }

    // Crucial: Only write to local file if NOT on Vercel
    if (!isVercel) {
        await writeLocalDB(db);
    } else {
        throw new Error("לא הוגדר מסד נתונים (Redis) ב-Vercel. לא ניתן לשמור נתונים.");
    }
}
