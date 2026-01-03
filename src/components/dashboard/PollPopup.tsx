"use client";

import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function PollPopup() {
    const { team, user, answerPoll } = useApp();
    const [selectedAnswer, setSelectedAnswer] = useState<"yes" | "no" | null>(null);

    if (!team || !user) return null;

    // Don't show polls to coordinators or creators
    if (user.role === "coordinator" || user.role === "creator") return null;

    // Find the first active poll that the user hasn't answered yet
    // AND was created after the user joined (to avoid showing old polls to new members)
    const userJoinTime = user.joinedAt ? new Date(user.joinedAt).getTime() : 0;
    const activePoll = team.polls?.find(p => {
        const pollCreatedTime = new Date(p.createdAt).getTime();
        return p.active &&
            !p.responses.some(r => r.userId === user.id) &&
            pollCreatedTime >= userJoinTime;
    });

    if (!activePoll) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border-4 border-indigo-600 text-center relative overflow-hidden"
                >
                    {/* Decoration */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>

                    <h2 className="text-2xl font-black text-gray-800 mb-2">שאלה מהרכז!</h2>
                    <p className="text-lg font-medium text-gray-600 mb-8 px-4">
                        {activePoll.question}
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            onClick={() => answerPoll(activePoll.id, "no")}
                            className="h-32 rounded-3xl bg-red-100 hover:bg-red-200 text-red-600 border-b-4 border-red-300 active:border-b-0 active:translate-y-1 transition-all flex flex-col items-center justify-center"
                        >
                            <X className="w-12 h-12 mb-2" />
                            <span className="font-bold text-xl">לא</span>
                        </Button>

                        <Button
                            onClick={() => answerPoll(activePoll.id, "yes")}
                            className="h-32 rounded-3xl bg-green-100 hover:bg-green-200 text-green-600 border-b-4 border-green-300 active:border-b-0 active:translate-y-1 transition-all flex flex-col items-center justify-center"
                        >
                            <Check className="w-12 h-12 mb-2" />
                            <span className="font-bold text-xl">כן</span>
                        </Button>
                    </div>

                    <p className="mt-6 text-xs text-gray-400">
                        תשובה כנה עוזרת לכולם :)
                    </p>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
