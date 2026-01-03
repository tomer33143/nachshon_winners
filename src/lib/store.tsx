"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

// --- Types ---
export type User = {
    id: string;
    name: string;
    avatar: string;
    role: "creator" | "coordinator" | "member";
    password?: string;
    pointsAnnual: number;
    pointsBiMonthly: number;
    strikes: number;
    maxStreak: number;
    lastStreakUpdate?: string;
    badges: string[];
    joinedAt?: string; // Timestamp when user joined the team
};

export type PollResponse = {
    userId: string;
    userName: string;
    response: "yes" | "no";
    timestamp: string;
};

export type Poll = {
    id: string;
    question: string;
    createdAt: string;
    active: boolean;
    responses: PollResponse[];
    creatorId: string;
};

export type FeedItem = {
    id: string;
    type: "points" | "streak" | "join" | "event" | "poll";
    message: string;
    timestamp: string;
    userId?: string;
    userName?: string;
};

export type CalendarEvent = {
    id: string;
    title: string;
    date: string; // YYYY-MM-DD
    isHoliday?: boolean;
};

export type Team = {
    id: string;
    name: string;
    code: string;
    members: User[];
    pendingMembers: User[]; // New: Users waiting for approval
    admins: string[]; // User IDs
    seasonStarted: boolean;
    polls: Poll[];
    feed: FeedItem[];
    events: CalendarEvent[];
};

type AppContextType = {
    user: User | null;
    team: Team | null;
    isLoading: boolean;
    login: (userName: string, password: string) => Promise<void>;
    startSeason: () => Promise<void>;
    createTeam: (teamName: string, userName: string, password: string) => Promise<void>;
    joinTeam: (teamCode: string, userName: string, password: string) => Promise<void>;
    logout: () => void;

    // New Actions
    manageRole: (targetUserId: string, newRole: "coordinator" | "member") => Promise<void>;
    updatePoints: (targetUserId: string, points: number, reason?: string, isPublic?: boolean) => Promise<void>;
    createPoll: (question: string) => Promise<void>;
    answerPoll: (pollId: string, answer: "yes" | "no") => Promise<void>;
    closePoll: (pollId: string) => Promise<void>;
    approveMember: (targetUserId: string) => Promise<void>;
    rejectMember: (targetUserId: string) => Promise<void>;
    addEvent: (date: string, title: string) => Promise<void>;
    deleteEvent: (eventId: string) => Promise<void>;
    removeMember: (targetUserId: string) => Promise<void>;
};

// --- Mock Data Helpers ---
const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();
const MOCK_DELAY = 800;

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [team, setTeam] = useState<Team | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize from Storage (Auto-login)
    useEffect(() => {
        // Use sessionStorage for user session (per tab) 
        // Use localStorage for team persistence (remember which team was used last)
        const storedUser = sessionStorage.getItem("nachshon_user");
        const storedTeamId = localStorage.getItem("nachshon_team_id");

        if (storedUser && storedTeamId) {
            setUser(JSON.parse(storedUser));
            fetch(`/api/team?teamId=${storedTeamId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.team) setTeam(data.team);
                })
                .catch(console.error)
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, []);

    const refreshTeam = async () => {
        if (!team?.id) return;
        try {
            const res = await fetch(`/api/team?teamId=${team.id}`);
            const data = await res.json();
            if (data.team) {
                setTeam(prev => JSON.stringify(prev) !== JSON.stringify(data.team) ? data.team : prev);
            }
        } catch (err) {
            console.error("Failed to refresh team data", err);
        }
    };

    // Poll for Team Updates (Real-time via Short Polling)
    useEffect(() => {
        if (!team?.id) return;

        const interval = setInterval(refreshTeam, 2000);

        return () => clearInterval(interval);
    }, [team?.id]);

    const saveLocalAuth = (u: User, t: Team) => {
        sessionStorage.setItem("nachshon_user", JSON.stringify(u));
        localStorage.setItem("nachshon_team_id", t.id);
    }

    const createTeam = async (teamName: string, userName: string, password: string) => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/team', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create', teamName, userName, password }),
            });
            const data = await res.json();

            if (data.error) {
                alert(data.error);
                return;
            }

            setUser(data.user);
            setTeam(data.team);
            saveLocalAuth(data.user, data.team);
        } catch (e) {
            console.error("Create team failed:", e);
            alert("שגיאה ביצירת הצוות. נסה שוב.");
        } finally {
            setIsLoading(false);
        }
    };

    const joinTeam = async (teamCode: string, userName: string, password: string) => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/team', {
                method: 'POST',
                body: JSON.stringify({ action: 'join', teamCode, userName, password }),
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.error || "Failed to join team");
                setIsLoading(false);
                return;
            }

            const data = await res.json();
            setUser(data.user);
            setTeam(data.team);
            saveLocalAuth(data.user, data.team);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (userName: string, password: string) => {
        setIsLoading(true);
        try {
            // Get team code from localStorage
            const storedTeamId = localStorage.getItem("nachshon_team_id");
            if (!storedTeamId) {
                alert("לא נמצא צוות שמור. אנא הצטרף לצוות תחילה.");
                setIsLoading(false);
                return;
            }

            // First get the team to find the code
            const teamRes = await fetch(`/api/team?teamId=${storedTeamId}`);
            const teamData = await teamRes.json();

            if (!teamData.team) {
                alert("הצוות לא נמצא");
                setIsLoading(false);
                return;
            }

            const teamCode = teamData.team.code;

            const res = await fetch('/api/team', {
                method: 'POST',
                body: JSON.stringify({ action: 'login', teamCode, userName, password }),
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.error || "Login failed");
                return;
            }

            const data = await res.json();
            setUser(data.user);
            setTeam(data.team);
            saveLocalAuth(data.user, data.team);
        } catch (e) {
            alert("Error during login");
        } finally {
            setIsLoading(false);
        }
    };

    const startSeason = async () => {
        if (!team) return;
        // Optimistic update
        setTeam(prev => prev ? ({ ...prev, seasonStarted: true }) : null);

        await fetch('/api/team', {
            method: 'POST',
            body: JSON.stringify({ action: 'start_season', teamId: team.id }),
        });
        refreshTeam();
    };

    const logout = () => {
        sessionStorage.removeItem("nachshon_user");
        // We keep nachshon_team_id in localStorage so they don't have to enter the code again
        setUser(null);
        setTeam(null);
    };

    const updatePoints = async (targetUserId: string, points: number, reason?: string, isPublic: boolean = true) => {
        if (!team) return;
        await fetch('/api/team', {
            method: 'POST',
            body: JSON.stringify({ action: 'update_points', teamId: team.id, targetUserId, points, reason, isPublic })
        });
        refreshTeam();
    };

    const manageRole = async (targetUserId: string, newRole: "coordinator" | "member") => {
        if (!team) return;
        await fetch('/api/team', {
            method: 'POST',
            body: JSON.stringify({ action: 'manage_role', teamId: team.id, targetUserId, newRole })
        });
        refreshTeam();
    };

    const createPoll = async (question: string) => {
        if (!team || !user) return;
        await fetch('/api/team', {
            method: 'POST',
            body: JSON.stringify({ action: 'create_poll', teamId: team.id, creatorId: user.id, question })
        });
        refreshTeam();
    };

    const answerPoll = async (pollId: string, answer: "yes" | "no") => {
        if (!team || !user) return;
        await fetch('/api/team', {
            method: 'POST',
            body: JSON.stringify({ action: 'answer_poll', teamId: team.id, pollId, userId: user.id, answer })
        });
        refreshTeam();
    };

    const closePoll = async (pollId: string) => {
        if (!team) return;
        await fetch('/api/team', {
            method: 'POST',
            body: JSON.stringify({ action: 'close_poll', teamId: team.id, pollId })
        });
        refreshTeam();
    };

    const approveMember = async (targetUserId: string) => {
        if (!team) return;
        await fetch('/api/team', {
            method: 'POST',
            body: JSON.stringify({ action: 'approve_member', teamId: team.id, targetUserId })
        });
        refreshTeam();
    };

    const rejectMember = async (targetUserId: string) => {
        if (!team) return;
        await fetch('/api/team', {
            method: 'POST',
            body: JSON.stringify({ action: 'reject_member', teamId: team.id, targetUserId })
        });
        refreshTeam();
    };

    const addEvent = async (date: string, title: string) => {
        if (!team) return;
        await fetch('/api/team', {
            method: 'POST',
            body: JSON.stringify({ action: 'add_event', teamId: team.id, date, title })
        });
        refreshTeam();
    };

    const deleteEvent = async (eventId: string) => {
        if (!team) return;
        await fetch('/api/team', {
            method: 'POST',
            body: JSON.stringify({ action: 'delete_event', teamId: team.id, eventId })
        });
        refreshTeam();
    };

    const removeMember = async (targetUserId: string) => {
        if (!team) return;
        await fetch('/api/team', {
            method: 'POST',
            body: JSON.stringify({ action: 'remove_member', teamId: team.id, targetUserId })
        });
        refreshTeam();
    };

    return (
        <AppContext.Provider value={{
            user, team, isLoading,
            login, startSeason, createTeam, joinTeam, logout,
            manageRole, updatePoints, createPoll, answerPoll, closePoll,
            approveMember, rejectMember, addEvent, deleteEvent, removeMember
        }}>
            {children}
        </AppContext.Provider>
    );
}

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useApp must be used within AppProvider");
    return context;
};
