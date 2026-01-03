import { Redis } from '@upstash/redis'
import { readDB as readLocalDB, writeDB as writeLocalDB } from './db'

const getRedisConfig = () => {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    const isVercel = !!process.env.VERCEL;

    return {
        url,
        token,
        isConfigured: !!(url && token),
        isVercel
    };
};

export async function getDB() {
    const config = getRedisConfig();

    if (config.isConfigured) {
        try {
            const redis = new Redis({
                url: config.url!,
                token: config.token!,
            });
            const teams = await redis.get('teams');
            return { teams: teams || [] };
        } catch (e) {
            console.error("Redis fetch error:", e);
            if (config.isVercel) throw new Error("שגיאה בתקשורת עם מסד הנתונים בענן (Redis error).");
        }
    }

    if (config.isVercel) {
        // In production without Redis, we can only read what was bundled in db.json
        console.warn("Vercel detected but Redis is NOT configured. Falling back to static db.json (Read-Only)");
        return readLocalDB();
    }

    return readLocalDB();
}

export async function writeDB(db: any) {
    const config = getRedisConfig();

    if (config.isConfigured) {
        try {
            const redis = new Redis({
                url: config.url!,
                token: config.token!,
            });
            await redis.set('teams', db.teams);
            return;
        } catch (e) {
            console.error("Redis write error:", e);
            throw new Error("שגיאה בכתיבה ל-Redis. וודא שההגדרות ב-Upstash תקינות.");
        }
    }

    if (!config.isVercel) {
        await writeLocalDB(db);
    } else {
        const missing = [];
        if (!process.env.UPSTASH_REDIS_REST_URL) missing.push("URL");
        if (!process.env.UPSTASH_REDIS_REST_TOKEN) missing.push("TOKEN");

        throw new Error(`שגיאת הגדרה ב-Vercel: חסר מפתח ${missing.join(" ו-")}. אנא וודא שהגדרת אותם תחת Environment Variables וביצעת Redeploy.`);
    }
}
