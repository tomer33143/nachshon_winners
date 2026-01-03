"use client";

import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, UserPlus, UserMinus, Calendar, MessageSquare, Zap } from "lucide-react";

export default function Feed() {
    const { team } = useApp();

    if (!team) return null;

    const feedItems = team.feed || [];

    const getIcon = (type: string) => {
        switch (type) {
            case "points_up": return <TrendingUp className="w-5 h-5 text-green-500" />;
            case "points_down": return <TrendingDown className="w-5 h-5 text-red-500" />;
            case "streak": return <Zap className="w-5 h-5 text-yellow-500" />;
            case "join": return <UserPlus className="w-5 h-5 text-blue-500" />;
            case "leave": return <UserMinus className="w-5 h-5 text-orange-500" />;
            case "event": return <Calendar className="w-5 h-5 text-purple-500" />;
            case "poll": return <MessageSquare className="w-5 h-5 text-indigo-500" />;
            default: return <TrendingUp className="w-5 h-5 text-gray-500" />;
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return "עכשיו";
        if (minutes < 60) return `לפני ${minutes} דקות`;
        if (hours < 24) return `לפני ${hours} שעות`;
        return `לפני ${days} ימים`;
    };

    return (
        <div className="space-y-4 pb-24 px-4">
            <h2 className="text-2xl font-black text-[var(--color-primary)]">פיד פעילות</h2>

            {feedItems.length === 0 ? (
                <Card className="p-6 text-center text-gray-400">
                    <p>אין פעילות עדיין...</p>
                    <p className="text-sm mt-2">הפעילות תופיע כאן ברגע שמשהו יקרה! 🎯</p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {feedItems.map((item) => (
                        <Card key={item.id} className="p-4 border-r-4 border-r-blue-400">
                            <div className="flex items-start gap-3">
                                <div className="mt-1">{getIcon(item.type)}</div>
                                <div className="flex-1">
                                    <p className="font-bold text-gray-800">{item.message}</p>
                                    <p className="text-xs text-gray-400 mt-1">{formatTime(item.timestamp)}</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
