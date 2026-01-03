import { NextResponse } from 'next/server';
import { getDB, writeDB } from '@/lib/redis';
import { Team, User, Poll } from '@/lib/store'; // We will use shared types

export const dynamic = 'force-dynamic';

// --- Helpers ---
const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export async function POST(req: Request) {
    const isVercel = process.env.VERCEL === '1' || !!process.env.NEXT_PUBLIC_VERCEL_URL;

    try {
        const payload = await req.json();
        const db = await getDB();
        const action = payload.action;

        const usingRedis = !!(process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL);
        console.log(`[API] Action: ${action} | Env: ${isVercel ? 'Vercel' : 'Local'} | Redis: ${usingRedis ? 'Active' : 'Missing'}`);

        // Action: LOGON (Login)
        if (action === 'login') {
            const { teamCode, userName, password } = payload;

            // Find team by Code (User enters code to find team)
            const team = db.teams?.find((t: Team) => t.code.toUpperCase() === teamCode.toUpperCase());
            if (!team) return NextResponse.json({ error: 'צוות לא נמצא. וודא שהקוד תקין.' }, { status: 404 });

            // Find user in team
            // Case insensitive name check? Let's keep strict for now or normalize
            let user: User | undefined = team.members.find((m: User) => m.name === userName);

            // If not in members, check pending
            if (!user) {
                const pendingUser = team.pendingMembers?.find((m: User) => m.name === userName);
                if (pendingUser) {
                    user = pendingUser; // Login allowed, but UI will block access to dashboard
                }
            }

            if (!user) return NextResponse.json({ error: 'משתמש לא נמצא בצוות זה' }, { status: 404 });

            // Simple password check (In production we'd hash this)
            if (user.password !== password) {
                return NextResponse.json({ error: 'סיסמה שגויה' }, { status: 401 });
            }

            return NextResponse.json({ user, team });
        }

        // Action: CREATE
        if (action === 'create') {
            const { teamName, userName, avatar, password } = payload;

            const newUserId = crypto.randomUUID();
            const newUser: User = {
                id: newUserId,
                name: userName,
                avatar: avatar || "1",
                role: "creator",
                password: password,
                pointsAnnual: 0,
                pointsBiMonthly: 0,
                strikes: 1,
                maxStreak: 1,
                badges: [],
                joinedAt: new Date().toISOString()
            };

            const newTeam: Team = {
                id: crypto.randomUUID(),
                name: teamName,
                code: generateCode(),
                members: [newUser],
                pendingMembers: [], // Initialize empty
                seasonStarted: true, // AUTO START SEASON
                admins: [newUserId], // Keep for backward compat if needed, but role is primary
                polls: [],
                feed: [],
                events: []
            };

            if (!db.teams) db.teams = [];
            db.teams.push(newTeam);
            await writeDB(db);

            return NextResponse.json({ user: newUser, team: newTeam });
        }

        // Action: JOIN
        if (action === 'join') {
            const { teamCode, userName, avatar, password } = payload;
            if (!db.teams) db.teams = [];

            const teamIndex = db.teams.findIndex((t: Team) => t.code.toUpperCase() === teamCode.toUpperCase());
            if (teamIndex === -1) {
                return NextResponse.json({ error: 'קוד צוות לא תקין או שהצוות לא קיים' }, { status: 404 });
            }

            // Check if name taken
            if (db.teams[teamIndex].members.some((m: User) => m.name === userName)) {
                return NextResponse.json({ error: 'Name already taken in this team' }, { status: 409 });
            }

            const newUserId = crypto.randomUUID();
            const newUser: User = {
                id: newUserId,
                name: userName,
                avatar: avatar || String(Math.floor(Math.random() * 5) + 1),
                role: "member",
                password: password,
                pointsAnnual: 0,
                pointsBiMonthly: 0,
                strikes: 1,
                maxStreak: 1,
                badges: [],
                joinedAt: new Date().toISOString()
            };

            // Add to PENDING, not members
            if (!db.teams[teamIndex].pendingMembers) db.teams[teamIndex].pendingMembers = [];
            db.teams[teamIndex].pendingMembers.push(newUser);

            await writeDB(db);

            return NextResponse.json({ user: newUser, team: db.teams[teamIndex] });
        }

        // Action: APPROVE MEMBER
        if (action === 'approve_member') {
            const { teamId, targetUserId } = payload;
            const teamIndex = db.teams.findIndex((t: Team) => t.id === teamId);
            if (teamIndex === -1) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

            const team = db.teams[teamIndex];
            // Ensure pendingMembers exists
            if (!team.pendingMembers) team.pendingMembers = [];

            const pendingIndex = team.pendingMembers.findIndex((m: User) => m.id === targetUserId);

            if (pendingIndex === -1) {
                return NextResponse.json({ error: 'Pending user not found' }, { status: 404 });
            }

            const memberToApprove = team.pendingMembers[pendingIndex];

            // Move from pending to members
            team.pendingMembers.splice(pendingIndex, 1);
            team.members.push(memberToApprove);

            // Add to feed
            if (!team.feed) team.feed = [];
            team.feed.unshift({
                id: crypto.randomUUID(),
                type: "join",
                message: `${memberToApprove.name} הצטרף/ה לצוות! 🎉`,
                timestamp: new Date().toISOString(),
                userId: memberToApprove.id,
                userName: memberToApprove.name
            });

            await writeDB(db);
            return NextResponse.json({ success: true, team });
        }

        // Action: REJECT MEMBER
        if (action === 'reject_member') {
            const { teamId, targetUserId } = payload;
            const teamIndex = db.teams.findIndex((t: Team) => t.id === teamId);
            if (teamIndex === -1) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

            const team = db.teams[teamIndex];
            if (!team.pendingMembers) team.pendingMembers = [];

            const pendingIndex = team.pendingMembers.findIndex((m: User) => m.id === targetUserId);

            if (pendingIndex !== -1) {
                team.pendingMembers.splice(pendingIndex, 1);
                await writeDB(db);
            }

            return NextResponse.json({ success: true, team });
        }

        // Action: START_SEASON
        if (action === 'start_season') {
            const { teamId } = payload;
            const teamIndex = db.teams.findIndex((t: Team) => t.id === teamId);
            if (teamIndex === -1) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

            db.teams[teamIndex].seasonStarted = true;
            await writeDB(db);

            return NextResponse.json({ team: db.teams[teamIndex] });
        }

        // --- COORDINATOR ACTIONS ---

        if (action === "manage_role") {
            const { teamId, targetUserId, newRole } = payload;
            const team = db.teams.find((t: any) => t.id === teamId);
            if (!team) return NextResponse.json({ error: "Team not found" });

            const targetMember = team.members.find((m: any) => m.id === targetUserId);
            if (targetMember) {
                targetMember.role = newRole; // "coordinator" or "member"
                await writeDB(db);
            }
            return NextResponse.json({ team });
        }

        if (action === "update_points") {
            const { teamId, targetUserId, points, reason } = payload;
            const team = db.teams.find((t: any) => t.id === teamId);
            if (!team) return NextResponse.json({ error: "Team not found" });

            const targetMember = team.members.find((m: any) => m.id === targetUserId);
            if (targetMember) {
                // Get leader before change
                const leaderboardBefore = team.members
                    .filter((m: any) => m.role === "member")
                    .sort((a: any, b: any) => b.pointsAnnual - a.pointsAnnual);
                const leaderIdBefore = leaderboardBefore[0]?.id;

                // Apply streak multiplier
                const multiplier = 1 + (targetMember.strikes - 1) * 0.1;
                const actualPoints = Math.round(points * multiplier);

                targetMember.pointsAnnual += actualPoints;
                // Prevent negative
                if (targetMember.pointsAnnual < 0) targetMember.pointsAnnual = 0;

                // Add to feed
                if (payload.isPublic !== false) {
                    if (!team.feed) team.feed = [];
                    const actionText = points > 0 ? "קיבל/ה" : "איבד/ה";
                    const emoji = points > 0 ? "🌟" : "📉";
                    const reasonText = reason ? ` על: ${reason}` : "";

                    team.feed.unshift({
                        id: crypto.randomUUID(),
                        type: points > 0 ? "points_up" : "points_down",
                        message: `${targetMember.name} ${actionText} ${Math.abs(actualPoints)} נקודות${reasonText}! ${emoji}`,
                        timestamp: new Date().toISOString(),
                        userId: targetMember.id,
                        userName: targetMember.name
                    });

                    // Check Leaderboard Change
                    const leaderboardAfter = team.members
                        .filter((m: any) => m.role === "member")
                        .sort((a: any, b: any) => b.pointsAnnual - a.pointsAnnual);
                    const leaderAfter = leaderboardAfter[0];

                    if (leaderAfter && leaderAfter.id !== leaderIdBefore) {
                        team.feed.unshift({
                            id: crypto.randomUUID(),
                            type: "streak",
                            message: `מהפך בצמרת! ${leaderAfter.name} עלה/תה למקום הראשון! 🏆`,
                            timestamp: new Date().toISOString()
                        });
                    }
                }

                await writeDB(db);
            }
            return NextResponse.json({ team });
        }

        // --- POLL ACTIONS ---

        if (action === "create_poll") {
            const { teamId, question, creatorId } = payload;
            const team = db.teams.find((t: any) => t.id === teamId);
            if (!team) return NextResponse.json({ error: "Team not found" });

            const newPoll: Poll = {
                id: crypto.randomUUID(),
                question: question,
                createdAt: new Date().toISOString(),
                active: true,
                responses: [],
                creatorId: creatorId
            };

            if (!team.polls) team.polls = [];
            team.polls.push(newPoll);
            await writeDB(db);
            return NextResponse.json({ team });
        }

        if (action === "answer_poll") {
            const { teamId, pollId, userId, answer } = payload;
            const team = db.teams.find((t: any) => t.id === teamId);
            if (!team) return NextResponse.json({ error: "Team not found" });

            const poll = team.polls?.find((p: any) => p.id === pollId);
            const user = team.members.find((m: any) => m.id === userId);

            if (poll && user && poll.active) {
                // Check if already answered
                if (poll.responses.some((r: any) => r.userId === userId)) {
                    return NextResponse.json({ team });
                }

                // 1. Record Response
                poll.responses.push({
                    userId: user.id,
                    userName: user.name,
                    response: answer, // "yes" or "no"
                    timestamp: new Date().toISOString()
                });

                // 2. Logic
                if (answer === "yes") {
                    // Multiplier formula: 1 + (strikes-1)*0.1
                    const multiplier = 1 + (user.strikes - 1) * 0.1;
                    const basePoints = 10;
                    const pointsAwarded = Math.round(basePoints * multiplier);
                    user.pointsAnnual += pointsAwarded;

                    // Increment whole number streak
                    user.strikes = (user.strikes || 0) + 1;

                    // Track max streak
                    if (!user.maxStreak || user.strikes > user.maxStreak) {
                        user.maxStreak = user.strikes;
                    }

                    // Streak Notification Logic
                    if (user.strikes >= 3) {
                        const otherHighStreaks = team.members.filter((m: any) => m.id !== user.id && m.strikes >= user.strikes);
                        if (otherHighStreaks.length <= 1) { // 0 or 1 people have a higher or equal streak
                            if (!team.feed) team.feed = [];
                            const competitorsText = otherHighStreaks.length === 1
                                ? `צמוד ל-${otherHighStreaks[0].name}!`
                                : "מוביל/ה את הצוות!";

                            team.feed.unshift({
                                id: crypto.randomUUID(),
                                type: "streak",
                                message: `סטטיסטיקה מטורפת! ${user.name} בסטריק של ${user.strikes} הגעות רצופות! ${competitorsText} 🔥`,
                                timestamp: new Date().toISOString()
                            });
                        }
                    }
                } else {
                    // Reset streak on 'No'
                    user.strikes = 1;
                }

                await writeDB(db);
            }
            return NextResponse.json({ team });
        }

        if (action === "close_poll") {
            const { teamId, pollId } = payload;
            const team = db.teams.find((t: any) => t.id === teamId);
            if (!team) return NextResponse.json({ error: "Team not found" });

            const poll = team.polls?.find((p: any) => p.id === pollId);
            if (poll) {
                poll.active = false;
                // Apply penalties to non-responders
                const responders = poll.responses.map((r: any) => r.userId);
                team.members.forEach((m: any) => {
                    if (!responders.includes(m.id) && m.role === "member") {
                        m.strikes = 1; // Reset streak if ignored
                    }
                });
                await writeDB(db);
            }
            return NextResponse.json({ team });
        }

        // --- CALENDAR ACTIONS ---

        if (action === "add_event") {
            const { teamId, date, title } = payload;
            const team = db.teams.find((t: any) => t.id === teamId);
            if (!team) return NextResponse.json({ error: "Team not found" });

            if (!team.events) team.events = [];

            const newEvent = {
                id: crypto.randomUUID(),
                title,
                date,
                isHoliday: false
            };

            team.events.push(newEvent);

            // Add to feed
            if (!team.feed) team.feed = [];
            team.feed.unshift({
                id: crypto.randomUUID(),
                type: "event",
                message: `נקבע אירוע חדש: ${title} בתאריך ${date} 📅`,
                timestamp: new Date().toISOString()
            });

            await writeDB(db);
            return NextResponse.json({ team });
        }

        if (action === "delete_event") {
            const { teamId, eventId } = payload;
            const team = db.teams.find((t: any) => t.id === teamId);
            if (!team) return NextResponse.json({ error: "Team not found" });

            if (team.events) {
                team.events = team.events.filter((e: any) => e.id !== eventId);
                await writeDB(db);
            }
            return NextResponse.json({ team });
        }

        // --- MEMBER MANAGEMENT ---

        if (action === "remove_member") {
            const { teamId, targetUserId } = payload;
            const team = db.teams.find((t: any) => t.id === teamId);
            if (!team) return NextResponse.json({ error: "Team not found" });

            const memberIndex = team.members.findIndex((m: any) => m.id === targetUserId);
            if (memberIndex !== -1) {
                const removedMember = team.members[memberIndex];
                team.members.splice(memberIndex, 1);

                // Add to feed
                if (!team.feed) team.feed = [];
                team.feed.unshift({
                    id: crypto.randomUUID(),
                    type: "leave",
                    message: `${removedMember.name} הוסר/ה מהצוות 👋`,
                    timestamp: new Date().toISOString()
                });

                await writeDB(db);
            }
            return NextResponse.json({ team });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error(`[API Error]`, error);
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}
export async function GET(req: Request) {
    // Polling endpoint to get latest team state
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) return NextResponse.json({ error: 'Missing teamId' }, { status: 400 });

    const db = await getDB();
    const team = db.teams?.find((t: Team) => t.id === teamId);

    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    return NextResponse.json({ team });
}
