"use client";

import { useApp } from "@/lib/store";
import { motion } from "framer-motion";
import { Crown, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Leaderboard() {
    const { team, user } = useApp();

    if (!team) return null;

    // Sort members by points (descending)
    // Only show regular members, exclude coordinators/creators
    const sortedMembers = team.members
        .filter(m => m.role === "member")
        .sort((a, b) => b.pointsAnnual - a.pointsAnnual);

    return (
        <div className="w-full space-y-4 pb-24">
            <div className="px-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-700">טבלת מובילים</h2>
                <span className="text-xs font-bold bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg uppercase tracking-wider">עונה שנתית</span>
            </div>

            <div className="space-y-2 px-4">
                {sortedMembers.map((member, index) => {
                    const rank = index + 1;
                    const isCurrentUser = member.id === user?.id;

                    return (
                        <motion.div
                            key={member.id}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                                "flex items-center p-3 rounded-2xl border-2 transition-all",
                                isCurrentUser ? "bg-[var(--color-primary)] text-white border-[var(--color-primary-dark)]" : "bg-white border-[var(--color-border)]"
                            )}
                        >
                            <div className={cn(
                                "w-8 font-black text-lg text-center ml-2",
                                rank === 1 ? "text-[var(--color-yellow)]" : (isCurrentUser ? "text-white/80" : "text-gray-400")
                            )}>
                                {rank === 1 ? <Crown className="inline w-6 h-6 fill-current" /> : rank}
                            </div>

                            <div className="w-10 h-10 rounded-full border-2 border-white/20 bg-black/10 flex items-center justify-center font-bold ml-3">
                                {member.name.charAt(0)}
                            </div>

                            <div className="flex-1 text-right">
                                <p className={cn("font-bold", isCurrentUser ? "text-white" : "text-gray-800")}>
                                    {member.name} {isCurrentUser && "(אני)"}
                                </p>
                                <p className={cn("text-xs font-bold", isCurrentUser ? "text-blue-100" : "text-gray-400")}>
                                    {member.strikes} הגעות ברצף 🔥
                                </p>
                            </div>

                            <div className="text-left">
                                <span className={cn("text-lg font-black", isCurrentUser ? "text-white" : "text-[var(--color-primary)]")}>
                                    {member.pointsAnnual} XP
                                </span>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    );
}
