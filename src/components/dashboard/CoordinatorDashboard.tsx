"use client";

import { useApp } from "@/lib/store";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Minus, CheckCircle, XCircle, Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CoordinatorDashboard() {
    const { team, updatePoints, createPoll, closePoll } = useApp();
    const [pollQuestion, setPollQuestion] = useState("");
    const [isPollSubmitting, setIsPollSubmitting] = useState(false);

    // Member Points State
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [pointsType, setPointsType] = useState<"plus" | "minus" | null>(null);
    const [pointsAmount, setPointsAmount] = useState<string>("5");
    const [pointsReason, setPointsReason] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    if (!team) return null;

    const activePolls = team.polls?.filter(p => p.active) || [];
    const members = team.members.filter(m => m.role === "member");

    const handleCreatePoll = async () => {
        if (!pollQuestion) return;
        setIsPollSubmitting(true);
        await createPoll(pollQuestion);
        setPollQuestion("");
        setIsPollSubmitting(false);
    };

    const handleUpdatePoints = async () => {
        if (!selectedMemberId || !pointsType) return;
        setIsProcessing(true);
        const amount = parseInt(pointsAmount) * (pointsType === "plus" ? 1 : -1);
        await updatePoints(selectedMemberId, amount, pointsReason, isPublic);

        // Reset
        setSelectedMemberId(null);
        setPointsType(null);
        setPointsAmount("5");
        setPointsReason("");
        setIsPublic(true);
        setIsProcessing(false);
    };

    return (
        <div className="w-full space-y-8 pb-24 px-4 overflow-x-hidden">

            {/* Poll Section */}
            <section className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 text-right">משאל נוכחות (הגעתי!)</h2>

                <Card className="p-4 space-y-4 border-2 border-indigo-100">
                    <Input
                        placeholder="מה השאלה? (לדוגמה: הגעתם לפעולה?)"
                        value={pollQuestion}
                        onChange={(e) => setPollQuestion(e.target.value)}
                        className="text-right"
                    />
                    <Button
                        fullWidth
                        variant="primary"
                        onClick={handleCreatePoll}
                        disabled={!pollQuestion || isPollSubmitting}
                    >
                        {isPollSubmitting ? <Loader2 className="animate-spin" /> : "שלח משאל לכולם"}
                        <Send className="ml-2 w-4 h-4" />
                    </Button>
                </Card>

                {/* Active Polls List */}
                <div className="space-y-3">
                    {activePolls.map(poll => {
                        const yesCount = poll.responses.filter(r => r.response === "yes").length;
                        const noCount = poll.responses.filter(r => r.response === "no").length;

                        return (
                            <Card key={poll.id} className="p-4 bg-orange-50 border-orange-200">
                                <div className="flex justify-between items-start mb-4">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:bg-red-100 h-8 px-2"
                                        onClick={() => closePoll(poll.id)}
                                    >
                                        סגור משאל
                                    </Button>
                                    <h3 className="font-bold text-gray-800 text-right">{poll.question}</h3>
                                </div>

                                {/* Stats */}
                                <div className="flex justify-around text-center">
                                    <div>
                                        <div className="text-2xl font-black text-green-500">{yesCount}</div>
                                        <div className="text-xs text-gray-500">כן</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-black text-red-500">{noCount}</div>
                                        <div className="text-xs text-gray-500">לא</div>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            </section>

            {/* Member Management */}
            <section className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 text-right">ניהול נקודות</h2>
                <div className="grid grid-cols-1 gap-3">
                    {members.map(member => (
                        <div key={member.id} className="bg-white p-3 rounded-2xl border border-gray-100 flex flex-col shadow-sm">
                            <div className="flex items-center justify-between">
                                {/* Actions */}
                                <div className="flex items-center space-x-2 space-x-reverse">
                                    <Button
                                        size="sm"
                                        className="w-10 h-10 rounded-full p-0 bg-red-100 text-red-600 hover:bg-red-200"
                                        onClick={() => {
                                            setSelectedMemberId(member.id);
                                            setPointsType("minus");
                                        }}
                                    >
                                        <Minus className="w-5 h-5" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="w-10 h-10 rounded-full p-0 bg-green-100 text-green-600 hover:bg-green-200"
                                        onClick={() => {
                                            setSelectedMemberId(member.id);
                                            setPointsType("plus");
                                        }}
                                    >
                                        <Plus className="w-5 h-5" />
                                    </Button>
                                </div>

                                {/* Info */}
                                <div className="flex items-center text-right">
                                    <div className="mr-3">
                                        <div className="font-bold text-gray-800">{member.name}</div>
                                        <div className="text-xs text-gray-500">{member.pointsAnnual} נקודות</div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 ml-2">
                                        {member.name.charAt(0)}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Points Form */}
                            <AnimatePresence>
                                {selectedMemberId === member.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden mt-4 pt-4 border-t border-gray-100"
                                    >
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        value={pointsAmount}
                                                        onChange={(e) => setPointsAmount(e.target.value)}
                                                        className="w-20 text-center font-bold"
                                                        placeholder="כמות"
                                                    />
                                                    <span className="font-bold text-gray-600">נקודות</span>
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${pointsType === "plus" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                                        {pointsType === "plus" ? "הוספה" : "הורדה"}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => setIsPublic(!isPublic)}
                                                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors flex items-center gap-1 ${isPublic ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}
                                                >
                                                    {isPublic ? "ציבורי (בפיד)" : "פרטי (ללא פיד)"}
                                                    <div className={`w-2 h-2 rounded-full ${isPublic ? "bg-blue-500" : "bg-gray-400"}`}></div>
                                                </button>
                                            </div>
                                            <Input
                                                placeholder="סיבה (לדוגמה: עזרה בניקיון)"
                                                value={pointsReason}
                                                onChange={(e) => setPointsReason(e.target.value)}
                                                className="text-right"
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    fullWidth
                                                    variant={pointsType === "plus" ? "success" : "danger"}
                                                    onClick={handleUpdatePoints}
                                                    disabled={isProcessing}
                                                >
                                                    {isProcessing ? <Loader2 className="animate-spin" /> : "אישור"}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setSelectedMemberId(null);
                                                        setPointsType(null);
                                                    }}
                                                >
                                                    ביטול
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
