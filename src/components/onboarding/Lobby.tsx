"use client";

import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, Loader2 } from "lucide-react";

export default function Lobby() {
    const { team, user, logout } = useApp();

    if (!team || !user) return null;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-page)] p-6 space-y-8 text-center">
            <div className="w-32 h-32 bg-yellow-100 rounded-full flex items-center justify-center animate-pulse">
                <Clock className="w-16 h-16 text-yellow-600" />
            </div>

            <div className="space-y-2">
                <h1 className="text-3xl font-black text-indigo-600">ממתין לאישור</h1>
                <p className="text-xl text-gray-500 font-bold">
                    שלום {user.name}, הבקשה שלך להצטרף לצוות <span className="text-[var(--color-primary)]">{team.name}</span> נשלחה.
                </p>
                <p className="text-gray-400">
                    אחד הרכזים צריך לאשר אותך כדי שתוכל להתחיל.
                </p>
            </div>

            <Card className="p-4 bg-white border-2 border-gray-100 w-full max-w-sm">
                <div className="flex items-center justify-between">
                    <span className="text-gray-500 font-bold">סטטוס:</span>
                    <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold flex items-center">
                        <Loader2 className="w-3 h-3 ml-1 animate-spin" />
                        ממתין
                    </span>
                </div>
            </Card>

            <Button
                variant="ghost"
                onClick={logout}
                className="text-gray-400 hover:text-red-500"
            >
                יציאה / ביטול
            </Button>
        </div>
    );
}

